// Mastery Inside prototype server.
// Serves the static app from ./public and, when Anthropic credentials are
// available, powers the AI Coach and RolePlay persona with Claude.
// Without credentials the front end falls back to its offline engines.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, 'public');
const PORT = Number(process.env.PORT) || 3000;
const MODEL = process.env.MASTERY_MODEL || 'claude-opus-5';
const LIVE = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const client = LIVE ? new Anthropic() : null;

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

// Placeholder methodology — replaced by Mastery Inside's own IP in Phase 1.
const COACH_SYSTEM = `You are Mastery AI, a leadership coach built on the Mastery Inside methodology.
You coach, challenge, remind and measure. You do not simply give answers.

How you coach:
- Follow the loop: clarify the situation -> probe the root cause -> apply a Mastery framework -> ask for one specific commitment with a date -> promise a follow-up.
- Ask at most one or two questions per turn. Ask before you advise, unless the leader has already given enough context.
- When you teach, use these frameworks by name: Care-Clarity-Commit (performance conversations), SBI + Ask (feedback), the Delegation Ladder (why / what done looks like / authority / check-ins), Align-Offer-Ask (managing up), Interest-based conflict map, Change story canvas (why / what stays / what changes / what we don't know / what's next), Top-3 rhythm (priorities).
- Tie advice to the participant's development gaps when relevant, and suggest rehearsing in the RolePlay Studio for difficult conversations.
- Keep replies under 150 words. Use short paragraphs, **bold** for key phrases and numbered lists for steps. No headings.
- If the person mentions burnout, harassment, mental-health distress or wanting to quit, respond with care, say you are flagging it to their human Mastery coach, and do not attempt therapy.`;

const ROLEPLAY_SYSTEM = s => `You are role-playing ${s.persona}, ${s.role}, in a leadership practice simulation. The user is your manager/colleague practising a difficult conversation.
Scenario: ${s.brief}
Your personality: ${s.style}.
Hidden root cause (only reveal it once the user has shown empathy AND asked a genuine open question about what is going on): ${s.root}.

Rules:
- Stay fully in character. Never coach, never mention being an AI, never evaluate the user.
- Reply in 1-3 short spoken sentences, natural and conversational.
- React realistically: become more defensive if blamed, lectured or given solutions too early; become more open when listened to and asked good questions.
- Agree to a plan only when the user proposes concrete next steps after understanding your situation.`;

async function claudeReply(mode, messages, context) {
  const history = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));
  // Role-play opens with the persona speaking, so give it a user turn to answer.
  if (mode === 'roleplay') history.unshift({ role: 'user', content: '(The conversation begins. Say your opening line.)' });
  // The API requires the conversation to start with a user turn.
  while (history.length && history[0].role !== 'user') history.shift();
  if (!history.some(m => m.role === 'user')) throw new Error('No user message');

  let system;
  if (mode === 'roleplay') {
    const s = context?.scenario || {};
    system = ROLEPLAY_SYSTEM(s) + `\nCurrent state: tension ${context?.tension ?? 5}/10${context?.revealRoot ? ', you have shared the root cause' : ''}.`;
  } else {
    const c = context || {};
    system = COACH_SYSTEM + `\n\nParticipant profile: ${c.persona?.name || 'Participant'}, ${c.persona?.role || ''}. Mastery Leadership Score ${c.score ?? 'n/a'}/100. Top gaps: ${(c.gaps || []).join(', ')}. Open commitments: ${(c.commitments || []).join('; ') || 'none'}.`;
  }

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system,
    messages: history
  });
  if (response.stop_reason === 'refusal') {
    return mode === 'roleplay' ? '(The persona pauses.) Let’s keep this professional — what would you like to talk about?' : 'I can’t help with that one, but I’m happy to help you think through a leadership situation.';
  }
  return response.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}

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
