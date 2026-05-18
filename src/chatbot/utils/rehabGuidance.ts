/**
 * 居家康复指导 — 规则引擎
 *
 * 基于评估发现匹配康复建议（硬编码中文规则表，后续可扩展）。
 * Agent 调用此模块生成针对性训练建议。
 */

// ── 问题/发现类型 ──
export type FindingType =
  | 'scoliosis_confirmed'
  | 'shoulder_asymmetry'
  | 'scapula_asymmetry'
  | 'waist_asymmetry'
  | 'rom_limited'
  | 'back_pain'
  | 'poor_posture'
  | 'growth_spurt_risk';

// ── 单个康复建议 ──
export interface RehabSuggestion {
  title: string;
  description: string;
  frequency: string;
  precautions: string[];
}

// ── 评估发现 ──
export interface AssessmentFindings {
  type: FindingType;
  severity: 'mild' | 'moderate' | 'significant';
  detail?: string;
}

// ── 康复方案 ──
export interface RehabPlan {
  summary: string;
  coreProblems: string[];
  suggestions: RehabSuggestion[];
  dailyTips: string[];
  warning: string;
}

// ── 规则库 ──
const RULES: Record<FindingType, RehabSuggestion[]> = {
  scoliosis_confirmed: [
    {
      title: 'Schroth 呼吸法',
      description:
        '针对脊柱侧弯的三维呼吸训练。侧卧，凸侧朝上，吸气时扩张凹侧胸腔，呼气时收缩凸侧。每次 10 分钟。',
      frequency: '每天 2 次',
      precautions: ['在专业康复师指导下学习正确方法', '避免憋气，保持呼吸均匀'],
    },
    {
      title: '侧弯反向拉伸',
      description:
        '站立位，侧弯凸侧手臂上举，向凹侧侧屈，感受凸侧牵拉感。保持 15 秒，换侧。',
      frequency: '每天 3 组，每组 10 次',
      precautions: ['动作缓慢，不要弹震', '如有疼痛立即停止'],
    },
  ],

  shoulder_asymmetry: [
    {
      title: '单侧耸肩训练',
      description:
        '针对较低一侧肩膀，单侧耸肩至最高点保持 3 秒，缓慢放下。配合弹力带效果更佳。',
      frequency: '每天 3 组，每组 15 次',
      precautions: ['颈部放松，不要代偿', '两侧都要训练，低侧多做'],
    },
    {
      title: '弹力带上举',
      description:
        '双手握弹力带两端，从胸前向上推举至头顶，保持背部挺直。',
      frequency: '每天 2 组，每组 12 次',
      precautions: ['收紧核心，避免腰部反弓', '选择合适阻力的弹力带'],
    },
    {
      title: '靠墙站立',
      description:
        '背靠墙壁站立，脚后跟离墙 10cm，让后脑勺、肩胛骨、臀部、小腿贴墙。保持 3-5 分钟。',
      frequency: '每天 2 次',
      precautions: ['自然呼吸，不要刻意挺胸', '如有头晕立即停止'],
    },
  ],

  scapula_asymmetry: [
    {
      title: '肩胛骨稳定性训练',
      description:
        '俯卧位，双臂前伸，缓慢抬起上胸部，同时夹紧肩胛骨，保持 3 秒放下。',
      frequency: '每天 2 组，每组 10 次',
      precautions: ['不要过度抬头，颈椎保持中立', '呼气时发力，吸气时恢复'],
    },
    {
      title: '墙壁天使',
      description:
        '背靠墙站立，手臂贴墙呈 W 形，缓慢上滑到 Y 形再回到 W 形。感受肩胛骨的活动。',
      frequency: '每天 2 组，每组 10 次',
      precautions: ['全程保持手腕、肘部贴墙', '腰部不要离开墙壁'],
    },
  ],

  waist_asymmetry: [
    {
      title: '侧平板支撑',
      description:
        '侧卧，肘部撑地，臀部抬起形成一条直线。凹侧朝下时多练凹侧。保持 15-30 秒。',
      frequency: '每天 2 组，每侧保持 15-30 秒',
      precautions: ['保持身体成一条直线', '不要塌腰或弓腰'],
    },
    {
      title: '桥式训练',
      description:
        '仰卧屈膝，双脚平放，臀部向上抬起至肩-髋-膝成直线。保持 5 秒放下。',
      frequency: '每天 3 组，每组 15 次',
      precautions: ['收紧臀部和腹部', '不要过度伸展腰部'],
    },
  ],

  rom_limited: [
    {
      title: '猫牛式拉伸',
      description:
        '四肢着地，吸气时抬头塌腰（牛式），呼气时低头弓背（猫式）。缓慢交替。',
      frequency: '每天 2 次，每次 10 个来回',
      precautions: ['动作缓慢、有控制', '如有椎间盘问题请谨慎'],
    },
    {
      title: '儿童式放松',
      description:
        '跪坐，身体前屈，额头贴地，双臂向前伸展或放于体侧。深呼吸放松 1-2 分钟。',
      frequency: '每天 2 次',
      precautions: ['膝盖不适可在膝下垫软垫', '保持自然呼吸'],
    },
  ],

  back_pain: [
    {
      title: '核心稳定性训练 — 死虫式',
      description:
        '仰卧，四肢抬起，缓慢伸展对侧手臂和腿，保持腰部贴地。',
      frequency: '每天 2 组，每组每侧 10 次',
      precautions: ['全程保持腰部贴地', '动作要慢，控制呼吸'],
    },
    {
      title: '热敷放松',
      description:
        '对疼痛区域进行热敷 15-20 分钟（温度约 40-45°C），促进血液循环、缓解肌肉紧张。',
      frequency: '每天 1-2 次',
      precautions: ['不要直接敷在皮肤上（垫毛巾）', '如有红肿发热请冷敷'],
    },
  ],

  poor_posture: [
    {
      title: '姿势提醒练习',
      description:
        '每隔 30 分钟检查一次姿势：耳-肩-髋应在一条垂线上。设置手机提醒。',
      frequency: '每天多次',
      precautions: ['避免长时间低头看手机/平板', '学习桌高度要合适'],
    },
    {
      title: '核心激活',
      description:
        '坐姿，深吸气，呼气时收腹（想象肚脐贴向脊柱），保持 5 秒放松。',
      frequency: '每天多次，每次 10 个',
      precautions: ['正常呼吸，不要憋气', '不要过度收紧'],
    },
  ],

  growth_spurt_risk: [
    {
      title: '全身拉伸',
      description:
        '快速生长的青少年需要每日全身拉伸：站立双手上举→体侧屈→前屈摸脚尖。每个动作保持 15 秒。',
      frequency: '每天早晚各 1 次',
      precautions: ['动作温和，不要过度拉伸', '关注是否有不对称的紧绷感'],
    },
  ],
};

/**
 * 根据评估发现列表生成康复方案
 */
export function generateRehabPlan(findings: AssessmentFindings[]): RehabPlan {
  const allSuggestions: RehabSuggestion[] = [];
  const coreProblems: string[] = [];
  const dailyTips: string[] = [
    '保持正确的坐姿和站姿',
    '避免单侧背包，推荐双肩包',
    '每天至少 1 小时户外活动',
    '保证充足睡眠（青少年 8-10 小时）',
  ];

  for (const finding of findings) {
    const suggestions = RULES[finding.type];
    if (!suggestions) continue;

    // 取前 2 个建议
    const selected = suggestions.slice(0, finding.severity === 'mild' ? 1 : 2);
    allSuggestions.push(...selected);

    // 核心问题描述
    const severityLabel =
      finding.severity === 'significant' ? '较明显' : finding.severity === 'moderate' ? '存在' : '轻微';
    coreProblems.push(`${finding.detail || finding.type}: ${severityLabel}`);
  }

  // 去重（按 title）
  const seen = new Set<string>();
  const uniqueSuggestions = allSuggestions.filter((s) => {
    if (seen.has(s.title)) return false;
    seen.add(s.title);
    return true;
  });

  // 构建摘要
  const summary = coreProblems.length > 0
    ? `根据评估结果，主要有以下问题：${coreProblems.join('；')}。以下是对应的康复训练建议。`
    : '目前评估结果未发现需要特别关注的体态问题。建议保持良好姿势，定期复查。';

  return {
    summary,
    coreProblems,
    suggestions: uniqueSuggestions,
    dailyTips,
    warning:
      '⚠️ 以上建议仅供参考，不能替代专业医疗诊断。如症状持续或加重，请及时就医。',
  };
}

/**
 * 从已有评估数据中提取发现列表
 * TODO: 根据实际评估数据结构完善匹配逻辑
 */
export function extractFindingsFromAssessments(
  postureData?: Record<string, unknown>,
  romData?: Record<string, unknown>,
  screeningData?: Record<string, unknown>,
): AssessmentFindings[] {
  const findings: AssessmentFindings[] = [];

  // TODO: 从 postureData 中分析 PostureMetrics
  // 目前先用占位逻辑，后续根据实际字段完善
  if (postureData) {
    // 检查肩高差
    const shoulderDelta = (postureData as Record<string, number>).shoulderHeightDiff;
    if (shoulderDelta !== undefined && shoulderDelta > 1.5) {
      findings.push({
        type: 'shoulder_asymmetry',
        severity: shoulderDelta > 3 ? 'significant' : 'moderate',
        detail: `肩高差 ${shoulderDelta.toFixed(1)} cm`,
      });
    } else if (shoulderDelta !== undefined && shoulderDelta > 0.5) {
      findings.push({
        type: 'shoulder_asymmetry',
        severity: 'mild',
        detail: `肩高差 ${shoulderDelta.toFixed(1)} cm`,
      });
    }

    // 检查是否有体态问题标记
    const postureIssues = (postureData as Record<string, unknown>).issues as string[] | undefined;
    if (postureIssues && postureIssues.length > 0) {
      findings.push({
        type: 'poor_posture',
        severity: 'moderate',
        detail: `体态问题: ${postureIssues.join(', ')}`,
      });
    }
  }

  // TODO: 从 romData 中分析 ROM 受限情况
  if (romData) {
    findings.push({
      type: 'rom_limited',
      severity: 'mild',
      detail: '关节活动度评估数据（待细化）',
    });
  }

  // TODO: 从 screeningData 中提取筛查发现
  if (screeningData) {
    const adamResult = (screeningData as Record<string, unknown>).adamResult as string;
    if (adamResult === 'positive_significant') {
      findings.push({
        type: 'scoliosis_confirmed',
        severity: 'significant',
        detail: "Adam's测试：明显隆起",
      });
    } else if (adamResult === 'positive_suspect') {
      findings.push({
        type: 'scoliosis_confirmed',
        severity: 'moderate',
        detail: "Adam's测试：可疑隆起",
      });
    }
  }

  return findings;
}
