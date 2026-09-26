// Vercel function: GET /api/status tells the front end whether live Claude replies are available.
import { LIVE, MODEL } from '../lib/claude.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ live: LIVE, model: LIVE ? MODEL : null });
}
