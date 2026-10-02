'use strict';
/* =========================================================
   CHARACTER CREATION
   ========================================================= */
Scenes.creation = {
  enter() { this.cls = 'sword'; this.name = ''; this.body = 'sturdy'; this.skin = 0; this.hairC = 0; this.t = 0; this.pop = 0; Music.play('creation', 1.5); Amb.set('creation'); Cam.reset(320, 180); },
  update(dt) {
    this.t += dt; this.pop = Math.max(0, this.pop - dt * 3);
    for (const k of Input.typed) { if (k === 'Backspace') this.name = this.name.slice(0, -1); else if (k.length === 1 && /[a-zA-Z0-9 '\-]/.test(k) && this.name.length < 12) { this.name += k; SFX.play('hover'); } }
    Input.consume('1', '2', '3', '4', '5'); // typing digits shouldn't switch
    const c = this.cls, px = 470, py = 262;
    if (c === 'fire' && chance(dt * 30)) Particles.spawn({ x: px + 20 + rnd(-4, 4), y: py - 64 + rnd(-4, 4), vx: rnd(-8, 8), vy: rnd(-30, -10), life: rnd(.3, .7), c: '#ffd040', c2: '#e04010', size: 1, glow: 1, drag: .96 });
    if (c === 'light' && chance(dt * 10)) Particles.spawn({ x: px + rnd(-30, 40), y: py - rnd(20, 90), vx: 0, vy: -6, life: 1.4, c: '#fff4c0', type: 'star', size: 1, drag: 1 });
    if (chance(dt * 4)) Particles.spawn({ x: rnd(0, 640), y: rnd(0, 360), vx: rnd(-2, 2), vy: rnd(-4, -1), life: 4, c: '#e8c890', size: 1, drag: 1 });
  },
  pose() {
    const t = this.t, c = this.cls, o = { t, expr: 'neutral' };
    if (c === 'sword') { const cyc = t % 2.4; if (cyc < .5) { o.armF = lerp(.3, -2.2, Ease.outQ(cyc / .5)); o.crouch = cyc / .5 * .6; o.expr = 'annoyed'; } else if (cyc < .65) { const k = (cyc - .5) / .15; o.armF = lerp(-2.2, 1.9, Ease.inQ(k)); o.lean = k * 3; o.slash = k; } else if (cyc < 1.1) { o.armF = 1.9; o.lean = 3 * (1 - (cyc - .65) / .45); o.expr = 'happy'; } else o.armF = lerp(1.9, .3, Ease.outQ(Math.min(1, (cyc - 1.1) / .5))); o.wAng = (o.armF || .3) + 2.6; }
    else if (c === 'bow') { const cyc = t % 3.2; if (cyc < 1) { o.armF = 1.2; o.draw = 0; o.expr = 'annoyed'; o.look = 0; o.wAng = 0; } else if (cyc < 2.2) { o.armF = 1.55; o.draw = Ease.outQ(Math.min(1, (cyc - 1) / .6)); o.armB = 1.4; o.nocked = true; o.wAng = 0; } else { o.armF = 1.55; o.draw = 0; o.wAng = 0; o.expr = 'happy'; } }
    else { o.armF = .9 + Math.sin(t * 1.5) * .1; o.wAng = .15; if (c === 'fire') o.expr = Math.sin(t) > .5 ? 'smug' : 'neutral'; if (c === 'water') o.look = 1; if (c === 'light') o.expr = 'happy'; }
    return o;
  },
  draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(Cache.get('cr_bg', 640, 360, () => { const r = RNG(5); woodGrain('#3a2418', 0, 0, 640, 360, r, true); P('rgba(0,0,0,.35)', 0, 0, 640, 360); for (let x = 0; x < 640; x += 64) { P('#1a0e08', x, 0, 4, 360); } P('#2a1810', 0, 300, 640, 60); for (let i = 0; i < 640; i += 8) P('#3a2418', i, 300, 6, 2); pEll('#5a3a24', 470, 300, 110, 14); pEll('#6a4a2a', 470, 298, 100, 10); for (let i = 0; i < 20; i++) P('#7a5a3a', 380 + r() * 180, 294 + r() * 8, r.i(2, 6), 1); }), 0, 0);
    // candles
    [[380, 120], [590, 140]].forEach(([x, y], i) => { P('#e8dcc0', x, y, 4, 14); P('#c8b890', x, y, 1, 14); const fh = 3 + noise1(T * 8 + i) * 1.5; pEll('#ffb040', x + 2, y - 3, 1.6, fh); P('#fff4c0', x + 1, y - 3, 1, 2); });
    const o = this.pose();
    const look = Object.assign({ skin: SKIN_TONES[this.skin], hair: HAIR_COLS[this.hairC], hairStyle: 'short', hood: true, tier: 0, wTier: 0, weapon: CLASSES[this.cls].weapon, element: CLASSES[this.cls].element, body: this.body, seed: 1, s: 3 * (1 + this.pop * .05), face: 1, hero: true }, o);
    drawChar(470, 296, look);
    if (this.cls === 'sword' && o.slash > 0 && o.slash < 1) { ctx.globalAlpha = .7; for (let i = 0; i < 10; i++) { const a = lerp(-1.6, 1.4, i / 10); pLine('#ffffff', 480 + Math.sin(a) * 50, 230 - Math.cos(a) * 50, 480 + Math.sin(a) * 58, 230 - Math.cos(a) * 58, 2); } ctx.globalAlpha = 1; }
    if (this.cls === 'water') { const a = this.t * 3; pEll('#3a8ad8', 500 + Math.cos(a) * 14, 250 + Math.sin(a) * 5, 3, 3.5); P('#bfe8ff', 499 + Math.cos(a) * 14, 249 + Math.sin(a) * 5, 1, 1); }
    if (this.cls === 'light') { const p = .5 + .5 * Math.sin(this.t * 3); ctx.globalAlpha = .3 + p * .3; pCirc('#fff0a0', 508, 180, 8 + p * 4); ctx.globalAlpha = 1; pCirc('#fff8d0', 508, 180, 3); }
    Particles.draw(false);
    Light.begin([150, 120, 110]); Light.add(382, 118, 120, '#ffb060', .9, .15); Light.add(592, 138, 120, '#ffb060', .8, .15); Light.add(470, 200, 160, '#ffe0c0', .6); if (this.cls === 'fire') Light.add(505, 205, 60, '#ff8030', .8, .3); Light.apply();
  },
  ui() {
    UI.text('THE DEMON LORD\'S BUMMER', 60, 60, { size: 16, col: COL.dim }); UI.text('CHOOSE YOUR PATH', 60, 96, { size: 34, col: COL.gold2 }); UI.text('"Your first bad decision should at least look good."', 60, 124, { size: 15, col: COL.cream, italic: true, bold: false });
    UI.parchment(50, 150, 520, 430); const C = CLASSES[this.cls], ink = '#3a2414';
    UI.text(C.name.toUpperCase(), 80, 196, { size: 28, col: '#5a1a0a', shadow: false }); UI.para(C.desc, 80, 224, 460, { size: 14, col: ink, shadow: false, lh: 19 });
    const stats = [['HP', C.hp], ['Damage', C.dmg], ['Accuracy', C.acc], ['Defense', C.def], ['Mana', C.mana]];
    stats.forEach(([n, v], i) => { const y = 296 + i * 24; UI.text(n, 80, y, { size: 14, col: ink, shadow: false }); if (!v) UI.text('—', 190, y, { size: 14, col: ink, shadow: false }); else for (let k = 0; k < 5; k++) { g.fillStyle = k < v ? '#8a2a14' : 'rgba(90,60,30,.25)'; g.fillRect(190 + k * 22, y - 11, 18, 11); } });
    UI.text('Skill: ' + C.skill, 330, 296, { size: 13, col: '#5a1a0a', shadow: false, maxW: 210 }); UI.text('Break:', 330, 320, { size: 12, col: '#5a1a0a', shadow: false }); UI.para(C.ult, 330, 338, 210, { size: 12, col: '#5a1a0a', shadow: false, bold: true, lh: 16 });
    // name
    UI.text('Name', 80, 440, { size: 14, col: ink, shadow: false }); g.fillStyle = 'rgba(255,250,235,.6)'; g.fillRect(150, 422, 220, 28); g.strokeStyle = '#8a6a3a'; g.strokeRect(150.5, 422.5, 219, 27);
    UI.text((this.name || '') + (Math.floor(T * 2) % 2 ? '|' : ''), 158, 442, { size: 16, col: ink, shadow: false, maxW: 204 }); if (!this.name) UI.text('type a name…', 166, 442, { size: 14, col: 'rgba(90,60,30,.4)', shadow: false, italic: true, bold: false });
    if (UI.btn('Random', 380, 422, 92, 28, { size: 13 })) { this.name = pick(['Pim', 'Bartholomew', 'Wendel', 'Agatha', 'Cuthbert', 'Mildred', 'Osric', 'Gertrude', 'Tobias', 'Ysolde', 'Fennick', 'Brunhild', 'Percival', 'Maud']); this.pop = 1; SFX.play('flick'); }
    UI.text('Body', 80, 486, { size: 14, col: ink, shadow: false }); ['sturdy', 'lanky', 'round'].forEach((b, i) => { if (UI.btn(b[0].toUpperCase() + b.slice(1), 150 + i * 96, 466, 88, 28, { size: 13, accent: this.body === b })) { this.body = b; this.pop = 1; } });
    UI.text('Look', 80, 530, { size: 14, col: ink, shadow: false }); if (UI.btn('Skin ‹›', 150, 510, 110, 28, { size: 13 })) { this.skin = (this.skin + 1) % SKIN_TONES.length; this.pop = 1; } if (UI.btn('Hair ‹›', 270, 510, 110, 28, { size: 13 })) { this.hairC = (this.hairC + 1) % HAIR_COLS.length; this.pop = 1; }
    g.fillStyle = SKIN_TONES[this.skin]; g.fillRect(390, 514, 20, 20); g.fillStyle = HAIR_COLS[this.hairC]; g.fillRect(416, 514, 20, 20);
    // class icons
    const keys = Object.keys(CLASSES); keys.forEach((k, i) => { const x = 330 + i * 124, y = 610, sel = this.cls === k; if (UI.btn('', x, y, 110, 90, { accent: sel, id: 'cls' + k })) { this.cls = k; this.pop = 1; SFX.play('flick'); } drawIcon(k, x + 55, y + 38 - (sel ? 3 : 0), 48); UI.text(CLASSES[k].name, x + 55, y + 80, { align: 'center', size: 14, col: sel ? COL.gold2 : COL.cream }); });
    UI.text('Starter gear: patched hood, patched tunic, leather protection, belts, travel boots.', 1240, 594, { align: 'right', size: 12, col: COL.dim, italic: true, bold: false });
    if (UI.btn('BEGIN ›', 1040, 640, 200, 50, { accent: true, size: 20, key: 'Enter' })) this.begin();
  },
  begin() {
    const ng = S && S.ngCarry; S = newSave({ name: this.name.trim() || 'Hero', cls: this.cls, body: this.body, skin: this.skin, hairC: this.hairC });
    S.hp = Stats.maxHP(); S.mana = Stats.maxMana(); S.introSeen = true; SFX.play('confirm'); Save.save(true);
    Scene.go('village', { from: 'new' }, { type: 'iris', out: .8, in: .9, cx: 940, cy: 460 });
  }
};
