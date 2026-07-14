// Strategy interface for API Communication
export interface ApiClientStrategy {
  query(text: string, options?: { auth_token?: string; session_id?: string }): Promise<any>;
}

export class RestApiClient implements ApiClientStrategy {
  constructor(private baseUrl: string) {}

  async query(text: string, options?: { auth_token?: string; session_id?: string }): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options?.auth_token) {
      headers['Authorization'] = `Bearer ${options.auth_token}`;
    }

    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, session_id: options?.session_id }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
}

export class WebSocketApiClient implements ApiClientStrategy {
  constructor(private socketEndpoint: string) {}

  async query(text: string, options?: { auth_token?: string; session_id?: string }): Promise<any> {
    // WebSocket implementation logic mimicking the current MCP Daemon Bridge
    // For now, this is a stub that could be expanded using our existing daemon-bridge patterns
    console.log(`[WS] Sending query: ${text}`, options);
    return Promise.resolve({ response: "WebSocket stub response" });
  }
}

// Factory or default instance
export const apiClient = new RestApiClient('/api/v1/chatbot');
