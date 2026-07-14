# Codernic for VS Code — Quick Reference

## ⌨️ Keyboard Shortcuts

| Action               | Windows/Linux                        | macOS                               |
| -------------------- | ------------------------------------ | ----------------------------------- |
| Open Command Palette | `Ctrl+Shift+P`                       | `Cmd+Shift+P`                       |
| Index Codebase       | `Ctrl+Shift+P` → "AI Agencee: Index" | `Cmd+Shift+P` → "AI Agencee: Index" |
| Toggle Sidebar       | `Ctrl+B`                             | `Cmd+B`                             |
| Quick Open File      | `Ctrl+P`                             | `Cmd+P`                             |
| Search Workspace     | `Ctrl+Shift+F`                       | `Cmd+Shift+F`                       |
| Open Copilot Chat    | `Ctrl+I`                             | `Cmd+I`                             |

---

## 💬 Chat Commands Quick Start

### ASK Mode — Query Your Code

Ask questions about code structure, patterns, and relationships.

```
@codernic /ask What is the entry point of this application?
@codernic /ask Show me all error handling patterns in the codebase
@codernic /ask How is authentication implemented?
@codernic /ask Find all database queries
@codernic /ask What dependencies does module X have?
@codernic /ask Analyze the performance bottlenecks in this file
```

**Use ASK when:**

- Understanding existing code
- Discovering patterns and conventions
- Finding related components
- Analyzing dependencies
- Learning the architecture

---

### PLAN Mode — Design Features

Create specifications and design documents without executing code changes.

```
@codernic /plan Design a new API endpoint for user authentication
@codernic /plan Refactor this module to use dependency injection
@codernic /plan Create a caching layer for database queries
@codernic /plan Add input validation to all form submissions
@codernic /plan Design a migration strategy from REST to GraphQL
```

**Use PLAN when:**

- Designing new features
- Creating specifications
- Previewing refactoring approach
- Planning architecture changes
- Getting code suggestions before changes

---

### AGENT Mode — Execute Changes

Automate code modifications with supervisor approval.

```
@codernic /agent Add TypeScript strict mode to all files
@codernic /agent Update all console.log to use proper logger
@codernic /agent Refactor class components to functional components
@codernic /agent Generate unit tests for uncovered functions
@codernic /agent Add JSDoc comments to all public functions
```

**Use AGENT when:**

- Making large-scale changes
- Batch refactoring
- Generating boilerplate
- Applying consistent patterns
- Updating dependencies

---

## 🎮 Workflow Commander — Visual DAG Execution

### Basic Workflow

1. **Open Commander**: Click "Commander" in Codernic sidebar
2. **Create Workflow**: Load existing `.agent.json` or create new
3. **Configure**: Set agent parameters visually
4. **Execute**: Click "Run" to start DAG execution
5. **Monitor**: Watch progress lanes in real-time
6. **Review**: Check audit log and token usage

### Example Workflow JSON

```json
{
  "name": "Generate API Types",
  "agents": [
    {
      "id": "extract-schema",
      "type": "analyzer",
      "prompt": "Extract all API schemas"
    },
    {
      "id": "generate-types",
      "type": "generator",
      "prompt": "Generate TypeScript types from schemas",
      "dependsOn": ["extract-schema"]
    },
    {
      "id": "format-code",
      "type": "formatter",
      "prompt": "Format generated types",
      "dependsOn": ["generate-types"]
    }
  ]
}
```

---

## 🔍 Symbol Explorer Guide

### Navigation

- **Search**: Type to filter symbols by name
- **Filter**: Use language dropdown to show specific types
- **Expand**: Click arrow to view nested symbols
- **Jump**: Click symbol to go to definition

### Symbol Types

- 🔵 **Classes** — Blue icon, class definitions
- 🟢 **Interfaces** — Green icon, type contracts
- 🟡 **Functions** — Yellow icon, method definitions
- 🔴 **Types** — Red icon, type aliases

### Quick Actions

- **Peek Definition**: Hover over symbol
- **Go to File**: Right-click → "Go to File"
- **Find References**: Right-click → "Find All References"
- **Rename Symbol**: Right-click → "Rename Symbol"

---

## ⚙️ Configuration Essentials

### Must-Configure Settings

```json
{
  "ai-agencee.model": "copilot-gpt-4o" // or "local", "claude", etc.
}
```

### Optional Settings

```json
{
  "ai-agencee.preferLocalModels": false,
  "aiAgencee.indexing.languages": ["typescript", "javascript", "python"],
  "ai-agencee.debugMode": false,
  "ai-agencee.maxContextTokens": 8000
}
```

### Check Configuration

```
Ctrl+Shift+P → "Preferences: Open Settings (UI)"
Search: "ai-agencee"
```

---

## 🚀 Common Workflows

### Onboarding to New Codebase

1. **Index**: `Ctrl+Shift+P` → "AI Agencee: Index Codebase"
2. **Ask**: `@codernic /ask What's the main entry point?`
3. **Explore**: Use Symbol Explorer to browse structure
4. **Ask More**: `@codernic /ask What are the main modules?`
5. **Document**: `@codernic /plan Create architecture documentation`

### Code Review Preparation

1. **Ask**: `@codernic /ask What tests cover this file?`
2. **Ask**: `@codernic /ask Are there any code quality issues here?`
3. **Plan**: `@codernic /plan How can this be refactored?`
4. **Review**: Check suggestions before proposing changes

### Feature Implementation

1. **Plan**: `@codernic /plan Design this feature with all edge cases`
2. **Review**: Evaluate the design
3. **Execute**: `@codernic /agent Implement the planned feature`
4. **Test**: `@codernic /agent Generate tests for the feature`
5. **Document**: `@codernic /agent Add JSDoc comments`

### Bug Investigation

1. **Ask**: `@codernic /ask Find all uses of this function`
2. **Ask**: `@codernic /ask What could cause this behavior?`
3. **Plan**: `@codernic /plan How should we fix this?`
4. **Execute**: `@codernic /agent Apply the fix`

### Performance Optimization

1. **Ask**: `@codernic /ask Find potential performance bottlenecks`
2. **Ask**: `@codernic /ask Identify N+1 query patterns`
3. **Plan**: `@codernic /plan Design optimization strategy`
4. **Execute**: `@codernic /agent Implement optimizations`

---

## 📊 Interpreting Results

### Index Status

- ✅ **Green** — Index complete and current
- 🟡 **Yellow** — Indexing in progress
- 🔴 **Red** — Index error or out of date

### ASK Mode Results

- Shows relevant code snippets
- Lists file locations
- Displays relationship maps
- Includes confidence scores

### PLAN Mode Results

- Specification markdown
- Code examples
- Design diagrams
- Estimated effort

### AGENT Mode Results

- Changed files
- Diffs of modifications
- Cost and token usage
- Supervisor approval points

---

## 🐛 Debugging & Troubleshooting

### Extension Won't Activate

1. Check VS Code version: `Ctrl+Shift+P` → "About"
2. Reload window: `Ctrl+R`
3. Check output: `Ctrl+Shift+P` → "Developer: Toggle Developer Tools"

### Index Not Working

1. **Clear cache**: Delete `.agencee/` folder
2. **Re-index**: `Ctrl+Shift+P` → "AI Agencee: Index Codebase"
3. **Check size**: Ensure codebase < 100K files

### Chat Not Responding

1. **Check connection**: Verify internet connection
2. **Verify model**: `ai-agencee.model` setting correct
3. **View logs**: `Ctrl+Shift+P` → "Developer: Toggle Developer Tools"

### Symbol Explorer Empty

1. **Index first**: Run "AI Agencee: Index Codebase"
2. **Wait**: Index may take time for large projects
3. **Refresh**: `Ctrl+Shift+P` → "AI Agencee: Refresh Index"

---

## 📚 Learning Resources

- **Full Documentation**: [codernic.dev](https://codernic.dev)
- **GitHub Repository**: [github.com/binaryjack/ai-agencee](https://github.com/binaryjack/ai-agencee)
- **Report Issues**: [GitHub Issues](https://github.com/binaryjack/ai-agencee/issues)
- **Discussions**: [GitHub Discussions](https://github.com/binaryjack/ai-agencee/discussions)

---

## 💡 Pro Tips

1. **Use Symbol Explorer First** — Get familiar with codebase structure before asking questions
2. **ASK Before You Act** — Always ask about the codebase before making changes
3. **PLAN Complex Changes** — Design before using AGENT mode
4. **Leverage Context** — Include specific file paths in your questions
5. **Check Audit Logs** — Review AGENT mode execution logs for transparency
6. **Set Models Correctly** — Different models have different strengths
7. **Use Dark Mode** — Easier on the eyes for long sessions
8. **Save Workflows** — Reuse common workflows for repeated tasks

---

**Version**: 0.6.237 | **Last Updated**: June 2026
