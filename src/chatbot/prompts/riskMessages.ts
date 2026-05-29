/**
 * 风险等级消息模板
 * 
 * 之前：riskCalculator.ts 中硬编码
 * 现在：集中管理，支持动态插值
 */

export interface RiskFactors {
  ageRisk?: boolean;
  genderRisk?: boolean;
  familyHistory?: boolean;
  growthSpurt?: boolean;
  pain?: boolean;
  postureAsymmetry?: boolean;
  adamsPositive?: boolean;
}

export interface RiskResult {
  level: '低风险' | '轻度关注' | '中度风险' | '高风险';
  score: number;
  factors: RiskFactors;
  suggestions: string[];
}

// ── 风险等级定义 ──
export const RISK_LEVELS = {
  low: {
    label: '低风险',
    emoji: '✅',
    color: '#22c55e',
    description: '目前脊柱侧弯风险较低',
  },
  mild: {
    label: '轻度关注',
    emoji: '📋',
    color: '#f59e0b',
    description: '有一些因素值得留意',
  },
  moderate: {
    label: '中度风险',
    emoji: '⚠️',
    color: '#f97316',
    description: '建议进行专业评估',
  },
  high: {
    label: '高风险',
    emoji: '🚨',
    color: '#ef4444',
    description: '建议尽快就医',
  },
} as const;

// ── 风险因素解释文案 ──
export const RISK_FACTOR_EXPLANATIONS: Record<string, string> = {
  ageRisk: '孩子正处于脊柱侧弯高发年龄段（10-16岁）',
  genderRisk: '女孩脊柱侧弯风险相对较高',
  familyHistory: '家族中有脊柱侧弯病史',
  growthSpurt: '孩子正处于快速生长期，脊柱变化较快',
  pain: '孩子有背部疼痛症状',
  postureAsymmetry: '观察到体态不对称（肩膀/肩胛骨/腰部）',
  adamsPositive: 'Adam\'s 前屈测试发现背部不对称',
};

// ── 建议文案模板 ──
export const SUGGESTION_TEMPLATES: Record<string, string[]> = {
  low: [
    '保持良好坐姿和站姿',
    '每学习 45 分钟起身活动',
    '定期进行脊柱健康观察',
    '建议每 6-12 个月复查一次',
  ],
  mild: [
    '注意日常姿势管理',
    '增加背部肌肉锻炼',
    '建议 3-6 个月后复查',
    '如有变化及时就医',
  ],
  moderate: [
    '建议到脊柱专科或康复科就诊',
    '可能需要专业评估（如 X 光检查）',
    '遵医嘱进行针对性训练',
    '定期随访，监测变化',
  ],
  high: [
    '建议尽快到骨科或脊柱专科就诊',
    '可能需要影像学检查确认',
    '遵医嘱进行治疗或干预',
    '定期复查，密切监测',
  ],
};

// ── 动态建议生成器 ──
export function buildRiskSuggestions(result: RiskResult): string[] {
  const { level, factors } = result;
  const baseSuggestions = [...(SUGGESTION_TEMPLATES[level.toLowerCase()] || SUGGESTION_TEMPLATES.low)];

  // 根据具体风险因素添加个性化建议
  if (factors.familyHistory) {
    baseSuggestions.unshift('由于家族病史，建议更密切地关注孩子脊柱发育');
  }
  if (factors.growthSpurt) {
    baseSuggestions.unshift('快速生长期是脊柱侧弯发展关键期，需加强观察');
  }
  if (factors.pain) {
    baseSuggestions.unshift('背部疼痛需要重视，建议及时就医排查原因');
  }
  if (factors.adamsPositive) {
    baseSuggestions.unshift('Adam\'s 测试阳性提示可能存在脊柱旋转，建议专业评估');
  }

  return baseSuggestions;
}

// ── 风险结果消息构建 ──
export function buildRiskResultMessage(result: RiskResult): string[] {
  const { level, score } = result;
  const levelInfo = RISK_LEVELS[level.toLowerCase() as keyof typeof RISK_LEVELS] || RISK_LEVELS.low;

  const messages: string[] = [
    `${levelInfo.emoji} **风险等级：${level}**`,
    `${levelInfo.description}`,
    `综合评分：${score} 分`,
  ];

  // 添加风险因素说明
  const activeFactors = Object.entries(result.factors)
    .filter(([, value]) => value)
    .map(([key]) => RISK_FACTOR_EXPLANATIONS[key])
    .filter(Boolean);

  if (activeFactors.length > 0) {
    messages.push('');
    messages.push('**主要风险因素：**');
    activeFactors.forEach((factor) => {
      messages.push(`• ${factor}`);
    });
  }

  // 添加建议
  const suggestions = buildRiskSuggestions(result);
  if (suggestions.length > 0) {
    messages.push('');
    messages.push('**建议：**');
    suggestions.slice(0, 4).forEach((suggestion) => {
      messages.push(`• ${suggestion}`);
    });
  }

  return messages;
}

// ── 复查提醒文案 ──
export function buildFollowupReminder(daysOverdue: number): string[] {
  if (daysOverdue > 0) {
    return [
      `⏰ 复查提醒：已经超期 ${daysOverdue} 天了`,
      '建议尽快带孩子来复查，持续监测脊柱健康。',
    ];
  }
  if (daysOverdue === 0) {
    return [
      '⏰ 今天该复查了',
      '记得带孩子来做脊柱健康复查哦。',
    ];
  }
  return [
    `📅 还有 ${Math.abs(daysOverdue)} 天到复查时间`,
    '请提前安排好时间，定期复查很重要。',
  ];
}
