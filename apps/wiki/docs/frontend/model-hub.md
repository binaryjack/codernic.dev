# Models Hub UI

Managing local and cloud models via CLI tools can be tedious. Codernic provides a centralized **Models Hub** directly within the web dashboard to seamlessly configure your LLM routing.

## Local Models (GGUF/Safetensors)

For true sovereignty, Codernic encourages running models locally. The Models Hub provides a visual interface to:
1. **Browse Models:** View popular models (Llama 3, Mistral, Qwen) formatted for coding tasks.
2. **Download & Quantize:** Click to download GGUF binaries directly into your `~/.codernicapp/models` directory. The UI displays download progress bars and estimated completion times.
3. **Hot-Swapping:** Easily switch the active model running in the `ai_agencee_engine_inference` daemon without needing to reboot the system.

## Cloud & API Models

If you prefer to route heavy queries to external providers, the Models Hub allows you to configure your commercial keys securely (BYOK - Bring Your Own Key).
- **Supported Providers:** OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), Google Gemini.
- **Internal Proxy:** If your enterprise utilizes the `pirsig-proxy`, you can configure the custom LLM gateway URL directly in the UI.

## Routing Profiles

Codernic is an intelligent router. You can define specific tasks to use specific models:
- **Fast/Cheap Model (Local 8B):** Used for autocompletions, simple refactors, and minor debugging.
- **Heavy Reasoning Model (Cloud 70B+):** Triggered automatically when the AST Anonymizer detects complex architectural shifts or DAG planning phases.

Configure these threshold rules visually in the Models Hub tab to optimize your cloud spend while maintaining maximum intelligence.
