import React, { useMemo, useState } from 'react';
import { IconChevronRight, IconChevronDown } from '@ai-agencee/ui';
import { ErathosCanvas } from '../../../../widgets/dag-pipeline/ui/ErathosCanvas';

export interface DawNodeState {
  id: string;
  role: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  dependencies: string[];
}

export interface DawLanesSequencerProps {
  nodes: Record<string, DawNodeState>;
  onNodeClick?: (nodeId: string) => void;
  'data-testid'?: string;
}

export function DawLanesSequencer({ nodes, onNodeClick, 'data-testid': dataTestId }: DawLanesSequencerProps) {
  const [expandedLane, setExpandedLane] = useState<string | null>(null);

  const lanes = useMemo(() => {
    const groups: Record<string, DawNodeState[]> = {};
    Object.values(nodes).forEach(n => {
      const role = n.role || 'System';
      if (!groups[role]) groups[role] = [];
      groups[role].push(n);
    });
    return groups;
  }, [nodes]);

  const handleLaneDoubleClick = (role: string) => {
    setExpandedLane(expandedLane === role ? null : role);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'running': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse';
      case 'failed': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
      default: return 'bg-zinc-600';
    }
  };

  return (
    <div data-testid={dataTestId || 'daw-lanes-sequencer'} className="flex flex-col h-full w-full bg-[#0d0d0f] overflow-y-auto">
      <div className="flex flex-col w-full min-w-max">
        {/* Header */}
        <div className="flex border-b border-zinc-800 bg-[#121214] text-xs text-zinc-400 font-semibold uppercase tracking-wider select-none">
          <div className="w-48 px-4 py-2 border-r border-zinc-800 flex-shrink-0">Track</div>
          <div className="flex-1 px-4 py-2">Timeline</div>
        </div>

        {/* Lanes */}
        {Object.entries(lanes).map(([role, roleNodes]) => {
          const isExpanded = expandedLane === role;
          
          return (
            <div key={role} className="flex flex-col border-b border-zinc-800/50">
              {/* Lane Row */}
              <div 
                className="flex group hover:bg-zinc-800/20 transition-colors cursor-pointer select-none h-10"
                onDoubleClick={() => handleLaneDoubleClick(role)}
              >
                {/* Track Header */}
                <div className="w-48 px-4 py-2 border-r border-zinc-800 flex-shrink-0 flex items-center gap-2 bg-[#121214] group-hover:bg-[#1a1a1d] transition-colors">
                  <span className="text-zinc-500">
                    {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </span>
                  <span className="text-sm text-zinc-200 truncate font-medium">{role}</span>
                </div>
                
                {/* Track Timeline */}
                <div className="flex-1 px-4 py-2 flex items-center gap-4 relative">
                  {/* Subtle grid line */}
                  <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-zinc-800/50 -translate-y-1/2 pointer-events-none" />
                  
                  {roleNodes.map((node, index) => (
                    <div 
                      key={node.id}
                      className="relative z-10 flex items-center gap-2 group/node"
                      onClick={(e) => { e.stopPropagation(); onNodeClick?.(node.id); }}
                    >
                      {/* Connection line to next node if any */}
                      {index < roleNodes.length - 1 && (
                        <div className="absolute left-full top-1/2 w-4 h-[1px] bg-zinc-700 -translate-y-1/2" />
                      )}
                      
                      {/* Node Dot */}
                      <div 
                        className={`w-3 h-3 rounded-full ${getStatusColor(node.status)} cursor-pointer hover:scale-125 transition-transform`}
                        title={`${node.id} (${node.status})`}
                      />
                    </div>
                  ))}
                </div>
              </div>


            </div>
          );
        })}
      </div>
    </div>
  );
}
