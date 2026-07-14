# Cloud Vendors Integration

Codernic Enterprise is fully agnostic to your cloud infrastructure. While it thrives as a local on-premise daemon, it securely integrates with major cloud vendors (AWS, Azure, Google Cloud, IBM Cloud, GitHub Cloud) to leverage managed services for Blob Storage, Secrets Management, and KMS (Key Management).

## The CloudProviderConfig

At the core of the `ConfigurationManager` is the `CloudProviderConfig`. This instructs the daemon on which vendor to use for abstractions like `CloudBlobStorage` (for LoRA Checkpoints) and `SecretsManager` (for BYOK API Keys).

The easiest way to configure this is via Environment Variables on the host machine running `codernic-enterprise` or the `pirsig-proxy`:

### 1. AWS Configuration
To use AWS S3 and AWS Secrets Manager:
```bash
export AWS_PROFILE="production"
export AWS_REGION="us-east-1"
# Or provide keys directly:
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
```
Codernic automatically detects the AWS environment and instantiates the AWS SDK wrappers.

### 2. Azure Configuration
To use Azure Blob Storage and Azure Key Vault:
```bash
export AZURE_TENANT_ID="your-tenant-uuid"
export AZURE_CLIENT_ID="your-client-uuid"
export AZURE_CLIENT_SECRET="your-client-secret"
```

### 3. Google Cloud (GCP) Configuration
To use GCS and Google Secret Manager:
```bash
export GCP_PROJECT_ID="your-project-id"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

### 4. IBM Cloud Configuration
For IBM Cloud Object Storage and Secrets Manager:
```bash
export IBM_SERVICE_INSTANCE="your-instance-crn"
export IBM_API_KEY="your-api-key"
```

## Hybrid Cloud Strategy

Codernic is fundamentally designed to limit cloud exposure. The "Hybrid" approach means:
- **Code Parsing & RAG Context:** Runs 100% locally on the developer's laptop or local server.
- **Agent Orchestration (DAGs):** Runs locally via the Daemon.
- **LLM Inference:** Delegated to the Cloud (Azure OpenAI, AWS Bedrock) ONLY after the AST Anonymizer has scrubbed the data.
- **LoRA Storage:** Checkpoints are synced to your Cloud Vendor's blob storage via the `CheckpointManager` for high availability across your team.
