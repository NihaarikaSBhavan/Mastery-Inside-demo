# Mastery AI — first-level prototype

A clickable prototype of the **Mastery Inside × TheVertical.ai AI-enabled Leadership & Transformation Platform**:
*from leadership training to continuous, AI-powered leadership transformation.*

It covers the three "build first" products from the requirement, plus the parts around them that make the story work end to end:

| Area | Screen | What it shows |
|---|---|---|
| **Product 1 — Mastery AI Coach** | `#/coach` (tabs: `today`, `chat`, `plan`, `insights`, `human`) | A five-tab coaching hub. **Today**: a coach briefing, the last session's coaching score with four behaviour sub-scores, this week's focus with targets and "why this focus", and quick starts. **Conversations**: session types (prepare, reflect, plan, ask), a live Clarify → Probe → Framework → Commit → Follow-up stepper, an auto-saved session summary, and searchable history. **Plan & commitments**: an Open / Done / Missed board, follow-through, streak and weekly targets. **Insights**: Amplify / Develop / Release themes from the intake, Day-1 assessment and 360 feedback, with evidence and trends. **Human coach**: next session with a join countdown, agenda, an AI prep brief, past-session notes, shared documents and privacy controls. It keeps Web, WhatsApp and Voice channels and flags wellbeing concerns to the human coach. |
| **Product 2 — Leadership Assessment** | `#/assessment` | 24 items (a self-rating plus a situational judgement for each of 12 dimensions) produce the **Mastery Leadership Score™**, a radar profile, strengths, gaps and perception gaps, and a 90-day plan (Current → Gap → Intervention → Progress). |
| **Voice RolePlay AI** | `#/roleplay` | 5 scenarios (defensive under-performer, reluctant delegate, peer conflict, pushing back on the CEO, feedback to a star performer). The persona's tension changes with how you speak. At the end you get a **Roleplay Score** across 8 behaviours, strengths and things to improve, and a "try again" prompt. |
| **Product 3 — Transformation Dashboard** | `#/dashboard` | The CHRO view: organisation score, departments, before/after behaviour change (Baseline / Day 30 / Day 60 toggle), capability gaps, a department × capability heatmap, risk signals ("Predict") and ROI. |
| 90-day Behaviour Change Engine | `#/journey` | Program timeline, focus-goal trend, the weekly 5-question delegation check-in, a WhatsApp nudge cadence, AI reflection after meetings, and commitments. |
| Leadership 360 Intelligence | `#/feedback` | Self vs manager vs team vs AI, with the perception gap detected automatically. |
| Human + AI coach model | `#/console` | Coach caseload, the AI escalation queue (your own coach-chat escalations show up here) and capacity. |
| AI lead gen + proposal | `#/leads` | A website AI consultant qualifies a lead into a live CRM card and lead score. It simulates the voice call-back and auto-generates a client proposal you can print. |

> All frameworks, questions, scores and people are **illustrative placeholders**. Phase 1 ("Discover") replaces them with Mastery Inside's own IP. The placeholder frameworks live in `public/js/data.js` and `public/js/engine.js` (the `PLAYBOOK`), and in the system prompt in `server.js`.

## Roles and access

The app opens on a sign-in screen with one sample account per role. Each role sees only its own pages; any other page shows an access-denied screen. The rules live in `MI.ROLES` (`public/js/data.js`) and are checked by `MI.canAccess` in the router.

| Role | Sample user | Pages |
|---|---|---|
| Participant | Priya Sharma (Acme) | Discover, AI Coach, Assessment, RolePlay, Journey, 360° feedback |
| Mastery coach | Anjali Menon | Coach console, RolePlay library (assign & preview) |
| HR / CHRO | Kavita Desai (Acme) | Leadership dashboard (aggregated; no coaching conversation content) |
| Sales | Rohan Kapoor | Leads & proposals |
| Platform admin | Nisha Kulkarni | Users & roles, plus read-only dashboard, coach console and leads |

Private coaching conversations are visible only to the participant. Use **Switch account** in the sidebar to change role. This is client-side access control for demonstration; production needs server-side authentication and authorisation.

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

## Deploy to Vercel

The repo is ready for Vercel: `vercel.json` serves `public/` as a static site, and `api/status.js` and `api/chat.js` run as serverless functions sharing `lib/claude.js` with the local server.

1. In Vercel, choose **Add New → Project** and import `NihaarikaSBhavan/Mastery-Inside-demo`.
2. Keep the defaults (Framework preset: **Other**). The build and output settings come from `vercel.json`.
3. Optional: under **Settings → Environment Variables**, add `ANTHROPIC_API_KEY` for live Claude replies. Without it, the app uses its offline engines.
4. Deploy. Pushes to the production branch redeploy automatically; other branches get preview URLs.

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
server.js           local static server + /api/chat (Claude) + /api/status
lib/claude.js       shared Claude integration (system prompts, request)
api/                Vercel serverless functions: status.js, chat.js
vercel.json         Vercel config (static output: public/)
test/               node:test unit tests for the engines
```

## What a production build would add

- **Mastery Knowledge Brain:** ingest Mastery Inside's frameworks, material and case studies (RAG / knowledge graph), so answers come from their IP.
- Real channels: a WhatsApp Business API integration and TheVertical.ai Voice AI for coaching, role-play and inbound-lead calls.
- Accounts, roles (participant / coach / HR), multi-tenant org data, SSO, and a database in place of localStorage.
- Validated psychometrics for the assessment, 360 survey collection, and analysis of meeting recordings (Meeting Coach).
- A CRM integration (lead routing, proposals) and the AI Content Engine.
