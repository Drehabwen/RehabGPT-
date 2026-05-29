/**
 * 统一系统提示词管理
 * 
 * 之前的问题：
 * - 提示词散落在 questions.ts、branches.ts、useAgentStore.ts 等多个文件
 * - 欢迎消息在 store 中硬编码
 * - 没有统一的语气/角色定义
 * 
 * 改进：
 * - 所有提示词集中在此目录
 * - 统一的 AgentPersona 定义
 * - 按功能模块分组（chat、assessment、report、rehab、followup）
 */

// ── Agent 角色定义（统一语气） ──
export const AGENT_PERSONA = {
  name: '小柱',
  role: '儿童脊柱健康小助手',
  targetAudience: '家长（为孩子做脊柱健康筛查和居家管理）',
  tone: '温暖、专业、易懂、不制造焦虑',
  languageStyle: {
    useEmoji: true,
    useMarkdown: true,
    avoidMedicalJargon: true,
    parentFriendly: true,
  },
  constraints: [
    '不做医学诊断，只提供筛查参考',
    '风险提示要温和，不吓唬家长',
    '所有建议需强调"建议咨询专业医生"',
    '使用"孩子"而非"患者"',
  ],
} as const;

// ── 动态消息构建器 ──
export interface MessageContext {
  patientName: string;
  patientAge?: number | null;
  hasHistory?: boolean;
  hasDueReminder?: boolean;
  lastAssessmentSummary?: string | null;
  riskLevel?: string | null;
}

export function buildWelcomeMessage(ctx: MessageContext): string[] {
  const { patientName, hasHistory, hasDueReminder } = ctx;
  const childName = patientName.replace(/^患者\s*/, '');
  
  const messages: string[] = [
    `你好！我是 ${AGENT_PERSONA.name} 🧒，${AGENT_PERSONA.role}`,
    `我来帮您关注 ${childName} 的脊柱健康。`,
  ];

  if (hasHistory) {
    messages[1] += ` 之前有过检查记录，可以帮您对比变化趋势。`;
  }
  if (hasDueReminder) {
    messages.push(`⏰ 提醒：该带孩子来复查了哦！`);
  }

  return messages;
}

export function buildReassessIntro(_ctx: MessageContext): string[] {
  return [
    '好的，我们来给孩子做一次脊柱健康检查 📋',
    '有些信息之前已经记录过了，不会重复问您。',
    '准备好了吗？',
  ];
}

export function buildReportIntro(ctx: MessageContext): string[] {
  return [
    '让我帮您看看孩子的评估数据 📊',
    ctx.lastAssessmentSummary || '暂无历史评估数据。',
  ];
}

export function buildRehabIntro(_ctx: MessageContext): string[] {
  return [
    '根据评估结果，我来给孩子一些居家训练建议 🏋️',
    '这些训练可以在家完成，每天坚持效果更好。',
  ];
}

export function buildFollowupIntro(ctx: MessageContext): string[] {
  const { riskLevel } = ctx;
  if (riskLevel === 'high' || riskLevel === 'moderate') {
    return [
      '根据孩子的筛查结果，建议定期复查。',
      '我可以帮您设置复查提醒，到时候会通知您。',
    ];
  }
  return [
    '即使目前风险不高，也建议每 6-12 个月复查一次。',
    '需要我帮您设置提醒吗？',
  ];
}

export function buildCompletionMessage(riskLevel: string): string[] {
  const levelMap: Record<string, string[]> = {
    '低风险': [
      '检查完成！✅',
      '目前风险较低，让孩子保持良好姿势，定期观察就好。',
    ],
    '轻度关注': [
      '检查完成！📋',
      '有一些因素值得留意，建议定期关注孩子的体态变化。',
    ],
    '中度风险': [
      '检查完成！⚠️',
      '建议带孩子到脊柱专科或康复科做一次专业评估。',
    ],
    '高风险': [
      '检查完成！🚨',
      '建议尽快带孩子到骨科或脊柱专科就诊，别耽误！',
    ],
  };
  return levelMap[riskLevel] || levelMap['低风险'];
}

// ── 问题文案（从 questions.ts 迁移，统一格式） ──
export const QUESTION_TEMPLATES = {
  greeting: [
    '你好！我是小柱 🧒，儿童脊柱健康小助手',
    '花大约 2 分钟，帮您了解一下孩子的脊柱侧弯风险。',
    '准备好了吗？',
  ],
  name: ['先告诉我孩子的名字或小名吧。'],
  gender: ['孩子的性别是？'],
  age: ['孩子今年的年龄是？（脊柱侧弯在 10-16 岁最高发，早发现早干预）'],
  growthSpurt: ['最近一年，孩子身高长得快吗？'],
  familyScoliosis: [
    '家里人（父母、兄弟姐妹）有被诊断过脊柱侧弯吗？',
    '（家族史是最重要的参考因素之一）',
  ],
  backPain: ['最近几个月，孩子有没有说过背部疼或者酸？'],
  painLevel: ['如果 0 是完全不疼，10 是疼得受不了，孩子大概有几分疼？'],
  postureShoulders: ['让孩子站直，您从正面/背面看看——两个肩膀一样高吗？'],
  postureScapula: ['再看看肩胛骨（后背的"蝴蝶骨"），两边对称吗？有没有一边更突出？'],
  postureWaist: ['让孩子双手叉腰，腰部两侧的曲线对称吗？'],
  adamsIntro: [
    '接下来做个简单的"弯腰测试"（医生也叫 Adam\'s 前屈测试）👆',
    '让孩子站直，双脚并拢，慢慢向前弯腰 90°。',
    '您从背后观察：背部两侧是否一样高？有没有一侧隆起？',
    '这是筛查脊柱侧弯最重要的一步。',
  ],
  adamsMethod: ['您想用什么方式完成这个测试？'],
  adamsCamera: [
    '请让孩子背对摄像头站好，慢慢向前弯腰。',
    '保持弯腰姿势 3 秒钟，系统会自动分析。',
  ],
  confirmation: ['要把筛查结果保存到系统里吗？方便以后对比变化。'],
} as const;

// ── 选项文案 ──
export const OPTION_TEMPLATES = {
  start: [{ label: '开始检查', value: 'start' }],
  gender: [
    { label: '男孩', value: '男' },
    { label: '女孩', value: '女' },
  ],
  growthSpurt: [
    { label: '长得挺快', value: '长得挺快' },
    { label: '一般', value: '一般' },
    { label: '基本没长', value: '基本没长' },
  ],
  familyScoliosis: [
    { label: '有', value: '有' },
    { label: '没有', value: '没有' },
    { label: '不确定', value: '不确定' },
  ],
  backPain: [
    { label: '经常疼', value: '经常疼' },
    { label: '偶尔会疼', value: '偶尔会疼' },
    { label: '从没说过疼', value: '从不疼' },
  ],
  posture: [
    { label: '一样高', value: '一样高' },
    { label: '右肩高', value: '右肩高' },
    { label: '左肩高', value: '左肩高' },
    { label: '看不太出来', value: '看不出来' },
  ],
  postureScapula: [
    { label: '对称', value: '对称' },
    { label: '一边更突出', value: '一侧更突出' },
    { label: '看不太出来', value: '看不出来' },
  ],
  postureWaist: [
    { label: '对称', value: '对称' },
    { label: '一边更深', value: '一侧更深' },
    { label: '看不太出来', value: '看不出来' },
  ],
  adamsMethod: [
    { label: '用摄像头拍', value: '用摄像头拍' },
    { label: '我在旁边观察', value: '家人在旁边帮我' },
    { label: '先跳过', value: '先跳过' },
  ],
  adamsReady: [{ label: '准备好了', value: 'ready' }],
  confirmation: [
    { label: '保存结果', value: '保存结果' },
    { label: '不用了', value: '不用了' },
  ],
  done: [
    { label: '重新检查', value: '重新筛查' },
    { label: '关闭', value: '关闭' },
  ],
  mainMenu: [
    { label: '🩺 给孩子做检查', value: 'reassess' },
    { label: '📊 查看检查结果', value: 'report' },
    { label: '🏋️ 居家训练建议', value: 'rehab' },
    { label: '📅 复查提醒', value: 'followup' },
  ],
} as const;

// ── Adams 检测结果文案 ──
export function buildAdamsResultMessage(result: string): string[] {
  const map: Record<string, string[]> = {
    significant_hump: ['检测完成！弯腰时孩子背部检测到**明显不对称**，可能存在肋骨隆起。'],
    mild_asymmetry: ['检测完成！弯腰时孩子背部检测到**轻微不对称**。'],
    normal: ['检测完成！弯腰时孩子背部**基本对称**，未检测到明显隆起。'],
  };
  return map[result] || map.normal;
}

// ── 导出统一接口 ──
export * from './riskMessages';
export * from './systemPrompt';
export * from './persona';
export * from './clinicalKnowledge';
export * from './phaseWorkflows';

