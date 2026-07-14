# Quick Start: Your First Prompt

Congratulations on installing Codernic! This quick start guide will walk you through your first AI interaction, showing you how to get real work done safely.

## Step 1: Open the Chat

1. Open your project in Visual Studio Code.
2. Click the **Codernic Icon** on the left sidebar to open the chat panel.
3. Ensure your project is indexed (see [Installation](./installation.md) if you haven't run `codernic code:index`).

## Step 2: Asking for Code (The Safe Way)

Unlike standard chatbots where you have to copy and paste 500 lines of code, Codernic already knows your project thanks to its **Smart Workspace Memory**.

In the chat box, type the following:
> "Hey Codernic, look at `@src/main.rs` and write a new function that greets the user."

**What happens next?**
1. Codernic instantly reads `main.rs`.
2. It thinks about where to place the function without breaking your existing code.
3. It generates the code on the right side of the screen in an **Artifact Viewer**.

## Step 3: Reviewing & Applying (Codernic Shield)

You will notice the AI didn't instantly overwrite your file. It proposed a draft.

1. Look at the code in the Artifact Viewer.
2. The **Codernic Shield** has already checked this code behind the scenes. If the AI hallucinated an import that doesn't exist, the Shield would have forced the AI to fix it before showing it to you.
3. If you want to change the variable names, you can click into the Artifact Viewer and type manually.
4. When you are happy, click the green **Apply to Workspace** button.

Codernic will safely patch your file!

## Step 4: Try a Visual Workflow

Writing code file-by-file is great, but Codernic shines at team orchestration.

1. Click on the **Structura** tab at the top of the UI.
2. You will see a drag-and-drop canvas.
3. Try typing: `Create an agent called "Documentation_Writer"`
4. A new node will appear on the screen! You have just hired your first autonomous AI team member.

In the next sections, we will explore how to wire multiple agents together to automate entire tasks.

---

[Next: Chat & Capabilities](./chat-and-capabilities.md)
