use ring::hmac;
use ring::constant_time::verify_slices_are_equal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthRequest {
    pub nonce: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthResponse {
    pub sig: String,
    pub version: String,
}

pub fn compute_sig(secret: &str, nonce: &str) -> String {
    let key = hmac::Key::new(hmac::HMAC_SHA256, secret.as_bytes());
    let sig = hmac::sign(&key, nonce.as_bytes());
    hex::encode(sig.as_ref())
}

pub fn verify_sig(secret: &str, nonce: &str, sig: &str) -> bool {
    let expected = compute_sig(secret, nonce);
    verify_slices_are_equal(expected.as_bytes(), sig.as_bytes()).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hmac_signature() {
        let secret = "super_secret_key";
        let nonce = "123e4567-e89b-12d3-a456-426614174000";
        
        let sig = compute_sig(secret, nonce);
        assert!(verify_sig(secret, nonce, &sig));
        assert!(!verify_sig("wrong_secret", nonce, &sig));
        assert!(!verify_sig(secret, "wrong_nonce", &sig));
        assert!(!verify_sig(secret, nonce, "invalid_sig"));
    }
}
