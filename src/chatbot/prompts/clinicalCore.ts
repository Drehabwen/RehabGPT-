/**
 * 临床知识库 — 按需加载版
 *
 * 设计原则：
 * 1. 按对话阶段只加载当前需要的知识
 * 2. 用结构化数据存储，紧凑格式输出
 * 3. 详细解释交给代码模板，不塞进 system prompt
 */

// ── 核心临床知识（所有阶段都需要）─
const CLINICAL_CORE = {
  redFlags: [
    '青少年侧弯通常无痛，背痛+夜间痛→必须MRI',
    'Cobb角：<20°观察，20-40°支具，>40°手术评估',
  ],
  postureChecks: '高低肩/蝴蝶骨突出/腰线不对称',
} as const;

// ── Adams测试知识（仅筛查阶段）─
const ADAMS_KNOWLEDGE = {
  steps: '双脚并拢→弯腰90°→观察背部是否对称',
  findings: '对称=正常；一侧隆起=剃刀背，需就医',
} as const;

// ── 量表知识（仅报告/量表阶段）─
const SCALES_KNOWLEDGE = {
  SRS22: '生活质量问卷，看心理影响',
  VAS: '疼痛评分0-10',
  ODI: '腰部功能受限程度',
} as const;

// ── 康复知识（仅康复阶段）─
const REHAB_KNOWLEDGE = {
  exercises: '猫式伸展/小燕飞/臀桥/蚌式开合/单杠',
  rule: '无痛原则，疼就停',
} as const;

// ── 知识模块注册表 ─
interface KnowledgeModule {
  id: string;
  data: Record<string, unknown>;
  buildPrompt: () => string;
}

const KNOWLEDGE_MODULES: Record<string, KnowledgeModule> = {
  core: {
    id: 'core',
    data: CLINICAL_CORE,
    buildPrompt: () => `临床红线：${CLINICAL_CORE.redFlags.join('；')}。体态：${CLINICAL_CORE.postureChecks}。`,
  },
  adams: {
    id: 'adams',
    data: ADAMS_KNOWLEDGE,
    buildPrompt: () => `Adams测试：${ADAMS_KNOWLEDGE.steps}。结果：${ADAMS_KNOWLEDGE.findings}。`,
  },
  scales: {
    id: 'scales',
    data: SCALES_KNOWLEDGE,
    buildPrompt: () => `量表：SRS22=${SCALES_KNOWLEDGE.SRS22}；VAS=${SCALES_KNOWLEDGE.VAS}；ODI=${SCALES_KNOWLEDGE.ODI}。`,
  },
  rehab: {
    id: 'rehab',
    data: REHAB_KNOWLEDGE,
    buildPrompt: () => `训练：${REHAB_KNOWLEDGE.exercises}。原则：${REHAB_KNOWLEDGE.rule}。`,
  },
};

/**
 * 按阶段获取需要的知识模块
 */
export function getKnowledgeModulesForPhase(phase: string): string[] {
  const phaseMap: Record<string, string[]> = {
    greeting: ['core'],
    screening: ['core', 'adams'],
    adams_test: ['core', 'adams'],
    result_review: ['core'],
    report_chat: ['core', 'scales'],
    rehab_guidance: ['core', 'rehab'],
    followup: ['core'],
    free_chat: ['core'],
  };
  return phaseMap[phase] || ['core'];
}

/**
 * 构建临床知识提示词 (~100-300 tokens，按阶段)
 */
export function buildClinicalPrompt(phase: string): string {
  const modules = getKnowledgeModulesForPhase(phase);
  const parts = modules.map((id) => KNOWLEDGE_MODULES[id]?.buildPrompt() || '');
  return parts.filter(Boolean).join('\n');
}
