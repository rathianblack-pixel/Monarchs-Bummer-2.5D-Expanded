'use strict';
/* =========================================================
   LUCIEN INTRO — cinematic
   ========================================================= */
const LUCIEN_INTRO = [
  'I am Lucien. Sovereign of Scorn. Master of the Midnight Flame.',
  'My herald says I should shorten the title. I told him to shorten the heralding.',
  'He asked whether he was still employed. That depends on how this introduction goes.',
  'Another savior is coming, they say. The guards brought me a sketch.',
  'They drew your trousers in considerable detail. One guard insisted it was important.',
  'I asked for your face. He said he was behind you when you passed the gate.',
  'Reach this throne and tell me what you intend to save. I may even listen.',
  'If you fail, the herald wants your skull on the mantel. I told him that shelf is full.',
  'He measured the wall next to it. Please do not make him feel useful.'
];
const LUCIEN_INTRO_NG = ['Again? Hm. You are persistent. The herald has started a second sketch.', 'The trousers are the same. The throne is still uncomfortable. Come, then. Let us both pretend this is new.'];
function drawThroneRoom(t, flash, opts = {}) {
  const c = ctx; c.save();
  // 1 storm outside + 3 stained glass windows
  Cam.apply(c, .2); drawSkyGradient('#0a0612', '#2a0a1a', -100, 600);
  Cam.apply(c, .35);
  for (let i = 0; i < 3; i++) {
    const wx = 150 + i * 170, wy = 40; P('#0a0610', wx - 3, wy - 3, 46, 136); pEll('#0a0610', wx + 20, wy + 4, 23, 24);
    const lit = flash > .1; P(lit ? '#fff' : ['#3a1030', '#4a1020', '#1a2048'][i], wx, wy, 40, 130); pEll(lit ? '#fff' : ['#3a1030', '#4a1020', '#1a2048'][i], wx + 20, wy + 4, 20, 20);
    if (!lit) { const r = RNG(70 + i); for (let k = 0; k < 18; k++) P(r.pick(['#8a1a30', '#d8a040', '#3a2a8a', '#6a1a5a', '#a02030']), wx + r.i(2, 34), wy + r.i(0, 120), r.i(3, 8), r.i(3, 10)); for (let k = 0; k < 5; k++) P('#0a0610', wx, wy + k * 26, 40, 2); P('#0a0610', wx + 19, wy - 14, 2, 144); pCirc(opts.phase2 ? '#e0a030' : '#c02030', wx + 20, wy + 4, 6); }
    // outside glimpses through panes: distant lightning streak
    if (lit) { pLine('#c8c0ff', wx + 10, wy, wx + 25, wy + 60, 1); }
  }
  // rose window
  pCirc('#0a0610', 320, 30, 26); pCirc(flash > .1 ? '#fff' : '#5a1020', 320, 30, 22); if (flash <= .1) for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + t * .02; pLine('#d8a040', 320, 30, 320 + Math.cos(a) * 20, 30 + Math.sin(a) * 20, 1); }
  // 4 back pillars
  Cam.apply(c, .6);
  const pillar = (x, h, col, dk) => { P(dk, x - 1, 0, 26, h); P(col, x, 0, 24, h); P(shade(col, .12), x + 3, 0, 3, h); P(shade(col, -.3), x + 18, 0, 5, h); P(dk, x - 5, h - 14, 34, 14); P(col, x - 4, h - 13, 32, 10); for (let y = 20; y < h - 20; y += 40) P(dk, x, y, 24, 1); };
  const pc = flash > .3 ? '#050208' : '#2a1e2e', pd = '#0e0812';
  [40, 130, 486, 576].forEach(x => pillar(x, 290, pc, pd));
  // light rays from windows
  if (flash <= .3) { c.globalAlpha = .08; for (let i = 0; i < 3; i++) pPoly(opts.phase2 ? '#e0a030' : '#d04060', [[150 + i * 170, 60], [190 + i * 170, 60], [230 + i * 170 + 60, 330], [130 + i * 170 + 40, 330]]); c.globalAlpha = 1; }
  // 5 throne platform
  Cam.apply(c, 1);
  const floorY = 300; P('#120a14', -200, floorY, 1040, 200); for (let x = -200; x < 840; x += 16) for (let y = 0; y < 60; y += 8) if (((x / 16) + (y / 8)) % 2 === 0) P('#1c1220', x, floorY + y, 16, 8);
  P('#0a0610', 200, 250, 240, 52); P('#2a1a28', 204, 254, 232, 10); P('#221422', 212, 266, 216, 12); P('#1a0f1a', 220, 280, 200, 20); P('#6a1428', 290, 254, 60, 46); P('#8a1c30', 294, 254, 4, 46);
  // throne
  const tc = flash > .3 ? '#050208' : '#1a1020'; P('#0a0610', 283, 148, 74, 110); P(tc, 286, 150, 68, 104); pPoly(tc, [[286, 150], [320, 110], [354, 150]]); P(flash > .3 ? '#050208' : '#6a1428', 296, 160, 48, 80); P('#e0b040', 318, 118, 4, 30); P('#e0b040', 311, 124, 18, 3); P('#2a1a28', 276, 214, 18, 34); P('#2a1a28', 346, 214, 18, 34); P('#e0b040', 276, 214, 18, 2); P('#e0b040', 346, 214, 18, 2);
  c.restore();
}
Scenes.intro = {
  enter(a) {
    this.ng = !!(a && a.ng); this.lines = this.ng ? LUCIEN_INTRO_NG : LUCIEN_INTRO; this.i = -1; this.lt = 0; this.shown = 0; this.t = 0; this.flash = 0; this.nextFlash = 2.2; this.done = false;
    Cam.reset(320, 190, 1); Cam.follow = .6; Cam.tx = 320; Cam.ty = 205; Cam.tz = 1.25; Music.play('intro', 1.5); Amb.set('intro'); Post.letter = 0; this.smile = 0;
  },
  exit() { Post.letter = 0; Cam.follow = 6; },
  update(dt) {
    this.t += dt; Post.letter = Math.min(1, Post.letter + dt * .8);
    this.nextFlash -= dt; if (this.nextFlash <= 0) { this.nextFlash = rnd(4.5, 8); this.flash = 1; SFX.play('thunder', { v: .9 }); Later.add(.05, () => this.flash = .15); Later.add(.1, () => this.flash = .8); }
    this.flash = Math.max(0, this.flash - dt * 5);
    if (this.i < 0 && this.t > 1.8) this.next();
    if (this.i >= 0 && !this.done) {
      const L = this.lines[this.i]; const before = Math.floor(this.shown); this.shown = Math.min(L.length, this.shown + dt * 30 * Settings.text); if (Math.floor(this.shown) !== before && Math.floor(this.shown) % 3 === 0) blip('lucien');
      this.lt += dt; if (this.shown >= L.length && this.lt > L.length / 30 + 2.4) this.next();
      if (Input.hit(' ', 'Enter') || (Input.mouse.clicked && !UI.inRect(1100, 20, 170, 40))) { Input.mouse.clicked = false; if (this.shown < L.length) this.shown = L.length; else this.next(); }
    }
    // camera: extremely slow push, face approach at end
    const prog = Math.max(0, this.i) / this.lines.length; Cam.tz = 1.25 + prog * .9; Cam.ty = 205 - prog * 30; Cam.tx = 320;
    this.smile = clamp((this.i - (this.lines.length - 3)) / 3, 0, 1);
    if (chance(dt * 10)) Particles.spawn({ x: rnd(100, 540), y: rnd(80, 300), vx: rnd(-3, 3), vy: rnd(-2, 2), life: rnd(3, 6), c: '#a89080', size: 1, drag: 1 });
    if (Input.hit('Escape')) this.finish();
  },
  next() { this.i++; this.shown = 0; this.lt = 0; if (this.i >= this.lines.length) { this.done = true; Later.add(1.2, () => this.finish()); } },
  finish() { if (this.finished) return; this.finished = true; if (this.ng) Scene.go('village', { from: 'ng' }, { out: 1.2, in: .8 }); else Scene.go('creation', {}, { out: 1.2, in: .8 }); },
  draw() {
    const t = T; ctx.setTransform(1, 0, 0, 1, 0, 0); P('#050208', 0, 0, 640, 360);
    drawThroneRoom(t, this.flash);
    Cam.apply(ctx, 1);
    // Lucien seated
    if (this.flash > .3) PAINT = '#07040a';
    const L = ENEMY.lucien.look; const talking = this.i >= 0 && !this.done && this.shown < (this.lines[this.i] || '').length;
    drawChar(318, 252, Object.assign({}, L, { s: 1.35, face: 1, sit: true, t, seed: 3, expr: this.smile > .5 ? 'smug' : 'neutral', talking, armF: .9 + Math.sin(t * .8) * .03, wAng: 3.1, armB: .7, look: Math.sin(t * .3) > .6 ? 1 : 0, shadow: false, weapon: 'none' }));
    // finger tap
    if (!PAINT && Math.sin(t * 2.4) > .7) P('#ecd6c8', 331, 238, 1, 1);
    PAINT = null;
    if (this.flash > .3) { ctx.globalAlpha = .9; P('#fff', 305, 196, 1, 30); P('#fff', 337, 200, 1, 26); ctx.globalAlpha = 1; }
    // 7 front pillars, 8 chains/banners
    ctx.save(); Cam.apply(ctx, 1.35); const fp = this.flash > .3 ? '#020103' : '#0c0610';
    P(fp, -40, -60, 50, 460); P(fp, 630, -60, 50, 460);
    for (let i = 0; i < 2; i++) { const bx = [60, 560][i], sw = Math.sin(t * .9 + i) * 2; for (let k = 0; k < 14; k++) P(k % 2 ? '#3a3440' : '#5a5060', bx + Math.sin(k * .3 + t) * sw * .3, -40 + k * 6, 2, 4); }
    for (let i = 0; i < 2; i++) { const bx = [150, 470][i], sw = Math.sin(t * 1.1 + i * 2) * 2; pPoly('#3a0a18', [[bx, -30], [bx + 30, -30], [bx + 30 + sw, 70], [bx + 15 + sw, 58], [bx + sw, 70]]); P('#c8a040', bx + 13, 10, 4, 4); }
    ctx.restore();
    // 9 fog + 10 dust
    ctx.setTransform(1, 0, 0, 1, 0, 0); Weather.fog(.7, '#6a3a5a');
    Cam.apply(ctx, 1); Particles.draw(false);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // torch glows
    Light.begin([90, 70, 110]); Cam.apply(lctx, 1); wctx.getTransform && Cam.apply(wctx, 1);
    Light.add(210, 200, 90, '#ff9040', .8, .2); Light.add(430, 200, 90, '#ff9040', .8, .2); Light.add(320, 90, 160, '#c02040', .5); Light.add(320, 230, 70, '#ffe0c0', .35);
    if (this.flash > .1) Light.add(320, 100, 600, '#ffffff', this.flash * (Settings.flashes ? 1.2 : .4), 0, 0);
    Light.apply(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  },
  ui() {
    if (UI.btn('SKIP CINEMATIC ›', 1090, 20, 170, 36, { size: 13 })) this.finish();
    if (this.i >= 0 && !this.done) { const L = this.lines[this.i]; const s = L.slice(0, Math.floor(this.shown)); UI.text('LUCIEN', 640, 628, { align: 'center', size: 13, col: '#c04050' }); UI.para(s, 640 - 380, 656, 760, { size: 20, col: '#f0e0d0', align: 'left', lh: 26 }); }
  }
};
