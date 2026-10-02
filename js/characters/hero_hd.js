'use strict';
/* =========================================================
   HERO HD — high-fidelity player sprite (v4.2)
   The player is no longer stamped out of flat rectangles. Every frame the same rig
   (pose angles, breathing, 8-key walk, expressions, armour / weapon tiers, skin & hair)
   is rasterised from rounded 3D primitives (ellipsoids, capsules, slabs) into a small
   z-buffered pixel buffer at one pixel per world pixel, then lit:
     - per-pixel normals, key light from the upper-left, rim light on the far side
     - hue-shifted 6-tone ramps per material (cool shadows, warm highlights)
     - specular only on glossy materials (metal, glass, hair sheen), Bayer dithering
     - inner contour lines where a near part overlaps a far one, coloured sel-out outline
   Results are cached per pose. Used for the player and every other humanoid (NPCs, companions,
   human enemies); Settings.heroArt = 'classic' restores the old renderer.
   Loaded after characters/anim.js so it wraps the final drawChar.
   ========================================================= */
const HeroHD = {
  get on() { return typeof Settings === 'undefined' || Settings.heroArt !== 'classic'; },
  cache: new Map(), rampC: new Map(), stats: { hit: 0, miss: 0, ms: 0 },
  BAY: [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - .5),
  // ---------- colour ----------
  rgbOf(h) {
    if (Array.isArray(h)) return h;
    if (typeof h === 'string') { if (h[0] === '#') { const a = hexToRgb(h.length === 4 ? '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3] : h); return [a[0], a[1], a[2]]; } const m = h.match(/rgba?\(([^)]+)\)/); if (m) { const v = m[1].split(',').map(Number); return [v[0], v[1], v[2]]; } if (typeof MAT !== 'undefined' && MAT[h]) return this.rgbOf(MAT[h][2]); }
    if (!this._warned) { this._warned = 1; console.warn('HeroHD: odd colour', h); } return [128, 128, 128];
  },
  mix(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; },
  // hue-shifted ramp: base -> cool dark shadow and warm light highlight
  ramp(base, dark = '#160c26', light = '#fff2d0', n = 6, dk = .74, lk = .52) {
    const key = String(base) + dark + light + n + dk + lk; let r = this.rampC.get(key); if (r) return r;
    const b = this.rgbOf(base), lum = (b[0] * .3 + b[1] * .59 + b[2] * .11) / 255, d = this.mix(b, this.rgbOf(dark), dk * (.55 + .45 * Math.min(1, lum * 2.5))), l = this.mix(b, this.rgbOf(light), lk * (.28 + .72 * Math.min(1, lum * 2.2))); r = [];
    for (let i = 0; i < n; i++) { const t = i / (n - 1); r.push(t <= .5 ? this.mix(d, b, t / .5) : this.mix(b, l, (t - .5) / .5)); }
    this.rampC.set(key, r); return r;
  },
  // ---------- raster ----------
  buf(W, H) {
    const k = W + 'x' + H; this._b = this._b || {}; let b = this._b[k];
    if (!b) { const n = W * H; b = this._b[k] = { W, H, n, Z: new Float32Array(n), NX: new Float32Array(n), NY: new Float32Array(n), NZ: new Float32Array(n), M: new Int16Array(n), ID: new Int16Array(n), F: new Int32Array(n), FZ: new Float32Array(n), O: new Uint8ClampedArray(n * 4) }; }
    b.Z.fill(-1e9); b.M.fill(-1); b.ID.fill(-1); b.F.fill(-1); b.O.fill(0); return b;
  },
  begin(s, face, flip) {
    const ox = Math.ceil(34 * s), oy = Math.ceil(74 * s), W = Math.ceil(76 * s), H = Math.ceil(90 * s);
    this.R = { b: this.buf(W, H), s, ox, oy, mats: [], pid: 0, face, x0: W, y0: H, x1: 0, y1: 0 };
  },
  mat(ramp, o = {}) { const R = this.R; R.mats.push(Object.assign({ r: ramp, rim: .25, spec: 0, dither: .3, dim: 1, emit: 0, tex: 0, ol: null }, o)); return R.mats.length - 1; },
  _bb(x0, y0, x1, y1) { const R = this.R; if (x0 < R.x0) R.x0 = x0; if (x1 > R.x1) R.x1 = x1; if (y0 < R.y0) R.y0 = y0; if (y1 > R.y1) R.y1 = y1; },
  _put(i, z, nx, ny, nz, m) { const b = this.R.b; if (z > b.Z[i]) { b.Z[i] = z; b.NX[i] = nx; b.NY[i] = ny; b.NZ[i] = nz; b.M[i] = m; b.ID[i] = this.R.pid; } },
  ell(cx, cy, rx, ry, m, cz = 0, rz, clip) {
    const R = this.R, b = R.b, s = R.s; rz = rz === undefined ? Math.min(rx, ry) : rz; R.pid++;
    const pcx = R.ox + cx * s, pcy = R.oy + cy * s, prx = Math.max(.6, rx * s), pry = Math.max(.6, ry * s);
    const x0 = Math.max(0, Math.floor(pcx - prx)), x1 = Math.min(b.W - 1, Math.ceil(pcx + prx)), y0 = Math.max(0, Math.floor(pcy - pry)), y1 = Math.min(b.H - 1, Math.ceil(pcy + pry));
    const a = rz / rx, c = rz / ry;
    this._bb(x0, y0, x1, y1);
    for (let y = y0; y <= y1; y++) { const dy = (y + .5 - pcy) / pry; if (dy * dy > 1) continue; const hw = Math.sqrt(1 - dy * dy) * prx, xa = Math.max(x0, Math.floor(pcx - hw - .5)), xb = Math.min(x1, Math.ceil(pcx + hw)); for (let x = xa; x <= xb; x++) {
      const dx = (x + .5 - pcx) / prx, d2 = dx * dx + dy * dy; if (d2 > 1) continue;
      if (clip && !clip((x + .5 - R.ox) / s, (y + .5 - R.oy) / s)) continue;
      const k = Math.sqrt(1 - d2), nx = dx * a, ny = dy * c, l = Math.sqrt(nx * nx + ny * ny + k * k) || 1;
      this._put(y * b.W + x, (cz + rz * k) * s, nx / l, ny / l, k / l, m);
    } }
  },
  cap(x0, y0, x1, y1, r0, m, cz = 0, r1, clip) {
    const R = this.R, b = R.b, s = R.s; r1 = r1 === undefined ? r0 : r1; R.pid++;
    const ax = R.ox + x0 * s, ay = R.oy + y0 * s, bx = R.ox + x1 * s, by = R.oy + y1 * s, ra = Math.max(.55, r0 * s), rb = Math.max(.55, r1 * s), rm = Math.max(ra, rb);
    const vx = bx - ax, vy = by - ay, ll = vx * vx + vy * vy + 1e-9;
    const X0 = Math.max(0, Math.floor(Math.min(ax, bx) - rm)), X1 = Math.min(b.W - 1, Math.ceil(Math.max(ax, bx) + rm)), Y0 = Math.max(0, Math.floor(Math.min(ay, by) - rm)), Y1 = Math.min(b.H - 1, Math.ceil(Math.max(ay, by) + rm));
    this._bb(X0, Y0, X1, Y1);
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      const px = x + .5, py = y + .5; let t = ((px - ax) * vx + (py - ay) * vy) / ll; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = px - (ax + vx * t), qy = py - (ay + vy * t), d = Math.sqrt(qx * qx + qy * qy), r = ra + (rb - ra) * t; if (d > r) continue;
      if (clip && !clip((px - R.ox) / s, (py - R.oy) / s)) continue;
      const k = Math.sqrt(Math.max(0, 1 - (d / r) * (d / r))), nx = qx / r, ny = qy / r, l = Math.sqrt(nx * nx + ny * ny + k * k) || 1;
      this._put(y * b.W + x, cz * s + r * k, nx / l, ny / l, k / l, m);
    }
  },
  // flat slab with a soft bulge toward its centre line (cloth panels, capes)
  poly(pts, m, cz = 0, nrm = [0, 0, 1], bulge = 0) {
    const R = this.R, b = R.b, s = R.s; R.pid++;
    const P = pts.map(p => [R.ox + p[0] * s, R.oy + p[1] * s]); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const cxm = (x0 + x1) / 2, hw = Math.max(1, (x1 - x0) / 2), nl = Math.hypot(nrm[0], nrm[1], nrm[2]);
    x0 = Math.max(0, Math.floor(x0)); x1 = Math.min(b.W - 1, Math.ceil(x1)); y0 = Math.max(0, Math.floor(y0)); y1 = Math.min(b.H - 1, Math.ceil(y1));
    this._bb(x0, y0, x1, y1);
    for (let y = y0; y <= y1; y++) { const py = y + .5; for (let x = x0; x <= x1; x++) { const px = x + .5; let inside = false;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], c = P[j]; if ((a[1] > py) !== (c[1] > py) && px < (c[0] - a[0]) * (py - a[1]) / (c[1] - a[1]) + a[0]) inside = !inside; }
      if (!inside) continue; let nx = nrm[0] / nl, ny = nrm[1] / nl, nz = nrm[2] / nl, z = cz * s;
      if (bulge) { const u = (px - cxm) / hw; nx += u * bulge * .6; z += (1 - u * u) * bulge * s; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l; }
      this._put(y * b.W + x, z, nx, ny, nz, m); } }
  },
  // flat (unlit) pixels, in local units — eyes, string, stitching
  fr(c, u, v, w, h, z = 1e9) {
    const R = this.R, b = R.b, s = R.s, col = typeof c === 'number' ? c : this.pack(c); z *= s;
    const x0 = Math.floor(R.ox + u * s), y0 = Math.floor(R.oy + v * s), x1 = Math.max(x0 + 1, Math.round(R.ox + (u + w) * s)), y1 = Math.max(y0 + 1, Math.round(R.oy + (v + h) * s));
    for (let y = Math.max(0, y0); y < Math.min(b.H, y1); y++) for (let x = Math.max(0, x0); x < Math.min(b.W, x1); x++) { const i = y * b.W + x; b.F[i] = col; b.FZ[i] = z; }
  },
  fpx(c, u, v, z = 1e9) { const R = this.R, b = R.b, x = Math.floor(R.ox + u * R.s), y = Math.floor(R.oy + v * R.s); if (x >= 0 && y >= 0 && x < b.W && y < b.H) { const i = y * b.W + x; b.F[i] = typeof c === 'number' ? c : this.pack(c); b.FZ[i] = z * R.s; } },
  fline(c, u0, v0, u1, v1, z) { const R = this.R, s = R.s, n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, v1 - v0) * s * 1.4)), col = this.pack(c); for (let i = 0; i <= n; i++) this.fpx(col, u0 + (u1 - u0) * i / n, v0 + (v1 - v0) * i / n, z); },
  pack(c) { const a = this.rgbOf(c); return (Math.round(a[0]) << 16) | (Math.round(a[1]) << 8) | Math.round(a[2]); },
  // ---------- shading ----------
  shadeAll(paint) {
    const R = this.R, b = R.b, W = b.W, H = b.H, M = b.M, O = b.O, mats = R.mats, BAY = this.BAY, s = R.s;
    let lx = -.55 * R.face, ly = -.7, lz = .55; const ll = Math.hypot(lx, ly, lz); lx /= ll; ly /= ll; lz /= ll;
    let hx = lx, hy = ly, hz = lz + 1; const hl = Math.hypot(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;
    const amb = .17, X0 = Math.max(0, R.x0 - 2), X1 = Math.min(W - 1, R.x1 + 2), Y0 = Math.max(0, R.y0 - 2), Y1 = Math.min(H - 1, R.y1 + 2);
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      const i = y * W + x, m = M[i]; if (m < 0) continue; const T = mats[m], r = T.r, nx = b.NX[i], ny = b.NY[i], nz = b.NZ[i];
      let v;
      if (T.emit) v = T.emit;
      else {
        const d = nx * lx + ny * ly + nz * lz; v = amb + (d > 0 ? d : 0) * .95;
        v += (1 - nz) * (1 - nz) * T.rim * (nx * lx < 0 ? 1 : .45);
        if (T.spec) { const h = nx * hx + ny * hy + nz * hz; if (h > .7) { const h2 = h * h, h4 = h2 * h2, h8 = h4 * h4; v += T.spec * h8 * h8 * h2; } }
        if (T.soft) v += (.78 - v) * T.soft;
        v *= T.dim;
        if (T.tex === 1 && ((x + (y >> 1) * 2) % 3 === 0)) v -= .16;           // mail rings
        if (T.tex === 2 && ((x * 7 + y * 13) % 11 === 0)) v -= .1;             // cloth weave flecks
      }
      let k = Math.round(v * (r.length - 1) + BAY[(y & 3) * 4 + (x & 3)] * T.dither); k = k < 0 ? 0 : k >= r.length ? r.length - 1 : k;
      const c = r[k], p = i * 4; O[p] = c[0]; O[p + 1] = c[1]; O[p + 2] = c[2]; O[p + 3] = 255;
    }
    // inner contours: a part that sits well behind its neighbour gets a dark seam
    const thr = 2.2 * s, Z = b.Z, ID = b.ID;
    for (let y = Math.max(1, Y0); y <= Math.min(H - 2, Y1); y++) for (let x = Math.max(1, X0); x <= Math.min(W - 2, X1); x++) {
      const i = y * W + x; if (M[i] < 0) continue; const z = Z[i] + thr, id = ID[i];
      let hit = false; for (let q = 0; q < 4; q++) { const j = q === 0 ? i + 1 : q === 1 ? i - 1 : q === 2 ? i - W : i + W; if (M[j] >= 0 && ID[j] !== id && Z[j] > z) { hit = true; break; } }
      if (hit) { const r = mats[M[i]].r, p = i * 4; O[p] = r[0][0] * .7 + r[1][0] * .3; O[p + 1] = r[0][1] * .7 + r[1][1] * .3; O[p + 2] = r[0][2] * .7 + r[1][2] * .3; }
    }
    const F = b.F, FZ = b.FZ; for (let i = 0; i < b.n; i++) if (F[i] >= 0 && FZ[i] >= Z[i]) { const p = i * 4, c = F[i]; O[p] = c >> 16; O[p + 1] = (c >> 8) & 255; O[p + 2] = c & 255; O[p + 3] = 255; }
    // coloured sel-out outline (1 px), darker under the figure
    const A = this._A && this._A.length >= b.n ? this._A : (this._A = new Uint8Array(b.n)); for (let i = 0; i < b.n; i++) A[i] = O[i * 4 + 3] ? 1 : 0;
    const OX0 = Math.max(0, X0 - 1), OX1 = Math.min(W - 1, X1 + 1), OY0 = Math.max(0, Y0 - 1), OY1 = Math.min(H - 1, Y1 + 1);
    for (let y = OY0; y <= OY1; y++) for (let x = OX0; x <= OX1; x++) {
      const i = y * W + x; if (A[i]) continue; let j = -1;
      if (x + 1 < W && A[i + 1]) j = i + 1; else if (x > 0 && A[i - 1]) j = i - 1; else if (y + 1 < H && A[i + W]) j = i + W; else if (y > 0 && A[i - W]) j = i - W;
      if (j < 0) continue; const p = i * 4, q = j * 4, m = M[j]; let c;
      if (R.olC) c = R.olC; else if (m >= 0) { const T = mats[m]; c = T.ol || T.r[0]; c = [c[0] * .55 + 14, c[1] * .55 + 6, c[2] * .55 + 26]; } else c = [O[q] * .4 + 10, O[q + 1] * .4 + 6, O[q + 2] * .4 + 18];
      O[p] = c[0]; O[p + 1] = c[1]; O[p + 2] = c[2]; O[p + 3] = 255;
    }
    if (paint) { const c = this.rgbOf(paint); for (let i = 0; i < b.n; i++) { const p = i * 4; if (O[p + 3]) { O[p] = c[0]; O[p + 1] = c[1]; O[p + 2] = c[2]; } } }
  },
  // ---------- palettes ----------
  TIERS: [
    { top: '#5f7a48', sleeve: '#5f7a48', pants: '#4a3f52', boots: '#6a4428', belt: '#6a4a2a', cowl: '#8a6a48', patch: '#b08c58', tex: 2 },
    { top: '#9a6438', sleeve: '#c8b48e', pants: '#463a44', boots: '#4e301c', belt: '#3a2414', strap: '#5a3418', cowl: '#7a5230', leather: true },
    { top: '#8e98a4', sleeve: '#8e98a4', pants: '#3e3a48', boots: '#3e2e26', belt: '#5a3a22', mail: true, tabard: '#4e6290' },
    { top: '#b8c4d0', sleeve: '#b8c4d0', pants: '#363648', boots: '#7a828c', belt: '#4a3020', plate: true, tabard: '#34508a' },
    { top: '#c8ccd8', sleeve: '#c8ccd8', pants: '#2e2a3a', boots: '#8a8a98', belt: '#8a6a20', plate: true, gold: true, tabard: '#8e2436', cape: '#7e1c2c' }
  ],
  ELEM: { fire: '#d0482a', water: '#3a7ac8', light: '#e8c860' },
  // ---------- the rig ----------
  // palette for this figure: the hero uses the HD tier palettes, everyone else keeps their own colours
  pal(o) {
    const tier = clamp(o.tier || 0, 0, 4), G = (typeof ARMOR_TIERS !== 'undefined' ? ARMOR_TIERS[tier] : null) || {};
    if (o.hero && !o.armor && !o.top) return Object.assign({ hoodDown: true }, this.TIERS[tier]);
    const R = o.armor || G, top = o.top || R.top || G.top || '#8a6a4c', bare = !!o.top;
    return { top, sleeve: o.sleeve || top, pants: o.pants || R.pants || G.pants || '#4c4036', boots: o.boots || R.boots || G.boots || '#3a2a20', belt: o.belt || R.belt || G.belt,
      mail: !bare && R.mail, plate: !bare && R.plate, tabard: !bare && R.tabard, gold: !bare && R.gold, patch: !bare && R.patch, strap: !bare && R.strap, cape: o.cape || R.cape, hood: R.hood || G.hood || '#6e5a42' };
  },
  rig(o, P) {
    const H = this, s = P.s, t = P.t, seed = o.seed || 0, body = o.body || 'sturdy', low = !!o.low, wpn = o.weapon, el = o.element, sit = !!o.sit;
    const bw = body === 'round' ? 15 : body === 'lanky' ? 10 : 13, legH = body === 'lanky' ? 12 : 10, torsoH = body === 'lanky' ? 14 : 13;
    const { br, legF, legB, liftF, liftB, bob, armSwing, walking, headBob } = P;
    const crouch = o.crouch || 0, lean = (o.lean || 0) + (low ? 1 : 0);
    const hipY = sit ? -9 : -legH + crouch * 3, topY = hipY - torsoH + br * .5 + bob, A = H.pal(o), hs = o.hairStyle || 'short', ht = o.head || 'human';
    const SH = '#160c26', WARM = '#fff2d0';
    const defSkin = ht === 'skull' ? '#e8e2cc' : ht === 'orc' ? (o.skin || '#7a9a4a') : ht === 'goblin' ? (o.skin || '#8aaa4a') : ht === 'mummy' ? '#c8b890' : ht === 'helm' ? '#5a5a66' : (o.skin || '#f0c49a');
    const bodySkin = o.skin || (ht === 'orc' ? '#7a9a4a' : ht === 'goblin' ? '#8aaa4a' : ht === 'skull' ? '#e8e2cc' : ht === 'mummy' ? '#c8b890' : '#f0c49a');
    const skinR = H.ramp(bodySkin, '#5a1c34', '#fff0dc', 6, .66, .5), headR = ht === 'helm' ? H.ramp(defSkin, '#1a1a30', '#fff8f0', 6, .8, .42) : H.ramp(defSkin, ht === 'skull' ? '#2a2034' : '#5a1c34', '#fff0dc', 6, .66, .5);
    const mSkin = H.mat(skinR, { rim: .14, dither: .15 }), mSkinB = H.mat(skinR, { rim: .1, dim: .8, dither: .15 });
    const mFace = H.mat(headR, ht === 'helm' ? { rim: .45, spec: .9, dither: .2 } : { rim: .12, dither: .12, soft: .4 });
    const hairR = H.ramp(o.hair || '#5a3a24', '#140a1c', '#ffd8a0', 6, .78, .42), mHair = H.mat(hairR, { rim: .3, spec: .32, dither: .35 });
    const cloth = (c, o2) => H.mat(H.ramp(c, SH, WARM), Object.assign({ rim: .28, dither: .35 }, o2));
    const metal = (c, o2) => H.mat(H.ramp(c, '#1a1a30', '#fff8f0', 6, .8, .42), Object.assign({ rim: .45, spec: .9, dither: .2 }, o2));
    const mTop = A.plate ? metal(A.top) : A.mail ? metal(A.top, { spec: .35, tex: 1, dither: 0 }) : A.leather ? cloth(A.top, { spec: .22, rim: .2 }) : cloth(A.top, { tex: A.tex || 0 });
    const mSleeve = A.plate ? metal(A.sleeve) : A.mail ? metal(A.sleeve, { spec: .3, tex: 1, dither: 0 }) : cloth(A.sleeve);
    const mSleeveB = A.plate ? metal(A.sleeve, { dim: .78 }) : A.mail ? metal(A.sleeve, { spec: .2, tex: 1, dither: 0, dim: .78 }) : cloth(A.sleeve, { dim: .78 });
    const mPants = cloth(A.pants, { rim: .2 }), mPantsB = cloth(A.pants, { rim: .15, dim: .78 });
    const mBoot = A.plate ? metal(A.boots, { spec: .6 }) : cloth(A.boots, { spec: .25, rim: .2 }), mBootB = A.plate ? metal(A.boots, { spec: .4, dim: .8 }) : cloth(A.boots, { spec: .15, dim: .8 });
    const mGold = metal('#d8a838', { spec: 1 }), mIron = metal('#9aa0ae'), mLeather = cloth('#7a4a2a', { spec: .2, rim: .2 });
    const tx = -bw / 2 + lean * .6, cxT = tx + bw / 2, zT = 2 + bw * .42; // torso front surface depth
    if (o.outline) H.R.olC = H.rgbOf(o.outline);
    // ---- cape ----
    if (A.cape) {
      const C = o._cape; let pts;
      if (C) pts = [[3, topY + 1], [C[2][0] + 5.5, C[2][1]], [C[4][0] + 4.5, C[4][1] + 1], [C[4][0] - 1, C[4][1]], [C[3][0] - 1, C[3][1]], [C[2][0] - 1, C[2][1]], [C[1][0], C[1][1]], [-4, topY + 1]];
      else { const fl = Math.sin(t * 2.6 + seed) * 1.5 + (o.windCape || 0) + (walking ? -2 : 0); pts = [[-4, topY + 1], [3, topY + 1], [-8 + fl, hipY + 8], [-12 + fl, hipY + 7]]; }
      H.poly(pts, cloth(A.cape, { rim: .35 }), -8, [-.35, .1, 1], 2.2);
    }
    // ---- secondary-motion tail (long hair, scarf ends) ----
    if (o._tail) { const C = o._tail, mt = o._tailC ? cloth(o._tailC) : mHair; for (let i = 0; i < C.length - 1; i++) H.cap(C[i][0], C[i][1], C[i + 1][0], C[i + 1][1], 1.6 - i * .3, mt, -6, 1.3 - i * .3); }
    // ---- quiver (bow hero) ----
    if (o.hero && wpn === 'bow') {
      const qx = tx + 1.5, qy = topY + 1; H.cap(qx + 1, qy - 1, qx - 3, qy + 12, 2.2, mLeather, -5, 2);
      for (const [c, d] of [['#d04848', 0], ['#4a78c8', 1.6], ['#d04848', 3.2]]) { const ax = qx + 1.6 - d * .55, ay = qy - 1.5 - d * .3; H.cap(ax, ay + 2, ax + .8, ay - 3.5, .35, H.mat(H.ramp('#8a5a30'), { dither: 0 }), -4); H.fr(c, ax - .2, ay - 5, 1.2, 2, -3); H.fpx('#f0ece0', ax + .9, ay - 5.4, -3); }
      H.cap(qx - .5, qy + 4, qx - 2.4, qy + 10, .6, cloth(A.belt || '#5a3a22'), -3.6);
    }
    // ---- back arm ----
    const shB = [-bw / 2 + 2 + lean * .5, topY + 3], armLen = 9, aB = (o.armB !== undefined ? o.armB : -.15 - armSwing) - (low ? .1 : 0);
    const hB = [shB[0] + Math.sin(aB) * armLen, shB[1] + Math.cos(aB) * armLen];
    H.cap(shB[0], shB[1], hB[0], hB[1], 2.2, mSleeveB, -2, 1.8); H.ell(hB[0], hB[1], 1.7, 1.7, A.plate ? mSleeveB : mSkinB, -1.5);
    // ---- legs ----
    const legW = body === 'round' ? 5 : 4;
    const leg = (lx, lift, back) => {
      const cx = lx + legW / 2, mp = back ? mPantsB : mPants, mb = back ? mBootB : mBoot, cz = back ? -1 : 1;
      if (sit) { H.cap(lx, hipY + legW / 2, lx + 9, hipY + legW / 2, legW / 2 + .4, mp, cz); H.cap(lx + 9, hipY + legW / 2, lx + 9.4, -3, legW / 2 + .3, mp, cz + .2); H.ell(lx + 10.4, -1.7, legW / 2 + 1.7, 1.9, mb, cz + .6, 1.6); return; }
      H.cap(cx, hipY + 1, cx + .2, -3.5 - lift, legW / 2 + .35, mp, cz, legW / 2 + .1);
      H.ell(cx + 1.1, -1.7 - lift, legW / 2 + 1.7, 1.9, mb, cz + .6, 1.6); H.cap(cx - .1, -4.2 - lift, cx + .3, -2.2 - lift, legW / 2 + .45, mb, cz + .3);
      if (!back && !A.plate) H.fr(H.ramp(A.boots)[4], cx + 1.4, -3.2 - lift, 1.4, .6, cz + 3);
    };
    leg(-4 + legB * .8, liftB, true); leg(0 + legF * .8, liftF, false);
    // ---- robe / skirt ----
    if (o.robe) { const hm = o._hem || 0; H.poly([[-bw / 2 - .6 + lean * .3, hipY - 2], [bw / 2 + .6 + lean * .3, hipY - 2], [bw / 2 + 2.6 + hm, -1], [-bw / 2 - 2.6 + hm, -1]], cloth(o.robe, { rim: .3, tex: 2 }), 2.6, [0, .15, 1], 2.4);
      H.fline(H.ramp(o.robe)[1], cxT + .5, hipY + 1, cxT + 1 + hm * .5, -1.6, zT + 1); }
    // ---- torso ----
    const rnd = body === 'round';
    H.ell(cxT, topY + torsoH * .5, bw / 2 + .5 + (rnd ? 1 : 0), torsoH / 2 + .9, mTop, 2, bw * .42);
    if (!o.robe) H.ell(cxT + .2, hipY - 1.4, bw / 2 + .9 + (rnd ? 1 : 0), 3.1, mTop, 2.4, bw * .4);
    if (rnd) H.ell(cxT + 1.5, topY + torsoH * .62, bw / 2, torsoH * .42, mTop, 3, bw * .45);
    if (A.leather || A.strap) { H.cap(tx + 1, topY + .8, tx + bw - 1.6, topY + torsoH - 2.5, .85, cloth(A.strap || '#5a3418', { spec: .2 }), zT + .6); if (A.leather) H.fr(H.ramp(A.top)[4], cxT + 2, topY + 2, .7, .7, 9); }
    if (A.patch) { const pc = cloth(A.patch, { rim: .2, tex: 2 }); H.ell(tx + 3.6, topY + 5, 1.7, 1.6, pc, zT - .2, 1); H.ell(tx + bw - 3.6, topY + 9.2, 1.2, 1.5, pc, zT - .4, 1);
      const st = H.ramp(A.patch)[0]; H.fpx(st, tx + 2.1, topY + 3.6, 9); H.fpx(st, tx + 5, topY + 6.4, 9); H.fpx(st, tx + bw - 4.6, topY + 7.9, 9); }
    if (A.tabard) { const tc = cloth(A.tabard, { rim: .3 }); H.poly([[cxT - 1.6, topY + 2.6], [cxT + 3.4, topY + 2.6], [cxT + 3.9, hipY + 1.2], [cxT + .9, hipY + 2.6], [cxT - 2.1, hipY + 1.2]], tc, zT + .5, [.1, -.1, 1], 1.1);
      if (A.gold) { const zt = zT + 2.2; H.fr('#e8c050', cxT - 1.4, topY + 2.6, 5, .6, zt); H.fr('#f8e090', cxT + .7, topY + 5.2, .7, 2.6, zt); H.fr('#f8e090', cxT - .2, topY + 5.9, 2.6, .7, zt); } }
    if (A.plate) H.cap(tx + 1.5, topY + 2.2, tx + bw - 1.5, topY + 2.2, .55, A.gold ? mGold : metal(A.top), zT + .4);
    if (o.apron) { H.poly([[tx + 1.6, topY + 3.6], [tx + bw - 1.6, topY + 3.6], [tx + bw - 1.2, hipY + 3.2], [tx + 1.2, hipY + 3.2]], cloth(o.apron, { rim: .2, tex: 2 }), zT + .4, [.05, 0, 1], 1.2); H.fline(H.ramp(o.apron)[1], tx + 1.6, topY + 3.6, tx + bw - 1.6, topY + 3.6, zT + 3); }
    if (o.stole) { const sc = cloth(o.stole, { rim: .3 }); H.cap(tx + 3.6, topY + .4, tx + 3.4, topY + torsoH + 1.6, .9, sc, zT + .8); H.cap(tx + bw - 4, topY + .4, tx + bw - 3.8, topY + torsoH + 1.6, .9, sc, zT + .8); H.fr('#e8c050', tx + 2.8, topY + torsoH + 1, 1.6, .7, zT + 3); H.fr('#e8c050', tx + bw - 4.8, topY + torsoH + 1, 1.6, .7, zT + 3); }
    if (o.cross) { H.cap(cxT, topY + 3, cxT, topY + 8, .5, mGold, zT + 2); H.cap(cxT - 1.6, topY + 4.6, cxT + 1.6, topY + 4.6, .5, mGold, zT + 2.2); }
    if (o.dmg > .3) { const r = RNG(seed + 3), dc = H.ramp(A.top)[0]; for (let i = 0; i < 4; i++) H.fr(dc, tx + r.i(1, bw - 3), topY + r.i(2, torsoH - 2), r.i(1, 3), .7, zT + 1); }
    // ---- belt, buckle, pouch ----
    const mag = wpn === 'staff';
    if (A.belt && !o.robe) { H.cap(tx - .3, hipY - 2.2, tx + bw + .3, hipY - 2.2, 1.05, cloth(A.belt, { spec: .25, rim: .2 }), zT + .2); H.ell(cxT + 2, hipY - 2.2, 1.2, 1.05, A.gold ? mGold : o.hero ? mIron : mGold, zT + 1.4, .9); }
    if (o.hero && !A.plate) H.ell(tx + bw - 1.6, hipY - .4, 1.9, 1.9, mLeather, zT + 1, 1.6);
    if (o.hero && wpn === 'sword') H.cap(tx - .5, hipY - 1.5, tx - 4.5, hipY + 6.5, .9, mLeather, -1.5, .8);
    if (o.hero && mag && el && H.ELEM[el] && !A.tabard) H.cap(tx + bw - 1.2, topY + .5, tx + 1, hipY - 2.6, 1, cloth(H.ELEM[el], { rim: .35 }), zT + .9);
    if (o.fur) { const fc = cloth(o.fur, { rim: .2, tex: 2, dither: .6 }); H.ell(cxT, topY + .6, bw / 2 + 1.6, 2.8, fc, zT - .4, 2.6); }
    // ---- head ----
    const hr = o.child ? 9.5 : 8.5, hx = 1 + lean + (o.headX || 0), hy = topY - 8 + br * .3 + (low ? 1 : 0) + (o.headY || 0) + headBob;
    H.cap(hx - 1, hy + 6, cxT - .5, topY + 1, 2.2, ht === 'helm' ? mFace : mSkin, 1.5);
    if (o.hero && mag && el && H.ELEM[el]) { const ec = cloth(H.ELEM[el], { rim: .35 }); H.cap(tx + .5, topY + .2, tx + bw - .5, topY + .2, 1.9, ec, zT + .6); H.cap(tx + .5, topY + .5, tx - 3 + Math.sin(t * 2.4 + seed) * .8, topY + 6, 1.1, ec, -1, .8); }
    else if (A.hoodDown && A.cowl) { const cc = cloth(A.cowl, { rim: .3, tex: 2 }); H.ell(tx + .6, topY + 1.4, 4.2, 3.2, cc, 1, 3); H.cap(tx + .8, topY + .3, tx + bw - 1.2, topY + .3, 2, cc, zT - .2); }
    else if (A.mail) H.cap(tx + .8, topY + .3, tx + bw - 1.2, topY + .3, 1.8, mTop, zT - .2);
    const zH = 4 + hr * .9; // head front surface depth
    H.head(o, hx, hy, hr, t, seed, { mFace, mHair, hairR, headR, skinR, cloth, metal, mGold, A, ht, hs, zH });
    // ---- front arm ----
    const shF = [bw / 2 - 3 + lean * .7, topY + 3], aF = o.armF !== undefined ? o.armF : .15 + armSwing, hF = [shF[0] + Math.sin(aF) * armLen, shF[1] + Math.cos(aF) * armLen];
    const zF = zT + 3, zW = 30;
    if (wpn === 'shield') H.weapon(o, hF, aF, zF - 3.5, t, 'shield');
    if (o.shield) H.weapon({ weapon: 'shield', shieldC: o.shieldC }, [bw / 2 - 1 + lean * .7, topY + 9], 0, zF - 3.5, t, 'shield');
    H.cap(shF[0], shF[1], hF[0], hF[1], 2.25, mSleeve, zF, 1.9);
    if (A.plate) { H.ell(shF[0], shF[1] - .2, 3.5, 2.9, metal(A.top), zF + 2, 2.6); if (A.gold) H.cap(shF[0] - 2.6, shF[1] + 1.6, shF[0] + 2.6, shF[1] + 1.6, .45, mGold, zF + 4.4); }
    else if (A.leather) H.cap(shF[0] + Math.sin(aF) * 6, shF[1] + Math.cos(aF) * 6, hF[0] - Math.sin(aF) * .8, hF[1] - Math.cos(aF) * .8, 2.1, cloth('#6a3a1c', { spec: .2 }), zF + .2);
    H.weapon(o, hF, aF, zW, t, 'under');
    H.ell(hF[0], hF[1], 1.85, 1.85, A.plate ? metal(A.boots) : mSkin, zW + 1.2);
    H.weapon(o, hF, aF, zW, t, 'over');
    if (o.book) { const bk = cloth('#5a2a3a', { spec: .1 }); H.poly([[hF[0] - 1, hF[1] - 4], [hF[0] + 5, hF[1] - 4], [hF[0] + 5, hF[1] + 3], [hF[0] - 1, hF[1] + 3]], bk, zW + 2, [.15, -.1, 1], .6); H.fr('#e8c050', hF[0] + 1, hF[1] - 1, 2, .8, zW + 4); H.fr('#efe6d0', hF[0] + 4.4, hF[1] - 3.4, .6, 6, zW + 4); }
  },
  head(o, hx, hy, hr, t, seed, M) {
    const H = this, { mFace, mHair, hairR, headR, skinR, cloth, metal, mGold, A, ht, hs, zH } = M, hat = o.hat;
    const hoodUp = !A.hoodDown && (o.hood || hs === 'hood'), hc = o.hoodC || A.hood || '#6e5a42', mHood = hoodUp ? cloth(hc, { rim: .3, tex: 2 }) : -1;
    const hairOn = !hoodUp && hs !== 'none' && hs !== 'bald' && hs !== 'hood' && hat !== 'hoodDark' && hat !== 'scarf' && ht !== 'skull' && ht !== 'helm' && ht !== 'mummy';
    const capHat = hat === 'helmet' || hat === 'cap' || hat === 'tophat' || hat === 'wizard' || hat === 'straw' || hat === 'feather';
    // behind the head: hood back, long hair, goblin ear
    if (hoodUp) H.ell(hx - 1, hy - .5, hr + 2.2, hr + 1.6, mHood, 1, hr * .7);
    if (hairOn && (hs === 'long' || hs === 'longdark')) { const sw = Math.sin(t * 1.8 + seed); H.poly([[hx - 9, hy - 3], [hx + 3, hy - 3], [hx - 2 + sw, hy + 17], [hx - 11 + sw, hy + 15]], mHair, 1.5, [-.3, .1, 1], 1.8); H.fline(hairR[1], hx - 5, hy, hx - 6 + sw, hy + 14, 5); }
    if (hat === 'hoodDark') { const hd = cloth(o.hatC || '#2a2238', { rim: .4 }); H.ell(hx - 1, hy - 1, hr + 2.2, hr + 1.6, hd, 3, hr * .9); H.ell(hx + 2, hy + 1, 5.6, 5.6, H.mat(H.ramp('#0e0a14', '#000000', '#2a2030'), { rim: 0, dither: 0 }), 3 + hr * .9 + .6, 1); const g = o.eyeGlow || '#80ff90'; H.fr(g, hx + 1, hy, 2, 1); H.fr(g, hx + 5, hy, 2, 1); return; }
    if (hat === 'scarf') { const sc = cloth(o.hatC || '#a84a5a', { rim: .35, tex: 2 }); H.ell(hx - 1, hy - 3, hr + .8, hr - .6, sc, 3, hr * .8); H.ell(hx + 2, hy + 1, 6, 6, mFace, 3 + hr * .8 + .5, 3.5); H.face(o, hx, hy, H.R.tb, seed, headR, ht); return; }
    // back hair mass (short styles) + head
    if (hairOn) { H.ell(hx - 2.6, hy - 1.2, hr + 1.1, hr + .6, mHair, 1, hr * .8, (u, v) => v < hy + 1.5 || u < hx - 3.5); H.ell(hx - 5.4, hy + 3.4, 4, 4.4, mHair, 1.5, 3.5); }
    H.ell(hx, hy, hr, hr - .5, mFace, 4, hr * .9);
    if (ht !== 'helm' && ht !== 'skull') H.ell(hx + 3.2, hy + 3.4, 5, 3.6, mFace, 6.4, 3.4);
    if (ht === 'human' || ht === 'orc' || ht === 'mummy') { H.ell(hx - 4.4, hy + 1.6, 1.3, 1.9, mFace, zH + .4, 1.2); H.fpx(headR[1], hx - 4.4, hy + 1.6, zH + 1); }
    // hair on top / hood front
    if (hoodUp) { H.ell(hx - 1, hy - 5.5, hr + .6, 4.2, mHood, zH - 1.5, 4, (u, v) => v < hy - 3); H.ell(hx - 6, hy, 4, 7, mHood, zH - 1, 3); H.fline(H.ramp(hc)[4], hx - 3, hy - 9, hx + 3, hy - 9, zH + 4);
      const hcol = o.hair || '#5a3a24'; H.fr(hcol, hx + 1, hy - 3.4, 5, 1, zH + 3); H.fr(hcol, hx + 3, hy - 2.4, 2, 1, zH + 3); if (!o.hero && (o.tier || 0) === 0 && !o.hoodC) H.ell(hx - 6.2, hy - 3, 1.5, 1.5, cloth(A.patch || '#a88a5c'), zH, 1); }
    else if (hairOn) {
      if (!capHat) {
        H.ell(hx - .6, hy - 4.6, hr + .7, 5.4, mHair, 6.5, 5.8, (u, v) => v < hy - .6 || u < hx - 2.5);
        H.poly([[hx + 1, hy - 5.6], [hx + hr + 1.6, hy - 4.4], [hx + hr + .6, hy - .6], [hx + 6.4, hy - 2.6], [hx + 4.4, hy - .4], [hx + 2.6, hy - 2.8], [hx + .4, hy - 2]], mHair, zH + 1.5, [.2, -.35, 1], .8);
      } else H.ell(hx - 3.5, hy - 1.5, 4.5, 5.5, mHair, zH - 1.6, 3); // tufts under a hat
      const hd = hairR[1], hl = hairR[4];
      if (!capHat) { H.fline(hd, hx - 3, hy - 9, hx + 1.5, hy - 6.2, 14); H.fline(hd, hx + 3, hy - 8.4, hx + 6.5, hy - 5.4, 14); H.fline(hl, hx - 2.4, hy - 8.2, hx + .4, hy - 7.6, 14); }
      H.fline(hd, hx - 6.6, hy - 5.4, hx - 4.8, hy - .5, 14);
      if (hs === 'spiky') for (let i = 0; i < 4; i++) H.cap(hx - 6 + i * 3, hy - 8, hx - 8 + i * 3, hy - 13, 1.3, mHair, 7, .3);
      if (hs === 'bun') H.ell(hx - 5, hy - 10, 3.4, 3.4, mHair, 5, 3);
      if (hs === 'curly') for (let i = 0; i < 5; i++) H.ell(hx - 7 + i * 3, hy - 8 + (i % 2), 2.4, 2.4, mHair, 9 + (i % 2), 2.2);
    } else if (hs === 'bald' && ht === 'human') { H.fline(headR[5], hx - 1, hy - 7, hx + 1.5, hy - 7, zH + 2); if (o.hair) H.ell(hx - 6, hy + 1, 2, 3, mHair, zH - 1, 1.5); }
    if (ht === 'goblin') H.poly([[hx - 3.5, hy - 3.5], [hx - 15, hy - 8.5], [hx - 5, hy + 2.5]], mFace, zH + 2, [-.4, -.3, 1], 1);
    // special heads
    if (ht === 'helm') { H.fr('#1a1420', hx - hr + 1, hy - 1, hr * 2 - 2, 1.2, zH + 2); H.fr(o.visor || '#ff4030', hx + 1, hy - 1, 6, 1, zH + 3); H.fline(headR[5], hx - 2, hy - hr + 1.5, hx - 2, hy + 4, zH + 2);
      if (o.plume) { const sw = Math.sin(t * 2), pm = cloth(o.plume, { rim: .4 }); H.poly([[hx - 2, hy - hr], [hx + 2, hy - hr], [hx - 8 + sw, hy - hr - 6], [hx - 12 + sw, hy - hr + 2]], pm, zH - 2, [-.2, -.4, 1], 1.4); } }
    if (ht === 'mummy') { for (let i = -6; i < 7; i += 3) H.fline(headR[1], hx - 7, hy + i, hx + 8, hy + i - 2, zH + 2); H.fr('#6a8a4a', hx - 3.6, hy + 3.4, 1.6, 1, zH + 3); }
    if (ht === 'orc') { H.fr('#fff8e0', hx + 3, hy + 3, 1, 3, zH + 4); H.fr('#fff8e0', hx + 7, hy + 3, 1, 3, zH + 4); H.fr(headR[0], hx + 1, hy - 3, 8, .8, zH + 4); }
    if (ht !== 'helm') H.face(o, hx, hy, H.R.tb, seed, headR, ht);
    // facial hair, accessories
    if (o.beard) { const bm = cloth(o.beard, { rim: .25, tex: 2 }); H.ell(hx + 3, hy + 6, 5.6, 3.9, bm, zH + 1, 3); H.fr(H.ramp(o.beard)[4], hx + 2, hy + 4, 3, .7, zH + 6); H.fr('#2a1a1a', hx + 3, hy + 4.2, 3, .8, zH + 6); }
    if (o.mustache) { const mm = cloth(typeof o.mustache === 'string' ? o.mustache : (o.hair || '#3a2a20'), { rim: .2 }); H.cap(hx + 1, hy + 3.6, hx + 7.6, hy + 3.6, 1, mm, zH + 2.5); H.cap(hx + .4, hy + 3.8, hx + .2, hy + 5.4, .7, mm, zH + 2.4); H.cap(hx + 8, hy + 3.8, hx + 8.4, hy + 5.4, .7, mm, zH + 2.4); }
    if (o.glasses) { const g = '#2a2a2a', z = zH + 6; H.fr(g, hx, hy - 2, 4, .8, z); H.fr(g, hx + 5, hy - 2, 4, .8, z); H.fr(g, hx, hy + 1, 4, .8, z); H.fr(g, hx + 5, hy + 1, 4, .8, z); H.fr(g, hx + 4, hy - 1, 1, .8, z); H.fr('#dcefff', hx + 1, hy - 1, .8, .8, z); }
    if (o.sweat) { const k = (t * 1.5 + seed) % 1; H.fr('#a8d8ff', hx - 6, hy - 4 + k * 6, 1, 2, zH + 6); H.fr('#a8d8ff', hx + 9, hy - 6 + ((k + .5) % 1) * 6, 1, 2, zH + 6); }
    // hats
    const hz = zH + 2;
    if (hat === 'crown' || hat === 'crownfire') { const cx = hx - 5, cy = hy - hr - 2; H.cap(cx, cy + 1.4, cx + 10, cy + 1.4, 1.5, mGold, hz); for (let i = 0; i < 4; i++) H.cap(cx + i * 3 + .5, cy, cx + i * 3 + .5, cy - 2.6, .75, mGold, hz - .4, .4); H.ell(cx + 5, cy + 1.4, .9, .8, H.mat(H.ramp('#c02030'), { spec: 1.2, rim: .4 }), hz + 1.6);
      if (hat === 'crownfire') for (let i = 0; i < 4; i++) { const fh = 3 + Math.abs(Math.sin(t * 9 + i * 1.7)) * 3; H.ell(cx + i * 3 + .5, cy - 3 - fh * .4, 1.1, fh * .5, H.mat(H.ramp('#f06020', '#601008', '#ffe080'), { emit: .7, dither: .6 }), hz + 1); } }
    else if (hat === 'helmet') { const m = metal('#8a929c'); H.ell(hx - 1, hy - 4, hr + 1, 6, m, zH - .5, 6, (u, v) => v < hy - .6); H.cap(hx - hr - .5, hy - .8, hx + hr - .5, hy - .8, .9, metal('#6a727c'), zH + 1); H.cap(hx + 4, hy - 1, hx + 4, hy + 3, .8, m, zH + 2); }
    else if (hat === 'straw') { const m = cloth('#d8b860', { rim: .2, tex: 2 }); H.ell(hx, hy - 6, hr + 5, 2.2, m, zH - 1, 1.2); H.ell(hx - 1, hy - 9, 6, 4, cloth('#c8a040', { tex: 2 }), zH - 3, 4, (u, v) => v < hy - 6.4); H.cap(hx - 6, hy - 7, hx + 4.6, hy - 7, .6, cloth('#8a3a2a'), zH - 1.4); }
    else if (hat === 'tophat') { const m = cloth('#2a2430', { rim: .4, spec: .2 }); H.cap(hx - 6.5, hy - 7, hx + 7.5, hy - 7, 1.3, m, zH - 1); H.poly([[hx - 4.5, hy - 17.5], [hx + 5.5, hy - 17.5], [hx + 5.5, hy - 7.6], [hx - 4.5, hy - 7.6]], m, zH - 2, [0, 0, 1], 2.6); H.cap(hx - 4.4, hy - 9.4, hx + 5.4, hy - 9.4, 1, cloth('#8a2a3a'), zH - 1.6); }
    else if (hat === 'feather') { H.ell(hx - 1, hy - 7, hr - .4, 3.6, cloth('#3a6a4a', { rim: .3 }), zH - 2, 3.2); const sw = Math.sin(t * 3); H.cap(hx - 4, hy - 9, hx - 12 + sw, hy - 17, 1, cloth('#e04040', { rim: .4 }), zH - 2.4, .4); H.fline('#f8a080', hx - 5, hy - 10, hx - 10 + sw, hy - 16, zH + 2); }
    else if (hat === 'wizard') { const m = cloth(o.hatC || '#3a2a5a', { rim: .4 }); H.poly([[hx - 9.6, hy - 5.4], [hx + 8.6, hy - 5.4], [hx - 6, hy - 21.5]], m, zH - 2, [-.1, -.25, 1], 2.4); H.cap(hx - 9, hy - 6.2, hx + 8, hy - 6.2, 1, metal(o.hatTrim || '#c8a040', { spec: .6 }), zH); }
    else if (hat === 'cap') { const m = cloth(o.hatC || '#6a4a8a', { rim: .3 }); H.ell(hx - 1, hy - 6, hr - .3, 3.6, m, zH - 2, 3.4, (u, v) => v < hy - 3.6); H.cap(hx + 3, hy - 4.4, hx + 9.4, hy - 4.2, .9, m, zH + .5); }
  },
  face(o, hx, hy, t, seed, skinR, ht) {
    const H = this, zF = 12.5 + (o.child ? 1 : 0), F = (c, a, b, w, h) => H.fr(c, a, b, w, h, zF), ol = '#2a1424', expr = o.expr || 'neutral', ex1 = hx + 1, ex2 = hx + 5, ey = hy - 1;
    if (ht === 'skull') { F('#1a1418', ex1 - 1, ey - 1, 3, 4); F('#1a1418', ex2 - 1, ey - 1, 4, 4); const gl = o.eyeGlow || '#70e0ff'; F(gl, ex1, ey + 1, 1, 1); F(gl, ex2 + 1, ey + 1, 1, 1);
      F('#1a1418', hx + 3, ey + 4, 1, 2); for (let i = 0; i < 4; i++) F(i % 2 ? H.rgbOf(skinR[4]) : '#1a1418', hx + 1 + i * 2, hy + 6, 1, 2); return; }
    const bp = (t + seed * 1.37) % 3.9, dbl = (seed % 3) === 1 && bp > .34 && bp < .44, blink = (bp < .12 || dbl) && expr !== 'hurt', half = !blink && expr !== 'hurt' && (bp < .19 || bp > 3.84 || (seed % 3 === 1 && bp > .27 && bp < .5));
    const look = o.look === undefined ? (Math.sin(t * .5 + seed) > .85 ? -1 : 0) : o.look;
    const eyeC = o.eye || '#2a1a14', iris = shade(eyeC, .38), white = '#fbf6ea', lid = H.rgbOf(skinR[1]);
    if (blink) { F(ol, ex1, ey + 1, 2, 1); F(ol, ex2, ey + 1, 2, 1); }
    else if (expr === 'happy') { for (const e of [ex1, ex2]) { F(ol, e, ey + 1, 1, 1); F(ol, e + 1, ey, 1, 1); F(ol, e + 2, ey + 1, 1, 1); } }
    else if (expr === 'hurt') { F(ol, ex1, ey - 1, 1, 1); F(ol, ex1 + 1, ey, 1, 1); F(ol, ex1, ey + 1, 1, 1); F(ol, ex2 + 1, ey - 1, 1, 1); F(ol, ex2, ey, 1, 1); F(ol, ex2 + 1, ey + 1, 1, 1); }
    else {
      const tall = expr === 'surprise' ? 4 : 3, lidOn = expr === 'annoyed' || expr === 'tired' || expr === 'smug';
      for (const e of [ex1, ex2]) {
        F(white, e, ey - (tall - 3), 2, tall); const px = look < 0 ? 0 : 1;
        F(iris, e + px - (px ? .1 : 0), ey, 1.1, 2); F(o.eyeGlow || eyeC, e + px, ey, 1, 1.1); F('#ffffff', e + px, ey - (tall - 3), .6, .6);
        F(ol, e - .1, ey - (tall - 3) - .55, 2.2, .55);
        if (lidOn) F(lid, e, ey - (tall - 3), 2, 1.2);
        if (half) { F(lid, e, ey - (tall - 3), 2, tall - 1); F(ol, e, ey + 1, 2, 1); }
      }
    }
    if (expr === 'annoyed' || expr === 'angry') { F(ol, ex1 - 1, ey - 3, 2, 1); F(ol, ex1 + 1, ey - 2, 1, 1); F(ol, ex2 + 1, ey - 3, 2, 1); F(ol, ex2, ey - 2, 1, 1); }
    else if (expr === 'surprise') { F(ol, ex1, ey - 4, 2, 1); F(ol, ex2, ey - 4, 2, 1); }
    else if (expr === 'smug') { F(ol, ex1, ey - 2.5, 2, .8); F(ol, ex2, ey - 3.2, 2, .8); }
    else if (!o.noBrow) { const bc = shade(o.hair || '#5a3a24', -.25); F(bc, ex1, ey - 2.9, 2, .55); F(bc, ex2, ey - 2.9, 2, .55); }
    F(H.rgbOf(skinR[2]), hx + 7.2, hy + 1, .9, 1.6);
    if (o.redNose) { F('#d05050', hx + 6, hy, 3, 3); F('#f09090', hx + 7, hy, 1, 1); }
    if (ht === 'human') { F('#f0a090', hx - .6, hy + 2.2, 1.6, .8); F('#f0a090', hx + 6.6, hy + 2.2, 1, .8); }
    const my = hy + 4, talkOpen = o.talking && Math.floor(t * 11 + seed) % 2 === 0;
    if (talkOpen) { F(ol, hx + 2, my, 3, 2); F('#a03a3a', hx + 3, my + 1, 1, 1); }
    else if (expr === 'happy') { F(ol, hx + 1, my, 1, 1); F(ol, hx + 2, my + 1, 3, 1); F(ol, hx + 5, my, 1, 1); F('#c85a5a', hx + 2.6, my + 1.7, 1.6, .5); }
    else if (expr === 'surprise') F(ol, hx + 2, my, 2, 2);
    else if (expr === 'hurt' || expr === 'tired') { F(ol, hx + 1, my + 1, 1, 1); F(ol, hx + 2, my, 1, 1); F(ol, hx + 3, my + 1, 1, 1); F(ol, hx + 4, my, 1, 1); }
    else if (expr === 'smug') { F(ol, hx + 2, my + 1, 3, 1); F(ol, hx + 5, my, 1, 1); }
    else if (expr === 'angry') { F(ol, hx + 1, my, 5, 2); F('#ffffff', hx + 2, my, 3, .8); }
    else F('#7a3a3a', hx + 2, my, 3, .9);
  },
  weapon(o, h, a, z, t, layer) {
    const H = this, w = o.weapon, wt = o.wTier || 0, [hx, hy] = h; if (!w || w === 'none') return;
    const R = (c, d = '#1a1a30', l = '#fff8f0') => H.ramp(c, d, l, 6, .78, .5), metal = (c, o2) => H.mat(R(c), Object.assign({ rim: .45, spec: .95, dither: .2 }, o2)), wood = (c, o2) => H.mat(H.ramp(c, '#1c0c10', '#f0c888', 6, .75, .5), Object.assign({ rim: .3, spec: .3, dither: .2 }, o2));
    if (w === 'shield') { if (layer !== 'shield') return; const sx = hx + 3, sy = hy - 4, sc = o.shieldC || '#8a5a3a';
      H.ell(sx, sy, 6.4, 9.4, H.mat(H.ramp(sc, '#1a0c10', '#f8d8a8'), { rim: .4, spec: .3 }), z, 3); H.cap(sx - .2, sy - 8.6, sx - .2, sy + 8.6, .9, metal('#a0a0a8'), z + 1); H.ell(sx, sy, 1.8, 1.8, metal('#c8a040'), z + 2.6, 1.5); return; }
    if (layer === 'shield') return;
    const wa = o.wAng !== undefined ? o.wAng : a + 2.6, dx = Math.sin(wa), dy = -Math.cos(wa);
    if (w === 'sword' || w === 'darksword' || w === 'knife') {
      if (layer !== 'over') return;
      const len = w === 'knife' ? 7 : 12 + wt * 1.6, bladeC = w === 'darksword' ? '#3a3040' : wt >= 3 ? '#dce6f0' : wt >= 1 ? '#c4cad4' : '#a89a88', ex = hx + dx * len, ey = hy + dy * len;
      const mBl = H.mat(H.ramp(bladeC, '#1a1a30', w === 'darksword' ? '#c090ff' : '#ffffff', 6, .72, .8), { rim: .5, spec: 1.1, dither: .15 });
      H.cap(hx + dx * 1.5, hy + dy * 1.5, ex, ey, w === 'knife' ? 1 : 1.35, mBl, z + 3, .7);
      H.fline(w === 'darksword' ? '#a060e0' : shade(bladeC, .5), hx + dx * 3 + .3, hy + dy * 3 - .2, ex - dx * 1.5, ey - dy * 1.5, z + 3);
      const gx = -dy, gy = dx, gw = w === 'knife' ? 2 : 3 + (wt >= 2 ? 1 : 0), gold = wt >= 4 || w === 'darksword', gc = gold ? H.mat(H.ramp('#d8a838', '#2a1808', '#fff8c0', 6, .75, .7), { spec: 1, rim: .4 }) : H.mat(H.ramp('#8a6a3a'), { spec: .3 });
      H.cap(hx + dx * 1.4 - gx * gw, hy + dy * 1.4 - gy * gw, hx + dx * 1.4 + gx * gw, hy + dy * 1.4 + gy * gw, .85, gc, z + 4);
      H.cap(hx, hy, hx - dx * 2.6, hy - dy * 2.6, .8, H.mat(H.ramp('#5a3a22'), { spec: .2 }), z + 2.5);
      H.ell(hx - dx * 3.6, hy - dy * 3.6, 1.05, 1.05, gold ? gc : metal('#8a8a94'), z + 3);
      if (o.swordGlow) H.fline(o.swordGlow, hx + dx * 3, hy + dy * 3, ex, ey, z + 5);
    } else if (w === 'bow' || w === 'ebow') {
      const dr = o.draw || 0, bc = w === 'ebow' ? '#d8d0c0' : wt >= 3 ? '#6a3a2a' : '#8a5a30', bend = 4 + dr * 2 + wt * .3, hh = 11 + wt, mW = wood(bc, { spec: .35 });
      const pts = []; for (let i = 0; i <= 14; i++) { const k = i / 14; pts.push([hx + 2 + Math.sin(k * Math.PI) * bend, hy - hh + k * hh * 2, k]); }
      const sx = hx + 2 - dr * 7;
      if (layer === 'under') {
        H.fline('#ece4d4', pts[0][0], pts[0][1] + .3, sx, hy, z - 1); H.fline('#ece4d4', sx, hy, pts[14][0], pts[14][1] - .3, z - 1);
        if (dr > .1 || o.nocked) { const zz = z + 6; H.fline('#8a5a3a', sx, hy, hx + 10, hy, zz); H.fr('#d8dce4', hx + 9.6, hy - .9, 1.8, 1.8, zz); H.fpx('#ffffff', hx + 10.6, hy - .6, zz); H.fr('#e04848', sx - 1.4, hy - 1.2, 1.6, .8, zz); H.fr('#e04848', sx - 1.4, hy + .6, 1.6, .8, zz); }
        return;
      }
      for (let i = 0; i < 14; i++) { const p = pts[i], q = pts[i + 1], r = .55 + Math.sin(p[2] * Math.PI) * .5; H.cap(p[0], p[1], q[0], q[1], r, mW, z + 2.6); }
      H.cap(hx + 2 + bend - .6, hy - 1.6, hx + 2 + bend - .6, hy + 1.6, 1.05, H.mat(H.ramp('#5a3020'), { spec: .2 }), z + 3.2);
      H.fpx('#f0e8d8', pts[0][0], pts[0][1]); H.fpx('#f0e8d8', pts[14][0], pts[14][1] - .5);
      if (wt >= 4) H.ell(pts[7][0] + .4, pts[7][1] - 3, .9, .9, H.mat(H.ramp('#d8a838', '#2a1808', '#fff8c0'), { spec: 1.2 }), z + 4);
    } else if (w === 'staff' || w === 'skullstaff') {
      const len = 22, bx = hx - dx * 7, by = hy - dy * 7, ex = hx + dx * len * .7, ey = hy + dy * len * .7, el = o.element || 'fire';
      if (layer === 'under') { H.cap(bx, by, ex, ey, .95, wood(wt >= 3 ? '#5a3a5a' : '#7a5230'), z - .6); return; }
      if (w === 'skullstaff') { H.ell(ex, ey - 2, 3.4, 3.4, H.mat(H.ramp('#e8e2cc', '#2a2034', '#ffffff'), { rim: .3, spec: .3 }), z + 2); H.fr('#1a1418', ex - 1.4, ey - 2.6, 1, 1.2, z + 6); H.fr('#1a1418', ex + .6, ey - 2.6, 1, 1.2, z + 6); H.fpx('#80ff90', ex - 1, ey - 2.2, z + 7); return; }
      const ring = H.mat(H.ramp(wt >= 3 ? '#d8a838' : '#a0a4b0', '#1a1a30', '#ffffff', 6, .75, .7), { spec: 1, rim: .4 });
      H.cap(ex - dx * .6 - dy * 1.6, ey - dy * .6 + dx * 1.6, ex - dx * .6 + dy * 1.6, ey - dy * .6 - dx * 1.6, .7, ring, z + 2);
      const pulse = Math.sin(t * 5) * .8;
      if (el === 'fire') { const f = Math.floor(t * 12) % 4, fh = 4.2 + [0, .8, .3, 1.1][f];
        H.ell(ex, ey - 1.6, 2.6, 2.1, H.mat(H.ramp('#a02810'), { emit: .5, dither: .5 }), z + 3);
        H.ell(ex + [0, .3, -.2, .1][f], ey - 2.2 - fh * .25, 2.1, fh * .55, H.mat(H.ramp('#f06020', '#601008', '#ffe080'), { emit: .62, dither: .6 }), z + 3.4);
        H.ell(ex, ey - 2.2, 1.1, fh * .3, H.mat(H.ramp('#ffd040', '#c06010', '#fffbe0'), { emit: .85, dither: .4 }), z + 4); }
      else if (el === 'water') { H.ell(ex, ey - 3, 2.6, 3.6, H.mat(H.ramp('#2f7ad0', '#081838', '#e0f8ff', 6, .75, .6), { spec: 1.4, rim: .6, dither: .25 }), z + 3, 2.6);
        const a2 = t * 3; H.fpx('#bfe8ff', ex + Math.cos(a2) * 5, ey - 3 + Math.sin(a2) * 2, z + 5); H.fpx('#bfe8ff', ex + Math.cos(a2 + 3) * 4.4, ey - 3 + Math.sin(a2 + 3) * 1.8, z + 5); }
      else if (el === 'light') { H.ell(ex, ey - 3, 2.5 + pulse * .2, 2.5 + pulse * .2, H.mat(H.ramp('#f0d060', '#8a5a10', '#ffffff', 6, .6, .7), { emit: .78, dither: .5 }), z + 3);
        H.fr('#fff8d0', ex - .4, ey - 8.2 - pulse, .8, 2); H.fr('#fff8d0', ex - .4, ey + .6 + pulse, .8, 2); H.fr('#fff8d0', ex - 5.4 - pulse, ey - 3.4, 2, .8); H.fr('#fff8d0', ex + 3.4 + pulse, ey - 3.4, 2, .8); }
      else H.ell(ex, ey - 3, 2.6, 2.6, H.mat(H.ramp('#8a40c8', '#1a0830', '#f0d0ff'), { emit: .7, dither: .4 }), z + 3);
    } else if (w === 'bottle') { if (layer !== 'over') return; const ex = hx + dx * 5, ey = hy + dy * 5; H.cap(hx, hy, ex, ey, 1.7, H.mat(H.ramp('#4a8a4a', '#0a2010', '#d0ffd0'), { spec: 1.3, rim: .5 }), z + 2, 1.3); H.ell(ex, ey, .8, .8, wood('#c8a060'), z + 4); }
    else if (w === 'club' || w === 'axe' || w === 'halberd' || w === 'spear' || w === 'pitchfork' || w === 'cane' || w === 'hammer') {
      const long = w === 'halberd' || w === 'spear' || w === 'pitchfork', len = long ? 24 : w === 'cane' ? 9 : 12, ex = hx + dx * len, ey = hy + dy * len, back = w === 'halberd' || w === 'spear' ? 8 : 2, bx = hx - dx * back, by = hy - dy * back, px = -dy, py = dx;
      if (layer === 'under') { H.cap(bx, by, ex, ey, .95, wood(w === 'cane' ? '#6a4a2a' : '#7a5230'), z - .6); return; }
      if (w === 'club') H.cap(hx + dx * 7, hy + dy * 7, ex, ey, 2.1, wood('#8a6a42', { tex: 2 }), z + 2, 2.6);
      if (w === 'axe' || w === 'halberd') H.poly([[ex - px * .5, ey - py * .5], [ex + px * 7.5 - dx * 2.5, ey + py * 7.5 - dy * 2.5], [ex + px * 7.5 - dx * 9.5, ey + py * 7.5 - dy * 9.5], [ex - px * .5 - dx * 7, ey - py * .5 - dy * 7]], metal(w === 'halberd' ? '#8a8a9a' : '#a0a0a8'), z + 2, [-.25, -.3, 1], 1.2);
      if (w === 'spear' || w === 'halberd') H.cap(ex, ey, ex + dx * 5.5, ey + dy * 5.5, 1.2, metal('#d0d8e0'), z + 2.4, .2);
      if (w === 'pitchfork') { const m = metal('#a0a0a8'); for (let k = -1; k <= 1; k++) H.cap(ex + px * k * 2, ey + py * k * 2, ex + px * k * 2 + dx * 5, ey + py * k * 2 + dy * 5, .5, m, z + 2, .3); H.cap(ex - px * 2.2, ey - py * 2.2, ex + px * 2.2, ey + py * 2.2, .55, m, z + 2); }
      if (w === 'hammer') H.cap(ex - px * 4, ey - py * 4, ex + px * 4, ey + py * 4, 2.2, metal('#6a6a72'), z + 2);
    } else if (layer === 'over') {
      if (w === 'lute') { H.ell(hx + 1, hy, 4.6, 3.6, wood('#b07a3a', { spec: .5 }), z + 2, 2.4); H.ell(hx + 1, hy - .6, 1.1, 1.1, H.mat(H.ramp('#3a2010', '#000000', '#5a3a20'), { dither: 0 }), z + 5, .2); H.cap(hx + 4, hy - 2, hx + 11, hy - 7, .9, wood('#8a5a2a'), z + 3); H.fline('#f0e0c0', hx - 2, hy + .6, hx + 10.6, hy - 6.6, z + 6); }
      else if (w === 'ledger') { H.poly([[hx - 1, hy - 5], [hx + 7, hy - 5], [hx + 7, hy + 4], [hx - 1, hy + 4]], H.mat(H.ramp('#3a5a3a'), { rim: .3, spec: .1 }), z + 2, [.15, -.1, 1], .6); H.fr('#e8e0c0', hx + 1, hy - 3, 4, .8, z + 5); H.fr('#e8e0c0', hx + 1, hy - 1, 3, .8, z + 5); }
      else if (w === 'sign') { H.cap(hx, hy + 4, hx, hy - 16, .9, wood('#7a5230'), z - 1); H.poly([[hx - 8, hy - 22], [hx + 9, hy - 22], [hx + 9, hy - 12], [hx - 8, hy - 12]], H.mat(H.ramp('#e8dcc0', '#3a2a20', '#ffffff'), { rim: .2, tex: 2 }), z + 1, [.1, -.1, 1], .8); H.fr('#c03030', hx - 5, hy - 19, 11, 1, z + 4); H.fr('#c03030', hx - 4, hy - 16, 8, 1, z + 4); }
      else if (w === 'orb') { const pulse = Math.sin(t * 6); H.ell(hx + 3, hy - 2, 3.4 + pulse * .2, 3.4 + pulse * .2, H.mat(H.ramp(o.orbC || '#c060ff', '#1a0830', '#ffffff', 6, .7, .6), { emit: .62, spec: 1, dither: .4 }), z + 2); H.fpx('#ffffff', hx + 2, hy - 3, z + 6); }
    }
  },
  // ---------- frame assembly + cache ----------
  pose(o, t) {
    const seed = o.seed || 0, low = !!o.low, walking = o.walk !== undefined && o.walk !== null, A8 = typeof ANIM8 !== 'undefined' && ANIM8.on;
    const brSp = low ? 1.4 : 2.2, brA = low ? 1 : .5;
    const br = A8 && !walking ? [-1, 0, 1, 0][(((Math.floor((t * brSp + seed) / (Math.PI / 2)) % 4) + 4) % 4)] * brA * 1.25 : Math.sin(t * brSp + seed) * brA;
    let legF = 0, legB = 0, liftF = 0, liftB = 0, bob = 0, armSwing = 0, headBob = 0; const walk = o.walk;
    if (walking && A8) { const i = (((Math.floor(walk / (Math.PI / 4) + .5) % 8) + 8) % 8), K = ANIM8.walk[i]; legF = K[0]; legB = -K[0]; liftF = K[1]; liftB = K[2]; bob = K[3]; armSwing = K[4]; headBob = ANIM8.walk[(i + 7) % 8][3] * .5 - bob * .5; }
    else if (walking) { legF = Math.sin(walk) * 3; legB = -legF; liftF = Math.max(0, -Math.cos(walk)) * 1.5; liftB = Math.max(0, Math.cos(walk)) * 1.5; bob = -Math.abs(Math.sin(walk)); armSwing = Math.sin(walk) * .6; }
    return { br, legF, legB, liftF, liftB, bob, armSwing, walking, headBob };
  },
  SKIP: new Set(['t', 'walk', 's', 'face', 'alpha', 'rot', 'sq', 'shadow', 'talking', 'look', 'hero', 'noSec']),
  // does this figure have parts that move with time (flames, swaying hair, flutter)? then frames step at 12 fps
  anim(o) {
    const hs = o.hairStyle, A = this.pal(o);
    return o.weapon === 'staff' || o.weapon === 'orb' || o.sweat || o.plume || o.hat === 'crownfire' || o.hat === 'feather' || ((hs === 'long' || hs === 'longdark') && !o.hood && o.hat !== 'hoodDark' && o.hat !== 'scarf') || (A.cape && !o._cape);
  },
  key(o, P, s, face, t, tq) {
    const r = v => Math.round(v * 40), parts = [s, face, PAINT || '', tq === null ? '' : 'T' + Math.round(tq * 12)];
    for (const k in o) { if (this.SKIP.has(k)) continue; const v = o[k]; if (v === undefined || v === null || v === false) continue;
      if (typeof v === 'number') parts.push(k + r(v)); else if (Array.isArray(v)) parts.push(k + v.map(p => Array.isArray(p) ? Math.round(p[0] * 2) + ',' + Math.round(p[1] * 2) : p).join(';')); else if (typeof v === 'object') parts.push(k + JSON.stringify(v)); else parts.push(k + v); }
    const seed = o.seed || 0, bp = (t + seed * 1.37) % 3.9, blink = bp < .12 || ((seed % 3) === 1 && bp > .34 && bp < .44) ? 1 : bp < .19 || bp > 3.84 || (seed % 3 === 1 && bp > .27 && bp < .5) ? 2 : 0;
    const look = o.look === undefined ? (Math.sin(t * .5 + seed) > .85 ? 1 : 0) : o.look, tk = o.talking ? 1 + Math.floor(t * 11 + seed) % 2 : 0;
    parts.push(blink, look, tk, r(P.br), r(P.legF), r(P.liftF), r(P.liftB), r(P.bob), r(P.armSwing), r(P.headBob));
    return parts.join('|');
  },
  get(o, s, face, t) {
    const P = this.pose(o, t), tq = this.anim(o) ? Math.floor(t * 12) / 12 : null, k = this.key(o, P, s, face, t, tq); let e = this.cache.get(k);
    if (e) { this.cache.delete(k); this.cache.set(k, e); this.stats.hit++; return e; }
    const t0 = performance.now(); this.stats.miss++;
    this.begin(s, face); this.R.tb = t; P.s = s; P.t = tq === null ? t : tq; P.tb = t; this.rig(o, P); this.shadeAll(PAINT);
    const R = this.R, b = R.b; e = { ox: R.ox, oy: R.oy };
    // reuse an evicted canvas when possible
    let c = null; if (this.cache.size >= 640) { const [k0, e0] = this.cache.entries().next().value; this.cache.delete(k0); if (e0.c.width === b.W && e0.c.height === b.H) c = e0.c; }
    if (!c) { c = document.createElement('canvas'); c.width = b.W; c.height = b.H; }
    const x = c.getContext('2d'); const id = x.createImageData(b.W, b.H); id.data.set(b.O); x.putImageData(id, 0, 0);
    e.c = c; this.cache.set(k, e); this.stats.ms += performance.now() - t0; return e;
  },
  can(o) { return !!o && this.on && !o.noHD && o.head !== 'bull' && typeof document !== 'undefined'; },
  draw(x, y, o) {
    const s = o.s || 1, face = (o.face || 1) < 0 ? -1 : 1, t = o.t === undefined ? T : o.t, a = o.alpha === undefined ? 1 : o.alpha;
    if (o.shadow !== false && !PAINT) { const pa = ctx.globalAlpha; ctx.globalAlpha = pa * a * .42; pEll('#24123a', Math.round(x), Math.round(y), 10 * s, 3 * s); pEll('#24123a', Math.round(x), Math.round(y), 7 * s, 2 * s); ctx.globalAlpha = pa; }
    const q = ctx._q > 1 ? ctx._q : 1, e = this.get(o, s * q, face, t); // HD hi-res captures (HIGH) render at 2x detail
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (face < 0) ctx.scale(-1, 1); if (a !== 1) ctx.globalAlpha *= a;
    if (o.rot) ctx.rotate(o.rot); if (o.sq && o.sq !== 1) ctx.scale(1 + (1 - o.sq) * .7, o.sq);
    ctx.imageSmoothingEnabled = false; if (q > 1) ctx.drawImage(e.c, -e.ox / q, -e.oy / q, e.c.width / q, e.c.height / q); else ctx.drawImage(e.c, -e.ox, -e.oy); ctx.restore();
  }
};
// the player look carries a marker so only the hero takes the HD path
(function () {
  const _pl = playerLook; playerLook = function (extra) { const o = _pl(extra); o.hero = true; return o; };
  const _dc = drawChar; drawChar = function (x, y, o) { if (HeroHD.can(o)) { const n = typeof Sec !== 'undefined' ? Sec.prep(x, y, o) : o; return HeroHD.draw(x, y, n); } return _dc(x, y, o); };
  // humanoid enemies are drawn through drawChar inside drawMonster: skip the generic SpriteFX re-light for them
  const _dm = drawMonster; drawMonster = function (def, x, y, st) {
    if (def && def.arch === 'human' && HeroHD.on && !(def.look && def.look.head === 'bull') && typeof SpriteFX !== 'undefined') { const was = SpriteFX.on; SpriteFX.on = false; try { return _dm(def, x, y, st); } finally { SpriteFX.on = was; } }
    return _dm(def, x, y, st);
  };
})();
