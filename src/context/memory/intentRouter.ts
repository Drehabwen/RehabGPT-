/**
 * intentRouter — 意图路由器
 *
 * 两级分类：
 * 1. 第一级：加权关键词打分（纯规则，~1ms）
 * 2. 第二级：LLM 二次分类（仅在规则置信度不足时触发）
 *
 * 设计原则：
 * - 不用 LLM 做简单分类，省 token 省延迟
 * - 排他性关键词（exclusive）命中即确定意图
 * - 多意图且分数接近时标记 needsLLMClassification
 */

import type { IntentType, IntentResult } from '../model/types';

// ── 关键词规则表 ──

interface KeywordRule {
  keywords: string[];
  weight: number;
  exclusive?: boolean; // 排他性关键词，命中即确定意图
}

const INTENT_RULES: Record<IntentType, KeywordRule[]> = {
  training: [
    { keywords: ['训练', '打卡', '练习', '动作', '做了', '完成', '做了吗', '怎么做', '还练吗'], weight: 2 },
    { keywords: ['处方', '计划', '康复师让', '布置的', '还要练', '今天练', '今天做'], weight: 2 },
    { keywords: ['猫式', '桥式', '伸展', '靠墙站', '平板支撑', '小燕飞', '臀桥', '蚌式', '单杠'], weight: 3, exclusive: true },
    { keywords: ['今天练什么', '还要练吗', '训练内容', '训练计划'], weight: 3, exclusive: true },
  ],
  assessment: [
    { keywords: ['评估', '报告', '结果', '检查', '测了', '筛查', '风险', '等级', '严重', '程度'], weight: 2 },
    { keywords: ['侧弯多少度', '什么风险', '严重吗', '要不要紧'], weight: 2 },
    { keywords: ['康复师说', '康复师评估', '康复师结论', '康复师怎么说'], weight: 3, exclusive: true },
    { keywords: ['评估结果', '筛查结果', '报告出来了吗', '什么时候出结果'], weight: 3 },
  ],
  medical: [
    { keywords: ['疼', '痛', '酸', '不舒服', '难受', '症状', '驼背', '歪', '高低肩', '骨盆'], weight: 1 },
    { keywords: ['姿势', '坐姿', '站姿', '走路', '书包', '睡姿'], weight: 1 },
    { keywords: ['医院', '医生', '手术', '支具', '吃药', '拍片', 'X光', 'MRI'], weight: 3, exclusive: true },
    { keywords: ['严重吗', '要不要去', '会不会恶化', '要紧吗', '需要看医生吗'], weight: 3 },
    { keywords: ['背痛', '腰痛', '肩膀疼', '膝盖疼', '脖子疼'], weight: 2 },
  ],
  feedback: [
    { keywords: ['孩子说', '他觉得', '他不愿意', '太累了', '做不了', '不想做', '不喜欢'], weight: 2 },
    { keywords: ['有进步', '好多了', '变化', '改善了', '更直了', '有改善', '感觉好'], weight: 2 },
    { keywords: ['不想练', '抗拒', '哭', '闹', '不配合', '抵触', '不愿意练'], weight: 3, exclusive: true },
    { keywords: ['反馈', '告诉康复师', '跟康复师说'], weight: 2 },
  ],
  chat: [
    { keywords: ['你好', '谢谢', '再见', '晚安', '早安', '早上好', '晚上好'], weight: 1, exclusive: true },
    { keywords: ['小柱', '你是谁', '你能做什么', '你好吗', '在吗'], weight: 1 },
    { keywords: ['哈哈', '好的', '嗯嗯', '知道了', '了解了', '明白了'], weight: 1 },
  ],
};

// ── 分类函数 ──

export function classifyIntent(input: string): IntentResult {
  const normalized = input.trim();
  if (!normalized) {
    return {
      primary: 'chat',
      secondary: [],
      confidence: 0.5,
      matchedKeywords: [],
      needsLLMClassification: false,
    };
  }

  const scores: Record<IntentType, number> = {
    training: 0,
    assessment: 0,
    medical: 0,
    feedback: 0,
    chat: 0,
  };
  const matchedKeywords: string[] = [];
  let exclusiveIntent: IntentType | null = null;

  for (const [intent, rules] of Object.entries(INTENT_RULES)) {
    for (const rule of rules) {
      for (const kw of rule.keywords) {
        if (normalized.includes(kw)) {
          scores[intent as IntentType] += rule.weight;
          matchedKeywords.push(kw);
          if (rule.exclusive) {
            exclusiveIntent = intent as IntentType;
          }
        }
      }
    }
  }

  // 排他性关键词优先
  if (exclusiveIntent) {
    return {
      primary: exclusiveIntent,
      secondary: [],
      confidence: 0.95,
      matchedKeywords,
      needsLLMClassification: false,
    };
  }

  // 取最高分
  const sorted = (Object.entries(scores) as [IntentType, number][])
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return {
      primary: 'chat',
      secondary: [],
      confidence: 0.5,
      matchedKeywords: [],
      needsLLMClassification: false,
    };
  }

  const [primary, ...rest] = sorted;
  const totalScore = sorted.reduce((sum, [, s]) => sum + s, 0);
  const confidence = primary[1] / totalScore;

  return {
    primary: primary[0],
    secondary: rest.map(([intent]) => intent),
    confidence,
    matchedKeywords,
    // 多意图且分数接近 → 可能需要 LLM 二次判断
    needsLLMClassification: sorted.length >= 2 && confidence < 0.55,
  };
}

// ── LLM 二级分类（仅在规则不确定时调用）──

const CLASSIFY_INTENT_PROMPT = `你是一个意图分类器。请从以下选项中选择最匹配家长意图的一个单词：
training（训练相关）| assessment（评估相关）| medical（健康咨询）| feedback（家长反馈）| chat（闲聊）。

只回复一个单词，不要回复其他内容。`;

export function buildClassifyIntentPrompt(userInput: string): string {
  return `${CLASSIFY_INTENT_PROMPT}\n\n家长说："${userInput}"`;
}

/**
 * 从 LLM 回复中解析意图（容错处理）
 */
export function parseClassifyIntentResponse(response: string): IntentType {
  const cleaned = response.trim().toLowerCase();

  if (cleaned.includes('training')) return 'training';
  if (cleaned.includes('assessment')) return 'assessment';
  if (cleaned.includes('medical')) return 'medical';
  if (cleaned.includes('feedback')) return 'feedback';
  if (cleaned.includes('chat')) return 'chat';

  // fallback
  return 'chat';
}

// ── 触发要点提取的判断 ──

/**
 * 判断本轮对话是否值得触发要点提取。
 * 太短的闲聊不提取，节省 LLM 调用。
 */
export function shouldExtract(userMessage: string, assistantReply: string): boolean {
  if (!userMessage || userMessage.trim().length < 4) return false;

  // 纯问候/确认不提取
  const trivialPatterns = /^(你好|谢谢|好的|嗯|哦|拜拜|再见|晚安|早安|早上好|晚上好|知道了|了解了|明白了|哈哈)/;
  if (trivialPatterns.test(userMessage.trim())) return false;

  // AI 回复太短说明没有实质内容，不提取
  if (!assistantReply || assistantReply.trim().length < 20) return false;

  return true;
}
