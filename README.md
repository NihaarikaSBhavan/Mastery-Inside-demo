# Mastery AI — first-level prototype

A clickable prototype of the **Mastery Inside × TheVertical.ai AI-enabled Leadership & Transformation Platform**:
*from leadership training to continuous, AI-powered leadership transformation.*

It covers the three "build first" products from the requirement, plus the parts around them that make the story work end to end:

| Area | Screen | What it shows |
|---|---|---|
| **Product 1 — Mastery AI Coach** | `#/coach` | 24×7 coach that walks through clarify → probe → framework → commitment → follow-up. It has **Web, WhatsApp and Voice** modes, turns commitments into tracked items, and flags distress keywords to the human coach. |
| **Product 2 — Leadership Assessment** | `#/assessment` | 24 items (a self-rating plus a situational judgement for each of 12 dimensions) produce the **Mastery Leadership Score™**, a radar profile, strengths, gaps and perception gaps, and a 90-day plan (Current → Gap → Intervention → Progress). |
| **Voice RolePlay AI** | `#/roleplay` | 5 scenarios (defensive under-performer, reluctant delegate, peer conflict, pushing back on the CEO, feedback to a star performer). The persona's tension changes with how you speak. At the end you get a **Roleplay Score** across 8 behaviours, strengths and things to improve, and a "try again" prompt. |
| **Product 3 — Transformation Dashboard** | `#/dashboard` | The CHRO view: organisation score, departments, before/after behaviour change (Baseline / Day 30 / Day 60 toggle), capability gaps, a department × capability heatmap, risk signals ("Predict") and ROI. |
| 90-day Behaviour Change Engine | `#/journey` | Program timeline, focus-goal trend, the weekly 5-question delegation check-in, a WhatsApp nudge cadence, AI reflection after meetings, and commitments. |
| Leadership 360 Intelligence | `#/feedback` | Self vs manager vs team vs AI, with the perception gap detected automatically. |
| Human + AI coach model | `#/console` | Coach caseload, the AI escalation queue (your own coach-chat escalations show up here) and capacity. |
| AI lead gen + proposal | `#/consultant` | A website AI consultant qualifies a lead into a live CRM card and lead score. It simulates the voice call-back and auto-generates a client proposal you can print. |

> All frameworks, questions, scores and people are **illustrative placeholders**. Phase 1 ("Discover") replaces them with Mastery Inside's own IP. The placeholder frameworks live in `public/js/data.js` and `public/js/engine.js` (the `PLAYBOOK`), and in the system prompt in `server.js`.

## Run it

**Option A: no install, offline AI.** Open `public/index.html` in a browser. Everything works with the built-in rule-based engines. State is saved in the browser's localStorage, and **Reset demo** in the sidebar clears it.

**Option B: local server, with live Claude replies optional.**

```bash
npm install
npm start                                   # http://localhost:3000 — offline engines
ANTHROPIC_API_KEY=sk-ant-... npm start      # coach + role-play persona replies from Claude
```

With a key set, the **AI Coach** and the **RolePlay persona** replies come from Claude (`claude-opus-5` by default; override with `MASTERY_MODEL`). Scoring stays deterministic in the browser, so results are comparable from one attempt to the next. If the API call fails, the UI falls back to the offline engine without the user noticing.

**Voice** uses the browser's Web Speech API. Speech input works in Chrome and Edge; spoken replies work in all modern browsers. In a real deployment this is where TheVertical.ai's Voice AI plugs in (speech → AI reasoning → coaching → speech).

## Tests

```bash
npm test
```

These cover the assessment scoring and perception gaps, the coach conversation flow, safety escalation, the role-play persona and evaluator (a skilled conversation vs a blaming one), and lead scoring and recommendation.

## Structure

```
public/
  index.html        app shell + navigation
  css/app.css       design tokens (light/dark) + components
  js/data.js        dimensions, assessment items, scenarios, demo org data
  js/engine.js      assessment, coach, role-play and lead engines + live-AI client
  js/charts.js      small SVG chart helpers (radar, bars, line, heatmap, ring)
  js/app.js         router and the nine views
server.js           static server + /api/chat (Claude) + /api/status
test/               node:test unit tests for the engines
```

## What a production build would add

- **Mastery Knowledge Brain:** ingest Mastery Inside's frameworks, material and case studies (RAG / knowledge graph), so answers come from their IP.
- Real channels: a WhatsApp Business API integration and TheVertical.ai Voice AI for coaching, role-play and inbound-lead calls.
- Accounts, roles (participant / coach / HR), multi-tenant org data, SSO, and a database in place of localStorage.
- Validated psychometrics for the assessment, 360 survey collection, and analysis of meeting recordings (Meeting Coach).
- A CRM integration (lead routing, proposals) and the AI Content Engine.
