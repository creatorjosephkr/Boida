const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Module-level ref: set after startServer() is called, used by broadcastFrame()
let _activeReceivers = null;
let _activeSenders = null;
let _onDisconnect = null;
let _onFrameReceived = null;
let _onSenderDisconnect = null;
let _server = null;
let _vite = null;
let _wss = null;

function broadcastFrame(buffer) {
  if (!_activeReceivers) return;
  for (const r of _activeReceivers) {
    if (r.readyState === 1) r.send(buffer, { binary: true });
  }
}

function setDisconnectHandler(fn) { _onDisconnect = fn; }
function setFrameHandler(fn) { _onFrameReceived = fn; }
function setSenderDisconnectHandler(fn) { _onSenderDisconnect = fn; }

async function stopServer() {
  if (_activeReceivers) {
    for (const ws of _activeReceivers) {
      try { ws.terminate(); } catch (e) {}
    }
    _activeReceivers.clear();
  }
  if (_activeSenders) {
    for (const ws of _activeSenders) {
      try { ws.terminate(); } catch (e) {}
    }
    _activeSenders.clear();
  }
  if (_wss) {
    try { _wss.close(); } catch (e) {}
    _wss = null;
  }
  if (_server) {
    try { _server.close(); } catch (e) {}
    _server = null;
  }
  if (_vite) {
    try { await _vite.close(); } catch (e) {}
    _vite = null;
  }
}

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name in ifaces) {
    for (const alias of ifaces[name]) {
      if (alias.family === 'IPv4' && !alias.internal &&
          (name.toLowerCase().includes('en') || name.toLowerCase().includes('wlan'))) {
        return alias.address;
      }
    }
  }
  for (const name in ifaces) {
    for (const alias of ifaces[name]) {
      if (alias.family === 'IPv4' && !alias.internal) return alias.address;
    }
  }
  return 'localhost';
}

async function startServer(isPackaged = false) {
  const app = express();
  _server = createServer(app);
  _wss = new WebSocketServer({ noServer: true });
  const PORT = 3000;
  const localIP = getLocalIP();

  const activeReceivers = new Set();
  const activeSenders = new Set();
  _activeReceivers = activeReceivers; // expose for broadcastFrame()
  _activeSenders = activeSenders;

  _wss.on('connection', (ws, req) => {
    let isSender = false;
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      isSender = parsedUrl.searchParams.get('type') === 'sender';
    } catch (_) {}

    if (isSender) {
      activeSenders.add(ws);
      console.log('[보이다] iOS Sender connected from', req?.socket?.remoteAddress || 'unknown');

      ws.on('message', (data) => {
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
        broadcastFrame(buf);
        if (_onFrameReceived) {
          _onFrameReceived(buf);
        }
      });

      ws.on('close', () => {
        activeSenders.delete(ws);
        console.log('[보이다] iOS Sender disconnected');
        _onSenderDisconnect?.();
      });

      ws.on('error', (err) => {
        activeSenders.delete(ws);
        console.warn('[보이다] iOS Sender socket error:', err.message);
      });
    } else {
      activeReceivers.add(ws);
      ws.on('close', () => activeReceivers.delete(ws));
      ws.on('error', () => activeReceivers.delete(ws));
    }
  });

  _server.on('upgrade', (req, socket, head) => {
    if (new URL(req.url, `http://localhost`).pathname === '/ws') {
      _wss.handleUpgrade(req, socket, head, ws => _wss.emit('connection', ws, req));
    } else {
      socket.destroy();
    }
  });

  app.get('/api/info', (req, res) => res.json({ ip: localIP, port: PORT }));
  app.post('/api/disconnect', (req, res) => { res.status(200).end('ok'); _onDisconnect?.(); });

  // Dynamically load Vite ONLY during development. In production (packaged), serve static build files.
  if (!isPackaged) {
    const vite = require('vite');
    _vite = await vite.createServer({ server: { middlewareMode: true }, appType: 'custom' });
    app.use(_vite.middlewares);
    app.use('*', async (req, res, next) => {
      try {
        const raw = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(
          await _vite.transformIndexHtml(req.originalUrl, raw)
        );
      } catch (e) { _vite.ssrFixStacktrace(e); next(e); }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  return new Promise((resolve, reject) => {
    _server.once('error', (err) => {
      console.error('[보이다] Server error:', err.message);
      reject(err);
    });
    _server.listen(PORT, () => {
      console.log(`\n🌌 보이다(Boida)  ▸  http://localhost:${PORT}  |  ws://${localIP}:${PORT}/ws\n`);
      resolve(_server);
    });
  });
}

if (!process.versions.electron && require.main === module) startServer();

module.exports = {
  startServer,
  stopServer,
  broadcastFrame,
  setDisconnectHandler,
  setFrameHandler,
  setSenderDisconnectHandler
};
