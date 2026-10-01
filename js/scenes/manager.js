'use strict';
/* =========================================================
   SCENE MANAGER
   ========================================================= */
const Scenes = {};
const Scene = {
  cur: null, name: '', transitioning: false, tr: null,
  go(name, args, tr = {}) {
    if (this.transitioning) return; this.transitioning = true;
    this.tr = { type: tr.type || 'fade', out: tr.out === undefined ? .3 : tr.out, in: tr.in === undefined ? .35 : tr.in, hold: tr.hold || 0, col: tr.col || '#000', phase: 'out', t: 0, name, args, cx: tr.cx || 640, cy: tr.cy || 360 };
    if (tr.sound) SFX.play(tr.sound);
  },
  set(name, args) { if (this.cur && this.cur.exit) this.cur.exit(); Particles.clear(); FloatText.clear(); this.cur = Scenes[name]; this.name = name; Cam.reset(320, 180); if (this.cur.enter) this.cur.enter(args || {}); },
  update(dt) {
    const tr = this.tr; if (!this.transitioning || !tr) return; tr.t += dt;
    if (tr.phase === 'out') { tr.k = clamp(tr.t / Math.max(.001, tr.out), 0, 1); if (tr.t >= tr.out) { tr.phase = 'hold'; tr.t = 0; this.set(tr.name, tr.args); } }
    else if (tr.phase === 'hold') { tr.k = 1; if (tr.t >= tr.hold) { tr.phase = 'in'; tr.t = 0; } }
    else { tr.k = 1 - clamp(tr.t / Math.max(.001, tr.in), 0, 1); if (tr.t >= tr.in) { this.transitioning = false; this.tr = null; } }
  },
  draw() {
    const tr = this.tr; if (!tr) return; const k = Ease.ioQ(clamp(tr.k || 0, 0, 1)); g.fillStyle = tr.col;
    if (tr.type === 'door') { const w = 640 * k; g.fillRect(0, 0, w, 720); g.fillRect(1280 - w, 0, w, 720); g.globalAlpha = k * .8; g.fillRect(0, 0, 1280, 720); g.globalAlpha = 1; }
    else if (tr.type === 'iris') { g.save(); g.beginPath(); g.rect(0, 0, 1280, 720); g.arc(tr.cx, tr.cy, Math.max(0, (1 - k) * 900), 0, TAU, true); g.fill('evenodd'); g.restore(); }
    else if (tr.type === 'bars') { const h = 360 * k; g.fillRect(0, 0, 1280, h); g.fillRect(0, 720 - h, 1280, h); }
    else { g.globalAlpha = k; g.fillRect(0, 0, 1280, 720); g.globalAlpha = 1; }
  }
};
