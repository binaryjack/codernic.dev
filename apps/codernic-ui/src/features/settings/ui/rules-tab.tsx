import { useSelector } from 'react-redux';
import { selectRules } from '../../../entities/assets/model/assets-slice';

export function RulesTab() {
  const rules = useSelector(selectRules);

  if (!rules || rules.length === 0) {
    return (
      <div className="text-[var(--vscode-descriptionForeground)] text-xs italic">
        No Codernic rules found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className="p-3 border border-[#27272a] rounded bg-[#09090b] flex flex-col gap-1"
        >
          <div className="font-semibold text-[var(--vscode-foreground)] text-xs tracking-wide">
            {rule.name || rule.id}
          </div>
          {rule.description && (
            <div className="text-[var(--vscode-descriptionForeground)] text-[11px] leading-relaxed">
              {rule.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
