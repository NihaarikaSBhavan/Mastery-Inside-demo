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

test('roleplay analytics: averages, best, improvement and next scenario', () => {
  const sc = v => Object.fromEntries(MI.ROLEPLAY_PARAMS.map(([k]) => [k, v]));
  const h = [
    { scenario: 'underperformer', overall: 50, resolved: false, scores: { ...sc(50), listening: 30 } },
    { scenario: 'underperformer', overall: 70, resolved: true, scores: { ...sc(70), empathy: 90 } },
    { scenario: 'delegation', overall: 60, resolved: true }
  ];
  const A = MI.roleplay.analytics(h);
  assert.equal(A.sessions, 3);
  assert.equal(A.average, 60);
  assert.equal(A.best.score, 70);
  assert.equal(A.improvement, 10);
  assert.equal(A.agreements, 2);
  assert.equal(A.strongest.key, 'empathy');
  assert.equal(A.focus.key, 'listening');
  assert.equal(A.byScenario.find(x => x.scenario.id === 'underperformer').change, 20);
  assert.equal(A.next.id, 'peer', 'first untried scenario is suggested');
  assert.equal(MI.roleplay.analytics([]).average, null);
});

test('coach session scoring rewards specific commitments and reflection', () => {
  const weak = MI.coach.scoreSession({ userTurns: ['help'], commitment: null, commitments: [] });
  const strong = MI.coach.scoreSession({
    userTurns: ['I have a difficult conversation with Rahul on Friday about three months of missed targets', 'I think I tend to jump in with solutions because I worry about the numbers'],
    commitment: 'I will ask Rahul what is getting in the way before Friday',
    commitments: [{ status: 'done' }, { status: 'done' }, { status: 'missed' }, { status: 'open' }]
  });
  assert.ok(strong.overall > weak.overall + 20, `${strong.overall} vs ${weak.overall}`);
  assert.equal(strong.scores.followThrough, 67);
  assert.ok(strong.scores.commitment >= 85);
  assert.equal(weak.scores.commitment, 30);
});

test('coach summary names the framework used', () => {
  const s = MI.coach.summarize({ topic: 'delegation', mode: 'prepare', userTurns: ['I keep doing the QBR deck myself'], commitment: 'Hand the QBR to Anita' });
  assert.equal(s.framework, 'Delegation Ladder');
  assert.match(s.summary, /QBR deck/);
  assert.equal(MI.coach.summarize({ topic: null, mode: 'plan', userTurns: [] }).title, 'Planning your week');
});

test('insights: Amplify strengths, Develop gaps, Release perception gaps from 360', () => {
  const report = MI.assess.report(MI.SEED_ASSESSMENT);
  const I = MI.coach.insights({ report, feedback: MI.FEEDBACK_360, source: '360' });
  assert.equal(I.amplify[0].title, MI.THEMES[report.strengths[0].key].amplify[0]);
  assert.equal(I.develop[0].title, MI.THEMES.delegation.develop[0]);
  assert.equal(I.release[0].title, 'Taking work back', 'largest self-vs-others gap is delegation');
  assert.match(I.release[0].evidence, /Self 75 vs others/);
  const A = MI.coach.insights({ report, feedback: MI.FEEDBACK_360, source: 'assessment' });
  assert.ok(!/Others/.test(A.amplify[0].evidence), 'assessment view does not cite colleagues');
});

test('weekly focus and prep brief follow the top gap and commitments', () => {
  const report = MI.assess.report(MI.SEED_ASSESSMENT);
  const F = MI.coach.weekFocus({ report, trend: [48, 64], feedback: MI.FEEDBACK_360 });
  assert.equal(F.goal, 'Delegation');
  assert.equal(F.target, 74);
  assert.match(F.why, /lowest of 12/);
  const B = MI.coach.prepBrief({ sessions: MI.SEED_COACH_SESSIONS, commitments: [{ status: 'done' }, { status: 'open', text: 'Talk to Rahul' }], report, focus: F });
  assert.match(B.since, /3 AI coaching sessions · 1 commitment done · 0 missed · 1 open/);
  assert.match(B.agenda[1], /Talk to Rahul/);
});
