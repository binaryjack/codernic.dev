# AST Anonymizer Rules

Codernic Enterprise employs a mathematically rigorous approach to data loss prevention (DLP) via its **AST (Abstract Syntax Tree) Anonymizer** (the `Pirsig` engine). Instead of relying on unreliable prompt-based "Please do not leak secrets" instructions, the engine parses your source code natively in Rust (using Tree-sitter) before it ever touches a commercial LLM.

## How it Works

When an agent needs to send code to an external provider (like OpenAI or Anthropic):
1. **Tree-sitter Parsing:** The code is parsed into a syntax tree (supports Python, Java, Go, Rust, TypeScript).
2. **Comment Stripping:** All human comments are completely scrubbed if `strip_comments` is true.
3. **String Masking:** Hardcoded string literals (which often contain API keys, internal IPs, or PII) are replaced with `[MASKED_STRING]`.
4. **Regex Gating:** Any raw text that matches your custom enterprise rules (e.g., proprietary framework names, internal domain names) is replaced with generic placeholders.

## Defining Business Jargon & Rules

It is highly recommended that DevSecOps teams collaboratively define the anonymizer rules. 

### The Process

1. **Identify Proprietary Logic:** The security team identifies internal libraries, microservice domain names, or specific business jargon that must never leave the VPN.
2. **Configure the Global Mask:** The team updates the global `~/.codernicapp/config/anonymizer.json`.
3. **Deploy:** The updated configuration is propagated to all developer workstations via your MDM (Mobile Device Management) or via a synced repository.

### Configuration Structure (`anonymizer.json`)

```json
{
  "strip_comments": true,
  "mask_strings": true,
  "regex_patterns": [
    // Blocks all corporate email addresses
    "\\b[A-Za-z0-9._%+-]+@internal-corp\\.com\\b",
    
    // Blocks internal AWS infrastructure IDs
    "AKIA[0-9A-Z]{16}",
    
    // Blocks proprietary business jargon "ProjectZeus"
    "ProjectZeus|ZeusDB"
  ]
}
```

## Troubleshooting
If a developer complains that the AI's responses are confusing because variables are missing, ensure your `regex_patterns` are not overly aggressive. Use specific bounds (`\b`) to prevent substring masking.
