import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { selectIntrospectionEvents } from '../../store/dag.slice';
import type { AgentIntrospectionEvent } from '../../../../entities/kernel/model/types';

export const GalileusLanes: React.FC<{ widgetId?: string, 'data-testid'?: string }> = ({ widgetId, 'data-testid': dataTestId }) => {
  const events = useSelector(selectIntrospectionEvents);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (widgetId) {
      const target = document.getElementById(`widget-header-actions-${widgetId}`);
      if (target) setPortalTarget(target);
    }
  }, [widgetId]);

  // Parse and group introspection events by agent
  const { agents, arbitration } = useMemo(() => {
    const agentsMap: Record<string, AgentIntrospectionEvent[]> = {};
    const arbitrationEvents: AgentIntrospectionEvent[] = [];

    events.forEach((evt) => {
      // Logic to determine if it's router/arbitration or specific agent
      // Usually "step_id" or "type" can give clues. 
      // For now, if type implies galileus routing, we put it in arbitration.
      if (evt.type.includes('route') || evt.type.includes('galileus') || evt.type === 'dag_mutation') {
        arbitrationEvents.push(evt);
      } else {
        // Extract agent name from step_id or payload if available
        // Fallback to "Worker" if unknown
        const agentName = (evt.payload as { tool_name?: string })?.tool_name || evt.step_id || 'Worker Agent';
        // Normalize agent name slightly
        const normalizedName = agentName.split('-')[0] || agentName;
        
        if (!agentsMap[normalizedName]) {
          agentsMap[normalizedName] = [];
        }
        agentsMap[normalizedName].push(evt);
      }
    });

    return { agents: agentsMap, arbitration: arbitrationEvents };
  }, [events]);

  return (
    <div data-testid={dataTestId || 'default-galileus-lanes'} className="flex-1 w-full flex overflow-x-auto overflow-y-hidden bg-[#0d0d0f] p-2 gap-3 scrollbar-hide">
      
      {/* Agents Lanes */}
      {Object.entries(agents).map(([agentName, agentEvents], idx) => (
        <div 
          key={idx} 
          className="flex flex-col flex-1 min-w-[300px] shrink-0 bg-[#121214] border border-cyan-900/40 rounded-xl shadow-[0_0_15px_rgba(8,145,178,0.05)] overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(8,145,178,0.1)] hover:border-cyan-800/60"
        >
          <div className="px-4 py-3 bg-cyan-950/20 border-b border-cyan-900/30 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-cyan-400 font-mono tracking-wider">{agentName.toUpperCase()}</h3>
            <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded-full">LANE {idx + 1}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {agentEvents.map((evt, i) => (
              <div key={i} className="flex flex-col p-3 bg-[#1a1a1c] border border-zinc-800/80 rounded-lg">
                <span className="text-[10px] text-zinc-500 font-mono mb-1">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                <span className="text-xs text-zinc-300 font-semibold">{evt.type}</span>
                {evt.delta && <span className="text-[11px] text-zinc-400 mt-1 line-clamp-3">{evt.delta}</span>}
              </div>
            ))}
            {agentEvents.length === 0 && <div className="text-xs text-zinc-500 italic">Awaiting instructions...</div>}
          </div>
        </div>
      ))}

      {/* Galileus Arbitration Lane (Central/Floating) */}
      <div className="flex flex-col flex-1 min-w-[300px] shrink-0 bg-[#121214] border border-amber-900/40 rounded-xl shadow-[0_0_15px_rgba(217,119,6,0.05)] overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(217,119,6,0.1)] hover:border-amber-800/60 relative">
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping opacity-50"></div>
        {portalTarget && createPortal(
          <span className="text-[10px] bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full" title="Galileus Router">ARBITRATOR</span>,
          portalTarget
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {arbitration.length === 0 && (
            <div className="text-xs text-zinc-500 italic text-center mt-10">Monitoring swarm...</div>
          )}
          {arbitration.map((evt, i) => (
            <div key={i} className="flex flex-col p-3 bg-amber-950/10 border border-amber-900/30 rounded-lg relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-600/50"></div>
              <span className="text-[10px] text-zinc-500 font-mono mb-1">{new Date(evt.timestamp).toLocaleTimeString()}</span>
              <span className="text-xs text-amber-400 font-semibold">{evt.type}</span>
              {evt.delta && <span className="text-[11px] text-zinc-300 mt-1">{evt.delta}</span>}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
