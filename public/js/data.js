/* Mastery Inside — prototype data.
 * Everything here is illustrative placeholder content. In Phase 1 ("Discover")
 * it is replaced by Mastery Inside's own frameworks, assessments and IP.
 */
window.MI = window.MI || {};

MI.DIMENSIONS = [
  { key: 'selfAwareness', short: 'Self-awareness', name: 'Self-awareness',
    desc: 'Knows own strengths, triggers and impact on others.',
    intervention: 'Daily 2-minute reflection + trigger journal',
    practice: 'After each key meeting, note one moment you reacted rather than responded.',
    scenario: 'feedback' },
  { key: 'communication', short: 'Communication', name: 'Communication',
    desc: 'Clear, concise, adapts message to the audience.',
    intervention: 'Message-before-meeting: write the one-line headline first',
    practice: 'Open every update with the decision or ask, then the context.',
    scenario: 'ceo' },
  { key: 'decisionMaking', short: 'Decisions', name: 'Decision making',
    desc: 'Makes timely, well-reasoned decisions with the right people involved.',
    intervention: 'Decision log: options, criteria, owner, deadline',
    practice: 'For one open decision, name the owner and a decide-by date today.',
    scenario: 'ceo' },
  { key: 'emotionalIntelligence', short: 'Emotional IQ', name: 'Emotional intelligence',
    desc: 'Reads and responds to emotions — own and others’.',
    intervention: 'Name-the-emotion practice in 1:1s',
    practice: 'In your next 1:1, reflect back one feeling you notice before problem-solving.',
    scenario: 'underperformer' },
  { key: 'presence', short: 'Presence', name: 'Leadership presence',
    desc: 'Calm, credible and trusted under pressure.',
    intervention: 'Pause-and-land technique for high-stakes moments',
    practice: 'Before speaking in a tense moment, pause for one breath and state your view in one sentence.',
    scenario: 'ceo' },
  { key: 'delegation', short: 'Delegation', name: 'Delegation',
    desc: 'Transfers ownership, not just tasks; resists taking work back.',
    intervention: 'Delegation ladder: tell → sell → consult → agree → delegate',
    practice: 'Delegate one task this week with outcome, deadline and check-in point — then don’t touch it.',
    scenario: 'delegation' },
  { key: 'accountability', short: 'Accountability', name: 'Accountability',
    desc: 'Sets clear expectations and follows through consistently.',
    intervention: 'Commitment tracker with weekly review',
    practice: 'End every meeting with: who does what by when.',
    scenario: 'underperformer' },
  { key: 'conflict', short: 'Conflict', name: 'Conflict management',
    desc: 'Addresses disagreement early and productively.',
    intervention: 'Interest-based conversation map',
    practice: 'Raise one issue you have been avoiding within 48 hours of noticing it.',
    scenario: 'peer' },
  { key: 'strategic', short: 'Strategy', name: 'Strategic thinking',
    desc: 'Connects daily work to longer-term direction.',
    intervention: 'Weekly 30-minute “zoom out” block',
    practice: 'Ask of one current initiative: what will matter about this in 12 months?',
    scenario: 'ceo' },
  { key: 'execution', short: 'Execution', name: 'Execution',
    desc: 'Turns plans into results through focus and rhythm.',
    intervention: 'Weekly top-3 priorities ritual',
    practice: 'Pick three outcomes for the week and say no to one thing that does not serve them.',
    scenario: 'delegation' },
  { key: 'changeLeadership', short: 'Change', name: 'Change leadership',
    desc: 'Helps people through change with clarity and empathy.',
    intervention: 'Change story canvas: why, what stays, what changes, what’s next',
    practice: 'Explain one current change to your team using why / what stays / what changes.',
    scenario: 'peer' },
  { key: 'teamDevelopment', short: 'Team dev.', name: 'Team development',
    desc: 'Grows people through coaching, feedback and stretch.',
    intervention: 'Coaching-question habit (ask before tell)',
    practice: 'In each 1:1 this week, ask two questions before offering any advice.',
    scenario: 'feedback' }
];

MI.dimByKey = Object.fromEntries(MI.DIMENSIONS.map(d => [d.key, d]));

/* Assessment: per dimension one self-rating statement (Likert 1–5)
 * and one situational judgement item (options carry a hidden score). */
MI.ASSESSMENT = [
  { dim: 'selfAwareness', type: 'likert', text: 'I can predict how my mood will affect a meeting before it starts.' },
  { dim: 'selfAwareness', type: 'sjt', text: 'A colleague tells you that you came across as dismissive in yesterday’s review. You didn’t intend that. You…',
    options: [ ['Explain what you actually meant so they understand.', 45], ['Thank them, ask what specifically gave that impression, and reflect on it.', 95], ['Assume they were having a bad day.', 10], ['Apologise to the whole team by email.', 40] ] },
  { dim: 'communication', type: 'likert', text: 'People rarely need to ask me follow-up questions to understand what I want.' },
  { dim: 'communication', type: 'sjt', text: 'You have 3 minutes in the leadership meeting to update on a delayed project. You…',
    options: [ ['Walk through the full timeline so they see the complexity.', 25], ['Lead with the new date, the reason in one line, and the one decision you need.', 95], ['Keep it positive and avoid mentioning the delay.', 5], ['Share a detailed slide deck afterwards instead.', 40] ] },
  { dim: 'decisionMaking', type: 'likert', text: 'I make decisions at the right speed — neither rushed nor delayed.' },
  { dim: 'decisionMaking', type: 'sjt', text: 'Your team is split between two vendors and the deadline is Friday. You…',
    options: [ ['Ask for one more round of analysis.', 20], ['Define decision criteria with the team, hear both sides, then decide and explain why.', 95], ['Pick the cheaper one yourself.', 35], ['Escalate to your manager to decide.', 25] ] },
  { dim: 'emotionalIntelligence', type: 'likert', text: 'I notice when a team member is struggling, even if they don’t say so.' },
  { dim: 'emotionalIntelligence', type: 'sjt', text: 'A usually upbeat team member has been quiet and short with others for a week. You…',
    options: [ ['Wait — it will probably pass.', 15], ['Mention it in the team meeting so everyone is aware.', 5], ['Find a private moment, share what you noticed and ask how they are doing.', 95], ['Ask their closest colleague what is going on.', 30] ] },
  { dim: 'presence', type: 'likert', text: 'I stay composed and clear when I am challenged in front of senior people.' },
  { dim: 'presence', type: 'sjt', text: 'The CEO sharply questions your numbers in a board prep meeting. You…',
    options: [ ['Defend every number in detail immediately.', 35], ['Pause, acknowledge the concern, answer what you know and commit to verify the rest by a time.', 95], ['Say the data came from finance.', 10], ['Stay quiet and follow up by email.', 25] ] },
  { dim: 'delegation', type: 'likert', text: 'When I delegate, I hand over the outcome and let the person decide how.' },
  { dim: 'delegation', type: 'sjt', text: 'You delegated a client report. Two days before it is due, it is 60% done and not how you would do it. You…',
    options: [ ['Take it back and finish it yourself tonight.', 5], ['Rewrite the weak sections quietly.', 15], ['Ask how they plan to finish, share the one or two things that matter most, and let them own it.', 95], ['Tell them it needs to be redone your way.', 20] ] },
  { dim: 'accountability', type: 'likert', text: 'My team always knows exactly what is expected of them and by when.' },
  { dim: 'accountability', type: 'sjt', text: 'A team member missed a commitment for the second time. You…',
    options: [ ['Let it go — they are under pressure.', 10], ['Discuss it privately: restate the expectation, understand the cause, agree next steps and a check-in.', 95], ['Reassign the work to someone reliable.', 30], ['Raise it in the team meeting as a lesson for all.', 5] ] },
  { dim: 'conflict', type: 'likert', text: 'I address disagreements early rather than hoping they resolve themselves.' },
  { dim: 'conflict', type: 'sjt', text: 'Two of your leads keep clashing in meetings, slowing decisions. You…',
    options: [ ['Separate them onto different projects.', 30], ['Bring them together, surface each person’s underlying interests and agree how they will work.', 95], ['Tell them to be professional.', 20], ['Ignore it; some tension is healthy.', 10] ] },
  { dim: 'strategic', type: 'likert', text: 'I regularly step back to connect my team’s work to where the business is heading.' },
  { dim: 'strategic', type: 'sjt', text: 'Your team is busy and hitting targets, but the market is shifting. You…',
    options: [ ['Keep going — results are good.', 15], ['Block time with the team to explore what the shift means for the next 12 months.', 95], ['Wait for direction from leadership.', 20], ['Start a new initiative immediately.', 35] ] },
  { dim: 'execution', type: 'likert', text: 'The things I say will get done, get done — on time.' },
  { dim: 'execution', type: 'sjt', text: 'Your team has 9 “priority” projects this quarter. You…',
    options: [ ['Push everyone to work harder on all nine.', 10], ['Agree the top three with stakeholders and explicitly pause or de-scope the rest.', 95], ['Let each person pick what they think matters.', 20], ['Add more status meetings.', 15] ] },
  { dim: 'changeLeadership', type: 'likert', text: 'When things change, my team hears the “why” from me first.' },
  { dim: 'changeLeadership', type: 'sjt', text: 'A reorganisation is announced and your team is anxious. You…',
    options: [ ['Forward the official announcement.', 15], ['Meet the team: explain why, what stays, what changes and what you don’t know yet.', 95], ['Reassure them nothing will change.', 10], ['Wait until details are final before saying anything.', 25] ] },
  { dim: 'teamDevelopment', type: 'likert', text: 'I spend deliberate time growing each person on my team.' },
  { dim: 'teamDevelopment', type: 'sjt', text: 'A team member asks you how to handle a tricky client. You…',
    options: [ ['Tell them exactly what to do.', 30], ['Ask what they have considered, help them think it through, and let them choose.', 95], ['Handle the client yourself.', 10], ['Send them a training module.', 25] ] }
];

MI.LIKERT = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

MI.BANDS = [
  { min: 85, label: 'Mastery', tone: 'good' },
  { min: 70, label: 'Proficient', tone: 'good' },
  { min: 50, label: 'Developing', tone: 'warning' },
  { min: 0, label: 'Emerging', tone: 'critical' }
];

/* Demo participant */
MI.PERSONA = {
  name: 'Priya Sharma', role: 'Head of Sales Operations', org: 'Acme Industries',
  dept: 'Sales', programDay: 38, coach: 'Deepak (Human Coach)'
};

/* Seed assessment used until the visitor takes their own */
MI.SEED_ASSESSMENT = {
  selfAwareness: 71, communication: 68, decisionMaking: 61, emotionalIntelligence: 74,
  presence: 66, delegation: 52, accountability: 59, conflict: 55, strategic: 58,
  execution: 70, changeLeadership: 63, teamDevelopment: 62
};

/* Role-play scenarios. `root` is the hidden cause the persona reveals only
 * when the leader listens and asks good open questions. */
MI.SCENARIOS = [
  {
    id: 'underperformer', title: 'Missing targets for 3 months', persona: 'Rahul', personaRole: 'Sales Executive',
    tag: 'Performance conversation', difficulty: 'Hard', tension: 7,
    brief: 'Rahul has missed his sales target three months in a row. He was a top performer last year. You need to address performance and agree a way forward.',
    goal: 'Understand the root cause and agree a concrete improvement plan — without damaging trust.',
    opening: 'You wanted to see me? If this is about the numbers again, I already know. Everyone keeps reminding me.',
    root: 'my territory was reassigned in March and I lost my three biggest accounts — and honestly my father has been in and out of hospital, so I’ve been stretched thin',
    style: 'defensive, a little tired, becomes open if treated with respect'
  },
  {
    id: 'delegation', title: 'Delegating to a reluctant senior', persona: 'Anita', personaRole: 'Senior Analyst',
    tag: 'Delegation', difficulty: 'Medium', tension: 5,
    brief: 'You want Anita to own the quarterly business review deck, which you have always built yourself. She seems hesitant.',
    goal: 'Transfer real ownership of the QBR with clear outcomes, support and check-ins.',
    opening: 'The QBR deck? You’ve always done that yourself. I’m not sure I’m the right person… and I’m already quite full.',
    root: 'last time I owned something like this my previous manager rewrote everything the night before, so it felt pointless',
    style: 'polite, cautious, worried about being set up to fail'
  },
  {
    id: 'peer', title: 'Peer conflict over resources', persona: 'Vikram', personaRole: 'Head of Operations (peer)',
    tag: 'Conflict', difficulty: 'Hard', tension: 6,
    brief: 'Vikram keeps pulling shared analysts onto Operations work, which is delaying your sales pipeline reports.',
    goal: 'Resolve the resource conflict through shared interests, not escalation.',
    opening: 'Look, Operations has real fires to put out. Your reports can wait a week, can’t they?',
    root: 'my bonus this year is tied to on-time delivery, and I’ve been told Operations is the CEO’s priority this quarter',
    style: 'direct, territorial, respects data and fairness'
  },
  {
    id: 'ceo', title: 'Pushing back on your CEO', persona: 'Mr. Menon', personaRole: 'CEO',
    tag: 'Managing up', difficulty: 'Hard', tension: 5,
    brief: 'The CEO wants the new CRM rolled out to all regions in 4 weeks. You believe 10 weeks is realistic.',
    goal: 'Present a clear, confident case and reach an agreed plan without appearing negative.',
    opening: 'I’ve told the board we’ll be live on the new CRM across all regions within a month. You’re on track for that, right?',
    root: 'the board is worried about losing the two largest distributors, and they want to see visible progress before the next board meeting',
    style: 'busy, results-focused, impatient with long explanations'
  },
  {
    id: 'feedback', title: 'Feedback to a brilliant but abrasive performer', persona: 'Meera', personaRole: 'Top Account Manager',
    tag: 'Feedback', difficulty: 'Medium', tension: 4,
    brief: 'Meera is your top revenue generator, but two team members have complained that she is dismissive and interrupts them.',
    goal: 'Give specific behavioural feedback and gain her commitment to change.',
    opening: 'Hi! Great quarter, right? What did you want to talk about?',
    root: 'I honestly didn’t realise — I’ve been under pressure to mentor the new joiners on top of my accounts and I get impatient',
    style: 'confident, friendly, surprised by criticism'
  }
];

MI.ROLEPLAY_PARAMS = [
  ['empathy', 'Empathy'], ['clarity', 'Clarity'], ['listening', 'Listening'], ['questioning', 'Questioning'],
  ['assertiveness', 'Assertiveness'], ['emotionalControl', 'Emotional control'],
  ['conflictHandling', 'Conflict handling'], ['outcome', 'Outcome orientation']
];

/* 90-day journey */
MI.JOURNEY = [
  { day: 1, title: 'AI Leadership Assessment', desc: 'Mastery Leadership Score across 12 dimensions.', icon: '◎', key: 'assessment' },
  { day: 7, title: 'Personalised development plan', desc: 'Top 3 gaps → interventions → practice.', icon: '✦', key: 'plan' },
  { day: 'Daily', title: 'AI micro-coaching', desc: '5-minute nudges on Web / WhatsApp / Voice.', icon: '☀', key: 'daily' },
  { day: 'Weekly', title: 'Leadership challenge', desc: 'Apply one behaviour at work, then reflect.', icon: '⚑', key: 'weekly' },
  { day: 'After meetings', title: 'AI reflection', desc: 'Three questions after key meetings.', icon: '✎', key: 'reflect' },
  { day: 30, title: 'Progress assessment #1', desc: 'Re-score focus dimensions.', icon: '◔', key: 'd30' },
  { day: 60, title: 'Progress assessment #2', desc: 'Manager + peer pulse (360).', icon: '◑', key: 'd60' },
  { day: 90, title: 'Transformation report', desc: 'Before / after evidence for participant and CHRO.', icon: '●', key: 'd90' }
];

MI.NUDGES = [
  { day: 'Mon', time: '8:30 AM', text: 'What is your most important leadership challenge this week?' },
  { day: 'Wed', time: '1:00 PM', text: 'Did you have the conversation you planned? What happened?' },
  { day: 'Fri', time: '5:30 PM', text: 'What did you learn this week — and what will you do differently next week?' }
];

MI.CHECKIN_QUESTIONS = [
  'What task did you delegate this week?',
  'Who did you delegate it to?',
  'What outcome did you expect?',
  'What happened?',
  'What would you change next time?'
];

/* Seed behaviour-change history for the focus goal (weekly score) */
MI.SEED_TREND = [48, 51, 53, 57, 60, 64];

/* 360 data (self is replaced with the participant's assessment when present) */
MI.FEEDBACK_360 = [
  { dim: 'communication', self: 82, manager: 68, team: 65, ai: 71 },
  { dim: 'delegation', self: 75, manager: 54, team: 49, ai: 58 },
  { dim: 'emotionalIntelligence', self: 88, manager: 82, team: 79, ai: 81 },
  { dim: 'decisionMaking', self: 72, manager: 80, team: 76, ai: 77 },
  { dim: 'accountability', self: 70, manager: 62, team: 66, ai: 64 },
  { dim: 'conflict', self: 68, manager: 57, team: 52, ai: 55 }
];

/* Enterprise (CHRO) demo data */
MI.ORG = {
  name: 'Acme Industries', participants: 184, cohort: 'Leadership Accelerator — Cohort 2',
  score: 72, baseline: 61,
  departments: [
    { name: 'Sales', score: 78, baseline: 64, n: 52 },
    { name: 'Operations', score: 69, baseline: 60, n: 48 },
    { name: 'Technology', score: 74, baseline: 63, n: 44 },
    { name: 'HR', score: 81, baseline: 70, n: 16 },
    { name: 'Finance', score: 67, baseline: 58, n: 24 }
  ],
  /* department × dimension heatmap (current scores) */
  heat: {
    Sales:      [74, 79, 72, 76, 80, 62, 70, 66, 68, 78, 71, 73],
    Operations: [68, 66, 70, 64, 65, 55, 72, 58, 57, 76, 60, 62],
    Technology: [70, 71, 77, 66, 68, 60, 69, 61, 72, 75, 69, 66],
    HR:         [83, 84, 76, 88, 79, 74, 78, 80, 72, 77, 82, 85],
    Finance:    [66, 68, 73, 61, 63, 54, 71, 57, 64, 70, 58, 60]
  },
  improvements: [
    { dim: 'communication', before: 64, after: 76 },
    { dim: 'decisionMaking', before: 62, after: 71 },
    { dim: 'delegation', before: 49, after: 60 },
    { dim: 'accountability', before: 58, after: 66 },
    { dim: 'conflict', before: 55, after: 61 }
  ],
  engagement: { aiSessions: 4312, roleplays: 967, weeklyActive: 87, checkinRate: 78, nps: 62 },
  risks: [
    { name: 'Arjun Mehta', dept: 'Operations', signal: 'Engagement dropped 70% in 3 weeks; no check-ins', level: 'critical' },
    { name: 'Sneha Rao', dept: 'Finance', signal: 'Large perception gap on delegation (self 80 vs team 44)', level: 'serious' },
    { name: 'Karan Singh', dept: 'Technology', signal: 'Role-play scores flat after 6 attempts', level: 'warning' },
    { name: 'Farah Khan', dept: 'Sales', signal: 'Coach chat mentions burnout / workload', level: 'serious' }
  ]
};

/* Coach console: participants across the coach's caseload */
MI.CASELOAD = [
  { name: 'Priya Sharma', dept: 'Sales', score: 64, delta: +9, engagement: 92, lastAI: '2h ago', status: 'On track', flag: null },
  { name: 'Arjun Mehta', dept: 'Operations', score: 58, delta: +1, engagement: 21, lastAI: '19d ago', status: 'Needs human', flag: 'Disengaged — AI nudges unanswered' },
  { name: 'Farah Khan', dept: 'Sales', score: 66, delta: +6, engagement: 74, lastAI: '1d ago', status: 'Needs human', flag: 'Mentioned burnout in AI chat' },
  { name: 'Sneha Rao', dept: 'Finance', score: 61, delta: +4, engagement: 68, lastAI: '3h ago', status: 'Needs human', flag: 'Perception gap on delegation' },
  { name: 'Rohit Verma', dept: 'Technology', score: 71, delta: +12, engagement: 88, lastAI: '5h ago', status: 'On track', flag: null },
  { name: 'Ananya Iyer', dept: 'HR', score: 79, delta: +8, engagement: 95, lastAI: '30m ago', status: 'On track', flag: null },
  { name: 'Karan Singh', dept: 'Technology', score: 60, delta: 0, engagement: 63, lastAI: '2d ago', status: 'Watch', flag: 'Role-play plateau' },
  { name: 'Neha Gupta', dept: 'Operations', score: 68, delta: +7, engagement: 81, lastAI: '1d ago', status: 'On track', flag: null }
];

/* Program catalogue used by the AI consultant + proposal generator */
MI.PROGRAMS = {
  assessment: { name: 'Mastery Leadership Assessment', duration: '2 weeks', price: 'Free pilot for up to 10 leaders; ₹2,500 / leader thereafter' },
  coaching: { name: 'Executive Coaching + Mastery AI Coach', duration: '6 months', price: '₹1.5L–₹3L per executive' },
  program: { name: 'Leadership Accelerator (90-day, AI-enabled)', duration: '90 days', price: '₹500–₹2,000 / participant / month + program fee' },
  transformation: { name: 'Leadership Transformation Program', duration: '6–12 months', price: '₹15L–₹50L+ enterprise engagement' }
};

MI.LEAD_QUESTIONS = [
  { key: 'challenge', q: 'What leadership challenge are you currently trying to solve?',
    chips: ['Managers struggle to delegate', 'Leaders avoid difficult conversations', 'New managers need support', 'Leading through change / AI adoption'] },
  { key: 'company', q: 'Great — which organisation are you with?', chips: [] },
  { key: 'industry', q: 'Which industry are you in?', chips: ['Manufacturing', 'IT / Technology', 'BFSI', 'Healthcare', 'Retail / FMCG'] },
  { key: 'size', q: 'Roughly how many employees does the organisation have?', chips: ['< 200', '200–1,000', '1,000–5,000', '5,000+'] },
  { key: 'level', q: 'Which leadership level is this for?', chips: ['First-time managers', 'Middle managers', 'Senior leaders', 'CXO / Executive team'] },
  { key: 'participants', q: 'How many participants are you thinking of?', chips: ['< 10', '10–50', '50–200', '200+'] },
  { key: 'format', q: 'What would help most?', chips: ['Assessment only', 'Training program', 'Executive coaching', 'End-to-end transformation'] },
  { key: 'timeline', q: 'When would you like to start?', chips: ['This month', 'Next quarter', 'Within 6 months', 'Just exploring'] },
  { key: 'budget', q: 'Do you have a budget range in mind?', chips: ['< ₹5L', '₹5L–₹15L', '₹15L–₹50L', '₹50L+', 'Not sure yet'] }
];
