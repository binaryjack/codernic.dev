const net = require('net');
const ws = require('ws');
const socket = new ws('ws://127.0.0.1:48321');

socket.on('open', () => {
  console.log('Connected!');
  socket.send(JSON.stringify({
    type: 'codernic:save-asset',
    payload: {
      type: 'config/llms',
      id: 'google.provider',
      content: JSON.stringify({
        type: 'cloud-google',
        apiKey: 'AIzaSyTestKey123',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
      })
    }
  }));
});

socket.on('message', (msg) => {
  console.log('RECV:', msg.toString());
  setTimeout(() => process.exit(0), 1000);
});
