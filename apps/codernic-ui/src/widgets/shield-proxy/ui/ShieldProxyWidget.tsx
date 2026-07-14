import React from 'react';
import { useSelector } from 'react-redux';
import {
  selectGlobalStatus,
} from '../../../entities/telemetry/model/telemetry-slice';
import { selectPirsigMetrics } from '../../../features/dag/store/dag.slice';

export interface ShieldProxyWidgetProps {}

export function ShieldProxyWidget({}: ShieldProxyWidgetProps) {
  const globalStatus = useSelector(selectGlobalStatus);
  const pirsig = useSelector(selectPirsigMetrics);

  return (
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#1e1e1e', height: '100%' }}>
      <h2>Codernic Shield (Pirsig Proxy)</h2>
      <p>Global System Status: <span style={{ color: globalStatus === 'ok' ? '#4ade80' : '#f87171' }}>{globalStatus.toUpperCase()}</span></p>
      
      {pirsig ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '15px', border: '1px solid #444', borderRadius: '8px' }}>
            <h3>Pirsig Analysis Status</h3>
            <p>Score KPI: <strong style={{ color: pirsig.kpi_score > 80 ? '#4ade80' : pirsig.kpi_score > 50 ? '#fbbf24' : '#f87171' }}>{pirsig.kpi_score}/100</strong></p>
            <p>Symbols Processed: {pirsig.symbols_count}</p>
          </div>

          <div style={{ padding: '15px', border: '1px solid #444', borderRadius: '8px' }}>
            <h3>Quality Flags</h3>
            {pirsig.qualitative_flags && pirsig.qualitative_flags.length > 0 ? (
              <ul style={{ paddingLeft: '20px' }}>
                {pirsig.qualitative_flags.map((flag: string, index: number) => (
                  <li key={index} style={{ marginBottom: '5px' }}>{flag}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#4ade80' }}>No issues flagged. Architecture is clean.</p>
            )}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #444', borderRadius: '8px' }}>
          <p>Loading Shield metrics...</p>
        </div>
      )}
    </div>
  );
}
