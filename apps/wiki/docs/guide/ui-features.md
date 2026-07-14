# UI Features

The Codernic UI provides a powerful visual dashboard for monitoring and interacting with the Codernic engine.

## The Dashboard

When you launch the Codernic UI, the main dashboard provides a holistic overview of your active workspaces.

- **Active Tasks**: See exactly what the AI agents are working on in real-time.
- **Resource Usage**: Monitor memory and CPU usage of the Codernic daemon.
- **Recent Logs**: A stream of the most recent actions taken by the agents.

## Agent Supervision

One of the core principles of Codernic is human-in-the-loop supervision. The UI excels at this by allowing you to:

1. **Pause/Resume Agents**: Instantly halt an agent if it's going down the wrong path.
2. **Inject Context**: Provide additional information or corrections to an agent mid-task.
3. **Approve Changes**: Review a diff of the proposed code changes before they are committed to your codebase.

## Configuration Editor

Instead of manually editing the `config.toml` file, the UI provides a rich configuration editor with syntax highlighting and schema validation.
