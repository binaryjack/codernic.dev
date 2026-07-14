import { createChatState } from '@binaryjack/state-factories';

export class ChatFactory {
  static createExhaustiveChatMock() {
    const state = createChatState({
      messages: [
        { id: 'msg-sys', role: 'system', text: 'You are an AI orchestrator.' },
        { id: '1', role: 'user', text: 'We need a new scalable architecture for the e-commerce microservices.' },
        {
          id: 'demo-msg-1',
          role: 'assistant',
          text: "<think>Analyzing user request. Scalability is key. I'll propose a monolithic architecture first as a baseline, but Pirsig will likely catch this.</think>\n\nI suggest we start with a robust monolithic approach using Node.js. It simplifies deployment and initial scaling.",
          diagnostic: {
            title: 'Architecture Conflict',
            message: 'Monolith proposed but user explicitly requested microservices.',
            code: 'ARCH_001',
            fix_suggestion: 'Pirsig Flagged: Revise to microservices.',
            documentation_url: 'https://docs.codernic.ai'
          }
        },
        {
          id: 'demo-msg-2',
          role: 'assistant',
          text: "<think>[PIRSIG ALIGNMENT] The Reviewer agent (Pirsig) has flagged a contradiction. The user explicitly requested microservices. Realigning architectural proposal.</think>\n\nWait, correcting my previous statement: Since you explicitly require high scalability and microservices, a monolithic approach contradicts your needs. We will align with a robust microservices topology using Kubernetes, Docker, and gRPC for inter-service communication.",
          toolCalls: [
            { id: 't1', name: 'search_docs', args: { query: 'kubernetes microservices best practices' }, status: 'success', result: 'Found architectural patterns.' },
            { id: 't2', name: 'calculate_cost', args: { nodes: '10' }, status: 'failed', result: 'Timeout error.' }
          ]
        },
        { id: '2', role: 'user', text: 'Yes, exactly! Please generate the structural schema snapshot for that and run the diagnostic tools.' },
        {
          id: 'demo-msg-3',
          role: 'assistant',
          text: "<think>I need to generate a structural schema snapshot for the user to review. I will also run the requested tool to fetch additional diagnostics.</think>\n\nHere is the schema snapshot:\n\n```erathos-snapshot\n{\n  \"workspace\": {\n    \"name\": \"Mock Workspace\",\n    \"version\": \"1\",\n    \"last_modified\": \"2023-01-01T00:00:00.000Z\",\n    \"active_canvas_id\": \"canvas-default\",\n    \"canvases\": {\n      \"canvas-default\": {\n        \"id\": \"canvas-default\",\n        \"name\": \"Canvas 1\",\n        \"active_schema_id\": \"schema-default\",\n        \"viewport\": { \"pan\": { \"x\": 0, \"y\": 0 }, \"zoom\": 1 },\n        \"schemas\": {\n          \"schema-default\": {\n            \"id\": \"schema-default\",\n            \"name\": \"MVVM Architecture\",\n            \"type\": \"freeform\",\n            \"entities\": [],\n            \"links\": []\n          }\n        }\n      }\n    }\n  }\n}\n```\n\nAnd I executed the diagnostic tools.",
          toolCalls: [
            { id: 't3', name: 'run_diagnostics', args: { scope: 'services' }, status: 'running' }
          ]
        },
        {
          id: 'demo-msg-pirsig-report',
          role: 'assistant',
          text: "Here is the B2B Sovereign Gate Keeper data scrubbing verification report:\n\n```pirsig-report\n{\n  \"sessionId\": \"demo-session\",\n  \"overallStatus\": \"processed\",\n  \"entries\": [\n    { \"originalData\": \"Alice\", \"replacedBy\": \"[SCRUBBED_HASH_73f91]\", \"status\": \"processed\" },\n    { \"originalData\": \"Bob\", \"replacedBy\": \"[SCRUBBED_HASH_a8c23]\", \"status\": \"processed\" }\n  ]\n}\n```",
          metrics: {
            ttft_ms: 120,
            tokens_per_second: 55,
            vram_allocated_bytes: 8500000000,
            context_tokens_count: 4500
          }
        },
        {
          id: 'demo-msg-plan-cta',
          role: 'plan-cta',
          text: 'This is the implementation plan schema to align internal configurations, deploy the Kubernetes configurations, and implement the gateway logic.',
          cost: '$0.0042',
          duration: '1m 15s',
          task: 'Define deployment yaml templates and register the Kubernetes microservice endpoints.'
        }
      ] as any
    });
    return state.messages;
  }

  static createSetSendingDispatch() {
    return {
      type: 'chat/setSending',
      payload: true
    };
  }

  static createSetThinkingDispatch() {
    return {
      type: 'chat/setThinking',
      payload: { sessionId: 'demo-session', state: { phase: 'reasoning' } }
    };
  }

  static createDispatchAction() {
    return {
      type: 'chat/setMessages',
      payload: this.createExhaustiveChatMock()
    };
  }

  static createSetContextFilesDispatch() {
    const state = createChatState({
      contextFiles: [
        {
          id: 'demo-file-1',
          filePath: '/src/services/auth.ts',
          fileName: 'auth.ts',
          lines: [10, 25]
        },
        {
          id: 'demo-file-2',
          filePath: '/src/services/cart.ts',
          fileName: 'cart.ts',
          lines: [1, 50]
        }
      ]
    });
    return {
      type: 'chat/setContextFiles',
      payload: state.contextFiles
    };
  }
}
