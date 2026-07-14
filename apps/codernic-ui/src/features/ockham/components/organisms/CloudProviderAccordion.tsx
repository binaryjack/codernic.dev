import React from 'react';
import { Accordion } from '@ai-agencee/ui';
import { ProviderCardHeader } from '../molecules/ProviderCardHeader';
import { CloudModelRow } from '../molecules/CloudModelRow';
import type { CloudProvider, CloudModel } from '../../../models/store/models.slice';

interface CloudProviderAccordionProps {
  provider: CloudProvider;
  models: CloudModel[];
  localProvider?: any;
  isModelConfigured: (modelId: string) => boolean;
  onAddModel: (model: CloudModel) => void;
  onSaveProvider: (providerId: string, apiKey: string, baseUrl: string) => void;
}

export function CloudProviderAccordion({
  provider,
  models,
  localProvider,
  isModelConfigured,
  onAddModel,
  onSaveProvider
}: CloudProviderAccordionProps) {
  return (
    <Accordion
      label={
        <ProviderCardHeader
          providerName={provider.name}
          providerId={provider.id}
          initialApiKey={localProvider?.content?.api_key || localProvider?.content?.apiKey}
          initialBaseUrl={localProvider?.content?.base_url || localProvider?.content?.baseUrl}
          onSave={(apiKey, baseUrl) => onSaveProvider(provider.id, apiKey, baseUrl)}
        />
      }
    >
      <div className="flex flex-col gap-1.5 mt-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
        {models.map(m => (
          <CloudModelRow
            key={m.id}
            model={m}
            isAdded={isModelConfigured(m.id)}
            onAdd={onAddModel}
          />
        ))}
        {models.length === 0 && (
          <div className="text-xs text-[var(--text-muted)] text-center py-4">
            No models available for this provider.
          </div>
        )}
      </div>
    </Accordion>
  );
}
