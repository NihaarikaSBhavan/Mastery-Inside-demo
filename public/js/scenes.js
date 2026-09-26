/* Illustrated scenes: flat-style people and props drawn as inline SVG.
 * Each scene is composed on an 800×500 stage, then scaled to cover the
 * requested size (or pinned right, for wide hero banners). */
window.MI = window.MI || {};

MI.scene = (() => {
  let uid = 0;
  const SKIN = ['#f3cfb1', '#e2b08c', '#c98b66', '#a86d4b', '#7f4c33'];
  const HAIR = ['#2a1c15', '#4b2e20', '#16161a', '#6d4226', '#b87a42', '#8c8f99'];
  const INK = '#1d2433';

  /* palette per scene: wall, wall2, floor, accent, accent2 */
  const PAL = {
    blue: ['#dfe9ff', '#c7d8ff', '#aac1f5', '#2f6fe4', '#ffb86b'],
    peach: ['#ffe6d9', '#ffd3bf', '#f2b59b', '#e8674a', '#3f7ee8'],
    mint: ['#dcf5ec', '#c3ecdd', '#9fd8c2', '#139a7a', '#f4a742'],
    lilac: ['#ece5ff', '#dcd1ff', '#bfb1f2', '#6a4fd8', '#ff8fb1'],
    sand: ['#fbf0dc', '#f5e2bf', '#e6c996', '#c7762b', '#2f7de1'],
    sky: ['#dff3fb', '#c6e9f7', '#a3d6ec', '#1f8fb8', '#f07b5a']
  };

  /* ---------- people ---------- */
  function hair(style, c) {
    const top = `<path d="M-27,-276 Q-29,-307 0,-307 Q29,-307 27,-276 Q21,-293 0,-293 Q-19,-293 -27,-276Z" fill="${c}"/>`;
    if (style === 'long') return { back: `<path d="M-31,-280 Q-33,-312 0,-310 Q33,-312 31,-280 L33,-232 Q0,-224 -33,-232Z" fill="${c}"/>`, front: top };
    if (style === 'bun') return { back: `<circle cx="0" cy="-311" r="13" fill="${c}"/>`, front: top };
    if (style === 'curly') return { back: '', front: [[-22, -290], [-12, -302], [2, -306], [16, -300], [24, -288], [-26, -276], [27, -275]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="${c}"/>`).join('') };
    if (style === 'bald') return { back: '', front: `<path d="M-26,-272 Q-27,-284 -22,-288 L-20,-272Z M26,-272 Q27,-284 22,-288 L20,-272Z" fill="${c}"/>` };
    return { back: '', front: top };
  }
  function face(mood) {
    const eyes = `<circle cx="-5" cy="-277" r="2.7" fill="${INK}"/><circle cx="13" cy="-277" r="2.7" fill="${INK}"/>`;
    const brow = mood === 'worried' ? `<path d="M-9,-285 L-1,-283 M9,-283 L17,-285" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` : '';
    const mouth = { happy: 'M-2,-265 Q5,-259 12,-265', sad: 'M-1,-262 Q5,-267 11,-262', worried: 'M0,-263 Q5,-266 10,-263', neutral: 'M0,-264 L10,-264' }[mood || 'neutral'];
    return eyes + brow + `<path d="${mouth}" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="22" cy="-270" r="4" fill="#e98b7a" opacity=".35"/>`;
  }
  const ARMS = {
    down: [[36, -226], [42, -182], [44, -140]],
    hold: [[36, -226], [52, -178], [92, -182]],
    point: [[36, -226], [66, -238], [98, -262]],
    open: [[36, -226], [60, -196], [86, -206]],
    type: [[36, -226], [48, -182], [86, -168]],
    chin: [[36, -226], [52, -196], [28, -252]]
  };
  function arm(pose, top, skin) {
    const [a, b, c] = ARMS[pose] || ARMS.down;
    return `<path d="M${a[0]},${a[1]} Q${b[0]},${b[1]} ${c[0]},${c[1]}" stroke="${top}" stroke-width="22" fill="none" stroke-linecap="round"/><circle cx="${c[0]}" cy="${c[1]}" r="10" fill="${skin}"/>`;
  }
  /* o: { x, y (floor), s, skin, hair, hairStyle, top, bottom, pose, mood, seated, flip, slump, prop } */
  function person(o) {
    const skin = SKIN[o.skin ?? 1], hc = HAIR[o.hair ?? 0], top = o.top || '#2f6fe4', bottom = o.bottom || '#27324a';
    const h = hair(o.hairStyle || 'short', hc);
    const upperDy = o.seated ? 62 : 0;
    const legs = o.seated
      ? `<rect x="-26" y="-86" width="104" height="30" rx="15" fill="${bottom}"/><rect x="54" y="-80" width="26" height="80" rx="12" fill="${bottom}"/><ellipse cx="74" cy="-2" rx="20" ry="8" fill="${INK}"/>`
      : `<rect x="-27" y="-132" width="24" height="130" rx="11" fill="${bottom}"/><rect x="3" y="-132" width="24" height="130" rx="11" fill="${bottom}"/><ellipse cx="-12" cy="-2" rx="18" ry="7" fill="${INK}"/><ellipse cx="18" cy="-2" rx="18" ry="7" fill="${INK}"/>`;
    const upper = `<g transform="translate(0 ${upperDy}) rotate(${o.slump ? 9 : 0} 0 -130)">
      ${arm(o.backPose || 'down', shade(top, -18), skin)}
      ${h.back}
      <path d="M-44,-212 Q-44,-242 -18,-242 L18,-242 Q44,-242 44,-212 L40,-126 L-40,-126Z" fill="${top}"/>
      <path d="M-12,-242 L0,-226 L12,-242Z" fill="${shade(top, 25)}"/>
      <rect x="-8" y="-256" width="16" height="18" rx="6" fill="${shade(skin, -12)}"/>
      <circle cx="0" cy="-276" r="27" fill="${skin}"/>
      ${h.front}${face(o.mood)}
      ${o.prop || ''}
      ${arm(o.pose || 'down', top, skin)}
    </g>`;
    const chair = o.seated ? `<rect x="-58" y="-190" width="20" height="120" rx="10" fill="${shade(bottom, 40)}"/><rect x="-50" y="-70" width="118" height="16" rx="8" fill="${shade(bottom, 40)}"/><rect x="0" y="-56" width="8" height="56" fill="${shade(bottom, 20)}"/>` : '';
    const k = o.s || 1;
    return `<g transform="translate(${o.x} ${o.y}) scale(${o.flip ? -k : k} ${k})">${chair}${legs}${upper}</g>`;
  }
  function shade(hex, pct) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v + (pct / 100) * (pct > 0 ? 255 - v : v))));
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join('');
  }

  /* ---------- props ---------- */
  const desk = (x, y, w, c) => `<rect x="${x}" y="${y}" width="${w}" height="18" rx="9" fill="${c}"/><rect x="${x + 20}" y="${y + 18}" width="12" height="${430 - y - 18}" fill="${shade(c, -18)}"/><rect x="${x + w - 32}" y="${y + 18}" width="12" height="${430 - y - 18}" fill="${shade(c, -18)}"/>`;
  const laptop = (x, y, c = '#cfd6e6') => `<path d="M${x},${y} l18,-54 h78 l-18,54Z" fill="${c}"/><rect x="${x - 6}" y="${y - 2}" width="92" height="8" rx="4" fill="${shade(c, -15)}"/><circle cx="${x + 48}" cy="${y - 27}" r="6" fill="#fff" opacity=".8"/>`;
  const mug = (x, y, c) => `<rect x="${x}" y="${y - 26}" width="22" height="26" rx="5" fill="${c}"/><path d="M${x + 22},${y - 20} q10,0 10,8 q0,8 -10,8" stroke="${c}" stroke-width="4" fill="none"/>`;
  const plant = (x, y, c = '#3fa36b') => `<path d="M${x - 22},${y - 44} h44 l-6,44 h-32Z" fill="#e7a07a"/>${[[-30, -120, -8], [0, -140, 0], [28, -118, 8], [-18, -96, -4], [18, -92, 4]].map(([dx, dy, r]) => `<ellipse cx="${x + dx}" cy="${y + dy / 1.4}" rx="13" ry="34" transform="rotate(${r * 4} ${x + dx} ${y + dy / 1.4})" fill="${c}"/>`).join('')}`;
  const windowF = (x, y, w, h, sky) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff" opacity=".9"/><rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="6" fill="${sky}"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${x + 16 + i * (w - 32) / 5}" y="${y + h - 16 - (30 + ((i * 37) % 50))}" width="${(w - 40) / 5}" height="${30 + ((i * 37) % 50)}" fill="#fff" opacity=".55"/>`).join('')}<rect x="${x + w / 2 - 3}" y="${y + 8}" width="6" height="${h - 16}" fill="#fff" opacity=".9"/>`;
  const wallChart = (x, y, trend, a) => {
    const pts = trend === 'down' ? [[0, 20], [30, 30], [60, 26], [90, 52], [120, 68]] : [[0, 70], [30, 58], [60, 62], [90, 34], [120, 16]];
    const col = trend === 'down' ? '#e5484d' : '#18a058';
    return `<rect x="${x}" y="${y}" width="160" height="110" rx="12" fill="#fff"/><g transform="translate(${x + 20} ${y + 16})">${[0, 1, 2].map(i => `<line x1="0" x2="120" y1="${i * 34 + 6}" y2="${i * 34 + 6}" stroke="#e6e9f0" stroke-width="2"/>`).join('')}<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${pts[4][0]}" cy="${pts[4][1]}" r="6" fill="${col}"/></g><rect x="${x + 20}" y="${y + 92}" width="50" height="6" rx="3" fill="${a}" opacity=".5"/>`;
  };
  const bubble = (x, y, w, h, content, c = '#fff', tail = 'left') => {
    const tx = tail === 'left' ? x + 22 : x + w - 22;
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(22, h / 2)}" fill="${c}"/><path d="M${tx - 10},${y + h - 1} l${tail === 'left' ? -8 : 18},20 l${tail === 'left' ? 22 : -8},-20Z" fill="${c}"/>${content}</g>`;
  };
  const lines = (x, y, n, w, c) => Array.from({ length: n }, (_, i) => `<rect x="${x}" y="${y + i * 14}" width="${i === n - 1 ? w * .6 : w}" height="7" rx="3.5" fill="${c}" opacity=".45"/>`).join('');
  const glyph = (x, y, name, s, c) => `<g transform="translate(${x} ${y}) scale(${s / 24})"><path d="${MI.ICONS[name]}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  const folder = (x, y, c) => `<path d="M${x},${y} h26 l8,8 h32 v44 h-66Z" fill="${c}"/><rect x="${x + 6}" y="${y + 14}" width="54" height="30" rx="3" fill="#fff" opacity=".85"/>`;
  const sparkles = (pts, c) => pts.map(([x, y, s]) => `<path d="M${x},${y - s} L${x + s * .3},${y - s * .3} L${x + s},${y} L${x + s * .3},${y + s * .3} L${x},${y + s} L${x - s * .3},${y + s * .3} L${x - s},${y} L${x - s * .3},${y - s * .3}Z" fill="${c}"/>`).join('');
  const board = (x, y, w, h, inner) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#fff"/><rect x="${x + w / 2 - 4}" y="${y + h}" width="8" height="${430 - y - h}" fill="#9aa3b5"/>${inner}`;

  /* ---------- scenes (800×500 stage, floor at y=430) ---------- */
  const SCENES = {
    underperformer: p => `${windowF(520, 70, 200, 150, p[1])}${wallChart(90, 80, 'down', p[3])}
      ${person({ x: 250, y: 430, seated: true, skin: 3, hair: 0, top: '#5b6b8c', mood: 'sad', slump: true, pose: 'down', s: .95 })}
      ${person({ x: 560, y: 430, seated: true, flip: true, skin: 1, hair: 4, hairStyle: 'long', top: p[3], mood: 'neutral', pose: 'open', s: .95 })}
      ${desk(300, 318, 220, '#ffffff')}${laptop(390, 318)}${mug(330, 318, p[4])}
      ${bubble(470, 110, 64, 52, glyph(488, 122, 'chat', 28, p[3]), '#fff', 'right')}${plant(730, 430)}`,
    delegation: p => `${board(80, 70, 220, 170, `<g transform="translate(100 96)">${[0, 1, 2].map(i => `<rect x="0" y="${i * 44}" width="22" height="22" rx="6" fill="${i < 2 ? p[3] : '#e6e9f0'}"/>${i < 2 ? `<path d="M5,${i * 44 + 11} l5,5 l8,-9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>` : ''}<rect x="36" y="${i * 44 + 6}" width="${130 - i * 20}" height="10" rx="5" fill="#cfd6e6"/>`).join('')}</g>`)}
      ${person({ x: 360, y: 430, skin: 0, hair: 1, hairStyle: 'short', top: p[3], bottom: '#2a3350', mood: 'happy', pose: 'hold', s: 1, prop: folder(84, -214, p[4]) })}
      ${person({ x: 560, y: 430, flip: true, skin: 2, hair: 2, hairStyle: 'bun', top: '#e0795b', bottom: '#3a3f55', mood: 'worried', pose: 'open', s: .97 })}
      ${sparkles([[470, 150, 10], [640, 110, 7]], p[4])}${plant(720, 430, '#48a878')}`,
    peer: p => `${windowF(300, 60, 200, 140, p[1])}
      ${person({ x: 230, y: 430, skin: 4, hair: 2, hairStyle: 'short', top: '#3b4a6b', mood: 'neutral', pose: 'point', s: 1 })}
      ${person({ x: 570, y: 430, flip: true, skin: 1, hair: 0, hairStyle: 'bald', top: p[3], mood: 'sad', pose: 'open', s: 1 })}
      ${bubble(150, 60, 110, 60, lines(170, 78, 2, 70, INK))}${bubble(540, 60, 110, 60, lines(560, 78, 2, 70, INK), '#fff', 'right')}
      ${glyph(372, 220, 'bolt', 56, p[4])}${sparkles([[330, 250, 8], [470, 230, 10]], p[4])}`,
    ceo: p => `${board(300, 70, 300, 190, `<text x="322" y="104" font-family="Figtree, sans-serif" font-size="16" font-weight="700" fill="${INK}">CRM rollout</text>
        <rect x="322" y="126" width="110" height="26" rx="8" fill="#e5484d" opacity=".85"/><text x="442" y="145" font-family="Figtree, sans-serif" font-size="14" fill="${INK}">4 weeks</text>
        <rect x="322" y="168" width="230" height="26" rx="8" fill="${p[3]}"/><text x="322" y="222" font-family="Figtree, sans-serif" font-size="14" fill="${INK}">10 weeks · phased</text>`)}
      ${person({ x: 230, y: 430, skin: 1, hair: 3, hairStyle: 'long', top: p[3], mood: 'happy', pose: 'point', s: 1 })}
      ${person({ x: 650, y: 430, seated: true, flip: true, skin: 2, hair: 5, hairStyle: 'bald', top: '#2b3445', mood: 'neutral', pose: 'chin', s: .95 })}
      ${plant(90, 430, '#4a9e73')}`,
    feedback: p => `${windowF(90, 70, 180, 140, p[1])}<ellipse cx="400" cy="340" rx="90" ry="16" fill="#fff"/><rect x="394" y="346" width="12" height="84" fill="#c9cfdc"/>${mug(380, 338, p[4])}
      ${person({ x: 270, y: 430, seated: true, skin: 0, hair: 1, hairStyle: 'long', top: '#e2708a', mood: 'happy', pose: 'open', s: .95 })}
      ${person({ x: 540, y: 430, seated: true, flip: true, skin: 3, hair: 2, hairStyle: 'curly', top: p[3], mood: 'neutral', pose: 'down', s: .95 })}
      ${bubble(300, 90, 120, 64, sparkles([[330, 122, 11], [360, 122, 11], [390, 122, 11]], p[4]))}${plant(710, 430)}`,
    coach: p => `${windowF(540, 60, 190, 150, p[1])}
      ${person({ x: 260, y: 430, seated: true, skin: 2, hair: 0, hairStyle: 'long', top: p[3], mood: 'happy', pose: 'type', s: 1 })}
      ${desk(300, 318, 240, '#ffffff')}${laptop(380, 318)}${mug(500, 318, p[4])}
      ${bubble(390, 90, 150, 54, lines(410, 106, 2, 110, INK))}${bubble(470, 170, 130, 50, lines(490, 184, 2, 90, '#fff'), p[3], 'right')}
      <circle cx="660" cy="300" r="34" fill="${p[3]}"/>${glyph(642, 282, 'sparkle', 36, '#fff')}${plant(90, 430)}`,
    growth: p => `${[0, 1, 2, 3].map(i => `<rect x="${360 + i * 90}" y="${360 - i * 50}" width="90" height="${70 + i * 50}" rx="10" fill="${i === 3 ? p[3] : shade(p[2], -i * 6)}"/>`).join('')}
      <path d="M680,210 v-70" stroke="${INK}" stroke-width="4"/><path d="M680,140 l40,14 l-40,14Z" fill="${p[4]}"/>
      ${person({ x: 628, y: 210, skin: 1, hair: 4, hairStyle: 'bun', top: '#ffffff', bottom: '#2a3350', mood: 'happy', pose: 'point', s: .45 })}
      ${person({ x: 220, y: 430, skin: 3, hair: 0, top: p[3], mood: 'happy', pose: 'open', s: 1 })}
      ${sparkles([[520, 120, 10], [740, 170, 8], [320, 220, 7]], p[4])}`,
    assessment: p => `${board(360, 60, 300, 230, `<g transform="translate(510 175)">${[70, 50, 30].map(r => `<polygon points="${[0, 1, 2, 3, 4, 5].map(i => { const a = -Math.PI / 2 + i * Math.PI / 3; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ')}" fill="none" stroke="#e1e5ee" stroke-width="2"/>`).join('')}
        <polygon points="${[62, 44, 58, 30, 50, 40].map((r, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ')}" fill="${p[3]}" fill-opacity=".25" stroke="${p[3]}" stroke-width="3"/></g>`)}
      ${person({ x: 250, y: 430, skin: 2, hair: 1, hairStyle: 'curly', top: p[3], mood: 'happy', pose: 'point', s: 1 })}${plant(730, 430)}`,
    team: p => `${windowF(90, 50, 240, 170, p[1])}${wallChart(560, 60, 'up', p[3])}
      ${person({ x: 170, y: 430, seated: true, skin: 1, hair: 0, top: p[3], mood: 'happy', pose: 'open', s: .9 })}
      ${person({ x: 330, y: 430, seated: true, skin: 4, hair: 2, hairStyle: 'bun', top: '#e0795b', mood: 'happy', pose: 'down', s: .9 })}
      ${person({ x: 640, y: 430, seated: true, flip: true, skin: 2, hair: 3, hairStyle: 'long', top: '#6a4fd8', mood: 'neutral', pose: 'open', s: .9 })}
      ${desk(220, 322, 360, '#ffffff')}${laptop(300, 322)}${mug(470, 322, p[4])}
      ${person({ x: 480, y: 430, skin: 0, hair: 1, top: '#1f8fb8', mood: 'happy', pose: 'point', s: .98 })}`,
    journey: p => `<path d="M40,420 C200,420 220,300 380,300 S560,180 760,170" stroke="#fff" stroke-width="26" fill="none" stroke-linecap="round"/>
      ${[[120, 412], [380, 300], [620, 196]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="18" fill="${i < 2 ? p[3] : '#fff'}" stroke="${p[3]}" stroke-width="4"/>`).join('')}
      <path d="M740,170 v-80" stroke="${INK}" stroke-width="4"/><path d="M740,90 l38,14 l-38,14Z" fill="${p[4]}"/>
      ${person({ x: 470, y: 262, skin: 1, hair: 4, hairStyle: 'long', top: p[3], mood: 'happy', pose: 'open', s: .62 })}${plant(90, 300, '#4aa87a')}`
  };

  /* name, { w, h, palette, align: 'cover' | 'right', label } */
  return function scene(name, o = {}) {
    const w = o.w || 800, h = o.h || 500;
    const p = PAL[o.palette || 'blue'];
    const id = 'sc' + (++uid);
    const k = o.align === 'right' ? h / 500 : o.align === 'bottom' ? w / 800 : Math.max(w / 800, h / 500);
    const tx = o.align === 'right' ? w - 800 * k : (w - 800 * k) / 2;
    const ty = o.align === 'bottom' ? h - 520 * k : (h - 500 * k) / 2;
    const floorY = ty + 430 * k;
    return `<svg class="art scene" viewBox="0 0 ${w} ${h}" preserveAspectRatio="${o.align === 'right' ? 'xMaxYMid' : o.align === 'bottom' ? 'xMidYMax' : 'xMidYMid'} slice" role="img" aria-label="${o.label || ''}">
      <defs>
        <linearGradient id="${id}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient>
        <radialGradient id="${id}b"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <filter id="${id}n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .35"/></feComponentTransfer></filter>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#${id}w)"/>
      <circle cx="${w * .22}" cy="${h * .25}" r="${Math.max(w, h) * .35}" fill="url(#${id}b)"/>
      <circle cx="${w * .88}" cy="${h * .12}" r="${Math.max(w, h) * .22}" fill="${p[3]}" opacity=".08"/>
      <rect y="${floorY}" width="${w}" height="${h - floorY}" fill="${p[2]}"/>
      <rect y="${floorY}" width="${w}" height="6" fill="#fff" opacity=".45"/>
      <g transform="translate(${tx} ${ty}) scale(${k})">${(SCENES[name] || SCENES.team)(p)}</g>
      <rect width="${w}" height="${h}" filter="url(#${id}n)" opacity=".4"/>
    </svg>`;
  };
})();
