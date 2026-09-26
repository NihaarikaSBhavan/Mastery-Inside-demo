/* Mastery AI — app shell, router and views. */
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
      { scenario: 'underperformer', overall: 58, at: 'Week 3', resolved: false, scores: { empathy: 52, clarity: 55, listening: 45, questioning: 50, assertiveness: 62, emotionalControl: 80, conflictHandling: 55, outcome: 45 } },
      { scenario: 'underperformer', overall: 67, at: 'Week 4', resolved: true, scores: { empathy: 70, clarity: 58, listening: 60, questioning: 68, assertiveness: 60, emotionalControl: 85, conflictHandling: 68, outcome: 65 } },
      { scenario: 'ceo', overall: 62, at: 'Week 5', resolved: false, scores: { empathy: 58, clarity: 72, listening: 55, questioning: 60, assertiveness: 70, emotionalControl: 82, conflictHandling: 58, outcome: 55 } },
      { scenario: 'delegation', overall: 71, at: 'Week 5', resolved: true, scores: { empathy: 74, clarity: 66, listening: 62, questioning: 72, assertiveness: 64, emotionalControl: 90, conflictHandling: 72, outcome: 70 } },
      { scenario: 'underperformer', overall: 74, at: 'Week 6', resolved: true, scores: { empathy: 76, clarity: 64, listening: 70, questioning: 75, assertiveness: 63, emotionalControl: 88, conflictHandling: 74, outcome: 72 } }
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
  // Embedded viewers (e.g. a shared link) block the microphone and print dialog.
  const EMBEDDED = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  const Speech = {
    Rec: EMBEDDED ? null : (window.SpeechRecognition || window.webkitSpeechRecognition),
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

  /* ---------- access control ---------- */
  const NAV = [
    ['home', 'Discover', 'compass'], ['coach', 'AI Coach', 'chat'], ['assessment', 'Leadership assessment', 'target'],
    ['roleplay', 'RolePlay Studio', 'users'], ['journey', 'My 90-day journey', 'route'], ['feedback', '360° feedback', 'globe'],
    ['console', 'Coach console', 'clipboard'], ['dashboard', 'Leadership dashboard', 'chart'], ['leads', 'Leads & proposals', 'briefcase'],
    ['access', 'Users & roles', 'shield']
  ];
  const CTA = {
    participant: { label: 'Talk to your coach', icon: 'sparkle', href: '#/coach' },
    coach: { label: 'Review escalations', icon: 'shield', href: '#/console' },
    hr: { label: 'Share dashboard', icon: 'share', run: () => shareLink() },
    sales: { label: 'New enquiry', icon: 'briefcase', href: '#/leads', run: () => { location.hash = '#/leads'; route(); } },
    admin: { label: 'Invite user', icon: 'users', href: '#/access', run: () => { location.hash = '#/access'; setTimeout(() => $('#invite') && $('#invite').click(), 50); } }
  };
  let ROLE = null;
  try { const r = localStorage.getItem('mi-role'); if (MI.ROLES[r]) ROLE = r; } catch (e) { /* ignore */ }
  const role = () => MI.ROLES[ROLE];
  const initials = n => n.split(' ').map(w => w[0]).join('').slice(0, 2);

  function signIn(r) {
    ROLE = r;
    try { localStorage.setItem('mi-role', r); } catch (e) { /* ignore */ }
    applyRole();
    location.hash = '#/' + MI.homeFor(r);
    route();
    toast(`Signed in as ${MI.ROLES[r].name} · ${MI.ROLES[r].label}`, 'check');
  }
  function signOut() {
    ROLE = null;
    try { localStorage.removeItem('mi-role'); } catch (e) { /* ignore */ }
    location.hash = '';
    route();
  }

  /* Rebuild everything in the shell that depends on the role. */
  function applyRole() {
    const R = role();
    if (!R) return;
    $('#nav').innerHTML = NAV.filter(([k]) => R.pages.includes(k))
      .sort((a, b) => (b[0] === R.home) - (a[0] === R.home))
      .map(([k, l, ic]) => `<a href="#/${k}" data-icon="${ic}"><span class="lbl">${l}</span></a>`).join('');
    hydrateIcons($('#nav'));
    $('#side-avatar').textContent = initials(R.name);
    $('#side-avatar').classList.toggle('navy', ROLE !== 'participant');
    $('#side-name').textContent = R.name;
    $('#side-org').textContent = R.org;
    $('#side-role').textContent = R.label;
    $('#level').hidden = ROLE !== 'participant';
    const c = CTA[ROLE], cta = $('#cta');
    cta.innerHTML = MI.icon(c.icon) + `<span class="hide-sm">${esc(c.label)}</span>`;
    cta.setAttribute('href', c.href || '#');
    cta.onclick = c.run ? e => { e.preventDefault(); c.run(); } : null;
    $('#bell-dot').hidden = false;
  }

  function renderSignIn() {
    const box = $('#signin');
    box.innerHTML = `
      <div class="signin-art">${MI.scene('team', { w: 900, h: 1100, palette: 'mint', align: 'bottom', label: 'A leadership team meeting' })}
        <div class="signin-copy"><span class="wordmark light">mastery<span class="wm-ai">a<span class="wm-i">ı</span></span></span>
          <h1>Leadership development that continues between sessions.</h1>
          <p>Coaching, practice and measurable behaviour change, powered by Mastery Inside methodology.</p></div>
      </div>
      <div class="signin-panel">
        <div class="signin-inner">
          <h2>Sign in</h2>
          <p class="muted">Choose a sample account. Each role sees only the pages it’s allowed to.</p>
          <div class="accounts">${Object.entries(MI.ROLES).map(([k, r]) => `
            <button class="account" data-role="${k}">
              <span class="avatar ${k === 'participant' ? '' : 'navy'}">${initials(r.name)}</span>
              <span class="acc-body"><b>${esc(r.name)}</b><span class="role-pill">${esc(r.label)}</span><small>${esc(r.desc)}</small></span>
              <span class="acc-go">${MI.icon('arrow')}</span>
            </button>`).join('')}</div>
          <p class="small muted">Sample workspace · Acme Industries</p>
        </div>
      </div>`;
    $$('.account', box).forEach(b => b.addEventListener('click', () => signIn(b.dataset.role)));
  }

  function viewForbidden(el, key) {
    const R = role();
    el.innerHTML = `
      <div class="forbidden">
        <span class="forbidden-ic">${MI.icon('shield')}</span>
        <h1>You don’t have access to ${esc(ROUTES[key].title)}</h1>
        <p>You’re signed in as <b>${esc(R.name)}</b> (${esc(R.label)}). Your role can open:</p>
        <div class="chips center-x">${R.pages.map(p => `<a class="chip" href="#/${p}">${MI.icon(ROUTES[p].icon)}${esc(ROUTES[p].title)}</a>`).join('')}</div>
        <div class="row gap center-x mt"><a class="btn primary" href="#/${R.home}">Go to ${esc(ROUTES[R.home].title)}</a><button class="btn" id="fb-switch">Switch account</button></div>
      </div>`;
    $('#fb-switch', el).addEventListener('click', signOut);
  }

  /* Admin: users, roles and the permission matrix. */
  function viewAccess(el) {
    const roles = Object.entries(MI.ROLES);
    el.innerHTML = `
      <div class="kpis">
        ${roles.map(([k, r]) => `<div class="kpi"><span class="k-ic">${MI.icon({ participant: 'users', coach: 'clipboard', hr: 'chart', sales: 'briefcase', admin: 'shield' }[k])}</span><span>${esc(r.label)}</span><b>${MI.USERS_DIRECTORY.filter(u => u.role === k).length}</b><small>${r.pages.length} page${r.pages.length > 1 ? 's' : ''}</small></div>`).join('')}
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Users</h3><button class="btn small primary" id="invite">${MI.icon('users')} Invite user</button></div>
        <div id="invite-form" hidden>
          <form class="invite-row" id="invite-f">
            <input id="inv-email" type="email" required placeholder="name@company.com" aria-label="Email">
            <select id="inv-role" aria-label="Role">${roles.map(([k, r]) => `<option value="${k}">${esc(r.label)}</option>`).join('')}</select>
            <button class="btn primary small">Send invite</button>
          </form>
        </div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Name</th><th>Role</th><th>Organisation</th><th>Last active</th></tr></thead>
          <tbody id="user-rows">${MI.USERS_DIRECTORY.map(userRow).join('')}</tbody>
        </table></div>
      </div>
      <div class="panel mt">
        <div class="panel-head"><h3>Permissions by role</h3><span class="muted small">Enforced on every page</span></div>
        <div class="table-wrap"><table class="table matrix">
          <thead><tr><th>Capability</th>${roles.map(([, r]) => `<th class="c">${esc(r.label)}</th>`).join('')}</tr></thead>
          <tbody>${MI.CAPABILITIES.map(c => `<tr><td>${esc(c.label)}</td>${roles.map(([k]) => `<td class="c">${c.roles.includes(k) ? `<span class="yes" aria-label="Allowed">${MI.icon('check')}</span>` : '<span class="no" aria-label="Not allowed">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>
        <div class="callout mt">Private coaching conversations stay between the participant and Mastery AI. Coaches see escalations and progress, HR sees aggregated organisation results, and admins manage access without reading conversation content.</div>
      </div>`;
    $('#invite', el).addEventListener('click', () => { const f = $('#invite-form', el); f.hidden = !f.hidden; if (!f.hidden) $('#inv-email', el).focus(); });
    $('#invite-f', el).addEventListener('submit', e => {
      e.preventDefault();
      const email = $('#inv-email', el).value.trim(), r = $('#inv-role', el).value;
      $('#user-rows', el).insertAdjacentHTML('afterbegin', userRow({ name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), email, role: r, org: MI.ROLES[r].org, last: 'Invite pending' }));
      e.target.reset(); $('#invite-form', el).hidden = true;
      toast(`Invite sent to ${email} as ${MI.ROLES[r].label}`, 'check');
    });
  }
  function userRow(u) {
    return `<tr><td><div class="person"><span class="avatar xs ${u.role === 'participant' ? '' : 'navy'}">${esc(initials(u.name))}</span><div><b>${esc(u.name)}</b><div class="small muted">${esc(u.email)}</div></div></div></td>
      <td><span class="role-pill">${esc(MI.ROLES[u.role].label)}</span></td><td>${esc(u.org)}</td><td class="muted">${esc(u.last)}</td></tr>`;
  }


  /* ---------- router ---------- */
  const ROUTES = {
    home: { title: 'Discover', crumb: 'Participant', icon: 'compass', render: viewHome },
    coach: { title: 'AI Coach', crumb: 'Participant', icon: 'chat', render: viewCoach, sub: 'Your 24×7 leadership coach, on web, WhatsApp and voice.' },
    assessment: { title: 'Leadership assessment', crumb: 'Participant', icon: 'target', render: viewAssessment },
    roleplay: { title: 'RolePlay Studio', crumb: 'Participant', icon: 'users', render: viewRoleplay, sub: 'Rehearse real leadership conversations with an AI persona and get scored on 8 behaviours.' },
    journey: { title: 'My 90-day journey', crumb: 'Participant', icon: 'route', render: viewJourney, sub: 'Milestones, weekly check-ins and reflections for your Leadership Accelerator.' },
    feedback: { title: '360° feedback', crumb: 'Participant', icon: 'globe', render: viewFeedback, sub: 'How you, your manager, your team and AI analysis see your leadership.' },
    console: { title: 'Coach console', crumb: 'Human coach', icon: 'clipboard', render: viewConsole, sub: 'Your caseload, escalations from Mastery AI and this month’s workload.' },
    dashboard: { title: 'Leadership dashboard', crumb: 'HR & leadership', icon: 'chart', render: viewDashboard, sub: 'Acme Industries · Leadership Accelerator, Cohort 2 · 184 leaders' },
    leads: { title: 'Leads & proposals', crumb: 'Sales', icon: 'briefcase', render: viewConsultant, sub: 'Qualify website enquiries, call back instantly and draft proposals.' },
    access: { title: 'Users & roles', crumb: 'Admin', icon: 'shield', render: viewAccess, sub: 'Who can see what in Mastery AI.' }
  };


  function route() {
    const signin = $('#signin');
    if (!ROLE) {
      document.body.classList.add('signed-out');
      signin.hidden = false; renderSignIn(); hydrateIcons(signin);
      document.title = 'Sign in · Mastery AI';
      return;
    }
    document.body.classList.remove('signed-out');
    signin.hidden = true;
    const R = role();
    const raw = location.hash.replace('#/', '');
    let [name, arg, arg2] = (raw || R.home).split('/');
    if (!ROUTES[name]) { name = R.home; arg = arg2 = undefined; }
    const allowed = MI.canAccess(ROLE, name);
    const r = ROUTES[name];
    $$('.nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#/' + name));
    document.title = `${r.title} · Mastery AI`;
    const main = $('#view');
    main.innerHTML = '';
    main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter');
    window.scrollTo(0, 0);
    if (Speech.canSpeak) speechSynthesis.cancel();
    const back = $('#back');
    const parent = allowed && name === 'roleplay' && arg ? (arg2 ? `#/roleplay/${arg}` : '#/roleplay') : null;
    back.hidden = !parent; back.dataset.to = parent || '';
    $('#launcher').hidden = ROLE !== 'participant' || name === 'coach';
    if (!allowed) { viewForbidden(main, name); hydrateIcons(main); closePopovers(); return; }
    let body = main;
    const ownHeader = name === 'home' || (name === 'roleplay' && arg) || name === 'assessment';
    if (!ownHeader) {
      main.innerHTML = `<header class="page-head"><h1>${esc(r.title)}</h1><p>${esc(r.sub)}</p></header><div class="page-body"></div>`;
      body = $('.page-body', main);
    }
    r.render(body, arg, arg2);
    hydrateIcons(main);
    document.body.classList.remove('nav-open');
    closePopovers();
  }



  /* ---------- shell helpers ---------- */
  function hydrateIcons(root = document) {
    $$('[data-icon]', root).forEach(el => {
      if (el.dataset.iconDone) return;
      el.insertAdjacentHTML('afterbegin', MI.icon(el.dataset.icon));
      el.dataset.iconDone = '1';
    });
  }

  function toast(text, icon = 'check') {
    const box = $('#toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = MI.icon(icon) + `<span>${esc(text)}</span>`;
    box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
  }

  function closePopovers() {
    const n = $('#notifications');
    if (n) { n.hidden = true; $('#bell').setAttribute('aria-expanded', 'false'); }
  }

  function renderNotifications() {
    const byRole = {
      participant: [
        ...S.escalations.slice(-1).map(e => ({ icon: 'shield', title: 'Anjali will reach out', text: 'Your coach has been notified and will contact you within 24 hours.', when: 'Just now', href: '#/coach' })),
        { icon: 'chat', title: 'Your coach checked in', text: MI.NUDGES[1].text, when: 'Today · 1:00 PM', href: '#/coach' },
        { icon: 'users', title: 'Recommended practice', text: 'Try “Delegating to a reluctant senior” before Thursday.', when: 'Today · 8:30 AM', href: '#/roleplay/delegation' },
        { icon: 'calendar', title: 'Weekly check-in due Friday', text: 'Five quick questions on your delegation goal.', when: 'Yesterday', href: '#/journey' }
      ],
      coach: [
        ...S.escalations.slice(-1).map(() => ({ icon: 'shield', title: 'New escalation: Priya Sharma', text: 'Mastery AI flagged a wellbeing concern for follow-up.', when: 'Just now', href: '#/console' })),
        { icon: 'shield', title: 'Farah Khan needs a session', text: 'Wellbeing flag raised in AI coaching.', when: 'Today · 9:10 AM', href: '#/console' },
        { icon: 'alert', title: 'Arjun Mehta is disengaged', text: 'No response to AI nudges for 19 days.', when: 'Yesterday', href: '#/console' }
      ],
      hr: [
        { icon: 'trend', title: 'Day-60 results are in', text: 'Leadership Capability Score rose to 72 (+11).', when: 'Today', href: '#/dashboard' },
        { icon: 'alert', title: '2 leaders need attention', text: 'See the Needs attention list.', when: 'Yesterday', href: '#/dashboard' }
      ],
      sales: [
        { icon: 'briefcase', title: 'New enquiry scored 84', text: 'Manufacturing · 1,000–5,000 employees.', when: '10:30 PM', href: '#/leads' },
        { icon: 'calendar', title: 'Consultation booked', text: 'Tuesday 11:00 AM with a new lead.', when: 'Yesterday', href: '#/leads' }
      ],
      admin: [
        { icon: 'users', title: '3 invites pending', text: 'Acme Industries cohort 3 participants.', when: 'Today', href: '#/access' },
        { icon: 'shield', title: 'Role changed', text: 'Rohan Kapoor was given the Sales role.', when: '2 days ago', href: '#/access' }
      ]
    };
    const items = byRole[ROLE] || [];
    $('#notifications').innerHTML = `<h4>Notifications <span class="pill gold">${items.length} new</span></h4>` +
      items.map(n => `<a class="notif" href="${n.href}"><span class="n-ic">${MI.icon(n.icon)}</span><div><b>${esc(n.title)}</b><span>${esc(n.text)}</span><small>${n.when}</small></div></a>`).join('');
  }

  /* Command palette (⌘K / Ctrl+K) */
  const Palette = {
    items() {
      const can = k => MI.canAccess(ROLE, k);
      const pages = Object.entries(ROUTES).filter(([k]) => can(k)).map(([k, r]) => ({ group: 'Pages', label: r.title, hint: r.crumb, icon: r.icon, run: () => { location.hash = '#/' + k; } }));
      const scen = !can('roleplay') ? [] : MI.SCENARIOS.map(s => ({ group: 'Practise a conversation', label: s.title, hint: s.tag, icon: 'users', run: () => { location.hash = '#/roleplay/' + s.id; } }));
      const actions = [
        { group: 'Actions', page: 'coach', label: 'Ask your coach about this week', icon: 'sparkle', run: () => { location.hash = '#/coach'; } },
        { group: 'Actions', page: 'assessment', label: 'Retake the leadership assessment', icon: 'target', run: () => { location.hash = '#/assessment/retake'; } },
        { group: 'Actions', page: 'journey', label: 'Log this week’s check-in', icon: 'calendar', run: () => { location.hash = '#/journey'; } },
        { group: 'Actions', page: 'access', label: 'Invite a user', icon: 'users', run: () => CTA.admin.run() },
        { group: 'Actions', label: 'Switch account', icon: 'refresh', run: signOut }
      ].filter(a => !a.page || can(a.page));
      return [...pages, ...actions, ...scen];
    },
    open() {
      this.sel = 0;
      $('#palette').hidden = false;
      const q = $('#palette-q'); q.value = ''; this.draw(''); q.focus();
    },
    close() { $('#palette').hidden = true; },
    draw(q) {
      const t = q.trim().toLowerCase();
      this.list = this.items().filter(i => !t || (i.label + ' ' + (i.hint || '') + ' ' + i.group).toLowerCase().includes(t));
      this.sel = Math.min(this.sel, Math.max(0, this.list.length - 1));
      let last = '', html = '';
      this.list.forEach((i, idx) => {
        if (i.group !== last) { html += `<li class="grp">${i.group}</li>`; last = i.group; }
        html += `<li class="it ${idx === this.sel ? 'sel' : ''}" data-idx="${idx}" role="option" aria-selected="${idx === this.sel}"><span class="p-ic">${MI.icon(i.icon)}</span>${esc(i.label)}${i.hint ? `<small>${esc(i.hint)}</small>` : ''}</li>`;
      });
      $('#palette-list').innerHTML = html || '<li class="empty">No matches. Try “coach”, “delegation” or “dashboard”.</li>';
      const cur = $('#palette-list .it.sel'); if (cur) cur.scrollIntoView({ block: 'nearest' });
    },
    run(idx) { const i = this.list[idx]; if (!i) return; this.close(); i.run(); }
  };


  /* ================= VIEWS ================= */

  /* Artwork per scenario */
  const SCN_PAL = { underperformer: 'peach', delegation: 'blue', peer: 'sand', ceo: 'lilac', feedback: 'mint' };
  const scnArt = (s, o = {}) => MI.scene(s.id, { palette: SCN_PAL[s.id], label: s.title, ...o });

  function artCard(s) {
    const best = Math.max(0, ...S.roleplayHistory.filter(h => h.scenario === s.id).map(h => h.overall));
    return `<a class="art-card" href="#/roleplay/${s.id}">
      <div class="thumb">${scnArt(s)}</div>
      <span class="eyebrow">${esc(s.tag)}</span>
      <h4>${esc(s.title)}</h4>
      <div class="meta"><span class="avatar xs">${esc(s.persona[0])}</span>${esc(s.persona)}${best ? `<span class="pill gold" style="margin-left:auto">Best ${best}</span>` : ''}</div>
    </a>`;
  }

  function viewHome(el) {
    const r = report();
    const focus = r.gaps[0];
    const tr = trend();
    const scn = MI.SCENARIOS.find(s => s.id === focus.scenario) || MI.SCENARIOS[0];
    const open = S.commitments.filter(c => !c.done);
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const slides = [
      { title: `This week: ${focus.name}`, tags: [['sparkle', 'Your focus'], ['clock', '5 min a day'], ['target', `Score ${focus.score}`]], text: focus.practice, cta: 'Plan it with your coach', href: '#/coach', art: MI.scene('growth', { w: 1000, h: 420, palette: 'blue', align: 'right', label: 'Growing as a leader' }) },
      { title: scn.title, tags: [['users', 'Role-play'], ['clock', '8–10 min'], ['bolt', scn.difficulty]], text: `Rehearse with ${scn.persona}, ${scn.personaRole.toLowerCase()}, before the real conversation.`, cta: 'Check it out', href: `#/roleplay/${scn.id}`, art: scnArt(scn, { w: 1000, h: 420, align: 'right' }) },
      { title: 'Your Day-60 progress check', tags: [['target', 'Assessment'], ['clock', '6 min'], ['globe', '360 pulse']], text: `You’re ${greet === 'Good morning' ? 'starting the day' : 'well'} on track: +${tr[tr.length - 1] - tr[0]} on ${focus.name.toLowerCase()} since Day 1.`, cta: 'See my progress', href: '#/journey', art: MI.scene('journey', { w: 1000, h: 420, palette: 'sky', align: 'right', label: 'Your 90-day journey' }) }
    ];
    const recent = [
      { title: 'Delegating to a reluctant senior', meta: 'RolePlay · scored 71', href: '#/roleplay/delegation', art: scnArt(MI.SCENARIOS[1], { w: 240, h: 170 }) },
      { title: 'Preparing for the conversation with Rahul', meta: 'AI Coach · 2h ago', href: '#/coach', art: MI.scene('coach', { w: 240, h: 170, palette: 'sky' }) },
      { title: 'Day-1 Leadership report', meta: `Assessment · score ${r.overall}`, href: '#/assessment', art: MI.scene('assessment', { w: 240, h: 170, palette: 'lilac' }) },
      { title: 'Week 6 delegation check-in', meta: 'Journey · due Friday', href: '#/journey', art: MI.scene('journey', { w: 240, h: 170, palette: 'sky' }) }
    ];
    el.innerHTML = `
      <div class="hero-wrap">
        <div class="hero" id="hero" aria-roledescription="carousel">
          ${slides.map((sl, i) => `<div class="slide ${i === 0 ? 'on' : ''}" aria-hidden="${i !== 0}">${sl.art}
            <div class="copy"><h2>${esc(sl.title)}</h2>
              <div class="tags">${sl.tags.map(([ic, t]) => `<span class="tag">${MI.icon(ic)}${esc(t)}</span>`).join('')}</div>
              <p>${esc(sl.text)}</p>
              <a class="btn white" href="${sl.href}" tabindex="${i === 0 ? 0 : -1}">${esc(sl.cta)}</a></div></div>`).join('')}
          <button class="nav-arrow prev" aria-label="Previous">${MI.icon('back')}</button>
          <button class="nav-arrow next" aria-label="Next">${MI.icon('arrow')}</button>
          <div class="dots">${slides.map((_, i) => `<button class="${i === 0 ? 'on' : ''}" aria-label="Slide ${i + 1}"></button>`).join('')}</div>
        </div>
      </div>

      <section class="section">
        <div class="section-head"><div><h2>${greet}, ${esc(MI.PERSONA.name.split(' ')[0])}</h2><p>Pick up where you left off.</p></div>
          <div class="scroller-nav"><button class="icon-btn round" id="rec-prev" aria-label="Scroll left">${MI.icon('back')}</button><button class="icon-btn round" id="rec-next" aria-label="Scroll right">${MI.icon('arrow')}</button></div></div>
        <div class="recent" id="recent">${recent.map(x => `<a class="recent-card" href="${x.href}"><div class="thumb">${x.art}</div><div><b>${esc(x.title)}</b><small>${esc(x.meta)}</small></div></a>`).join('')}</div>
      </section>

      <section class="section">
        <div class="section-head"><div><h2>Practice conversations</h2><p>Rehearse the moments that matter most</p></div><a class="view-all" href="#/roleplay">View all (${MI.SCENARIOS.length}) ${MI.icon('arrow')}</a></div>
        <div class="cards five">${MI.SCENARIOS.map(artCard).join('')}</div>
      </section>

      <section class="section">
        <div class="section-head"><div><h2>Your progress</h2><p>Day ${MI.PERSONA.programDay} of 90 · ${90 - MI.PERSONA.programDay} days to your transformation report</p></div><a class="view-all" href="#/journey">Open journey ${MI.icon('arrow')}</a></div>
        <div class="home-grid">
          <div class="panel">
            <div class="panel-head"><h3>Leadership Score</h3><a class="link-quiet" href="#/assessment">Report ${MI.icon('arrow')}</a></div>
            <div class="score-row">${MI.charts.ring(r.overall, 'Mastery Leadership Score', 128)}
              <div class="stack tight"><span class="pill ${r.band.tone}">${r.band.label}</span><span class="small"><span class="delta up">+9</span> since Day 1</span><span class="small muted">Strongest: ${esc(r.strengths[0].name)}</span></div></div>
          </div>
          <div class="panel">
            <div class="panel-head"><h3>${esc(focus.name)}</h3><span class="pill good">+${tr[tr.length - 1] - tr[0]} since Day 1</span></div>
            ${MI.charts.line(tr.map((_, i) => 'W' + (i + 1)), tr, { target: Math.min(100, tr[0] + 26), min: 30, max: 90, ticks: [30, 60, 90], h: 200, label: focus.name + ' weekly score' })}
          </div>
          <div class="panel">
            <div class="panel-head"><h3>Commitments</h3><span class="pill">${open.length} open</span></div>
            <ul class="checklist">${S.commitments.slice(-3).map(c => `<li><span class="row gap ${c.done ? 'done' : ''}" style="flex-wrap:nowrap"><span class="${c.done ? 'check-ic' : 'open-ic'}">${MI.icon(c.done ? 'check' : 'circle')}</span>${esc(c.text)}</span></li>`).join('')}</ul>
          </div>
        </div>
      </section>`;

    // recent row: arrow buttons instead of a scrollbar
    const rec = $('#recent', el), rp = $('#rec-prev', el), rn = $('#rec-next', el);
    const step = () => (rec.querySelector('.recent-card')?.offsetWidth || 300) + 18;
    const sync = () => {
      rp.disabled = rec.scrollLeft <= 2;
      rn.disabled = rec.scrollLeft + rec.clientWidth >= rec.scrollWidth - 2;
    };
    rp.addEventListener('click', () => rec.scrollBy({ left: -step(), behavior: 'smooth' }));
    rn.addEventListener('click', () => rec.scrollBy({ left: step(), behavior: 'smooth' }));
    rec.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    requestAnimationFrame(sync);

    // carousel
    const hero = $('#hero', el);
    const slidesEl = $$('.slide', hero), dots = $$('.dots button', hero);
    let cur = 0, timer = null;
    const go = i => {
      cur = (i + slidesEl.length) % slidesEl.length;
      slidesEl.forEach((s, k) => { s.classList.toggle('on', k === cur); s.setAttribute('aria-hidden', k !== cur); $('a', s).tabIndex = k === cur ? 0 : -1; });
      dots.forEach((d, k) => d.classList.toggle('on', k === cur));
    };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = () => { if (!reduce) { clearInterval(timer); timer = setInterval(() => { if (!document.body.contains(hero)) return clearInterval(timer); go(cur + 1); }, 6500); } };
    $('.prev', hero).addEventListener('click', () => { go(cur - 1); start(); });
    $('.next', hero).addEventListener('click', () => { go(cur + 1); start(); });
    dots.forEach((d, k) => d.addEventListener('click', () => { go(k); start(); }));
    hero.addEventListener('pointerenter', () => clearInterval(timer));
    hero.addEventListener('pointerleave', start);
    start();
  }

  /* Detail page in the style of a published activity: serif title, art, actions, tabs. */
  function detailPage(el, o) {
    el.innerHTML = `
      <article class="detail">
        <div class="detail-top">
          <div>
            <h1>${esc(o.title)}</h1>
            <div class="sub">${esc(o.sub)}</div>
            <div class="byline">${o.byline}</div>
          </div>
          <div class="detail-art">${o.art}</div>
        </div>
        <p class="detail-desc">${o.desc}</p>
        <div class="actions">${o.actions}</div>
        <div class="tabs" role="tablist">${o.tabs.map((t, i) => `<button role="tab" class="${i === 0 ? 'on' : ''}" data-tab="${i}">${esc(t.label)}</button>`).join('')}</div>
        <div class="detail-card" id="tab-body">${o.tabs[0].html}</div>
      </article>`;
    $$('.tabs button', el).forEach(b => b.addEventListener('click', () => {
      $$('.tabs button', el).forEach(x => x.classList.toggle('on', x === b));
      $('#tab-body', el).innerHTML = o.tabs[+b.dataset.tab].html;
      hydrateIcons(el);
    }));
  }

  function shareLink() {
    const url = location.href;
    const done = () => toast('Link copied', 'share');
    try { navigator.clipboard.writeText(url).then(done, () => toast('Copy the link from your address bar', 'share')); } catch (e) { toast('Copy the link from your address bar', 'share'); }
  }

  function viewScenarioDetail(el, scn) {
    const mine = S.roleplayHistory.filter(h => h.scenario === scn.id);
    const flow = [['Open with intent', 'Set a calm, respectful tone and say why you’re meeting.'], ['Understand their view', 'Ask open questions and listen before you advise.'], ['Uncover the root cause', `Find out what’s really going on for ${scn.persona}.`], ['Agree next steps', 'Co-create actions, an owner, a date and a check-in.']];
    detailPage(el, {
      title: scn.title,
      sub: `${scn.tag} · ${scn.difficulty} · 8–10 minutes`,
      byline: `<span class="avatar sm">${esc(scn.persona[0])}</span><span>with <b>${esc(scn.persona)}</b>, ${esc(scn.personaRole)}</span>`,
      art: scnArt(scn, { w: 600, h: 400 }),
      desc: `${esc(scn.brief)} <b>Your goal:</b> ${esc(scn.goal)}`,
      actions: ROLE === 'participant' ? `<a class="btn primary" href="#/roleplay/${scn.id}/live">${MI.icon('rocket')} Start role-play</a>
        <a class="btn" href="#/coach">${MI.icon('sparkle')} Prepare with coach</a>
        <button class="btn" id="save">${MI.icon('bookmark')} Add to my plan</button>
        <button class="btn" id="share">${MI.icon('share')} Share</button>`
        : `<button class="btn primary" id="assign">${MI.icon('users')} Assign to a participant</button>
        <a class="btn" href="#/roleplay/${scn.id}/live">${MI.icon('play')} Preview</a>
        <button class="btn" id="share">${MI.icon('share')} Share</button>`,
      tabs: [
        { label: 'About', html: `<p>You’ll talk with ${esc(scn.persona)}, who starts out ${scn.tension >= 6 ? 'defensive' : 'guarded'}. How they respond depends on how you lead the conversation. Speak or type, and end whenever you’re ready to get your score.</p>
          <h3>Conversation flow</h3><ol class="agenda-list">${flow.map(([t, d], i) => `<li><b>${i + 1}</b><span><span style="color:var(--ink)">${t}</span><br><span class="small muted">${d}</span></span></li>`).join('')}</ol>` },
        { label: 'How you’re scored', html: `<p>After the conversation you get a Roleplay Score out of 100, with strengths and specific things to improve.</p>
          <ol class="agenda-list">${MI.ROLEPLAY_PARAMS.map(([, l], i) => `<li><b>${i + 1}</b><span>${l}</span></li>`).join('')}</ol>` },
        { label: ROLE === 'participant' ? 'My sessions' : 'Priya’s sessions', html: mine.length ? `<ol class="agenda-list">${mine.map((h, i) => `<li><b>${i + 1}</b><span>Attempt ${i + 1}<br><span class="small muted">${/T/.test(h.at) ? new Date(h.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : esc(h.at)}</span></span><span class="pill ${h.overall >= 70 ? 'good' : 'warning'}">${h.overall}</span></li>`).join('')}</ol>` : `<p>No sessions yet. Start your first role-play to see your scores here.</p>` }
      ]
    });
    if ($('#assign', el)) $('#assign', el).addEventListener('click', e => { e.currentTarget.disabled = true; toast(`Assigned to Priya Sharma · due this week`, 'users'); });
    if ($('#save', el)) $('#save', el).addEventListener('click', e => { S.commitments.push({ text: `Practise “${scn.title}” this week`, done: false, at: 'Week ' + Math.ceil(MI.PERSONA.programDay / 7) }); save(); e.currentTarget.disabled = true; toast('Added to your plan', 'bookmark'); });
    $('#share', el).addEventListener('click', shareLink);
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
              <span class="pill ${status(j) === 'done' ? 'good' : status(j) === 'ongoing' ? 'info' : 'neutral'}">${status(j) === 'done' ? 'Done' : status(j) === 'ongoing' ? 'In progress' : 'Upcoming'}</span></li>`).join('')}
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
      toast(`Check-in saved · ${focus.name} evidence score ${score}`, 'trend');
      $('#checkin-result', el).innerHTML = `<div class="callout good">Check-in recorded. ${esc(focus.name)} evidence score: <b>${score}</b> (+${score - last}). ${learning ? 'Great reflection — naming what you’d change is what turns practice into habit.' : 'Next week, try to name one specific thing you will do differently.'}</div>`;
    });
    $('#reflect', el).addEventListener('submit', e => {
      e.preventDefault();
      const d = e.target.d.value.trim();
      const solution = /solution|jumped|told|interrupt|decided/i.test(d);
      toast('Reflection saved', 'check');
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
            <button class="btn ghost" id="prev" ${i === 0 ? 'disabled' : ''}>${MI.icon('back')} Back</button>
            <span class="muted small">Answer honestly — there are no right answers.</span>
          </div>
        </div>`;
      $$('.opt', el).forEach(b => b.addEventListener('click', () => {
        answers[i] = +b.dataset.v;
        if (i < MI.ASSESSMENT.length - 1) { i++; draw(); } else finish();
      }));
      $('#prev', el).addEventListener('click', () => { i--; draw(); });
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
      const parts = [['Self-perception', 'Rate 12 statements about how you lead today.'], ['Real-world situations', 'Choose how you’d respond in 12 leadership moments.'], ['Perception gaps', 'We compare how you see yourself with how you act.'], ['Your development plan', 'Top 3 gaps, interventions and 30/60/90-day targets.']];
      const day1 = report();
      detailPage(el, {
        title: 'Mastery Leadership Score',
        sub: '12 leadership dimensions · 24 questions · about 6 minutes',
        byline: `<span class="avatar sm navy">M</span><span>by <b>Mastery Inside</b></span>`,
        art: MI.scene('assessment', { w: 600, h: 400, palette: 'lilac', label: 'Leadership assessment' }),
        desc: 'Measure your leadership capability across communication, decision making, delegation, accountability, emotional intelligence and more. Retake it at Day 30, 60 and 90 to see how your behaviour is changing.',
        actions: `<button class="btn primary" id="start">${MI.icon('rocket')} Start assessment</button>
          <button class="btn" id="sample">${MI.icon('doc')} View my Day-1 report</button>
          <a class="btn" href="#/coach">${MI.icon('sparkle')} Discuss with coach</a>`,
        tabs: [
          { label: 'About', html: `<p>Answer honestly. There are no right answers, and your individual responses are private to you and your coach.</p><h3>What’s included</h3><ol class="agenda-list">${parts.map(([t, d], i) => `<li><b>${i + 1}</b><span><span style="color:var(--ink)">${t}</span><br><span class="small muted">${d}</span></span></li>`).join('')}</ol>` },
          { label: 'Dimensions', html: `<ol class="agenda-list">${MI.DIMENSIONS.map((d, i) => `<li><b>${i + 1}</b><span><span style="color:var(--ink)">${d.name}</span><br><span class="small muted">${esc(d.desc)}</span></span></li>`).join('')}</ol>` },
          { label: 'My results', html: `<ol class="agenda-list"><li><b>1</b><span>Day 1 · Leadership Score</span><span class="pill ${day1.band.tone}">${day1.overall} · ${day1.band.label}</span></li></ol>` }
        ]
      });
      $('#start', el).addEventListener('click', draw);
      $('#sample', el).addEventListener('click', () => { renderReport(el, report(), null); hydrateIcons(el); });
    } else draw();
  }

  function renderReport(el, rep, answers) {
    const dims = MI.DIMENSIONS;
    const pg = answers ? MI.assess.perceptionGaps(answers) : ['Delegation'];
    el.innerHTML = `
      <div class="grid-2">
        <div class="panel center">
          <p class="eyebrow">${answers ? 'Latest result' : 'Day-1 result'}</p>
          <h3>Mastery Leadership Score™</h3>
          ${MI.charts.ring(rep.overall, 'Mastery Leadership Score', 170)}
          <div class="pill ${rep.band.tone}">${rep.band.label}</div>
          <div class="grid-2 tight mt">
            <div><h4>Strengths</h4><ul class="plain">${rep.strengths.map(s => `<li class="row between"><span>${s.name}</span><span class="pill good">${s.score}</span></li>`).join('')}</ul></div>
            <div><h4>Capability gaps</h4><ul class="plain">${rep.gaps.map(s => `<li class="row between"><span>${s.name}</span><span class="pill warning">${s.score}</span></li>`).join('')}</ul></div>
          </div>
          ${pg.length ? `<div class="callout warn mt"><b>Perception gap:</b> ${pg.map(esc).join(', ')} — you rate yourself highly, but your situational choices suggest otherwise. This is a key coaching focus.</div>` : ''}
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
      <div class="panel-head section-title"><h3>Your 90-day development plan</h3><span class="muted small">Current state → Gap → Intervention → Progress</span></div>
      <div class="cards three">
        ${rep.plan.map((p, i) => `<div class="card">
          <div class="row between"><span class="eyebrow">Gap ${i + 1}</span><span class="pill warning">${p.current} → ${p.target90}</span></div>
          <h4>${esc(p.name)}</h4>
          <div class="milestones"><span>Now <b>${p.current}</b></span><span>D30 <b>${p.target30}</b></span><span>D60 <b>${p.target60}</b></span><span>D90 <b>${p.target90}</b></span></div>
          <p><b>Intervention:</b> ${esc(p.intervention)}</p>
          <p><b>Weekly practice:</b> ${esc(p.practice)}</p>
          <p><b>Human coach:</b> ${esc(p.humanCoach)}</p>
          ${p.scenario ? `<a class="btn small" href="#/roleplay/${p.scenario.id}">${MI.icon('play')} Rehearse: ${esc(p.scenario.title)}</a>` : ''}
        </div>`).join('')}
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
            <span class="pill good"><span class="dot good"></span>Online</span>
          </div>
          <div class="chat ch-${S.channel}" id="chat">
            <div class="chat-head"><div class="avatar">M</div><div><b>Mastery AI Coach</b><div class="small">${S.channel === 'whatsapp' ? 'online' : 'Trained on Mastery Inside methodology'}</div></div></div>
            <div class="msgs" id="msgs" aria-live="polite"></div>
            <div class="voice-orb" id="orb" hidden><button id="orb-btn" aria-label="Hold to talk"><span></span></button><div id="orb-text" class="muted small">Tap to speak</div></div>
            <form class="composer" id="composer">
              <button type="button" class="icon-btn" id="mic" title="Speak" aria-label="Speak" ${Speech.canListen ? '' : 'disabled'}>${MI.icon('mic')}</button>
              <input id="msg" autocomplete="off" placeholder="Ask your coach anything…" aria-label="Message">
              <button class="btn primary" aria-label="Send">${MI.icon('send')}<span class="hide-sm">Send</span></button>
            </form>
          </div>
          <div class="chips" id="chips">
            ${['I have a difficult conversation with my CEO tomorrow. How should I approach it?', 'I committed to improving delegation. What should I do this week?', 'My team member has been missing targets for three months.', 'Two of my leads keep clashing in meetings.'].map(c => `<button class="chip">${MI.icon('sparkle')}${esc(c)}</button>`).join('')}
          </div>
        </div>
        <aside class="stack">
          <div class="panel">
            <h4>Your context</h4>
            <div class="score-row">${MI.charts.ring(r.overall, 'Leadership Score', 84)}<div class="stack tight small"><span class="pill ${r.band.tone}">${r.band.label}</span><span>Focus: <b>${esc(r.gaps[0].name)}</b> (${r.gaps[0].score})</span><span class="muted">Day ${MI.PERSONA.programDay} of 90</span></div></div>
            <div class="person mt small"><span class="avatar xs navy">AM</span><span>Human coach: <b>${esc(MI.PERSONA.coach)}</b></span></div>
          </div>
          <div class="panel">
            <h4>How a coaching session works</h4>
            <ol class="side-list">${['Clarify the situation', 'Probe the root cause', 'Apply the Mastery framework', 'Commit to an action', 'Follow up & measure'].map((x, i) => `<li><span class="n">${i + 1}</span>${x}</li>`).join('')}</ol>
          </div>
          <div class="panel">
            <h4>Open commitments</h4>
            <ul class="plain small" id="commit-list"></ul>
          </div>
          <button class="btn ghost small" id="clear-chat">Start a new conversation</button>
        </aside>
      </div>`;

    const msgs = $('#msgs', el), input = $('#msg', el);
    const drawCommitments = () => {
      $('#commit-list', el).innerHTML = S.commitments.filter(c => !c.done).map(c => `<li><span class="open-ic">${MI.icon('circle')}</span><span>${esc(c.text)}</span></li>`).join('') || '<li class="muted">None yet</li>';
    };
    const bubble = (m) => {
      const d = document.createElement('div');
      d.className = 'msg ' + (m.role === 'user' ? 'out' : 'in') + (m.flag ? ' flag' : '');
      d.innerHTML = md(m.text) + (m.suggest ? `<a class="btn small mt" href="#/roleplay/${m.suggest}">${MI.icon('play')} Practise it in RolePlay</a>` : '') + (S.channel === 'whatsapp' ? `<span class="wa-meta">${m.role === 'user' ? '✓✓' : ''}</span>` : '');
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
      if (offline.commitment) { S.commitments.push({ text: offline.commitment, done: false, at: 'Week ' + Math.ceil(MI.PERSONA.programDay / 7) }); drawCommitments(); toast('Commitment added to your plan', 'check'); }
      if (offline.escalate) toast('Your coach Anjali has been notified', 'shield');
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
    if (S.channel === 'voice' && !Speech.canListen) $('#orb-text', el).textContent = EMBEDDED ? 'Voice input is off in this shared view (run locally to speak). Replies are still read aloud.' : 'Voice input needs Chrome or Edge — replies are still spoken aloud.';
  }

  /* ---------- RolePlay ---------- */
  function viewRoleplay(el, id, mode) {
    const scn = MI.SCENARIOS.find(s => s.id === id);
    if (!scn) {
      const A = MI.roleplay.analytics(S.roleplayHistory);
      const whose = ROLE === 'participant' ? 'Your' : 'Priya’s';
      const tone = v => v >= 70 ? 'good' : v >= 55 ? 'warning' : 'critical';
      const when = x => /T/.test(x.at) ? new Date(x.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : x.at;
      el.innerHTML = `
        <section>
          <div class="section-head"><div><h2>Scenarios</h2><p>Pick a conversation to rehearse</p></div></div>
          <div class="cards five">${MI.SCENARIOS.map(artCard).join('')}</div>
        </section>

        <section class="section">
          <div class="section-head"><div><h2>${whose} progress</h2><p>Analytics across every completed role-play</p></div><span class="pill gold">${A.sessions} session${A.sessions === 1 ? '' : 's'}</span></div>
          ${!A.sessions ? `<div class="panel center"><p class="muted">No sessions yet. Complete a role-play to see your analytics here.</p></div>` : `
          <div class="kpis">
            <div class="kpi hero-kpi"><span class="k-ic">${MI.icon('trend')}</span><span>Average score</span><b>${A.average}</b><small>across ${A.sessions} sessions</small></div>
            <div class="kpi"><span class="k-ic">${MI.icon('star')}</span><span>Best score</span><b>${A.best.score}</b><small>${esc(A.best.scenario.title)}</small></div>
            <div class="kpi"><span class="k-ic">${MI.icon('bolt')}</span><span>Improvement</span><b class="${A.improvement > 0 ? 'up' : ''}">${A.improvement == null ? '—' : (A.improvement > 0 ? '+' : '') + A.improvement}</b><small>first → latest session</small></div>
            <div class="kpi"><span class="k-ic">${MI.icon('check')}</span><span>Agreements</span><b>${A.agreements}<span class="kpi-of">/${A.sessions}</span></b><small>${Math.round(A.agreements / A.sessions * 100)}% of conversations</small></div>
            <div class="kpi"><span class="k-ic">${MI.icon('users')}</span><span>Scenarios tried</span><b>${A.byScenario.filter(x => x.sessions).length}<span class="kpi-of">/${MI.SCENARIOS.length}</span></b><small>${MI.SCENARIOS.length - A.byScenario.filter(x => x.sessions).length} still to try</small></div>
          </div>
          <div class="grid-2">
            <div class="panel">
              <div class="panel-head"><h3>Score by session</h3><span class="legend m0"><span><i class="sw s1"></i>Overall</span><span><i class="sw target"></i>Goal 75</span></span></div>
              ${A.sessions > 1 ? MI.charts.line(S.roleplayHistory.map((x, i) => `#${i + 1}`), S.roleplayHistory.map(x => x.overall), { min: 30, max: 100, ticks: [40, 70, 100], target: 75, h: 300, label: 'Role-play overall score by session' }) : '<p class="muted">Complete one more session to see a trend.</p>'}
            </div>
            <div class="panel">
              <div class="panel-head"><h3>Behaviour breakdown</h3><span class="muted small">Average across sessions</span></div>
              ${A.behaviours.some(b => b.avg != null) ? MI.charts.hbars(A.behaviours.filter(b => b.avg != null).map(b => ({ label: b.label, value: b.avg, tone: tone(b.avg) }))) : '<p class="muted">Behaviour scores appear after your next session.</p>'}
            </div>
          </div>
          <div class="grid-2 wide-left">
            <div class="panel">
              <div class="panel-head"><h3>By scenario</h3></div>
              <div class="table-wrap"><table class="table">
                <thead><tr><th>Scenario</th><th class="num">Sessions</th><th class="num">Best</th><th class="num">Latest</th><th class="num">Change</th></tr></thead>
                <tbody>${A.byScenario.map(x => `<tr><td><a class="link-quiet" style="color:var(--ink)" href="#/roleplay/${x.scenario.id}">${esc(x.scenario.title)}</a></td><td class="num">${x.sessions}</td><td class="num">${x.best ?? '—'}</td><td class="num">${x.last ?? '—'}</td>
                  <td class="num">${x.change == null ? '<span class="muted">—</span>' : `<span class="delta ${x.change > 0 ? 'up' : ''}">${x.change > 0 ? '+' : ''}${x.change}</span>`}</td></tr>`).join('')}</tbody>
              </table></div>
            </div>
            <div class="panel">
              <div class="panel-head"><h3>Coaching insight</h3></div>
              <ul class="insights">
                ${A.strongest ? `<li><span class="ins-ic good">${MI.icon('star')}</span><div><b>Strongest: ${esc(A.strongest.label)} (${A.strongest.avg})</b><span>Keep using it; it’s what makes the other person open up.</span></div></li>` : ''}
                ${A.focus ? `<li><span class="ins-ic warn">${MI.icon('target')}</span><div><b>Focus next: ${esc(A.focus.label)} (${A.focus.avg})</b><span>${esc(MI.roleplay.TIPS[A.focus.key])}</span></div></li>` : ''}
                ${A.next ? `<li><span class="ins-ic">${MI.icon('play')}</span><div><b>Try next: ${esc(A.next.title)}</b><span>${A.byScenario.find(x => x.scenario === A.next).sessions ? 'Your lowest best score so far.' : 'You haven’t practised this one yet.'}</span></div></li>` : ''}
              </ul>
              ${A.next && ROLE === 'participant' ? `<a class="btn primary small mt" href="#/roleplay/${A.next.id}">${MI.icon('rocket')} Start “${esc(A.next.title)}”</a>` : ''}
              <h4 class="mt">Recent sessions</h4>
              <ul class="activity">${S.roleplayHistory.slice(-3).reverse().map(x => `<li><span class="a-ic">${MI.icon('users')}</span><div style="flex:1"><div class="small">${esc((MI.SCENARIOS.find(s => s.id === x.scenario) || {}).title || '')}</div><div class="muted" style="font-size:.76rem">${esc(when(x))}${x.resolved ? ' · agreement reached' : ''}</div></div><span class="pill ${tone(x.overall)}">${x.overall}</span></li>`).join('')}</ul>
            </div>
          </div>`}
        </section>`;
      return;
    }
    if (mode !== 'live') return viewScenarioDetail(el, scn);

    const state = { tension: scn.tension, rootRevealed: false, rootShared: false, agreed: 0, i: 0 };
    const turns = [{ role: 'persona', text: scn.opening }];
    let voiceOn = false, asked = false, finished = false;

    el.innerHTML = `
      <div class="coach-layout">
        <div class="panel chat-panel">
          <div class="row between wrap">
            <a class="btn ghost small" href="#/roleplay/${scn.id}">${MI.icon('back')} About this scenario</a>
            <div class="row gap">
              <label class="toggle"><input type="checkbox" id="voice"> ${MI.icon('speaker')} Read replies aloud</label>

            </div>
          </div>
          <div class="rp-brief">
            <div class="avatar big">${esc(scn.persona[0])}</div>
            <div><b>${esc(scn.persona)}</b> · ${esc(scn.personaRole)}<div class="muted small">${esc(scn.brief)}</div><div class="small"><b>Your goal:</b> ${esc(scn.goal)}</div></div>
          </div>
          <div class="mood"><span>Persona tension</span><div class="mood-bar"><div id="mood" style="width:${state.tension * 10}%"></div></div><span id="mood-l">${state.tension >= 7 ? 'Defensive' : state.tension >= 4 ? 'Guarded' : 'Open'}</span></div>
          <div class="chat ch-web rp"><div class="msgs" id="msgs" aria-live="polite"></div>
            <form class="composer" id="composer">
              <button type="button" class="icon-btn" id="mic" title="Speak" aria-label="Speak" ${Speech.canListen ? '' : 'disabled'}>${MI.icon('mic')}</button>
              <input id="msg" autocomplete="off" placeholder="You are the manager. What do you say?" aria-label="Your reply">
              <button class="btn primary" aria-label="Say">${MI.icon('send')}<span class="hide-sm">Say</span></button>
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
      if (ROLE === 'participant') { S.roleplayHistory.push({ scenario: scn.id, overall: ev.overall, scores: ev.scores, resolved: ev.resolved, at: new Date().toISOString() }); save(); }
      const prevBest = S.roleplayHistory.filter(h => h.scenario === scn.id).slice(0, ROLE === 'participant' ? -1 : undefined).map(h => h.overall);
      $('#rp-side', el).innerHTML = `
        <div class="panel center">
          <p class="eyebrow">Roleplay Score</p>
          ${MI.charts.ring(ev.overall, 'Roleplay Score', 140)}
          <div class="small">${ev.resolved ? 'Reached agreement' : 'No agreement reached'} · ${ev.turns} turns${prevBest.length ? ` · previous best ${Math.max(...prevBest)}` : ''}</div>
        </div>
        <div class="panel">${MI.charts.hbars(MI.ROLEPLAY_PARAMS.map(([k, l]) => ({ label: l, value: ev.scores[k], tone: ev.scores[k] >= 70 ? 'good' : ev.scores[k] >= 50 ? 'warning' : 'critical' })))}</div>
        <div class="panel">
          <h4>Strengths</h4><ul class="plain small">${(ev.strengths.length ? ev.strengths : ['You showed up and practised — that is the habit that matters']).map(s => `<li class="row gap" style="flex-wrap:nowrap;align-items:flex-start"><span class="check-ic">${MI.icon('check')}</span><span>${esc(s)}</span></li>`).join('')}</ul>
          <h4>Improve</h4><ul class="plain small">${ev.improve.map(s => `<li class="row gap" style="flex-wrap:nowrap;align-items:flex-start"><span style="color:var(--accent)">${MI.icon('arrow')}</span><span>${esc(s)}</span></li>`).join('') || '<li>Excellent — try a harder scenario.</li>'}</ul>
          <p class="strong mt">“Try the conversation again.”</p>
          <div class="row gap"><a class="btn primary" href="#/roleplay/${scn.id}/live" id="retry">${MI.icon('refresh')} Retry</a><a class="btn" href="#/roleplay">Other scenarios</a></div>
        </div>`;
      $('#retry', el).addEventListener('click', e => { e.preventDefault(); viewRoleplay(el, scn.id, 'live'); hydrateIcons(el); });
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
          <a class="btn small" href="#/roleplay/${MI.dimByKey[top.dim].scenario}">${MI.icon('play')} Rehearse now</a>
        </div>
      </div>
      <div class="panel">
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Capability</th><th class="num">Self</th><th class="num">Manager</th><th class="num">Team</th><th class="num">AI</th><th class="num">Gap (self − others)</th></tr></thead>
          <tbody>${withGap.map(x => `<tr><td>${MI.dimByKey[x.dim].name}</td><td class="num">${x.self}</td><td class="num">${x.manager}</td><td class="num">${x.team}</td><td class="num">${x.ai}</td>
            <td class="num">${x.gap >= 15 ? `<span class="pill serious">+${x.gap} gap</span>` : x.gap <= -5 ? `<span class="pill info">${x.gap} hidden strength</span>` : x.gap}</td></tr>`).join('')}</tbody>
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
        <div class="kpi"><span class="k-ic">${MI.icon('users')}</span><span>Participants</span><b>48</b><small>in your caseload</small></div>
        <div class="kpi"><span class="k-ic">${MI.icon('sparkle')}</span><span>AI-handled interactions</span><b>1,126</b><small>this month · 94%</small></div>
        <div class="kpi"><span class="k-ic">${MI.icon('shield')}</span><span>Need human coach</span><b>${need.length}</b><small>escalated by AI</small></div>
        <div class="kpi"><span class="k-ic">${MI.icon('clock')}</span><span>Coach hours saved</span><b>61h</b><small>this month</small></div>
      </div>
      <div class="grid-2">
        <div class="panel">
          <h3>This month’s workload</h3>
          <div class="split">
            <div><h4>Handled by Mastery AI</h4><ul class="plain small">${[['Daily check-ins & nudges', 612], ['Coaching conversations', 284], ['Role-play sessions', 131], ['Reflections & exercises', 99]].map(([k, v]) => `<li class="row between"><span>${k}</span><b>${v}</b></li>`).join('')}</ul></div>
            <div><h4>Your sessions</h4><ul class="plain small">${[['1:1 coaching sessions', 22], ['Escalations resolved', 7], ['360 debriefs', 5], ['Group clinics', 2]].map(([k, v]) => `<li class="row between"><span>${k}</span><b>${v}</b></li>`).join('')}</ul></div>
          </div>
        </div>
        <div class="panel">
          <h3>Needs you</h3>
          <ul class="queue">${need.map(c => `<li><div><b>${esc(c.name)}</b> <span class="muted small">· ${c.dept}</span><div class="small">${ROLE === 'coach' ? esc(c.flag) : 'Escalation · details visible to the coach only'}</div></div>${ROLE === 'coach' ? `<button class="btn small" data-take="${esc(c.name)}">Take session</button>` : '<span class="pill">View only</span>'}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="panel">
        <h3>Caseload</h3>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Participant</th><th>Dept</th><th class="num">Score</th><th class="num">Δ since D1</th><th class="num">Engagement</th><th>Last AI touch</th><th>Status</th></tr></thead>
          <tbody>${list.map(c => `<tr><td>${esc(c.name)}</td><td>${c.dept}</td><td class="num">${c.score}</td><td class="num"><span class="delta ${c.delta > 0 ? 'up' : ''}">${c.delta > 0 ? '+' : ''}${c.delta}</span></td>
            <td class="num">${c.engagement}%</td><td>${c.lastAI}</td><td><span class="pill ${c.status === 'On track' ? 'good' : c.status === 'Watch' ? 'warning' : 'serious'}">${c.status}</span></td></tr>`).join('')}</tbody>
        </table></div>
      </div>`;
    $$('[data-take]', el).forEach(b => b.addEventListener('click', () => { b.textContent = 'Booked for tomorrow'; b.disabled = true; toast(`Session booked with ${b.dataset.take}`, 'calendar'); }));
  }

  /* ---------- CHRO dashboard ---------- */
  function viewDashboard(el) {
    const O = MI.ORG;
    const gaps = MI.DIMENSIONS.map((d, i) => ({ d, v: Math.round(MI.avg(Object.values(O.heat).map(r => r[i]))) })).sort((a, b) => a.v - b.v);
    el.innerHTML = `
      <div class="row between wrap" style="margin-bottom:18px"><span class="muted small">Showing results as of</span>
        <div class="seg" id="range">${['Baseline', 'Day 30', 'Day 60'].map((x, i) => `<button class="${i === 2 ? 'on' : ''}">${x}</button>`).join('')}</div></div>
      <div class="kpis">
        <div class="kpi hero-kpi"><span class="k-ic">${MI.icon('trend')}</span><span>Leadership Capability Score</span><b>${O.score}</b><small><span class="delta up">+${O.score - O.baseline}</span> vs baseline ${O.baseline}</small></div>
        <div class="kpi"><span class="k-ic">${MI.icon('bolt')}</span><span>Weekly active</span><b>${O.engagement.weeklyActive}%</b><small>of participants</small></div>
        <div class="kpi"><span class="k-ic">${MI.icon('chat')}</span><span>AI coaching sessions</span><b>${O.engagement.aiSessions.toLocaleString('en-IN')}</b><small>last 60 days</small></div>
        <div class="kpi"><span class="k-ic">${MI.icon('users')}</span><span>Role-plays completed</span><b>${O.engagement.roleplays}</b><small>avg score +14</small></div>
        <div class="kpi"><span class="k-ic">${MI.icon('star')}</span><span>Participant NPS</span><b>${O.engagement.nps}</b><small>check-in rate ${O.engagement.checkinRate}%</small></div>
      </div>
      <div class="grid-2">
        <div class="panel"><h3>By department</h3><div class="legend"><span><i class="sw s1"></i>Current</span><span><i class="sw base"></i>Baseline</span></div>
          ${MI.charts.hbars(O.departments.map(d => ({ label: `${d.name} (${d.n})`, value: d.score, base: d.baseline, tone: 's1' })), { delta: true })}</div>
        <div class="panel"><h3>Behaviour change since baseline</h3><div class="legend"><span><i class="sw s1"></i>Day 60</span><span><i class="sw base"></i>Baseline</span></div>
          ${MI.charts.hbars(O.improvements.map(x => ({ label: MI.dimByKey[x.dim].name, value: x.after, base: x.before, tone: 's1' })), { delta: true })}</div>
      </div>
      <div class="grid-2">
        <div class="panel"><h3>Capability gaps (organisation)</h3>
          <ul class="gaps">${gaps.slice(0, 4).map((g, i) => `<li><span class="pill ${i < 2 ? 'critical' : 'serious'}">${i < 2 ? 'Critical' : 'Watch'}</span> ${g.d.name} <b>${g.v}</b></li>`).join('')}
            ${gaps.slice(-1).map(g => `<li><span class="pill good">Strength</span> ${g.d.name} <b>${g.v}</b></li>`).join('')}</ul></div>
        <div class="panel"><h3>Needs attention</h3>
          <ul class="queue">${O.risks.map(r => `<li><div><span class="dot ${r.level}"></span><b>${r.name}</b> <span class="muted small">· ${r.dept}</span><div class="small">${r.signal}</div></div><span class="pill ${r.level}">${r.level === 'critical' ? 'Act now' : r.level === 'serious' ? 'Coach' : 'Watch'}</span></li>`).join('')}</ul></div>
      </div>
      <div class="panel"><h3>Department × capability heatmap</h3>
        ${MI.charts.heatmap(Object.entries(O.heat).map(([k, v]) => ({ label: k, values: v })), MI.DIMENSIONS.map(d => d.short))}</div>
      <div class="panel"><h3>Program impact</h3>
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
          <div class="site-bar"><span class="dot-r"></span><span class="dot-y"></span><span class="dot-g"></span><span class="url">Website assistant · live preview</span></div>
          <div class="site-hero">${MI.scene('team', { w: 900, h: 160, palette: 'blue', align: 'right' })}<div><b>Mastery Inside</b><span>Leadership that lasts.</span></div></div>
          <div class="chat ch-web"><div class="chat-head"><div class="avatar">M</div><div><b>Mastery AI Consultant</b><div class="small">Typically replies instantly</div></div></div>
            <div class="msgs" id="msgs"></div>
            <div class="chips" id="lchips"></div>
            <form class="composer" id="composer"><input id="msg" autocomplete="off" placeholder="Type your answer…" aria-label="Answer"><button class="btn primary">Send</button></form>
          </div>
        </div>
        <aside class="stack" id="crm">
          <div class="panel"><h4>Lead details</h4><div id="lead-card" class="small muted">Qualification fields fill in as the visitor answers.</div></div>
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
      $('#lchips', el).innerHTML = `<button class="chip" id="book">${MI.icon('calendar')} Book consultation</button><button class="chip" id="call">${MI.icon('phone')} Request a call-back</button>`;
      S.leads.push({ ...answers, score, tier, at: new Date().toISOString() }); save();
      $('#crm', el).insertAdjacentHTML('afterbegin', `<div class="panel center"><p class="eyebrow">AI lead score</p>${MI.charts.ring(score, 'Lead score', 120)}<div class="pill ${tier === 'Hot' ? 'critical' : tier === 'Warm' ? 'warning' : 'neutral'}">${tier}</div>
        <button class="btn primary mt" id="gen">Generate proposal</button></div>`);
      $('#book', el).addEventListener('click', () => { add('user', 'Book consultation'); toast('Consultation booked · Tue 11:00 AM', 'calendar'); add('assistant', 'Booked: **Tuesday, 11:00 AM** with Rohan Kapoor (Partner). A calendar invite and a pre-read on the Mastery Leadership Score are on their way.'); stage(4); });
      $('#call', el).addEventListener('click', () => {
        add('assistant', `**Call-back completed · 8 seconds after enquiry**\n\n_AI:_ “Hi, this is the Mastery Inside AI assistant. I understand you’re exploring leadership development for ${answers.company || 'your organisation'}. May I ask what challenge you’re trying to solve?”\n_Visitor:_ “${answers.challenge}.”\n_AI:_ “That’s one of the most common gaps we see at the ${(answers.level || 'manager').toLowerCase()} level. How many leaders would be involved, and is there a timeline you’re working to?”\n\n→ CRM updated · lead score ${score} · routed to sales · meeting proposed.`);
        stage(4);
      });
      $('#gen', el).addEventListener('click', () => { proposal(answers, rec, score); toast('Proposal drafted', 'doc'); });
    };
    $('#composer', el).addEventListener('submit', e => { e.preventDefault(); answer(input.value); });
    card(); stage(0);
    add('assistant', 'Hi, I’m the Mastery Inside AI consultant.');
    setTimeout(ask, 400);

    function proposal(a, rec, score) {
      const n = MI.leads.participantsNum(a.participants);
      const gaps = MI.leads.gapsFor(a.challenge);
      const monthly = n * 1200 * 3;
      $('#proposal', el).innerHTML = `
        <article class="panel proposal">
          <div class="row between wrap"><div><p class="eyebrow">Draft proposal · ready for review</p><h2 class="m0">${esc(a.company || 'Client')} × Mastery Inside</h2><p class="muted">${esc(a.industry || '')} · ${esc(a.size || '')} employees · lead score ${score}</p></div>${EMBEDDED ? '' : '<button class="btn" onclick="window.print()">Print / PDF</button>'}</div>
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
  /* Background glow that eases toward the cursor; the drifting tint layers shift slightly for parallax. */
  function cursorTint() {
    const tint = $('#cursor-tint');
    if (!tint || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement.style;
    let tx = innerWidth / 2, ty = innerHeight * .4, x = tx, y = ty, raf = null;
    const tick = () => {
      x += (tx - x) * .08; y += (ty - y) * .08;
      tint.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      root.setProperty('--px', ((x / innerWidth - .5) * -60).toFixed(1) + 'px');
      root.setProperty('--py', ((y / innerHeight - .5) * -60).toFixed(1) + 'px');
      raf = Math.abs(tx - x) + Math.abs(ty - y) > .5 ? requestAnimationFrame(tick) : null;
    };
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    tick();
  }

  async function boot() {
    hydrateIcons(document);
    cursorTint();
    applyRole();
    $('#switch').addEventListener('click', signOut);
    MI.charts.bindTooltips(document.body);
    // Two-step reset (no confirm(): it is blocked in some embedded previews).
    const reset = $('#reset');
    reset.addEventListener('click', () => {
      if (reset.dataset.armed) { MI.store.clear(); S = defaults(); delete reset.dataset.armed; reset.textContent = 'Reset sample data'; route(); toast('Sample data restored', 'refresh'); return; }
      reset.dataset.armed = '1'; reset.textContent = 'Click again to reset';
      setTimeout(() => { delete reset.dataset.armed; reset.textContent = 'Reset sample data'; }, 3000);
    });
    $('#menu').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    $('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
    $('#back').addEventListener('click', e => { location.hash = e.currentTarget.dataset.to || '#/home'; });
    try { if (localStorage.getItem('mi-collapsed') === '1') document.body.classList.add('collapsed'); } catch (e) { /* ignore */ }
    $('#collapse').addEventListener('click', () => {
      document.body.classList.toggle('collapsed');
      try { localStorage.setItem('mi-collapsed', document.body.classList.contains('collapsed') ? '1' : '0'); } catch (e) { /* ignore */ }
    });

    // notifications
    $('#bell').addEventListener('click', e => {
      e.stopPropagation();
      const n = $('#notifications');
      if (n.hidden) { renderNotifications(); n.hidden = false; $('#bell').setAttribute('aria-expanded', 'true'); $('#bell-dot').hidden = true; }
      else closePopovers();
    });
    document.addEventListener('click', e => { if (!e.target.closest('.pop-wrap')) closePopovers(); });

    // command palette
    $('#open-palette').addEventListener('click', () => Palette.open());
    $('#palette').addEventListener('click', e => {
      if (e.target.id === 'palette') return Palette.close();
      const it = e.target.closest('.it'); if (it) Palette.run(+it.dataset.idx);
    });
    $('#palette-q').addEventListener('input', e => { Palette.sel = 0; Palette.draw(e.target.value); });
    $('#palette-q').addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); Palette.sel = Math.min(Palette.list.length - 1, Palette.sel + 1); Palette.draw(e.target.value); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); Palette.sel = Math.max(0, Palette.sel - 1); Palette.draw(e.target.value); }
      else if (e.key === 'Enter') { e.preventDefault(); Palette.run(Palette.sel); }
    });
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#palette').hidden ? Palette.open() : Palette.close(); }
      else if (e.key === 'Escape') { Palette.close(); closePopovers(); document.body.classList.remove('nav-open'); }
    });

    await MI.ai.init();
    window.addEventListener('hashchange', route);
    route();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
