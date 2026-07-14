import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectLocalModels } from '../../../features/models/store/models.slice';
import { selectHardwareMetrics } from '../../../entities/telemetry/model/telemetry-slice';
import { ModelSelectionCard } from './ModelSelectionCard';
import { sendIntent } from '../../../shared/store/intent';
import { useTestId } from '@ai-agencee/ui';

export function ModelSelectionWidget({ dataTestId }: { dataTestId?: string }) {
  const { rootId, getTestId } = useTestId('model-selection-widget', dataTestId);
  const dispatch = useDispatch();
  
  const localModels = useSelector(selectLocalModels);
  const hardware = useSelector(selectHardwareMetrics);

  const systemHealth = hardware ? {
    total_ram_gb: hardware.totalRamGb,
    cpu_cores: hardware.cpuCores,
    has_cuda: hardware.hasCuda,
    has_rocm: hardware.hasRocm,
    has_metal: hardware.hasMetal,
    vram_used_gb: hardware.vramUsedGb || 0,
    memory_lock_limit: hardware.memoryLockLimit || undefined,
  } : null;

  // Use the first local model as an example if there are any
  const demoModel = localModels.length > 0 ? {
    id: localModels[0].name,
    name: localModels[0].name,
    parameters: 'Unknown',
    quantization: 'Unknown',
    estimated_vram_gb: Math.ceil(localModels[0].sizeBytes / 1024 / 1024 / 1024),
    estimated_ram_gb: Math.ceil(localModels[0].sizeBytes / 1024 / 1024 / 1024),
  } : null;

  if (!demoModel) {
    return (
      <div data-testid={rootId} className="p-4 bg-slate-800 text-slate-400 rounded-lg">
        No local models available to display in Model Selection Widget. Download a model first.
      </div>
    );
  }

  const handleSelect = (modelId: string) => {
    dispatch(sendIntent({ type: 'codernic:chat', payload: { text: `Load model ${modelId}` } }));
  };

  return (
    <div data-testid={rootId} className="w-full h-full">
      <ModelSelectionCard 
        model={demoModel} 
        systemHealth={systemHealth} 
        onSelect={handleSelect} 
      />
    </div>
  );
}
