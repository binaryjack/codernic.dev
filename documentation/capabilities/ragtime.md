# Ragtime: Semantic Context Engine

**Subsystem:** `crates/ragtime_core`
**Role:** Codebase indexing and surgical context extraction.

## Mechanism

Ragtime is the memory and context retrieval engine for Codernic. It ensures the LLM has exactly the information it needs, and nothing it doesn't.

1. **Incremental Indexing (`FileCrawler` & Blake3):** Ragtime scans the project directory. It computes a Blake3 hash for every file. On subsequent runs, it only re-indexes files whose hashes have changed, making the indexing process incredibly fast (e.g., 449 files in 1.03s).
2. **AST Symbol Extraction:** It doesn't just read raw text. It uses `tree-sitter` to parse the files and extract semantic symbols (structs, functions, classes, traits).
3. **Hybrid Retrieval:** 
    - Full-Text Search (FTS5 via SQLite) for exact keyword and symbol matches.
    - Vector Embeddings (BERT via `LocalVectorizer`) for semantic similarity.
4. **Surgical Injection:** When a prompt is issued, Ragtime queries the hybrid index to find the 2-5 most relevant files and symbol definitions, injecting only those into the LLM's context window.

## Why it matters (Our Philosophy)

The current industry meta is brute-force: dumping massive codebases into 200K+ token context windows. 

This approach is fundamentally flawed:
- **Ecological & Computational Waste:** Processing 200K tokens for every query consumes massive amounts of energy and compute resources, polluting the planet unnecessarily.
- **Attention Degradation:** LLMs suffer from the "Lost in the Middle" phenomenon. The more context you provide, the worse their reasoning becomes on specific details.
- **Latency:** Massive context windows result in high Time-To-First-Token (TTFT) latency.

Ragtime proves that **fewer tokens = smarter answers**. By using deterministic, surgical semantic extraction, we lower the carbon footprint, reduce costs, eliminate latency, and ensure the LLM stays hyper-focused on the relevant architecture.
