// ── Codernic Feature — Public API ────────────────────────────────────────────
// Feature-Sliced Design: All cross-feature imports must go through this index.

// Extension host API
export { CodernicWebviewProvider } from './api/codernic-webview-provider';
export { buildCodernicMessageHandler } from './model/codernic-message-handler';
export { setGlobalGalileusSessionId } from './model/galileus-handler';
