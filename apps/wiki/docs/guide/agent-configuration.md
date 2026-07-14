# Configuring Agents & Workflows

In Codernic, intelligence is not treated as a single massive chat window. You can build a specialized AI team using **Agents**, **Technologies**, and **Visual Workflows**. These settings are automatically saved in your project's `.codernic/` folder so your entire team shares the same rules.

## 1. Technologies (Tech Rules)

Technologies define the broad coding rules for a specific framework or language.

**Best Practice:** Do not define generic languages (like "TypeScript"). Instead, define specific framework combinations you use (e.g., `react-vite-tailwind.json`).

**Structure Example:**
```json
{
  "id": "react-fsd",
  "name": "React (Feature-Sliced Design)",
  "rules": [
    "Always use atomic component structures.",
    "Place business logic exclusively inside the 'features' or 'entities' layers.",
    "Do not use default exports. Use named exports only."
  ]
}
```

## 2. Agents (`.codernic/agents/`)

Agents are specialized personas. An agent is defined by its role and the specific technologies it is allowed to use.

**Best Practice:** Follow the Single Responsibility Principle. Create a `UI_Architect` agent, a `Database_Migration` agent, and a `Security_Auditor` agent, rather than one monolithic `Senior_Developer` agent.

**Structure Example (`ui_architect.agent.json`):**
```json
{
  "id": "ui_architect",
  "role": "Frontend Layout Specialist",
  "system_prompt": "You are an expert in CSS Grid and Flexbox. Your sole responsibility is translating Figma specs into FSD compliant React components. Do not write backend database queries.",
  "technologies": ["react-fsd", "tailwind-v3"]
}
```

## 3. Visual Workflows

A Workflow is a visual map that wires multiple agents together to execute a complex task autonomously.

**Best Practice:** Use the Codernic UI's **Structura Editor** to draw your workflows interactively. Just drag and drop agent nodes and connect them with arrows. The UI handles saving everything behind the scenes.

**Workflow Example:**
1. Node A (`Security_Auditor`) parses a file and looks for vulnerabilities.
2. If vulnerabilities exist, route to Node B (`Security_Remediator`) to patch the code.
3. If clean, route to Node C (`Testing_Agent`) to write unit tests.

### Rule Merging (Team Rules)

When you ask an Agent to do something, Codernic automatically combines:
1. Your company-wide **Team Rules** (`conventions.json`).
2. The specific **Tech Rules** (e.g., React standards).
3. The Agent's specific job description.

This guarantees that the AI doesn't just write generic code, but writes code exactly the way your company expects it to be written.
