'use strict';
/* =========================================================
   INTERIORS — shared framework
   ========================================================= */
const NPC_LOOKS = {
  priest: { skin: '#f0c8a8', hairStyle: 'bald', hair: '#d8d0c8', glasses: true, top: '#1e1a26', robe: '#1e1a26', sleeve: '#1e1a26', stole: '#6a3a8a', cross: true, book: true, weapon: 'none', seed: 40, body: 'round' },
  smith: { skin: '#c8885a', hairStyle: 'bald', hair: '#3a2a1a', beard: '#3a2a1a', top: '#6a5a4a', apron: '#4a3a2a', pants: '#3a3030', boots: '#2a2020', weapon: 'hammer', body: 'round', seed: 41 },
  merchant: { skin: '#f0c49a', hair: '#2a1c18', hairStyle: 'short', mustache: '#2a1c18', hat: 'cap', hatC: '#6a2a5a', top: '#6a3a6a', pants: '#3a2a3a', boots: '#2a1a1a', belt: '#c8a040', weapon: 'none', body: 'lanky', seed: 42 }
};
function talkNPC(key, name, voice) {
  const pool = TALK[key].filter(e => !e.c || e.c(S)); S.talk[key] = (S.talk[key] || 0) + 1; const ex = pool[S.talk[key] % pool.length];
  return ex.l.map(([n, t]) => n === 'P' ? D(S.name, 'player', t) : D(n, voice, t));
}
function makeInterior(cfg) {
  return Object.assign({
    timeRuns: true,
    enter(a) { this.t = 0; this.px = 170; this.pwalk = 0; this.anim = null; this.pop = {}; this.npcReact = 0; Music.play(cfg.music, 1.2); Amb.set(cfg.amb); Cam.reset(320, 180); Cam.follow = 3; cfg.onEnter && cfg.onEnter.call(this, a); this.enterT = 0; },
    exit() { Cam.follow = 6; },
    leave() { SFX.play('door'); Scene.go('village', { from: cfg.door }, { type: 'door', out: .22, in: .3 }); },
    update(dt) {
      this.t += dt; this.enterT += dt; this.npcReact = Math.max(0, this.npcReact - dt);
      for (const k in this.pop) this.pop[k] = Math.max(0, this.pop[k] - dt * 3);
      this.pwalk = this.enterT < .5 ? this.enterT * 12 : null; if (this.enterT < .5) this.px = 130 + this.enterT * 80;
      if (cfg.update) cfg.update.call(this, dt);
      Cam.tx = 320 + (Input.mouse.lx - 320) * .03; Cam.ty = 180 + (Input.mouse.ly - 180) * .02;
    },
    draw() {
      const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); P('#000', 0, 0, 640, 360);
      Cam.apply(c, .92); cfg.back.call(this, this.t);
      Cam.apply(c, 1); cfg.mid && cfg.mid.call(this, this.t);
      const talking = Dialog.open && Dialog.talking;
      const npcSpeaking = talking && Dialog.speaker && Dialog.speaker !== S.name;
      cfg.npcDraw.call(this, this.t, npcSpeaking);
      const pl = playerLook({ t: this.t, face: 1, walk: this.pwalk, talking: talking && Dialog.speaker === S.name, low: S.hp / Stats.maxHP() < .3 });
      drawChar(this.px, 300, Object.assign(pl, { s: 1.3 }));
      Particles.draw(false);
      Cam.apply(c, 1.15); cfg.front && cfg.front.call(this, this.t);
      c.setTransform(1, 0, 0, 1, 0, 0); Cam.apply(c, 1);
      Light.begin(mixA(World.ambient(.35), cfg.ambient || [120, 100, 110], .6)); cfg.lights.call(this, this.t); Light.apply();
      c.setTransform(1, 0, 0, 1, 0, 0); if (World.rain > .1) Weather.draw(360, World.rain * .3, true);
      cfg.post && cfg.post.call(this, this.t);
    },
    ui() {
      HUD.draw({ buttons: [['LEAVE', () => this.leave(), 'Back to village', 64]] });
      if (this.anim && this.anim.block) return;
      const opts = cfg.options.call(this), x = 880, w = 370, h = 110 + opts.length * 54, y = Math.max(76, Math.min(150, 540 - h)); // keep clear of the dialogue box
      UI.panel(x, y, w, h, { title: cfg.title });
      opts.forEach((o, i) => { if (UI.btn(o.label, x + 20, y + 52 + i * 54, w - 40, 46, { sub: o.sub, right: o.right, disabled: o.disabled, accent: o.accent, align: 'left', id: cfg.title + o.label })) o.fn(); });
      if (UI.btn('Talk', x + 20, y + h - 54, (w - 50) / 2, 40)) { this.npcReact = .6; Dialog.start(cfg.talk.call(this)); }
      if (UI.btn('Leave', x + 30 + (w - 50) / 2, y + h - 54, (w - 50) / 2, 40)) this.leave();
      UI.text(`Coins: ${S.coins}`, x + w - 20, y + h + 24, { align: 'right', size: 16, col: COL.gold2 }); UI.text(`HP ${Math.ceil(S.hp)}/${Stats.maxHP()}`, x + 20, y + h + 24, { size: 14, col: COL.dim });
      cfg.ui && cfg.ui.call(this);
    }
  }, cfg.extra || {});
}
function pay(cost) { if (S.coins < cost) { SFX.play('error'); Toast.add('Not enough coins.', COL.red, '×'); return false; } S.coins -= cost; SFX.play('purchase'); for (let i = 0; i < 8; i++) Particles.spawn({ x: 470 + rnd(-10, 10), y: 150, vx: rnd(-40, 40), vy: rnd(-80, -30), g: 200, life: .8, c: '#f0c040', type: 'coin', rot: rnd(6), vr: 12, ground: 300 }); return true; }
/* ---------------- CATHEDRAL ---------------- */
Scenes.cathedral = makeInterior({
  title: 'CATHEDRAL OF SAINT ELBERT', music: 'cathedral', amb: 'cathedral', door: 'cathedral', ambient: [110, 100, 140],
  onEnter(a) {
    this.revive = a && a.revive;
    if (this.revive) { this.px = 150; this.lying = 3.5; Later.add(1.2, () => { SFX.play('bell'); }); Later.add(2.4, () => { const alt = S.stats.deaths > 1 ? pick(PRIEST_REVIVE_ALT) : PRIEST_REVIVE; Dialog.start(alt.map(([n, t]) => n === 'P' ? D(S.name, 'player', t) : D(n, 'priest', t))); }); }
    else if (S.quests.reliquary && S.quests.reliquary.state === 'ready') Later.add(.5, () => Dialog.start([D('Priest', 'priest', 'Is that... the reliquary? Saint Elbert\'s finger! It\'s pointing at the ceiling again!'), D(S.name, 'player', 'It was holding down toll receipts.'), D('Priest', 'priest', 'A humble task for a holy relic. He would have approved. Receive his blessing.', { fx: () => { Quests.complete('reliquary'); SFX.play('heal'); } })]));
    else if (S.quests.parish && S.quests.parish.state === 'ready') Later.add(.5, () => Dialog.start([D('Priest', 'priest', 'The graveyard is quiet. Suspiciously, wonderfully quiet. You have done the Lord\'s paperwork.', { fx: () => Quests.complete('parish') })]));
    else if (S.bosses.gloomfang && !S.quests.parish) Later.add(.5, () => Dialog.start([D('Priest', 'priest', 'Grave Mistake is stirring. Parishioners who should be resting are going for walks.'), D('Priest', 'priest', 'Lay six of them back down, gently or otherwise. The church will make it worth your while.', { fx: () => Quests.start('parish') })]));
  },
  update(dt) { if (this.lying > 0) this.lying -= dt; if (chance(dt * 8)) Particles.spawn({ x: rnd(80, 560), y: rnd(80, 280), vx: rnd(-2, 2), vy: rnd(-3, -1), life: 5, c: '#f8e8c0', size: 1, drag: 1 }); },
  back(t) {
    ctx.drawImage(Cache.get('cath_back', 700, 360, () => { const r = RNG(81); stoneTexture('#5a5460', 0, 0, 700, 300, r, 20, 12); for (let i = 0; i < 5; i++) { const x = 40 + i * 140; P('#3a3440', x, 0, 24, 300); P('#6a6470', x + 4, 0, 4, 300); } for (let i = 0; i < 3; i++) { const x = 140 + i * 160 + 30; P('#1a1418', x - 3, 40, 46, 150); pEll('#1a1418', x + 20, 40, 23, 24); } P('#3a2a24', 250, 230, 200, 70); P('#5a3a2a', 254, 234, 192, 8); P('#e8dcc0', 290, 214, 120, 18); P('#6a3a8a', 330, 214, 40, 18); P('#e8c050', 330, 214, 40, 2); P('#e8c050', 346, 150, 8, 60); P('#e8c050', 330, 166, 40, 8); woodGrain('#4a3020', 0, 300, 700, 60, r); for (let x = 0; x < 700; x += 30) P('#2a1a10', x, 300, 1, 60); }), -30, 0);
    for (let i = 0; i < 3; i++) { const x = 110 + i * 160 + 30, y = 40; const cols = [['#c03040', '#e8b040', '#3a6ac8'], ['#6a3aa8', '#c03040', '#e8b040'], ['#3a6ac8', '#6a3aa8', '#c03040']][i]; for (let k = 0; k < 7; k++) for (let j = 0; j < 2; j++) P(cols[(k + j) % 3], x + j * 20, y + k * 21, 19, 20); pEll(cols[0], x + 20, y, 20, 20); pCirc('#fff0a0', x + 20, y, 5); P('#1a1418', x + 19, y - 20, 2, 170); for (let k = 0; k < 7; k++) P('#1a1418', x, y + k * 21, 40, 1); }
    // banners
    for (let i = 0; i < 2; i++) { const bx = [60, 560][i], sw = Math.sin(t * .8 + i) * 1.5; pPoly('#1a1016', [[bx - 1, 60], [bx + 31, 60], [bx + 31 + sw, 190], [bx + 15 + sw, 176], [bx - 1 + sw, 190]]); pPoly('#6a2a6a', [[bx, 60], [bx + 30, 60], [bx + 30 + sw, 188], [bx + 15 + sw, 174], [bx + sw, 188]]); P('#e8c050', bx + 13, 100, 4, 30); P('#e8c050', bx + 6, 108, 18, 4); }
    // candles on altar (flicker)
    for (let i = 0; i < 6; i++) { const x = 295 + i * 22, y = 200; P('#e8dcc0', x, y, 3, 14); const fh = 2 + noise1(t * 7 + i) * 1.5; pEll('#ffb040', x + 1.5, y - 2, 1.4, fh); P('#fff4c0', x + 1, y - 2, 1, 1); }
    // colored rays shifting
    ctx.globalAlpha = .1; for (let i = 0; i < 3; i++) { const x = 110 + i * 160 + 30, sh = Math.sin(t * .05 + i) * 30; pPoly(['#e04060', '#8060e0', '#4080e0'][i], [[x, 60], [x + 40, 60], [x + 110 + sh, 300], [x + 20 + sh, 300]]); } ctx.globalAlpha = 1;
    ctx.globalAlpha = .18; for (let i = 0; i < 3; i++) { const x = 110 + i * 160 + 30, sh = Math.sin(t * .05 + i) * 30; pEll(['#e04060', '#8060e0', '#4080e0'][i], x + 65 + sh, 305, 46, 6); } ctx.globalAlpha = 1;
  },
  mid(t) { for (let row = 0; row < 2; row++) for (let i = 0; i < 2; i++) { const x = 60 + i * 380, y = 262 + row * 18; P('#1a1016', x - 1, y - 1, 142, 14); woodGrain('#6a4428', x, y, 140, 6, RNG(row * 3 + i)); P('#5a3a22', x, y + 6, 140, 6); P('#1a1016', x + 4, y + 12, 3, 8); P('#1a1016', x + 132, y + 12, 3, 8); } },
  npcDraw(t, speaking) { const lk = NPC_LOOKS.priest; drawChar(430, 300, Object.assign({}, lk, { s: 1.3, face: -1, t, talking: speaking, expr: this.npcReact > 0 ? 'surprise' : speaking ? 'neutral' : undefined, armF: .9 + Math.sin(t * .6) * .05 })); if (this.lying > 0) { } },
  front(t) { P('#1a1016', -60, 330, 80, 60); P('#2a1a24', 600, 280, 60, 120); for (let i = 0; i < 2; i++) { const x = [30, 610][i]; P('#e8dcc0', x, 300, 4, 16); const fh = 3 + noise1(t * 6 + i) * 2; pEll('#ffb040', x + 2, 297, 2, fh); } },
  lights(t) { for (let i = 0; i < 6; i++) Light.add(296 + i * 22, 198, 40, '#ffb050', .7, .15); for (let i = 0; i < 3; i++) Light.add(140 + i * 160 + 50, 110, 110, ['#ff6080', '#a080ff', '#60a0ff'][i], .45); Light.add(32, 296, 50, '#ffb050', .7, .2); Light.add(612, 296, 50, '#ffb050', .7, .2); Light.add(350, 240, 140, '#f8e0c0', .3); },
  post(t) { if (this.lying > 0) { ctx.globalAlpha = clamp(this.lying / 2, 0, 1); P('#000', 0, 0, 640, 360); ctx.globalAlpha = 1; } },
  options() {
    const m = Stats.maxHP(); const q = S.quests; const out = [
      { label: 'Restore full HP', sub: 'The complete miracle', right: '8c', disabled: S.hp >= m, fn: () => { if (pay(8)) { S.hp = m; SFX.play('heal'); this.npcReact = .5; Toast.add('HP fully restored.', COL.green, '✚'); for (let i = 0; i < 20; i++) Particles.spawn({ x: this.px + rnd(-12, 12), y: 300 - rnd(0, 50), vx: 0, vy: -20, life: 1.2, c: '#fff4c0', type: 'star', size: 1, drag: 1 }); } } },
      { label: 'Pray', sub: 'Restore 4 HP. Free, but slow.', right: 'free', disabled: S.hp >= m, fn: () => { heal(4); SFX.play('heal'); Toast.add('+4 HP. You feel slightly seen.', COL.green, '✚'); } },
      { label: 'Purify', sub: 'Ignore the first ailment next fight', right: '6c', disabled: S.buffs.includes('purified'), fn: () => { if (pay(6)) { S.buffs.push('purified'); SFX.play('shield'); Toast.add('Purified. Ailments will bounce off, once.', COL.blue, '◇'); } } },
      { label: 'Blessing', sub: 'Start next fight Blessed, +10% accuracy', right: '10c', disabled: S.buffs.includes('blessing'), fn: () => { if (pay(10)) { S.buffs.push('blessing'); SFX.play('heal'); Toast.add('Blessed. It is in the shoulders now.', COL.gold2, '◇'); } } }
    ];
    return out;
  },
  talk() { return talkNPC('priest', 'Priest', 'priest'); }
});
/* ---------------- BLACKSMITH ---------------- */
Scenes.smith = makeInterior({
  title: 'THE HONEST ANVIL', music: 'smith', amb: 'smith', door: 'smith', ambient: [130, 100, 90],
  onEnter() { this.hammerT = 0; if (!S.quests.pelts) Later.add(.5, () => Dialog.start([D('Blacksmith', 'smith', 'You. Adventurer. Bring me four wolf pelts from the forest and I\'ll improve your weapon for free.'), D('Blacksmith', 'smith', 'Don\'t ask what they\'re for. It\'s bellows. And a coat. Mostly bellows.', { fx: () => Quests.start('pelts') })])); else if (S.quests.pelts.state === 'ready') Later.add(.5, () => Dialog.start([D('Blacksmith', 'smith', 'Four pelts. Good ones, too. Hand me that weapon.', { fx: () => { this.startUpgrade(() => Quests.complete('pelts')); } })])); },
  update(dt) {
    const A = this.anim; this.hammerT += dt;
    if (A) { A.t += dt; const hits = [.35, .55, .75]; hits.forEach((h, i) => { if (A.t >= h && !A['h' + i]) { A['h' + i] = 1; SFX.play('anvil', { v: 1 }); Cam.shake(.12); for (let k = 0; k < 18; k++) Particles.spawn({ x: 330, y: 272, vx: rnd(-90, 90), vy: rnd(-120, -30), g: 260, life: rnd(.3, .7), c: '#fff0a0', c2: '#ff5010', type: 'spark', glow: 1, ground: 300 }); } });
      if (A.t >= .95 && !A.fl) { A.fl = 1; Post.doFlash(.7); Music.sting('upgrade'); } if (A.t >= 1.7) { this.anim = null; A.done && A.done(); } }
    else if (this.hammerT > 1.4) { this.hammerT = 0; SFX.play('anvil', { v: .5 }); for (let k = 0; k < 8; k++) Particles.spawn({ x: 330, y: 272, vx: rnd(-60, 60), vy: rnd(-80, -20), g: 260, life: rnd(.2, .5), c: '#fff0a0', c2: '#ff5010', type: 'spark', glow: 1, ground: 300 }); Cam.shake(.04); }
    if (chance(dt * 5)) Particles.spawn({ x: 520 + rnd(-10, 10), y: 160, vx: rnd(-3, 3), vy: -15, life: 3, c: '#5a5054', type: 'smoke', size: 4, drag: .99 });
  },
  extra: { startUpgrade(done, label) { this.anim = { t: 0, done, block: true, label }; } },
  back(t) {
    ctx.drawImage(Cache.get('smith_back', 700, 360, () => { const r = RNG(82); stoneTexture('#4a4044', 0, 0, 700, 300, r, 16, 9); P('#2a2024', 0, 0, 700, 20); for (let x = 0; x < 700; x += 70) P('#2a1a14', x, 0, 10, 300); P('#1a1014', 450, 120, 160, 180); stoneTexture('#7a3a2a', 455, 125, 150, 175, r, 8, 5); P('#0a0404', 480, 200, 100, 70); P('#1a1014', 490, 0, 80, 125); stoneTexture('#6a3428', 494, 0, 72, 122, r, 8, 5); woodGrain('#3a2418', 0, 300, 700, 60, r); for (let i = 0; i < 5; i++) { P('#2a1a10', 40 + i * 30, 90, 4, 90); } P('#2a1a10', 30, 90, 160, 4); P('#2a1a10', 30, 180, 160, 4); for (let i = 0; i < 4; i++) { pLine('#1a1016', 50 + i * 36, 100, 50 + i * 36, 172, 3); pLine('#c8ccd4', 50 + i * 36, 102, 50 + i * 36, 160, 1); P('#6a4424', 48 + i * 36, 160, 5, 12); } pEll('#1a1016', 175, 250, 14, 18); pEll('#6a4a2a', 175, 250, 13, 17); P('#4a4a56', 162, 240, 26, 3); P('#4a4a56', 162, 258, 26, 3); }), -30, 0);
    const fg = .7 + .3 * noise1(t * 5); P(mix('#8a2008', '#ff9030', fg), 452, 202, 96, 66); P(mix('#ff6010', '#fff0a0', fg), 470, 222, 60, 40); for (let i = 0; i < 8; i++) { const fh = 10 + Math.abs(Math.sin(t * 7 + i * 1.3)) * 18; pEll(i % 2 ? '#ffb040' : '#ff7020', 460 + i * 11, 262 - fh / 2, 4, fh / 2); }
    const bel = Math.sin(t * 2.2); pPoly('#1a1016', [[400, 240], [440, 230 - bel * 4], [440, 260 + bel * 4]]); pPoly('#6a4428', [[402, 241], [438, 232 - bel * 4], [438, 258 + bel * 4]]);
    for (let i = 0; i < 3; i++) { const x = 250 + i * 50, sw = Math.sin(t * .9 + i) * 2; for (let k = 0; k < 10; k++) P(k % 2 ? '#3a3440' : '#5a5060', x + Math.sin(k * .4) * sw * .4, k * 7, 2, 5); P('#5a5060', x - 3 + sw, 70, 8, 4); }
  },
  mid(t) { pPoly('#1a1016', [[300, 280], [360, 280], [352, 290], [346, 290], [350, 300], [312, 300], [316, 290], [308, 290]]); P('#4a4a56', 302, 281, 56, 5); P('#8a8a96', 302, 281, 56, 1); const glow = this.anim ? 1 : .6 + .4 * Math.sin(t * 2); P(mix('#8a2a10', '#ffd070', glow), 318, 276, 26, 4); },
  npcDraw(t, speaking) {
    const A = this.anim; let arm; if (A) { const tt = A.t; arm = tt < .25 ? lerp(.3, -2.6, tt / .25) : tt < .85 ? (Math.floor((tt - .25) / .2) % 1 === 0 ? lerp(-2.6, 1.1, ((tt - .25) % .2) / .2) : 1.1) : lerp(1.1, .3, Math.min(1, (tt - .85) / .5)); } else { const k = this.hammerT / 1.4; arm = k < .75 ? lerp(.8, -2.2, Ease.ioQ(k / .75)) : lerp(-2.2, 1.1, (k - .75) / .25); }
    drawChar(372, 300, Object.assign({}, NPC_LOOKS.smith, { s: 1.35, face: -1, t, armF: arm, talking: speaking, expr: A ? 'annoyed' : speaking ? 'neutral' : 'annoyed' }));
    if (A && A.t > 1.05) { const k = Ease.outBack(Math.min(1, (A.t - 1.05) / .3)); ctx.globalAlpha = .6; pCirc('#fff4c0', 330, 220, 16 * k); ctx.globalAlpha = 1; }
  },
  front(t) { pEll('#1a1016', 40, 340, 30, 40); pEll('#5a3a22', 40, 340, 28, 38); P('#3a3a44', 12, 320, 56, 4); for (let i = 0; i < 3; i++) P(i % 2 ? '#3a3440' : '#5a5060', 620, i * 30, 3, 20); },
  lights(t) { Light.add(500, 240, 220, '#ff7020', 1, .2, .5); Light.add(330, 275, 60, '#ffb050', this.anim ? 1 : .6, .2); Light.add(200, 120, 140, '#ffc090', .25); },
  options() {
    const w = S.weaponLv, a = S.armorLv, f = S.focusLv, caster = !!Stats.cls().mana, wc = 12 + 8 * w, ac = 8 + 6 * a, fc = 10 + 8 * f;
    const atkNow = Stats.atk().toFixed(1), defNow = Stats.def().toFixed(1);
    const up = (kind) => { if (kind === 'w') { S.weaponLv++; } else if (kind === 'a') { S.armorLv++; S.hp = Math.min(Stats.maxHP(), S.hp + 4); } else { S.focusLv++; } Save.save(true); };
    const mats = Object.entries(S.mats).filter(([k, n]) => n > 0 && !(k === 'pelt' && S.quests.pelts && S.quests.pelts.state !== 'done') && !(k === 'scrap' && S.quests.survey && S.quests.survey.state !== 'done'));
    const value = mats.reduce((s2, [k, n]) => s2 + MATS[k][1] * n, 0);
    return [
      { label: w < 4 ? 'Weapon: ' + WEAPON_TIERS[S.cls][w + 1] : 'Weapon: masterwork', sub: w < 4 ? `ATK ${atkNow} → ${(Stats.atk() + 2.6).toFixed(1)}` : 'Nothing left to improve but you.', right: w < 4 ? wc + 'c' : '', disabled: w >= 4, fn: () => { if (S.coins < wc) { pay(wc); return; } this.startUpgrade(() => { S.coins -= wc; up('w'); Toast.add('Forged: ' + Stats.weaponName(), COL.gold2, '⚒'); }); } },
      { label: a < 4 ? 'Armor: ' + ARMOR_TIERS[a + 1].name : 'Armor: masterwork', sub: a < 4 ? `DEF ${defNow} → ${(Stats.def() + 1.6).toFixed(1)} · HP +4` : 'You clank with dignity.', right: a < 4 ? ac + 'c' : '', disabled: a >= 4, fn: () => { if (S.coins < ac) { pay(ac); return; } this.startUpgrade(() => { S.coins -= ac; up('a'); Toast.add('Fitted: ' + Stats.armorName(), COL.gold2, '⚒'); }); } },
      { label: caster ? 'Magic focus Lv ' + (f + 1) : 'Focus grip Lv ' + (f + 1), sub: f < 4 ? (caster ? `Mana ${Stats.maxMana()} → ${Stats.maxMana() + 2} · spell power +1.2` : `Focus ${Stats.maxMana()} → ${Stats.maxMana() + 2}`) : 'Maximum focus achieved.', right: f < 4 ? fc + 'c' : '', disabled: f >= 4, fn: () => { if (S.coins < fc) { pay(fc); return; } this.startUpgrade(() => { S.coins -= fc; up('f'); if (!caster) S.focusBonus = (S.focusBonus || 0) + 2; Toast.add('Focus improved.', COL.gold2, '⚒'); }); } },
      { label: 'Sell materials', sub: mats.length ? mats.map(([k, n]) => `${MATS[k][0]} ×${n}`).join(', ').slice(0, 46) : 'Nothing to sell. Go get dirty.', right: value ? value + 'c' : '', disabled: !value, fn: () => { mats.forEach(([k]) => S.mats[k] = 0); addCoins(value); SFX.play('purchase'); Toast.add(`Sold materials for ${value} coins.`, COL.gold2, '●'); } }
    ];
  },
  ui() { if (this.anim) { const k = this.anim.t; UI.text(k < 1 ? 'The blacksmith gets to work…' : 'Done. Try not to lose it.', 640, 140, { align: 'center', size: 20, col: COL.gold2 }); } },
  talk() { return talkNPC('smith', 'Blacksmith', 'smith'); }
});
/* ---------------- MERCHANT ---------------- */
Scenes.merchant = makeInterior({
  title: 'GENERAL GOODS & MINOR MIRACLES', music: 'merchant', amb: 'merchant', door: 'merchant', ambient: [130, 115, 100],
  onEnter() {
    this.catSt = 0; this.bounce = {};
    if (!S.quests.goose) Later.add(.5, () => Dialog.start([D('Merchant', 'merchant', 'Oh good, a customer with a weapon. Listen. There is a goose.'), D('Merchant', 'merchant', 'It has taken three baskets and a hat. Defeat it three times. Once is a lesson, twice is a pattern, three times is a policy.', { fx: () => Quests.start('goose') })]));
    else if (S.quests.goose.state === 'ready') Later.add(.5, () => Dialog.start([D('Merchant', 'merchant', 'Three times! The goose has been informed. Here — on the house. Which is to say, from the crate.', { fx: () => Quests.complete('goose') })]));
  },
  update(dt) { for (const k in this.bounce) this.bounce[k] = Math.max(0, this.bounce[k] - dt * 3); if (chance(dt * 6)) Particles.spawn({ x: rnd(60, 200), y: rnd(120, 280), vx: rnd(1, 4), vy: rnd(-2, 2), life: 4, c: '#f8e8c0', size: 1, drag: 1 }); },
  back(t) {
    // open door view (outdoor parallax)
    const [top, bot] = World.sky(); ctx.fillStyle = top; ctx.fillRect(40, 130, 90, 170); const gr = ctx.createLinearGradient(0, 130, 0, 300); gr.addColorStop(0, top); gr.addColorStop(1, bot); ctx.fillStyle = gr; ctx.fillRect(40, 130, 90, 170);
    const off = (Cam.x - 320) * .3; pEll('#5a8a4a', 85 + off, 290, 80, 30); P('#6a9a3a', 40, 280, 90, 20); for (let i = 0; i < 3; i++) leafCluster(50 + i * 34 + off * .5, 255, 10, '#4a7a3a', RNG(i)); if (World.rain > .2) { for (let i = 0; i < 20; i++) P('#a0b8d8', 40 + ((i * 17 + T * 60) % 90), 130 + ((i * 31 + T * 200) % 170), 1, 3); }
    ctx.drawImage(Cache.get('merch_back', 700, 360, () => { const r = RNG(83); woodGrain('#6a4428', 0, 0, 700, 300, r, true); P('rgba(0,0,0,.2)', 0, 0, 700, 300); for (let x = 0; x < 700; x += 90) P('#2a1a10', x, 0, 8, 300); P('#2a1a10', 0, 40, 700, 8); P('#1a0e08', 64, 124, 102, 180); ctx.clearRect(70, 130, 90, 170); P('#2a1a10', 64, 124, 102, 6); for (let s2 = 0; s2 < 3; s2++) { const y = 110 + s2 * 50; P('#2a1a10', 250, y, 330, 5); woodGrain('#8a5a32', 251, y + 1, 328, 3, r); for (let i = 0; i < 16; i++) { const x = 258 + i * 20, h = r.i(10, 18), col = r.pick(['#c03a4a', '#3a8ad8', '#6ac070', '#8a4ad8', '#e8b030', '#c8c0a0']); P('#1a1016', x - 1, y - h - 1, 9, h + 1); P(col, x, y - h, 7, h); P(shade(col, .3), x + 1, y - h + 2, 1, h - 4); P('#8a5a2a', x + 2, y - h - 4, 3, 4); } } woodGrain('#4a3020', 0, 300, 700, 60, r); P('#2a1a10', 230, 240, 400, 8); woodGrain('#8a5a32', 231, 241, 398, 6, r); P('#5a3a22', 232, 248, 396, 52); for (let i = 0; i < 6; i++) P('#3a2414', 240 + i * 66, 250, 2, 50); }), -30, 0);
    // hanging herbs, bottles, cloth (animated)
    for (let i = 0; i < 7; i++) { const x = 180 + i * 60, sw = Math.sin(t * 1.2 + i) * 1.5; P('#3a2a1a', x, 48, 1, 14); if (i % 2) { pEll('#1a1016', x + sw, 68, 5, 7); pEll(['#6ac070', '#c03a4a', '#3a8ad8'][i % 3], x + sw, 68, 4, 6); P('#fff', x - 2 + sw, 65, 1, 2); } else { for (let k = 0; k < 5; k++) P(['#5a8a3a', '#7a9a4a', '#a0a040'][k % 3], x - 4 + k * 2 + sw, 62, 2, 10 + k % 2 * 3); } }
    pPoly('#8a2a4a', [[560, 48], [620, 48], [618 + Math.sin(t) * 2, 110], [562 + Math.sin(t) * 2, 104]]); P('#e8c050', 560, 48, 60, 2);
  },
  mid(t) {
    // counter items + cat
    const catSleep = Math.sin(t * .2) > -.3; const cx = 560, cy = 240; if (catSleep) { pEll('#e8a050', cx, cy - 3, 8, 4); pEll('#e8a050', cx + 6, cy - 5, 4, 3); P('#c88030', cx - 4, cy - 5, 6, 1); if (Math.sin(t * 1.5) > 0) pText('z', cx + 10, cy - 12, 7, '#e8e0d0'); } else { pEll('#e8a050', cx, cy - 6, 6, 5); pEll('#e8a050', cx + 5, cy - 13, 4, 4); P('#e8a050', cx + 2, cy - 18, 1, 2); P('#e8a050', cx + 7, cy - 18, 1, 2); P('#206020', cx + 4, cy - 14, 1, 1); P('#206020', cx + 7, cy - 14, 1, 1); pLine('#e8a050', cx - 6, cy - 4, cx - 10, cy - 12 + Math.sin(t * 3) * 2, 2); }
    pCirc('#e8e2cc', 280, 234, 5); P('#1a1016', 278, 233, 1, 2); P('#1a1016', 281, 233, 1, 2); for (let i = 0; i < 5; i++) pCirc(['#e04030', '#f0a020', '#80c040'][i % 3], 300 + i * 7, 236, 3);
  },
  npcDraw(t, speaking) { drawChar(440, 262, Object.assign({}, NPC_LOOKS.merchant, { s: 1.3, face: -1, t, talking: speaking, expr: this.npcReact > 0 ? 'happy' : speaking ? 'neutral' : undefined, armF: Math.sin(t * 1.1) > .8 ? 2.2 : .6, shadow: false })); P('#2a1a10', 400, 262, 100, 6); woodGrain('#8a5a32', 401, 263, 98, 4, RNG(4)); },
  front(t) { P('#1a1016', 600, 260, 70, 110); woodGrain('#6a4428', 602, 262, 66, 106, RNG(9)); P('#2a1a10', 596, 290, 78, 2); P('#1a1016', -20, 320, 70, 50); },
  lights(t) { Light.add(85, 220, 120, World.isNight() ? '#6070c0' : '#fff0d0', .8); Light.add(400, 120, 180, '#ffd090', .45); Light.add(420, 200, 90, '#ffc070', .5, .1); },
  options() {
    const keys = ['drumstick', 'mid', 'high', 'antidote', 'tonic', 'smoke'];
    return keys.map(k => ({ label: `${ITEMS[k].name}  ×${S.inv[k] || 0}`, sub: ITEMS[k].desc, right: ITEMS[k].price + 'c', fn: () => { if (pay(ITEMS[k].price)) { addItem(k); this.bounce[k] = 1; this.npcReact = .5; Toast.add(`Bought ${ITEMS[k].name}.`, COL.gold2, '●'); } } }));
  },
  ui() { const keys = ['drumstick', 'mid', 'high', 'antidote', 'tonic', 'smoke']; keys.forEach((k, i) => { const b = this.bounce[k] || 0; drawIcon(k, 860, 150 + 52 + i * 54 + 22 - Ease.outQ(b) * 10, 36); }); },
  talk() { return talkNPC('merchant', 'Merchant', 'merchant'); }
});
/* ---------------- PLAYER HOUSE ---------------- */
Scenes.house = makeInterior({
  title: 'HOME', music: 'home', amb: 'house', door: 'house', ambient: [120, 100, 100],
  onEnter() { this.rest = null; Later.add(.4, () => { if (!S.homeLine || chance(.5)) Dialog.start(talkNPC('home', '', 'player')); S.homeLine = 1; }); },
  update(dt) {
    const R = this.rest; if (R) { R.t += dt; if (R.t > 1.6 && !R.mid) { R.mid = 1; Music.sting('lullaby'); } if (R.t > 3.2 && !R.done) { R.done = 1; if (S.time > 7) S.day++; S.time = 7; S.hp = Stats.maxHP(); S.mana = Stats.maxMana(); S.weather = pick(['CLEAR', 'CLEAR', 'FOG']); Save.save(true); Toast.add('Rested. HP and ' + Stats.manaName().toLowerCase() + ' restored. Game saved.', COL.green, '★'); } if (R.t > 5) { this.rest = null; Music.setLayer('box', 1); } }
    if (chance(dt * 3)) Particles.spawn({ x: 470 + rnd(-8, 8), y: 200, vx: rnd(-2, 2), vy: -10, life: 2.5, c: '#8a8080', type: 'smoke', size: 3, drag: .99 });
    if (chance(dt * 6)) Particles.spawn({ x: 470 + rnd(-10, 10), y: 262, vx: rnd(-6, 6), vy: rnd(-40, -20), g: -10, life: rnd(.4, .9), c: '#ffd060', c2: '#e04010', size: 1, glow: 1 });
  },
  back(t) {
    ctx.drawImage(Cache.get('house_back', 700, 360, () => { const r = RNG(84); P('#d8c8a8', 0, 0, 700, 300); textureNoise('#c8b898', 0, 0, 700, 300, 900, r); for (let x = 0; x < 700; x += 110) { P('#2a1a10', x, 0, 12, 300); woodGrain('#5a3a22', x + 1, 0, 10, 300, r, true); } P('#2a1a10', 0, 30, 700, 12); woodGrain('#5a3a22', 0, 31, 700, 10, r); stoneTexture('#7a7070', 420, 150, 110, 150, r, 10, 6); P('#1a0a08', 440, 230, 70, 70); pEll('#1a0a08', 475, 230, 35, 16); P('#5a3a22', 410, 146, 130, 8); woodGrain('#4a3020', 0, 300, 700, 60, r); P('#1a1016', 150, 90, 90, 80); P('#8a6238', 146, 86, 98, 4); P('#8a6238', 146, 170, 98, 6); P('#8a6238', 193, 90, 4, 80); P('#8a6238', 150, 128, 90, 4); pEll('#1a1016', 330, 150, 20, 24); pEll('#8a8a96', 330, 150, 18, 22); pEll('#6a6a76', 330, 150, 10, 12); P('#c8a040', 328, 128, 4, 44); P('#c8a040', 310, 148, 40, 4); P('#2a1a10', 40, 250, 90, 50); woodGrain('#7a5230', 41, 251, 88, 20, r); P('#c8b8e0', 44, 240, 40, 12); P('#8a3a3a', 40, 262, 90, 38); for (let i = 0; i < 5; i++) P('#5a8a3a', 580 + i * 6, 60, 3, 18 + (i % 2) * 5); P('#3a2a1a', 575, 58, 36, 2); }), -30, 0);
    // live window: sky + weather
    const [top, bot] = World.sky(); const wx = 120, wy = 90; const gr = ctx.createLinearGradient(0, wy, 0, wy + 80); gr.addColorStop(0, top); gr.addColorStop(1, bot); ctx.fillStyle = gr; ctx.fillRect(wx, wy, 43, 38); ctx.fillRect(wx + 47, wy, 43, 38); ctx.fillRect(wx, wy + 42, 43, 38); ctx.fillRect(wx + 47, wy + 42, 43, 38);
    P('#4a7a3a', wx, wy + 62, 90, 18); leafCluster(wx + 20, wy + 60, 12, '#3a6a3a', RNG(5)); if (World.nightK() > .5) { drawMoon(wx + 70, wy + 18, 1); for (let i = 0; i < 5; i++) P('#fff', wx + 5 + i * 17, wy + 5 + (i * 7) % 20, 1, 1); } if (World.rain > .2) for (let i = 0; i < 24; i++) P('#b0c8e8', wx + ((i * 13 + T * 30) % 90), wy + ((i * 29 + T * 180) % 80), 1, 3); if (World.fog > .2) { ctx.globalAlpha = World.fog * .5; P('#d8e0e8', wx, wy, 90, 80); ctx.globalAlpha = 1; }
    P('#8a6238', wx + 43, wy, 4, 80); P('#8a6238', wx, wy + 38, 90, 4);
    // fire
    for (let i = 0; i < 7; i++) { const fh = 12 + Math.abs(Math.sin(t * 6 + i * 1.7)) * 14; pEll(i % 2 ? '#ffb040' : '#ff6020', 452 + i * 7, 294 - fh / 2, 4, fh / 2); } pEll('#fff0a0', 475, 290, 10, 5); P('#3a2414', 445, 292, 60, 5);
    // cauldron
    pEll('#1a1016', 380, 285, 18, 14); pEll('#2a2a30', 380, 285, 16, 12); pEll('#6a9a4a', 380, 276, 13, 3); for (let i = 0; i < 3; i++) { const b = (t * .8 + i * .33) % 1; pCirc('#8aba6a', 372 + i * 8, 276 - b * 4, 1.5 * (1 - b)); }
    // mannequin with current armor
    drawChar(560, 300, { tier: S.armorLv, skin: '#b0906a', hairStyle: 'none', hood: false, weapon: 'none', face: -1, t: 0, s: 1.2, noBrow: true, expr: 'neutral', seed: 99, shadow: true, headY: 0 });
  },
  npcDraw(t) { },
  front(t) { P('#2a1a10', -10, 300, 120, 70); woodGrain('#6a4428', -8, 302, 116, 10, RNG(2)); pEll('#c86a3a', 70, 296, 26, 6); pEll('#e8b040', 70, 294, 8, 3); P('#8a2a3a', 240, 330, 200, 40); P('#a83a4a', 244, 334, 192, 4); for (let i = 0; i < 8; i++) P('#e8c050', 250 + i * 24, 342, 6, 2); },
  lights(t) { Light.add(475, 270, 200, '#ff8030', 1, .18, .5); Light.add(140, 130, 90, World.isNight() ? '#6070c0' : '#fff0d0', .7); },
  post(t) { const R = this.rest; if (R) { const k = R.t < 1.6 ? R.t / 1.6 : R.t < 3.2 ? 1 : 1 - (R.t - 3.2) / 1.8; ctx.globalAlpha = clamp(k, 0, 1) * .92; P('#050308', 0, 0, 640, 360); ctx.globalAlpha = clamp(k, 0, 1) * .5; pCirc('#ff8030', 475, 280, 30 + Math.sin(T * 6) * 2); ctx.globalAlpha = 1; } },
  options() {
    return [
      { label: 'REST', sub: 'Sleep until morning. Full HP. Autosave.', accent: true, fn: () => { if (this.rest) return; this.rest = { t: 0 }; Music.setLayer('box', .3); SFX.play('page'); } },
      { label: 'CODEX', sub: 'Bestiary of Bad Decisions', fn: () => openCodex() },
      { label: 'SETTINGS', sub: 'Volume, text speed, shake, flashes', fn: () => openSettings() },
      { label: 'LEAVE', sub: 'Back out into Placenta Creek', fn: () => this.leave() }
    ];
  },
  ui() { if (this.rest) { const k = this.rest.t; if (k > 1 && k < 3.6) UI.text('z z z', 640, 360, { align: 'center', size: 26, col: COL.dim, alpha: .6 + .4 * Math.sin(T * 2) }); } },
  talk() { return talkNPC('home', '', 'player').map(l => (l.n = S.name, l)); }
});
