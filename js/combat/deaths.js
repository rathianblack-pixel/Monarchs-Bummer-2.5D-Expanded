'use strict';
/* =========================================================
   COMBAT — unique monster death animations (gore)
   ---------------------------------------------------------
   At the killing blow the monster is rendered once into an
   off-screen "snapshot". Each death style then animates that
   snapshot: cutting it into physics pieces, melting, crumbling
   into pixels, shattering, etc., with blood particles that
   splat onto the ground and leave growing pools.
   Usage (from combat):
     this.death = new Death(def, E)   // at the killing blow
     this.death.update(dt)            // every frame
     this.death.drawGround()          // before fighters (pools, piles)
     this.death.drawBody()            // in place of the monster
     this.death.drawFront()           // after fighters (flying blood)
   ========================================================= */
const DSW = 380, DSH = 330, DSX = 190, DSY = 310; // snapshot canvas + monster foot position inside it
const GORE_G = 560;                                  // gravity (low-res px / s²)
const BLOOD = {
  red: { c: '#b01818', d: '#5a0606', h: '#e04040' },
  dark: { c: '#7a0a10', d: '#380206', h: '#b02030' },
  green: { c: '#6ab828', d: '#2e5a10', h: '#b8f060' },
  rot: { c: '#5a6a20', d: '#262c0c', h: '#8a9a40' },
  ecto: { c: '#70f0c8', d: '#2a8a70', h: '#d0fff0' },
  purple: { c: '#7a1aa0', d: '#30083e', h: '#c060f0' },
  gold: { c: '#e0b020', d: '#7a5a08', h: '#fff0a0' },
  oil: { c: '#1a1820', d: '#060508', h: '#4a4858' },
  dust: { c: '#a89a80', d: '#5a5040', h: '#d8ccb0' },
  stone: { c: '#7a7a84', d: '#3a3a44', h: '#b0b0bc' }
};

/* ---------- gore sounds (synthesized) ---------- */
(function () {
  const L = SFX.lib, N = (...a) => SFX._n(...a), O = (...a) => SFX._o(...a);
  L.gore = (t, v, p) => { N(t, .28, 'lowpass', 700 * p, 1, .8 * v, .002, null, true); O(t, 'sine', 130 * p, 40, .22, .5 * v); N(t + .02, .12, 'bandpass', 2200 * p, 2, .3 * v); N(t + .06, .2, 'bandpass', 500 * p, 3, .35 * v); };
  L.squelch = (t, v, p) => { N(t, .22, 'bandpass', 420 * p, 4, .5 * v); N(t + .05, .18, 'bandpass', 900 * p, 5, .3 * v); O(t, 'sine', 260 * p, 70, .18, .3 * v); };
  L.splat = (t, v, p) => { N(t, .07, 'lowpass', 1500 * p, 1, .3 * v); N(t, .05, 'bandpass', 600 * p, 3, .2 * v); };
  L.spurt = (t, v, p) => { N(t, .16, 'bandpass', 800 * p, 3, .25 * v, .01); };
  L.crack = (t, v, p) => { for (let i = 0; i < 3; i++) N(t + i * .03, .04, 'highpass', 2400 * p, 1, .45 * v); O(t, 'square', 900 * p, 180, .06, .12 * v); };
  L.shatter = (t, v, p) => { for (let i = 0; i < 9; i++) N(t + i * .022 + Math.random() * .02, .05, 'bandpass', 3000 + Math.random() * 4000, 6, .3 * v); N(t, .3, 'highpass', 5000, 1, .25 * v); };
  L.thud = (t, v, p) => { O(t, 'sine', 90 * p, 30, .35, .9 * v); N(t, .25, 'lowpass', 400 * p, 1, .6 * v, .002, null, true); };
  L.clunk = (t, v, p) => { O(t, 'square', 220 * p, 90, .08, .2 * v); N(t, .1, 'bandpass', 1800 * p, 4, .35 * v); O(t, 'triangle', 640 * p, 600, .25, .12 * v); };
  L.sizzle = (t, v, p) => { N(t, .5, 'highpass', 4000 * p, 1, .18 * v, .05); };
})();

/* ---------- geometry helpers ---------- */
function polyCentroid(poly) { let x = 0, y = 0; for (const [a, b] of poly) { x += a; y += b; } return [x / poly.length, y / poly.length]; }
function clipHalf(poly, nx, ny, d) { // keep points with nx*x+ny*y <= d
  const out = []; for (let i = 0; i < poly.length; i++) {
    const A = poly[i], B = poly[(i + 1) % poly.length], da = nx * A[0] + ny * A[1] - d, db = nx * B[0] + ny * B[1] - d;
    if (da <= 0) out.push(A); if ((da < 0) !== (db < 0)) { const k = da / (da - db); out.push([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k]); }
  } return out;
}
function inPoly(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }

/* =========================================================
   Death instance
   ========================================================= */
class Death {
  constructor(def, E, st) {
    this.def = def; this.E = E; this.t = 0; this.ev = []; this.fx = [];
    this.X0 = Math.round(E.x + (E.kb || 0)); this.Y0 = CGY + (E.jy || 0); this.h = E.h;
    // snapshot
    const [c, x] = mkCanvas(DSW, DSH); const prev = useCtx(x); x.setTransform(1, 0, 0, 1, 0, 0);
    this.phase2 = !!(st && st.phase2);
    drawMonster(def, DSX, DSY, Object.assign({ t: T, sMul: 1.7, face: -1, low: true, expr: 'hurt' }, st || {}, { killer: undefined, flash: false, alpha: 1, walk: undefined, noThrone: true }));
    useCtx(prev); this.snap = c; this.img = x.getImageData(0, 0, DSW, DSH).data;
    let x0 = DSW, y0 = DSH, x1 = 0, y1 = 0; for (let v = 0; v < DSH; v += 1) for (let u = 0; u < DSW; u += 1) if (this.img[(v * DSW + u) * 4 + 3] > 20) { if (u < x0) x0 = u; if (u > x1) x1 = u; if (v < y0) y0 = v; if (v > y1) y1 = v; }
    if (x1 < x0) { x0 = DSX - 10; x1 = DSX + 10; y0 = DSY - 20; y1 = DSY; }
    this.b = { x0, y0, x1: x1 + 1, y1: y1 + 1, w: x1 + 1 - x0, h: y1 + 1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
    this.body = { on: true, ox: 0, oy: 0, rot: 0, pu: DSX, pv: DSY, sx: 1, sy: 1, alpha: 1, tint: null, tintA: 0, clip: null, shake: 0 };
    this.pieces = []; this.blood = []; this.decals = []; this.dust = []; this.pile = []; this.sprays = []; this.cracks = null; this.tints = {};
    this.col = BLOOD.red;
    const style = typeof weaponDeathStyle === 'function' ? weaponDeathStyle(def, st) : (DEATH_STYLES[def.id] || DEATH_STYLES['arch_' + def.arch] || DEATH_STYLES.arch_human);
    style(this);
  }
  /* ----- coordinate helpers ----- */
  wx(u) { return this.X0 + (u - DSX); } wy(v) { return this.Y0 + (v - DSY); }
  // u/v from fractions of the body bounds (fu: 0 left → 1 right, fv: 0 top → 1 feet)
  U(fu) { return this.b.x0 + this.b.w * fu; } V(fv) { return this.b.y0 + this.b.h * fv; }
  bodyPt(u, v) { const B = this.body, c = Math.cos(B.rot), s = Math.sin(B.rot), dx = (u - B.pu) * B.sx, dy = (v - B.pv) * B.sy; return [this.wx(B.pu) + B.ox + dx * c - dy * s, this.wy(B.pv) + B.oy + dx * s + dy * c]; }
  at(t, fn) { this.ev.push({ t, fn }); }
  every(t0, t1, step, fn) { for (let t = t0; t <= t1; t += step) this.at(t, fn); }
  sfx(n, o) { SFX.play(n, o); }
  tinted(col) { if (this.tints[col]) return this.tints[col]; const [c, x] = mkCanvas(DSW, DSH); x.drawImage(this.snap, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, DSW, DSH); return (this.tints[col] = c); }
  alphaAt(u, v) { u |= 0; v |= 0; if (u < 0 || v < 0 || u >= DSW || v >= DSH) return 0; return this.img[(v * DSW + u) * 4 + 3]; }
  /* ----- blood ----- */
  drop(x, y, vx, vy, o = {}) { if (this.blood.length > 900) return; const C = o.col || this.col; this.blood.push({ x, y, vx, vy, c: chance(.25) ? C.h : C.c, C, s: o.size || (chance(.3) ? 2 : 1), g: o.g === undefined ? GORE_G : o.g, ground: CGY + rnd(-2, 16), drag: o.drag || 0, splat: o.splat !== false }); }
  bleed(x, y, n, o = {}) { for (let i = 0; i < n; i++) { const a = o.ang !== undefined ? o.ang + rnd(-(o.spread || .6), o.spread || .6) : rnd(TAU), sp = rnd(o.smin || 40, o.smax || 180); this.drop(x + rnd(-(o.r || 0), o.r || 0), y + rnd(-(o.r || 0), o.r || 0), Math.cos(a) * sp, Math.sin(a) * sp, o); } }
  spray(o) { this.sprays.push(Object.assign({ t: 0, dur: 1, rate: 60, ang: -Math.PI / 2, spread: .25, smin: 80, smax: 160, pulse: 0, acc: 0 }, o)); }
  pool(x, r, o = {}) { const p = { type: 'pool', x, y: (o.y || CGY + 6) + rnd(-1, 1), r: 0, max: r, rate: o.rate || r * .8, C: o.col || this.col, delay: o.delay || 0 }; this.decals.push(p); return p; }
  splat(x, y, s, C) { if (this.decals.length > 260) { const i = this.decals.findIndex(d => d.type === 'splat'); if (i >= 0) this.decals.splice(i, 1); } this.decals.push({ type: 'splat', x, y, r: s, C }); }
  decal(o) { this.decals.push(o); }
  /* ----- cutting the body into pieces ----- */
  rect(pad = 2) { const b = this.b; return [[b.x0 - pad, b.y0 - pad], [b.x1 + pad, b.y0 - pad], [b.x1 + pad, b.y1 + pad], [b.x0 - pad, b.y1 + pad]]; }
  coverage(poly) { const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]); let n = 0; for (let v = Math.min(...ys); v < Math.max(...ys); v += 2) for (let u = Math.min(...xs); u < Math.max(...xs); u += 2) if (inPoly(u, v, poly) && this.alphaAt(u, v) > 20) n++; return n; }
  piece(poly, o = {}) {
    if (poly.length < 3 || this.coverage(poly) < (o.minCov || 3)) return null;
    const [cu, cv] = polyCentroid(poly); const [x, y] = this.bodyPt(cu, cv);
    const p = Object.assign({ poly: poly.map(([a, b]) => [a - cu, b - cv]), cu, cv, x, y, vx: 0, vy: 0, rot: this.body.rot, vr: 0, bounce: .3, fric: .9, ground: CGY + rnd(0, 14), bleed: 0, bleedRate: 40, rest: false, alpha: 1, fade: 0, img: null, noisy: null, hits: 0 }, o);
    this.pieces.push(p); return p;
  }
  cutGrid(cols, rows, jit = .3, tri = false, fn) {
    const b = this.b, cw = b.w / cols, ch = b.h / rows, V = [];
    for (let j = 0; j <= rows; j++) { V[j] = []; for (let i = 0; i <= cols; i++) { const edge = i === 0 || j === 0 || i === cols || j === rows; V[j][i] = [b.x0 + i * cw + (edge ? (i === 0 ? -2 : i === cols ? 2 : 0) : rnd(-jit, jit) * cw), b.y0 + j * ch + (edge ? (j === 0 ? -2 : j === rows ? 2 : 0) : rnd(-jit, jit) * ch)]; } }
    const polys = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = V[j][i], bb = V[j][i + 1], c = V[j + 1][i + 1], d = V[j + 1][i]; if (tri) { if ((i + j) % 2) { polys.push([a, bb, c]); polys.push([a, c, d]); } else { polys.push([a, bb, d]); polys.push([bb, c, d]); } } else polys.push([a, bb, c, d]); }
    this.body.on = false; const out = []; polys.forEach((pl, k) => { const p = this.piece(pl); if (p) { out.push(p); fn && fn(p, k); } }); return out;
  }
  // cut along a line through (u,v) with angle a (radians, in snapshot space) → [sideA, sideB]
  cutLine(u, v, a, polyIn) { const nx = -Math.sin(a), ny = Math.cos(a), d = nx * u + ny * v, base = polyIn || this.rect(); this.body.on = false; return [this.piece(clipHalf(base, nx, ny, d)), this.piece(clipHalf(base, -nx, -ny, -d))]; }
  // separate everything above v (snapshot) as the "head" piece; the rest stays as the body or becomes a piece
  cutAbove(v, bodyToo) { const r = this.rect(), top = clipHalf(r, 0, 1, v), bot = clipHalf(r, 0, -1, -v); const head = this.piece(top); if (bodyToo) { this.body.on = false; return [head, this.piece(bot)]; } this.body.clip = { v0: v }; return [head, null]; }
  // remove a piece's area from the body sprite (so a flying piece isn't also still drawn on the body)
  erase(p) { if (!p.img) this.bake(p); const x = this.snap.getContext('2d'); x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); p.poly.forEach(([a, b], i) => i ? x.lineTo(a + p.cu, b + p.cv) : x.moveTo(a + p.cu, b + p.cv)); x.closePath(); x.fill(); x.restore(); this.tints = {}; }
  /* ----- crumble into pixels ----- */
  disintegrate(o) { // o: { dir:'down'|'up', dur, mode:'fall'|'rise'|'blow', tint, step }
    const st = o.step || 2, list = []; const B = this.b;
    for (let v = Math.max(B.y0, Math.ceil(o.vmin || 0)); v < B.y1; v += st) for (let u = B.x0; u < B.x1; u += st) { const i = (v * DSW + u) * 4; if (this.img[i + 3] > 40) list.push({ u, v, c: o.tint ? (Array.isArray(o.tint) ? pick(o.tint) : o.tint) : rgb(this.img[i], this.img[i + 1], this.img[i + 2]) }); }
    this.dis = Object.assign({ t: 0, list, i: 0, st }, o); list.sort((a, b) => o.dir === 'up' ? b.v - a.v : a.v - b.v);
  }
  /* ----- frame update ----- */
  update(dt) {
    this.t += dt; const t = this.t;
    for (let i = this.ev.length - 1; i >= 0; i--) if (this.ev[i].t <= t) { const e = this.ev[i]; this.ev.splice(i, 1); e.fn(); }
    for (const f of this.fx) f.update && f.update(dt, t);
    // sprays
    for (let i = this.sprays.length - 1; i >= 0; i--) { const s = this.sprays[i]; s.t += dt; if (s.t > s.dur) { this.sprays.splice(i, 1); continue; }
      const k = 1 - s.t / s.dur, pul = s.pulse ? Math.max(0, Math.sin(s.t * s.pulse * TAU)) : 1; s.acc += dt * s.rate * k * pul;
      const [x, y] = s.from ? s.from() : [s.x, s.y]; const ang = typeof s.ang === 'function' ? s.ang() : s.ang;
      while (s.acc >= 1) { s.acc--; const a = ang + rnd(-s.spread, s.spread), sp = rnd(s.smin, s.smax) * (.5 + .5 * k); this.drop(x, y, Math.cos(a) * sp, Math.sin(a) * sp, { col: s.col }); }
      if (s.sound && pul > .95 && !s._snd) { s._snd = 1; this.sfx('spurt', { v: .5 }); } if (pul < .2) s._snd = 0; }
    // blood
    for (let i = this.blood.length - 1; i >= 0; i--) { const p = this.blood[i]; p.px = p.x; p.py = p.y; p.vy += p.g * dt; if (p.drag) { const d = Math.pow(1 - p.drag, dt * 60); p.vx *= d; p.vy *= d; } p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y >= p.ground && p.vy > 0) { if (p.splat) this.splat(p.x, p.ground, p.s * rnd(.8, 2.2), p.C); this.blood.splice(i, 1); } else if (p.y > 400 || p.x < -60 || p.x > 700) this.blood.splice(i, 1); }
    // pools grow
    for (const d of this.decals) if (d.type === 'pool') { if (d.delay > 0) d.delay -= dt; else d.r = Math.min(d.max, d.r + d.rate * dt * (1 - d.r / d.max * .7)); }
    // pieces
    for (const p of this.pieces) {
      if (p.fade) p.alpha = Math.max(0, p.alpha - dt * p.fade);
      if (p.bleed > 0) { p.bleed -= dt; p.bacc = (p.bacc || 0) + dt * p.bleedRate * (p.rest ? .25 : 1); while (p.bacc >= 1) { p.bacc--; this.drop(p.x + rnd(-2, 2), p.y + rnd(-2, 2), p.vx * .2 + rnd(-30, 30), p.vy * .2 - rnd(0, 50)); } }
      if (p.rest) continue;
      if (p.float) { p.vx *= Math.pow(.2, dt); p.vy = p.vy * Math.pow(.2, dt) + p.float * dt; }
      else p.vy += (p.g === undefined ? GORE_G : p.g) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const c = Math.cos(p.rot), s = Math.sin(p.rot); let my = -1e9; for (const [a, b] of p.poly) { const yy = a * s + b * c; if (yy > my) my = yy; }
      if (p.y + my >= p.ground) { p.y = p.ground - my;
        if (p.vy > 70) { if (p.hits < 3 && p.noisy) this.sfx(p.noisy, { v: clamp(p.vy / 400, .15, .7) }); p.hits++; if (this.col && p.splatHit) for (let k = 0; k < 6; k++) this.splat(p.x + rnd(-6, 6), p.ground + rnd(-1, 2), rnd(1, 3), this.col); p.vy *= -p.bounce; p.vx *= .6; p.vr = p.vr * .5 + p.vx * .01; }
        else { p.vy = 0; p.vx *= Math.pow(.02, dt); p.vr *= Math.pow(.01, dt);
          // topple onto the flattest side (no piece balances on a corner)
          if (p.flatW === undefined) { const xs = p.poly.map(q => q[0]), ys = p.poly.map(q => q[1]); p.flatW = Math.max(...xs) - Math.min(...xs) >= Math.max(...ys) - Math.min(...ys); }
          const base = p.flatW ? 0 : Math.PI / 2, tgt = base + Math.round((p.rot - base) / Math.PI) * Math.PI; p.rot += (tgt - p.rot) * Math.min(1, dt * 7);
          if (Math.abs(p.vx) < 2 && Math.abs(p.vr) < .05 && Math.abs(tgt - p.rot) < .02) p.rest = true; } }
      if (p.x < -40 || p.x > 680) p.rest = true;
    }
    // disintegration
    const D = this.dis; if (D) { D.t += dt; const want = Math.floor(D.list.length * clamp(D.t / D.dur, 0, 1));
      while (D.i < want) { const q = D.list[D.i++]; const [x, y] = this.bodyPt(q.u, q.v); if (this.dust.length > 2200) continue;
        if (D.mode === 'rise') this.dust.push({ x, y, vx: rnd(-10, 10) + (D.wind || 0), vy: -rnd(15, 45), c: q.c, life: rnd(.8, 1.8), max: 1.8, mode: 'rise', s: D.st });
        else if (D.mode === 'blow') this.dust.push({ x, y, vx: rnd(30, 90), vy: -rnd(5, 30), c: q.c, life: rnd(.8, 1.6), max: 1.6, mode: 'rise', s: D.st });
        else this.dust.push({ x, y, vx: rnd(-14, 14) + (D.spreadX || 0) * (q.u - DSX) / 40, vy: -rnd(0, 25), c: q.c, mode: 'fall', s: D.st, ground: CGY + rnd(-1, 8) - Math.max(0, 6 - Math.abs(q.u - DSX) / 6) * (D.heap || 0) }); }
      if (D.i < D.list.length) { const q = D.list[Math.min(D.i, D.list.length - 1)]; this.body.clip = D.dir === 'up' ? { v1: q.v } : { v0: Math.max(q.v, D.vmin || 0) }; } else this.body.on = false; }
    for (let i = this.dust.length - 1; i >= 0; i--) { const p = this.dust[i];
      if (p.mode === 'rise') { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx += Math.sin(t * 3 + i) * 6 * dt; if (p.life <= 0) this.dust.splice(i, 1); }
      else { p.vy += GORE_G * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.y >= p.ground) { p.y = p.ground; if (this.pile.length < 2400) this.pile.push(p); this.dust.splice(i, 1); } } }
    if (this.body.shake) this.body.shakeX = rnd(-1, 1) * this.body.shake; else this.body.shakeX = 0;
  }
  /* ----- drawing ----- */
  drawGround() {
    const c = ctx;
    for (const d of this.decals) {
      if (d.type === 'pool') { if (d.r < .5) continue; const r = d.r; pEll(d.C.d, d.x, d.y, r + 1.5, r * .32 + 1); pEll(d.C.c, d.x, d.y, r, r * .3); if (r > 4) { c.globalAlpha = .55; pEll(d.C.h, d.x - r * .3, d.y - r * .08, r * .25, r * .06 + .5); c.globalAlpha = 1; } }
      else if (d.type === 'splat') { const r = d.r; pEll(d.C.d, d.x, d.y, r + .6, r * .45 + .5); pEll(d.C.c, d.x, d.y, r, r * .4); }
      else if (d.type === 'scorch') { c.globalAlpha = .75; pEll('#0e0806', d.x, d.y, d.r, d.r * .28); c.globalAlpha = .5; pEll('#2a1a10', d.x, d.y, d.r * 1.3, d.r * .36); c.globalAlpha = 1; }
      else if (d.type === 'draw') d.draw();
    }
    for (const p of this.pile) P(p.c, p.x, p.y - p.s, p.s, p.s);
  }
  // render a piece once into its own little canvas: the sprite cut to the polygon, optional tint,
  // and a raw "wound" edge that only appears where the cut passes through flesh (opaque pixels)
  bake(p) {
    const xs = p.poly.map(q => q[0]), ys = p.poly.map(q => q[1]), x0 = Math.floor(Math.min(...xs)) - 2, y0 = Math.floor(Math.min(...ys)) - 2;
    const [c, x] = mkCanvas(Math.ceil(Math.max(...xs)) - x0 + 4, Math.ceil(Math.max(...ys)) - y0 + 4); x.translate(-x0, -y0);
    x.beginPath(); p.poly.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.save(); x.clip();
    x.drawImage(this.snap, -p.cu, -p.cv);
    x.globalCompositeOperation = 'source-atop';
    if (p.tint) { x.globalAlpha = p.tintA; x.fillStyle = p.tint; x.fillRect(x0, y0, c.width, c.height); x.globalAlpha = 1; }
    if (p.wound !== false && this.col) { x.strokeStyle = this.col.d; x.lineWidth = 3; x.stroke(); x.strokeStyle = this.col.c; x.lineWidth = 1; x.stroke(); }
    x.restore(); p.img = c; p.ix = x0; p.iy = y0;
  }
  drawPiece(p) {
    if (p.alpha <= 0) return; if (!p.img) this.bake(p);
    const c = ctx; c.save(); c.translate(Math.round(p.x), Math.round(p.y)); c.rotate(p.rot); c.globalAlpha = p.alpha; c.drawImage(p.img, p.ix, p.iy); c.restore();
  }
  drawBody() {
    const c = ctx, B = this.body;
    if (B.on && B.alpha > 0) {
      c.save(); c.translate(Math.round(this.wx(B.pu) + B.ox + (B.shakeX || 0)), Math.round(this.wy(B.pv) + B.oy)); c.rotate(B.rot); c.scale(B.sx, B.sy); c.globalAlpha = B.alpha;
      if (B.clip) { c.beginPath(); const v0 = B.clip.v0 !== undefined ? B.clip.v0 : 0, v1 = B.clip.v1 !== undefined ? B.clip.v1 : DSH; c.rect(-B.pu, v0 - B.pv, DSW, v1 - v0); c.clip(); }
      c.drawImage(this.snap, -B.pu, -B.pv);
      if (B.tint && B.tintA > 0) { c.globalAlpha = B.alpha * B.tintA; c.drawImage(this.tinted(B.tint), -B.pu, -B.pv); }
      if (this.cracks) { c.globalAlpha = B.alpha; const k = this.cracks.k; for (const cr of this.cracks.lines) { const n = Math.floor(cr.length * k); for (let i = 1; i < n; i++) { const [a, b] = cr[i - 1], [e, f] = cr[i], m = Math.ceil(Math.hypot(e - a, f - b)); for (let j = 0; j <= m; j++) { const u = a + (e - a) * j / m, v = b + (f - b) * j / m; if (this.alphaAt(u, v) > 20) P(this.cracks.col, u - B.pu, v - B.pv, 1, 1); } } } }
      c.restore();
    }
    for (const p of this.pieces) this.drawPiece(p);
    for (const f of this.fx) f.draw && f.draw();
  }
  drawFront() {
    const c = ctx;
    for (const p of this.blood) { if (Math.abs(p.vy) > 160 && p.px !== undefined) pLine(p.c, p.px, p.py, p.x, p.y, 1); else P(p.c, p.x, p.y, p.s, p.s); }
    for (const p of this.dust) { if (p.mode === 'rise') { c.globalAlpha = clamp(p.life / p.max * 1.4, 0, 1); P(p.c, p.x, p.y, p.s, p.s); c.globalAlpha = 1; } else P(p.c, p.x, p.y, p.s, p.s); }
  }
  /* ----- small reusable beats ----- */
  burst(fu, fv, n, o = {}) { const [x, y] = this.bodyPt(this.U(fu), this.V(fv)); this.bleed(x, y, n, o); }
  smoke(x, y, n, col = '#6a6058', o = {}) { for (let i = 0; i < n; i++) Particles.spawn({ x: x + rnd(-(o.r || 10), o.r || 10), y: y + rnd(-4, 4), vx: rnd(-30, 30), vy: -rnd(5, 30), life: rnd(.8, 1.6), c: col, type: 'smoke', size: rnd(2, 4), drag: .95 }); }
  tween(dur, fn, delay = 0, ease = Ease.outQ) { const f = { t0: this.t + delay, update: (dt, t) => { const k = clamp((t - f.t0) / dur, 0, 1); if (t >= f.t0 && !f.done) { fn(ease(k), k); if (k >= 1) f.done = true; } } }; this.fx.push(f); return f; }
  makeCracks(n, col = '#1a1a20') { const lines = []; for (let i = 0; i < n; i++) { let u = this.b.cx + rnd(-6, 6), v = this.b.cy + rnd(-8, 8); const a0 = rnd(TAU), L = [[u, v]]; let a = a0; for (let k = 0; k < 14; k++) { a += rnd(-.6, .6); u += Math.cos(a) * rnd(3, 7); v += Math.sin(a) * rnd(3, 7); L.push([u, v]); } lines.push(L); } this.cracks = { lines, k: 0, col }; }
}

/* =========================================================
   DEATH STYLES — one per monster (raiders reuse their base)
   D.U(fu)/D.V(fv) = snapshot coords from body-bound fractions.
   Monsters face LEFT (toward the hero), so +x = blown away.
   ========================================================= */
const DEATH_STYLES = {
  // Slime Rat — inflates, wobbles, then pops into slime gibs
  slime_rat(D) {
    D.col = BLOOD.green; const B = D.body; B.pu = D.b.cx; B.pv = DSY;
    D.tween(.5, (k, r) => { B.sx = 1 + k * .55 + Math.sin(r * 40) * .06; B.sy = 1 + k * .45 + Math.cos(r * 37) * .06; B.tint = '#a8f060'; B.tintA = k * .35; }, 0, Ease.inQ);
    D.sfx('squeak'); D.at(.52, () => { D.sfx('squelch'); D.sfx('gore', { v: .6 }); Cam.shake(.3);
      D.cutGrid(4, 3, .35, false, p => { p.vx = rnd(-120, 220); p.vy = -rnd(120, 300); p.vr = rnd(-14, 14); p.bleed = .8; p.splatHit = true; });
      D.burst(.5, .5, 90, { smin: 60, smax: 260 }); D.pool(D.X0, 16); D.pool(D.X0 + 26, 8, { delay: .3 }); });
  },
  // Angry Goose — head flies off, neck fountains, body wobbles and keels over in a cloud of feathers
  goose(D) {
    const B = D.body, hv = D.V(.42), hu = D.U(.42);
    D.sfx('honk', { v: .8 }); D.sfx('gore');
    const [head] = D.cutAbove(hv); // whole top including head/neck tip
    if (head) { head.vx = 80; head.vy = -260; head.vr = 12; head.bleed = 1.2; head.splatHit = true; }
    const neck = () => D.bodyPt(hu, hv + 1);
    D.spray({ from: neck, ang: () => -Math.PI / 2 + .35 + B.rot, spread: .22, rate: 140, dur: 1.6, pulse: 2.4, smin: 120, smax: 220, sound: 1 });
    D.tween(1.2, k => { B.rot = Math.sin(k * 12) * .08 * (1 - k); B.ox = Math.sin(k * 20) * 2 * (1 - k); });
    D.tween(.5, k => { B.rot = k * 1.45; }, 1.2, Ease.inQ); D.at(1.7, () => { D.sfx('thud', { v: .6 }); Cam.shake(.2); D.pool(D.X0 + 12, 22); });
    for (let i = 0; i < 45; i++) Particles.spawn({ x: D.X0 + rnd(-14, 14), y: CGY - rnd(10, 40), vx: rnd(-50, 90), vy: -rnd(30, 120), g: 30, life: rnd(2, 3.5), c: chance(.8) ? '#f4f0e8' : '#c8c0b0', type: 'leaf', rot: rnd(6), vr: rnd(-4, 4), drag: .96, ground: CGY + rnd(0, 14) });
  },
  // Drunk Peasant — keels over backwards; a pool spreads from his head
  peasant(D) {
    const B = D.body; D.sfx('moan', { v: .7 });
    D.tween(.3, k => { B.ox = k * 5; B.rot = k * .15; });
    D.tween(.55, k => { B.rot = .15 + k * 1.42; }, .3, Ease.inQ);
    D.at(.85, () => { D.sfx('thud'); Cam.shake(.3); D.smoke(D.X0 + 30, CGY, 8, '#8a7a60'); const [hx] = D.bodyPt(DSX, D.V(.08)); D.pool(hx, 34, { rate: 12 }); D.bleed(hx, CGY - 2, 30, { ang: -Math.PI / 2, spread: 1.2, smin: 30, smax: 110 }); });
    D.at(.86, () => { for (let i = 0; i < 10; i++) Particles.spawn({ x: D.X0 - 8, y: CGY - 14, vx: rnd(-70, 70), vy: -rnd(40, 140), g: 400, life: 1, c: '#a8d0b0', type: 'spark', ground: CGY + 6 }); SFX.play('shatter', { v: .4 }); });
    D.at(.9, () => D.spray({ from: () => D.bodyPt(DSX, D.V(.1)), ang: -Math.PI / 2, spread: .9, rate: 30, dur: 2.5, smin: 10, smax: 40 }));
  },
  // Rabid Raccoon — sliced diagonally; the top half slides off its own body
  raccoon(D) {
    D.sfx('meow', { v: .6 }); D.sfx('gore');
    const [top, bot] = D.cutLine(D.b.cx, D.b.cy, -.45);
    if (top) { top.vx = 75; top.vy = -110; top.vr = 2.2; top.bleed = 1.8; top.splatHit = true; }
    if (bot) { bot.vx = -10; bot.vy = -20; bot.vr = -.4; bot.bleed = 2; }
    D.spray({ from: () => bot ? [bot.x, bot.y - 4] : [D.X0, CGY - 10], ang: -Math.PI / 2 - .5, spread: .3, rate: 120, dur: 1.4, pulse: 2, smin: 90, smax: 170, sound: 1 });
    D.pool(D.X0 + 6, 20, { delay: .4 });
  },
  // Sir Barnaby — drops to his knees, then loses his head; the neck fountains as he topples
  barnaby(D) {
    const B = D.body, hv = D.V(.37);
    D.tween(.35, k => { B.sy = 1 - k * .14; B.ox = k * 4; });
    D.at(.45, () => { D.sfx('slash'); D.sfx('gore'); Cam.shake(.5); Post.doFlash(.3, '#ff2020'); TimeFX.slowmo(.4, .3);
      const [head] = D.cutAbove(hv); if (head) { head.vx = 110; head.vy = -330; head.vr = 9; head.bleed = 2; head.splatHit = true; head.noisy = 'clunk'; }
      D.spray({ from: () => D.bodyPt(D.b.cx, hv + 2), ang: () => -Math.PI / 2 + B.rot, spread: .2, rate: 220, dur: 2.6, pulse: 1.6, smin: 140, smax: 260, sound: 1 }); });
    D.tween(.6, k => { B.rot = -k * 1.5; }, 1.3, Ease.inQ);
    D.at(1.9, () => { D.sfx('thud', { v: 1 }); Cam.shake(.5); D.smoke(D.X0 - 30, CGY, 14, '#8a7a60', { r: 30 }); D.pool(D.X0 - 50, 40, { rate: 16 }); });
  },
  // Goblin Poacher — blown apart into flying chunks
  goblin(D) {
    D.sfx('gore'); D.sfx('squelch', { v: .6 }); Cam.shake(.4);
    D.cutGrid(3, 3, .35, false, p => { p.vx = rnd(20, 260); p.vy = -rnd(100, 320); p.vr = rnd(-16, 16); p.bleed = 1.4; p.splatHit = true; });
    D.burst(.4, .4, 110, { ang: -.3, spread: 1.1, smin: 80, smax: 300 });
    D.pool(D.X0 + 20, 22, { delay: .4 }); D.pool(D.X0 + 60, 12, { delay: .7 });
  },
  // Zombie Wolf — rots and melts into a bubbling puddle, leaving bones
  zwolf(D) {
    D.col = BLOOD.rot; const B = D.body; B.pu = D.b.cx; D.sfx('growl', { v: .6 }); D.sfx('sizzle');
    D.tween(1.9, k => { B.sy = 1 - k * .93; B.sx = 1 + k * .55; B.tint = '#2a3010'; B.tintA = k * .7; B.shake = (1 - k) * 1; }, .1, Ease.inQ);
    D.every(.1, 1.8, .06, () => { const [x, y] = D.bodyPt(D.U(rnd(.1, .9)), D.V(rnd(.3, .9))); D.drop(x, y, rnd(-20, 20), rnd(-10, 20)); if (chance(.3)) Particles.spawn({ x, y, vx: rnd(-5, 5), vy: -rnd(8, 20), life: 1.2, c: '#8a9a40', type: 'smoke', size: 2, drag: .95 }); });
    D.pool(D.X0, 34, { rate: 18 });
    D.at(1.6, () => { D.sfx('squelch'); for (let i = 0; i < 5; i++) { const bx = D.X0 + rnd(-26, 26), by = CGY + rnd(2, 10), a = rnd(-.4, .4), l = rnd(5, 9); D.decal({ type: 'draw', draw: () => { pLine('#d8d0b8', bx - Math.cos(a) * l, by - Math.sin(a) * l, bx + Math.cos(a) * l, by + Math.sin(a) * l, 2); P('#e8e0c8', bx - Math.cos(a) * l - 1, by - Math.sin(a) * l - 1, 3, 3); P('#e8e0c8', bx + Math.cos(a) * l - 1, by + Math.sin(a) * l - 1, 3, 3); } }); } });
  },
  // Bullying Sprite — swatted out of the air and splattered on the ground like a bug
  bsprite(D) {
    D.col = BLOOD.green; const B = D.body; B.pu = D.b.cx; D.sfx('laugh', { v: .5 });
    const wings = []; D.at(.05, () => { for (let i = 0; i < 2; i++) wings.push(Particles.spawn({ x: D.X0 + (i ? 8 : -8), y: CGY - D.h * .7, vx: (i ? 40 : -20), vy: -40, g: 25, life: 3, c: '#d0f8e0', type: 'leaf', rot: 0, vr: 4, drag: .95, ground: CGY + 8, size: 2 })); });
    D.tween(.28, k => { B.oy = k * (DSY - D.b.y1 + 2); B.rot = k * .6; }, 0, Ease.inQ);
    D.at(.28, () => { D.sfx('squelch'); D.sfx('splat'); Cam.shake(.35); B.rot = 0; B.oy = 0; B.pv = DSY; B.sy = .14; B.sx = 1.9;
      D.bleed(D.X0, CGY - 2, 120, { ang: -Math.PI / 2, spread: 1.5, smin: 60, smax: 240 }); for (let i = 0; i < 16; i++) D.splat(D.X0 + rnd(-40, 40), CGY + rnd(-1, 10), rnd(2, 5), D.col); D.pool(D.X0, 26); });
  },
  // Cursed Timberwolf — cut clean in half at the waist; the top slides off
  twolf(D) {
    D.sfx('slash'); D.sfx('gore'); Cam.shake(.4);
    const [top, bot] = D.cutLine(D.b.cx, D.V(.48), 0);
    if (top) { top.vx = 70; top.vy = -120; top.vr = 2.6; top.bleed = 2; top.splatHit = true; }
    if (bot) { bot.vy = -10; bot.vr = .2; bot.bleed = 2.4; }
    D.spray({ from: () => bot ? [bot.x, bot.y - 6] : [D.X0, CGY - 14], ang: -Math.PI / 2 + .2, spread: .35, rate: 150, dur: 1.6, pulse: 2.2, smin: 110, smax: 200, sound: 1 });
    D.pool(D.X0, 24, { delay: .3 }); D.pool(D.X0 + 40, 14, { delay: .8 });
  },
  // Gloomfang — chains snap, he chokes on dark blood, then bursts apart
  gloomfang(D) {
    D.col = BLOOD.purple; const B = D.body; D.sfx('growl'); B.shake = 1.5;
    for (let i = 0; i < 18; i++) Particles.spawn({ x: D.X0 + rnd(-30, 30), y: CGY - rnd(10, 60), vx: rnd(-140, 140), vy: -rnd(40, 200), g: 500, life: 1.2, c: '#c0c0d0', type: 'spark', ground: CGY + 6 }); D.sfx('clunk');
    D.spray({ from: () => D.bodyPt(D.U(.08), D.V(.45)), ang: Math.PI * .6, spread: .3, rate: 60, dur: .9, smin: 30, smax: 80 });
    D.tween(.9, k => { B.sy = 1 - k * .1; B.sx = 1 + k * .08; B.tint = '#ff40ff'; B.tintA = Math.max(0, Math.sin(k * 30)) * .3; });
    D.at(.95, () => { D.sfx('boom', { v: .8 }); D.sfx('gore'); D.sfx('squelch'); Cam.shake(.9); Post.doFlash(.4, '#c060ff'); TimeFX.slowmo(.5, .3);
      D.cutGrid(5, 4, .4, false, p => { p.vx = rnd(-160, 320); p.vy = -rnd(120, 420); p.vr = rnd(-12, 12); p.bleed = 2; p.splatHit = true; });
      D.burst(.5, .5, 260, { smin: 80, smax: 380 }); D.pool(D.X0, 46, { rate: 24 }); D.pool(D.X0 + 70, 20, { delay: .5 }); D.pool(D.X0 - 50, 16, { delay: .7 });
      for (let i = 0; i < 20; i++) Particles.spawn({ x: D.X0 + rnd(-30, 30), y: CGY - rnd(10, 60), vx: rnd(-30, 30), vy: -rnd(10, 40), life: rnd(1.5, 3), c: '#a060e0', c2: '#200830', type: 'smoke', size: 3, glow: 1 }); });
  },
  // Skeleton Archer — collapses into a clattering heap of bones; the skull rolls away
  skarcher(D) {
    D.col = null; D.sfx('rattle', { v: 1 });
    const hv = D.V(.36);
    const [skull] = D.cutAbove(hv); if (skull) { skull.vx = 60; skull.vy = -120; skull.vr = 6; skull.bounce = .45; skull.noisy = 'clunk'; skull.wound = false; }
    D.at(.12, () => { D.body.clip = null; const r = D.rect(); const body = clipHalf(r, 0, -1, -hv); D.body.on = false;
      const b = D.b, cols = 3, rows = 5; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const u0 = b.x0 + b.w * i / cols, u1 = b.x0 + b.w * (i + 1) / cols, v0 = hv + (b.y1 - hv) * j / rows, v1 = hv + (b.y1 - hv) * (j + 1) / rows;
        const p = D.piece([[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([a, c]) => [a + rnd(-1, 1), c + rnd(-1, 1)]), { minCov: 2 }); if (p) { p.vx = rnd(-50, 70); p.vy = -rnd(0, 90); p.vr = rnd(-8, 8); p.bounce = .45; p.noisy = chance(.5) ? 'rattle' : 'clunk'; p.wound = false; } } });
    D.at(.5, () => D.smoke(D.X0, CGY, 10, '#a89a80', { r: 20 }));
  },
  // Moldy Mummy — bandages unravel and fly off while it crumbles into a heap of sand
  mummy(D) {
    D.col = BLOOD.rot; D.sfx('moan');
    const rib = []; for (let i = 0; i < 7; i++) rib.push({ x: D.X0 + rnd(-8, 8), y: CGY - rnd(14, D.h * .9), vx: rnd(20, 60), vy: -rnd(10, 40), ph: rnd(6), l: rnd(18, 28), t: -i * .1 });
    D.fx.push({ update: dt => rib.forEach(r => { r.t += dt; if (r.t < 0) return; r.vx *= Math.pow(.5, dt); r.vy = Math.min(r.vy + 30 * dt, 14); r.x += r.vx * dt; r.y = Math.min(r.y + r.vy * dt, CGY + 6); r.ph += dt * 6; }), draw: () => rib.forEach(r => { if (r.t < 0) return; const flat = clamp((r.y - (CGY - 2)) / 8, 0, 1); for (let k = 0; k < r.l; k++) { const yy = r.y + Math.sin(r.ph - k * .35) * 2.2 * (1 - flat); P(k % 5 === 0 ? '#a89a78' : '#d8ccaa', r.x - k, yy, 1, 2); } }) });
    D.every(.1, 1.4, .1, () => { const [x, y] = D.bodyPt(D.U(rnd(.2, .8)), D.V(rnd(.2, .8))); D.drop(x, y, rnd(-30, 30), rnd(-20, 10)); });
    D.disintegrate({ dir: 'down', dur: 1.6, mode: 'fall', heap: 1, step: 2 }); D.at(.3, () => D.sfx('rattle', { v: .5 }));
    D.pool(D.X0, 18, { delay: .8, rate: 8 }); D.at(1, () => D.smoke(D.X0, CGY - 6, 12, '#b8a888', { r: 20 }));
  },
  // Necromancer Apprentice — the stolen souls rip out of him; he bleeds from the eyes and crumbles to ash
  necro(D) {
    D.col = BLOOD.dark; const B = D.body, top = DSY - D.h; D.sfx('wail', { v: .6 }); B.shake = 1;
    for (let i = 0; i < 7; i++) D.at(i * .1, () => { for (let k = 0; k < 8; k++) Particles.spawn({ x: D.X0 + rnd(-6, 6), y: CGY - D.h * .6 + rnd(-6, 6), vx: rnd(-60, 60), vy: -rnd(60, 140), life: rnd(.8, 1.4), c: '#c080ff', c2: '#301040', type: 'smoke', size: 3, glow: 1, drag: .97 }); });
    D.spray({ from: () => D.bodyPt(DSX - 3, top + D.h * .14), ang: -Math.PI / 2 - .6, spread: .4, rate: 70, dur: 1.2, smin: 40, smax: 110 });
    D.spray({ from: () => D.bodyPt(DSX - 3, top + D.h * .2), ang: Math.PI / 2, spread: .3, rate: 40, dur: 1.2, smin: 10, smax: 40 });
    D.tween(1, k => { B.tint = '#6a6a70'; B.tintA = k * .75; });
    D.at(1, () => { D.sfx('sizzle'); D.sfx('rattle', { v: .4 }); B.shake = 0; D.disintegrate({ dir: 'down', dur: 1, mode: 'fall', heap: 1.4, tint: ['#4a4a50', '#5a5a60', '#6a6a70', '#3a3a40'], step: 2 }); });
    D.pool(D.X0 - 2, 20, { delay: .5, rate: 10 });
  },
  // Grave Wraith — torn into ectoplasm: wisps rise while glowing goo rains down
  wraith(D) {
    D.col = BLOOD.ecto; D.sfx('wail');
    D.disintegrate({ dir: 'up', dur: 1.4, mode: 'rise', step: 2 });
    D.every(0, 1.3, .05, () => { const [x, y] = D.bodyPt(D.U(rnd(.2, .8)), D.V(rnd(.2, .8))); D.drop(x, y, rnd(-40, 40), rnd(-60, 0)); });
    D.burst(.5, .4, 60, { smin: 50, smax: 160 }); D.pool(D.X0, 26, { delay: .4, rate: 14 });
    D.decal({ type: 'draw', draw: () => { ctx.globalAlpha = .18 + Math.sin(T * 3) * .06; pEll('#80ffd0', D.X0, CGY + 6, 34, 9); ctx.globalAlpha = 1; } });
  },
  // Lich King Timmy — crown and skull tumble off; the rest crumbles into bones and blue soul-fire
  timmy(D) {
    D.col = BLOOD.dust; D.sfx('wail', { v: .5 }); D.sfx('rattle');
    const s = 1.7 * (D.def.scale || 1), x0 = D.X0, ph2 = D.phase2;
    if (!ph2) D.decal({ type: 'draw', draw: () => drawThrone(x0, CGY, s, 0) });
    if (ph2) for (let i = 0; i < 14; i++) Particles.spawn({ x: x0 + rnd(-40, 40), y: CGY - 40 * s + rnd(-14, 14), vx: rnd(-40, 40), vy: -rnd(0, 60), g: 400, life: 2, c: '#a8e0f8', type: 'spark', ground: CGY + rnd(0, 10) });
    const hv = D.V(.3); const [head] = D.cutAbove(hv); if (head) { head.vx = 70; head.vy = -200; head.vr = 5; head.bounce = .5; head.noisy = 'clunk'; head.wound = false; }
    D.at(.2, () => { D.disintegrate({ dir: 'down', dur: 1.5, mode: 'fall', heap: 1.6, step: 2, vmin: hv }); });
    D.every(.2, 1.7, .1, () => { for (let k = 0; k < 3; k++) Particles.spawn({ x: D.X0 + rnd(-14, 14), y: CGY - rnd(0, D.h * .6), vx: rnd(-10, 10), vy: -rnd(30, 70), life: rnd(.6, 1.2), c: '#a0e0ff', c2: '#1a3060', type: 'smoke', size: 2, glow: 1 }); });
    D.at(1.8, () => { D.sfx('shatter', { v: .5 }); D.smoke(D.X0, CGY, 14, '#c8c0b0', { r: 24 }); });
  },
  // Rune Mimic — the lid is blown off, teeth and coins spill out, and it bleeds out like a gutted fish
  mimic(D) {
    D.sfx('chomp'); D.sfx('gore'); Cam.shake(.4);
    const [lid, base] = D.cutLine(D.b.cx, D.V(.45), .08);
    if (lid) { lid.vx = 90; lid.vy = -380; lid.vr = 9; lid.noisy = 'clunk'; lid.bleed = .6; lid.splatHit = true; }
    if (base) { base.vr = .1; }
    for (let i = 0; i < 14; i++) Particles.spawn({ x: D.X0 + rnd(-8, 8), y: CGY - D.h * .5, vx: rnd(-90, 120), vy: -rnd(100, 260), g: 500, life: 2.5, c: '#f0c040', type: 'coin', rot: rnd(6), vr: 14, ground: CGY + rnd(0, 12) });
    for (let i = 0; i < 8; i++) Particles.spawn({ x: D.X0 + rnd(-10, 10), y: CGY - D.h * .5, vx: rnd(-80, 120), vy: -rnd(60, 200), g: 500, life: 2.5, c: '#f8f4e8', type: 'dot', size: 2, ground: CGY + rnd(0, 12) });
    D.spray({ from: () => base ? [base.x, base.y - 10] : [D.X0, CGY - 16], ang: -Math.PI / 2, spread: .5, rate: 140, dur: 1.5, pulse: 1.8, smin: 90, smax: 200, sound: 1 });
    D.pool(D.X0, 30, { delay: .5, rate: 14 });
  },
  // Pressure Plate Gremlin — triggers its own bomb: sizzle, flash, gibs, scorch mark
  gremlin(D) {
    const B = D.body; D.sfx('laugh', { v: .6 }); D.sfx('sizzle'); B.shake = 1.4;
    D.tween(.55, k => { B.tint = '#ff3010'; B.tintA = (Math.sin(k * 40) * .5 + .5) * (.3 + k * .5); B.sx = B.sy = 1 + k * .1; });
    D.every(0, .5, .04, () => Particles.spawn({ x: D.X0 + rnd(-6, 6), y: CGY - D.h * .9, vx: rnd(-40, 40), vy: -rnd(40, 100), g: 200, life: .4, c: '#ffd040', type: 'spark' }));
    D.at(.58, () => { D.sfx('boom', { v: 1 }); D.sfx('gore'); Cam.shake(.9); Post.doFlash(.5, '#ffd080');
      D.cutGrid(4, 4, .45, false, p => { const a = Math.atan2(p.cv - D.b.cy, p.cu - D.b.cx); p.vx = Math.cos(a) * rnd(150, 360) + 60; p.vy = Math.sin(a) * rnd(150, 300) - 200; p.vr = rnd(-20, 20); p.bleed = 1; p.splatHit = true; p.tint = '#1a0800'; p.tintA = .45; });
      D.burst(.5, .5, 160, { smin: 100, smax: 380 }); D.decal({ type: 'scorch', x: D.X0, y: CGY + 6, r: 34 }); D.pool(D.X0 + 30, 12, { delay: .5 });
      D.smoke(D.X0, CGY - 16, 26, '#3a3030', { r: 20 }); Particles.burst(D.X0, CGY - 16, 40, { c: '#fff0a0', c2: '#ff5010', type: 'spark', smin: 80, smax: 320, lmin: .2, lmax: .6 }); });
  },
  // Misdirection Sprite — freezes, cracks like a mirror and shatters into glittering shards
  msprite(D) {
    D.col = BLOOD.gold; const B = D.body; D.makeCracks(7, '#ffffff'); B.tint = '#ffffff'; D.sfx('crack');
    D.tween(.5, k => { D.cracks.k = k; B.tintA = k * .35; });
    D.at(.55, () => { D.sfx('shatter'); Cam.shake(.3); D.cracks = null; D.cutGrid(5, 5, .4, true, p => { p.vx = (p.cu - D.b.cx) * 4 + rnd(10, 60); p.vy = (p.cv - D.b.cy) * 3 - rnd(40, 140); p.vr = rnd(-10, 10); p.g = 380; p.fade = .45; p.noisy = chance(.3) ? 'crack' : null; p.wound = false; p.tint = '#ffffff'; p.tintA = .25; });
      D.burst(.5, .5, 70, { smin: 40, smax: 200 }); for (let i = 0; i < 30; i++) Particles.spawn({ x: D.X0 + rnd(-16, 16), y: CGY - D.h * .6 + rnd(-16, 16), vx: rnd(-60, 60), vy: rnd(-60, 30), life: rnd(.6, 1.4), c: '#fff8c0', type: 'star', size: 2 }); D.pool(D.X0, 14, { delay: .5 }); });
  },
  // Doom Gauntlet — sparks and black oil spurt from the joints, then it falls apart finger by finger
  gauntlet(D) {
    D.col = BLOOD.oil; const B = D.body; D.sfx('clank'); B.shake = 1.2;
    D.every(0, .7, .07, () => { const [x, y] = D.bodyPt(D.U(rnd(.1, .9)), D.V(rnd(.1, .9))); Particles.burst(x, y, 5, { c: '#fff0c0', c2: '#ff8020', type: 'spark', smin: 60, smax: 200, lmin: .2, lmax: .5 }); D.bleed(x, y, 6, { smin: 40, smax: 120 }); if (chance(.4)) D.sfx('clunk', { v: .3 }); });
    D.at(.75, () => { D.sfx('clank'); D.sfx('crack'); Cam.shake(.5); B.shake = 0; D.cutGrid(3, 3, .3, false, p => { p.vx = rnd(-60, 160); p.vy = -rnd(60, 220); p.vr = rnd(-6, 6); p.bounce = .25; p.noisy = 'clunk'; p.bleed = 1.4; p.bleedRate = 25; p.wound = true; }); D.pool(D.X0, 30, { rate: 16 }); D.smoke(D.X0, CGY - 10, 14, '#4a4a54'); });
    D.every(.8, 2.4, .12, () => Particles.spawn({ x: D.X0 + rnd(-20, 30), y: CGY - rnd(0, 10), vx: rnd(-5, 5), vy: -rnd(10, 30), life: 1.4, c: '#a050ff', c2: '#200830', type: 'smoke', size: 2, glow: 1 }));
  },
  // Minotaur with Anxiety — staggers, horn snaps off, chest wound gushes, falls flat on its face
  minotaur(D) {
    const B = D.body, top = DSY - D.h; D.sfx('growl'); D.sfx('crack');
    D.tween(.5, k => { B.ox = k * 10; B.rot = k * .12; });
    const horn = D.piece([[D.U(0), top - 4], [D.U(.38), top - 4], [D.U(.38), top + D.h * .12], [D.U(0), top + D.h * .12]], { minCov: 4 });
    if (horn) { horn.vx = -60; horn.vy = -260; horn.vr = -10; horn.noisy = 'clunk'; horn.wound = false; D.erase(horn); }
    D.spray({ from: () => D.bodyPt(DSX - 8, top + D.h * .45), ang: () => Math.PI + .4 + B.rot, spread: .25, rate: 120, dur: 2.4, pulse: 1.4, smin: 80, smax: 170, sound: 1 });
    D.tween(.7, k => { B.rot = .12 - k * 1.7; }, .6, Ease.inQ);
    D.at(1.3, () => { D.sfx('thud', { v: 1.2 }); D.sfx('boom', { v: .5 }); Cam.shake(.8); D.smoke(D.X0 - 50, CGY, 24, '#8a7a60', { r: 50 }); D.pool(D.X0 - 60, 54, { rate: 18 }); D.bleed(D.X0 - 60, CGY - 4, 60, { ang: -Math.PI / 2, spread: 1.4, smin: 40, smax: 160 }); });
  },
  // Dread Knight — the helm pops off and the empty armour clatters down, pouring blood
  dknight(D) {
    D.col = BLOOD.dark; const hv = D.V(.34); D.sfx('clank');
    const [helm] = D.cutAbove(hv); if (helm) { helm.vx = 70; helm.vy = -220; helm.vr = 7; helm.noisy = 'clunk'; helm.bounce = .4; helm.bleed = .8; }
    D.spray({ from: () => D.bodyPt(D.b.cx, hv + 2), ang: -Math.PI / 2, spread: .3, rate: 160, dur: .7, smin: 120, smax: 220, sound: 1 });
    D.at(.75, () => { D.body.clip = null; const b = D.b; D.body.on = false; for (let j = 0; j < 4; j++) { const v0 = hv + (b.y1 - hv) * j / 4, v1 = hv + (b.y1 - hv) * (j + 1) / 4; const p = D.piece([[b.x0 - 2, v0], [b.x1 + 2, v0], [b.x1 + 2, v1], [b.x0 - 2, v1]], { minCov: 3 }); if (p) { p.vx = rnd(-40, 60); p.vy = -rnd(0, 60); p.vr = rnd(-3, 3); p.bounce = .2; p.noisy = 'clunk'; p.bleed = 2.2; p.bleedRate = 50; } }
      D.sfx('clank'); D.pool(D.X0, 36, { rate: 15 }); });
    for (let i = 0; i < 2; i++) D.at(.2 + i * .3, () => Particles.spawn({ x: D.X0 - 4, y: CGY - D.h * .8, vx: rnd(-10, 10), vy: -rnd(10, 30), life: 1.2, c: '#ff3020', c2: '#200404', type: 'smoke', size: 2, glow: 1 }));
  },
  // Gargoyle — turns to plain stone, cracks spread, and it bursts into rubble
  gargoyle(D) {
    D.col = BLOOD.stone; const B = D.body; D.makeCracks(8, '#1a1a22'); B.tint = '#8a8a94'; D.sfx('crack');
    D.tween(.8, k => { D.cracks.k = k; B.tintA = k * .55; B.shake = k * .8; });
    D.every(.1, .8, .2, () => D.sfx('crack', { v: .4 }));
    D.at(.85, () => { D.sfx('boom', { v: .6 }); D.sfx('rattle'); Cam.shake(.6); D.cracks = null; D.cutGrid(4, 4, .45, true, p => { p.vx = rnd(-80, 180); p.vy = -rnd(60, 240); p.vr = rnd(-8, 8); p.bounce = .25; p.noisy = chance(.35) ? 'clunk' : null; p.wound = false; p.tint = '#8a8a94'; p.tintA = .55; });
      D.smoke(D.X0, CGY - 14, 30, '#9a9aa4', { r: 26 }); for (let i = 0; i < 40; i++) D.drop(D.X0 + rnd(-14, 14), CGY - rnd(5, 40), rnd(-120, 160), -rnd(40, 200), { col: BLOOD.stone }); });
  },
  // Dark Sorcerer — his spell backfires: sucked into a pinpoint, then bursts into a red mist
  sorcerer(D) {
    const B = D.body; B.pu = D.b.cx; B.pv = D.b.cy; D.sfx('charge');
    D.tween(.6, k => { B.sx = 1 - k * .85; B.sy = 1 - k * .85; B.rot = k * 4; B.tint = '#8020c0'; B.tintA = k * .7; }, 0, Ease.inQ);
    D.every(0, .55, .03, () => { const a = rnd(TAU), r = rnd(30, 60); Particles.spawn({ x: D.X0 + Math.cos(a) * r, y: D.wy(D.b.cy) + Math.sin(a) * r, vx: -Math.cos(a) * r * 2, vy: -Math.sin(a) * r * 2, life: .45, c: '#c060ff', type: 'spark', drag: 1 }); });
    D.at(.62, () => { D.sfx('boom'); D.sfx('gore'); D.sfx('squelch'); Cam.shake(.8); Post.doFlash(.45, '#ff2040'); TimeFX.slowmo(.4, .3);
      B.sx = B.sy = 1; B.rot = 0; B.tintA = 0; D.cutGrid(3, 4, .4, false, p => { const a = Math.atan2(p.cv - D.b.cy, p.cu - D.b.cx); p.vx = Math.cos(a) * rnd(200, 400); p.vy = Math.sin(a) * rnd(150, 300) - 160; p.vr = rnd(-20, 20); p.bleed = 1; p.splatHit = true; });
      D.burst(.5, .5, 280, { smin: 60, smax: 420, drag: .02 }); for (let i = 0; i < 24; i++) Particles.spawn({ x: D.X0 + rnd(-20, 20), y: D.wy(D.b.cy) + rnd(-20, 20), vx: rnd(-40, 40), vy: rnd(-30, 10), life: rnd(1, 2), c: '#a01020', c2: '#300408', type: 'smoke', size: 4 });
      D.pool(D.X0, 30, { delay: .3 }); D.pool(D.X0 + 60, 14, { delay: .6 }); D.pool(D.X0 - 40, 12, { delay: .6 }); });
  },
  // Throne Warden — cleaved straight down the middle; the halves fall apart in opposite directions
  warden(D) {
    D.col = BLOOD.dark; D.sfx('heavy'); D.sfx('gore'); Cam.shake(.6); Post.doFlash(.35, '#ffffff'); TimeFX.slowmo(.5, .3);
    const [left, right] = D.cutLine(D.b.cx, D.b.cy, Math.PI / 2);
    // line at 90°: normal (-1,0) → side A is x >= cx (right half)
    const halves = [left, right].filter(Boolean); halves.forEach(p => { const dir = p.cu > D.b.cx ? 1 : -1; p.vx = dir * 25; p.vy = -30; p.vr = dir * .5; p.bleed = 2.6; p.bleedRate = 60; p.noisy = 'clunk'; p.bounce = .15; });
    D.at(.4, () => halves.forEach(p => { p.vr = (p.cu > D.b.cx ? 1 : -1) * 1.8; }));
    D.spray({ from: () => [D.X0, CGY - D.h * .55], ang: -Math.PI / 2, spread: .35, rate: 200, dur: 1.2, pulse: 2, smin: 140, smax: 260, sound: 1 });
    D.at(1.1, () => { D.sfx('thud', { v: 1 }); Cam.shake(.5); D.pool(D.X0, 50, { rate: 20 }); });
  },
  // Monarch Lucien — he doesn't die (he has an ending to attend): staggers, bleeds, and burns away in violet fire
  lucien(D) {
    const B = D.body; B.pu = D.b.cx; D.sfx('ehurt');
    D.tween(.5, k => { B.sy = 1 - k * .16; B.ox = k * 6; });
    D.spray({ from: () => D.bodyPt(DSX - 6, DSY - D.h * .8), ang: Math.PI / 2 + .2, spread: .2, rate: 30, dur: 2, smin: 10, smax: 30 });
    D.pool(D.X0 - 4, 14, { delay: .6, rate: 6 });
    D.at(1.2, () => { D.sfx('firecast'); D.disintegrate({ dir: 'up', dur: 1.3, mode: 'rise', tint: null, step: 2 }); for (let i = 0; i < 30; i++) Particles.spawn({ x: D.X0 + rnd(-14, 14), y: CGY - rnd(0, D.h), vx: rnd(-10, 10), vy: -rnd(20, 70), life: rnd(.8, 1.6), c: '#d080ff', c2: '#300840', type: 'smoke', size: 3, glow: 1 }); });
  },
  // fallbacks by archetype
  arch_human(D) { DEATH_STYLES.goblin(D); },
  arch_quad(D) { DEATH_STYLES.twolf(D); }
};
