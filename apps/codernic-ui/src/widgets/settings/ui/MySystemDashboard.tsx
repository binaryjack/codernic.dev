import React, { useEffect, useState } from 'react';

// This interface matches CoreHealthPayload from the Rust protocol
interface CoreHealthPayload {
  vram_used_gb?: number;
  memory_lock_limit?: string;
  rag_initialized: boolean;
  indexed_chunks_count: number;
  total_ram_gb: number;
  cpu_cores: number;
  has_cuda: boolean;
  has_rocm: boolean;
  has_metal: boolean;
}

export const MySystemDashboard: React.FC = () => {
  const [health, setHealth] = useState<CoreHealthPayload | null>(null);

  // In a real implementation, this would subscribe to a Redux/Zustand store or WebSocket
  // For now, we mock the fetch to demonstrate the UI layout
  useEffect(() => {
    // Simulated fetch from Rust Daemon
    setHealth({
      total_ram_gb: 16.0,
      cpu_cores: 8,
      has_cuda: false,
      has_rocm: false,
      has_metal: false,
      rag_initialized: true,
      indexed_chunks_count: 1420
    });
  }, []);

  if (!health) return <div className="p-6 text-slate-400">Detecting Hardware Capabilities...</div>;

  const determineTier = (hw: CoreHealthPayload) => {
    if (hw.has_cuda || hw.has_rocm || (hw.has_metal && hw.total_ram_gb > 32)) {
      if ((hw.vram_used_gb || 0) > 12 || hw.total_ram_gb >= 32) return 'Tier 1';
    }
    if (hw.total_ram_gb >= 16) return 'Tier 2';
    return 'Tier 3';
  };

  const tier = determineTier(health);

  return (
    <div className="p-6 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-700">
      <h2 className="text-2xl font-bold mb-6 tracking-tight text-slate-100">My System Capabilities</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Total System RAM</div>
          <div className="text-2xl font-mono text-blue-400">{health.total_ram_gb.toFixed(1)} GB</div>
        </div>
        <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">CPU Cores</div>
          <div className="text-2xl font-mono text-purple-400">{health.cpu_cores} Physical</div>
        </div>
        <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">GPU Compute API</div>
          <div className="text-2xl font-mono text-emerald-400">
            {health.has_cuda ? 'CUDA ' : ''}
            {health.has_rocm ? 'ROCm ' : ''}
            {health.has_metal ? 'Metal ' : ''}
            {!(health.has_cuda || health.has_rocm || health.has_metal) ? 'None Detected' : ''}
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-4 text-slate-200">Codernic Strategic Advice</h3>
      <div className="space-y-4">
        {tier === 'Tier 1' && (
          <div className="border-l-4 border-emerald-500 bg-emerald-900/20 p-5 rounded-r-lg">
            <h4 className="font-bold text-emerald-400 mb-2">Tier 1: The Beast (Local First)</h4>
            <p className="text-emerald-100/80 leading-relaxed">Your system is highly capable. We strongly recommend running Qwen2.5-Coder locally using GGUF Q4_K_M quantization for zero-cost, completely private inference.</p>
          </div>
        )}
        {tier === 'Tier 2' && (
          <div className="border-l-4 border-amber-500 bg-amber-900/20 p-5 rounded-r-lg">
            <h4 className="font-bold text-amber-400 mb-2">Tier 2: The Hybrid (Smart Splitting)</h4>
            <p className="text-amber-100/80 leading-relaxed">Your system can handle local models, but you may experience slowdowns on large architectural tasks. We recommend using a lightweight local model (Qwen 1.5B) for the Reviewer agents, and an API (Claude 3.5 Sonnet) for the heavy Orchestrator planning.</p>
          </div>
        )}
        {tier === 'Tier 3' && (
          <div className="border-l-4 border-rose-500 bg-rose-900/20 p-5 rounded-r-lg">
            <h4 className="font-bold text-rose-400 mb-2">Tier 3: The Cloud Reliant (API First)</h4>
            <p className="text-rose-100/80 leading-relaxed">Running deep local models on this hardware will cause severe system lag. We highly recommend using a Commercial API. Because Codernic performs semantic search locally via Ragtime, your API token costs will remain extremely low compared to standard tools.</p>
          </div>
        )}
      </div>
    </div>
  );
};
