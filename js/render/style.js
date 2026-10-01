'use strict';
/* =========================================================
   ART STYLE LAYER
   - SpriteFX: every character / monster is drawn into a scratch buffer and
     re-lit from the top-left (rim light, form shadow, coloured "sel-out" outline)
     so flat sprites read as rounded 3D-ish forms.
   - Grade: whole-frame colour grade (richer saturation, hue-shifted shadows,
     warm highlights) applied to the low-res world buffer every frame.
   ========================================================= */
const SpriteFX = {
  on: true, depth: 0, bufs: {},
  buf(w, h) { const k = w + 'x' + h; let b = this.bufs[k]; if (!b) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = false; b = this.bufs[k] = { c, x }; this.track(x); } return b; },
  // perf: remember the device-pixel bounds of everything drawn into a scratch buffer, so the
  // read-back + shading pass only touches the figure itself instead of the whole (mostly empty) buffer
  bb: { on: false, x0: 0, y0: 0, x1: 0, y1: 0 },
  track(x) {
    const P2 = CanvasRenderingContext2D.prototype, b = this.bb; let dirty = true, m = null;
    for (const k of ['setTransform', 'translate', 'scale', 'rotate', 'transform', 'resetTransform', 'restore']) x[k] = function () { dirty = true; return P2[k].apply(this, arguments); };
    const tr = (X, Y, W, H) => {
      if (!b.on) return; if (dirty) { m = P2.getTransform.call(x); dirty = false; }
      let x0, y0, x1, y1;
      if (m.b === 0 && m.c === 0) { x0 = m.a * X + m.e; x1 = m.a * (X + W) + m.e; y0 = m.d * Y + m.f; y1 = m.d * (Y + H) + m.f; if (x0 > x1) { const t = x0; x0 = x1; x1 = t; } if (y0 > y1) { const t = y0; y0 = y1; y1 = t; } }
      else { const xs = [X, X + W, X, X + W], ys = [Y, Y, Y + H, Y + H]; x0 = y0 = 1e9; x1 = y1 = -1e9; for (let i = 0; i < 4; i++) { const px = m.a * xs[i] + m.c * ys[i] + m.e, py = m.b * xs[i] + m.d * ys[i] + m.f; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; } }
      if (x0 < b.x0) b.x0 = x0; if (y0 < b.y0) b.y0 = y0; if (x1 > b.x1) b.x1 = x1; if (y1 > b.y1) b.y1 = y1;
    };
    x.fillRect = function (X, Y, W, H) { tr(X, Y, W, H); return P2.fillRect.call(this, X, Y, W, H); };
    x.drawImage = function (img, a, b2, c, d, e, f, g, h) { const n = arguments.length; if (n === 3) tr(a, b2, img.width, img.height); else if (n === 5) tr(a, b2, c, d); else tr(e, f, g, h); return P2.drawImage.apply(this, arguments); };
    for (const k of ['fill', 'stroke', 'fillText', 'strokeText', 'putImageData', 'clearRect']) x[k] = function () { if (b.on && k !== 'clearRect') { b.x0 = 0; b.y0 = 0; b.x1 = 1e9; b.y1 = 1e9; } return P2[k].apply(this, arguments); };
  },
  // draw fn() (which draws around the origin at x,y) through the shading pass
  wrap(x, y, s, fn) {
    if (!this.on || this.depth > 0 || PAINT) { this.depth++; try { fn(x, y); } finally { this.depth--; } return; }
    const q = ctx._q > 1 ? ctx._q : 1;
    const Wl = Math.min(900, Math.ceil(150 * s / 8) * 8), Hl = Math.min(900, Math.ceil(160 * s / 8) * 8), ox = Wl / 2, oy = Math.round(Hl * .78), W = Wl * q, H = Hl * q;
    const b = this.buf(W, H), bx = b.x; bx.setTransform(1, 0, 0, 1, 0, 0); bx.globalAlpha = 1; bx.globalCompositeOperation = 'source-over'; bx.clearRect(0, 0, W, H); bx.setTransform(q, 0, 0, q, 0, 0); bx._q = q;
    const prev = useCtx(bx); const rx = Math.round(x * q) / q, ry = Math.round(y * q) / q, fx = x - rx, fy = y - ry;
    const bb = this.bb, was = bb.on; bb.on = true; bb.x0 = 1e9; bb.y0 = 1e9; bb.x1 = -1e9; bb.y1 = -1e9;
    this.depth++; try { fn(ox + fx, oy + fy); } finally { this.depth--; useCtx(prev); bb.on = was; }
    bx.setTransform(1, 0, 0, 1, 0, 0);
    if (!(bb.x1 > bb.x0)) return; // nothing drawn
    // shade only the drawn region (+ a margin for the outline / shadow taps)
    const pad = 3 * q, X0 = Math.max(0, Math.floor(bb.x0) - pad), Y0 = Math.max(0, Math.floor(bb.y0) - pad), X1 = Math.min(W, Math.ceil(bb.x1) + pad), Y1 = Math.min(H, Math.ceil(bb.y1) + pad), RW = X1 - X0, RH = Y1 - Y0;
    if (RW <= 0 || RH <= 0) return;
    this.shade(bx, RW, RH, q, X0, Y0);
    const lx = X0 / q, ly = Y0 / q, lw = RW / q, lh = RH / q;
    if (q > 1) ctx.drawImage(b.c, X0, Y0, RW, RH, rx - ox + lx, ry - oy + ly, lw, lh); else ctx.drawImage(b.c, X0, Y0, RW, RH, Math.round(x) - ox + X0, Math.round(y) - oy + Y0, RW, RH);
  },
  shade(bx, W, H, q = 1, RX = 0, RY = 0) {
    const id = bx.getImageData(RX, RY, W, H), d = id.data, n = W * H;
    // bounds
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    const u = new Uint32Array(d.buffer, d.byteOffset, n);
    for (let y = 0; y < H; y++) { const row = y * W; let a = -1, z = -1; for (let x = 0; x < W; x++) if (u[row + x]) { a = x; break; } if (a < 0) continue; for (let x = W - 1; x >= a; x--) if (u[row + x]) { z = x; break; } if (a < x0) x0 = a; if (z > x1) x1 = z; if (y < y0) y0 = y; y1 = y; }
    if (x1 < 0) return;
    x0 = Math.max(2 * q, x0 - 1); y0 = Math.max(2 * q, y0 - 1); x1 = Math.min(W - 1 - 2 * q, x1 + 1); y1 = Math.min(H - 1 - 2 * q, y1 + 1);
    const m = this._m && this._m.length >= n ? this._m : (this._m = new Uint8Array(n)); // 0 = outside, 1 = outline, 2 = body
    for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) { const i = y * W + x, p = i * 4; m[i] = d[p + 3] < 190 ? 0 : 2; }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * W + x; if (m[i] !== 2) continue; const p = i * 4, lum = d[p] * .3 + d[p + 1] * .59 + d[p + 2] * .11;
      if (lum < 52 && (m[i - 1] === 0 || m[i + 1] === 0 || m[i - W] === 0 || m[i + W] === 0)) m[i] = 1;
    }
    const out = (i) => m[i] !== 2;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * W + x, p = i * 4; const mm = m[i]; if (!mm) continue;
      let r = d[p], g = d[p + 1], b = d[p + 2];
      if (mm === 1) { // coloured outline: borrow the hue of the body pixel next to it
        let j = -1; if (m[i + 1] === 2) j = i + 1; else if (m[i - 1] === 2) j = i - 1; else if (m[i - W] === 2) j = i - W; else if (m[i + W] === 2) j = i + W;
        if (j >= 0) { const q = j * 4; r = d[q] * .32 + 22; g = d[q + 1] * .24 + 12; b = d[q + 2] * .3 + 30; } else { r = 30; g = 18; b = 38; }
        d[p] = r; d[p + 1] = g; d[p + 2] = b; continue;
      }
      const Wq = W * q, lit = out(i - Wq) || out(i - q) || out(i - Wq - q);
      const sh1 = out(i + q) || out(i + Wq + q), sh2 = !sh1 && (out(i + 2 * q) || out(i + Wq * 2 + q));
      if (lit && !sh1) { r = r + (255 - r) * .26 + 6; g = g + (250 - g) * .22 + 4; b = b + (225 - b) * .14; }
      else if (sh1) { r = r * .70 + 6; g = g * .70 + 2; b = b * .78 + 16; }
      else if (sh2) { r = r * .84 + 3; g = g * .84 + 1; b = b * .88 + 9; }
      d[p] = r; d[p + 1] = g; d[p + 2] = b;
    }
    bx.putImageData(id, RX, RY);
  }
};
// wrap the character + monster renderers
(function () {
  const _dc = drawChar; drawChar = function (x, y, o) { const s = (o && o.s) || 1; SpriteFX.wrap(x, y, s, (X, Y) => _dc(X, Y, o)); };
  const _dm = drawMonster; drawMonster = function (def, x, y, st) { const s = (def.scale || 1) * ((st && st.sMul) || 1) * (def.throne ? 1.6 : 1); SpriteFX.wrap(x, y, s, (X, Y) => _dm(def, X, Y, st)); };
})();

/* ---------- whole-frame colour grade ---------- */
const Grade = {
  on: true, lut: null, amt: 1,
  build() {
    // 6-bit-per-channel LUT
    const N = 64, L = new Uint8Array(N * N * N * 3);
    for (let ri = 0; ri < N; ri++) for (let gi = 0; gi < N; gi++) for (let bi = 0; bi < N; bi++) {
      let r = ri / (N - 1), g = gi / (N - 1), b = bi / (N - 1);
      const l = r * .3 + g * .59 + b * .11;
      // saturation boost (stronger on mid-saturated colours)
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx - mn, k = 1.32 - sat * .35;
      r = l + (r - l) * k; g = l + (g - l) * k; b = l + (b - l) * k;
      // shadows lean purple/teal, highlights lean warm
      const sh = Math.pow(1 - l, 2.2) * .22, hi = Math.pow(l, 2.4) * .10;
      r = r + (0.20 - r) * sh; g = g + (0.12 - g) * sh; b = b + (0.34 - b) * sh;
      r = r + (1.0 - r) * hi; g = g + (0.94 - g) * hi; b = b + (0.80 - b) * hi * .6;
      // gentle S-curve
      const sc = v => { v = Math.min(1, Math.max(0, v)); return v + (v - .5) * (1 - Math.abs(v - .5) * 2) * .14; };
      const o = (ri * N * N + gi * N + bi) * 3; L[o] = sc(r) * 255; L[o + 1] = sc(g) * 255; L[o + 2] = sc(b) * 255;
    }
    this.lut = L;
  },
  apply(c, w, h) {
    if (!this.on) return; if (!this.lut) this.build();
    const id = c.getImageData(0, 0, w, h), d = id.data, L = this.lut;
    for (let p = 0, n = d.length; p < n; p += 4) { const o = ((d[p] >> 2) * 4096 + (d[p + 1] >> 2) * 64 + (d[p + 2] >> 2)) * 3; d[p] = L[o]; d[p + 1] = L[o + 1]; d[p + 2] = L[o + 2]; }
    c.putImageData(id, 0, 0);
  }
};

/* ---------- GPU colour grade (WebGL) ----------
   Same curve as the CPU LUT above, but run as a fragment shader so the frame never
   has to be read back to JavaScript. Falls back to the CPU path if WebGL is missing. */
Grade.glc = null; Grade.glFail = false;
Grade.initGL = function (w, h) {
  try {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const gl = c.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    if (!gl) throw 0;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; uv.y = 1. - uv.y; gl_Position = vec4(p, 0., 1.); }'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, `precision mediump float; varying vec2 uv; uniform sampler2D t;
      float sc(float v){ v = clamp(v, 0., 1.); return v + (v - .5) * (1. - abs(v - .5) * 2.) * .14; }
      void main(){ vec3 c = texture2D(t, uv).rgb; float l = dot(c, vec3(.3, .59, .11));
        float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), k = 1.32 - (mx - mn) * .35;
        c = l + (c - l) * k;
        float s = pow(1. - l, 2.2) * .22, h = pow(l, 2.4) * .10;
        c += (vec3(.20, .12, .34) - c) * s;
        c.r += (1. - c.r) * h; c.g += (.94 - c.g) * h; c.b += (.80 - c.b) * h * .6;
        gl_FragColor = vec4(sc(c.r), sc(c.g), sc(c.b), 1.); }`));
    gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw 0; gl.useProgram(pr);
    const bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.viewport(0, 0, w, h); this.gl = gl; this.glc = c;
    c.addEventListener('webglcontextlost', e => { e.preventDefault(); this.glc = null; this.glFail = true; });
  } catch (e) { this.glFail = true; this.glc = null; }
};
// returns the canvas that should be upscaled to the screen this frame
Grade.process = function (src, w, h) {
  if (!this.on) return src;
  if (!this.glc && !this.glFail) this.initGL(w, h);
  if (this.glc) { const gl = this.gl; gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); return this.glc; }
  if (Gfx.level >= 2) this.apply(src.getContext('2d'), w, h); // CPU fallback only on High
  return src;
};

/* ---------- graphics quality: HIGH / MEDIUM / LOW / AUTO ----------
   HIGH   everything (sprite shading on every character, GPU colour grade, full particles)
   MEDIUM sprite shading only on the hero + combatants (not background villagers), fewer particles
   LOW    no sprite shading, no colour grade, half particles, no cloud shadows / water shimmer
   AUTO   starts on HIGH and steps down if the frame rate stays low.            */
const Gfx = {
  level: 2, names: ['LOW', 'MEDIUM', 'HIGH'], acc: 0, n: 0, slow: 0, warm: 0,
  mode() { return Settings.gfx || 'auto'; },
  apply() {
    const m = this.mode(); if (m !== 'auto') this.level = m === 'high' ? 2 : m === 'medium' ? 1 : 0;
    SpriteFX.on = this.level >= 1; Grade.on = this.level >= 1;
    Particles.budget = this.level >= 2 ? 250 : this.level === 1 ? 160 : 90;
  },
  cycle() { const order = ['auto', 'high', 'medium', 'low'], m = order[(order.indexOf(this.mode()) + 1) % order.length]; Settings.gfx = m; this.trim = 0; if (m === 'auto') this.level = 2; this.warm = 0; this.apply(); saveSettings(); },
  label() { const m = this.mode(), t = this.level >= 2 && this.trim ? ' -' + this.trim : ''; return m === 'auto' ? 'AUTO (' + this.names[this.level] + t + ')' : m.toUpperCase() + t; },
  // ---- adaptive HIGH ("trim") ----
  // HIGH keeps its look but, if the real frame rate stays low, quietly trims the most expensive
  // GPU/CPU work one step at a time:  1 = no light shafts + slightly lower 3D render res,
  // 2 = 1x (not 2x) character captures,  3 = 960x540 3D render.  It never drops you to MEDIUM.
  trim: 0, tAcc: 0, tN: 0, tSlow: 0, tWarm: 0,
  trimTick(dt) {
    if (this.level < 2 || Settings.adaptiveHigh === false || document.hidden || !HD.live) { this.tAcc = 0; this.tN = 0; this.tWarm = 0; return; }
    if (Scene.transitioning) { this.tWarm = 0; return; }
    this.tWarm += dt; if (this.tWarm < 2.5) { this.tAcc = 0; this.tN = 0; return; }
    this.tAcc += dt; this.tN++; if (this.tAcc < 1.5) return;
    const avg = this.tAcc / this.tN; this.tAcc = 0; this.tN = 0;
    if (avg > 1 / 50 && this.trim < 3) { if (++this.tSlow >= 2) { this.tSlow = 0; this.trim++; this.tWarm = 1.5; if (!this.tToast) { this.tToast = 1; Toast.add('HIGH: trimming heavy effects to stay smooth', COL.gold2, '⚙'); } } }
    else this.tSlow = 0; // (no automatic step back up: avoids see-sawing; re-pick HIGH in Settings to reset)
  },
  // called once per frame with the real frame interval
  tick(dt) {
    this.trimTick(dt);
    if (this.mode() !== 'auto' || document.hidden) return;
    if (Scene.transitioning) { this.warm = 0; return; }
    this.warm += dt; if (this.warm < 3) { this.acc = 0; this.n = 0; return; } // ignore loading hitches
    this.acc += dt; this.n++;
    if (this.acc >= 2) { const avg = this.acc / this.n; this.acc = 0; this.n = 0;
      if (avg > 1 / 42 && this.level > 0 && (this.level < 2 || this.trim >= 3 || Settings.adaptiveHigh === false)) { this.slow++; if (this.slow >= 2) { this.level--; this.slow = 0; this.warm = 0; this.apply(); Toast.add('Graphics set to ' + this.names[this.level] + ' for smoother play', COL.gold2, '⚙'); } }
      else this.slow = 0; }
  }
};
// background villagers skip the CPU shading pass below HIGH, and on HIGH-HD too (the GPU lit-sprite
// shader already gives them form light, rim and outline - doing both was the biggest per-frame CPU cost)
SpriteFX.minor = false;
(function () { const w = SpriteFX.wrap; SpriteFX.wrap = function (x, y, s, fn) { if (this.minor && (Gfx.level < 2 || (HD.on && HD.Q > 1 && Settings.litSprites !== false))) { this.depth++; try { fn(x, y); } finally { this.depth--; } return; } return w.call(this, x, y, s, fn); }; })();
