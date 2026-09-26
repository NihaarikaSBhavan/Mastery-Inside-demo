// Unit tests for the offline AI engines (run: npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {}, localStorage: undefined, console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['data.js', 'engine.js']) vm.runInContext(fs.readFileSync(new URL(`../public/js/${f}`, import.meta.url), 'utf8'), ctx);
const MI = ctx.MI;

test('assessment: best answers score high, weak answers produce gaps', () => {
  const best = MI.ASSESSMENT.map(q => q.type === 'likert' ? 5 : q.options.findIndex(o => o[1] >= 90));
  const r = MI.assess.score(best);
  assert.ok(r.overall >= 90, `overall ${r.overall}`);
  assert.equal(r.gaps.length, 3);
  assert.equal(r.plan.length, 3);

  const mixed = MI.ASSESSMENT.map(q => q.dim === 'delegation' ? (q.type === 'likert' ? 5 : 0) : (q.type === 'likert' ? 4 : q.options.findIndex(o => o[1] >= 90)));
  const r2 = MI.assess.score(mixed);
  assert.equal(r2.gaps[0].key, 'delegation');
  assert.deepEqual([...MI.assess.perceptionGaps(mixed)], ['Delegation']);
});

test('coach: walks clarify → probe → framework → commitment', () => {
  const report = MI.assess.report(MI.SEED_ASSESSMENT);
  const c = { report, commitments: [] };
  let st = { topic: null, stage: 0 };
  let r = MI.coach.reply('I have a difficult conversation with my CEO tomorrow', st, c);
  assert.equal(r.state.topic, 'ceo'); st = r.state;
  r = MI.coach.reply('He is under board pressure to go live in four weeks', st, c); st = r.state;
  r = MI.coach.reply('I want a phased plan we both agree on', st, c); st = r.state;
  assert.match(r.text, /Align/);
  r = MI.coach.reply('I will present the phased plan on Thursday', st, c);
  assert.ok(r.commitment);
});

test('coach: safety keywords escalate to the human coach', () => {
  const r = MI.coach.reply('I think I am burning out, honestly burnout is real', { topic: null, stage: 0 }, { report: MI.assess.report(MI.SEED_ASSESSMENT), commitments: [] });
  assert.equal(r.escalate, true);
});

test('coach: weekly plan uses the top gap', () => {
  const report = MI.assess.report(MI.SEED_ASSESSMENT);
  const r = MI.coach.reply('I committed to improving delegation. What should I do this week?', { topic: null, stage: 0 }, { report, commitments: [] });
  assert.match(r.text, /Focus: Delegation/);
});

function play(lines, id = 'underperformer') {
  const scn = MI.SCENARIOS.find(s => s.id === id);
  const state = { tension: scn.tension, rootRevealed: false, rootShared: false, agreed: 0, i: 0 };
  const turns = [{ role: 'persona', text: scn.opening }];
  let asked = false;
  lines.forEach((l, i) => {
    const prev = [...turns].reverse().find(t => t.role === 'persona').text;
    const f = MI.roleplay.analyse(l, prev, i + 1, asked);
    if (f.openQ) asked = true;
    turns.push({ role: 'user', text: l, f });
    turns.push({ role: 'persona', text: MI.roleplay.respond(scn, state, f).text });
  });
  return { ev: MI.roleplay.evaluate(turns, state), state, turns };
}

test('roleplay: skilled conversation uncovers root cause and scores well', () => {
  const { ev, state } = play([
    'Thanks for coming in, Rahul. I appreciate it has been a tough few months. How are you doing, and what do you think is getting in the way?',
    'That sounds really hard, I understand. Thank you for telling me. What would help you most right now?',
    "Let's agree a plan together: we rebuild your account list this week and check in every Friday. I'll support you with the handover.",
    "Let's put the first check-in on Friday at 10 and agree the next step then."
  ]);
  assert.equal(state.rootShared, true);
  assert.ok(ev.overall >= 70, `overall ${ev.overall}`);
  assert.ok(ev.resolved);
});

test('roleplay: blaming conversation scores poorly with specific feedback', () => {
  const { ev } = play(['You need to fix your numbers. This is unacceptable, you always have an excuse.', 'You should just work harder!!']);
  assert.ok(ev.overall < 50, `overall ${ev.overall}`);
  assert.ok(ev.improve.some(s => /too early/.test(s)));
  assert.ok(ev.improve.some(s => /blaming/i.test(s)));
});

test('leads: large, urgent enquiry is hot and gets the transformation program', () => {
  const a = { size: '5,000+', participants: '200+', timeline: 'This month', budget: '₹50L+', format: 'End-to-end transformation', level: 'Middle managers' };
  assert.equal(MI.leads.score(a).tier, 'Hot');
  assert.equal(MI.leads.recommend(a), 'transformation');
  assert.equal(MI.leads.recommend({ ...a, format: 'Assessment only' }), 'assessment');
});

test('rbac: each role reaches only its own pages', () => {
  for (const [key, r] of Object.entries(MI.ROLES)) {
    assert.ok(MI.canAccess(key, r.home), `${key} can open its home`);
  }
  assert.equal(MI.canAccess('participant', 'dashboard'), false);
  assert.equal(MI.canAccess('participant', 'access'), false);
  assert.equal(MI.canAccess('coach', 'coach'), false, 'coach cannot read participant AI coach chats');
  assert.equal(MI.canAccess('hr', 'console'), false);
  assert.equal(MI.canAccess('hr', 'coach'), false);
  assert.equal(MI.canAccess('sales', 'dashboard'), false);
  assert.equal(MI.canAccess('admin', 'coach'), false, 'admin cannot read private coaching conversations');
  assert.equal(MI.canAccess('nobody', 'home'), false);
});

test('rbac: no page is open to every role', () => {
  const pages = new Set(Object.values(MI.ROLES).flatMap(r => r.pages));
  const roles = Object.keys(MI.ROLES);
  for (const p of pages) assert.ok(roles.some(r => !MI.canAccess(r, p)), `${p} is restricted for someone`);
});
