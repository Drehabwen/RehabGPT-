/**
 * Agent Report Slice — 报告解读 + 康复指导 + 随访管理
 *
 * 职责：评估数据解读、康复方案生成、随访提醒设置
 */
import type { AgentState } from './agentTypes';
import { interpretAssessmentData } from '../utils/reportInterpreter';
import { generateRehabPlan, extractFindingsFromAssessments } from '../utils/rehabGuidance';
import {
  getFollowupReminders,
  setFollowupReminder,
  getNextCheckDate,
} from '../utils/followupStorage';

// ── Slice 类型 ──
export interface AgentReportSlice {
  interpretReport: (dataType: string, data?: Record<string, unknown>) => Promise<string>;
  getRehabPlan: (findings?: Record<string, unknown>) => string;
  setFollowupReminder: (riskLevel: string) => void;
  checkDueReminders: () => void;
}

export function createAgentReportSlice(
  set: (partial: Partial<AgentState>) => void,
  get: () => AgentState,
): AgentReportSlice {
  return {
    // ── Report interpretation ──
    interpretReport: async (dataType, data) => {
      const { patientName, patientAge } = get();
      const result = await interpretAssessmentData(
        patientName || '用户',
        patientAge,
        dataType as 'posture' | 'rom' | 'scales' | 'screening' | 'overview',
        data || {},
      );
      return result.interpretation;
    },

    // ── Rehab guidance ──
    getRehabPlan: (assessmentData) => {
      const findings = extractFindingsFromAssessments(
        (assessmentData as Record<string, unknown>)?.posture as Record<string, unknown>,
        (assessmentData as Record<string, unknown>)?.rom as Record<string, unknown>,
        (assessmentData as Record<string, unknown>)?.screening as Record<string, unknown>,
      );
      const plan = generateRehabPlan(findings);
      const text = `${plan.summary}\n\n${plan.suggestions
        .map(
          (s, i) =>
            `**${i + 1}. ${s.title}**\n${s.description}\n频率: ${s.frequency}`,
        )
        .join('\n\n')}\n\n**日常注意：**\n${plan.dailyTips
        .map((t) => `• ${t}`)
        .join('\n')}\n\n${plan.warning}`;
      return text;
    },

    // ── Follow-up ──
    setFollowupReminder: (riskLevel) => {
      const { patientId, patientName } = get();
      if (!patientId) return;
      const nextDate = getNextCheckDate(riskLevel);
      setFollowupReminder({
        patientId,
        patientName,
        nextCheckDate: nextDate,
        riskLevel,
        notes: `建议${patientName}在${nextDate}前后完成下一次复测`,
        createdAt: new Date().toISOString(),
      });
    },

    checkDueReminders: () => {
      const { patientId } = get();
      if (!patientId) return;
      const reminders = getFollowupReminders();
      const hasDue = !!reminders[patientId] && new Date(reminders[patientId].nextCheckDate) <= new Date();
      set({ hasDueReminder: hasDue });
    },
  };
}
