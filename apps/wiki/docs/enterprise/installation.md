# Installation & Setup (Enterprise)

Codernic Enterprise acts as a headless intelligence daemon and local multi-agent system. To guarantee complete sovereignty, it deploys directly onto your internal infrastructure—whether that is a developer's workstation or a centralized cloud instance (AWS/Azure).

## System Requirements
- **OS**: Linux (Ubuntu 22.04+), Windows 11 (WSL2), or macOS (M1+ with Metal)
- **RAM**: Minimum 32GB (64GB recommended for 70B+ class LLMs)
- **GPU**: NVIDIA (CUDA), AMD (ROCm), or Apple Silicon (Metal)
- **Disk**: NVMe SSD with at least 500GB for models, checkpoints, and LanceDB vectors.

## Installation from Scratch

### 1. Download the Enterprise Binaries
Obtain the pre-compiled `codernic-enterprise` binary suite from your designated enterprise account manager or compile it from source if you hold an Architect/Enterprise license.

### 2. Configure the License
The Daemon expects a valid `enterprise.lic` token.
Place the `enterprise.lic` inside the root installation folder (default is `~/.codernicapp/`).
```bash
mkdir -p ~/.codernicapp/
cp your_purchased_license.lic ~/.codernicapp/enterprise.lic
```

### 3. Start the Daemon
To initialize the backend and generate the cascading configurations:
```bash
codernic-enterprise --daemon
```

> [!IMPORTANT]
> The daemon enforces a singleton lock. If it detects a stale socket at `/tmp/codernic.sock`, it will gracefully clean it up before spinning up the internal engines (Galileus, Pirsig, and Ragtime).

### 4. Deploying the Pirsig Proxy (Optional)
If your engineering team operates over a VPN and requires centralized access to a foundational model (like GPT-4) while maintaining strict rate limits and anonymization, you should deploy the `pirsig-proxy` as a microservice:

```bash
cargo run --bin pirsig-proxy --release
```
See the [Pirsig Shield Proxy](../architecture/pirsig.md) guide for OIDC/JWT configurations.

## Validating the Setup
Once the daemon runs, it exposes a WebSocket at `ws://127.0.0.1:49152` and listens to interprocess signals. You can test the connection via the CLI:
```bash
codernic-cli status
```
If successful, you will see a dump of the active agents, VRAM utilization, and Enterprise License Tier.
