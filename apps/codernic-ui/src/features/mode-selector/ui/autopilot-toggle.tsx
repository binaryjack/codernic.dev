

interface AutopilotToggleProps {
  isAutoPilot: boolean;
  onToggle: () => void;
  'data-demo-desc'?: string;
}

export function AutopilotToggle({ 'data-testid': dataTestId, 'data-demo-desc': dataDemoDesc, isAutoPilot, onToggle }: AutopilotToggleProps & { 'data-testid'?: string }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs transition-all duration-300 border ${
        isAutoPilot 
          ? 'bg-blue-900/30 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
          : 'bg-zinc-800 text-zinc-400 border-zinc-700 shadow-sm'
      }`}
      title={isAutoPilot ? "Auto-Pilot: ON" : "Manual Mode: ON"}
      data-testid={dataTestId || "autopilot-toggle"}
      data-demo-desc={dataDemoDesc}
    >
      {isAutoPilot ? 'A' : 'M'}
    </button>
  );
}
