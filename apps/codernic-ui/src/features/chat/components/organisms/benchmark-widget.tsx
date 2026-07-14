import { useEffect, useState } from 'react';
import { vscode } from '../../../../shared';
import { useSelector } from 'react-redux';
import { selectSandboxMode } from '../../../../entities/app/model/app-slice';

interface ModelBenchmarkInfo {
  model_id: string;
  provider: string;
  tokens_per_second?: number;
  quality_elo?: number;
  input_cost_per_m?: number;
  output_cost_per_m?: number;
  context_window?: number;
}

export function BenchmarkWidget({ models = ['gpt-4', 'claude-3-5-sonnet-20241022', 'qwen-2.5-coder', 'llama-3.1-405b'] }: { models?: string[] } = {}) {
  const [benchmarks, setBenchmarks] = useState<ModelBenchmarkInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const sandboxMode = useSelector(selectSandboxMode);

  useEffect(() => {
    if (models.length === 0) return;

    if (sandboxMode) {
      setBenchmarks(models.map(m => ({
        model_id: m,
        provider: m.includes('gpt') ? 'OpenAI' : m.includes('claude') ? 'Anthropic' : 'Local',
        tokens_per_second: m.includes('qwen') || m.includes('llama') ? 45.2 : undefined,
        quality_elo: 1250 + Math.floor(Math.random() * 100),
        input_cost_per_m: m.includes('gpt') || m.includes('claude') ? 5.0 : 0,
        context_window: 128000
      })));
      setLoading(false);
      return;
    }

    setLoading(true);
    vscode.postMessage({ type: 'codernic:get-model-benchmarks', payload: { models } });
    
    const handler = (e: MessageEvent) => {
      if (e.data.type === 'codernic:model-benchmarks-result') {
        setBenchmarks(e.data.payload);
        setLoading(false);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [models]);

  if (models.length === 0) return null;

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3 w-full my-2 text-xs text-[#a1a1aa]">
      <div className="font-semibold text-white mb-2">Artificial Analysis Benchmarks</div>
      {loading ? (
        <div className="animate-pulse">Loading capacities...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {benchmarks.map((b) => (
            <div key={b.model_id} className="bg-[#27272a] p-2 rounded">
              <div className="text-white truncate font-medium">{b.model_id}</div>
              <div className="text-[10px] text-[#71717a] uppercase mb-1">{b.provider}</div>
              {b.context_window && <div>Context: {(b.context_window / 1000).toFixed(0)}k</div>}
              {b.tokens_per_second && <div>Speed: {b.tokens_per_second} t/s</div>}
              {b.quality_elo && <div>Quality Elo: {b.quality_elo}</div>}
              {b.input_cost_per_m && <div>Cost (In): ${b.input_cost_per_m.toFixed(2)}/M</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
