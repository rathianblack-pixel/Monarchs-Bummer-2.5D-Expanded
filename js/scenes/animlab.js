'use strict';
/* =========================================================
   ANIMATION LAB  —  open index.html?animlab  (or FRAMES on the Model Sheet)
   Part 2 check sheet: the 8 walk keys, 4 breathing keys, blink keys, combat
   anticipation / follow-through strips and live secondary motion (cape, long hair,
   scarf, robe hem) on characters pacing back and forth.
   ========================================================= */
Scenes.animlab = {
  enter() {
    if (!S) { S = newSave({ name: 'Model', cls: 'sword' }); S.introSeen = true; S.hp = Stats.maxHP(); }
    this.t = 0; this.wind = false; Music.play('title', 1); Amb.set('silent');
    this.mock = Object.create(Scenes.combat); this.mock.mg = null; this.mock.cue = null;
  },
  update(dt) { this.t += dt; },
  look(extra) { return playerLook(Object.assign({ s: 1.5, face: 1, t: 0 }, extra)); },
  draw() {
    const c = ctx, t = this.t; c.setTransform(1, 0, 0, 1, 0, 0); P('#2a2630', 0, 0, 640, 360);
    for (let x = 0; x < 640; x += 20) P('#302c38', x, 0, 1, 360); for (let y = 0; y < 360; y += 20) P('#302c38', 0, y, 640, 1);
    const shadow = (x, y) => { c.globalAlpha = .25; pEll('#000', x, y, 12, 3); c.globalAlpha = 1; };
    // row 1: the 8 hand-keyed walk frames (frozen)
    for (let k = 0; k < 8; k++) { const x = 40 + k * 44, y = 78; shadow(x, y); drawChar(x, y, this.look({ walk: k * Math.PI / 4 + .01, noSec: true })); }
    // breathing keys: t chosen so each copy holds a different one of the 4 keys
    const brSp = 2.2; for (let k = 0; k < 4; k++) { const x = 420 + k * 44, y = 78; shadow(x, y); drawChar(x, y, this.look({ t: (k * Math.PI / 2 + .2 - 1) / brSp, seed: 1, noSec: true })); }
    // blink keys: open, half, closed, half (seed 1 -> double blink variant)
    const bt = [1.5, .15, .05, .17]; for (let k = 0; k < 4; k++) { const x = 420 + k * 44, y = 170; shadow(x, y); drawChar(x, y, this.look({ t: bt[k] - 1.37, seed: 1, noSec: true })); }
    // row 2: anticipation + follow-through, sampled from the real combat pose code
    const m = this.mock, strips = [['windup', [0, .08, .16]], ['strike', [.02, .08, .16, .3]], ['release', [0, .12, .26]]];
    let x = 30; const CY = typeof CGY !== 'undefined' ? CGY : 300;
    for (const [pose, ts] of strips) for (const pt of ts) { m.P = { x: 0, jy: 0, kb: 0, pose, poseT: 0, flash: 0, rot: 0 }; m.ct = pt; c.save(); c.translate(x, 170 - CY); try { m.drawP(); } catch (e) { console.error('animlab', pose, e); } c.restore(); x += 36; }
    // row 3: live secondary motion — pace back and forth so capes, hair, scarves and hems swing
    const pace = (i, sp) => { const u = Math.sin(t * sp + i), v = Math.cos(t * sp + i); return { x: 70 + i * 140 + u * 46, face: v >= 0 ? 1 : -1, walk: t * 11 }; };
    const actors = [
      o => drawChar(o.x, 300, Object.assign(this.look({ s: 1.6, t, cape: '#7a1c2a', tier: 4 }), o)),
      o => drawCompanion('lucien', o.x, 300, { s: 1.6, t, face: o.face, walk: o.walk }),
      o => drawChar(o.x, 300, Object.assign(this.look({ s: 1.6, t, hat: 'scarf', hatC: '#c04a5a', hood: false }), o)),
      o => drawCompanion('pell', o.x, 300, { s: 1.6, t, face: o.face, walk: o.walk })
    ];
    if (this.wind) World.wind = 1; else World.wind = .1;
    actors.forEach((fn, i) => { const o = pace(i, .9 + i * .15); shadow(o.x, 300); fn(o); });
  },
  ui() {
    UI.text('ANIMATION LAB', 24, 34, { size: 20, col: COL.gold2 }); UI.text('Part 2 check sheet · ' + (ANIM8.on ? 'ANIM v2 on' : 'legacy sine animation'), 230, 34, { size: 13, col: COL.dim, bold: false });
    UI.text('8-FRAME WALK  1 · 2 · 3 · 4 · 5 · 6 · 7 · 8', 40, 186, { size: 12, col: COL.cream, bold: false });
    UI.text('4-FRAME BREATH', 830, 186, { size: 12, col: COL.cream, bold: false }); UI.text('BLINK: open · half · shut · half', 830, 368, { size: 12, col: COL.cream, bold: false });
    UI.text('ANTICIPATION → STRIKE → FOLLOW-THROUGH (sword) · BOW RELEASE', 40, 368, { size: 12, col: COL.cream, bold: false });
    UI.text('SECONDARY MOTION (live): cape · long hair + robe · scarf · robe hem', 40, 640, { size: 12, col: COL.cream, bold: false });
    const bx = 1280 - 4 * 120;
    if (UI.btn(this.wind ? 'WIND: ON' : 'WIND: OFF', bx, 670, 130, 36)) this.wind = !this.wind;
    if (UI.btn(ANIM8.on ? 'ANIM v2' : 'LEGACY', bx + 140, 670, 120, 36)) Settings.anim = !ANIM8.on;
    if (UI.btn('Sheet', bx + 270, 670, 90, 36)) Scene.go('gallery');
    if (UI.btn('Title', bx + 370, 670, 90, 36, { style: 'ghost' })) { history.replaceState(null, '', location.pathname); Scene.go('title'); }
  }
};
if (/[?&]animlab\b/.test(location.search)) { const s0 = Scene.set; Scene.set = function (name, a) { Scene.set = s0; return s0.call(this, name === 'title' ? 'animlab' : name, a); }; }
