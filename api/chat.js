// Vercel function: POST /api/chat returns a Claude reply for the AI Coach or a role-play persona.
import { Anthropic, LIVE, claudeReply } from '../lib/claude.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!LIVE) return res.status(503).json({ error: 'Live AI not configured' });
  const { mode, messages, context } = req.body || {};
  try {
    const text = await claudeReply(mode === 'roleplay' ? 'roleplay' : 'coach', Array.isArray(messages) ? messages : [], context);
    return res.status(200).json({ text });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'Rate limited' });
    if (err instanceof Anthropic.APIError) { console.error('Claude API error', err.status, err.message); return res.status(502).json({ error: 'AI error' }); }
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
