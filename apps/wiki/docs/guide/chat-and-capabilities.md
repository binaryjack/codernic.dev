# Chat & Capabilities

Welcome to the Codernic chat interface. This is your primary command center where you talk to the AI, orchestrate your team of agents, and write code safely.

## 1. Slash Commands

Codernic provides built-in slash commands for quick actions:

* `/goal` - Define a long-running goal. The agent will run autonomously and exhaustively until the objective is completed. Best for overnight tasks.
* `/schedule` - Schedule recurring cron jobs or one-off timers for background agent monitoring.
* `/browser` - Give the agent access to headless browser automation for end-to-end web testing or scraping.
* `/grill-me` - Trigger an interactive interview where the AI asks you clarifying questions before drafting a formal architecture plan.
* `/teamwork-preview` - Spin up a swarm of specialized background agents to solve a complex multi-file task in parallel.

## 2. Mentioning Context

You can bring specific files or folders to the AI's attention simply by mentioning them:
* `@src/main.rs` - The AI will carefully read this specific file.
* `@/docs/` - The AI will explore this folder.

> [!TIP]
> Codernic uses **Smart Workspace Memory**. You do not need to manually copy and paste code into the chat window. Just type the `@` symbol, and the system intelligently fetches exactly what the AI needs behind the scenes.

## 3. Delegating to Background Agents

When working on a large task, you don't have to do it alone. You can ask the main Codernic AI to delegate work. For example:
> "Spin up a research agent to analyze the database schema while you build the API endpoints."

Thanks to our **Workflow Manager**, Codernic acts as a traffic cop. It ensures that two agents never accidentally overwrite the same file at the same time, keeping your project perfectly safe.

## 4. The Codernic Shield (No Fake Code)

Whenever you ask Codernic to write code, it doesn't just blindly overwrite your files. It generates a draft, called an **Artifact**, and runs it through the **Codernic Shield**.
* If the AI makes a typo or writes a syntax error, the Shield catches it instantly.
* It forces the AI to correct its own mistake *before* the code is ever saved to your disk.
* You can review the Artifact on the right side of the screen, tweak it yourself, and click **Apply** when you're happy.
