# Enterprise Chatbot Integration

The **Codernic Enterprise Chatbot** provides a fully decoupled, embeddable React widget and a stateless REST API, allowing you to bring Codernic's powerful RAG (Retrieval-Augmented Generation) capabilities into your existing corporate portals, such as SharePoint, Office 365, or custom intranet applications.

## Key Capabilities

- **Unified RAG Engine**: Instantly search across all your indexed corporate repositories (PDFs, Word Docs, Codebases).
- **Zero-Trust Security**: Fully integrated with your Identity Access Management (IAM) provider. A user will only receive answers constructed from documents they explicitly have permission to view.
- **Headless API**: Communicate with the chatbot via a lightweight, stateless REST API over HTTP.

## Embedding the Widget

The Chatbot Widget is shipped as an atomic component within the `@ai-agencee/ui` package.

### 1. Installation

If you are using a modern JavaScript bundler (Webpack, Vite):

```bash
npm install @ai-agencee/ui
```

### 2. Implementation

Render the `EnterpriseChatbotWidget` in your React application. You will need to inject the appropriate authorization token (e.g., from MSAL / EntraID) into the API Client strategy.

```tsx
import { EnterpriseChatbotWidget } from '@ai-agencee/ui/chat';
import { apiClient } from '@ai-agencee/ui/api-client';

// Configure the backend REST endpoint
apiClient.setBaseUrl('https://codernic.yourcompany.internal/api/v1/chatbot');

export function MyIntranetPortal() {
  return (
    <div style={{ height: '600px', width: '400px' }}>
      <EnterpriseChatbotWidget />
    </div>
  );
}
```

## Direct API Access

If you prefer to build your own custom UI layout, you can directly interface with the Headless API.

### Endpoint
`POST /api/v1/chatbot/query`

### Headers
- `Content-Type: application/json`
- `Authorization: Bearer <your_jwt_or_saml_token>`

### Request Body
```json
{
  "text": "Summarize the Q3 Financial Report",
  "session_id": "optional-uuid"
}
```

### Response Body
```json
{
  "text": "(Authorized RAG response for: Summarize the Q3 Financial Report)"
}
```

> **Note on Authorization**: 
> The bearer token is instantly verified against the internal `IamManager`. If the token lacks the `codebase_read` or required RBAC roles mapped to the requested documents, the API will immediately return a `401 Unauthorized`.
