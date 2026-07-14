import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectLocalModels } from '../../../features/models/store/models.slice';
import { sendIntent } from '../../../shared/store/intent';
import { selectHardwareMetrics, selectBackendBridges } from '../../../entities/telemetry/model/telemetry-slice';
import { vscode } from '../../../shared/api/vscode-api';
import { IconTrash, IconDatabase } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

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
  
  const { rootId, getTestId } = useTestId('my-system-dashboard', undefined);
  const dispatch = useDispatch();
  const hardware = useSelector(selectHardwareMetrics);
  const backend = useSelector(selectBackendBridges);
  const localModels = useSelector(selectLocalModels);

  useEffect(() => {
    dispatch(sendIntent({ type: 'codernic:request-full-diagnostic' }));
  }, [dispatch]);

  // Combine Redux states into CoreHealthPayload format to keep the rest of the component unchanged
  const health: CoreHealthPayload | null = hardware && backend ? {
    vram_used_gb: hardware.vramUsedGb || 0,
    memory_lock_limit: hardware.memoryLockLimit || undefined,
    total_ram_gb: hardware.totalRamGb,
    cpu_cores: hardware.cpuCores,
    has_cuda: hardware.hasCuda,
    has_rocm: hardware.hasRocm,
    has_metal: hardware.hasMetal,
    rag_initialized: backend.ragInitialized,
    indexed_chunks_count: backend.indexedChunksCount
  } : null;

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

      {/* Local Models Storage Section */}
      <h3 className="text-lg font-bold mt-8 mb-4 text-slate-200 flex items-center gap-2">
        <IconDatabase data-testid={getTestId('icon-database')} size={20} className="text-blue-400" />
        Local Models Storage
      </h3>
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        {localModels.length === 0 ? (
          <div className="p-6 text-center text-slate-400 italic">No local models downloaded yet.</div>
        ) : (
          <ul className="divide-y divide-slate-700">
            {localModels.map((m) => {
              
  const { rootId, getTestId } = useTestId('local-models-item', undefined);
const sizeGb = (m.sizeBytes / 1024 / 1024 / 1024).toFixed(2);
              return (
                <li key={m.name} className="p-4 flex items-center justify-between hover:bg-slate-750 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-slate-200">{m.name}</span>
                    <span className="text-xs text-slate-500">{sizeGb} GB</span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${m.name}? This cannot be undone.`)) {
                        vscode.postMessage({ type: 'codernic:delete-model', payload: { name: m.name } });
                      }
                    }}
                    className="p-2 text-rose-400 hover:text-white hover:bg-rose-600 rounded-md transition-colors"
                    title="Delete local model"
                  >
                    <IconTrash data-testid={getTestId('icon-trash')} size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
