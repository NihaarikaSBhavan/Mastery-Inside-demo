/* Minimal SVG chart helpers. Colours come from CSS custom properties so light
 * and dark themes swap in one place. Every mark carries data-tip for hover. */
window.MI = window.MI || {};

/* Stroke icon set (24px grid). */
MI.ICONS = {
  close: 'M6 6l12 12M18 6 6 18',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z',
  panel: 'M4 4h16v16H4zM9 4v16M16 10l-2 2 2 2',
  rocket: 'M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 13l2 2M14.5 4.5C17 2 21 3 21 3s1 4-1.5 6.5L13 16l-5-5zM8 11H4l3-3h4M13 16v4l3-3v-4',
  share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  route: 'M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20',
  clipboard: 'M9 3h6v4H9zM9 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3M9 12h6M9 16h4',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  briefcase: 'M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a2 2 0 0 0 3.4 0',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  sparkle: 'M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6-5.6-1.9 5.6-1.9zM19 3v4M21 5h-4',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 18l-6-6 6-6',
  check: 'M5 12l5 5L20 7',
  circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  calendar: 'M4 5h16v16H4zM4 10h16M9 3v4M15 3v4',
  flame: 'M12 3s5 4.5 5 9.5a5 5 0 0 1-10 0C7 9 9.5 7.5 9.5 7.5S10 10 12 10V3z',
  refresh: 'M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3',
  speaker: 'M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  play: 'M7 4l13 8-13 8z',
  doc: 'M6 3h9l5 5v13H6zM14 3v6h6M9 13h8M9 17h6',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4'
};
MI.icon = name => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${MI.ICONS[name] || MI.ICONS.circle}"/></svg>`;

MI.charts = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Radar for 0–100 scores. series: [{label, values:{key:score}, cls}] */
  function radar(dims, series, size = 340) {
    const cx = size / 2, cy = size / 2, r = size / 2 - 78;
    const n = dims.length;
    const pt = (i, v) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return [cx + Math.cos(a) * r * v / 100, cy + Math.sin(a) * r * v / 100];
    };
    let g = '';
    [25, 50, 75, 100].forEach(v => {
      g += `<polygon class="grid" points="${dims.map((_, i) => pt(i, v).join(',')).join(' ')}"/>`;
    });
    dims.forEach((d, i) => {
      const [x, y] = pt(i, 100);
      g += `<line class="grid" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;
      const [lx, ly] = pt(i, 122);
      const anchor = Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end';
      g += `<text class="axis-label" x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle">${esc(d.short || d.name)}</text>`;
    });
    series.forEach(s => {
      const pts = dims.map((d, i) => pt(i, s.values[d.key] || 0));
      g += `<polygon class="radar-area ${s.cls}" points="${pts.map(p => p.join(',')).join(' ')}"/>`;
      pts.forEach((p, i) => {
        g += `<circle class="radar-dot ${s.cls}" cx="${p[0]}" cy="${p[1]}" r="4" data-tip="${esc(s.label)} · ${esc(dims[i].name)}: ${s.values[dims[i].key]}"/>`;
        g += `<circle class="hit" cx="${p[0]}" cy="${p[1]}" r="12" data-tip="${esc(s.label)} · ${esc(dims[i].name)}: ${s.values[dims[i].key]}"/>`;
      });
    });
    return `<svg class="chart" viewBox="0 0 ${size} ${size}" role="img" aria-label="Radar chart of leadership dimensions">${g}</svg>`;
  }

  /* Horizontal bars with optional baseline ghost marker. rows: [{label, value, base, tone}] */
  function hbars(rows, opts = {}) {
    return `<div class="hbars">${rows.map(r => `
      <div class="hbar-row" data-tip="${esc(r.label)}: ${r.value}${r.base != null ? ` (baseline ${r.base})` : ''}">
        <div class="hbar-label">${esc(r.label)}</div>
        <div class="hbar-track">
          <div class="hbar-fill ${r.tone || ''}" style="width:${r.value}%"></div>
          ${r.base != null ? `<div class="hbar-base" style="left:${r.base}%"></div>` : ''}
        </div>
        <div class="hbar-val">${r.value}${opts.delta && r.base != null ? ` <span class="delta up">+${r.value - r.base}</span>` : ''}</div>
      </div>`).join('')}</div>`;
  }

  /* Grouped vertical bars. groups: [{label, values:[..]}], series: [{label, cls}] */
  function grouped(groups, series, h = 220) {
    const w = 640, pad = { l: 30, r: 8, t: 10, b: 34 };
    const gw = (w - pad.l - pad.r) / groups.length;
    const bw = Math.min(18, (gw - 16) / series.length - 2);
    const y = v => pad.t + (h - pad.t - pad.b) * (1 - v / 100);
    let g = '';
    [0, 25, 50, 75, 100].forEach(v => {
      g += `<line class="${v === 0 ? 'baseline' : 'grid'}" x1="${pad.l}" x2="${w - pad.r}" y1="${y(v)}" y2="${y(v)}"/>`;
      g += `<text class="tick" x="${pad.l - 6}" y="${y(v)}" text-anchor="end" dominant-baseline="middle">${v}</text>`;
    });
    groups.forEach((grp, gi) => {
      const x0 = pad.l + gi * gw + (gw - series.length * (bw + 2)) / 2;
      grp.values.forEach((v, si) => {
        const x = x0 + si * (bw + 2), top = y(v), bh = y(0) - top;
        g += `<path class="bar ${series[si].cls}" d="M${x},${y(0)} v${-(bh - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${bh - 4} z" data-tip="${esc(grp.label)} · ${esc(series[si].label)}: ${v}"/>`;
      });
      g += `<text class="tick" x="${pad.l + gi * gw + gw / 2}" y="${h - 14}" text-anchor="middle">${esc(grp.label)}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Grouped bar chart">${g}</svg>`;
  }

  /* Single-series line with points. labels: [..], values: [..] */
  function line(labels, values, opts = {}) {
    const w = 560, h = opts.h || 200, pad = { l: 30, r: 16, t: 14, b: 28 };
    const lo = opts.min ?? 0, hi = opts.max ?? 100;
    const x = i => pad.l + (w - pad.l - pad.r) * (labels.length === 1 ? 0.5 : i / (labels.length - 1));
    const y = v => pad.t + (h - pad.t - pad.b) * (1 - (v - lo) / (hi - lo));
    let g = '';
    const ticks = opts.ticks || [lo, (lo + hi) / 2, hi];
    ticks.forEach(v => {
      g += `<line class="grid" x1="${pad.l}" x2="${w - pad.r}" y1="${y(v)}" y2="${y(v)}"/>`;
      g += `<text class="tick" x="${pad.l - 6}" y="${y(v)}" text-anchor="end" dominant-baseline="middle">${Math.round(v)}</text>`;
    });
    if (opts.target != null) {
      g += `<line class="target" x1="${pad.l}" x2="${w - pad.r}" y1="${y(opts.target)}" y2="${y(opts.target)}"/>`;
      g += `<text class="tick" x="${pad.l + 4}" y="${y(opts.target) - 6}" text-anchor="start">Target ${opts.target}</text>`;
    }
    const gid = 'lg' + Math.random().toString(36).slice(2, 8);
    g += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--s1);stop-opacity:.22"/><stop offset="1" style="stop-color:var(--s1);stop-opacity:0"/></linearGradient></defs>`;
    g += `<path class="area" fill="url(#${gid})" d="M${x(0)},${y(lo)} ${values.map((v, i) => `L${x(i)},${y(v)}`).join(' ')} L${x(values.length - 1)},${y(lo)} Z"/>`;
    g += `<polyline class="line s1" points="${values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/>`;
    values.forEach((v, i) => {
      g += `<circle class="line-dot s1" cx="${x(i)}" cy="${y(v)}" r="4.5"/>`;
      g += `<circle class="hit" cx="${x(i)}" cy="${y(v)}" r="14" data-tip="${esc(labels[i])}: ${v}"/>`;
      g += `<text class="tick" x="${x(i)}" y="${h - 8}" text-anchor="middle">${esc(labels[i])}</text>`;
    });
    const last = values.length - 1;
    g += `<text class="direct-label" x="${x(last)}" y="${y(values[last]) - 12}" text-anchor="middle">${values[last]}</text>`;
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opts.label || 'Trend line')}">${g}</svg>`;
  }

  /* Heatmap (sequential single hue). rows: [{label, values}], cols: [labels] */
  function heatmap(rows, cols) {
    const step = v => v >= 80 ? 5 : v >= 72 ? 4 : v >= 65 ? 3 : v >= 58 ? 2 : 1;
    return `<div class="heat" style="grid-template-columns: 110px repeat(${cols.length}, minmax(34px, 1fr))">
      <div></div>${cols.map(c => `<div class="heat-col">${esc(c)}</div>`).join('')}
      ${rows.map(r => `<div class="heat-row">${esc(r.label)}</div>${r.values.map((v, i) =>
        `<div class="heat-cell q${step(v)}" data-tip="${esc(r.label)} · ${esc(cols[i])}: ${v}">${v}</div>`).join('')}`).join('')}
    </div>
    <div class="heat-legend"><span>Lower</span>${[1, 2, 3, 4, 5].map(q => `<i class="heat-cell q${q}"></i>`).join('')}<span>Higher</span></div>`;
  }

  /* Circular score ring */
  function ring(value, label, size = 150) {
    const r = size / 2 - 12, c = 2 * Math.PI * r;
    const gid = 'rg' + Math.random().toString(36).slice(2, 8);
    return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(label)} ${value} out of 100">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fb0ff"/><stop offset="1" stop-color="#1c5fd6"/></linearGradient></defs>
      <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}"/>
      <circle class="ring-fill" stroke="url(#${gid})" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${c * value / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text class="ring-val" x="50%" y="48%" style="font-size:${Math.round(size * 0.27)}px" text-anchor="middle" dominant-baseline="middle">${value}</text>
      <text class="ring-sub" x="50%" y="${size < 110 ? 70 : 66}%" style="font-size:${size < 110 ? 9 : 11}px" text-anchor="middle">/ 100</text>
    </svg>`;
  }

  /* Shared hover tooltip */
  function bindTooltips(root) {
    let tip = document.getElementById('tooltip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'tooltip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
    root.addEventListener('pointermove', e => {
      const el = e.target.closest('[data-tip]');
      if (!el) { tip.classList.remove('show'); return; }
      tip.textContent = el.getAttribute('data-tip');
      tip.classList.add('show');
      const x = Math.min(window.innerWidth - tip.offsetWidth - 8, e.clientX + 14);
      tip.style.transform = `translate(${Math.max(8, x)}px, ${e.clientY - 36}px)`;
    });
    root.addEventListener('pointerleave', () => tip.classList.remove('show'));
  }

  return { radar, hbars, grouped, line, heatmap, ring, bindTooltips, esc };
})();

/* Generated artwork: grainy, risograph-style gradient illustrations with a
 * subject glyph. Pure inline SVG, so it works offline and inside the viewer. */
MI.art = (() => {
  const PALETTES = [
    ['#2f7de1', '#f3a6bf', '#ffd27a'],
    ['#1aa6c9', '#f08a5d', '#ffe3a3'],
    ['#5b5bd6', '#f5a3c7', '#9fd8ff'],
    ['#128c7e', '#f2c14e', '#b8f1e0'],
    ['#e5645f', '#5b8def', '#ffd3b0'],
    ['#2b4fb8', '#28c2a0', '#f7e27a'],
    ['#c2410c', '#fbbf24', '#fde7c7'],
    ['#7c3aed', '#22d3ee', '#fbcfe8']
  ];
  let n = 0;
  const rng = seed => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };

  /* opts: { seed, icon, w, h, scatter (number of small glyphs), label } */
  return function art(opts = {}) {
    const { seed = 1, icon = 'sparkle', w = 400, h = 260, scatter = 0, label = '' } = opts;
    const [a, b, c] = PALETTES[seed % PALETTES.length];
    const id = 'art' + (++n);
    const r = rng(seed + 7);
    const big = Math.min(w, h) * (scatter ? .5 : .46);
    const cx = scatter ? w * .72 : w / 2, cy = h / 2;
    let glyphs = '';
    for (let i = 0; i < scatter; i++) {
      const s = 26 + r() * 46, x = r() * w, y = r() * h, rot = r() * 50 - 25;
      glyphs += `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s / 24})" opacity="${.35 + r() * .45}"><path d="${MI.ICONS[['sparkle', 'chat', 'target', 'star', 'bolt'][i % 5]]}" fill="none" stroke="${i % 2 ? c : '#ffffff'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    }
    return `<svg class="art" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".62" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
        <radialGradient id="${id}r"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}q"><stop offset="0" stop-color="${a}" stop-opacity=".9"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient>
        <filter id="${id}n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .55"/></feComponentTransfer></filter>
        <filter id="${id}s"><feDropShadow dx="0" dy="${big / 18}" stdDeviation="${big / 16}" flood-color="#0b1020" flood-opacity=".28"/></filter>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#${id}g)"/>
      <circle cx="${w * (.15 + r() * .3)}" cy="${h * (.2 + r() * .3)}" r="${Math.max(w, h) * .38}" fill="url(#${id}r)"/>
      <circle cx="${w * (.6 + r() * .35)}" cy="${h * (.6 + r() * .4)}" r="${Math.max(w, h) * .32}" fill="url(#${id}q)"/>
      ${glyphs}
      <g filter="url(#${id}s)" transform="translate(${cx - big / 2} ${cy - big / 2}) scale(${big / 24})"><path d="${MI.ICONS[icon] || MI.ICONS.sparkle}" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g>
      <rect width="${w}" height="${h}" filter="url(#${id}n)" opacity=".55" style="mix-blend-mode:overlay"/>
      <rect width="${w}" height="${h}" filter="url(#${id}n)" opacity=".18"/>
    </svg>`;
  };
})();
