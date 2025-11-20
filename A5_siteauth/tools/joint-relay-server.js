// Minimal WebSocket joint relay test server with a friendly HTTP health page
// Usage:
//  npm install ws
//  node tools/joint-relay-server.js

const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.JOINT_RELAY_PORT ? parseInt(process.env.JOINT_RELAY_PORT, 10) : 4444;

// If certs exist next to server-https.js or in project root, enable HTTPS/WSS
const repoRoot = path.join(__dirname, '..');
const localhostCertPath = path.join(repoRoot, 'localhost.pem');
const localhostKeyPath = path.join(repoRoot, 'localhost-key.pem');
const disableTlsEnv = String(process.env.JOINT_RELAY_FORCE_HTTP || process.env.JOINT_RELAY_DISABLE_TLS || '').trim().toLowerCase();
const disableTokens = ['1', 'true', 'yes', 'on', 'http'];
const enableTokens = ['0', 'false', 'no', 'off', 'https'];
let disableTls = false;
if (disableTlsEnv) {
  disableTls = disableTokens.includes(disableTlsEnv);
  if (enableTokens.includes(disableTlsEnv)) disableTls = false;
}
const tlsOptions = resolveTlsOptions();
const useTLS = !disableTls && !!tlsOptions;

if (disableTlsEnv) {
  console.log(disableTls ? 'Joint relay TLS disabled via environment override. Serving plain WS.' : 'Joint relay TLS override requested but certificates detected, continuing with HTTPS/WSS.');
}

if (!useTLS && !disableTls) {
  console.warn('Joint relay TLS requested but no certificate/key pair was found. Set JOINT_RELAY_CERT_PATH/JOINT_RELAY_KEY_PATH or provide Greenlock certs.');
}

function resolveTlsOptions() {
  const inlineCert = (process.env.JOINT_RELAY_CERT_PEM || process.env.JOINT_RELAY_TLS_CERT || '').trim();
  const inlineKey = (process.env.JOINT_RELAY_KEY_PEM || process.env.JOINT_RELAY_TLS_KEY || '').trim();
  const inlineCa = (process.env.JOINT_RELAY_CA_PEM || process.env.JOINT_RELAY_TLS_CA || '').trim();
  if (inlineCert && inlineKey) {
    return {
      cert: inlineCert.replace(/\\n/g, '\n'),
      key: inlineKey.replace(/\\n/g, '\n'),
      ca: inlineCa ? inlineCa.replace(/\\n/g, '\n') : undefined,
      __source: 'env-inline'
    };
  }

  const explicitCertPath = pickFirstDefined([
    process.env.JOINT_RELAY_CERT_PATH,
    process.env.JOINT_RELAY_CERT_FILE,
    process.env.JOINT_RELAY_TLS_CERT_PATH
  ]);
  const explicitKeyPath = pickFirstDefined([
    process.env.JOINT_RELAY_KEY_PATH,
    process.env.JOINT_RELAY_KEY_FILE,
    process.env.JOINT_RELAY_TLS_KEY_PATH
  ]);
  const explicitCaPath = pickFirstDefined([
    process.env.JOINT_RELAY_CHAIN_PATH,
    process.env.JOINT_RELAY_CA_PATH,
    process.env.JOINT_RELAY_TLS_CA_PATH
  ]);

  const candidates = [];
  if (explicitCertPath && explicitKeyPath) {
    candidates.push({ certPath: explicitCertPath, keyPath: explicitKeyPath, caPath: explicitCaPath, source: 'env-path' });
  }

  const domainHints = `${process.env.JOINT_RELAY_DOMAIN || process.env.APPROVE_DOMAINS || process.env.APPROVED_DOMAINS || ''}`
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
  if (!domainHints.length) domainHints.push('jordan77.httpsexample.xyz');

  const searchRoots = Array.from(new Set([
    process.env.JOINT_RELAY_CERT_DIR,
    process.env.JOINT_RELAY_GREENLOCK_DIR,
    process.env.JOINT_RELAY_LETSENCRYPT_DIR,
    path.join(os.homedir(), '.config', 'greenlock'),
    path.join(os.homedir(), 'greenlock.d'),
    path.join(os.homedir(), 'greenlock'),
    path.join(os.homedir(), 'acme'),
    '/etc/letsencrypt/live',
    '/etc/letsencrypt/archive',
    os.homedir()
  ].filter(Boolean)));

  const nestedPrefixes = ['live', path.join('config', 'live'), path.join('acme', 'live'), ''];
  searchRoots.forEach((rootDir) => {
    domainHints.forEach((domain) => {
      nestedPrefixes.forEach((prefix) => {
        const baseDir = prefix ? path.join(rootDir, prefix, domain) : path.join(rootDir, domain);
        candidates.push({
          certPath: path.join(baseDir, 'fullchain.pem'),
          keyPath: path.join(baseDir, 'privkey.pem'),
          caPath: path.join(baseDir, 'chain.pem'),
          source: baseDir
        });
      });
    });
  });

  candidates.push({ certPath: localhostCertPath, keyPath: localhostKeyPath, source: 'repo-localhost' });

  for (const candidate of candidates) {
    if (!candidate.certPath || !candidate.keyPath) continue;
    if (!fs.existsSync(candidate.certPath) || !fs.existsSync(candidate.keyPath)) continue;
    try {
      const options = {
        cert: fs.readFileSync(candidate.certPath),
        key: fs.readFileSync(candidate.keyPath)
      };
      if (candidate.caPath && fs.existsSync(candidate.caPath)) {
        options.ca = fs.readFileSync(candidate.caPath);
      }
      if (candidate.source) options.__source = candidate.source;
      console.log(`Joint relay TLS certificates loaded from ${candidate.source || candidate.certPath}`);
      return options;
    } catch (err) {
      console.warn('Failed to load TLS files from candidate', candidate.source || candidate.certPath, err.message);
    }
  }
  return null;
}

function pickFirstDefined(values) {
  if (!Array.isArray(values)) return undefined;
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

// Create either HTTP or HTTPS server so the page can show a health page and we can
// host a secure WebSocket (wss://) when certificates exist.
let server;
if (useTLS) {
  const { key, cert, ca } = tlsOptions;
  const options = { key, cert };
  if (ca) options.ca = ca;
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
  ws.on('error', (err) => {
    console.warn('Joint relay socket error', err.message);
  });
});
