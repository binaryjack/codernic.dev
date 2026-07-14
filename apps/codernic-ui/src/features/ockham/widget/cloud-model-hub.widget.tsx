import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CloudProviderAccordion } from '../components/organisms/CloudProviderAccordion';
import {
  selectCloudDigest,
  selectCloudDigestLoading,
  selectCloudDigestError,
} from '../../models/store/models.slice';
import type { CloudModel } from '../../models/store/models.slice';
import { selectLlmProviders } from '../../../entities/assets/model/assets-slice';
import { IconLoader, IconAlertTriangle } from '@ai-agencee/ui';
import { sendIntent } from '../../../shared/store/intent';

export function CloudModelHubWidget() {
  const dispatch = useDispatch();
  const digest = useSelector(selectCloudDigest);
  const loading = useSelector(selectCloudDigestLoading);
  const error = useSelector(selectCloudDigestError);
  const localProviders = useSelector(selectLlmProviders) || {};

  const [query, setQuery] = useState('');
  const [matchType, setMatchType] = useState('Contains');

  useEffect(() => {
    if (!digest && !loading) {
      dispatch({ type: 'assets/fetchCloudModelsRequest' });
    }
  }, [digest, loading, dispatch]);

  const isModelConfigured = (modelId: string) => {
    return Object.values(localProviders).some(
      (provider: any) => provider?.models?.some((m: any) => m.id === modelId)
    );
  };

  const handleAddModel = (providerId: string, m: CloudModel) => {
    dispatch({
      type: 'assets/addCloudModelRequest',
      payload: {
        providerId,
        model: {
          id: m.id,
          name: m.name,
          contextWindow: m.context_length || 4096,
          pricing: m.pricing
        }
      }
    });
  };

  const handleSaveProvider = (providerId: string, apiKey: string, baseUrl: string) => {
    sendIntent('codernic:save-llm-provider', {
      type: 'remote',
      providerId,
      apiKey,
      baseUrl
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2.5">
        <IconLoader size={28} className="animate-spin text-[var(--amber-400)]" />
        <span className="text-[11px] text-[var(--text-muted)] tracking-[0.02em]">Loading Cloud Providers…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="badge badge-red text-[11px] py-1.5 px-2.5 rounded-[var(--radius-sm)] flex gap-1.5 items-start">
        <IconAlertTriangle size={12} />
        {error}
      </div>
    );
  }

  if (!digest) return null;

  const providers = digest.providers || [];
  
  // Basic frontend filtering for now. To properly use SQLite, we should dispatch codernic:ockham-search-models.
  const filteredModels = (digest.models || []).filter(m => {
    if (!query) return true;
    const q = query.toLowerCase();
    const n = m.name.toLowerCase();
    switch (matchType) {
      case 'Starts': return n.startsWith(q);
      case 'Ends': return n.endsWith(q);
      case 'Strict': return n === q;
      case 'Contains':
      default: return n.includes(q);
    }
  });

  return (
    <div className="flex flex-col h-full gap-4 p-2 overflow-y-auto scrollbar-thin">
      <div className="flex gap-2 items-center mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search models..."
          className="flex-1 px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md text-[11px] text-[var(--text-main)] focus:outline-none focus:border-[var(--amber-400)] transition-colors"
        />
        <select
          value={matchType}
          onChange={(e) => setMatchType(e.target.value)}
          className="px-2 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md text-[11px] text-[var(--text-main)] focus:outline-none focus:border-[var(--amber-400)] transition-colors"
        >
          <option value="Contains">Contains</option>
          <option value="Starts">Starts</option>
          <option value="Ends">Ends</option>
          <option value="Strict">Strict</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {providers.map(p => {
          const pModels = filteredModels.filter(m => m.provider === p.id);
          if (pModels.length === 0 && query !== '') return null;

          return (
            <CloudProviderAccordion
              key={p.id}
              provider={p}
              localProvider={localProviders[p.id]}
              models={pModels}
              isModelConfigured={isModelConfigured}
              onAddModel={(m) => handleAddModel(p.id, m)}
              onSaveProvider={handleSaveProvider}
            />
          );
        })}
      </div>
    </div>
  );
}
