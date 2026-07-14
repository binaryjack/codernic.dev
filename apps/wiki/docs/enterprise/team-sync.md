# Team Synchronization (CRDTs)

Collaboration in an AI-assisted engineering environment requires absolute consistency. Unlike traditional cloud editors that rely on Operational Transformation (OT), Codernic Enterprise utilizes Conflict-free Replicated Data Types (**CRDTs**) powered by `Yjs` and the Rust port `yrs`.

## How It Works

When multiple engineers or autonomous agents operate within the same Codernic Workspace:
1. **Shared Document Initialization**: The `codernic-enterprise` daemon spins up a global `CrdtState` document in memory.
2. **Binary Updates**: Clients (the VSCode Extension or Web UI) communicate via the WebSocket endpoint using highly optimized binary buffers.
3. **Deterministic Merging**: As edits are made (e.g., a LoRA agent restructuring a struct, while a human developer comments the file), the CRDT mathematically guarantees that all peers will arrive at the identical final code state without needing a central locking server.

## Configuration

CRDT sync is enabled by default in Enterprise licenses. 

Ensure that your `daemon_ws_port` is open and not blocked by local firewalls, as the WebSocket connection is the primary conduit for the `Yjs` update buffers.

```json
// ~/.codernicapp/config/engine.json
{
  "features": {
    "enable_crdt_sync": true
  }
}
```

## Security & Sovereignty
Because the `yrs` CRDT algorithm runs entirely within the local Codernic Daemon, your collaborative code fragments **never traverse an external SaaS server**. If you are hosting the daemon on an internal AWS VPC, all state synchronization stays strictly within your isolated subnet.

## Troubleshooting Sync Drops
If users report that their UI is not reflecting changes made by an agent:
- Verify the WebSocket connection: `ws://<daemon-ip>:49152`.
- Check the VRAM monitor. Heavy LLM generation can occasionally cause I/O starvation on under-provisioned disks, delaying the transaction merge.
- Restarting the daemon will flush the in-memory `CrdtState`. Ensure that files have been committed to git or saved to disk before rebooting the daemon.
