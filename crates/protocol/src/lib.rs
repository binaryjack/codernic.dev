//! # AI Agencee Protocol Crate
//!
//! The **Protocol Crate** defines the core data structures and communication interfaces for the AI Agencee system.
//! It serves as the contract between clients (VS Code extension, CLI, etc.) and the backend inference engine.
//!
//! ## Purpose
//!
//! This crate provides:
//! - **Type-safe serialization** for all request/response messages using Serde
//! - **Cross-platform IPC** abstractions (Unix sockets on Linux/macOS, named pipes on Windows)
//! - **Configuration schemas** for local models, inference parameters, and DAG execution
//! - **Error handling** for configuration validation
//! - **Transport traits** for async message exchange
//!
//! ## Key Concepts
//!
//! ### Models & Inference
//! - `LocalModelDefinition`: Defines a local LLM with paths to weights, config, and tokenizer
//! - `ModelFormat`: Enumerates supported formats (Safetensors, GGUF)
//! - `InferenceHyperparams`: Temperature, top_p, max_tokens, grammar rules
//! - `InferenceEvent`: Streaming responses (tokens, metrics, errors)
//!
//! ### Agent Workflows (DAG)
//! - `DagConfig`: Directed Acyclic Graph orchestrating multi-agent workflows
//! - `LaneNodeConfig`: Individual agent node in a DAG lane
//! - `GlobalBarrierConfig`: Synchronization points across lanes
//! - `AgentParadigm`: Linear or ReAct (reasoning + action) paradigms
//!
//! ### Commands & Responses
//! - `CommandRequest`: Client requests (ExecuteAsk, GeneratePlan, ExecuteDag, etc.)
//! - `CommandResponse`: Server responses (Inference events, DAG events, status, errors)
//!
//! ### Transport Layer
//! - `InterprocessStream`: Cross-platform socket abstraction (Unix/Windows)
//! - `InterprocessListener`: Accept incoming connections
//! - `Transport`: Async trait for JSON message serialization/deserialization
//!
//! ## For Open-Source Contributors
//!
//! To extend the protocol:
//! 1. **Add new event types** in the corresponding enum (e.g., `CommandRequest`, `InferenceEvent`)
//! 2. **Derive `Serialize` and `Deserialize`** for JSON compatibility
//! 3. **Update validation logic** in `LocalModelDefinition::validate()` if needed
//! 4. **Ensure backward compatibility** - new fields should be optional or have defaults
//! 5. **Test serialization** with both serde_json and bincode if binary format is added
//!
//! ### Example: Creating a New Request Type
//! ```ignore
//! #[derive(Serialize, Deserialize, Debug, Clone)]
//! pub enum CommandRequest {
//!     // ... existing variants
//!     MyCustomCommand {
//!         param1: String,
//!         param2: Option<i32>,
//!     },
//! }
//! ```
//!
//! ### Example: Sending a Command
//! ```ignore
//! use ai_agencee_protocol::{Transport, CommandRequest, LocalModelDefinition};
//!
//! async fn send_inference_request(transport: &mut dyn Transport) -> Result<()> {
//!     let model = LocalModelDefinition {
//!         model_id: "llama2-7b".to_string(),
//!         weights_paths: vec!["/path/to/model.gguf".into()],
//!         config_path: "/path/to/config.json".into(),
//!         tokenizer_path: "/path/to/tokenizer.json".into(),
//!         context_window: 4096,
//!     };
//!     
//!     let request = CommandRequest::ExecuteAsk {
//!         task_id: "task-001".to_string(),
//!         model_def: model,
//!         prompt: "Hello, world!".to_string(),
//!         params: Default::default(),
//!         use_rag: false,
//!     };
//!     
//!     transport.send_request(&request).await?;
//!     Ok(())
//! }
//! ```

pub mod erathos;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("Required file not found on disk: {0}")]
    FileNotFound(PathBuf),
    #[error("Invalid configuration: {0}")]
    InvalidConfiguration(String),
}



#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum SupervisorDecision {
    Continue,
    InjectContext(String),
    CircuitBreak(String),
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub enum SupervisorMode {

    Permissive,
    Attentive,
    Deterministic,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SupervisorConfig {
    pub mode: SupervisorMode,
    pub max_iteration_buffer: usize,
    pub health_check_frequency: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LocalModelDefinition {

    pub model_id: String,
    pub weights_paths: Vec<PathBuf>,
    pub config_path: PathBuf,
    pub tokenizer_path: PathBuf,
    pub context_window: usize,
    pub gpu_layers: Option<u32>,
    pub use_mlock: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ModelFormat {
    Safetensors,
    Gguf,
}

impl LocalModelDefinition {
    pub fn format(&self) -> ModelFormat {
        if self.weights_paths.iter().any(|p| p.extension().is_some_and(|ext| ext == "gguf")) {
            ModelFormat::Gguf
        } else {
            ModelFormat::Safetensors
        }
    }

    pub fn validate(&self) -> Result<(), ConfigError> {
        if self.weights_paths.is_empty() {
            return Err(ConfigError::InvalidConfiguration("No weights paths provided".to_string()));
        }

        for path in &self.weights_paths {
            if !path.exists() {
                return Err(ConfigError::FileNotFound(path.clone()));
            }
        }
        
        if self.format() == ModelFormat::Safetensors {
            if !self.config_path.exists() {
                return Err(ConfigError::FileNotFound(self.config_path.clone()));
            }

            if !self.tokenizer_path.exists() {
                return Err(ConfigError::FileNotFound(self.tokenizer_path.clone()));
            }
        }

        if self.context_window == 0 {
            return Err(ConfigError::InvalidConfiguration(
                "Context window must be strictly greater than 0".to_string(),
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceHyperparams {
    pub temperature: Option<f64>,
    pub top_p: Option<f64>,
    pub max_tokens: usize,
    pub json_schema: Option<String>,
    pub gbnf_grammar: Option<String>,
    pub stop_sequences: Option<Vec<String>>,
    pub chat_template: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InferenceEvent {
    Token(String),
    Metrics {
        ttft_ms: u64,
        tokens_per_second: f64,
        vram_allocated_bytes: u64,
        context_tokens_count: usize,
    },
    Error(String),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct IndexingConfig {
    pub root_path: PathBuf,
    pub pooling_strategy: String,
    pub model_type: String,
    pub languages: Option<String>,
    pub exclude_patterns: Option<String>,
    pub additional_roots: Option<Vec<PathBuf>>,
    pub respect_gitignore: bool,
    pub json_output: bool,
    pub max_concurrency: Option<usize>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentParadigm {
    #[serde(alias = "linear", alias = "Linear")]
    Linear,
    #[serde(alias = "react", alias = "ReAct")]
    ReAct,
    #[serde(alias = "supervisor", alias = "Supervisor")]
    Supervisor,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CheckpointConfig {
    pub id: String,
    pub mode: String,
    pub on_fail: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LaneNodeConfig {
    pub id: String,
    #[serde(alias = "dependencies", default)]
    pub depends_on: Vec<String>,
    pub agent_file: String,
    pub supervisor_file: Option<String>,
    pub paradigm: Option<AgentParadigm>,
    pub capabilities: Option<Vec<String>>,
    pub checkpoints: Option<Vec<CheckpointConfig>>,
    pub skill: Option<String>,
    pub input_context: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GlobalBarrierConfig {
    pub name: String,
    pub participants: Vec<String>,
    pub timeout_ms: Option<u64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DagConfig {
    pub name: String,
    pub description: Option<String>,
    pub lanes: Vec<LaneNodeConfig>,
    pub global_barriers: Option<Vec<GlobalBarrierConfig>>,
    pub capability_registry: Option<std::collections::HashMap<String, Vec<String>>>,
    pub model_router_file: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum DagExecutionEvent {
    LaneStarted { lane_id: String, timestamp: u64 },
    LaneOutput { lane_id: String, chunk: String },
    LaneCompleted { lane_id: String, exit_code: i32 },
    LaneFailed { lane_id: String, error: String },
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum CommandRequest {
    ExecuteAsk {
        task_id: String,
        model_def: LocalModelDefinition,
        messages: Vec<ChatMessage>,
        params: InferenceHyperparams,
        use_rag: bool,
        route_profile: Option<String>,
        project_root: PathBuf,
    },
    GetSessions { project_root: PathBuf },
    LoadSession { id: String, project_root: PathBuf },
    RenameSession { id: String, new_name: String, project_root: PathBuf },
    DeleteSession { id: String, project_root: PathBuf },
    ResolveToolApproval {
        request_id: String,
        approved: bool,
    },
    GeneratePlan {
        instruction: String,
    },
    ExecuteDag {
        task_id: String,
        project_root: PathBuf,
        dag_config: DagConfig,
        route_profile: Option<String>,
        yolo_mode: bool,
    },
    AnalyzeAst {
        file_path: PathBuf,
    },
    AnalyzeProject {
        project_root: PathBuf,
    },
    StartIndexing {
        config: IndexingConfig,
    },
    GetMetrics,
    GetStatus,
    GetHealth,
    GetVersion,
    Shutdown,
    Abort {
        task_id: String,
    },
    Chat {
        session_id: String,
        prompt: String,
        force_mode: Option<String>,
        use_rag: bool,
        model_def: LocalModelDefinition,
        params: InferenceHyperparams,
        #[serde(default)]
        yolo_mode: bool,
        route_profile: Option<String>,
        project_root: PathBuf,
    },
    Ping,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum TelemetryEvent {
    LockAcquiring { lock_id: String, task_id: String },
    LockAcquired { lock_id: String, task_id: String },
    ToolExecuting { tool_name: String, args: String },
    ToolExecuted { tool_name: String, status: String },
    PromptDispatched { prompt: String, model_id: String, seed: u64 },
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CoreHealthPayload {
    pub vram_used_gb: Option<f64>,
    pub memory_lock_limit: Option<String>,
    pub rag_initialized: bool,
    pub indexed_chunks_count: usize,
    pub total_ram_gb: f64,
    pub cpu_cores: usize,
    pub has_cuda: bool,
    pub has_rocm: bool,
    pub has_metal: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum CommandResponse {
    Inference(InferenceEvent),
    Dag(DagExecutionEvent),
    PlanTopology { json_graph: String },
    AstMetrics { kpi_score: f32, symbols_count: usize, qualitative_flags: Option<Vec<String>> },
    IndexingProgress { files_indexed: usize, total_files: usize, percentage: u8 },
    Status {
        active_slots: usize,
        max_slots: usize,
        vram_used_gb: Option<f64>,
        #[serde(default)]
        is_indexing: bool,
    },
    MetricsReport { json_parse_failures: u64 },
    Health(CoreHealthPayload),
    Version { version: String, pid: u32 },
    Telemetry(TelemetryEvent),
    ModeTransition {
        session_id: String,
        from: String,
        to: String,
        reason: String,
    },
    RequestToolApproval {
        tool_name: String,
        request_id: String,
        sandbox_recommended: bool,
    },
    AgentEvent(serde_json::Value),
    Done,
    Error(String),
    SessionsList { sessions: Vec<SessionMeta> },
    SessionLoaded { id: String, messages: Vec<ChatMessage> },
    Pong,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SessionMeta {
    pub id: String,
    pub name: String,
    pub status: String,
    pub last_updated: i64,
}

// Transport Abstraction Layer
use async_trait::async_trait;
use tokio::io::{AsyncRead, AsyncWrite, AsyncWriteExt};

#[derive(Debug)]
pub enum InterprocessStream {
    #[cfg(unix)]
    Unix(tokio::net::UnixStream),
    #[cfg(windows)]
    Client(tokio::net::windows::named_pipe::NamedPipeClient),
    #[cfg(windows)]
    Server(tokio::net::windows::named_pipe::NamedPipeServer),
}

impl AsyncRead for InterprocessStream {
    fn poll_read(
        self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
        buf: &mut tokio::io::ReadBuf<'_>,
    ) -> std::task::Poll<std::io::Result<()>> {
        match self.get_mut() {
            #[cfg(unix)]
            Self::Unix(stream) => std::pin::Pin::new(stream).poll_read(cx, buf),
            #[cfg(windows)]
            Self::Client(stream) => std::pin::Pin::new(stream).poll_read(cx, buf),
            #[cfg(windows)]
            Self::Server(stream) => std::pin::Pin::new(stream).poll_read(cx, buf),
        }
    }
}

impl AsyncWrite for InterprocessStream {
    fn poll_write(
        self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
        buf: &[u8],
    ) -> std::task::Poll<Result<usize, std::io::Error>> {
        match self.get_mut() {
            #[cfg(unix)]
            Self::Unix(stream) => std::pin::Pin::new(stream).poll_write(cx, buf),
            #[cfg(windows)]
            Self::Client(stream) => std::pin::Pin::new(stream).poll_write(cx, buf),
            #[cfg(windows)]
            Self::Server(stream) => std::pin::Pin::new(stream).poll_write(cx, buf),
        }
    }

    fn poll_flush(
        self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), std::io::Error>> {
        match self.get_mut() {
            #[cfg(unix)]
            Self::Unix(stream) => std::pin::Pin::new(stream).poll_flush(cx),
            #[cfg(windows)]
            Self::Client(stream) => std::pin::Pin::new(stream).poll_flush(cx),
            #[cfg(windows)]
            Self::Server(stream) => std::pin::Pin::new(stream).poll_flush(cx),
        }
    }

    fn poll_shutdown(
        self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), std::io::Error>> {
        match self.get_mut() {
            #[cfg(unix)]
            Self::Unix(stream) => std::pin::Pin::new(stream).poll_shutdown(cx),
            #[cfg(windows)]
            Self::Client(stream) => std::pin::Pin::new(stream).poll_shutdown(cx),
            #[cfg(windows)]
            Self::Server(stream) => std::pin::Pin::new(stream).poll_shutdown(cx),
        }
    }
}

impl InterprocessStream {
    pub async fn connect() -> std::io::Result<Self> {
        #[cfg(unix)]
        {
            let stream = tokio::net::UnixStream::connect("/tmp/ai_agencee.sock").await?;
            Ok(Self::Unix(stream))
        }
        #[cfg(windows)]
        {
            let client = tokio::net::windows::named_pipe::ClientOptions::new()
                .open(r"\\.\pipe\ai_agencee")?;
            Ok(Self::Client(client))
        }
    }
}

pub enum InterprocessListener {
    #[cfg(unix)]
    Unix(tokio::net::UnixListener),
    #[cfg(windows)]
    Windows {
        path: std::ffi::OsString,
        incoming_server: tokio::net::windows::named_pipe::NamedPipeServer,
    },
}

impl InterprocessListener {
    pub fn bind() -> std::io::Result<Self> {
        #[cfg(unix)]
        {
            let listener = tokio::net::UnixListener::bind("/tmp/ai_agencee.sock")?;
            Ok(Self::Unix(listener))
        }
        #[cfg(windows)]
        {
            let path = std::ffi::OsString::from(r"\\.\pipe\ai_agencee");
            let incoming_server = tokio::net::windows::named_pipe::ServerOptions::new()
                .first_pipe_instance(true)
                .create(&path)?;
            Ok(Self::Windows { path, incoming_server })
        }
    }

    pub async fn accept(&mut self) -> std::io::Result<InterprocessStream> {
        match self {
            #[cfg(unix)]
            Self::Unix(listener) => {
                let (stream, _) = listener.accept().await?;
                Ok(InterprocessStream::Unix(stream))
            }
            #[cfg(windows)]
            Self::Windows { path, incoming_server } => {
                // 1. Attendre la connexion sur l'instance en écoute
                incoming_server.connect().await?;
                
                // 2. Instancier immédiatement le serveur suivant pour le prochain client
                //    (Annihile la fenêtre de Race Condition pour les requêtes simultanées)
                let next_server = tokio::net::windows::named_pipe::ServerOptions::new()
                    .first_pipe_instance(false)
                    .create(path)?;
                
                // 3. Extraire le serveur connecté et le remplacer par le nouveau spéculatif
                let connected_server = std::mem::replace(incoming_server, next_server);
                
                Ok(InterprocessStream::Server(connected_server))
            }
        }
    }
}

#[async_trait]
pub trait Transport: AsyncRead + AsyncWrite + Unpin + Send + Sync {
    async fn send_request(&mut self, req: &CommandRequest) -> anyhow::Result<()> {
        let json = serde_json::to_string(req)?;
        self.write_all(json.as_bytes()).await?;
        self.write_all(b"\n").await?;
        self.flush().await?;
        Ok(())
    }

    async fn send_response(&mut self, res: &CommandResponse) -> anyhow::Result<()> {
        let json = serde_json::to_string(res)?;
        self.write_all(json.as_bytes()).await?;
        self.write_all(b"\n").await?;
        self.flush().await?;
        Ok(())
    }
}

impl Transport for tokio::net::UnixStream {}
impl Transport for tokio::net::TcpStream {}
impl Transport for InterprocessStream {}
