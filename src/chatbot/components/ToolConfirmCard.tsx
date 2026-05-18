/**
 * ToolConfirmCard — LLM 建议工具时的内嵌确认卡片
 *
 * 出现在对话流中，让用户确认或跳过 LLM 建议的工具调用。
 * 防止 LLM 误判导致用户被迫进入不相关的工具界面。
 */
import React from 'react';
import { Activity, Layers, ClipboardCheck, Camera, Heart } from 'lucide-react';
import type { AgentToolId } from '../store/useAgentStore';

interface ToolConfirmCardProps {
  toolId: string;
  reason: string;
  onConfirm: (toolId: string) => void;
  onDismiss: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TOOL_META: Record<string, { name: string; icon: React.ComponentType<any> }> = {
  vision3: { name: '体态评估', icon: Activity },
  invoke_vision3: { name: '体态评估', icon: Activity },
  rom: { name: '关节活动度', icon: Layers },
  invoke_rom: { name: '关节活动度', icon: Layers },
  scales: { name: '功能评估', icon: ClipboardCheck },
  invoke_scales: { name: '功能评估', icon: ClipboardCheck },
  adams_camera: { name: "Adam's 前屈测试", icon: Camera },
  invoke_adams_camera: { name: "Adam's 前屈测试", icon: Camera },
  psych: { name: '心理筛查', icon: Heart },
  invoke_psych: { name: '心理筛查', icon: Heart },
};

export const ToolConfirmCard: React.FC<ToolConfirmCardProps> = ({
  toolId,
  reason,
  onConfirm,
  onDismiss,
}) => {
  const meta = TOOL_META[toolId];
  const toolName = meta?.name || toolId;
  const Icon = meta?.icon;

  return (
    <div className="my-2 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={18} className="text-[var(--brand)]" />}
        <span className="text-sm font-semibold text-slate-800">
          建议使用：{toolName}
        </span>
      </div>
      {reason && (
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">{reason}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onConfirm(toolId)}
          className="flex-1 rounded-xl bg-[var(--brand)] py-2 text-xs font-semibold text-white transition-all hover:bg-[var(--brand-strong)] active:scale-[0.98]"
        >
          确认
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-xs font-medium text-slate-500 transition-all hover:bg-slate-50 active:scale-[0.98]"
        >
          跳过
        </button>
      </div>
    </div>
  );
};

export default ToolConfirmCard;
