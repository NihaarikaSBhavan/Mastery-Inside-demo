/* Mastery Inside — AI engines.
 * Each engine has an offline, rule-based implementation so the prototype runs
 * anywhere. When the optional server (server.js) has an ANTHROPIC_API_KEY, the
 * coach and role-play persona replies come from Claude instead (see MI.ai).
 */
window.MI = window.MI || {};

/* ---------- persistence ---------- */
MI.store = {
  key: 'mastery-inside-demo-v2',
  load() {
    try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; }
  },
  save(state) {
    try { localStorage.setItem(this.key, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  },
  clear() {
    try { localStorage.removeItem(this.key); } catch (e) { /* ignore */ }
  }
};

MI.band = score => MI.BANDS.find(b => score >= b.min);
MI.avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
MI.clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/* ---------- 1. Assessment engine ---------- */
MI.assess = {
  /* answers: array aligned with MI.ASSESSMENT — likert value 1..5 or option index */
  score(answers) {
    const per = {};
    MI.ASSESSMENT.forEach((item, i) => {
      const a = answers[i];
      if (a == null) return;
      const s = item.type === 'likert' ? ((a - 1) / 4) * 100 : item.options[a][1];
      (per[item.dim] = per[item.dim] || []).push({ type: item.type, s });
    });
    const scores = {};
    MI.DIMENSIONS.forEach(d => {
      const parts = per[d.key] || [];
      const lik = parts.find(p => p.type === 'likert');
      const sjt = parts.find(p => p.type === 'sjt');
      // Behaviour (situational judgement) is weighted above self-perception.
      const val = lik && sjt ? lik.s * 0.4 + sjt.s * 0.6 : (lik || sjt || { s: 50 }).s;
      scores[d.key] = Math.round(val);
    });
    return this.report(scores);
  },

  report(scores) {
    const overall = Math.round(MI.avg(Object.values(scores)));
    const ranked = MI.DIMENSIONS.map(d => ({ ...d, score: scores[d.key] })).sort((a, b) => a.score - b.score);
    const gaps = ranked.slice(0, 3);
    const strengths = ranked.slice(-3).reverse();
    // Perception gap: self-rating much higher than situational behaviour.
    return {
      scores, overall, band: MI.band(overall), gaps, strengths,
      plan: gaps.map((g, i) => ({
        dim: g.key, name: g.name, current: g.score,
        target30: Math.min(100, g.score + 8), target60: Math.min(100, g.score + 15), target90: Math.min(100, g.score + 22),
        intervention: g.intervention, practice: g.practice,
        scenario: MI.SCENARIOS.find(s => s.id === g.scenario),
        humanCoach: i === 0 ? 'Fortnightly 45-min session with your Mastery coach' : 'Monthly check-in with your Mastery coach'
      })),
      takenAt: new Date().toISOString()
    };
  },

  perceptionGaps(answers) {
    const out = [];
    MI.DIMENSIONS.forEach(d => {
      const li = MI.ASSESSMENT.findIndex(q => q.dim === d.key && q.type === 'likert');
      const si = MI.ASSESSMENT.findIndex(q => q.dim === d.key && q.type === 'sjt');
      if (answers[li] == null || answers[si] == null) return;
      const self = ((answers[li] - 1) / 4) * 100;
      const beh = MI.ASSESSMENT[si].options[answers[si]][1];
      if (self - beh >= 40) out.push(d.name);
    });
    return out;
  }
};

/* ---------- text feature helpers ---------- */
const has = (t, words) => words.some(w => t.includes(w));
const count = (t, words) => words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);

/* ---------- 2. Mastery AI Coach (offline engine) ---------- */
MI.coach = {
  SAFETY: ['suicid', 'self-harm', 'kill myself', 'harass', 'abuse', 'depress', 'panic attack', 'burnout', 'burning out', 'burned out', 'burnt out', 'breakdown', 'quit my job', 'resign'],

  TOPICS: [
    { id: 'ceo', label: 'Managing up', words: ['ceo', 'boss', 'my manager', 'board', 'leadership team', 'push back', 'pushback', 'senior leader', 'md '] },
    { id: 'delegation', label: 'Delegation', words: ['delegat', 'hand over', 'handover', 'let go', 'do it myself', 'micromanag', 'take it back', 'ownership'] },
    { id: 'performance', label: 'Performance conversation', words: ['missing target', 'missed target', 'underperform', 'performance', 'not delivering', 'targets', 'low output', 'pip'] },
    { id: 'feedback', label: 'Giving feedback', words: ['feedback', 'abrasive', 'rude', 'interrupts', 'attitude', 'behaviour', 'behavior'] },
    { id: 'conflict', label: 'Conflict', words: ['conflict', 'clash', 'disagree', 'argument', 'tension', 'peer', 'fight', 'at odds'] },
    { id: 'difficult', label: 'Difficult conversation', words: ['difficult conversation', 'tough conversation', 'hard conversation', 'difficult talk', 'confront', 'bad news'] },
    { id: 'decision', label: 'Decision making', words: ['decide', 'decision', 'choose', 'option', 'dilemma', 'torn between'] },
    { id: 'change', label: 'Leading change', words: ['change', 'reorg', 'restructur', 'transformation', 'new system', 'ai adoption', 'resist'] },
    { id: 'engagement', label: 'Team motivation', words: ['motivat', 'engag', 'morale', 'demotivat', 'disengag', 'team energy'] },
    { id: 'priorities', label: 'Focus & priorities', words: ['priorit', 'overwhelm', 'too much', 'time management', 'busy', 'no time', 'focus'] },
    { id: 'week', label: 'This week’s plan', words: ['this week', 'what should i do', 'plan for', 'today', 'next step', 'my goal', 'committed'] }
  ],

  PLAYBOOK: {
    ceo: {
      probe: 'Before we plan what to say — what do you think is driving their position? What pressure might they be under that you can’t fully see?',
      outcome: 'If this conversation goes really well, what does the outcome look like — for them and for you?',
      framework: '**Mastery “Align–Offer–Ask”** for managing up:\n1. **Align** on their goal first (“I want us to hit what the board needs…”).\n2. **Offer** options, not objections — e.g. a phased plan with a visible early win.\n3. **Ask** for a decision: “Which of these would you like me to run with?”\nLead with the headline in one sentence; keep detail in your back pocket.'
    },
    delegation: {
      probe: 'What’s one task you’re holding onto that someone on your team could own? What makes it hard to let go of?',
      outcome: 'If you delegated it well, what would “done” look like — and what would you do with the time you get back?',
      framework: '**Mastery Delegation Ladder** — hand over the outcome, not the steps:\n1. **Why** it matters and why them.\n2. **What** done looks like (quality bar, deadline).\n3. **Authority** — what they can decide without you.\n4. **Check-in** points agreed up front — then resist taking it back.\nMost leaders stall at step 3. Name the decisions you are giving away.'
    },
    performance: {
      probe: 'What do you believe is causing the performance issue? And what evidence do you have — versus what are you assuming?',
      outcome: 'By the end of the conversation, what do you want them to feel, and what do you want agreed?',
      framework: '**Mastery “Care–Clarity–Commit”** conversation:\n1. **Care** — open with intent: “I want to understand and help.”\n2. **Clarity** — share facts (Situation → Behaviour → Impact), not judgements.\n3. **Curiosity** — ask “What’s getting in the way?” and listen for the root cause.\n4. **Commit** — co-create 2–3 actions, a date and a check-in.\nAvoid offering solutions before you have heard their side.'
    },
    feedback: {
      probe: 'What specific behaviour have you observed — what exactly did they say or do, and when?',
      outcome: 'What change would you like to see, and how will you know it happened?',
      framework: '**SBI + Ask** from the Mastery feedback toolkit:\n1. **Situation** — “In Tuesday’s pipeline review…”\n2. **Behaviour** — “…you interrupted Ravi twice while he presented.”\n3. **Impact** — “…he stopped contributing and the team lost his view.”\n4. **Ask** — “How did it look from your side?” Then agree one change.\nPraise the strength first only if it is genuine and specific.'
    },
    conflict: {
      probe: 'What do you think the other person needs from this situation — not their position, but their underlying interest?',
      outcome: 'What would a good outcome look like for *both* of you?',
      framework: '**Interest-based conflict map**:\n1. Separate the **person** from the **problem**.\n2. Surface **interests** behind positions (“What’s most important to you here?”).\n3. Generate **options** that serve both sets of interests.\n4. Agree **objective criteria** (data, fairness, business priority) to choose.\nRaise it privately and early — conflicts compound quietly.'
    },
    difficult: {
      probe: 'What makes this conversation feel difficult for you — the topic, the person, or the possible reaction?',
      outcome: 'What’s the one thing you absolutely need them to hear, and what do you want to happen afterwards?',
      framework: '**Mastery difficult-conversation prep**:\n1. **Intent** — write one sentence on why this matters to you both.\n2. **Opening** — name the issue in under 30 seconds, no preamble.\n3. **Listen** — ask one open question and let silence work.\n4. **Agree** — who does what by when.\nWant to rehearse it? The RolePlay Studio can play the other person.'
    },
    decision: {
      probe: 'What options are you considering, and what criteria actually matter most for this decision?',
      outcome: 'Who needs to be involved, and by when does this need to be decided?',
      framework: '**Decide–Own–Explain**:\n1. Write the **criteria** before comparing options.\n2. Decide **who** decides (you, consult, or team).\n3. Set a **decide-by date** — delay is also a decision.\n4. **Explain** the why to those affected, including what you traded off.'
    },
    change: {
      probe: 'How is your team experiencing this change right now? What are they worried about losing?',
      outcome: 'What would you like them to understand and feel after you next speak with them?',
      framework: '**Change story canvas**:\n1. **Why** we are changing (in plain language).\n2. **What stays** the same — people need anchors.\n3. **What changes** and what it means for them.\n4. **What we don’t know yet** — honesty builds trust.\n5. **What’s next** and how they can shape it.'
    },
    engagement: {
      probe: 'When was the team last at its best? What was different then?',
      outcome: 'What would you see or hear in a month if energy was back?',
      framework: '**Mastery energy levers**:\n1. **Meaning** — connect work to impact on customers.\n2. **Mastery** — give each person one stretch opportunity.\n3. **Autonomy** — hand over one decision you currently make.\n4. **Recognition** — specific, public, weekly.\nAsk each person in 1:1s: “What would make work better for you this month?”'
    },
    priorities: {
      probe: 'If you could only achieve three things in the next two weeks, what would they be?',
      outcome: 'What would you need to stop, delegate or delay to protect those three?',
      framework: '**Top-3 rhythm**:\n1. Every Monday: three outcomes for the week.\n2. For each request: does it serve the three? If not — decline, delegate or defer.\n3. Block focus time before the week fills.\n4. Friday: 10-minute review — what moved, what didn’t, why.'
    }
  },

  detect(text) {
    const t = ' ' + text.toLowerCase() + ' ';
    let best = null, bestN = 0;
    this.TOPICS.forEach(tp => { const n = count(t, tp.words); if (n > bestN) { best = tp; bestN = n; } });
    return best;
  },

  /* state: { topic, stage } ; ctx: { report, commitments, name } */
  reply(text, state, ctx) {
    const t = text.toLowerCase();
    const res = { text: '', state: { ...state }, commitment: null, escalate: false, suggestion: null };

    if (has(t, this.SAFETY)) {
      res.escalate = true;
      res.text = 'Thank you for trusting me with that — it matters. This sounds like something your human coach should support you with directly, so I’ve **flagged it to Anjali** (your Mastery coach) for a conversation in the next 24 hours.\n\nIn the meantime: what is one thing that would make the next few days a little lighter for you?';
      res.state = { topic: null, stage: 0 };
      return res;
    }

    const detected = this.detect(text);
    if (detected && detected.id === 'week' && (!state.topic || state.stage >= 3)) {
      res.text = this.weekPlan(ctx);
      res.state = { topic: null, stage: 0 };
      return res;
    }
    if (detected && detected.id !== 'week' && detected.id !== state.topic && (state.stage === 0 || state.stage >= 3 || !state.topic)) {
      res.state = { topic: detected.id, stage: 0 };
    }

    const topic = res.state.topic;
    if (!topic) {
      res.text = 'I’m here to help you think it through. Tell me a bit more — **what’s the situation**, who is involved, and what makes it important to you right now?\n\n_Try: “I have a difficult conversation with my CEO tomorrow” or “I committed to improving delegation — what should I do this week?”_';
      return res;
    }

    const pb = this.PLAYBOOK[topic];
    const stage = res.state.stage;
    if (stage === 0) {
      res.text = `${this.ack(t)} ${pb.probe}`;
    } else if (stage === 1) {
      res.text = `${this.reflect(text)} ${pb.outcome}`;
    } else if (stage === 2) {
      const scen = this.scenarioFor(topic);
      res.text = `Here’s how I’d approach it, using the Mastery method:\n\n${pb.framework}`;
      if (scen) {
        res.text += `\n\n**What’s one specific step you’ll commit to — and by when?**`;
        res.suggestion = scen;
      } else {
        res.text += '\n\n**What’s one specific step you’ll commit to — and by when?**';
      }
    } else {
      res.commitment = text.trim().replace(/\s+/g, ' ').slice(0, 160);
      res.text = `Committed: _“${res.commitment}”_\n\nI’ve added this to your commitments and I’ll **check in with you** on WhatsApp afterwards to ask how it went. Rehearsing first raises follow-through a lot — want to practise it in the RolePlay Studio?`;
      res.state = { topic: null, stage: 0 };
      return res;
    }
    res.state.stage = stage + 1;
    return res;
  },

  ack(t) {
    if (has(t, ['tomorrow', 'today', 'tonight', 'this afternoon'])) return 'That’s coming up soon — good that you’re preparing now rather than improvising.';
    if (has(t, ['worried', 'nervous', 'anxious', 'stress', 'afraid', 'scared'])) return 'It’s natural to feel uneasy about this — that usually means it matters.';
    if (has(t, ['months', 'weeks', 'again', 'keeps', 'always'])) return 'This has been building for a while, so it’s worth handling deliberately.';
    return 'Let’s think this through together.';
  },

  reflect(text) {
    const words = text.trim().split(/\s+/);
    if (words.length < 5) return 'Say a little more if you can — but let’s keep moving.';
    const snippet = words.slice(0, 12).join(' ').replace(/[.?!,;:]+$/, '');
    return `So, if I’m hearing you right: _“${snippet}${words.length > 12 ? '…' : ''}”_. That’s useful context.`;
  },

  scenarioFor(topic) {
    const map = { performance: 'underperformer', difficult: 'underperformer', delegation: 'delegation', conflict: 'peer', ceo: 'ceo', feedback: 'feedback' };
    return MI.SCENARIOS.find(s => s.id === map[topic]) || null;
  },

  weekPlan(ctx) {
    const r = ctx.report;
    const g = r.gaps[0];
    const open = (ctx.commitments || []).filter(c => !c.done);
    let s = `Here’s your focus for this week, based on your Mastery Leadership Score (${r.overall}/100):\n\n`;
    s += `**Focus: ${g.name}** (currently ${g.score})\n`;
    s += `- **Practice:** ${g.practice}\n`;
    s += `- **Intervention:** ${g.intervention}\n`;
    const scen = MI.SCENARIOS.find(x => x.id === g.scenario);
    if (scen) s += `- **Rehearse:** “${scen.title}” in the RolePlay Studio (10 min)\n`;
    s += `- **Reflect:** I’ll ask you on Friday what happened and what you’d change.\n`;
    if (open.length) s += `\nYou also have **${open.length} open commitment${open.length > 1 ? 's' : ''}** — the latest: _“${open[open.length - 1].text}”_.`;
    s += '\n\nWhich of these feels hardest to actually do?';
    return s;
  }
};

/* ---------- 3. RolePlay AI (persona + evaluator) ---------- */
MI.roleplay = {
  EMPATHY: ['understand', 'sounds like', 'must be', 'i hear', 'appreciate', 'i can see', 'that’s hard', "that's hard", 'difficult for you', 'thank you for', 'i imagine', 'how are you', 'feel', 'sorry to hear', 'makes sense'],
  OPENQ: ['what ', 'how ', 'help me understand', 'tell me', 'walk me through', 'why do you think', 'what’s getting', "what's getting", 'could you share', 'can you share'],
  CLARITY: ['expect', 'target', 'goal', 'specifically', 'the numbers', 'by ', 'deadline', 'week', 'month', '%', 'impact', 'observed', 'noticed'],
  ASSERT: ['i need', 'i expect', 'we need to', 'it’s important', "it's important", 'i want to be clear', 'non-negotiable', 'my concern', 'i’d like', "i'd like", 'i propose', 'i recommend'],
  BLAME: ['you always', 'you never', 'lazy', 'unacceptable', 'your fault', 'not good enough', 'excuse', 'ridiculous', 'useless', 'i don’t care', "i don't care", 'or else', 'fire you', 'shut up', 'stupid'],
  SOLUTION: ['you should', 'you need to', 'just do', 'i want you to', 'you have to', 'you must', 'start doing', 'here’s what you', "here's what you"],
  OUTCOME: ['next step', 'agree', 'plan', 'follow up', 'follow-up', 'check in', 'check-in', 'let’s', "let's", 'by friday', 'by monday', 'together', 'support you', 'what would help', 'commit'],
  PARAPHRASE: ['so what you’re saying', "so what you're saying", 'if i understand', 'so you', 'it sounds like', 'what i’m hearing', "what i'm hearing", 'you mentioned', 'you said'],

  analyse(text, prevPersona, turnIndex, asked) {
    const t = ' ' + text.toLowerCase() + ' ';
    const f = {
      empathy: count(t, this.EMPATHY),
      openQ: count(t, this.OPENQ) > 0 && (text.includes('?') || /^\s*(what|how|tell|help|walk|could|can)\b/i.test(text)) ? 1 : 0,
      question: text.includes('?') ? 1 : 0,
      clarity: count(t, this.CLARITY) + (/\d/.test(text) ? 1 : 0),
      assert: count(t, this.ASSERT),
      blame: count(t, this.BLAME),
      outcome: count(t, this.OUTCOME),
      paraphrase: count(t, this.PARAPHRASE),
      shouting: (text.match(/!/g) || []).length >= 2 || (text.length > 12 && text === text.toUpperCase()),
      words: text.split(/\s+/).filter(Boolean).length
    };
    // Listening: reuses meaningful words from the persona's last line.
    const stop = new Set(['the', 'and', 'that', 'this', 'with', 'have', 'about', 'what', 'your', 'you', 'are', 'for', 'was', 'but', 'not', 'just', 'been', 'know', 'right', 'can', 'it’s', "it's", 'i’m', "i'm"]);
    const prevWords = new Set((prevPersona || '').toLowerCase().match(/[a-z’']{4,}/g) || []);
    const echo = (text.toLowerCase().match(/[a-z’']{4,}/g) || []).filter(w => prevWords.has(w) && !stop.has(w)).length;
    f.listening = f.paraphrase + (echo >= 2 ? 1 : 0);
    f.solutionEarly = !asked && count(t, this.SOLUTION) > 0 && turnIndex <= 2;
    f.monologue = f.words > 90;
    return f;
  },

  /* Update persona state and pick a response (offline). */
  respond(scn, state, f) {
    let d = 0;
    d -= Math.min(2, f.empathy) * 1.2;
    d -= f.openQ ? 1 : 0;
    d -= f.listening ? 1 : 0;
    d += f.blame * 2.5;
    d += f.shouting ? 2 : 0;
    d += f.solutionEarly ? 1.2 : 0;
    d += f.monologue ? 0.8 : 0;
    state.tension = MI.clamp(state.tension + d, 0, 10);
    if (!state.rootRevealed && f.openQ && (f.empathy || f.listening || state.tension <= 4)) state.rootRevealed = true;

    const p = scn.persona;
    let line;
    if (f.blame || f.shouting) {
      line = this.pick([
        'Wow. Okay. I don’t think that’s fair at all.',
        'If that’s how you see it, I’m not sure what there is to talk about.',
        'I’m not going to be spoken to like that.'
      ], state);
    } else if (state.rootRevealed && !state.rootShared) {
      state.rootShared = true;
      line = `Honestly? ${this.cap(scn.root)}. I haven’t really told anyone that.`;
    } else if (state.rootShared && f.outcome) {
      state.agreed = (state.agreed || 0) + 1;
      line = state.agreed >= 2
        ? 'Okay. That feels fair — and doable. Thank you for actually hearing me out. I’ll get started and we can check in as you said.'
        : this.pick(['That could work. What would you need from me first?', 'I think I can commit to that if I know you’ve got my back on it.', 'Okay… can we put a date on the first check-in so I know where I stand?'], state);
    } else if (f.solutionEarly) {
      line = this.pick(['You’re telling me what to do before you even know what’s going on.', 'Sure, I could “just” do that. It’s not that simple though.', 'Right. So you’ve already decided.'], state);
    } else if (state.tension >= 7) {
      line = this.pick(this.LINES[scn.id].high, state);
    } else if (state.tension >= 4) {
      line = this.pick(this.LINES[scn.id].mid, state);
    } else {
      line = this.pick(this.LINES[scn.id].low, state);
    }
    return { text: line, done: state.agreed >= 2 };
  },

  LINES: {
    underperformer: {
      high: ['I’m working as hard as anyone. The numbers don’t show everything.', 'Everyone’s suddenly an expert on my territory.', 'So am I being put on a PIP? Just tell me.'],
      mid: ['It’s been a tough few months, that’s all.', 'I know the numbers aren’t there. I’m trying.', 'There are things going on that don’t show up in the CRM.'],
      low: ['I appreciate you asking, honestly.', 'I want to get back to where I was last year.', 'I think with the right accounts I could turn it around.']
    },
    delegation: {
      high: ['I’d rather not be blamed if it goes wrong.', 'I really don’t have the bandwidth for this.', 'Why me? You’re much better at this.'],
      mid: ['I guess I could look at it…', 'What exactly would you expect from me?', 'How much of it would I actually decide?'],
      low: ['It would be a good stretch for me, actually.', 'I’d like to try it my way, if that’s okay.', 'If you can review the storyline early, I think I can own it.']
    },
    peer: {
      high: ['Operations keeps this company running. Priorities are priorities.', 'Take it up with the CEO if you want.', 'Your team always thinks their work is the most urgent.'],
      mid: ['I hear you, but I’m under pressure too.', 'What exactly is being delayed on your side?', 'We can’t both have the analysts full-time.'],
      low: ['Maybe there’s a way to split this.', 'If we agree on criteria, I can live with it.', 'Fair — let’s work it out rather than escalate.']
    },
    ceo: {
      high: ['I don’t need reasons why not. I need it done.', 'The board has already heard four weeks.', 'Every team says they need more time.'],
      mid: ['Give me the short version.', 'What would you need to make it faster?', 'What exactly is the risk if we go in four weeks?'],
      low: ['A phased plan could work if the board sees progress.', 'Okay, show me what a realistic first milestone looks like.', 'I can live with that if the two key regions go first.']
    },
    feedback: {
      high: ['Seriously? I bring in a third of the revenue.', 'Who said that? That’s just people being sensitive.', 'I don’t have time to hand-hold everyone.'],
      mid: ['I didn’t realise it came across like that.', 'Can you give me an example?', 'I’m just trying to move things along.'],
      low: ['I don’t want people to feel that way around me.', 'What would you like me to do differently?', 'That’s fair. I can work on it.']
    }
  },

  pick(arr, state) {
    state.i = (state.i || 0) + 1;
    return arr[state.i % arr.length];
  },
  cap: s => s.charAt(0).toUpperCase() + s.slice(1),

  /* Evaluate a finished conversation → score + feedback. */
  evaluate(turns, state) {
    const fs = turns.filter(t => t.role === 'user').map(t => t.f);
    const n = Math.max(1, fs.length);
    const sum = k => fs.reduce((a, f) => a + (typeof f[k] === 'boolean' ? (f[k] ? 1 : 0) : f[k]), 0);
    const anyBefore = (k, idx) => fs.slice(0, idx).some(f => f[k]);
    const firstQ = fs.findIndex(f => f.openQ);
    const scores = {
      empathy: 45 + Math.min(45, sum('empathy') / n * 45) - sum('blame') * 12,
      clarity: 45 + Math.min(40, sum('clarity') / n * 22) - sum('monologue') * 8,
      listening: 40 + Math.min(45, sum('listening') * 15) + (state.rootShared ? 10 : 0),
      questioning: 35 + Math.min(50, sum('openQ') / n * 70) + (firstQ === 0 ? 5 : 0),
      assertiveness: 50 + Math.min(35, sum('assert') * 12) - sum('blame') * 10,
      emotionalControl: 90 - sum('blame') * 18 - sum('shouting') * 15,
      conflictHandling: 40 + (10 - state.tension) * 5 + (state.rootShared ? 10 : 0) - sum('blame') * 8,
      outcome: 35 + Math.min(40, sum('outcome') * 13) + (state.agreed >= 2 ? 20 : state.agreed ? 10 : 0)
    };
    Object.keys(scores).forEach(k => { scores[k] = Math.round(MI.clamp(scores[k], 5, 98)); });
    const overall = Math.round(MI.avg(Object.values(scores)));

    const strengths = [], improve = [];
    const early = fs.findIndex(f => f.solutionEarly);
    if (sum('empathy') >= 2) strengths.push('Good empathy — you acknowledged how they felt');
    if (sum('openQ') >= 2) strengths.push('Asked open questions rather than telling');
    if (state.rootShared) strengths.push('Uncovered the real root cause');
    if (sum('clarity') >= 3) strengths.push('Clear objective and specific facts');
    if (state.agreed >= 2) strengths.push('Reached a concrete, agreed next step');
    if (!sum('blame') && !sum('shouting')) strengths.push('Stayed calm and respectful throughout');

    if (early >= 0) improve.push(`Gave a solution too early (turn ${early + 1}) — ask before you tell`);
    if (!state.rootShared) improve.push('Did not probe the root cause — try “What’s getting in the way?”');
    if (sum('blame')) improve.push('Used blaming language — describe behaviour, not character');
    if (sum('listening') === 0) improve.push('No evidence of listening back — paraphrase what you heard');
    if (sum('outcome') === 0) improve.push('No clear next step, owner or date agreed');
    if (sum('monologue')) improve.push('Long monologue — keep turns short and leave space');
    if (sum('empathy') === 0) improve.push('Acknowledge their perspective before stating yours');
    if (scores.clarity < 55) improve.push('Be more specific — name the facts, the expectation and the timeline');
    if (scores.assertiveness < 55) improve.push('State your own view and needs plainly (“I need…”, “My concern is…”)');

    return { scores, overall, strengths: strengths.slice(0, 3), improve: improve.slice(0, 3), turns: fs.length, resolved: state.agreed >= 2 };
  }
};

/* Role-play analytics across a participant's sessions. */
MI.roleplay.TIPS = {
  empathy: 'Name what you notice before you respond: “That sounds frustrating.”',
  clarity: 'State the fact, the expectation and the date in one sentence.',
  listening: 'Paraphrase what you heard before adding your view.',
  questioning: 'Start with “What” or “How”, and ask before you tell.',
  assertiveness: 'Say your need plainly: “I need…”, “My concern is…”.',
  emotionalControl: 'Pause for a breath before you answer a charged comment.',
  conflictHandling: 'Look for the interest behind their position.',
  outcome: 'Close with who does what by when, and a check-in.'
};
MI.roleplay.analytics = history => {
  const h = history || [];
  const n = h.length;
  const overall = h.map(x => x.overall);
  const scored = h.filter(x => x.scores);
  const behaviours = MI.ROLEPLAY_PARAMS.map(([k, label]) => ({
    key: k, label, avg: scored.length ? Math.round(MI.avg(scored.map(x => x.scores[k]))) : null
  }));
  const ranked = behaviours.filter(b => b.avg != null).sort((a, b) => b.avg - a.avg);
  const byScenario = MI.SCENARIOS.map(s => {
    const mine = h.filter(x => x.scenario === s.id);
    return { scenario: s, sessions: mine.length, best: mine.length ? Math.max(...mine.map(x => x.overall)) : null,
      last: mine.length ? mine[mine.length - 1].overall : null, change: mine.length > 1 ? mine[mine.length - 1].overall - mine[0].overall : null };
  });
  const bestIdx = n ? overall.indexOf(Math.max(...overall)) : -1;
  const untried = byScenario.filter(x => !x.sessions);
  const next = untried[0] || [...byScenario].sort((a, b) => a.best - b.best)[0];
  return {
    sessions: n,
    average: n ? Math.round(MI.avg(overall)) : null,
    best: n ? { score: overall[bestIdx], scenario: MI.SCENARIOS.find(s => s.id === h[bestIdx].scenario) } : null,
    improvement: n > 1 ? overall[n - 1] - overall[0] : null,
    agreements: h.filter(x => x.resolved).length,
    behaviours, strongest: ranked[0] || null, focus: ranked[ranked.length - 1] || null,
    byScenario, next: next ? next.scenario : null
  };
};

/* ---------- 4. Lead qualification + proposal ---------- */
MI.leads = {
  score(a) {
    let s = 20;
    s += { '< 200': 5, '200–1,000': 12, '1,000–5,000': 20, '5,000+': 25 }[a.size] || 8;
    s += { '< 10': 4, '10–50': 10, '50–200': 18, '200+': 22 }[a.participants] || 6;
    s += { 'This month': 18, 'Next quarter': 13, 'Within 6 months': 7, 'Just exploring': 2 }[a.timeline] || 5;
    s += { '< ₹5L': 3, '₹5L–₹15L': 8, '₹15L–₹50L': 13, '₹50L+': 15, 'Not sure yet': 5 }[a.budget] || 5;
    s = Math.min(100, s);
    const tier = s >= 75 ? 'Hot' : s >= 55 ? 'Warm' : 'Nurture';
    return { score: s, tier };
  },
  recommend(a) {
    if (a.format === 'Assessment only' || a.timeline === 'Just exploring') return 'assessment';
    if (a.format === 'Executive coaching' || a.level === 'CXO / Executive team') return 'coaching';
    if (a.format === 'End-to-end transformation' || a.participants === '200+' || a.size === '5,000+') return 'transformation';
    return 'program';
  },
  participantsNum(p) { return { '< 10': 8, '10–50': 30, '50–200': 120, '200+': 300 }[p] || 25; },
  gapsFor(challenge) {
    const c = (challenge || '').toLowerCase();
    if (c.includes('delegat')) return ['Delegation', 'Accountability', 'Team development'];
    if (c.includes('difficult') || c.includes('conversation')) return ['Conflict management', 'Emotional intelligence', 'Communication'];
    if (c.includes('new manager')) return ['Delegation', 'Communication', 'Team development'];
    if (c.includes('change') || c.includes('ai')) return ['Change leadership', 'Strategic thinking', 'Decision making'];
    return ['Communication', 'Accountability', 'Strategic thinking'];
  }
};

/* ---------- Access control ---------- */
MI.canAccess = (role, page) => !!(MI.ROLES[role] && MI.ROLES[role].pages.includes(page));
MI.homeFor = role => (MI.ROLES[role] ? MI.ROLES[role].home : null);

/* ---------- Live AI client (optional server) ---------- */
MI.ai = {
  live: false,
  model: null,
  async init() {
    try {
      const r = await fetch('api/status', { cache: 'no-store' });
      if (!r.ok) return false;
      const j = await r.json();
      this.live = !!j.live; this.model = j.model || null;
    } catch (e) { this.live = false; }
    return this.live;
  },
  async chat(mode, messages, context) {
    const r = await fetch('api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, messages, context })
    });
    if (!r.ok) throw new Error('AI unavailable (' + r.status + ')');
    const j = await r.json();
    if (!j.text) throw new Error(j.error || 'Empty reply');
    return j.text;
  }
};
