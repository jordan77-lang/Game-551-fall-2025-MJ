// Simple WebSocket client to test the joint relay server
// Usage:
//   npm install ws
//   node tools/ws-client-test.js ws://localhost:4000

const url = process.argv[2] || 'ws://localhost:4000';
const WebSocket = require('ws');

console.log('Connecting to', url);
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('Connected successfully');
});

ws.on('message', (data) => {
  try {
    const txt = typeof data === 'string' ? data : data.toString();
    console.log('Message:', txt.slice(0, 200));
  } catch (e) {
    console.log('Received data (non-string)');
  }
});

ws.on('close', (code, reason) => {
  console.log('Socket closed', code, reason && reason.toString());
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err && err.message ? err.message : err);
  process.exit(1);
});
