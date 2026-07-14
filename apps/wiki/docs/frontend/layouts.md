# Dynamic Layout Engine

The Codernic Frontend features a highly customizable, dynamic layout engine designed to adapt to your specific workflow. Whether you are heavily focused on visual schema editing, chatting with the local AI, or monitoring VRAM, the UI bends to your needs.

## Configuring Layouts

The UI utilizes a resizable, draggable panel system. 

### Pre-defined Workspaces
By default, Codernic offers several layout profiles:
- **Default/Chat View:** Prioritizes the main chat interface and the code artifact viewer.
- **Agentic View (Structura):** Maximizes the visual node editor for designing DAG workflows, moving the chat to a smaller sidebar.
- **Monitoring View:** Expands the system logs, VRAM usage graphs, and network proxies for debugging structural agents.

### Customizing Your View
You can grab the borders of any panel to resize it. 
To toggle panels on or off, use the **View Settings** icon in the top right corner. The state of your layout is persisted automatically in your local browser cache, meaning it will survive a hard refresh.

## Aesthetics & Theming
Codernic is engineered with modern aesthetics (dark mode by default). The theming engine ensures that code snippets, terminal outputs, and artifacts are rendered with high contrast and smooth micro-animations.

We strictly avoid "stub" or basic Minimum Viable Product designs. Every UI component is built from our internal `packages/ui` library using Feature-Sliced Design (FSD) and Atomic principles.
