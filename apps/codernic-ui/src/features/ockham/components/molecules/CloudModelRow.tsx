import React from 'react';
import { Button, IconCheckCircle, IconPlus } from '@ai-agencee/ui';
import type { CloudModel } from '../../../models/store/models.slice';

interface CloudModelRowProps {
  model: CloudModel;
  isAdded: boolean;
  onAdd: (model: CloudModel) => void;
}

export function CloudModelRow({ model, isAdded, onAdd }: CloudModelRowProps) {
  return (
    <div className="p-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-md)] flex flex-col gap-2 relative overflow-hidden flex-shrink-0 transition-colors duration-150 hover:bg-[var(--bg-card-hover)]">
      <div className="flex justify-between items-center gap-2">
        <div className="flex-1 overflow-hidden flex flex-col gap-0.5">
          <span className="text-[11px] font-bold text-[var(--amber-400)] overflow-hidden text-ellipsis whitespace-nowrap">
            {model.name}
          </span>
          <div className="flex items-center gap-2">
            {model.context_length && (
              <span className="text-[9px] font-mono text-[var(--text-muted)]">
                {model.context_length.toLocaleString()} ctx
              </span>
            )}
            {model.pricing && (
              <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)] border-l border-[var(--border-subtle)] pl-1.5">
                {model.pricing.prompt && <span>I: {model.pricing.prompt}</span>}
                {model.pricing.completion && <span>O: {model.pricing.completion}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center flex-shrink-0">
          {isAdded ? (
            <span className="badge badge-green text-[9px] gap-[3px]">
              <IconCheckCircle size={9} />
              Added
            </span>
          ) : (
            <Button
              variant="accent"
              size="xs"
              onClick={() => onAdd(model)}
              className="flex items-center gap-[3px]"
            >
              <IconPlus size={10} />
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
