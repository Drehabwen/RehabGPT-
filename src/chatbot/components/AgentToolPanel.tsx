import React from 'react';
import { Activity, Layers, ClipboardCheck, Camera, Heart } from 'lucide-react';
import type { AgentToolId } from '../store/useAgentStore';

interface AgentToolPanelProps {
  tools: AgentToolId[];
  onInvokeTool: (tool: AgentToolId) => void;
}

interface ToolDef {
  id: AgentToolId;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
}

const ALL_TOOLS: ToolDef[] = [
  { id: 'vision3', name: '体态', icon: Activity },
  { id: 'adams_camera', name: '前屈', icon: Camera },
  { id: 'rom', name: '活动度', icon: Layers },
  { id: 'scales', name: '量表', icon: ClipboardCheck },
  { id: 'psych', name: '心理', icon: Heart },
];

/**
 * 最小化工具快捷栏 — 嵌入在 ChatInput 上方
 * 一行小图标，轻量级快速访问
 */
export const AgentToolPanel: React.FC<AgentToolPanelProps> = ({
  tools,
  onInvokeTool,
}) => {
  const availableTools = ALL_TOOLS.filter((t) => tools.includes(t.id));

  if (availableTools.length === 0) return null;

  return (
    <div className="flex-shrink-0 flex items-center justify-center gap-1 px-4 pb-1">
      {availableTools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onInvokeTool(tool.id)}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          title={tool.name}
        >
          <tool.icon size={14} />
          <span className="whitespace-nowrap">{tool.name}</span>
        </button>
      ))}
    </div>
  );
};

export default AgentToolPanel;
