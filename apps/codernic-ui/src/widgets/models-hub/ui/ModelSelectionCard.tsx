import React from 'react';

// Interfaces for our props
interface CoreHealthPayload {
  vram_used_gb?: number;
  memory_lock_limit?: string;
  total_ram_gb: number;
  has_cuda: boolean;
  has_rocm: boolean;
  has_metal: boolean;
}

export interface LocalModel {
  id: string;
  name: string;
  parameters: string;
  quantization: string;
  estimated_vram_gb: number;
  estimated_ram_gb: number;
}

interface ModelSelectionCardProps {
  model: LocalModel;
  systemHealth: CoreHealthPayload | null;
  onSelect: (modelId: string) => void;
}

export const ModelSelectionCard: React.FC<ModelSelectionCardProps> = ({ model, systemHealth, onSelect }) => {
  // If we don't have health data yet, assume it fits to avoid blocking UI, but show no warning.
  if (!systemHealth) {
    return (
      <div className="p-4 border border-slate-700 rounded-lg bg-slate-800">
        <h3 className="text-lg font-bold text-white">{model.name}</h3>
        <p className="text-sm text-slate-400">{model.parameters} | {model.quantization}</p>
        <button onClick={() => onSelect(model.id)} className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
          Load Model
        </button>
      </div>
    );
  }

  // Hardware capability logic
  const hasDedicatedVram = systemHealth.has_cuda || systemHealth.has_rocm;
  // Mac unified memory means VRAM == RAM effectively, but we'll treat it as high capacity if metal is present
  const availableVram = hasDedicatedVram ? (systemHealth.vram_used_gb || 0) : (systemHealth.has_metal ? systemHealth.total_ram_gb : 0);
  
  // Calculate if it fits entirely in VRAM (fastest)
  const fitsInVram = availableVram >= model.estimated_vram_gb;
  
  // Calculate if it fits in System RAM (offloading)
  const fitsInSystemRam = systemHealth.total_ram_gb >= model.estimated_ram_gb;

  // Determine Warning State (LM Studio Style)
  let statusColor = "border-emerald-500 bg-emerald-900/20 text-emerald-300";
  let statusIcon = "✅";
  let statusTitle = "Fits in VRAM (Full Speed)";
  let statusMessage = "This model will run entirely on your GPU, providing maximum inference speed.";

  if (!fitsInVram && fitsInSystemRam) {
    statusColor = "border-amber-500 bg-amber-900/20 text-amber-300";
    statusIcon = "⚠️";
    statusTitle = "Requires RAM Offloading (Slower)";
    statusMessage = `Model requires ${model.estimated_vram_gb}GB, but you only have ${availableVram.toFixed(1)}GB VRAM available. It will offload to System RAM, causing slower inference.`;
  } else if (!fitsInVram && !fitsInSystemRam) {
    statusColor = "border-rose-500 bg-rose-900/20 text-rose-300";
    statusIcon = "❌";
    statusTitle = "Exceeds System Resources";
    statusMessage = "This model requires more RAM/VRAM than your system has available. Attempting to load it will likely crash or freeze your machine.";
  }

  return (
    <div className="p-5 border border-slate-700 rounded-lg bg-slate-800 flex flex-col justify-between h-full hover:border-slate-500 transition-colors">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-slate-100">{model.name}</h3>
          <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded text-slate-300">
            {model.estimated_vram_gb}GB VRAM req.
          </span>
        </div>
        <p className="text-sm text-slate-400 mb-4">{model.parameters} Parameters | {model.quantization}</p>
        
        {/* LM Studio Style Warning Block */}
        <div className={`border-l-4 p-3 rounded-r mb-4 text-sm ${statusColor}`}>
          <div className="font-bold mb-1">{statusIcon} {statusTitle}</div>
          <p className="opacity-90">{statusMessage}</p>
        </div>
      </div>

      <button 
        onClick={() => onSelect(model.id)} 
        disabled={!fitsInVram && !fitsInSystemRam}
        className={`w-full py-2 rounded font-semibold transition-colors ${
          (!fitsInVram && !fitsInSystemRam) 
            ? "bg-slate-700 text-slate-500 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-500 text-white"
        }`}
      >
        {(!fitsInVram && !fitsInSystemRam) ? "Cannot Load" : "Load Model"}
      </button>
    </div>
  );
};
