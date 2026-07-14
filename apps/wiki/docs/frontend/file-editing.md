# UI File Edition & Artifacts

Codernic is not just a chat window; it is a fully integrated engineering environment. When an AI agent proposes code, you shouldn't have to copy and paste it into your IDE.

## The Artifact Viewer

When the LLM generates a complete file or a significant code block, Codernic extracts this into an **Artifact**. 
- Artifacts appear in the right-hand panel of the UI.
- They feature rich syntax highlighting and structural outlines.

## Editing Files from the UI

You can interact with files directly from the web or desktop dashboard:

1. **Inline Edits:** If the AI makes a minor mistake in a proposed artifact, you can click into the Artifact Viewer and manually correct it before applying it to the disk.
2. **Applying Changes (Patching):** Once you are satisfied with the artifact, click **Apply to Workspace**. Codernic will safely patch your local filesystem.
3. **Revert:** If a change breaks your build, you can use the UI's built-in history stack to revert the file to its previous state.

## Team Collaboration
For Enterprise users, file editions made in the UI are synced via the underlying `yrs` CRDT engine. If an autonomous agent is editing `main.rs`, you will see those updates stream live in the Artifact Viewer, perfectly synchronized with your VSCode extension.
