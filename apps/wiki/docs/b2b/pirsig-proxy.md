# Pirsig Shield Proxy

The Pirsig Shield Proxy is an enterprise-grade standalone microservice within the Codernic ecosystem. It is designed to act as a secure, stateless gateway between your internal engineering team (and agents) and external commercial LLMs (like OpenAI, Anthropic).

## Why use the Proxy?

1. **Centralized Billing & API Key Protection**: Instead of distributing API keys to every developer's local machine, the proxy holds the master key in its `SecretsManager`. All internal traffic routes through the proxy.
2. **Rate Limiting (Token Bucket)**: Enforces strict limits to prevent runaway agents or malicious scripts from exhausting your cloud AI budget.
3. **OIDC/JWT Authentication**: Integrates with your enterprise Identity Provider (Okta, Entra ID) to authenticate users before proxying requests.

## Architecture

The proxy is completely stateless. We implemented a `DistributedCache` abstraction (which currently defaults to a memory-backed Mock Redis for trial environments) to track rate limits across multiple horizontally scaled instances.

## Installation & Execution

To run the proxy independently of the main daemon:

```bash
cargo run --bin pirsig-proxy --release
```

By default, the proxy binds to `0.0.0.0:8080`.

## Configuration

The proxy requires minimal configuration, injected via the standard Codernic environment variables:

```bash
# Set your OIDC Discovery URL
export OIDC_ISSUER="https://your-corp.okta.com"

# Maximum requests per minute per IP/User
export PIRSIG_RATE_LIMIT=100
```

## Middlewares

### Rate Limiter
If a user exceeds the defined quota, the proxy immediately returns HTTP `429 Too Many Requests`. This is tracked in the `DistributedCache`.

### OIDC Auth
Clients must provide a valid `Bearer` token in the `Authorization` header. The proxy decodes the JWT, verifies the signature against the corporate JWKS, and asserts the presence of the `pirsig_user` role.

## Integration with UI
To point the Codernic UI or VSCode extension to the proxy, update your global `engine.json`:

```json
{
  "network": {
    "custom_llm_gateway": "http://your-internal-proxy.corp:8080/v1/chat/completions"
  }
}
```
