# Using Erathos (Visual Grounding)

**Erathos** is Codernic's visual grounding engine. Large Language Models often hallucinate when dealing with deeply nested logic because they lack spatial awareness. Erathos solves this by converting your codebase into visual representations before the AI plans its execution.

## Triggering Erathos Visuals

When you ask a complex architectural question, Codernic will automatically trigger Erathos.
Alternatively, you can manually request visual artifacts:
> "Map out the authentication flow using Erathos."

## What Erathos Generates

Erathos generates **Mermaid.js** diagrams that are embedded directly into your `implementation_plan.md` or `walkthrough.md` artifacts. 

These diagrams include:
1. **Component Dependencies:** Visualizing how React components or Rust crates import each other.
2. **State Machines:** Mapping out Redux reducers or Finite State Machines.
3. **Data Flows:** Showing how data moves from your API routes through the `Ragtime` engine to the database.

## Grounding the AI

Erathos doesn't just generate pretty pictures for the user. When Erathos renders a diagram, Codernic's internal agents read the spatial relationships mapped within it. This **visual grounding** forces the AI to acknowledge boundaries and prevents it from hallucinating dependencies that visually do not connect.

> [!TIP]
> You can export Erathos diagrams by copying the standard markdown Mermaid blocks from the generated artifacts and pasting them into your company's internal documentation or Notion pages.
