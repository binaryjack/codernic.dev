# Understanding Artifacts

Artifacts are the lifeblood of Codernic's deterministic workflow. Instead of spewing unformatted text into a chat window, Codernic writes structured markdown documents to disk. This forces the AI to think logically and allows you to intervene before code is changed.

## The Three Core Artifacts

### 1. `implementation_plan.md`
When you request a complex change, Codernic enters **Planning Mode**. 
* It researches your codebase without mutating any files.
* It generates an `implementation_plan.md` detailing the files to modify, design decisions, and any clarifying questions.
* **Your Role:** Review the plan. You must explicitly approve it before the agent proceeds to execution.

### 2. `task.md`
Once execution begins, Codernic generates a `task.md` artifact.
* This is a living checklist.
* The agent updates items from `[ ]` (uncompleted) to `[/]` (in-progress) to `[x]` (completed) as it works.
* You can monitor this file to see exactly what the background agent is doing at any given moment.

### 3. `walkthrough.md`
When the task is complete, Codernic outputs a `walkthrough.md`.
* This document summarizes what was changed.
* It often includes code diffs, testing results, or Mermaid diagrams visually explaining the new architecture.

## How to Interact with Artifacts

> [!WARNING]
> Unless explicitly asked by the AI, you should avoid manually editing the contents of `task.md` or `walkthrough.md`. The AI relies on these as its state machine. You are encouraged to read them, but provide feedback via the Chat interface rather than editing the files directly.
