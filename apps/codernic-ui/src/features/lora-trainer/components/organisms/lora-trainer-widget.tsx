import { useState, useEffect } from 'react';
import { Heading, Text, Button } from '@ai-agencee/ui';
import { vscode } from '../../../../../shared';
import { getCodernicHttpUrl } from '../../../../../shared/config';
import { useTestId } from '@ai-agencee/ui';

interface TrainRequest {
  backend: string;
  family: string;
  dataset_path: string;
  base_model_path: string;
  output_path: string;
  rank: number;
  alpha: number;
}

export function LoraTrainerWidget() {
  
  const { rootId, getTestId } = useTestId('lora-trainer-widget', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
const [form, setForm] = useState<TrainRequest>({
    backend: 'rocm',
    family: 'qwen2',
    dataset_path: '~/.codernic/datasets/training_traces.jsonl',
    base_model_path: '~/.codernic/models/base',
    output_path: '~/.codernic/agents/LoRA/stress_backend_dev.safetensors',
    rank: 8,
    alpha: 16.0,
  });

  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // We listen to the window message event for WS/codernic telemetry events forwarded by App.tsx
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'WS/codernic:lora-started') {
        setStatus('running');
        setLogs((prev) => [...prev, 'LoRA Distillation Task Started']);
      } else if (e.data?.type === 'WS/codernic:lora-done') {
        setStatus('done');
        setLogs((prev) => [...prev, 'LoRA Distillation Task Completed Successfully.']);
      } else if (e.data?.type === 'WS/codernic:lora-error') {
        setStatus('error');
        setLogs((prev) => [...prev, `LoRA Distillation Task Failed: ${e.data?.payload?.error}`]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'rank' || name === 'alpha' ? Number(value) : value,
    }));
  };

  const handleTrain = async () => {
    setStatus('running');
    setLogs(['Submitting training request to Daemon...']);
    
    try {
      const HTTP_URL = getCodernicHttpUrl();
          
      const response = await fetch(`${HTTP_URL}/api/lora/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      
      if (!data.success) {
        setStatus('error');
        setLogs(prev => [...prev, `Failed to submit: ${data.message}`]);
      } else {
        setLogs(prev => [...prev, data.message]);
      }
    } catch (e: unknown) {
      setStatus('error');
      setLogs(prev => [...prev, `Network error: ${(e instanceof Error ? e.message : String(e))}`]);
    }
  };

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 w-full text-[#a1a1aa] flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Heading data-testid={getTestId('heading')} level={4} className="m-0 text-white flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
            <path d="M12 2v20"></path>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          LoRA Distillation Engine
        </Heading>
        <Text data-testid={getTestId('text')} variant="muted" className="text-xs">
          Fine-tune a custom LoRA adapter directly from your workspace RAG traces. Distill high-quality agent trajectories back into smaller models.
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase font-medium text-zinc-500">Backend</label>
          <select 
            name="backend" 
            value={form.backend} 
            onChange={handleChange}
            className="bg-[#27272a] border border-[#3f3f46] rounded p-1.5 text-white focus:outline-none focus:border-amber-500"
            disabled={status === 'running'}
          >
            <option value="rocm">AMD ROCm (HIP)</option>
            <option value="cuda">NVIDIA CUDA</option>
            <option value="mlx">Apple Metal (MLX)</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase font-medium text-zinc-500">Model Family</label>
          <select 
            name="family" 
            value={form.family} 
            onChange={handleChange}
            className="bg-[#27272a] border border-[#3f3f46] rounded p-1.5 text-white focus:outline-none focus:border-amber-500"
            disabled={status === 'running'}
          >
            <option value="qwen2">Qwen 2</option>
            <option value="llama3">Llama 3</option>
            <option value="mistral">Mistral</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase font-medium text-zinc-500">Rank (r)</label>
          <input 
            type="number" 
            name="rank" 
            value={form.rank} 
            onChange={handleChange}
            className="bg-[#27272a] border border-[#3f3f46] rounded p-1.5 text-white focus:outline-none focus:border-amber-500"
            disabled={status === 'running'}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase font-medium text-zinc-500">Alpha</label>
          <input 
            type="number" 
            name="alpha" 
            value={form.alpha} 
            onChange={handleChange}
            className="bg-[#27272a] border border-[#3f3f46] rounded p-1.5 text-white focus:outline-none focus:border-amber-500"
            disabled={status === 'running'}
          />
        </div>
        
        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-xs uppercase font-medium text-zinc-500">Dataset JSONL Path</label>
          <input 
            type="text" 
            name="dataset_path" 
            value={form.dataset_path} 
            onChange={handleChange}
            className="bg-[#27272a] border border-[#3f3f46] rounded p-1.5 text-white focus:outline-none focus:border-amber-500"
            disabled={status === 'running'}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-[#27272a] flex items-center justify-between">
        <Button data-testid={getTestId('button')} 
          variant="primary" 
          onClick={handleTrain}
          disabled={status === 'running'}
          className="flex items-center gap-2"
        >
          {status === 'running' ? (
            <>
              <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Training...
            </>
          ) : 'Start Distillation'}
        </Button>

        {status === 'done' && <span className="text-green-400 font-semibold text-xs">✔ Completed</span>}
        {status === 'error' && <span className="text-red-400 font-semibold text-xs">✖ Failed</span>}
      </div>

      {logs.length > 0 && (
        <div className="bg-black/50 p-2 rounded border border-[#3f3f46] text-xs font-mono max-h-32 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
