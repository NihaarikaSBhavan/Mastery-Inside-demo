/* Minimal SVG chart helpers. Colours come from CSS custom properties so light
 * and dark themes swap in one place. Every mark carries data-tip for hover. */
window.MI = window.MI || {};

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
      g += `<text class="tick" x="${w - pad.r}" y="${y(opts.target) - 6}" text-anchor="end">Target ${opts.target}</text>`;
    }
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
    return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(label)} ${value} out of 100">
      <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}"/>
      <circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${c * value / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text class="ring-val" x="50%" y="48%" text-anchor="middle" dominant-baseline="middle">${value}</text>
      <text class="ring-sub" x="50%" y="66%" text-anchor="middle">/ 100</text>
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
