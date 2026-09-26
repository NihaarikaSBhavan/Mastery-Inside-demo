// Mastery Inside prototype server.
// Serves the static app from ./public and, when Anthropic credentials are
// available, powers the AI Coach and RolePlay persona with Claude.
// Without credentials the front end falls back to its offline engines.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Anthropic, LIVE, MODEL, claudeReply } from './lib/claude.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, 'public');
const PORT = Number(process.env.PORT) || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readJson(req, limit = 200_000) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > limit) throw new Error('Body too large'); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname === '/api/status') return send(res, 200, { live: LIVE, model: LIVE ? MODEL : null });
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      if (!LIVE) return send(res, 503, { error: 'Live AI not configured' });
      const { mode, messages, context } = await readJson(req);
      try {
        const text = await claudeReply(mode === 'roleplay' ? 'roleplay' : 'coach', Array.isArray(messages) ? messages : [], context);
        return send(res, 200, { text });
      } catch (err) {
        if (err instanceof Anthropic.RateLimitError) return send(res, 429, { error: 'Rate limited' });
        if (err instanceof Anthropic.APIError) { console.error('Claude API error', err.status, err.message); return send(res, 502, { error: 'AI error' }); }
        throw err;
      }
    }
    // static files
    const rel = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.normalize(path.join(PUBLIC, rel));
    if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Forbidden', 'text/plain');
    const data = await fs.readFile(file);
    return send(res, 200, data, TYPES[path.extname(file)] || 'application/octet-stream');
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'EISDIR') return send(res, 404, 'Not found', 'text/plain');
    console.error(err);
    return send(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Mastery Inside prototype → http://localhost:${PORT}`);
  console.log(LIVE ? `Live AI: Claude (${MODEL})` : 'Live AI: off (set ANTHROPIC_API_KEY to enable). Offline engines in use.');
});
