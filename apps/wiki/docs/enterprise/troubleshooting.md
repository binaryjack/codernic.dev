# Troubleshooting & Diagnostics

Operating a complex, sovereign multi-agent system like Codernic Enterprise can sometimes yield environment-specific issues. This guide will help you diagnose and repair the most common failures from scratch.

## 1. Daemon Crash on Startup

**Symptom:** `codernic-enterprise` exits immediately with code `101`.
**Diagnosis:** 
- The daemon enforces a singleton lock. If a previous instance crashed ungracefully, a stale socket might be left behind.
- **Fix:** Manually remove the socket:
  ```bash
  rm /tmp/codernic.sock
  ```
- Additionally, ensure you possess a valid `enterprise.lic` inside `~/.codernicapp/`.

## 2. Pirsig Proxy Returning HTTP 429

**Symptom:** AI Agents or developers complain that completions fail with "Too Many Requests".
**Diagnosis:**
- The Pirsig Proxy uses a Strict Token Bucket `RateLimiterMiddleware`. The default limit is 100 requests per minute.
- **Fix:** If you are running massive bulk DAG evaluations, you may need to increase the limit in the environment of the proxy host:
  ```bash
  export PIRSIG_RATE_LIMIT=1000
  ```

## 3. OOM (Out Of Memory) / VRAM Exhaustion

**Symptom:** Models fail to load or generation crashes with `CUDA error: out of memory` or similar backend errors.
**Diagnosis:**
- Codernic's `TeamLoraTrainer` and the local Inference Engine compete for GPU VRAM.
- **Fix:** 
  1. Check the active VRAM utilization using the CLI: `codernic-cli status`
  2. Modify your `engine.json` to enforce strict compute ceilings:
  ```json
  "compute": {
    "vram_limit_gb": 16
  }
  ```

## 4. CRDT Sync Drops (Team Collaboration)

**Symptom:** Code edits made by an Agent in the UI do not sync to your VSCode extension.
**Diagnosis:**
- The internal `yrs` CRDT engine communicates over WebSocket `ws://127.0.0.1:49152` via binary buffers.
- **Fix:**
  - Verify no corporate firewall is blocking port `49152`.
  - Restart the daemon to flush the in-memory `CrdtState` (ensure manual git saves first).

## 5. Checking Audit Logs (SIEM)

If you need to trace why a specific action was blocked (e.g., AST Anonymizer stripped something, or OIDC auth failed), you can inspect the raw OpenTelemetry output.

By default, the `MockAuditLogger` and `Auditor` write telemetry to:
```bash
tail -f ~/.codernic/audit/audit_log.jsonl
```
