'use strict';
/* =========================================================
   ENDING + CREDITS + NEW GAME PLUS
   ========================================================= */
Scenes.ending = {
  enter() {
    this.t = 0; this.lucSit = 0; this.stand = 0; Music.resetLayers(); Music.play('ending', 2); Amb.set('ending'); Cam.reset(300, 215, 1.3); Cam.follow = .8; Post.letter = 1;
    S.bosses.lucien = true; Save.save(true); this.titleLen = 1;
    const L = (t, x) => D('Lucien', 'lucien', t, x), Y = t => D(S.name, 'player', t), H = (t, x) => D('Herald', 'herald', t, x);
    Later.add(1.6, () => Dialog.start([
      D('', 'narrator', 'The throne room is quiet. The torches, for once, are not being dramatic.'),
      L('...Well. You won. Congratulations. I had a speech for this. It was nine pages.'),
      Y('You could just sit back down.'),
      L('Ah. Yes. About that.', { fx: () => { this.stand = 1; SFX.play('rattle'); } }),
      L('May I confess something? The throne is uncomfortable. It has always been uncomfortable. It is made of spite and very sharp crystal.'),
      L('Three hundred years of conquest, and my lower back has been screaming the entire time.'),
      Y('So why keep it?'),
      L('Because it looks tremendous in the sketches.', { fx: () => SFX.play('laugh', { v: .4 }) }),
      H('Your Dreadful Majesty? I— I have the new proclamation. As discussed.', { fx: () => { this.herald = 1; SFX.play('page'); } }),
      L('Read it. The short one.'),
      H('Presenting: Lucien, Sovereign of Scorn, Master of the Midnight Flame, Keeper of the Uncomfortable Chair, Lord of—', { fx: () => { this.titleLen = 1; } }),
      L('Shorter.'),
      H('Lucien, Sovereign of Scorn, Master of the Midnight Flame.', { fx: () => { this.titleLen = .6; SFX.play('flick'); } }),
      L('Shorter.'),
      H('...Lucien.', { fx: () => { this.titleLen = .2; SFX.play('bell', { v: .5 }); } }),
      L('Lucien. Yes. I like that. It fits on a door.'),
      L(`Go home, ${S.name}. Placenta Creek has its reliquary, its geese, and its hero. I have a cushion to buy.`),
      Y('And the trousers?'),
      L('The trousers stay in the sketch. History will be kind to them. I will make sure of it.', { fx: () => { Music.sting('victory'); } })
    ], () => Scene.go('credits', {}, { out: 1.5, in: 1.2 })));
  },
  exit() { Post.letter = 0; Cam.follow = 6; },
  update(dt) { this.t += dt; this.stand = this.stand ? Math.min(1, this.stand + dt) : 0; if (this.herald) this.herald = Math.min(2, this.herald + dt); if (chance(dt * 8)) Particles.spawn({ x: rnd(100, 540), y: rnd(80, 300), vx: rnd(-3, 3), vy: rnd(-2, 2), life: rnd(3, 6), c: '#e8d0a0', size: 1, drag: 1 }); Cam.tx = 290; Cam.ty = 215; },
  draw() {
    const t = T; ctx.setTransform(1, 0, 0, 1, 0, 0); P('#050208', 0, 0, 640, 360); drawThroneRoom(t, 0, { phase2: true }); Cam.apply(ctx, 1);
    const Lk = ENEMY.lucien.look, talking = Dialog.open && Dialog.talking;
    const lx = 320 + this.stand * 44, ly = 252 + this.stand * 46;
    drawChar(lx, ly, Object.assign({}, Lk, { s: 1.5, face: this.stand ? -1 : 1, sit: !this.stand, t, seed: 3, expr: this.stand ? 'tired' : 'neutral', talking: talking && Dialog.speaker === 'Lucien', armF: this.stand ? .3 : .9, wAng: 3.1 }));
    if (this.herald) { const hx = 560 - Math.min(1, this.herald) * 120; drawChar(hx, 298, Object.assign({}, VISITORS.herald.look, { s: 1.3, face: -1, t, talking: talking && Dialog.speaker === 'Herald', walk: this.herald < 1 ? t * 10 : undefined, expr: 'surprise' })); }
    drawChar(190, 300, playerLook({ s: 1.5, face: 1, t, talking: talking && Dialog.speaker === S.name, expr: 'happy' }));
    Particles.draw(false);
    Light.begin([175, 145, 160]); Light.add(320, 120, 260, '#ffd8a0', .7); Light.add(lx, ly - 30, 120, '#fff0e0', .6); Light.add(170, 270, 110, '#fff0e0', .6); Light.apply(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  },
  ui() { if (this.herald) { const full = 'LUCIEN, SOVEREIGN OF SCORN, MASTER OF THE MIDNIGHT FLAME, KEEPER OF THE UNCOMFORTABLE CHAIR', n = Math.max(6, Math.round(full.length * this.titleLen)); const s = this.titleLen <= .2 ? 'LUCIEN.' : full.slice(0, n) + (n < full.length ? '…' : ''); UI.text(s, 640, 110, { align: 'center', size: this.titleLen <= .2 ? 40 : 18, col: COL.gold2, stroke: 3 }); } }
};
Scenes.credits = {
  enter() { this.t = 0; this.y = 0; Music.play('credits', 1.5); Amb.set('silent'); Post.letter = 0; this.done = false; },
  update(dt) { this.t += dt; const sp = Input.held(' ') || Input.mouse.down ? 140 : 42; this.y += dt * sp; if (this.y > CREDITS.length * 90 + 500) this.done = true; },
  draw() {
    const c = ctx, t = this.t; c.setTransform(1, 0, 0, 1, 0, 0);
    drawSkyGradient('#141a44', '#f2a07a'); drawStars(.6, 21, 160); drawClouds(40, 60, '#ffe0d0', 6, .5);
    const layers = [['#6a5a8a', 180, .15, 40], ['#4a4a6a', 220, .35, 30], ['#2a3a3a', 270, .7, 20]];
    layers.forEach(([col, base, par, amp], L) => { const off = t * 30 * par; for (let x = 0; x < 640; x += 2) { const wx = x + off; const y = base - Math.abs(Math.sin(wx / (90 + L * 30))) * amp - noise1(wx * .03 + L * 9) * 10; P(col, x, y, 2, 360 - y); } });
    const off = t * 30; for (let i = 0; i < 12; i++) { const x = ((i * 90 - off * 1.1) % 1080 + 1080) % 1080 - 100; mapTree(x, 300, 8, i % 3 ? 'round' : 'pine'); }
    P('#3a2a1a', 0, 300, 640, 60); P('#8a6a40', 0, 304, 640, 10);
    drawChar(200, 310, playerLook({ s: 1.3, face: 1, t, walk: t * 9 }));
    if (S.bosses && S.bosses.gloomfang) drawMonster(ENEMY.gloomfang, 150, 312, { t, sMul: .7, face: 1, walk: t * 9 });
    Light.begin([255, 220, 200]); Light.apply(); c.setTransform(1, 0, 0, 1, 0, 0);
  },
  ui() {
    g.fillStyle = 'rgba(10,6,16,.35)'; g.fillRect(760, 0, 520, 720);
    CREDITS.forEach(([a, b], i) => { const y = 760 + i * 90 - this.y; if (y < -60 || y > 780) return; UI.text(a, 1020, y, { align: 'center', size: i === 0 ? 30 : 22, col: i === 0 ? COL.gold2 : COL.cream }); if (b) UI.text(b, 1020, y + 26, { align: 'center', size: 15, col: COL.dim, bold: false, italic: true }); });
    const ey = 760 + CREDITS.length * 90 - this.y + 40;
    if (ey < 700) {
      const y = Math.max(300, ey); UI.text('THE END', 1020, y, { align: 'center', size: 40, col: COL.gold2, stroke: 3 }); UI.text(`Deaths: ${S.stats.deaths} · Geese defeated: ${S.stats.geese} · Raids repelled: ${S.stats.raids}`, 1020, y + 34, { align: 'center', size: 13, col: COL.dim, bold: false });
      if (UI.btn(`NEW GAME+${S.ng + 1 > 1 ? ' ' + (S.ng + 1) : ''}`, 900, y + 60, 240, 46, { accent: true, sub: 'Keep gear, level & codex. Stronger foes, richer rewards.', key: 'Enter' })) this.ngPlus();
      if (UI.btn('Return to Title', 900, y + 118, 240, 40, { style: 'ghost' })) { Save.save(true); Scene.go('title', {}, { out: 1, in: 1 }); }
    } else UI.text('Hold SPACE to fast-forward', 1020, 700, { align: 'center', size: 12, col: COL.dim, bold: false });
  },
  ngPlus() {
    S.ng++; S.unlocked = 1; S.clears = AREAS.map(() => [0, 0, 0, 0, 0]); S.side = {}; S.act = 1; S.map2Node = 0; S.bosses = {}; S.quests = { reliquary: { state: 'active', n: 0 } }; S.mapNode = 0; S.hp = Stats.maxHP(); S.time = 8.5; S.day++; S.buffs = []; S.lastRaidDay = 0; S.festival = false;
    Save.save(true); SFX.play('confirm'); Scene.go('intro', { ng: true }, { out: 1.2, in: .8 });
  }
};
