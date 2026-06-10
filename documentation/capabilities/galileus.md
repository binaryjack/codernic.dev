# Galileus: Actor File Arbitration

**Subsystem:** `crates/galileus`
**Role:** Conflict prevention and multi-agent DAG execution orchestration.

## Mechanism

As AI systems move from single chat-loops to parallel multi-agent orchestrations, race conditions emerge. If Agent A (Backend) and Agent B (Testing) both attempt to modify `src/main.rs` simultaneously, the file corrupts.

Galileus solves this by treating file access as a concurrency problem, solved via the Actor Model using Tokio.

1. **Centralized Arbitration:** Galileus acts as a singleton Tokio actor that holds the "truth" of the filesystem state in a `HashMap<PathBuf, ClaimState>`.
2. **Intent Declarations:** Before an agent can read or write to a file, it must submit an `Intent` to Galileus requesting a lock:
    - `Read`: Allows multiple concurrent readers.
    - `Write`: Exclusive access; blocks other writers.
    - `Exclusive`: Blocks both readers and writers (used for heavy refactors).
3. **Atomic Queuing:** If Agent B requests a `Write` lock on a file currently held by Agent A, Galileus does not crash or throw an error. It automatically queues Agent B's request. Agent B yields its Tokio task, freeing up system resources.
4. **Wakeup:** The moment Agent A releases its lock, Galileus wakes Agent B and grants it access.

## Why it matters (Our Philosophy)

The naive industry solution to agent conflicts is sequential execution: run Agent A, wait for it to finish, then run Agent B. This is incredibly slow and wastes compute.

Galileus makes parallel agent execution mathematically conflict-free. You can orchestrate a massive Directed Acyclic Graph (DAG) with 20 parallel agent lanes. If they operate on different files, they run at maximum speed concurrently. If their paths cross on a shared file, Galileus gracefully and automatically sequences that specific interaction. It is true supervised orchestration.
