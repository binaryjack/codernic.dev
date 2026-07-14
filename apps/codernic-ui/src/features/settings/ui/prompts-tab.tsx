import { useSelector } from 'react-redux';
import { selectPrompts } from '../../../entities/assets/model/assets-slice';

export function PromptsTab() {
  const prompts = Object.values(useSelector(selectPrompts) || {});

  if (prompts.length === 0) {
    return (
      <div className="text-[var(--vscode-descriptionForeground)] text-xs italic">
        No Codernic prompts found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className="p-3 border border-[#27272a] rounded bg-[#09090b] flex flex-col gap-1"
        >
          <div className="font-semibold text-[var(--vscode-foreground)] text-xs tracking-wide">
            {prompt.name || prompt.id}
          </div>
          {prompt.description && (
            <div className="text-[var(--vscode-descriptionForeground)] text-[11px] leading-relaxed">
              {prompt.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
