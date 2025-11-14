// Minimal WebSocket joint relay test server with a friendly HTTP health page
// Usage:
//  npm install ws
//  node tools/joint-relay-server.js

const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = process.env.JOINT_RELAY_PORT ? parseInt(process.env.JOINT_RELAY_PORT) : 4000;

// If certs exist next to server-https.js or in project root, enable HTTPS/WSS
const repoRoot = path.join(__dirname, '..');
const certPath = path.join(repoRoot, 'localhost.pem');
const keyPath = path.join(repoRoot, 'localhost-key.pem');
const useTLS = fs.existsSync(certPath) && fs.existsSync(keyPath);

// Create either HTTP or HTTPS server so the page can show a health page and we can
// host a secure WebSocket (wss://) when certificates exist.
let server;
if (useTLS) {
  const options = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
  server = https.createServer(options, (req, res) => {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<html><head><title>Joint Relay (WSS)</title></head><body style="font-family:Arial,Helvetica,sans-serif;background:#08101a;color:#cbd5e1;">
        <h2 style="color:#22d3ee">Joint Relay Test Server (WSS enabled)</h2>
        <p>WebSocket endpoint: <code>wss://${req.headers.host}</code></p>
        <p>Status: <strong id="status">starting</strong></p>
        <p>This server accepts secure WebSocket connections and streams test joint frames. Use a WebSocket client or your landing page Relay UI to connect.</p>
        </body></html>`);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });
} else {
  server = http.createServer((req, res) => {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<html><head><title>Joint Relay</title></head><body style="font-family:Arial,Helvetica,sans-serif;background:#08101a;color:#cbd5e1;">
        <h2 style="color:#22d3ee">Joint Relay Test Server</h2>
        <p>WebSocket endpoint: <code>ws://localhost:${PORT}</code></p>
        <p>Status: <strong id="status">starting</strong></p>
        <p>This server accepts WebSocket connections and streams test joint frames. Use a WebSocket client or your landing page Relay UI to connect.</p>
        </body></html>`);
      return;
    }
    // Other paths: 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });
}

const wss = new WebSocket.Server({ server });

server.listen(PORT, '0.0.0.0', () => {
  if (useTLS) console.log(`Joint relay test server listening on https://0.0.0.0:${PORT} and wss://0.0.0.0:${PORT}`);
  else console.log(`Joint relay test server listening on http://0.0.0.0:${PORT} and ws://0.0.0.0:${PORT}`);
});

function makeQuatFromEuler(x,y,z) {
  // simple Euler (XYZ)
  const c1 = Math.cos(x/2), c2 = Math.cos(y/2), c3 = Math.cos(z/2);
  const s1 = Math.sin(x/2), s2 = Math.sin(y/2), s3 = Math.sin(z/2);
  return [s1*c2*c3 + c1*s2*s3, c1*s2*c3 - s1*c2*s3, c1*c2*s3 + s1*s2*c3, c1*c2*c3 - s1*s2*s3];
}

wss.on('connection', (ws, req) => {
  console.log('Client connected from', req.socket.remoteAddress);
  const interval = setInterval(() => {
    const t = Date.now();
    // simple animated positions for testing
    const head = { name: 'head', p: [0,1.6,0.05], q: makeQuatFromEuler(0, Math.sin(t/1000)*0.1, 0) };
    const left_wrist = { name: 'left_wrist', p: [-0.25,1.3,0.1], q: makeQuatFromEuler(0,0,Math.sin(t/600)*0.6) };
    const right_wrist = { name: 'right_wrist', p: [0.25,1.3,0.1], q: makeQuatFromEuler(0,0,Math.cos(t/600)*0.6) };
    const hips = { name: 'hips', p: [0,0.0,0], q: [0,0,0,1] };
    const frame = { t, frame: Math.floor(t/16), joints: [head, left_wrist, right_wrist, hips] };
    try { ws.send(JSON.stringify(frame)); } catch (e) {}
  }, 50);
  ws.on('close', () => clearInterval(interval));
});
