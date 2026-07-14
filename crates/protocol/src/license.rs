use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum LicenseTier {
    #[default]
    Free,
    Pro,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicensePayload {
    pub tier: LicenseTier,
    pub email: String,
    pub expires_at: Option<u64>,
}

#[derive(Debug, thiserror::Error)]
pub enum LicenseError {
    #[error("Invalid license format. Expected payload.signature")]
    InvalidFormat,
    #[error("Invalid cryptographic signature")]
    InvalidSignature,
    #[error("License expired")]
    Expired,
    #[error("Base64 decoding failed")]
    DecodeError,
}
