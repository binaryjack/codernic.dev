# Troubleshooting & Logs

When building complex software with deterministic AI, things occasionally go wrong. Hardware limits get hit, API connections timeout, or Galileus lock conflicts arise. 

Here is how to effectively debug Codernic.

## 1. Finding the Logs

Codernic is highly transparent. All system operations are logged locally to disk. You can find the primary logs in these locations:

* **The Daemon Log:** `~/.config/codernic/.agencee/daemon.log`
  This tracks the heartbeat of the Rust daemon, including file locks acquired by the **Galileus Gatekeeper**.
* **Compilation Errors:** If an automatic build fails, the **Pirsig AST Firewall** outputs the trace to `compile_error.txt` in your workspace root.
* **Job Logs:** Detailed background agent output is stored in `job_log.txt` (or `job_log_linux.txt`). 
* **Failed Logs Tracking:** Codernic tracks recurring errors in `new_failed_log.txt`.

> [!TIP]
> If a background task seems "stuck", check `daemon.log` to see if Galileus has paused the agent due to a file conflict with another process.

## 2. Pirsig (AST Firewall) Rejections

If the AI generated code but you don't see it in your files, **Pirsig** likely rejected it. 
Pirsig acts as a strict semantic firewall. If the AI hallucinates an import or breaks syntax, Pirsig throws an AST error and forces the AI to retry.

You can view Pirsig rejections in the **Walkthrough** artifact generated at the end of the task, or in the chat interface where Codernic outputs:
`[PIRSIG] ERROR: Unresolved import...`

## 3. Handling Monorepos

Codernic natively supports large Monorepos and multi-language workspaces. However, if context extraction via the **Ragtime Context Engine** is failing to find your dependencies, ensure that:
1. You have run `npm install`, `cargo build`, or equivalent, so that the dependency graph exists locally.
2. Your `.codernic-project/config.json` correctly points to the root of your workspace packages.
