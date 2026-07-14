# Debugging

If you encounter issues while using Codernic, the system provides several built-in tools to help diagnose and resolve the problem.

## Daemon Logs

The Codernic daemon logs all of its activities. You can find the log files in the standard system log directories or within the workspace's `.codernic/logs` folder.

To tail the logs in real-time, use the CLI:

```bash
codernic logs -f
```

## MCP Bridge Diagnostics

If your IDE is failing to connect or tools are not executing, check the MCP bridge status:

```bash
codernic mcp status
```

This will print out a diagnostic report including connection status, active tool bindings, and any recent errors encountered during tool execution.

## Common Issues

### Connection Refused
If you receive a "Connection Refused" error, ensure that the Codernic daemon is running.

```bash
codernic daemon start
```

### High Memory Usage
If the AI engine is consuming excessive memory, you may need to reduce the `max_context_tokens` in your configuration or limit the number of files the agent is allowed to read simultaneously.

### Submitting a Bug Report
When submitting a bug report, please include the output of `codernic system-info` which bundles your OS details, Codernic version, and recent crash logs into a convenient package.
