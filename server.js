const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { handleCheckout } = require('./backend/checkout');

const PORT = Number(process.env.PORT || 8000);
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sanitizePathname(pathname) {
  const normalized = path.normalize(pathname).replace(/^([.][.][\/\\])+/, '');
  return normalized === '/' ? '/index.html' : normalized;
}

function serveStatic(req, res, parsedUrl) {
  const safePath = sanitizePathname(parsedUrl.pathname);
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    sendJson(res, 403, { ok: false, error: 'Acceso denegado.' });
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (error.code === 'ENOENT') {
        sendJson(res, 404, { ok: false, error: 'Archivo no encontrado.' });
      } else {
        sendJson(res, 500, { ok: false, error: 'Error leyendo archivo estático.' });
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function createServer() {
  return http.createServer((req, res) => {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'POST' && parsedUrl.pathname === '/api/checkout') {
      handleCheckout(req, res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendJson(res, 405, { ok: false, error: 'Método no permitido.' });
      return;
    }

    serveStatic(req, res, parsedUrl);
  });
}

createServer().listen(PORT, () => {
  console.log(`Servidor Node.js activo en http://localhost:${PORT}`);
});
