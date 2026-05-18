import type { AdamsAutoResult } from '../types';

/** Stub for MediaPipe Results type — standalone chatbot doesn't use real MediaPipe */
interface Results {
  poseLandmarks?: Array<Array<{ x: number; y: number; z?: number }>>;
}

// ── 关键 landmark 索引 ──
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

// ── 分析所需的帧数 ──
const MIN_VALID_FRAMES = 30; // 至少 1 秒有效帧
const MAX_COLLECT_FRAMES = 90; // 最多收集 3 秒

// ── 阈值 ──
const FORWARD_BEND_ANGLE_MIN = 50; // 躯干倾角 > 50° 算有效前屈
const MILD_ASYMMETRY_THRESHOLD = 0.03;
const SIGNIFICANT_HUMP_THRESHOLD = 0.08;

// ── 帧数据 ──
interface FrameData {
  shoulderDiff: number; // 肩 y 差
  hipDiff: number; // 髋 y 差
  shoulderWidth: number; // 肩宽
  bendAngle: number; // 前屈角度
}

// MediaPipe pose landmark: { x, y, z, visibility? }
interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
}

/**
 * 计算两个 landmark 之间的欧氏距离
 */
function landmarkDistance(a: PoseLandmark, b: PoseLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 计算躯干前屈角度（偏离垂直的角度）
 * 肩中点 → 髋中点 向量 vs (0, -1, 0) 垂直向量
 */
function computeBendAngle(
  shoulderMidY: number,
  hipMidY: number,
  shoulderMidX: number,
  hipMidX: number,
): number {
  const dx = shoulderMidX - hipMidX;
  const dy = hipMidY - shoulderMidY; // 翻转 y（图像坐标 y 向下）
  // 垂直参考向量 (0, 1) — 指向下方的垂直向量
  const dotProduct = dy; // (dx, dy) · (0, 1) = dy
  const magV = Math.sqrt(dx * dx + dy * dy);
  if (magV < 0.001) return 0;
  const cosTheta = Math.max(-1, Math.min(1, dotProduct / magV));
  const angleRad = Math.acos(cosTheta);
  return (angleRad * 180) / Math.PI;
}

/**
 * 从单帧 MediaPipe Results 提取帧数据
 */
function extractFrameData(results: Results): FrameData | null {
  if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
    return null;
  }

  const lm = results.poseLandmarks[0];
  const leftShoulder = lm[LEFT_SHOULDER];
  const rightShoulder = lm[RIGHT_SHOULDER];
  const leftHip = lm[LEFT_HIP];
  const rightHip = lm[RIGHT_HIP];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return null;
  }

  // 肩部 y 差（绝对值）
  const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);

  // 髋部 y 差
  const hipDiff = Math.abs(leftHip.y - rightHip.y);

  // 肩宽（欧氏距离）
  const shoulderWidth = landmarkDistance(leftShoulder, rightShoulder);

  // 前屈角度
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipMidY = (leftHip.y + rightHip.y) / 2;
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const hipMidX = (leftHip.x + rightHip.x) / 2;
  const bendAngle = computeBendAngle(shoulderMidY, hipMidY, shoulderMidX, hipMidX);

  return { shoulderDiff, hipDiff, shoulderWidth, bendAngle };
}

/**
 * Adam's 前屈测试姿态分析器
 *
 * 收集多帧 MediaPipe 数据，分析肩部和髋部的不对称度，
 * 自动判断是否存在肋骨隆起（脊柱侧弯的典型体征）。
 *
 * 用法：
 *   1. 创建 AdamsAnalyzer 实例
 *   2. 在 MediaPipe onResults 回调中调用 analyzer.addFrame(results)
 *   3. 收集足够帧后调用 analyzer.finalize() 获取结果
 */
export class AdamsAnalyzer {
  private frames: FrameData[] = [];
  private _isCollecting = false;
  private _validFrameCount = 0;
  private _totalFrameCount = 0;

  get isCollecting(): boolean {
    return this._isCollecting;
  }

  get validFrameCount(): number {
    return this._validFrameCount;
  }

  get totalFrameCount(): number {
    return this._totalFrameCount;
  }

  get progress(): number {
    return Math.min(this._validFrameCount / MIN_VALID_FRAMES, 1);
  }

  /** 开始收集帧数据 */
  start(): void {
    this.frames = [];
    this._isCollecting = true;
    this._validFrameCount = 0;
    this._totalFrameCount = 0;
  }

  /** 停止收集 */
  stop(): void {
    this._isCollecting = false;
  }

  /** 添加一帧并进行前屈验证 */
  addFrame(results: Results): FrameData | null {
    if (!this._isCollecting) return null;
    if (this._validFrameCount >= MAX_COLLECT_FRAMES) {
      this.stop();
      return null;
    }

    this._totalFrameCount++;
    const frameData = extractFrameData(results);

    if (!frameData) return null;

    // 验证前屈姿势：躯干倾角 > 阈值
    if (frameData.bendAngle >= FORWARD_BEND_ANGLE_MIN) {
      this.frames.push(frameData);
      this._validFrameCount++;
      return frameData;
    }

    return null; // 无效帧（未达到前屈角度）
  }

  /** 判断是否已收集足够有效帧 */
  hasEnoughFrames(): boolean {
    return this._validFrameCount >= MIN_VALID_FRAMES;
  }

  /** 完成分析，返回结果 */
  finalize(): AdamsAutoResult {
    this.stop();

    if (this.frames.length === 0) {
      return {
        shoulderAsymmetry: 0,
        hipAsymmetry: 0,
        asymmetryRatio: 0,
        ribHumpDetected: false,
        confidence: 'low',
        recommendation: 'symmetrical',
      };
    }

    // 帧间平均
    let totalShoulderDiff = 0;
    let totalHipDiff = 0;
    let totalShoulderWidth = 0;
    let totalBendAngle = 0;

    for (const frame of this.frames) {
      totalShoulderDiff += frame.shoulderDiff;
      totalHipDiff += frame.hipDiff;
      totalShoulderWidth += frame.shoulderWidth;
      totalBendAngle += frame.bendAngle;
    }

    const n = this.frames.length;
    const avgShoulderDiff = totalShoulderDiff / n;
    const avgHipDiff = totalHipDiff / n;
    const avgShoulderWidth = totalShoulderWidth / n;
    const avgBendAngle = totalBendAngle / n;

    // 归一化：肩差 / 肩宽
    const asymmetryRatio =
      avgShoulderWidth > 0.001 ? avgShoulderDiff / avgShoulderWidth : 0;

    // 置信度评估
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (n >= 60 && avgBendAngle >= 65) {
      confidence = 'high';
    } else if (n < 40) {
      confidence = 'low';
    }

    // 判断结果
    let recommendation: 'symmetrical' | 'mild_asymmetry' | 'significant_hump';
    if (asymmetryRatio >= SIGNIFICANT_HUMP_THRESHOLD) {
      recommendation = 'significant_hump';
    } else if (asymmetryRatio >= MILD_ASYMMETRY_THRESHOLD) {
      recommendation = 'mild_asymmetry';
    } else {
      recommendation = 'symmetrical';
    }

    const ribHumpDetected = recommendation !== 'symmetrical';

    return {
      shoulderAsymmetry: Math.round(avgShoulderDiff * 1000) / 1000,
      hipAsymmetry: Math.round(avgHipDiff * 1000) / 1000,
      asymmetryRatio: Math.round(asymmetryRatio * 1000) / 1000,
      ribHumpDetected,
      confidence,
      recommendation,
    };
  }
}
