import WebSocket from 'ws';
const ws = new WebSocket('ws://localhost:48321');
ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'codernic:request-assets' }));
});
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'codernic:assets-payload') {
    console.log("DAGS:", msg.payload.dags);
    ws.close();
  }
});
ws.on('error', (e) => console.error("WS error:", e));
