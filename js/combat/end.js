'use strict';
/* =========================================================
   COMBAT — victory, defeat, rewards
   ========================================================= */
Object.assign(Scenes.combat, {
  win() {
    if (this.over) return; this.over = true; this.q = []; this.cue = null; this.mg = null; this.phase = 'win'; const E = this.E, d = this.def;
    // unique, gory death animation per monster (see combat/deaths.js)
    try { this.death = new Death(d, E, { phase2: E.phase2 }); } catch (err) { console.error(err); this.death = null; }
    this.pose(E, 'dead'); E.flash = 0; SFX.play('edeath', { v: .6 }); TimeFX.slowmo(.7, .35); Cam.shake(.5); Cam.punchZoom(.06); Music.stop(.4);
    this.at(1.6, () => { Music.sting('victory'); this.pose(this.P, 'victory'); });
    const next = () => this.rewards();
    if (this.boss && BOSS_TEXT[d.id]) this.at(3.0, () => Dialog.start(BOSS_TEXT[d.id].defeat.map(([n, t]) => n === 'You' ? D(S.name, 'player', t) : D(n, n === 'Lucien' ? 'lucien' : 'monster', t)), next));
    else this.at(2.7, next);
  },
  rewards() {
    const a = this.area, l = this.lvl, d = this.def, mul = (1 + S.ng * .5) * (this.raid ? 2 : 1), first = !this.raid && !S.clears[a][l];
    let xp = Math.round((12 + a * 14 + (l + 1) * 5) * (this.boss ? 3 : 1) * mul), coins = Math.round((6 + a * 6 + (l + 1) * 2) * (this.boss ? 4 : 1) * mul);
    const lines = [];
    if (first) { xp = Math.round(xp * 1.5); coins = Math.round(coins * 1.5); lines.push(['◆ FIRST CLEAR BONUS ×1.5', COL.gold2]); }
    addCoins(coins); Codex.kill(d.id);
    if (d.drop && chance(d.drop[1])) { addMat(d.drop[0]); lines.push([`+1 ${MATS[d.drop[0]][0]}`, COL.cream]); }
    if (a === 3 && !this.raid && S.quests.survey && S.quests.survey.state === 'active' && chance(.6)) { addMat('scrap'); lines.push(['+1 Map Scrap', COL.cream]); }
    if (d.id === 'goose') { S.stats.geese = (S.stats.geese || 0) + 1; if (S.quests.goose && S.quests.goose.state === 'active') { Quests.progress('goose'); lines.push([`Goose Problem ${S.quests.goose.n}/3`, COL.gold2]); } }
    if (d.undead && a === 2 && !this.raid && S.quests.parish && S.quests.parish.state === 'active') { Quests.progress('parish'); lines.push([`Unquiet Parishioners ${S.quests.parish.n}/6`, COL.gold2]); }
    if (d.id === 'barnaby' && S.quests.reliquary && S.quests.reliquary.state === 'active') { S.quests.reliquary.n = 1; S.quests.reliquary.state = 'ready'; lines.push(['Recovered: the Reliquary of Saint Elbert', COL.green]); Toast.add('Return the reliquary to the Priest', COL.green, '✔'); }
    let reveal = null;
    if (!this.raid) { S.clears[a][l] = 1; if (this.boss) { const nb = !S.bosses[d.id]; S.bosses[d.id] = true; if (a !== 4 && a < AREAS.length - 1 && S.unlocked < a + 2) { S.unlocked = a + 2; reveal = a + 1; lines.push([`Path revealed: ${AREAS[a + 1].name}`, COL.green]); } } }
    if (this.raid) { S.stats.raids = (S.stats.raids || 0) + 1; lines.push(['The village is safe. The turnips salute you.', COL.green]); }
    const lv0 = S.level, xp0 = S.xp; S.xp += xp; let ups = 0; while (S.level < LEVEL_CAP && S.xp >= Stats.xpNeed()) { S.xp -= Stats.xpNeed(); S.level++; ups++; }
    if (ups) S.hp = Stats.maxHP();
    Save.save(true);
    this.rw = { xp, coins, lines, lv: lv0, xpShown: xp0, xpLeft: xp, ups, coinShown: 0, t: 0, reveal, flash: 0 };
    const ov = Overlays.push({ name: 'reward', update: dt => this.updReward(dt), draw: () => this.drawReward(ov) });
    SFX.play('coin');
  },
  updReward(dt) {
    const r = this.rw; r.t += dt; r.flash = Math.max(0, r.flash - dt * 2); if (r.t < .5) return;
    r.coinShown = Math.min(r.coins, r.coinShown + dt * Math.max(20, r.coins * 1.5)); if (Math.floor(r.coinShown) % 3 === 0 && r.coinShown < r.coins && chance(.3)) SFX.play('coin', { v: .3 });
    if (r.xpLeft > 0 && r.t > .9) { const step = Math.min(r.xpLeft, dt * Math.max(30, r.xp * 1.2)); r.xpLeft -= step; r.xpShown += step; if (r.xpShown >= Stats.xpNeed(r.lv)) { r.xpShown -= Stats.xpNeed(r.lv); r.lv++; r.flash = 1; SFX.play('levelup'); Music.sting('level'); Post.doFlash(.4, '#fff4c0'); Toast.add(`LEVEL UP! Now level ${r.lv} — HP restored`, COL.gold2, '▲'); } }
  },
  drawReward(ov) {
    const r = this.rw, k = Ease.outBack(clamp(r.t * 2.5, 0, 1)), x = 390, w = 500, h = 250 + r.lines.length * 24, y = 110 + (1 - k) * 40; g.globalAlpha = clamp(r.t * 3, 0, 1);
    UI.panel(x, y, w, h, { bg: 'rgba(18,13,22,.94)' });
    UI.text(this.raid ? 'RAID REPELLED' : this.boss ? 'BOSS DEFEATED' : 'VICTORY', 640, y + 50, { align: 'center', size: 36, col: COL.gold2, stroke: 3 });
    UI.text(`${this.E.name} has been dealt with.`, 640, y + 76, { align: 'center', size: 15, col: COL.dim, bold: false, italic: true });
    drawIcon('coin', x + 60, y + 112, 28); UI.text(`+${Math.floor(r.coinShown)} coins`, x + 84, y + 119, { size: 20, col: COL.gold2 });
    UI.text(`+${r.xp} XP`, x + w - 50, y + 119, { size: 20, col: COL.blue, align: 'right' });
    const need = Stats.xpNeed(r.lv); UI.text(`Level ${r.lv}`, x + 40, y + 158, { size: 15, col: r.flash > 0 ? '#fff' : COL.cream }); UI.bar(x + 120, y + 148, w - 180, 12, r.xpShown / need, r.flash > 0 ? '#fff4c0' : COL.blue); UI.text(`${Math.floor(r.xpShown)}/${need}`, x + w - 40, y + 158, { size: 12, col: COL.dim, align: 'right', bold: false });
    if (r.flash > 0) { g.globalAlpha = r.flash; UI.text('LEVEL UP!', 640, y + 190, { align: 'center', size: 26, col: '#fff4c0', stroke: 3 }); g.globalAlpha = 1; }
    r.lines.forEach(([s, c], i) => { if (r.t > .6 + i * .25) UI.text(s, 640, y + 218 + i * 24, { align: 'center', size: 16, col: c }); });
    if (r.t > 1 && UI.btn('CONTINUE', 560, y + h - 52, 160, 40, { accent: true, key: ['Enter', ' '], sound: 'confirm' })) {
      if (r.xpLeft > 0) { while (r.xpLeft > 0) { const st = Math.min(r.xpLeft, Stats.xpNeed(r.lv) - r.xpShown); r.xpLeft -= st; r.xpShown += st; if (r.xpShown >= Stats.xpNeed(r.lv)) { r.xpShown = 0; r.lv++; } } r.coinShown = r.coins; return; }
      Overlays.pop(ov); this.leave();
    }
    g.globalAlpha = 1;
  },
  leave() {
    if (this.def.id === 'lucien' && !this.raid) { Scene.go('ending', {}, { out: 1.4, in: 1, hold: .4, col: '#fff' }); return; }
    if (this.raid) { Scene.go('village', { from: 'gate', raidWon: true }, { out: .6, in: .6 }); return; }
    Scene.go('overworld', { node: this.area * 5 + this.lvl + 1, reveal: this.rw.reveal === null ? undefined : this.rw.reveal }, { type: 'fade', out: .6, in: .6 });
  },
  lose() {
    if (this.over) return; this.over = true; this.q = []; this.cue = null; this.mg = null; this.phase = 'lose'; S.hp = 0;
    this.pose(this.P, 'dead'); Music.stop(.05); SFX.play('death'); TimeFX.slowmo(1.2, .3); Cam.tz = 1.2; Cam.tx = PX; Cam.ty = 200; Post.fadeCol = '#000';
    this.say('You fall. The world goes quiet.');
    Tweens.to(Post, { fade: 1 }, 2.2, Ease.inQ, .6, () => {
      SFX.play('bell');
      const lost = Math.floor(S.coins * .25); S.coins -= lost; S.hp = Math.ceil(Stats.maxHP() / 2); S.stats.deaths = (S.stats.deaths || 0) + 1; S.time = (S.time + 4) % 24; S.lastLoss = lost; Save.save(true);
      Later.add(1.2, () => { Scene.go(this.area >= 5 && !this.raid ? 'port' : 'cathedral', { revive: true }, { out: .01, in: 1.4 }); Later.add(.05, () => { Post.fade = 0; }); Later.add(3.5, () => { if (lost) Toast.add(`The priest's fee: ${lost} coins`, COL.dim, '✝'); }); });
    });
  }
});
