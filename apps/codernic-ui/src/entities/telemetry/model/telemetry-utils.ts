export interface TelemetryErrorPayload {
  type: string;
  title: string;
  source: string;
  origin: string;
  message: string;
  otherInfos?: any;
}

/**
 * Standardized Telemetry Error Logging
 * Format: yyyy-MM-dd HH:mm:ss - type - title - source - origin - message - other infos
 */
export function logTelemetryError(payload: TelemetryErrorPayload) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const otherInfosStr = payload.otherInfos ? JSON.stringify(payload.otherInfos) : '';
  
  const logMessage = `${timestamp} - ${payload.type} - ${payload.title} - ${payload.source} - ${payload.origin} - ${payload.message} - ${otherInfosStr}`;
  
  // Log locally
  console.error('[TELEMETRY ERROR]', logMessage);
  
  // Dispatch over IPC so the backend can record it
  // We use vscode postMessage because we are in a Webview context.
  if (typeof window !== 'undefined' && (window as any).vscode) {
    (window as any).vscode.postMessage({
      type: 'codernic:telemetry-log',
      payload: {
        level: 'ERROR',
        message: logMessage,
        raw: payload,
      }
    });
  }
}
