/* Magic cursor: an aurora comet trail, a constellation of floating motes that
 * swirl toward the pointer, and stardust sparkles that shed as you move and
 * burst when you click. Two canvases: one behind the UI (trail + motes), one
 * above it (small, short-lived sparkles). Paused when the tab is hidden and
 * disabled entirely for reduced-motion viewers. */
window.MI = window.MI || {};

MI.magic = (() => {
  const SPARK_COLORS = ['#2f7cf6', '#4facfe', '#38bdf8', '#7c8cf8', '#9f8cf8', '#60a5fa'];
  const TRAIL = 28, MOTES = 54, MAX_SPARKS = 220;

  function canvas(id, z) {
    const c = document.createElement('canvas');
    c.id = id;
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${z}`;
    document.body.appendChild(c);
    return c;
  }
  const rand = (a, b) => a + Math.random() * (b - a);

  function star(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x, y, x + s, y);
    ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y);
    ctx.quadraticCurveTo(x, y, x, y - s);
    ctx.fill();
  }

  function start() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || window.__miMagic) return;
    window.__miMagic = true;
    const back = canvas('magic-back', -1), front = canvas('magic-front', 95);
    const bx = back.getContext('2d'), fx = front.getContext('2d');
    let W = 0, H = 0;
    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      for (const c of [back, front]) { c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; }
      bx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize);

    const mouse = { x: W * .62, y: H * .38, seen: false, speed: 0 };
    const head = { x: mouse.x, y: mouse.y, vx: 0, vy: 0 };
    const trail = Array.from({ length: TRAIL }, () => ({ x: head.x, y: head.y }));
    const sparks = [], rings = [];
    const motes = Array.from({ length: MOTES }, () => ({
      x: rand(0, W), y: rand(0, H), r: rand(.8, 2.4), vx: rand(-.12, .12), vy: rand(-.12, .12), tw: rand(0, 6.28), ts: rand(.01, .03)
    }));

    const emit = (x, y, n, force = 1) => {
      for (let i = 0; i < n && sparks.length < MAX_SPARKS; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(.3, 1.6) * force;
        sparks.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - .25, s: rand(2, 5.5), life: 1, decay: rand(.012, .026), c: SPARK_COLORS[(Math.random() * SPARK_COLORS.length) | 0], rot: rand(0, 1) });
      }
    };

    let lastX = mouse.x, lastY = mouse.y;
    addEventListener('pointermove', e => {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = true;
      const d = Math.hypot(mouse.x - lastX, mouse.y - lastY);
      lastX = mouse.x; lastY = mouse.y;
      mouse.speed = mouse.speed * .7 + d * .3;
      const onControl = e.target && e.target.closest && e.target.closest('a, button, .art-card, .recent-card, .chip');
      const n = Math.min(5, d / (onControl ? 6 : 10));
      emit(mouse.x, mouse.y, n + (Math.random() < n % 1 ? 1 : 0), onControl ? 1.2 : .9);
    }, { passive: true });
    addEventListener('pointerdown', e => {
      rings.push({ x: e.clientX, y: e.clientY, r: 4, life: 1 });
      emit(e.clientX, e.clientY, 26, 3.2);
    }, { passive: true });

    let raf = null, last = performance.now();
    const frame = now => {
      const dt = Math.min(2.5, (now - last) / 16.67); last = now;

      // spring-follow head, so the comet swoops and overshoots a little
      head.vx = (head.vx + (mouse.x - head.x) * .09 * dt) * Math.pow(.78, dt);
      head.vy = (head.vy + (mouse.y - head.y) * .09 * dt) * Math.pow(.78, dt);
      head.x += head.vx * dt; head.y += head.vy * dt;
      trail.pop(); trail.unshift({ x: head.x, y: head.y });
      mouse.speed *= Math.pow(.92, dt);

      /* ---------- back layer: aurora trail + constellation ---------- */
      bx.clearRect(0, 0, W, H);
      const halo = bx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 170);
      halo.addColorStop(0, 'rgba(79, 172, 254, .26)');
      halo.addColorStop(.45, 'rgba(142, 197, 252, .14)');
      halo.addColorStop(1, 'rgba(142, 197, 252, 0)');
      bx.fillStyle = halo; bx.fillRect(head.x - 170, head.y - 170, 340, 340);

      bx.lineCap = 'round'; bx.lineJoin = 'round';
      for (let i = TRAIL - 1; i > 0; i--) {
        const p = trail[i], q = trail[i - 1], k = 1 - i / TRAIL;
        bx.strokeStyle = `hsla(${205 + i * 2.2}, 95%, ${62 + i * .4}%, ${k * .34})`;
        bx.lineWidth = 4 + k * 30;
        bx.beginPath(); bx.moveTo(p.x, p.y); bx.lineTo(q.x, q.y); bx.stroke();
      }
      bx.strokeStyle = 'rgba(255, 255, 255, .55)'; bx.lineWidth = 2;
      bx.beginPath(); bx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < 10; i++) bx.lineTo(trail[i].x, trail[i].y);
      bx.stroke();

      const near = [];
      for (const m of motes) {
        const dx = head.x - m.x, dy = head.y - m.y, dist = Math.hypot(dx, dy);
        if (mouse.seen && dist < 220) {
          const pull = (1 - dist / 220) * .035;
          m.vx += (dx * pull - dy * pull * .9) / (dist + 1) * dt;
          m.vy += (dy * pull + dx * pull * .9) / (dist + 1) * dt;
          near.push([m, dist]);
        }
        m.vx *= Math.pow(.985, dt); m.vy *= Math.pow(.985, dt);
        m.vx += rand(-.004, .004); m.vy += rand(-.004, .004);
        m.x += m.vx * dt; m.y += m.vy * dt;
        if (m.x < -10) m.x = W + 10; else if (m.x > W + 10) m.x = -10;
        if (m.y < -10) m.y = H + 10; else if (m.y > H + 10) m.y = -10;
        m.tw += m.ts * dt;
        const a = .25 + .35 * (Math.sin(m.tw) * .5 + .5) + (dist < 220 ? (1 - dist / 220) * .35 : 0);
        bx.fillStyle = `rgba(59, 130, 246, ${a.toFixed(3)})`;
        bx.beginPath(); bx.arc(m.x, m.y, m.r, 0, Math.PI * 2); bx.fill();
      }
      bx.lineWidth = 1;
      for (const [m, dist] of near) {
        bx.strokeStyle = `rgba(79, 140, 246, ${((1 - dist / 220) * .35).toFixed(3)})`;
        bx.beginPath(); bx.moveTo(head.x, head.y); bx.lineTo(m.x, m.y); bx.stroke();
      }
      for (let i = 0; i < near.length; i++) for (let j = i + 1; j < near.length; j++) {
        const a = near[i][0], b = near[j][0], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 90) { bx.strokeStyle = `rgba(124, 140, 248, ${((1 - d / 90) * .25).toFixed(3)})`; bx.beginPath(); bx.moveTo(a.x, a.y); bx.lineTo(b.x, b.y); bx.stroke(); }
      }

      /* ---------- front layer: stardust + click ripples ---------- */
      fx.clearRect(0, 0, W, H);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vx *= Math.pow(.96, dt); s.vy = s.vy * Math.pow(.96, dt) - .012 * dt;
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= s.decay * dt;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        const tw = .6 + .4 * Math.sin((1 - s.life) * 18 + s.rot * 6);
        fx.globalAlpha = Math.min(1, s.life * 1.4) * tw;
        fx.fillStyle = s.c;
        star(fx, s.x, s.y, s.s * (.4 + s.life * .6));
      }
      fx.globalAlpha = 1;
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.r += 3.2 * dt; r.life -= .03 * dt;
        if (r.life <= 0) { rings.splice(i, 1); continue; }
        fx.strokeStyle = `rgba(79, 172, 254, ${(r.life * .6).toFixed(3)})`;
        fx.lineWidth = 2 * r.life + .5;
        fx.beginPath(); fx.arc(r.x, r.y, r.r, 0, Math.PI * 2); fx.stroke();
        fx.strokeStyle = `rgba(159, 140, 248, ${(r.life * .35).toFixed(3)})`;
        fx.beginPath(); fx.arc(r.x, r.y, r.r * .62, 0, Math.PI * 2); fx.stroke();
      }

      raf = requestAnimationFrame(frame);
    };
    const run = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; } else run();
    });
    run();
    return { sparks, motes };
  }

  return { start };
})();
