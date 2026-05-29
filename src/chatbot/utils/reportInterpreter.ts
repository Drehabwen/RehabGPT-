/**
 * 报告解读 — LLM API（DeepSeek）+ 规则引擎兜底
 *
 * 前端调用后端 POST /api/chatbot/interpret-report，
 * 后端使用 DeepSeek 客户端生成自然语言解读。
 * 前端在 API 不可用时降级为规则引擎。
 */

// ── 请求/响应类型 ──
export interface InterpretRequest {
  patientName: string;
  patientAge: number | null;
  dataType: 'posture' | 'rom' | 'scales' | 'screening' | 'overview';
  data: Record<string, unknown>;
}

export interface InterpretResponse {
  interpretation: string;
  source: 'llm' | 'rule_engine';
}

// ── API 配置 ──
const API_BASE = '';
const API_TIMEOUT = 30000; // 30 秒超时

/**
 * 调用后端 LLM API 解读评估数据
 */
async function callInterpretAPI(req: InterpretRequest): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${API_BASE}/api/chatbot/interpret-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    return data.interpretation || null;
  } catch (err) {
    console.warn('[ReportInterpreter] LLM API call failed:', err);
    return null;
  }
}

// ── 规则引擎降级 ──

function fallbackPostureInterpretation(data: Record<string, unknown>): string {
  const metrics = (data.metrics || data) as Record<string, number>;
  const lines: string[] = ['【体态评估解读】\n'];

  // 肩高差
  const shoulderDiff = metrics.shoulderHeightDiff ?? metrics.shoulderDiff;
  if (shoulderDiff !== undefined) {
    const absDiff = Math.abs(shoulderDiff);
    if (absDiff < 1) {
      lines.push('✅ 肩高对称性良好，左右肩高基本一致。');
    } else if (absDiff < 2) {
      lines.push(
        `⚠️ 肩高存在轻微差异（约 ${absDiff.toFixed(1)} cm），建议关注并定期复查。`,
      );
    } else {
      lines.push(
        `🔴 肩高差异较明显（约 ${absDiff.toFixed(1)} cm），可能与脊柱侧弯有关，建议进一步专业评估。`,
      );
    }
  }

  // 头部倾角
  const headTilt = metrics.headTilt ?? metrics.headAngle;
  if (headTilt !== undefined && Math.abs(headTilt) > 3) {
    lines.push(`⚠️ 头部倾角 ${Math.abs(headTilt).toFixed(1)}°，可能存在姿势不良。`);
  }

  // 骨盆倾斜
  const pelvicTilt = metrics.pelvicTilt ?? metrics.pelvisAngle;
  if (pelvicTilt !== undefined && Math.abs(pelvicTilt) > 3) {
    lines.push(`⚠️ 骨盆倾斜 ${Math.abs(pelvicTilt).toFixed(1)}°，可能影响脊柱受力。`);
  }

  if (lines.length === 1) {
    lines.push('体态数据不足以生成详细解读。');
  }

  return lines.join('\n');
}

function fallbackRomInterpretation(data: Record<string, unknown>): string {
  const items = data.items as Array<Record<string, unknown>> | undefined;
  const lines: string[] = ['【ROM 评估解读】\n'];

  if (!items || items.length === 0) {
    lines.push('暂无 ROM 评估数据。');
    return lines.join('\n');
  }

  for (const item of items) {
    const name = item.name || item.joint || '未知关节';
    const leftVal = Number(item.left ?? item.leftValue ?? 0);
    const rightVal = Number(item.right ?? item.rightValue ?? 0);
    const normalMin = Number(item.normalMin ?? item.minNormal ?? 0);
    const normalMax = Number(item.normalMax ?? item.maxNormal ?? 180);

    const leftOk = leftVal >= normalMin && leftVal <= normalMax;
    const rightOk = rightVal >= normalMin && rightVal <= normalMax;
    const asymmetry = Math.abs(leftVal - rightVal);

    const statusIcon = leftOk && rightOk && asymmetry < 5 ? '✅' : '⚠️';
    lines.push(
      `${statusIcon} **${name}**: 左 ${leftVal}° / 右 ${rightVal}° ` +
        `（正常范围: ${normalMin}°-${normalMax}°）`,
    );

    if (asymmetry >= 5) {
      lines.push(`   ↳ 左右差异 ${asymmetry.toFixed(0)}°，需关注对称性训练`);
    }
    if (!leftOk) lines.push(`   ↳ 左侧活动度${leftVal < normalMin ? '不足' : '过大'}`);
    if (!rightOk) lines.push(`   ↳ 右侧活动度${rightVal < normalMin ? '不足' : '过大'}`);
  }

  return lines.join('\n');
}

function fallbackScalesInterpretation(data: Record<string, unknown>): string {
  const lines: string[] = ['【量表结果解读】\n'];

  const scaleName = (data.scaleName as string) || '量表';
  const totalScore = Number(data.totalScore ?? data.total ?? 0);
  const riskLevel = (data.riskLevel as string) || '未知';

  lines.push(`**${scaleName}**: 总分 ${totalScore} 分 (${riskLevel})`);

  const scores = data.scores as Record<string, number> | undefined;
  if (scores) {
    for (const [key, value] of Object.entries(scores)) {
      lines.push(`  • ${key}: ${value} 分`);
    }
  }

  // 风险建议
  switch (riskLevel) {
    case '高风险':
      lines.push('\n🔴 量表结果显示较高风险，建议尽快进行专业评估。');
      break;
    case '中度风险':
      lines.push('\n🟡 量表结果显示中度风险，建议定期复查并关注变化趋势。');
      break;
    case '低风险':
    case '轻度':
      lines.push('\n🟢 量表结果显示风险较低，继续保持良好习惯。');
      break;
  }

  return lines.join('\n');
}

function fallbackScreeningInterpretation(data: Record<string, unknown>): string {
  const lines: string[] = ['【筛查记录解读】\n'];

  const method = data.method as string;
  const adamResult = data.adamResult as string | undefined;
  const atr = data.atr as Record<string, number> | undefined;
  const riskScore = Number(data.riskScore ?? 0);
  const riskLevel = (data.riskLevel as string) || '';

  lines.push(`筛查方式: ${method || '未知'}`);

  if (adamResult) {
    const resultLabel =
      adamResult === 'positive_significant'
        ? '明显隆起（阳性-significant）'
        : adamResult === 'positive_suspect'
          ? '可疑隆起（阳性-suspect）'
          : '阴性';
    lines.push(`Adam's 测试结果: ${resultLabel}`);
  }

  if (atr) {
    if (atr.thoracic !== undefined) {
      lines.push(`胸段 ATR: ${atr.thoracic}°`);
    }
    if (atr.lumbar !== undefined) {
      lines.push(`腰段 ATR: ${atr.lumbar}°`);
    }
  }

  if (riskScore > 0) {
    lines.push(`\n风险评分: ${riskScore}/160 (${riskLevel})`);
  }

  return lines.join('\n');
}

function fallbackOverviewInterpretation(
  postureData?: Record<string, unknown>,
  romData?: Record<string, unknown>,
  scalesData?: Record<string, unknown>,
  screeningData?: Record<string, unknown>,
): string {
  const lines: string[] = ['【综合评估概览】\n'];
  let hasData = false;

  if (postureData && Object.keys(postureData).length > 0) {
    lines.push('• 有体态评估数据');
    hasData = true;
  }
  if (romData && Object.keys(romData).length > 0) {
    lines.push('• 有关节活动度（ROM）数据');
    hasData = true;
  }
  if (scalesData && Object.keys(scalesData).length > 0) {
    lines.push('• 有量表评估数据');
    hasData = true;
  }
  if (screeningData && Object.keys(screeningData).length > 0) {
    lines.push('• 有筛查记录');
    hasData = true;
  }

  if (!hasData) {
    lines.push('目前还没有评估数据。可以先完成一次评估，再来查看解读。');
  } else {
    lines.push('\n点击上方按钮，选择你想详细了解的项目。');
  }

  return lines.join('\n');
}

/**
 * 主入口：解读评估数据（LLM 优先，降级规则引擎）
 */
export async function interpretAssessmentData(
  patientName: string,
  patientAge: number | null,
  dataType: InterpretRequest['dataType'],
  data: Record<string, unknown>,
  /** 综合解读时提供额外数据 */
  extraData?: {
    postureData?: Record<string, unknown>;
    romData?: Record<string, unknown>;
    scalesData?: Record<string, unknown>;
    screeningData?: Record<string, unknown>;
  },
): Promise<InterpretResponse> {
  // 1. 尝试 LLM API
  const llmResult = await callInterpretAPI({
    patientName,
    patientAge,
    dataType,
    data,
  });

  if (llmResult) {
    return { interpretation: llmResult, source: 'llm' };
  }

  // 2. 降级规则引擎
  let fallbackText: string;
  switch (dataType) {
    case 'posture':
      fallbackText = fallbackPostureInterpretation(data);
      break;
    case 'rom':
      fallbackText = fallbackRomInterpretation(data);
      break;
    case 'scales':
      fallbackText = fallbackScalesInterpretation(data);
      break;
    case 'screening':
      fallbackText = fallbackScreeningInterpretation(data);
      break;
    case 'overview':
      fallbackText = fallbackOverviewInterpretation(
        extraData?.postureData,
        extraData?.romData,
        extraData?.scalesData,
        extraData?.screeningData,
      );
      break;
    default:
      fallbackText = '暂不支持该类型的数据解读。';
  }

  return { interpretation: fallbackText, source: 'rule_engine' };
}
