'use strict';
/* =========================================================
   PARTICLES (pooled)
   ========================================================= */
const Particles = {
  pool: [], max: 360, budget: 250,
  init() { for (let i = 0; i < this.max; i++) this.pool.push({ on: false }); },
  spawn(o) {
    let n = 0; for (const p of this.pool) if (p.on) n++; if (n >= this.budget) return null;
    for (const p of this.pool) if (!p.on) { p.on = true; p.x = o.x; p.y = o.y; p.vx = o.vx || 0; p.vy = o.vy || 0; p.life = p.max = o.life || 1; p.size = o.size || 1; p.c = o.c || '#fff'; p.c2 = o.c2 || null; p.type = o.type || 'dot'; p.g = o.g || 0; p.drag = o.drag === undefined ? .98 : o.drag; p.glow = o.glow || 0; p.fg = !!o.fg; p.rot = o.rot || 0; p.vr = o.vr || 0; p.ground = o.ground || 9999; p.screen = !!o.screen; return p; }
    return null;
  },
  burst(x, y, n, o) { for (let i = 0; i < n; i++) { const a = o.ang !== undefined ? o.ang + rnd(-o.spread, o.spread) : rnd(TAU), sp = rnd(o.smin || 20, o.smax || 80); this.spawn(Object.assign({}, o, { x: x + rnd(-(o.rx || 0), o.rx || 0), y: y + rnd(-(o.ry || 0), o.ry || 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rnd(o.lmin || .3, o.lmax || .8), size: o.size || rndi(1, 2) })); } },
  update(dt) {
    for (const p of this.pool) {
      if (!p.on) continue; p.life -= dt; if (p.life <= 0) { p.on = false; continue; }
      p.vy += p.g * dt; const d = Math.pow(p.drag, dt * 60); p.vx *= d; p.vy *= d; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.type === 'leaf') { p.vx += Math.sin(T * 3 + p.rot) * 8 * dt; }
      if (p.y > p.ground) { p.y = p.ground; p.vy *= -.3; p.vx *= .6; if (p.type === 'drop') p.life = Math.min(p.life, .05); }
    }
  },
  draw(fg, screen) {
    for (const p of this.pool) {
      if (!p.on || p.fg !== fg || p.screen !== !!screen) continue; const k = p.life / p.max;
      ctx.globalAlpha = p.type === 'smoke' ? k * .45 : Math.min(1, k * 2);
      const col = p.c2 ? mix(p.c, p.c2, 1 - k) : p.c;
      if (p.type === 'spark' || p.type === 'streak') { const l = Math.min(6, Math.hypot(p.vx, p.vy) * .03 + 1); pLine(col, p.x, p.y, p.x - p.vx * .02 * l, p.y - p.vy * .02 * l, 1); }
      else if (p.type === 'smoke') { pEll(col, p.x, p.y, p.size * (2 - k), p.size * (2 - k) * .8); }
      else if (p.type === 'star') { const s = Math.max(1, Math.round(p.size * k + .5)); P(col, p.x - s, p.y, s * 2 + 1, 1); P(col, p.x, p.y - s, 1, s * 2 + 1); }
      else if (p.type === 'leaf') { const s = Math.sin(p.rot) > 0 ? 2 : 1; P(col, p.x, p.y, s, 1); P(shade(p.c, -.2), p.x + s, p.y + 1, 1, 1); }
      else if (p.type === 'drop') { P(col, p.x, p.y, 1, 2); }
      else if (p.type === 'coin') { const s = Math.abs(Math.sin(p.rot)); P('#8a5a10', p.x - 2 * s - .5, p.y - 2, Math.max(1, 4 * s + 1), 5); P(col, p.x - 2 * s, p.y - 2, Math.max(1, 4 * s), 4); P('#fff6c0', p.x - s, p.y - 1, 1, 1); }
      else if (p.type === 'ring') { ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(Math.round(p.x), Math.round(p.y), p.size * (1.5 - k) * 6, 0, TAU); ctx.stroke(); }
      else P(col, p.x - (p.size >> 1), p.y - (p.size >> 1), p.size, p.size);
      if (p.glow) { ctx.globalAlpha = k * .25 * p.glow; pCirc(col, p.x, p.y, p.size + 2); }
    }
    ctx.globalAlpha = 1;
  },
  clear() { for (const p of this.pool) p.on = false; }
};
Particles.init();
/* floating combat text rendered at UI res */
const FloatText = {
  list: [],
  add(x, y, text, col = '#fff', size = 22, o = {}) { this.list.push({ x, y, text, col, size, t: 0, life: o.life || 1.1, vy: o.vy || -40, pop: o.pop || 1, outline: o.outline || '#1a0f14' }); },
  update(dt) { for (let i = this.list.length - 1; i >= 0; i--) { const f = this.list[i]; f.t += dt; f.y += f.vy * dt; f.vy *= .95; if (f.t > f.life) this.list.splice(i, 1); } },
  draw() {
    for (const f of this.list) {
      const k = f.t / f.life, s = f.size * (k < .12 ? lerp(1.6 * f.pop, 1, k / .12) : 1); g.globalAlpha = k > .7 ? 1 - (k - .7) / .3 : 1;
      const sx = f.x * 2, sy = f.y * 2; PFont.draw(g, f.text, sx, sy, Math.max(16, Math.round(s)), f.col, 'center', 'alphabetic', 'rgba(0,0,0,.5)', 4, f.outline);
    }
    g.globalAlpha = 1;
  },
  clear() { this.list.length = 0; }
};
