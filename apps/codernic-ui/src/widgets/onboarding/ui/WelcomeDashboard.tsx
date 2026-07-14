import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectSandboxMode } from '../../../entities/app/model/app-slice';

// Using the same CoreHealthPayload structure
interface CoreHealthPayload {
  total_ram_gb: number;
  cpu_cores: number;
  has_cuda: boolean;
  has_rocm: boolean;
  has_metal: boolean;
}

import { selectHardwareMetrics } from '../../../entities/telemetry/model/telemetry-slice';

export const WelcomeDashboard: React.FC = () => {
  const hardware = useSelector(selectHardwareMetrics);
  
  const health: CoreHealthPayload | null = hardware ? {
    total_ram_gb: hardware.totalRamGb,
    cpu_cores: hardware.cpuCores,
    has_cuda: hardware.hasCuda,
    has_rocm: hardware.hasRocm,
    has_metal: hardware.hasMetal,
  } : null;
  const [ollamaDetected, setOllamaDetected] = useState(false);
  const [lmStudioDetected] = useState(false);
  
  const sandboxMode = useSelector(selectSandboxMode);

  useEffect(() => {
    // Attempt real Daemon connection or simulate it
    let isMounted = true;
    
    // Fallback: If after 2 seconds health is still not set and we aren't already in demo mode,
    // it means the real daemon is missing. Proactively offer the demo mode!
    const timeout = setTimeout(() => {
      if (!health && !sandboxMode) {
        console.warn("Daemon handshake timed out. Falling back to Demo Mode.");
        localStorage.setItem('FORCE_SANDBOX_MODE', 'true');
        window.location.reload();
      }
    }, 2000);

    // Simulated background port polling
    setTimeout(() => setOllamaDetected(true), 1500);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [health, sandboxMode]);

  if (!health) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-slate-400 animate-pulse">Initializing Codernic Engine...</div>
      </div>
    );
  }

  // Hardware Tier Logic
  const isTier1 = (health.has_cuda || health.has_rocm || health.has_metal) && health.total_ram_gb >= 32;

  const handleStartTour = () => {
    if (!sandboxMode) {
      // If not already in demo mode, activate it and reload
      localStorage.setItem('FORCE_SANDBOX_MODE', 'true');
      window.location.reload();
      return;
    }
    // We send a CustomEvent that the MockDaemonBridge will listen for
    window.dispatchEvent(new CustomEvent('START_GRAND_TOUR'));
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-700 p-5 rounded-lg shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse"></div>
          <h1 className="text-xl font-bold text-white tracking-tight">Codernic Engine Connected</h1>
        </div>
        <div className="text-sm font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded">Version: v1.0.0 (Up to date)</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: HARDWARE VERDICT */}
        <div className="col-span-1 space-y-6">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider text-sm text-slate-400">Hardware Verdict</h2>
            
            <div className="space-y-3 mb-6 bg-slate-900/50 p-4 rounded border border-slate-700/50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">RAM</span>
                <span className="text-slate-200 font-mono">{health.total_ram_gb} GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Compute</span>
                <span className="text-slate-200 font-mono">
                  {health.has_cuda ? 'CUDA' : health.has_metal ? 'Metal' : 'CPU Only'}
                </span>
              </div>
            </div>

            {isTier1 ? (
              <div className="p-4 border-l-4 border-emerald-500 bg-emerald-900/20 text-emerald-300 text-sm rounded-r">
                <span className="font-bold block mb-1 text-base">Tier 1: The Beast</span>
                We highly recommend using <span className="font-semibold text-white">Local Models</span> for zero-cost, completely private inference.
              </div>
            ) : (
              <div className="p-4 border-l-4 border-amber-500 bg-amber-900/20 text-amber-300 text-sm rounded-r">
                <span className="font-bold block mb-1 text-base">Tier 2: The Hybrid</span>
                Your system is capable, but for heavy lifting, we recommend connecting a <span className="font-semibold text-white">Cloud API</span>.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK START SELECTION */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">How would you like to run Codernic?</h2>
          <p className="text-slate-400 mb-6">Select your inference engine. You can change this anytime in Settings.</p>

          <div className="grid grid-cols-1 gap-4">
            {/* INTERACTIVE TOUR BUTTON */}
            <div 
              onClick={handleStartTour}
              className="group relative bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400 hover:brightness-110 p-6 rounded-lg cursor-pointer transition-all shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 tracking-tight">🚀 Take the Grand Tour</h3>
                  <p className="text-amber-100 text-sm">Experience the Codernic Engine in a simulated sandbox. See how it thinks, plans, and executes.</p>
                </div>
                <span className="px-3 py-1 bg-amber-900/30 text-white text-xs font-semibold rounded border border-amber-400 uppercase tracking-wider">Demo Mode</span>
              </div>
            </div>

            {/* Option A: Download Local */}
            <div className="group relative bg-slate-800 border border-slate-700 hover:border-blue-500 p-6 rounded-lg cursor-pointer transition-all shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">Download a Local Model</h3>
                  <p className="text-sm text-slate-400">Browse the Models Hub to download optimized GGUF models directly to your machine.</p>
                </div>
                {isTier1 && <span className="px-3 py-1 bg-emerald-900/40 text-emerald-400 text-xs font-semibold rounded border border-emerald-800 uppercase tracking-wider">Recommended</span>}
              </div>
            </div>

            {/* Option B: Local Server */}
            <div className="group relative bg-slate-800 border border-slate-700 hover:border-purple-500 p-6 rounded-lg cursor-pointer transition-all shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">Connect to Local Server</h3>
                  <p className="text-sm text-slate-400">Connect to an existing Ollama or LM Studio instance running on your network.</p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <div className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-2 transition-colors ${ollamaDetected ? 'bg-purple-900/40 text-purple-300 border border-purple-800' : 'bg-slate-900 border border-slate-800 text-slate-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${ollamaDetected ? 'bg-purple-500 shadow-[0_0_5px_#a855f7]' : 'bg-slate-700'}`}></div>
                  <span>Ollama (:11434)</span>
                </div>
                <div className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-2 transition-colors ${lmStudioDetected ? 'bg-purple-900/40 text-purple-300 border border-purple-800' : 'bg-slate-900 border border-slate-800 text-slate-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${lmStudioDetected ? 'bg-purple-500 shadow-[0_0_5px_#a855f7]' : 'bg-slate-700'}`}></div>
                  <span>LM Studio (:1234)</span>
                </div>
              </div>
            </div>

            {/* Option C: Cloud API */}
            <div className="group relative bg-slate-800 border border-slate-700 hover:border-amber-500 p-6 rounded-lg cursor-pointer transition-all shadow-md">
               <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">Use Cloud API</h3>
                  <p className="text-sm text-slate-400">Connect to OpenAI, Anthropic, or DeepSeek via API Key. Semantic search runs locally to save tokens.</p>
                </div>
                {!isTier1 && <span className="px-3 py-1 bg-amber-900/40 text-amber-400 text-xs font-semibold rounded border border-amber-800 uppercase tracking-wider">Recommended</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
