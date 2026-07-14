import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { sendIntent } from '../../../shared/store/intent';
import { Heading, Text, Button } from '@ai-agencee/ui';
import { VisionManagerWidget } from './VisionManagerWidget';
import { getCodernicHttpUrl } from '../../../shared/config';
import { useTestId } from '@ai-agencee/ui';

export function SystemTab({ dataTestId }: { dataTestId?: string } = {}) {
  const { rootId, getTestId } = useTestId('system-tab', dataTestId);
  const dispatch = useDispatch();

  const handleOpenFolder = () => {
    dispatch(sendIntent({ type: 'codernic:open-global-config' }));
  };

  const handleRebuildIndex = () => {
    dispatch(sendIntent({ type: 'codernic:rebuild-index' }));
  };

  return (
    <div data-testid={rootId} className="flex flex-col gap-6 p-4">
      

      <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-300 rounded-md flex flex-col">
        <Heading data-testid={getTestId('heading-1')} level={3} className="flex items-center gap-2 m-0 text-red-500 mt-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          DANGER ZONE
        </Heading>
        <Text data-testid={getTestId('text-1')} className="my-2 leading-relaxed text-red-300">
          The Codernic installation folder contains global configuration files, routing rules, and local model bindings. 
          <strong> Modifying these files manually can break your Codernic installation.</strong>
        </Text>
        <Text data-testid={getTestId('text-2')} className="mt-2 leading-relaxed text-red-300">
          Only proceed if you know exactly what you are doing or if instructed by support.
        </Text>
        <Text data-testid={getTestId('text-3')} className="mt-3 leading-relaxed text-red-300">
          For further information, please read the <a href="https://codernic.dev" target="_blank" rel="noopener noreferrer" className="text-red-500 underline font-semibold">codernic.dev documentation</a> carefully before making any changes.
        </Text>
      </div>

      <div className="flex flex-col gap-3">
        <Heading data-testid={getTestId('heading-2')} level={4} className="m-0 text-white">Global Configuration Directory</Heading>
        <Text data-testid={getTestId('text-4')} variant="muted" className="m-0">
          Opens the <code>~/.codernic</code> folder in your operating system's file explorer.
        </Text>
        <Button data-testid={getTestId('button')}
          variant="secondary"
          onClick={handleOpenFolder}
          className="self-start flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          Open Codernic Folder
        </Button>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        <Heading data-testid={getTestId('heading-3')} level={4} className="m-0 text-white">Local Codebase Index</Heading>
        <Text data-testid={getTestId('text-5')} variant="muted" className="m-0">
          Triggers a full re-index of your current workspace using the configured embedding model. This enables semantic search (RAG).
        </Text>
        <Button data-testid={getTestId('button-1')}
          variant="secondary"
          onClick={handleRebuildIndex}
          className="self-start flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"></path>
          </svg>
          Rebuild Local Index
        </Button>
      </div>
      <div className="flex flex-col gap-3 mt-4">
        <Heading data-testid={getTestId('heading-4')} level={4} className="m-0 text-white">Factory Reset & Config Sync</Heading>
        <Text data-testid={getTestId('text-6')} variant="muted" className="m-0">
          Restores default configurations, downloads the latest schemas, and fetches required rules/prompts for your current Codernic version. 
          A backup of your existing <code>~/.codernic</code> config folder will be created automatically.
        </Text>
        <Button data-testid={getTestId('button-2')}
          variant="danger"
          onClick={() => dispatch(sendIntent({ type: 'codernic:factory-reset' }))}
          className="self-start flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
          Reset Configuration
        </Button>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        <Heading data-testid={getTestId('heading-banners')} level={4} className="m-0 text-white">Help & Warning Banners</Heading>
        <Text data-testid={getTestId('text-banners')} variant="muted" className="m-0">
          Restore all dismissed disclaimers, tutorials, and warning banners across the application.
        </Text>
        <Button data-testid={getTestId('button-banners')}
          variant="secondary"
          onClick={() => {
            if (typeof window !== 'undefined') {
              Object.keys(localStorage)
                .filter(key => key.startsWith('codernic_banner_dismissed_'))
                .forEach(key => localStorage.removeItem(key));
              window.location.reload();
            }
          }}
          className="self-start flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Reset Help Banners
        </Button>
      </div>

      {/* HARDWARE BENCHMARK */}
      <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-zinc-800">
        <Heading data-testid={getTestId('heading-5')} level={4} className="flex items-center gap-2 m-0 text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          Hardware VRAM Profiler
        </Heading>
        <Text data-testid={getTestId('text-7')} variant="muted" className="m-0">
          Run an isolated Codernic agent loop in the background to calculate precise VRAM delta and baseline Tokens Per Second (TPS) on your current hardware.
        </Text>
        <div className="mt-2">
          <HardwareBenchmarkWidget data-testid={getTestId('hardware-benchmark-widget')} />
        </div>
      </div>
      {/* VISION SUBSYSTEM */}
      <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-zinc-800">
        <Heading data-testid={getTestId('heading-6')} level={4} className="flex items-center gap-2 m-0 text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          Vision Subsystem Manager
        </Heading>
        <Text data-testid={getTestId('text-8')} variant="muted" className="m-0">
          Manage and test the Node.js vision microservice used by the web agents to capture and analyze DOM renderings.
        </Text>
        <div className="mt-2">
          <VisionManagerWidget data-testid={getTestId('vision-manager-widget')} />
        </div>
      </div>

    </div>
  );
}

function HardwareBenchmarkWidget({ dataTestId }: { dataTestId?: string } = {}) {
  const { rootId, getTestId } = useTestId('hardware-benchmark-widget', dataTestId);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runBenchmark = async () => {
    setRunning(true);
    setResult(null);
    try {
      const HTTP_URL = getCodernicHttpUrl();
          
      const response = await fetch(`${HTTP_URL}/api/benchmark/vram`, { method: 'POST' });
      const data = await response.json();
      setResult(data);
    } catch (e: unknown) {
      setResult({ success: false, error: (e instanceof Error ? e.message : String(e)) });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button data-testid={getTestId('button')}
        variant="primary"
        onClick={runBenchmark}
        disabled={running}
        className="self-start flex items-center gap-2"
      >
        {running ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Profiling Hardware...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Run VRAM Benchmark
          </>
        )}
      </Button>

      {result && (
        <div className={`p-4 mt-2 rounded-md border ${result.success ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <div className={`font-semibold mb-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
            {result.success ? 'Benchmark Complete' : 'Benchmark Failed'}
          </div>
          {result.success ? (
            <div className="grid grid-cols-2 gap-4 text-sm text-zinc-300">
              <div className="flex flex-col">
                <span className="text-zinc-500 text-xs uppercase font-medium">Execution Time</span>
                <span className="font-mono text-lg">{result.execution_time_seconds?.toFixed(2)}s</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 text-xs uppercase font-medium">VRAM Delta</span>
                <span className="font-mono text-lg">{result.vram_delta_gb?.toFixed(2)} GB</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 text-xs uppercase font-medium">Peak VRAM</span>
                <span className="font-mono text-lg">{result.peak_vram_gb?.toFixed(2)} GB</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-300 font-mono">
              {result.error || 'Unknown error occurred during benchmark.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
