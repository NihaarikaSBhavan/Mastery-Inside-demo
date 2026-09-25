/* Mastery Inside — prototype app shell, router and views. */
(() => {
  const { esc } = MI.charts;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- state ---------- */
  const defaults = () => ({
    assessment: null,          // { answers, report }
    commitments: [
      { text: 'Delegate the weekly pipeline report to Anita with a Thursday check-in', done: true, at: 'Week 4' },
      { text: 'Hold the performance conversation with Rahul before Friday', done: false, at: 'Week 6' }
    ],
    chat: [],
    coachState: { topic: null, stage: 0 },
    channel: 'web',
    roleplayHistory: [
      { scenario: 'underperformer', overall: 58, at: 'Week 3' },
      { scenario: 'underperformer', overall: 67, at: 'Week 4' },
      { scenario: 'delegation', overall: 71, at: 'Week 5' }
    ],
    checkins: [],
    reflections: [],
    escalations: [],
    leads: []
  });
  let S = Object.assign(defaults(), MI.store.load());
  const save = () => MI.store.save(S);

  const report = () => S.assessment ? S.assessment.report : MI.assess.report(MI.SEED_ASSESSMENT);
  const trend = () => [...MI.SEED_TREND, ...S.checkins.map(c => c.score)];

  /* ---------- tiny markdown ---------- */
  function md(s) {
    const lines = esc(s).split('\n');
    let html = '', list = null;
    const inline = t => t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/_(.+?)_/g, '<em>$1</em>');
    lines.forEach(l => {
      const ol = l.match(/^\d+\.\s+(.*)/), ul = l.match(/^[-•]\s+(.*)/);
      const kind = ol ? 'ol' : ul ? 'ul' : null;
      if (list && kind !== list) { html += `</${list}>`; list = null; }
      if (kind) { if (!list) { html += `<${kind}>`; list = kind; } html += `<li>${inline((ol || ul)[1])}</li>`; }
      else if (l.trim()) html += `<p>${inline(l)}</p>`;
    });
    if (list) html += `</${list}>`;
    return html;
  }

  /* ---------- speech (Web Speech API) ---------- */
  const Speech = {
    Rec: window.SpeechRecognition || window.webkitSpeechRecognition,
    get canListen() { return !!this.Rec; },
    get canSpeak() { return 'speechSynthesis' in window; },
    listen(onText, onEnd) {
      if (!this.Rec) return null;
      const rec = new this.Rec();
      rec.lang = 'en-IN'; rec.interimResults = true; rec.continuous = false;
      rec.onresult = e => onText([...e.results].map(r => r[0].transcript).join(' '), e.results[e.results.length - 1].isFinal);
      rec.onend = onEnd; rec.onerror = onEnd;
      rec.start();
      return rec;
    },
    say(text, voiceHint) {
      if (!this.canSpeak) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[*_#>]/g, '').replace(/\n+/g, '. '));
      const voices = speechSynthesis.getVoices();
      const v = voices.find(x => /en-IN/i.test(x.lang)) || voices.find(x => /^en/i.test(x.lang));
      if (v) u.voice = v;
      if (voiceHint === 'persona') { u.rate = 1.05; u.pitch = 0.9; }
      speechSynthesis.speak(u);
    }
  };

  /* ---------- router ---------- */
  const ROUTES = {
    overview: { title: 'Platform overview', render: viewOverview },
    journey: { title: 'My 90-day journey', render: viewJourney },
    assessment: { title: 'Mastery Leadership Score™', render: viewAssessment },
    coach: { title: 'Mastery AI Coach', render: viewCoach },
    roleplay: { title: 'RolePlay Studio', render: viewRoleplay },
    feedback: { title: 'Leadership 360 Intelligence', render: viewFeedback },
    console: { title: 'Coach console', render: viewConsole },
    dashboard: { title: 'Leadership Intelligence Dashboard', render: viewDashboard },
    consultant: { title: 'AI Consultant (website)', render: viewConsultant }
  };

  function route() {
    const [name, arg] = (location.hash.replace('#/', '') || 'overview').split('/');
    const r = ROUTES[name] || ROUTES.overview;
    $$('.nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#/' + (ROUTES[name] ? name : 'overview')));
    $('#page-title').textContent = r.title;
    const main = $('#view');
    main.innerHTML = '';
    main.scrollTop = 0; window.scrollTo(0, 0);
    if (Speech.canSpeak) speechSynthesis.cancel();
    r.render(main, arg);
    document.body.classList.remove('nav-open');
  }

  /* ================= VIEWS ================= */

  function viewOverview(el) {
    const r = report();
    el.innerHTML = `
      <section class="hero">
        <div>
          <p class="eyebrow">Mastery Inside × TheVertical.ai</p>
          <h2>From leadership training → continuous, AI-powered leadership transformation.</h2>
          <p class="lede">We measure, develop and continuously improve leadership capability using human expertise and AI.
          Coaches stay the experts; AI makes their methodology available 24×7, personalises it and proves behaviour change.</p>
          <div class="row gap">
            <a class="btn primary" href="#/assessment">Take the assessment</a>
            <a class="btn" href="#/coach">Talk to Mastery AI</a>
            <a class="btn ghost" href="#/dashboard">See the CHRO view</a>
          </div>
        </div>
        <div class="hero-card">
          <div class="muted small">Demo participant</div>
          <div class="strong">${esc(MI.PERSONA.name)}</div>
          <div class="muted small">${esc(MI.PERSONA.role)} · Day ${MI.PERSONA.programDay} of 90</div>
          ${MI.charts.ring(r.overall, 'Mastery Leadership Score')}
          <div class="pill ${r.band.tone}">${r.band.label}</div>
        </div>
      </section>

      <h3 class="section-title">The Mastery AI ecosystem</h3>
      <div class="flow">
        <div class="flow-node ip"><b>Mastery Inside IP</b><span>Frameworks · methodology · founder knowledge</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-node brain"><b>Mastery AI Brain</b><span>Knowledge graph + coaching rules</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-engines">
          ${[['Assess', 'assessment', 'Leadership & behavioural assessment'], ['Coach', 'coach', '24×7 personalised coaching'], ['Practice', 'roleplay', 'Voice AI role-play'], ['Measure', 'journey', 'Behaviour change analytics'], ['Predict', 'dashboard', 'Risk & development signals']]
            .map(([n, h, d], i) => `<a class="engine" href="#/${h}"><i>${i + 1}</i><b>${n}</b><span>${d}</span></a>`).join('')}
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-node human"><b>Human Coach</b><span>Deep, high-value interventions</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-node ent"><b>Enterprise</b><span>CHRO / CEO dashboard</span></div>
      </div>

      <h3 class="section-title">Explore the prototype</h3>
      <div class="cards">
        ${[
          ['Product 1', 'Mastery AI Coach', 'Coaches, challenges, reminds and measures — on Web, WhatsApp and Voice.', 'coach', 'Very high'],
          ['Product 2', 'Leadership Assessment', '12-dimension Mastery Leadership Score → gaps → development plan.', 'assessment', 'Very high'],
          ['Product 3', 'Voice RolePlay Studio', 'Practise difficult conversations with an AI persona and get scored.', 'roleplay', 'Very high'],
          ['Product 4', 'Transformation Dashboard', 'Before → during → after evidence for HR / CHRO.', 'dashboard', 'High'],
          ['Journey', '90-day Behaviour Change Engine', 'Learn → Practice → Apply → Measure → Reinforce.', 'journey', ''],
          ['360°', 'Leadership 360 Intelligence', 'Self vs manager vs team vs AI — finds perception gaps.', 'feedback', ''],
          ['Human + AI', 'Coach console', '10 coaches + AI → hundreds of participants. AI escalates what matters.', 'console', ''],
          ['Growth', 'AI Consultant & Proposal', 'Website lead qualification, voice call-back and auto-proposal.', 'consultant', '']
        ].map(([k, t, d, h, p]) => `<a class="card link" href="#/${h}"><div class="row between"><span class="eyebrow">${k}</span>${p ? `<span class="pill neutral">Priority: ${p}</span>` : ''}</div><h4>${t}</h4><p>${d}</p></a>`).join('')}
      </div>

      <h3 class="section-title">Recommended 90-day build roadmap</h3>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Phase</th><th>Timeline</th><th>What gets built</th><th>In this prototype</th></tr></thead>
        <tbody>
          ${[['1 — Discover', 'Weeks 1–2', 'Capture Mastery IP, programs, assessments & workflows', 'Placeholder frameworks'],
             ['2 — AI Coach MVP', 'Weeks 3–5', 'Mastery AI + Web / WhatsApp', 'Coach with 3 channel modes'],
             ['3 — Voice Roleplay', 'Weeks 6–8', 'AI leadership role-play + scoring', '5 scenarios, voice in Chrome'],
             ['4 — Assessment', 'Weeks 7–9', 'Mastery Leadership Score', '24-item, 12-dimension assessment'],
             ['5 — Dashboards', 'Weeks 9–11', 'Participant + Coach + HR dashboards', 'All three views'],
             ['6 — Pilot', 'Weeks 11–12', '25–50 participants', '—'],
             ['7 — Enterprise launch', 'After pilot', 'Package + pricing + GTM', 'AI consultant + proposal']]
            .map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
        </tbody></table></div>
      <p class="note">Prototype note: all frameworks, scores and people are illustrative placeholders to be replaced with Mastery Inside’s IP in Phase 1.
      ${MI.ai.live ? `Coach and role-play replies are generated live by Claude (${esc(MI.ai.model)}).` : 'AI replies run on an offline rule engine; start <code>server.js</code> with an API key for live Claude responses.'}</p>
    `;
  }

  /* ---------- Journey / Behaviour change engine ---------- */
  function viewJourney(el) {
    const r = report();
    const focus = r.gaps[0];
    const tr = trend();
    const status = j => {
      if (j.key === 'assessment' || j.key === 'plan' || j.key === 'd30') return 'done';
      if (['daily', 'weekly', 'reflect'].includes(j.key)) return 'ongoing';
      if (j.key === 'd60' && MI.PERSONA.programDay >= 60) return 'done';
      return 'upcoming';
    };
    el.innerHTML = `
      <div class="grid-2">
        <div class="panel">
          <div class="row between"><h3>Program timeline</h3><span class="pill neutral">Day ${MI.PERSONA.programDay} / 90</span></div>
          <div class="progress"><div style="width:${MI.PERSONA.programDay / 90 * 100}%"></div></div>
          <ol class="timeline">
            ${MI.JOURNEY.map(j => `<li class="${status(j)}"><span class="tl-icon">${j.icon}</span>
              <div><div class="tl-day">${typeof j.day === 'number' ? 'Day ' + j.day : j.day}</div><b>${j.title}</b><div class="muted small">${j.desc}</div></div>
              <span class="pill ${status(j) === 'done' ? 'good' : status(j) === 'ongoing' ? 'info' : 'neutral'}">${status(j) === 'done' ? '✓ Done' : status(j) === 'ongoing' ? '● Ongoing' : 'Upcoming'}</span></li>`).join('')}
          </ol>
        </div>
        <div class="stack">
          <div class="panel">
            <div class="row between"><h3>Focus goal: ${esc(focus.name)}</h3><span class="muted small">Learn → Practice → Apply → Measure → Reinforce</span></div>
            <div class="stat-row">
              <div class="stat"><span>Before</span><b>${tr[0]}</b></div>
              <div class="stat"><span>Now</span><b>${tr[tr.length - 1]}</b></div>
              <div class="stat"><span>Improvement</span><b class="up">+${tr[tr.length - 1] - tr[0]}</b></div>
              <div class="stat"><span>Day-90 target</span><b>${Math.min(100, tr[0] + 26)}</b></div>
            </div>
            ${MI.charts.line(tr.map((_, i) => 'W' + (i + 1)), tr, { target: Math.min(100, tr[0] + 26), min: 30, max: 90, ticks: [30, 60, 90], label: focus.name + ' weekly score' })}
          </div>
          <div class="panel">
            <h3>Weekly behaviour check-in</h3>
            <p class="muted small">The AI asks the same five questions each week and scores the evidence of behaviour change.</p>
            <form id="checkin" class="form">
              ${MI.CHECKIN_QUESTIONS.map((q, i) => `<label>${q}<input name="q${i}" required placeholder="${['e.g. The QBR deck', 'e.g. Anita', 'e.g. First draft by Thursday, her storyline', 'e.g. She delivered; I rewrote one slide', 'e.g. Agree the quality bar up front'][i]}"></label>`).join('')}
              <button class="btn primary">Submit check-in</button>
            </form>
            <div id="checkin-result"></div>
          </div>
        </div>
      </div>
      <div class="grid-2">
        <div class="panel">
          <h3>WhatsApp coaching cadence</h3>
          <div class="wa-mini">
            ${MI.NUDGES.map(n => `<div class="wa-msg in"><div class="wa-meta">${n.day} · ${n.time}</div>${esc(n.text)}</div>`).join('')}
            <div class="wa-msg out">Had it on Wednesday — went better than expected. Rahul opened up about his territory change. <div class="wa-meta">✓✓</div></div>
          </div>
        </div>
        <div class="panel">
          <h3>After-meeting AI reflection</h3>
          <form id="reflect" class="form">
            <label>Which meeting?<input name="m" required placeholder="e.g. Monday pipeline review"></label>
            <label>What went well?<input name="w" required placeholder="e.g. I let the team speak first"></label>
            <label>What would you do differently?<input name="d" required placeholder="e.g. I jumped in with a solution at the end"></label>
            <button class="btn">Reflect with AI</button>
          </form>
          <div id="reflect-result"></div>
          <h4 class="mt">Commitments</h4>
          <ul class="checklist">${S.commitments.map((c, i) => `<li><label><input type="checkbox" data-c="${i}" ${c.done ? 'checked' : ''}> <span>${esc(c.text)}</span></label><span class="muted small">${esc(c.at || '')}</span></li>`).join('')}</ul>
        </div>
      </div>`;

    $('#checkin', el).addEventListener('submit', e => {
      e.preventDefault();
      const ans = MI.CHECKIN_QUESTIONS.map((_, i) => e.target['q' + i].value.trim());
      const quality = ans.reduce((a, v) => a + Math.min(3, v.split(/\s+/).length / 4), 0); // richer evidence → higher
      const learning = /agree|up front|earlier|clear|trust|let|check/i.test(ans[4]) ? 2 : 0;
      const last = trend().slice(-1)[0];
      const score = Math.min(95, Math.round(last + 1 + quality / 3 + learning));
      S.checkins.push({ score, ans, at: new Date().toISOString() });
      save();
      viewJourney(el);
      $('#checkin-result', el).innerHTML = `<div class="callout good">Check-in recorded. ${esc(focus.name)} evidence score: <b>${score}</b> (+${score - last}). ${learning ? 'Great reflection — naming what you’d change is what turns practice into habit.' : 'Next week, try to name one specific thing you will do differently.'}</div>`;
    });
    $('#reflect', el).addEventListener('submit', e => {
      e.preventDefault();
      const d = e.target.d.value.trim();
      const solution = /solution|jumped|told|interrupt|decided/i.test(d);
      S.reflections.push({ m: e.target.m.value, w: e.target.w.value, d, at: new Date().toISOString() }); save();
      $('#reflect-result', el).innerHTML = `<div class="callout">${md(`**AI reflection — ${e.target.m.value}**\nYou noticed: _${d}_. ${solution ? 'This links to your **ask-before-tell** goal. Next meeting, try holding your view until two others have spoken.' : 'Good awareness. Pick one micro-behaviour to try next time and I’ll ask about it afterwards.'}\nI’ll remind you before your next similar meeting.`)}</div>`;
    });
    $$('[data-c]', el).forEach(cb => cb.addEventListener('change', () => { S.commitments[+cb.dataset.c].done = cb.checked; save(); }));
  }

  /* ---------- Assessment ---------- */
  function viewAssessment(el, arg) {
    if (S.assessment && arg !== 'retake') return renderReport(el, S.assessment.report, S.assessment.answers);
    const answers = new Array(MI.ASSESSMENT.length).fill(null);
    let i = 0;
    const draw = () => {
      const q = MI.ASSESSMENT[i];
      const dim = MI.dimByKey[q.dim];
      el.innerHTML = `
        <div class="panel narrow">
          <div class="row between"><span class="eyebrow">${esc(dim.name)} · ${q.type === 'likert' ? 'Self-perception' : 'Situational judgement'}</span><span class="muted small">${i + 1} / ${MI.ASSESSMENT.length}</span></div>
          <div class="progress"><div style="width:${i / MI.ASSESSMENT.length * 100}%"></div></div>
          <h3 class="q">${esc(q.text)}</h3>
          <div class="options ${q.type}">
            ${q.type === 'likert'
              ? MI.LIKERT.map((l, k) => `<button class="opt ${answers[i] === k + 1 ? 'sel' : ''}" data-v="${k + 1}"><b>${k + 1}</b><span>${l}</span></button>`).join('')
              : q.options.map((o, k) => `<button class="opt ${answers[i] === k ? 'sel' : ''}" data-v="${k}"><b>${'ABCD'[k]}</b><span>${esc(o[0])}</span></button>`).join('')}
          </div>
          <div class="row between mt">
            <button class="btn ghost" id="prev" ${i === 0 ? 'disabled' : ''}>← Back</button>
            <button class="btn ghost" id="auto" title="Fill remaining answers with a realistic sample profile">Auto-fill sample</button>
          </div>
        </div>`;
      $$('.opt', el).forEach(b => b.addEventListener('click', () => {
        answers[i] = +b.dataset.v;
        if (i < MI.ASSESSMENT.length - 1) { i++; draw(); } else finish();
      }));
      $('#prev', el).addEventListener('click', () => { i--; draw(); });
      $('#auto', el).addEventListener('click', () => {
        MI.ASSESSMENT.forEach((q, k) => {
          if (answers[k] != null) return;
          // Sample profile: confident self-ratings, weaker behaviour on a few dimensions.
          const weak = ['delegation', 'conflict', 'strategic', 'accountability'].includes(q.dim);
          if (q.type === 'likert') answers[k] = weak ? 4 : 3 + (k % 2);
          else {
            const byScore = q.options.map((o, idx) => [o[1], idx]).sort((x, y) => y[0] - x[0]);
            answers[k] = byScore[weak ? 2 : 0][1];
          }
        });
        finish();
      });
    };
    const finish = () => {
      el.innerHTML = `<div class="panel narrow center"><div class="spinner"></div><h3>Analysing your responses…</h3><p class="muted">Scoring 12 dimensions · detecting perception gaps · building your plan</p></div>`;
      setTimeout(() => {
        const rep = MI.assess.score(answers);
        S.assessment = { answers, report: rep }; save();
        renderReport(el, rep, answers);
      }, 900);
    };
    if (!S.assessment) {
      el.innerHTML = `<div class="panel narrow">
        <p class="eyebrow">Day 1 · AI Leadership Assessment</p>
        <h2>Mastery Leadership Score™</h2>
        <p>24 questions across 12 leadership dimensions — a self-rating and a real-world situation for each. Takes about 6 minutes.</p>
        <p class="muted small">Output: your score, strengths, top 3 capability gaps, perception gaps and a personalised 90-day development plan
        (Current state → Gap → Intervention → Progress). Until you take it, the demo shows ${esc(MI.PERSONA.name)}’s sample profile.</p>
        <div class="row gap"><button class="btn primary" id="start">Start assessment</button><button class="btn" id="sample">View sample report</button></div>
      </div>`;
      $('#start', el).addEventListener('click', draw);
      $('#sample', el).addEventListener('click', () => renderReport(el, report(), null));
    } else draw();
  }

  function renderReport(el, rep, answers) {
    const dims = MI.DIMENSIONS;
    const pg = answers ? MI.assess.perceptionGaps(answers) : ['Delegation'];
    el.innerHTML = `
      <div class="grid-2">
        <div class="panel center">
          <p class="eyebrow">${answers ? 'Your result' : 'Sample · ' + esc(MI.PERSONA.name)}</p>
          <h3>Mastery Leadership Score™</h3>
          ${MI.charts.ring(rep.overall, 'Mastery Leadership Score', 170)}
          <div class="pill ${rep.band.tone}">${rep.band.label}</div>
          <div class="grid-2 tight mt">
            <div><h4>Strengths</h4><ul class="plain">${rep.strengths.map(s => `<li>▲ ${s.name} <b>${s.score}</b></li>`).join('')}</ul></div>
            <div><h4>Capability gaps</h4><ul class="plain">${rep.gaps.map(s => `<li>▼ ${s.name} <b>${s.score}</b></li>`).join('')}</ul></div>
          </div>
          ${pg.length ? `<div class="callout warn mt">⚠ <b>Perception gap:</b> ${pg.map(esc).join(', ')} — you rate yourself highly, but your situational choices suggest otherwise. This is a key coaching focus.</div>` : ''}
          <div class="row gap center-x mt"><a class="btn" href="#/assessment/retake">Retake</a><a class="btn primary" href="#/coach">Discuss with AI Coach</a></div>
        </div>
        <div class="panel">
          <h3>Profile across 12 dimensions</h3>
          <div class="legend"><span><i class="sw s1"></i>Current</span><span><i class="sw target"></i>Day-90 target (gaps)</span></div>
          ${MI.charts.radar(dims, [
            { label: 'Day-90 target', cls: 'target', values: Object.fromEntries(MI.DIMENSIONS.map(d => [d.key, rep.plan.find(p => p.dim === d.key)?.target90 ?? rep.scores[d.key]])) },
            { label: 'Current', cls: 's1', values: rep.scores }
          ], 380)}
          <details><summary>Table view</summary>
            <table class="table small"><tbody>${MI.DIMENSIONS.map(d => `<tr><td>${d.name}</td><td class="num">${rep.scores[d.key]}</td><td>${MI.band(rep.scores[d.key]).label}</td></tr>`).join('')}</tbody></table>
          </details>
        </div>
      </div>
      <h3 class="section-title">Personalised development plan — Current state → Gap → Intervention → Progress</h3>
      <div class="cards three">
        ${rep.plan.map((p, i) => `<div class="card">
          <div class="row between"><span class="eyebrow">Gap ${i + 1}</span><span class="pill warning">${p.current} → ${p.target90}</span></div>
          <h4>${esc(p.name)}</h4>
          <div class="milestones"><span>Now <b>${p.current}</b></span><span>D30 <b>${p.target30}</b></span><span>D60 <b>${p.target60}</b></span><span>D90 <b>${p.target90}</b></span></div>
          <p><b>Intervention:</b> ${esc(p.intervention)}</p>
          <p><b>Weekly practice:</b> ${esc(p.practice)}</p>
          <p><b>Human coach:</b> ${esc(p.humanCoach)}</p>
          ${p.scenario ? `<a class="btn small" href="#/roleplay/${p.scenario.id}">Rehearse: ${esc(p.scenario.title)} →</a>` : ''}
        </div>`).join('')}
      </div>
      <div class="panel mt">
        <h3>Funnel this enables</h3>
        <div class="funnel">${['Free Leadership Assessment', 'Paid Assessment', 'Leadership Program', 'Executive Coaching', 'AI Coaching Subscription'].map((f, i) => `<div style="--i:${i}">${f}</div>`).join('')}</div>
      </div>`;
  }

  /* ---------- Coach ---------- */
  function viewCoach(el) {
    const r = report();
    el.innerHTML = `
      <div class="coach-layout">
        <div class="panel chat-panel">
          <div class="row between wrap">
            <div class="seg" role="tablist" aria-label="Channel">
              ${[['web', 'Web'], ['whatsapp', 'WhatsApp'], ['voice', 'Voice']].map(([k, l]) => `<button role="tab" data-ch="${k}" class="${S.channel === k ? 'on' : ''}">${l}</button>`).join('')}
            </div>
            <span class="pill ${MI.ai.live ? 'good' : 'neutral'}">${MI.ai.live ? '● Live Claude' : '● Offline coach engine'}</span>
          </div>
          <div class="chat ch-${S.channel}" id="chat">
            <div class="chat-head"><div class="avatar">M</div><div><b>Mastery AI Coach</b><div class="small">${S.channel === 'whatsapp' ? 'online' : 'Trained on Mastery Inside methodology'}</div></div></div>
            <div class="msgs" id="msgs" aria-live="polite"></div>
            <div class="voice-orb" id="orb" hidden><button id="orb-btn" aria-label="Hold to talk"><span></span></button><div id="orb-text" class="muted small">Tap to speak</div></div>
            <form class="composer" id="composer">
              <button type="button" class="icon-btn" id="mic" title="Speak" ${Speech.canListen ? '' : 'disabled'}>🎙</button>
              <input id="msg" autocomplete="off" placeholder="Ask your coach anything…" aria-label="Message">
              <button class="btn primary">Send</button>
            </form>
          </div>
          <div class="chips" id="chips">
            ${['I have a difficult conversation with my CEO tomorrow. How should I approach it?', 'I committed to improving delegation. What should I do this week?', 'My team member has been missing targets for three months.', 'Two of my leads keep clashing in meetings.'].map(c => `<button class="chip">${esc(c)}</button>`).join('')}
          </div>
        </div>
        <aside class="stack">
          <div class="panel">
            <h4>What your coach knows</h4>
            <ul class="plain small">
              <li>Score <b>${r.overall}</b> · ${r.band.label}</li>
              <li>Focus gap: <b>${esc(r.gaps[0].name)}</b> (${r.gaps[0].score})</li>
              <li>Day ${MI.PERSONA.programDay} of 90 · human coach: ${esc(MI.PERSONA.coach)}</li>
            </ul>
          </div>
          <div class="panel">
            <h4>The AI coaches, challenges, reminds & measures</h4>
            <ol class="small steps"><li>Clarify the situation</li><li>Probe the root cause</li><li>Apply the Mastery framework</li><li>Commit to an action</li><li>Follow up & measure</li></ol>
          </div>
          <div class="panel">
            <h4>Open commitments</h4>
            <ul class="plain small" id="commit-list"></ul>
          </div>
          <button class="btn ghost small" id="clear-chat">Clear conversation</button>
        </aside>
      </div>`;

    const msgs = $('#msgs', el), input = $('#msg', el);
    const drawCommitments = () => {
      $('#commit-list', el).innerHTML = S.commitments.filter(c => !c.done).map(c => `<li>☐ ${esc(c.text)}</li>`).join('') || '<li class="muted">None yet</li>';
    };
    const bubble = (m) => {
      const d = document.createElement('div');
      d.className = 'msg ' + (m.role === 'user' ? 'out' : 'in') + (m.flag ? ' flag' : '');
      d.innerHTML = md(m.text) + (m.suggest ? `<a class="btn small mt" href="#/roleplay/${m.suggest}">Practise it in RolePlay →</a>` : '') + (S.channel === 'whatsapp' ? `<span class="wa-meta">${m.role === 'user' ? '✓✓' : ''}</span>` : '');
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    };
    const drawAll = () => {
      msgs.innerHTML = '';
      if (!S.chat.length) bubble({ role: 'assistant', text: `Hi ${MI.PERSONA.name.split(' ')[0]} — I’m your Mastery AI coach. You’re on **day ${MI.PERSONA.programDay}** of your program, focusing on **${r.gaps[0].name}**.\n\nWhat’s on your mind today?` });
      S.chat.forEach(bubble);
    };
    drawAll(); drawCommitments();

    const typing = () => { const t = document.createElement('div'); t.className = 'msg in typing'; t.innerHTML = '<i></i><i></i><i></i>'; msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight; return t; };

    async function send(text) {
      text = text.trim(); if (!text) return;
      S.chat.push({ role: 'user', text }); bubble(S.chat[S.chat.length - 1]);
      input.value = '';
      const t = typing();
      const offline = MI.coach.reply(text, S.coachState, { report: r, commitments: S.commitments });
      let replyText = offline.text;
      if (MI.ai.live) {
        try {
          replyText = await MI.ai.chat('coach', S.chat.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })), {
            persona: MI.PERSONA, score: r.overall, gaps: r.gaps.map(g => `${g.name} (${g.score})`), commitments: S.commitments.filter(c => !c.done).map(c => c.text)
          });
        } catch (e) { replyText = offline.text; }
      } else {
        await new Promise(res => setTimeout(res, 500 + Math.min(1200, offline.text.length * 4)));
      }
      t.remove();
      S.coachState = offline.state;
      if (offline.commitment) { S.commitments.push({ text: offline.commitment, done: false, at: 'Week ' + Math.ceil(MI.PERSONA.programDay / 7) }); drawCommitments(); }
      if (offline.escalate) S.escalations.push({ text, at: new Date().toISOString() });
      const m = { role: 'assistant', text: replyText, suggest: offline.suggestion ? offline.suggestion.id : null, flag: offline.escalate };
      S.chat.push(m); save(); bubble(m);
      if (S.channel === 'voice') Speech.say(replyText);
    }

    $('#composer', el).addEventListener('submit', e => { e.preventDefault(); send(input.value); });
    $$('.chip', el).forEach(c => c.addEventListener('click', () => send(c.textContent)));
    $('#clear-chat', el).addEventListener('click', () => { S.chat = []; S.coachState = { topic: null, stage: 0 }; save(); drawAll(); });
    $$('[data-ch]', el).forEach(b => b.addEventListener('click', () => { S.channel = b.dataset.ch; save(); viewCoach(el); }));

    // voice
    const orb = $('#orb', el);
    orb.hidden = S.channel !== 'voice';
    let rec = null;
    const startListen = (btn, out) => {
      if (!Speech.canListen) { out && (out.textContent = 'Voice input needs Chrome or Edge. Type instead.'); return; }
      if (rec) { rec.stop(); return; }
      btn.classList.add('listening');
      rec = Speech.listen((txt, final) => { input.value = txt; if (out) out.textContent = txt; if (final) { send(txt); } },
        () => { btn.classList.remove('listening'); rec = null; if (out) out.textContent = 'Tap to speak'; });
    };
    $('#mic', el).addEventListener('click', e => startListen(e.currentTarget, null));
    $('#orb-btn', el).addEventListener('click', e => startListen(e.currentTarget, $('#orb-text', el)));
    if (S.channel === 'voice' && !Speech.canListen) $('#orb-text', el).textContent = 'Voice input needs Chrome or Edge — replies are still spoken aloud.';
  }

  /* ---------- RolePlay ---------- */
  function viewRoleplay(el, id) {
    const scn = MI.SCENARIOS.find(s => s.id === id);
    if (!scn) {
      el.innerHTML = `
        <p class="lede">Practise real leadership situations with an AI persona. Speak or type — then get a Roleplay Score across 8 behaviours with specific feedback. Unlimited, safe practice.</p>
        <div class="cards">${MI.SCENARIOS.map(s => {
          const best = Math.max(0, ...S.roleplayHistory.filter(h => h.scenario === s.id).map(h => h.overall));
          return `<a class="card link" href="#/roleplay/${s.id}">
            <div class="row between"><span class="eyebrow">${s.tag}</span><span class="pill ${s.difficulty === 'Hard' ? 'serious' : 'neutral'}">${s.difficulty}</span></div>
            <h4>${esc(s.title)}</h4>
            <p class="small">AI plays <b>${esc(s.persona)}</b>, ${esc(s.personaRole)}.</p>
            <p class="small muted">${esc(s.brief)}</p>
            ${best ? `<div class="small">Best score: <b>${best}</b></div>` : ''}
          </a>`; }).join('')}</div>
        <div class="panel mt"><h3>Your role-play progress</h3>
          ${S.roleplayHistory.length > 1 ? MI.charts.line(S.roleplayHistory.map((h, i) => '#' + (i + 1)), S.roleplayHistory.map(h => h.overall), { min: 30, max: 100, ticks: [40, 70, 100], h: 180, label: 'Role-play overall score by attempt' }) : '<p class="muted">Complete a session to see progress.</p>'}
        </div>`;
      return;
    }

    const state = { tension: scn.tension, rootRevealed: false, rootShared: false, agreed: 0, i: 0 };
    const turns = [{ role: 'persona', text: scn.opening }];
    let voiceOn = false, asked = false, finished = false;

    el.innerHTML = `
      <div class="coach-layout">
        <div class="panel chat-panel">
          <div class="row between wrap">
            <a class="btn ghost small" href="#/roleplay">← Scenarios</a>
            <div class="row gap">
              <label class="toggle"><input type="checkbox" id="voice"> 🔊 Voice mode</label>
              <span class="pill ${MI.ai.live ? 'good' : 'neutral'}">${MI.ai.live ? '● Live Claude persona' : '● Offline persona engine'}</span>
            </div>
          </div>
          <div class="rp-brief">
            <div class="avatar big">${esc(scn.persona[0])}</div>
            <div><b>${esc(scn.persona)}</b> · ${esc(scn.personaRole)}<div class="muted small">${esc(scn.brief)}</div><div class="small"><b>Your goal:</b> ${esc(scn.goal)}</div></div>
          </div>
          <div class="mood"><span>Persona tension</span><div class="mood-bar"><div id="mood" style="width:${state.tension * 10}%"></div></div><span id="mood-l">${state.tension >= 7 ? 'Defensive' : state.tension >= 4 ? 'Guarded' : 'Open'}</span></div>
          <div class="chat ch-web rp"><div class="msgs" id="msgs" aria-live="polite"></div>
            <form class="composer" id="composer">
              <button type="button" class="icon-btn" id="mic" title="Speak" ${Speech.canListen ? '' : 'disabled'}>🎙</button>
              <input id="msg" autocomplete="off" placeholder="You are the manager. What do you say?" aria-label="Your reply">
              <button class="btn primary">Say</button>
            </form>
          </div>
          <div class="row between mt"><span class="muted small">Tip: open with intent, ask before you tell, agree a next step.</span><button class="btn" id="end">End & get feedback</button></div>
        </div>
        <aside class="stack" id="rp-side">
          <div class="panel"><h4>Evaluated on</h4><ul class="plain small cols">${MI.ROLEPLAY_PARAMS.map(p => `<li>${p[1]}</li>`).join('')}</ul></div>
          <div class="panel"><h4>Live signals</h4><ul class="plain small" id="signals"><li class="muted">Signals appear as you speak…</li></ul></div>
        </aside>
      </div>`;

    const msgs = $('#msgs', el), input = $('#msg', el);
    const add = (role, text) => {
      const d = document.createElement('div');
      d.className = 'msg ' + (role === 'user' ? 'out' : 'in persona');
      d.innerHTML = (role === 'user' ? '' : `<span class="who">${esc(scn.persona)}</span>`) + md(text);
      msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
    };
    add('persona', scn.opening);
    const signals = [];
    const updateMood = () => {
      $('#mood', el).style.width = state.tension * 10 + '%';
      $('#mood-l', el).textContent = state.tension >= 7 ? 'Defensive' : state.tension >= 4 ? 'Guarded' : 'Open';
    };

    async function say(text) {
      text = text.trim(); if (!text || finished) return;
      input.value = '';
      const prev = [...turns].reverse().find(t => t.role === 'persona').text;
      const uIdx = turns.filter(t => t.role === 'user').length + 1;
      const f = MI.roleplay.analyse(text, prev, uIdx, asked);
      if (f.openQ) asked = true;
      turns.push({ role: 'user', text, f });
      add('user', text);
      const sig = [];
      if (f.empathy) sig.push(['good', 'Empathy shown']);
      if (f.openQ) sig.push(['good', 'Open question']);
      if (f.listening) sig.push(['good', 'Listening back']);
      if (f.outcome) sig.push(['good', 'Moving to outcome']);
      if (f.solutionEarly) sig.push(['serious', 'Solution too early']);
      if (f.blame) sig.push(['critical', 'Blaming language']);
      if (f.monologue) sig.push(['warning', 'Long monologue']);
      signals.unshift(...sig.map(s => [...s, uIdx]));
      $('#signals', el).innerHTML = signals.slice(0, 8).map(([tone, l, n]) => `<li><span class="dot ${tone}"></span>${l} <span class="muted">· turn ${n}</span></li>`).join('') || '<li class="muted">No strong signals yet</li>';

      const offline = MI.roleplay.respond(scn, state, f);
      let reply = offline.text;
      const t = document.createElement('div'); t.className = 'msg in typing'; t.innerHTML = '<i></i><i></i><i></i>'; msgs.appendChild(t);
      if (MI.ai.live) {
        try {
          reply = await MI.ai.chat('roleplay', turns.map(x => ({ role: x.role === 'user' ? 'user' : 'assistant', content: x.text })), {
            scenario: { persona: scn.persona, role: scn.personaRole, brief: scn.brief, root: scn.root, style: scn.style },
            tension: Math.round(state.tension), revealRoot: state.rootShared, agreed: state.agreed
          });
        } catch (e) { reply = offline.text; }
      } else await new Promise(r => setTimeout(r, 700));
      t.remove();
      turns.push({ role: 'persona', text: reply });
      add('persona', reply);
      updateMood();
      if (voiceOn) Speech.say(reply, 'persona');
      if (offline.done) setTimeout(end, 900);
    }

    function end() {
      if (finished) return;
      if (!turns.some(t => t.role === 'user')) { add('persona', '_(Say something first — the persona is waiting.)_'); return; }
      finished = true;
      const ev = MI.roleplay.evaluate(turns, state);
      S.roleplayHistory.push({ scenario: scn.id, overall: ev.overall, at: new Date().toISOString() }); save();
      const prevBest = S.roleplayHistory.filter(h => h.scenario === scn.id).slice(0, -1).map(h => h.overall);
      $('#rp-side', el).innerHTML = `
        <div class="panel center">
          <p class="eyebrow">Roleplay Score</p>
          ${MI.charts.ring(ev.overall, 'Roleplay Score', 140)}
          <div class="small">${ev.resolved ? '✓ Reached agreement' : 'No agreement reached'} · ${ev.turns} turns${prevBest.length ? ` · previous best ${Math.max(...prevBest)}` : ''}</div>
        </div>
        <div class="panel">${MI.charts.hbars(MI.ROLEPLAY_PARAMS.map(([k, l]) => ({ label: l, value: ev.scores[k], tone: ev.scores[k] >= 70 ? 'good' : ev.scores[k] >= 50 ? 'warning' : 'critical' })))}</div>
        <div class="panel">
          <h4>Strengths</h4><ul class="plain small">${(ev.strengths.length ? ev.strengths : ['You showed up and practised — that is the habit that matters']).map(s => `<li>✓ ${esc(s)}</li>`).join('')}</ul>
          <h4>Improve</h4><ul class="plain small">${ev.improve.map(s => `<li>→ ${esc(s)}</li>`).join('') || '<li>Excellent — try a harder scenario.</li>'}</ul>
          <p class="strong mt">“Try the conversation again.”</p>
          <div class="row gap"><a class="btn primary" href="#/roleplay/${scn.id}" id="retry">Retry</a><a class="btn" href="#/roleplay">Other scenarios</a></div>
        </div>`;
      $('#retry', el).addEventListener('click', e => { e.preventDefault(); viewRoleplay(el, scn.id); });
      $('#composer', el).classList.add('disabled');
      input.disabled = true;
    }

    $('#composer', el).addEventListener('submit', e => { e.preventDefault(); say(input.value); });
    $('#end', el).addEventListener('click', end);
    $('#voice', el).addEventListener('change', e => { voiceOn = e.target.checked; if (voiceOn) Speech.say(turns[turns.length - 1].text, 'persona'); });
    let rec = null;
    $('#mic', el).addEventListener('click', e => {
      const btn = e.currentTarget;
      if (rec) { rec.stop(); return; }
      btn.classList.add('listening');
      rec = Speech.listen((txt, final) => { input.value = txt; if (final) say(txt); }, () => { btn.classList.remove('listening'); rec = null; });
    });
  }

  /* ---------- 360 ---------- */
  function viewFeedback(el) {
    const r = report();
    const rows = MI.FEEDBACK_360.map(x => ({ ...x, self: S.assessment ? Math.min(100, r.scores[x.dim] + 12) : x.self }));
    const withGap = rows.map(x => ({ ...x, others: Math.round((x.manager + x.team + x.ai) / 3) })).map(x => ({ ...x, gap: x.self - x.others }));
    const top = [...withGap].sort((a, b) => b.gap - a.gap)[0];
    const series = [{ label: 'Self', cls: 's1' }, { label: 'Manager', cls: 's2' }, { label: 'Team', cls: 's3' }, { label: 'AI behavioural', cls: 's4' }];
    el.innerHTML = `
      <p class="lede">Self + manager + peer/direct-report + AI behavioural analysis (role-plays, check-ins, meetings) → one view of how leadership is actually experienced.</p>
      <div class="grid-2">
        <div class="panel">
          <h3>Self vs others</h3>
          <div class="legend">${series.map(s => `<span><i class="sw ${s.cls}"></i>${s.label}</span>`).join('')}</div>
          ${MI.charts.grouped(withGap.map(x => ({ label: MI.dimByKey[x.dim].short, values: [x.self, x.manager, x.team, x.ai] })), series)}
        </div>
        <div class="panel">
          <h3>AI insight</h3>
          <div class="callout warn"><b>Perception gap: ${esc(MI.dimByKey[top.dim].name)}</b><br>You rate yourself <b>${top.self}</b>; others average <b>${top.others}</b> (gap ${top.gap}). You believe you’re strong here — your team experiences it differently.</div>
          <p class="small">This becomes the basis for coaching. Suggested next steps:</p>
          <ol class="small"><li>Discuss the gap with your human coach (flagged for next session).</li><li>Ask two team members: “What’s one thing I could hand over more fully?”</li><li>Rehearse in the RolePlay Studio, then re-pulse in 30 days.</li></ol>
          <a class="btn small" href="#/roleplay/${MI.dimByKey[top.dim].scenario}">Rehearse now →</a>
        </div>
      </div>
      <div class="panel">
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Capability</th><th class="num">Self</th><th class="num">Manager</th><th class="num">Team</th><th class="num">AI</th><th class="num">Gap (self − others)</th></tr></thead>
          <tbody>${withGap.map(x => `<tr><td>${MI.dimByKey[x.dim].name}</td><td class="num">${x.self}</td><td class="num">${x.manager}</td><td class="num">${x.team}</td><td class="num">${x.ai}</td>
            <td class="num">${x.gap >= 15 ? `<span class="pill serious">▲ ${x.gap}</span>` : x.gap <= -5 ? `<span class="pill info">▼ ${x.gap} hidden strength</span>` : x.gap}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>`;
  }

  /* ---------- Coach console ---------- */
  function viewConsole(el) {
    const live = S.escalations.length ? [{ name: MI.PERSONA.name, dept: 'Sales', score: report().overall, delta: +9, engagement: 92, lastAI: 'just now', status: 'Needs human', flag: 'Escalated from AI chat: “' + S.escalations[S.escalations.length - 1].text.slice(0, 60) + '…”' }] : [];
    const list = [...live, ...MI.CASELOAD.filter(c => !(live.length && c.name === MI.PERSONA.name))];
    const need = list.filter(c => c.status === 'Needs human');
    el.innerHTML = `
      <div class="kpis">
        <div class="kpi"><span>Participants</span><b>48</b><small>for 1 coach (+AI)</small></div>
        <div class="kpi"><span>AI-handled interactions</span><b>1,126</b><small>this month · 94%</small></div>
        <div class="kpi"><span>Need human coach</span><b>${need.length}</b><small>escalated by AI</small></div>
        <div class="kpi"><span>Coach hours saved</span><b>61h</b><small>vs. 1:1-only model</small></div>
      </div>
      <div class="grid-2">
        <div class="panel">
          <h3>Human + AI coach model</h3>
          <div class="split">
            <div><h4>AI handles</h4><ul class="plain small">${['Daily check-ins & nudges', 'Reflection & exercises', 'Role plays & practice', 'Assessments & progress tracking', 'FAQs & learning reinforcement'].map(x => `<li>● ${x}</li>`).join('')}</ul></div>
            <div><h4>Human coaches handle</h4><ul class="plain small">${['Deep & executive coaching', 'Complex, emotional situations', 'Strategic interventions', 'Perception-gap debriefs', 'High-value conversations'].map(x => `<li>● ${x}</li>`).join('')}</ul></div>
          </div>
          <div class="scale"><div><b>10</b> coaches</div><div class="muted">→</div><div><b>~80</b> participants</div><div class="muted">with AI →</div><div><b>500+</b> participants</div></div>
        </div>
        <div class="panel">
          <h3>Escalation queue</h3>
          <ul class="queue">${need.map(c => `<li><div><b>${esc(c.name)}</b> <span class="muted small">· ${c.dept}</span><div class="small">${esc(c.flag)}</div></div><button class="btn small" data-take="${esc(c.name)}">Take session</button></li>`).join('')}</ul>
        </div>
      </div>
      <div class="panel">
        <h3>Caseload</h3>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Participant</th><th>Dept</th><th class="num">Score</th><th class="num">Δ since D1</th><th class="num">Engagement</th><th>Last AI touch</th><th>Status</th></tr></thead>
          <tbody>${list.map(c => `<tr><td>${esc(c.name)}</td><td>${c.dept}</td><td class="num">${c.score}</td><td class="num"><span class="delta ${c.delta > 0 ? 'up' : ''}">${c.delta > 0 ? '+' : ''}${c.delta}</span></td>
            <td class="num">${c.engagement}%</td><td>${c.lastAI}</td><td><span class="pill ${c.status === 'On track' ? 'good' : c.status === 'Watch' ? 'warning' : 'serious'}">${c.status === 'On track' ? '✓' : '!'} ${c.status}</span></td></tr>`).join('')}</tbody>
        </table></div>
      </div>`;
    $$('[data-take]', el).forEach(b => b.addEventListener('click', () => { b.textContent = '✓ Booked for tomorrow'; b.disabled = true; }));
  }

  /* ---------- CHRO dashboard ---------- */
  function viewDashboard(el) {
    const O = MI.ORG;
    const gaps = MI.DIMENSIONS.map((d, i) => ({ d, v: Math.round(MI.avg(Object.values(O.heat).map(r => r[i]))) })).sort((a, b) => a.v - b.v);
    el.innerHTML = `
      <div class="row between wrap"><div><p class="eyebrow">${esc(O.name)}</p><h3 class="m0">${esc(O.cohort)} · ${O.participants} leaders</h3></div>
        <div class="seg" id="range">${['Baseline', 'Day 30', 'Day 60'].map((x, i) => `<button class="${i === 2 ? 'on' : ''}">${x}</button>`).join('')}</div></div>
      <div class="kpis">
        <div class="kpi hero-kpi"><span>Leadership Capability Score</span><b>${O.score}</b><small><span class="delta up">+${O.score - O.baseline}</span> vs baseline ${O.baseline}</small></div>
        <div class="kpi"><span>Weekly active</span><b>${O.engagement.weeklyActive}%</b><small>of participants</small></div>
        <div class="kpi"><span>AI coaching sessions</span><b>${O.engagement.aiSessions.toLocaleString('en-IN')}</b><small>last 60 days</small></div>
        <div class="kpi"><span>Role-plays completed</span><b>${O.engagement.roleplays}</b><small>avg score +14</small></div>
        <div class="kpi"><span>Participant NPS</span><b>${O.engagement.nps}</b><small>check-in rate ${O.engagement.checkinRate}%</small></div>
      </div>
      <div class="grid-2">
        <div class="panel"><h3>By department</h3><div class="legend"><span><i class="sw s1"></i>Current</span><span><i class="sw base"></i>Baseline</span></div>
          ${MI.charts.hbars(O.departments.map(d => ({ label: `${d.name} (${d.n})`, value: d.score, base: d.baseline, tone: 's1' })), { delta: true })}</div>
        <div class="panel"><h3>Behaviour improvement — before → after</h3><div class="legend"><span><i class="sw s1"></i>Day 60</span><span><i class="sw base"></i>Baseline</span></div>
          ${MI.charts.hbars(O.improvements.map(x => ({ label: MI.dimByKey[x.dim].name, value: x.after, base: x.before, tone: 's1' })), { delta: true })}
          <div class="callout good small mt">“Here is what changed because of our leadership program” — not “400 people attended our workshop.”</div></div>
      </div>
      <div class="grid-2">
        <div class="panel"><h3>Capability gaps (organisation)</h3>
          <ul class="gaps">${gaps.slice(0, 4).map((g, i) => `<li><span class="pill ${i < 2 ? 'critical' : 'serious'}">${i < 2 ? '● Critical' : '● Watch'}</span> ${g.d.name} <b>${g.v}</b></li>`).join('')}
            ${gaps.slice(-1).map(g => `<li><span class="pill good">✓ Strength</span> ${g.d.name} <b>${g.v}</b></li>`).join('')}</ul></div>
        <div class="panel"><h3>Predict — leadership risk signals</h3>
          <ul class="queue">${O.risks.map(r => `<li><div><span class="dot ${r.level}"></span><b>${r.name}</b> <span class="muted small">· ${r.dept}</span><div class="small">${r.signal}</div></div><span class="pill ${r.level}">${r.level === 'critical' ? '! Act now' : r.level === 'serious' ? '! Coach' : 'Watch'}</span></li>`).join('')}</ul></div>
      </div>
      <div class="panel"><h3>Department × capability heatmap</h3>
        ${MI.charts.heatmap(Object.entries(O.heat).map(([k, v]) => ({ label: k, values: v })), MI.DIMENSIONS.map(d => d.short))}</div>
      <div class="panel"><h3>Program ROI snapshot</h3>
        <div class="stat-row">
          <div class="stat"><span>Leaders improved ≥10 pts</span><b>63%</b></div>
          <div class="stat"><span>Manager-rated behaviour change</span><b>+17%</b></div>
          <div class="stat"><span>Coach capacity multiplier</span><b>6×</b></div>
          <div class="stat"><span>Cost / participant / month</span><b>₹1,450</b></div>
        </div></div>`;
    const seg = $('#range', el);
    $$('button', seg).forEach((b, i) => b.addEventListener('click', () => {
      $$('button', seg).forEach(x => x.classList.remove('on')); b.classList.add('on');
      const f = [0, 0.55, 1][i];
      $$('.hbar-row', el).forEach(row => {
        const fill = $('.hbar-fill', row), base = $('.hbar-base', row), val = $('.hbar-val', row);
        if (!base) return;
        const b0 = parseFloat(base.style.left), now = +(row.dataset.now = row.dataset.now || parseFloat(fill.style.width));
        const v = Math.round(b0 + (now - b0) * f);
        fill.style.width = v + '%'; val.innerHTML = v + (v > b0 ? ` <span class="delta up">+${v - b0}</span>` : '');
      });
      $('.hero-kpi b', el).textContent = Math.round(O.baseline + (O.score - O.baseline) * f);
    }));
  }

  /* ---------- AI consultant / lead gen / proposal ---------- */
  function viewConsultant(el) {
    const answers = {};
    let qi = 0;
    el.innerHTML = `
      <div class="coach-layout">
        <div class="panel chat-panel site">
          <div class="site-bar"><span class="dot-r"></span><span class="dot-y"></span><span class="dot-g"></span><span class="url">Mastery Inside website · mock</span></div>
          <div class="site-hero"><b>Mastery Inside</b><span>Leadership that lasts.</span></div>
          <div class="chat ch-web"><div class="chat-head"><div class="avatar">M</div><div><b>Mastery AI Consultant</b><div class="small">Typically replies instantly</div></div></div>
            <div class="msgs" id="msgs"></div>
            <div class="chips" id="lchips"></div>
            <form class="composer" id="composer"><input id="msg" autocomplete="off" placeholder="Type your answer…" aria-label="Answer"><button class="btn primary">Send</button></form>
          </div>
        </div>
        <aside class="stack" id="crm">
          <div class="panel"><h4>CRM · live lead card</h4><div id="lead-card" class="small muted">Qualification fields fill in as the visitor answers.</div></div>
          <div class="panel"><h4>Lead journey</h4><div class="pipeline">${['Website lead', 'AI qualification', 'Lead score', 'Sales team', 'Meeting'].map((s, i) => `<span data-p="${i}">${s}</span>`).join('')}</div></div>
        </aside>
      </div>
      <div id="proposal"></div>`;
    const msgs = $('#msgs', el), input = $('#msg', el);
    const add = (role, text) => { const d = document.createElement('div'); d.className = 'msg ' + (role === 'user' ? 'out' : 'in'); d.innerHTML = md(text); msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; };
    const stage = n => $$('[data-p]', el).forEach(s => s.classList.toggle('on', +s.dataset.p <= n));
    const card = () => {
      $('#lead-card', el).innerHTML = `<table class="table small"><tbody>${MI.LEAD_QUESTIONS.map(q => `<tr><td>${q.key}</td><td>${answers[q.key] ? esc(answers[q.key]) : '<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table>`;
    };
    const ask = () => {
      const q = MI.LEAD_QUESTIONS[qi];
      add('assistant', q.q);
      $('#lchips', el).innerHTML = q.chips.map(c => `<button class="chip">${esc(c)}</button>`).join('');
      $$('#lchips .chip', el).forEach(c => c.addEventListener('click', () => answer(c.textContent)));
      input.placeholder = q.chips.length ? 'Pick an option or type…' : 'Type your answer…';
    };
    const answer = text => {
      text = text.trim(); if (!text) return;
      add('user', text); input.value = '';
      answers[MI.LEAD_QUESTIONS[qi].key] = text; card(); stage(1);
      qi++;
      if (qi < MI.LEAD_QUESTIONS.length) setTimeout(ask, 450);
      else setTimeout(done, 600);
    };
    const done = () => {
      $('#lchips', el).innerHTML = '';
      const { score, tier } = MI.leads.score(answers);
      const rec = MI.PROGRAMS[MI.leads.recommend(answers)];
      stage(3);
      add('assistant', `Thank you! Based on your responses, **${answers.company || 'your organisation'}** would benefit from our **${rec.name}** (${rec.duration}).\n\nWould you like to book a 30-minute consultation with a Mastery Inside partner? You can also start with a **free Leadership Assessment** for up to 10 leaders.`);
      $('#lchips', el).innerHTML = `<button class="chip" id="book">📅 Book consultation</button><button class="chip" id="call">📞 Simulate AI voice call-back</button>`;
      S.leads.push({ ...answers, score, tier, at: new Date().toISOString() }); save();
      $('#crm', el).insertAdjacentHTML('afterbegin', `<div class="panel center"><p class="eyebrow">AI lead score</p>${MI.charts.ring(score, 'Lead score', 120)}<div class="pill ${tier === 'Hot' ? 'critical' : tier === 'Warm' ? 'warning' : 'neutral'}">${tier === 'Hot' ? '🔥' : ''} ${tier}</div>
        <button class="btn primary mt" id="gen">Generate proposal</button></div>`);
      $('#book', el).addEventListener('click', () => { add('user', 'Book consultation'); add('assistant', '✅ Booked: **Tuesday, 11:00 AM** with Sharmila (Partner). A calendar invite and a pre-read on the Mastery Leadership Score are on their way.'); stage(4); });
      $('#call', el).addEventListener('click', () => {
        add('assistant', `📞 **AI voice call-back (placed 8 seconds after enquiry):**\n\n_AI:_ “Hi, this is the Mastery Inside AI assistant. I understand you’re exploring leadership development for ${answers.company || 'your organisation'}. May I ask what challenge you’re trying to solve?”\n_Visitor:_ “${answers.challenge}.”\n_AI:_ “That’s one of the most common gaps we see at the ${(answers.level || 'manager').toLowerCase()} level. How many leaders would be involved, and is there a timeline you’re working to?”\n\n→ CRM updated · lead score ${score} · routed to sales · meeting proposed.`);
        stage(4);
      });
      $('#gen', el).addEventListener('click', () => proposal(answers, rec, score));
    };
    $('#composer', el).addEventListener('submit', e => { e.preventDefault(); answer(input.value); });
    card(); stage(0);
    add('assistant', 'Hi 👋 I’m the Mastery Inside AI consultant.');
    setTimeout(ask, 400);

    function proposal(a, rec, score) {
      const n = MI.leads.participantsNum(a.participants);
      const gaps = MI.leads.gapsFor(a.challenge);
      const monthly = n * 1200 * 3;
      $('#proposal', el).innerHTML = `
        <article class="panel proposal">
          <div class="row between wrap"><div><p class="eyebrow">Draft proposal · auto-generated · for sales review</p><h2 class="m0">${esc(a.company || 'Client')} × Mastery Inside</h2><p class="muted">${esc(a.industry || '')} · ${esc(a.size || '')} employees · lead score ${score}</p></div><button class="btn" onclick="window.print()">Print / PDF</button></div>
          <div class="grid-2">
            <section><h4>1. Your challenge</h4><p>${esc(a.challenge)} — at the ${esc((a.level || '').toLowerCase())} level.</p>
              <h4>2. Likely leadership gaps</h4><ul>${gaps.map(g => `<li>${g}</li>`).join('')}</ul>
              <h4>3. Recommended program</h4><p><b>${rec.name}</b> — ${rec.duration}, ~${n} participants.</p></section>
            <section><h4>4. How it works — AI + human</h4><ul>
              <li><b>Assess:</b> Mastery Leadership Score for every participant (Day 1, 30, 60, 90)</li>
              <li><b>Train:</b> Mastery Inside expert-led workshops</li>
              <li><b>Coach:</b> 24×7 Mastery AI Coach on Web, WhatsApp & Voice</li>
              <li><b>Practise:</b> Voice AI role-play on ${gaps[0].toLowerCase()} scenarios</li>
              <li><b>Human coaching:</b> escalations & high-value sessions</li>
              <li><b>Measure:</b> CHRO dashboard with before/after evidence</li></ul></section>
          </div>
          <div class="grid-2">
            <section><h4>5. KPIs & expected outcomes</h4><ul><li>+15–25 points on ${gaps[0]} within 90 days</li><li>≥80% weekly participant engagement</li><li>Manager-rated behaviour change ≥ +15%</li><li>Transformation report for leadership team at Day 90</li></ul></section>
            <section><h4>6. Commercials (indicative)</h4><table class="table small"><tbody>
              <tr><td>Program</td><td>${esc(rec.price)}</td></tr>
              <tr><td>AI coaching layer (90 days)</td><td>≈ ₹${monthly.toLocaleString('en-IN')} (₹1,200 × ${n} × 3 mo)</td></tr>
              <tr><td>Enterprise platform (optional)</td><td>₹3L–₹10L / year</td></tr>
              <tr><td>Timeline</td><td>Start: ${esc(a.timeline || 'TBD')} · Budget: ${esc(a.budget || 'TBD')}</td></tr></tbody></table></section>
          </div>
        </article>`;
      $('#proposal', el).scrollIntoView({ behavior: 'smooth' });
    }
  }

  /* ---------- boot ---------- */
  async function boot() {
    MI.charts.bindTooltips(document.body);
    // Two-step reset (no confirm(): it is blocked in some embedded previews).
    const reset = $('#reset');
    reset.addEventListener('click', () => {
      if (reset.dataset.armed) { MI.store.clear(); S = defaults(); delete reset.dataset.armed; reset.textContent = 'Reset demo'; route(); return; }
      reset.dataset.armed = '1'; reset.textContent = 'Click again to reset';
      setTimeout(() => { delete reset.dataset.armed; reset.textContent = 'Reset demo'; }, 3000);
    });
    $('#menu').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    $('#theme').addEventListener('click', () => {
      const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.dataset.theme = cur === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('mi-theme', document.documentElement.dataset.theme); } catch (e) { /* ignore */ }
    });
    await MI.ai.init();
    $('#ai-mode').textContent = MI.ai.live ? 'Live AI · Claude' : 'Demo AI · offline';
    $('#ai-mode').className = 'pill ' + (MI.ai.live ? 'good' : 'neutral');
    window.addEventListener('hashchange', route);
    route();
  }
  try { const t = localStorage.getItem('mi-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) { /* ignore */ }
  document.addEventListener('DOMContentLoaded', boot);
})();
