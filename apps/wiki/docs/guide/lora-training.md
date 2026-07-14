# Training LoRA Agents

*(Note: This is a V.2 Enterprise feature currently being dogfooded.)*

Instead of relying solely on heavy, generic cloud models, Codernic allows you to train specialized **Low-Rank Adaptation (LoRA)** agents directly on your own codebase. This results in incredibly fast, highly accurate local inference tailored to your company's specific coding conventions.

## The Continuous Git-Based Trainer Loop

Codernic utilizes **Unsloth** for hyper-optimized LoRA training. The process is continuous and Git-driven:

1. **Dataset Bootstrapping:** Codernic scans your `git log` and diffs to extract examples of high-quality commits, architectural decisions, and convention updates.
2. **AST Anonymization:** Before training, the AST Anonymizer strips out hardcoded secrets, PII, and proprietary string literals using Tree-sitter, ensuring the training set is safe.
3. **Adapter Training:** The training script automatically generates a LoRA adapter specifically weighted to favor your architectural patterns.

## How to Trigger Training

In the Codernic CLI, run:
```bash
codernic-solo train --target=current-workspace
```

## Using the LoRA Agent

Once the adapter is trained (which usually takes a few minutes locally depending on your hardware), Codernic automatically injects the LoRA weights into your active local model (via the Model Hub).

When you interact with the agent, it will now inherently understand:
* Your preferred variable naming conventions.
* Your internal utility libraries.
* Historical bug fixes, meaning it won't repeat mistakes that were already solved in previous commits.
