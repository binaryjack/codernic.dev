import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { URL } from 'url';

try {
    const url = new URL("http://127.0.0.1:9743/events");
    const sseClient = new SSEClientTransport(url);
    console.log("Instantiated.");
} catch (e) {
    console.error(e);
}
