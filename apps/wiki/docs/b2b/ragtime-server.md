# Ragtime Context Server

The `ragtime-server` is an independent Context Engine designed for B2B integrators. It allows you to inject advanced, deterministic Retrieval-Augmented Generation (RAG) capabilities into your own SaaS products, without needing the full Codernic orchestrator.

## The Problem with Naive RAG

Traditional RAG systems stuff LLM contexts with generic vector search results, leading to context-window exhaustion and hallucinated relationships.

Ragtime utilizes **Corrective RAG (CRAG)** logic combined with a hybrid search architecture (Dense vectors via `LanceDB` + Sparse keywords via `BM25`). This guarantees mathematically exact retrievals for structured code, AST trees, and dense documentation.

## Installation & Deployment

The server is distributed as a highly optimized, statically linked Rust binary.

```bash
cargo run --bin ragtime-server --release
```

By default, the server binds to `0.0.0.0:8000`.

## Architecture & Data Storage

Ragtime uses `LanceDB` under the hood. LanceDB is an embedded vector database that stores data natively in the Apache Arrow format.
- It requires zero infrastructure setup (no heavy PostgreSQL/pgvector clusters).
- The vector data is persisted to the local filesystem (default: `./data/ragtime.db`).
- It seamlessly scales to millions of embedded files.

## REST API Integration

You can easily integrate Ragtime into your external Python, Go, or Node.js applications.

### 1. Ingesting Documents

```bash
curl -X POST http://localhost:8000/v1/documents \
  -H "Content-Type: application/json" \
  -d '{
    "id": "doc_123",
    "content": "function computeTax(amount) { return amount * 0.2; }",
    "metadata": {"language": "typescript", "module": "billing"}
  }'
```

### 2. Semantic Querying

```bash
curl -X POST http://localhost:8000/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How is the tax computed?",
    "top_k": 5
  }'
```

## Security & Sovereignty

Because Ragtime runs within your own Virtual Private Cloud (VPC) and embeds documents using local fast-embedding models, your proprietary code or customer data never leaves your environment. It acts as an air-gapped knowledge retrieval backend for strict enterprise regulatory compliance.
