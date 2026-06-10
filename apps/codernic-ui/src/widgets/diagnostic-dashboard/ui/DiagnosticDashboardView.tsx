import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  selectGlobalStatus,
  selectHardwareMetrics,
  selectBackendBridges,
  selectFrontendSecurity,
} from '../../../entities/telemetry/model/telemetry-slice';

export const DiagnosticDashboardView: React.FC = () => {
  const globalStatus = useSelector(selectGlobalStatus);
  const hardware = useSelector(selectHardwareMetrics);
  const backend = useSelector(selectBackendBridges);
  const frontend = useSelector(selectFrontendSecurity);

  useEffect(() => {
    const postDiagnosticRequest = () => {
      // @ts-ignore
      if (window.vscode) {
        // @ts-ignore
        window.vscode.postMessage({ type: 'codernic:request-full-diagnostic' });
      }
    };
    
    // Émettre instantanément un message
    postDiagnosticRequest();
    
    // Initialiser un setInterval local de 2000 ms
    const intervalId = setInterval(() => {
      postDiagnosticRequest();
    }, 2000);

    // Fonction de nettoyage (unmount)
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#1e1e1e', height: '100%' }}>
      <h2>System Diagnostic Dashboard</h2>
      <p>Global Status: <span style={{ color: globalStatus === 'ok' ? 'green' : 'red' }}>{globalStatus}</span></p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div style={{ padding: '15px', border: '1px solid #444', borderRadius: '8px' }}>
          <h3>Hardware</h3>
          {hardware ? (
            <ul>
              <li>VRAM Used: {hardware.vramUsedGb !== null ? `${hardware.vramUsedGb.toFixed(2)} GB` : 'N/A'}</li>
              <li>Memory Lock: {hardware.memoryLockLimit || 'N/A'}</li>
            </ul>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        <div style={{ padding: '15px', border: '1px solid #444', borderRadius: '8px' }}>
          <h3>Backend</h3>
          {backend ? (
            <ul>
              <li>RAG Init: {backend.ragInitialized ? 'Yes' : 'No'}</li>
              <li>Chunks Indexed: {backend.indexedChunksCount}</li>
              <li>MCP Bridges: {backend.activeMcpBridges.length}</li>
            </ul>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        <div style={{ padding: '15px', border: '1px solid #444', borderRadius: '8px' }}>
          <h3>Frontend/Network</h3>
          {frontend ? (
            <ul>
              <li>Active Watchers: {frontend.activeWatchers}</li>
            </ul>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </div>
  );
};
