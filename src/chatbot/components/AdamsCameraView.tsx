import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Camera, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';

/**
 * Adam's 前屈测试摄像头视图（独立版，不含 MediaPipe）
 *
 * 使用浏览器原生 getUserMedia 显示摄像头画面。
 * 家长可通过摄像头观察孩子弯腰姿势，手动判断背部是否隆起。
 *
 * 流程：
 *   1. 启动后置/前置摄像头
 *   2. 家长观察孩子弯腰 90° 的背部
 *   3. 手动选择结果 → 确认 → 关闭
 *
 * 回退：摄像头权限拒绝 → 直接人工选择模式
 */
export const AdamsCameraView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<'loading' | 'ready' | 'result' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const closeCamera = useAgentStore((s) => s.closeCamera);
  const setAdamsAutoResult = useAgentStore((s) => s.setAdamsAutoResult);

  // ── 启动原生摄像头 ──
  const startCamera = useCallback(async () => {
    try {
      setPhase('loading');
      // Try environment-facing (rear) camera first, fall back to user-facing
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();
      setPhase('ready');
    } catch (err) {
      // Try user-facing camera as fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setPhase('ready');
      } catch (err2) {
        const e = err2 instanceof Error ? err2 : new Error(String(err2));
        setErrorMsg(
          e.message.includes('NotAllowed') || e.name === 'NotAllowedError'
            ? '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问。'
            : e.message.includes('NotFound') || e.name === 'NotFoundError'
              ? '未找到摄像头设备。'
              : `摄像头错误：${e.message}`,
        );
        setPhase('error');
      }
    }
  }, []);

  // ── 停止摄像头 ──
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // ── 组件挂载时启动摄像头 ──
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // ── 手动选择结果 ──
  const handleSelectResult = (result: 'significant_hump' | 'mild_asymmetry' | 'symmetrical') => {
    setAdamsAutoResult({
      shoulderAsymmetry: 0,
      hipAsymmetry: 0,
      asymmetryRatio: 0,
      ribHumpDetected: result !== 'symmetrical',
      confidence: 'low',
      recommendation: result,
    });
    setPhase('result');
  };

  // ── 确认结果并继续 ──
  const handleConfirmResult = () => {
    stopCamera();
    closeCamera();
  };

  // ── 摄像头不可用时回退到人工选择 ──
  const handleFallbackManual = () => {
    stopCamera();
    closeCamera();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 顶部栏 */}
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={handleFallbackManual}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 text-white text-sm hover:bg-black/60 transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>

        <span className="text-white text-sm font-medium">
          Adam's 前屈测试
        </span>

        <div className="w-16" />
      </div>

      {/* 摄像头画面 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 加载状态 */}
      {phase === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
          <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
          <p className="text-white text-sm">正在启动摄像头...</p>
        </div>
      )}

      {/* 就绪状态 — 手动判断按钮 */}
      {phase === 'ready' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
          <div className="bg-black/50 rounded-2xl px-8 py-6 text-center text-white max-w-sm">
            <Camera className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-lg font-semibold mb-2">Adam's 前屈测试</h3>
            <p className="text-sm text-white/70 mb-2">
              请让孩子背对摄像头站立，双脚并拢，<br />
              慢慢向前弯腰 90°，观察背部是否隆起。
            </p>
            <p className="text-xs text-white/50 mb-5">
              请根据观察结果选择：
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSelectResult('significant_hump')}
                className="w-full px-4 py-2.5 rounded-xl bg-red-500/80 text-white text-sm font-semibold hover:bg-red-500 active:scale-95 transition-all"
              >
                明显隆起（一侧高于另一侧）
              </button>
              <button
                type="button"
                onClick={() => handleSelectResult('mild_asymmetry')}
                className="w-full px-4 py-2.5 rounded-xl bg-yellow-500/80 text-white text-sm font-semibold hover:bg-yellow-500 active:scale-95 transition-all"
              >
                轻微不对称
              </button>
              <button
                type="button"
                onClick={() => handleSelectResult('symmetrical')}
                className="w-full px-4 py-2.5 rounded-xl bg-emerald-500/80 text-white text-sm font-semibold hover:bg-emerald-500 active:scale-95 transition-all"
              >
                对称无隆起
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 结果确认 */}
      {phase === 'result' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
          <div className="bg-white rounded-2xl px-8 py-6 text-center max-w-sm mx-4 shadow-2xl">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              已记录
            </h3>
            <p className="text-sm text-slate-600 mb-6">观察结果已保存，点击确认继续。</p>
            <button
              type="button"
              onClick={handleConfirmResult}
              className="px-8 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              确认继续
            </button>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {phase === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30 p-4">
          <div className="bg-white rounded-2xl px-8 py-6 text-center max-w-sm">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              摄像头不可用
            </h3>
            <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
            <button
              type="button"
              onClick={handleFallbackManual}
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              跳过，手动判断
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdamsCameraView;
