# Ragtime (Context Engine)

Dumping massive amounts of code into an AI's context window is inefficient, expensive, and degrades the AI's ability to reason effectively. Large context windows often lead to a "Lost in the Middle" phenomenon, where the AI ignores critical code buried deep within the prompt.

**Ragtime** is Codernic's proprietary Context Engine. It solves this problem by acting as the AI's highly efficient long-term memory for your entire enterprise.

## How Ragtime Works

When you ask Codernic a question or assign it a task, Ragtime intercepts the request before it reaches the AI. 

1. **Intelligent Crawling:** Ragtime maps your entire workspace, as well as company materials, business documents, and intellectual property.
2. **Hybrid Retrieval:** It combines exact-keyword search (to find specific variable names) with mathematical vector embeddings (to understand the *meaning* of your request).
3. **Surgical Precision:** Instead of feeding the AI 200 files, Ragtime mathematically determines the strictly required files to solve the task and feeds them securely via the standard Model Context Protocol (MCP).

**Crucially: Your data never leaves the enterprise.** All vectorization and search happen completely offline on your local network.

## The Benefit

Because the AI receives a tiny, highly relevant payload of context, it reasons significantly faster and produces much higher quality code. Furthermore, if you are using commercial AI providers (like OpenAI or Anthropic), Ragtime drastically reduces your token usage, saving you massive amounts of money and minimizing carbon impact.

## Usage

You interact with Ragtime simply by indexing your codebase. Once indexed, all background AI operations automatically utilize the semantic engine.

```bash
# Rebuild the Ragtime memory index
agencee code:index --path .
```
