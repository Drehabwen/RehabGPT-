import type { Answers, RiskResult, RiskFactorBreakdown, RiskLevel } from '../types';

// ── 家族史评分 ──
function scoreFamilyHistory(value: string | number | boolean): number {
  if (value === '有' || value === 'yes') return 30;
  if (value === '不确定' || value === 'unsure') return 10;
  return 0;
}

// ── 背痛频率评分 ──
function scoreBackPain(value: string | number | boolean): number {
  if (value === '经常疼' || value === 'frequent') return 25;
  if (value === '偶尔会疼' || value === 'occasional') return 15;
  return 0;
}

// ── 疼痛程度评分 (VAS 0-10) ──
function scorePainSeverity(value: string | number | boolean): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return 0;
  if (num >= 8) return 25;
  if (num >= 5) return 15;
  if (num >= 1) return 5;
  return 0;
}

// ── 体态不对称评分 ──
function scorePostureAsymmetry(answers: Answers): number {
  let asymmetryCount = 0;
  // 肩膀不对称
  if (
    answers.posture_shoulders === '右肩高' ||
    answers.posture_shoulders === '左肩高'
  ) {
    asymmetryCount++;
  }
  // 肩胛骨不对称
  if (answers.posture_scapula === '一侧更突出') {
    asymmetryCount++;
  }
  // 腰部不对称
  if (answers.posture_waist === '一侧更深') {
    asymmetryCount++;
  }
  if (asymmetryCount >= 2) return 25;
  if (asymmetryCount === 1) return 10;
  return 0;
}

// ── 生长风险评分 ──
function scoreGrowthRisk(
  age: string | number | boolean,
  growthSpurt: string | number | boolean,
): number {
  const ageNum = typeof age === 'number' ? age : Number(age);
  if (Number.isNaN(ageNum)) return 5;

  // 10-14 岁 + 长得快 = 最高风险
  if (ageNum >= 10 && ageNum <= 14 && growthSpurt === '长得挺快') return 25;
  // 10-16 岁 + 一般生长
  if (ageNum >= 10 && ageNum <= 16 && growthSpurt === '一般') return 15;
  // 10-18 岁 + 基本没长
  if (ageNum >= 10 && ageNum <= 18 && growthSpurt === '基本没长') return 10;
  // 10-18 岁默认
  if (ageNum >= 10 && ageNum <= 18) return 15;
  // 成人或儿童
  return 5;
}

// ── Adam's 结果评分 ──
function scoreAdamsResult(value: string | number | boolean): number {
  if (value === '明显隆起' || value === 'significant_hump') return 30;
  if (value === '轻微不对称' || value === 'mild_asymmetry') return 15;
  if (value === '对称无隆起' || value === 'symmetrical') return 0;
  if (value === 'skipped') return 10;
  return 10; // 默认（跳过）
}

// ── 风险等级映射 ──
interface RiskLevelDef {
  level: RiskLevel;
  label: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
  urgency: 'routine' | 'semi-urgent' | 'urgent';
  recommendation: string;
}

const RISK_LEVELS: RiskLevelDef[] = [
  {
    level: 'low',
    label: '低风险',
    color: 'green',
    urgency: 'routine',
    recommendation:
      '目前无明显风险因素，保持良好姿势，定期观察即可。建议每6-12个月复查一次体态。',
  },
  {
    level: 'mild',
    label: '轻度关注',
    color: 'yellow',
    urgency: 'routine',
    recommendation:
      '存在一些风险因素，建议3-6个月后复查，注意日常姿势管理。加强核心肌群和背部肌肉锻炼。',
  },
  {
    level: 'moderate',
    label: '中度风险',
    color: 'orange',
    urgency: 'semi-urgent',
    recommendation:
      '建议到脊柱专科或康复科做专业评估（包括Cobb角X光测量）。可能需要进行专业的康复训练干预。',
  },
  {
    level: 'high',
    label: '高风险',
    color: 'red',
    urgency: 'urgent',
    recommendation:
      '强烈建议尽快到骨科或脊柱专科就诊。可能需要支具干预或进一步治疗。请务必重视，不要拖延！',
  },
];

function getRiskLevelDef(total: number): RiskLevelDef {
  if (total <= 20) return RISK_LEVELS[0];
  if (total <= 55) return RISK_LEVELS[1];
  if (total <= 95) return RISK_LEVELS[2];
  return RISK_LEVELS[3];
}

// ── 主评分函数 ──
export function calculateRiskScore(answers: Answers): RiskResult {
  const familyHistory = scoreFamilyHistory(answers.family_scoliosis ?? '');
  const backPain = scoreBackPain(answers.back_pain ?? '');
  const painSeverity = scorePainSeverity(answers.pain_level ?? 0);
  const postureAsymmetry = scorePostureAsymmetry(answers);
  const growthRisk = scoreGrowthRisk(answers.age ?? 18, answers.growth_spurt ?? '');
  const adams = scoreAdamsResult(answers.adams_result ?? 'skipped');

  const total =
    familyHistory + backPain + painSeverity + postureAsymmetry + growthRisk + adams;

  const levelDef = getRiskLevelDef(total);

  const factors: RiskFactorBreakdown = {
    familyHistory,
    backPain,
    painSeverity,
    postureAsymmetry,
    growthRisk,
    adams,
  };

  return {
    total,
    level: levelDef.level,
    levelLabel: levelDef.label,
    color: levelDef.color,
    urgency: levelDef.urgency,
    recommendation: levelDef.recommendation,
    factors,
  };
}
