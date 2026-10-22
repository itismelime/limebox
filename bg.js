// limebox background: a faint floor of isometric cubes, a slow lime wave
// across it, and cubes near the pointer lifting softly with a short trail.
(function () {
  const cv = document.getElementById('bg');
  const ctx = cv.getContext('2d');
  const S = 20, A = S * Math.sqrt(3) / 2, L = '166,255,61', R = 100;
  const IDLE_WAIT = 500, IDLE_SHRINK = 900;  // ms: a still pointer's lit area shrinks from the outside in
  const STRETCH = 0.45, FADE = 0.93, SPRING = 0.06, DAMP = 0.87, LIFT = 7, GLOW = 0.5;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, cubes = [], p = null, prev = null, vx = 0, vy = 0, moved = 0;

  function size() {
    const dpr = window.devicePixelRatio || 1;
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cubes = [];
    for (let r = -1, y = 0; y < H + S * 2; r++, y = r * 1.5 * S)
      for (let x = (r & 1 ? A : 0) - 2 * A; x < W + 2 * A; x += 2 * A) cubes.push({ x, y, m: 0, l: 0, v: 0 });
  }
  function hex(x, y) {
    ctx.moveTo(x, y - S); ctx.lineTo(x + A, y - S / 2); ctx.lineTo(x + A, y + S / 2); ctx.lineTo(x, y + S);
    ctx.lineTo(x - A, y + S / 2); ctx.lineTo(x - A, y - S / 2); ctx.closePath();
    ctx.moveTo(x, y); ctx.lineTo(x - A, y - S / 2); ctx.moveTo(x, y); ctx.lineTo(x + A, y - S / 2);
    ctx.moveTo(x, y); ctx.lineTo(x, y + S);
  }
  function floor() {
    ctx.beginPath(); for (const c of cubes) hex(c.x, c.y);
    ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function wave(now) {
    const pos = -0.3 + ((now / 1000) % 7) / 7 * 1.6;
    for (const c of cubes) {
      const d = Math.abs(c.x / W * 0.7 + c.y / H * 0.3 - pos);
      if (d > 0.12) continue;
      ctx.beginPath(); hex(c.x, c.y);
      ctx.strokeStyle = `rgba(${L},${((1 - d / 0.12) * 0.10).toFixed(3)})`; ctx.stroke();
    }
  }
  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    floor(); wave(now);
    // pointer speed, smoothed: the lit area stretches along it and thins across it
    if (p && prev) { vx += (p.x - prev.x - vx) * 0.3; vy += (p.y - prev.y - vy) * 0.3; } else { vx *= 0.8; vy *= 0.8; }
    prev = p ? { ...p } : null;
    const sp = Math.hypot(vx, vy), ux = sp > 0.01 ? vx / sp : 1, uy = sp > 0.01 ? vy / sp : 0;
    const k = Math.min(sp / 18, 1) * STRETCH, ra = R * (1 + k), rb = R / (1 + k * 1.4);
    const reach = Math.min(1, Math.max(0, 1 - (now - moved - IDLE_WAIT) / IDLE_SHRINK));
    for (const c of cubes) {
      let t = 0;
      if (p) {
        const dx = c.x - p.x, dy = c.y - p.y, e = Math.hypot((dx * ux + dy * uy) / ra, (-dx * uy + dy * ux) / rb);
        if (e < reach) t = Math.cos(e * Math.PI / 2);
      }
      c.m = t < c.m ? Math.max(c.m * (reach < 1 ? 0.8 : FADE), t) : t;  // trail; quicker once the pointer rests
      c.v += (c.m - c.l) * SPRING; c.v *= DAMP; c.l += c.v;   // a soft spring lifts them
      if (c.m < 0.02 && Math.abs(c.l) < 0.02) continue;
      const o = Math.max(c.l, 0), x = c.x, y = c.y - LIFT * o, al = Math.min(1, Math.max(c.m, o));
      ctx.beginPath(); hex(x, y);
      ctx.strokeStyle = `rgba(${L},${((0.12 + 0.8 * al) * GLOW).toFixed(3)})`; ctx.stroke();
      if (o > 0.05) {
        ctx.beginPath(); ctx.moveTo(x, y - S); ctx.lineTo(x + A, y - S / 2); ctx.lineTo(x, y); ctx.lineTo(x - A, y - S / 2); ctx.closePath();
        ctx.fillStyle = `rgba(${L},${(0.14 * o).toFixed(3)})`; ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  }

  size(); addEventListener('resize', size);
  if (still) { floor(); addEventListener('resize', floor); return; }
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { p = { x: e.clientX, y: e.clientY }; moved = performance.now(); } });
  document.documentElement.addEventListener('mouseleave', () => { p = null; prev = null; });
  requestAnimationFrame(frame);
})();
