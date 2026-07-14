# Standalone B2B Services Overview

While Codernic is a comprehensive supervised engineering runtime, many of its underlying intelligence engines are so powerful that they have been decoupled into independent B2B packages.

These packages **do not require Codernic Enterprise to run**. They can be integrated into your existing SaaS products, CI/CD pipelines, or proprietary AI platforms as isolated microservices.

## The B2B Ecosystem

Our standalone B2B offerings include:

1. **Ragtime Context Server (`ragtime-server`)**
   A blazing-fast Corrective Retrieval Augmented Generation (CRAG) API server. It uses LanceDB and BM25 to embed and retrieve context dynamically. Perfect for companies building their own AI coding assistants or advanced technical chatbots.

2. **Galileus CI Gatekeeper (`galileus-ci`)**
   A headless WebAssembly/Rust engine that drops into GitHub Actions or GitLab CI. It audits pull requests for security vulnerabilities (SARIF) and structural drift without exposing code to public clouds.

3. **Pirsig Shield Proxy (`pirsig-proxy`)**
   An enterprise-grade, stateless LLM proxy. It acts as a firewall between your engineering team (or agents) and commercial LLMs, enforcing strict rate limits and performing AST Anonymization on outgoing prompts to protect intellectual property.

## Deployment Paradigm

All B2B packages are published as independent, statically linked Rust binaries (or Wasm modules). 
- They utilize the standard `ConfigurationManager` to pull from environment variables (e.g., `PIRSIG_RATE_LIMIT=100`).
- They integrate natively with standard observability stacks via OpenTelemetry (OTLP) to export metrics to Prometheus, Datadog, or your custom SIEM.
- They are highly permissive in their licensing (mostly MIT/Apache 2.0) and are 100% commercially safe to integrate into closed-source monolithic or microservice architectures.
