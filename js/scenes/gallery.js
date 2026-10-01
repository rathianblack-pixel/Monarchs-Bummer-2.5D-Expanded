'use strict';
/* =========================================================
   MODEL SHEET  —  open index.html?gallery
   Every creature, companion and hero class on one turntable-style
   sheet, with a SILHOUETTE toggle (readability check: every shape
   should be identifiable as a solid black blob) and a LOW/HIGH toggle.
   ========================================================= */
function galleryEntries() {
  const out = [];
  Object.keys(CLASSES).forEach(k => out.push({ name: CLASSES[k].name + ' hero', tag: 'PLAYER', h: 60, draw: (x, y, st) => drawChar(x, y, playerLook(Object.assign({ s: 1.1 * st.k, face: 1, t: st.t, walk: st.walk }, { weapon: CLASSES[k].weapon, element: CLASSES[k].element }))) }));
  ['lucien', 'pell', 'honk'].forEach(id => out.push({ name: COMPANIONS[id].name, tag: 'COMPANION', h: 60, draw: (x, y, st) => drawCompanion(id, x, y, { s: 1.1 * st.k, t: st.t, walk: st.walk, face: 1 }) }));
  for (const e of ENEMIES.concat(SIDE_ENEMIES || [])) out.push({ name: e.name, tag: (e.area >= 5 || SIDE_ENEMIES.includes(e) ? 'ACT II · ' : 'ACT I · ') + (e.boss ? 'BOSS' : 'area ' + (e.area + 1)), h: 64 * (e.scale || 1) * (e.arch === 'rider' ? 1.8 : e.arch === 'human' ? 1.1 : 1), def: e, draw: (x, y, st) => drawMonster(e, x, y, { t: st.t, face: 1, sMul: st.k, walk: st.walk, flash: st.sil, flashCol: '#000' }) });
  out.push({ name: 'The Bummer', tag: 'ACT II · the whale', h: 70, draw: (x, y, st) => drawMonster({ id: 'whale', arch: 'whale', scale: .9, look: {} }, x, y, { t: st.t, face: 1, sMul: st.k, breath: Math.sin(st.t), flash: st.sil, flashCol: '#000' }) });
  return out;
}
Scenes.gallery = {
  enter() {
    if (!S) { S = newSave({ name: 'Model', cls: 'sword' }); S.introSeen = true; S.hp = Stats.maxHP(); }
    this.t = 0; this.page = 0; this.sil = false; this.walk = false; this.list = galleryEntries(); this.per = 12; Music.play('title', 1); Amb.set('silent');
  },
  pages() { return Math.ceil(this.list.length / this.per) + 1; },
  update(dt) { this.t += dt; },
  draw() {
    const c = ctx, t = this.t; c.setTransform(1, 0, 0, 1, 0, 0);
    P(this.sil ? '#e8e4dc' : '#2a2630', 0, 0, 640, 360);
    for (let x = 0; x < 640; x += 20) P(this.sil ? '#dcd8d0' : '#302c38', x, 0, 1, 360); for (let y = 0; y < 360; y += 20) P(this.sil ? '#dcd8d0' : '#302c38', 0, y, 640, 1);
    if (this.page >= this.pages() - 1) { // material ramp page
      const keys = Object.keys(MAT); keys.forEach((k, i) => { const x = 20 + (i % 4) * 155, y = 40 + Math.floor(i / 4) * 34; MAT[k].forEach((col, j) => P(col, x + j * 18, y, 18, 18)); });
      return;
    }
    const L = this.list.slice(this.page * this.per, (this.page + 1) * this.per);
    L.forEach((e, i) => {
      const cx = 80 + (i % 4) * 160, by = 100 + Math.floor(i / 4) * 106; const k = Math.min(1, 74 / Math.max(30, e.h));
      if (!this.sil) { c.globalAlpha = .25; pEll('#000', cx, by, 22, 4); c.globalAlpha = 1; }
      const st = { t: t + i * .7, k, sil: this.sil, walk: this.walk ? t * 9 : undefined };
      if (this.sil) PAINT = '#000'; try { e.draw(cx, by, st); } catch (err) { console.error('gallery', e.name, err); } PAINT = null;
    });
  },
  ui() {
    const L = this.list.slice(this.page * this.per, (this.page + 1) * this.per), last = this.page >= this.pages() - 1;
    UI.text('MODEL SHEET', 24, 34, { size: 20, col: COL.gold2 }); UI.text(`page ${this.page + 1}/${this.pages()} · ${this.list.length} models · gfx ${Gfx.label()}`, 200, 34, { size: 13, col: COL.dim, bold: false });
    if (last) Object.keys(MAT).forEach((k, i) => UI.text(k, 40 + (i % 4) * 310, 74 + Math.floor(i / 4) * 68, { size: 12, col: COL.cream, bold: false }));
    else L.forEach((e, i) => { const cx = (80 + (i % 4) * 160) * 2, by = (100 + Math.floor(i / 4) * 106) * 2; UI.text(e.name, cx, by + 24, { align: 'center', size: 13, col: this.sil ? '#222' : COL.cream }); UI.text(e.tag, cx, by + 40, { align: 'center', size: 10, col: this.sil ? '#555' : COL.dim, bold: false }); });
    const bx = 1280 - 6 * 120;
    if (UI.btn('◀', bx, 670, 50, 36, { key: 'ArrowLeft' })) this.page = (this.page + this.pages() - 1) % this.pages();
    if (UI.btn('▶', bx + 56, 670, 50, 36, { key: 'ArrowRight' })) this.page = (this.page + 1) % this.pages();
    if (UI.btn(this.sil ? 'COLOUR' : 'SILHOUETTE', bx + 120, 670, 140, 36, { accent: this.sil, key: ' ' })) this.sil = !this.sil;
    if (UI.btn(this.walk ? 'IDLE' : 'WALK', bx + 270, 670, 90, 36)) this.walk = !this.walk;
    if (UI.btn('FRAMES', 24, 670, 110, 36)) Scene.go('animlab');
    if (UI.btn('GFX: ' + Gfx.label(), bx + 370, 670, 180, 36)) { Settings.gfx = Gfx.mode() === 'low' ? 'high' : 'low'; Gfx.apply(); }
    if (UI.btn('Title', bx + 560, 670, 90, 36, { style: 'ghost' })) { history.replaceState(null, '', location.pathname); Scene.go('title'); }
  }
};
// boot straight into the sheet when the URL has ?gallery
if (/[?&]gallery\b/.test(location.search)) { const s0 = Scene.set; Scene.set = function (name, a) { Scene.set = s0; return s0.call(this, name === 'title' ? 'gallery' : name, a); }; }

/* =========================================================
   DEATH LAB  —  open index.html?deathlab
   Replays any enemy × weapon × variant finisher (5 × 3 per enemy).
   ========================================================= */
Scenes.deathlab = {
  enter() {
    if (!S) { S = newSave({ name: 'Lab', cls: 'sword' }); S.introSeen = true; S.hp = Stats.maxHP(); }
    this.list = ENEMIES.concat(SIDE_ENEMIES || []); this.i = this.i || 0; this.w = this.w || 'sword'; this.v = this.v || 0; this.auto = false; this.t = 0;
    Music.stop(.3); Amb.set('silent'); Cam.reset(320, 180); this.play();
  },
  def() { return this.list[this.i]; },
  play() {
    const def = this.def(); Particles.clear(); this.t = 0; this.ended = 0;
    const E = { def, x: EX, kb: 0, jy: 0, h: (ARCH_H[def.arch] || 40) * 1.7 * (def.scale || 1), alpha: 1 };
    try { this.death = new Death(def, E, { killer: this.w, variant: this.v }); } catch (e) { console.error('deathlab', def.id, this.w, this.v, e); this.death = null; }
  },
  update(dt) {
    this.t += dt; if (this.death) this.death.update(dt);
    if (this.auto && this.t > 3.6) { this.v++; if (this.v > 2) { this.v = 0; const ws = Object.keys(WEAPON_NAMES), k = ws.indexOf(this.w) + 1; if (k >= ws.length) { this.w = ws[0]; this.i = (this.i + 1) % this.list.length; } else this.w = ws[k]; } this.play(); }
  },
  draw() {
    const c = ctx, def = this.def(); c.setTransform(1, 0, 0, 1, 0, 0); P('#000', 0, 0, 640, 360);
    drawCombatBG(def.area || 0, false, T, {}); Cam.apply(c, 1);
    if (this.death) this.death.drawGround();
    drawChar(PX, CGY, playerLook({ s: 1.7, face: 1, t: T, weapon: CLASSES[this.w].weapon, element: CLASSES[this.w].element }));
    if (this.death) { this.death.drawBody(); this.death.drawFront(); }
    Particles.draw(false); c.setTransform(1, 0, 0, 1, 0, 0);
  },
  ui() {
    const def = this.def();
    UI.panel(14, 14, 520, 70); UI.text('DEATH LAB', 30, 42, { size: 18, col: COL.gold2 });
    UI.text(`${def.name}${def.boss ? ' (BOSS)' : ''} · ${deathFamily(def)} · ${this.w.toUpperCase()} ${this.v + 1}: ${WEAPON_NAMES[this.w][this.v]}`, 30, 68, { size: 13, col: COL.cream, bold: false, maxW: 490 });
    const y = 640;
    if (UI.btn('◀', 14, y, 44, 40)) { this.i = (this.i + this.list.length - 1) % this.list.length; this.play(); }
    if (UI.btn('▶', 62, y, 44, 40)) { this.i = (this.i + 1) % this.list.length; this.play(); }
    Object.keys(WEAPON_NAMES).forEach((w, k) => { if (UI.btn(CLASSES[w].name.toUpperCase(), 120 + k * 104, y, 98, 40, { accent: this.w === w, id: 'dlw' + w })) { this.w = w; this.play(); } });
    [0, 1, 2].forEach(v => { if (UI.btn(String(v + 1), 650 + v * 50, y, 44, 40, { accent: this.v === v, id: 'dlv' + v })) { this.v = v; this.play(); } });
    if (UI.btn('REPLAY', 810, y, 110, 40, { key: ' ' })) this.play();
    if (UI.btn(this.auto ? 'STOP' : 'AUTO', 930, y, 100, 40, { accent: this.auto })) { this.auto = !this.auto; this.play(); }
    if (UI.btn('Title', 1180, y, 86, 40, { style: 'ghost' })) { history.replaceState(null, '', location.pathname); Scene.go('title'); }
  }
};
if (/[?&]deathlab\b/.test(location.search)) { const s1 = Scene.set; Scene.set = function (name, a) { Scene.set = s1; return s1.call(this, name === 'title' ? 'deathlab' : name, a); }; }
