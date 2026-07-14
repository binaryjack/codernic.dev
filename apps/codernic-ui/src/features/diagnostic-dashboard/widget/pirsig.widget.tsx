import { useSelector } from 'react-redux';
import { selectPirsigMetrics } from '../../../features/dag/store/dag.slice';
import { IconShield, IconCheck, IconX } from '@ai-agencee/ui';
import { ErrorBoundary } from '../../../app/ErrorBoundary';
import { useTestId } from '@ai-agencee/ui';

function DataRow({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-[#a1a1aa]">{label}</span>
      <span className="text-[11px] font-mono font-semibold" style={{ color: valueColor || 'var(--vscode-foreground)' }}>
        {value}
      </span>
    </div>
  );
}

export function PirsigWidget({ dataTestId }: { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('pirsig-widget', dataTestId);
const pirsig = useSelector(selectPirsigMetrics);

  const kpiColor = pirsig
    ? pirsig.kpi_score >= 80 ? 'var(--status-ok, #22c55e)'
    : pirsig.kpi_score >= 50 ? 'var(--amber-400, #fbbf24)'
    : 'var(--status-error, #ef4444)'
    : undefined;

  return (
    <ErrorBoundary data-testid={getTestId('error-boundary')}>
      <div data-testid={getTestId('root')} className="flex flex-col h-full w-full bg-[#09090b] overflow-hidden p-4">
        {pirsig ? (
          <div className="bg-[#111111] border border-[#27272a] rounded-md p-3 flex flex-col">
            <div style={{ height: '2px', background: `linear-gradient(90deg, ${kpiColor}, transparent)`, marginBottom: '10px', borderRadius: '1px' }} />

            <div data-testid="pirsig-score" className="flex items-baseline gap-1.5 mb-2">
              <IconShield data-testid={getTestId('icon-shield')} size={13} color={kpiColor} />
              <span className="text-[22px] font-extrabold font-mono tracking-tight" style={{ color: kpiColor }}>
                {pirsig.kpi_score.toFixed(1)}
              </span>
              <span className="text-[11px] text-[#a1a1aa]">/ 100</span>
            </div>

            <div className="h-px bg-[#27272a] my-1" />

            <div data-testid="pirsig-symbols">
              <DataRow data-testid={getTestId('data-row')} label="Symbols Parsed" value={pirsig.symbols_count} />
            </div>

            {pirsig.qualitative_flags && pirsig.qualitative_flags.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#27272a] flex flex-wrap gap-1.5">
                {pirsig.qualitative_flags.map((flag, idx) => {
                  
    const { rootId, getTestId } = useTestId('pirsigqualitativeflags-item', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
  const isOk = !flag.toLowerCase().match(/fail|error|warn|bad/);
                  return (
                    <span
                      key={idx}
                      data-testid={`pirsig-flag-${idx}`}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                        isOk ? 'bg-green-950/50 text-green-400 border border-green-900/50' : 'bg-red-950/50 text-red-400 border border-red-900/50'
                      }`}
                    >
                      {isOk ? <IconCheck data-testid={getTestId('icon-check')} size={9} /> : <IconX data-testid={getTestId('icon-x')} size={9} />}
                      {flag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[11px] text-[#a1a1aa] italic">
            Awaiting Pirsig AST analysis…
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
