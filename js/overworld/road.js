'use strict';
/* =========================================================
   ROAD ENCOUNTERS
   ========================================================= */
Scenes.road = {
  timeRuns: false,
  enter(a) {
    this.a = a; this.t = 0; this.px = -20; this.state = 'walk'; this.outcome = null; this.leaveT = 0;
    const ids = Object.keys(VISITORS).filter(id => id !== S.lastVisitor && !(id === 'herald' && S.bosses.lucien));
    this.id = pick(ids); S.lastVisitor = this.id; this.v = VISITORS[this.id]; this.vx = 420; this.react = 0;
    Music.resetLayers(); Music.play('road', 1); Amb.set('road'); Cam.reset(320, 226); Cam.follow = 3;
  },
  lines(arr) { return arr.map(([n, t]) => n === 'P' ? D(S.name, 'player', t) : D(n, this.v.voice, t)); },
  begin() {
    const v = this.v; const intro = this.lines(v.intro(S));
    intro.push({ n: '', v: 'narrator', t: `${v.name} waits for your answer.`, c: [{ t: 'HELP', f: () => this.choose('help') }, { t: 'ASK FOR PAYMENT', f: () => this.choose('pay') }, { t: 'MOVE ON', f: () => this.choose('leave') }] });
    Dialog.start(intro);
  },
  choose(k) {
    const v = this.v, prev = S.visitors[this.id]; S.visitors[this.id] = { met: (prev ? prev.met : 0) + 1, last: k }; this.outcome = k;
    Dialog.start(this.lines(v[k]), () => this.reward(k));
    if (k === 'help') { this.react = 1; SFX.play('heal'); for (let i = 0; i < 16; i++) Particles.spawn({ x: this.vx + rnd(-10, 10), y: 290 - rnd(0, 30), vx: rnd(-10, 10), vy: -rnd(10, 30), life: 1.4, c: '#fff4a0', type: 'star', size: 2 }); }
    if (k === 'leave') this.state = 'leaving';
  },
  reward(k) {
    const r = this.v.reward[k] || {}; let got = [];
    if (r.coins) { addCoins(r.coins); SFX.play('coin'); got.push(`+${r.coins} coins`); for (let i = 0; i < 10; i++) Particles.spawn({ x: this.vx, y: 270, vx: rnd(-50, -10), vy: rnd(-90, -40), g: 220, life: 1, c: '#f0c040', type: 'coin', rot: rnd(6), vr: 12, ground: 316 }); }
    if (r.item) { addItem(r.item); got.push('+1 ' + ITEMS[r.item].name); }
    if (r.mat) { addMat(r.mat); got.push('+1 ' + MATS[r.mat][0]); }
    if (r.buff && !S.buffs.includes(r.buff)) { S.buffs.push(r.buff); got.push(BUFFS[r.buff][0] + ': ' + BUFFS[r.buff][1]); }
    if (r.rep) { S.rep = (S.rep || 0) + r.rep; got.push(r.rep > 0 ? 'Reputation up' : 'Reputation down'); }
    got.forEach((s, i) => Later.add(i * .35, () => Toast.add(s, COL.gold2, '◆')));
    Save.save(true);
    Later.add(.8 + got.length * .3, () => Scene.go('combat', this.a, { type: 'iris', out: .7, in: .5, cx: 500, cy: 520 }));
  },
  update(dt) {
    this.t += dt; this.react = Math.max(0, this.react - dt);
    if (this.state === 'walk') { this.px += dt * 70; if (this.px >= 230) { this.px = 230; this.state = 'talk'; Later.add(.3, () => this.begin()); } }
    if (this.state === 'leaving') { this.px += dt * 60; }
    Cam.tx = 320 + (Input.mouse.lx - 320) * .03;
  },
  draw() {
    const c = ctx, t = this.t, a = this.a.area; c.setTransform(1, 0, 0, 1, 0, 0);
    const [top, bot] = World.sky(); drawSkyGradient(a >= 2 ? mix(top, '#1a1428', .6) : top, a >= 2 ? mix(bot, '#4a3a4a', .5) : bot);
    drawStars(World.nightK(), 3); drawMoon(520, 50, World.nightK());
    drawClouds(12, 60, '#ffffff', 5, .7);
    const bg = Cache.get('road' + a, 900, 420, (cc, w) => {
      const R = RNG(300 + a), hill = [['#8ab870', '#6a9a50'], ['#3a6a4a', '#2a5040'], ['#5a6a64', '#3a4a48'], ['#6a7a5a', '#4a5a40'], ['#3a2a3a', '#2a1a2a']][a];
      for (let L = 0; L < 2; L++) { const baseY = 200 + L * 30; for (let x = 0; x < w; x += 2) { const y = baseY - Math.abs(Math.sin(x / (120 - L * 30) + L * 3)) * (40 - L * 10) - noise1(x * .02 + L) * 10; P(hill[L], x, y, 2, 360 - y); } }
      for (let i = 0; i < 40; i++) { const x = R.r(0, w), y = R.r(222, 250); if (a === 1) mapTree(x, y, R.r(6, 9), 'pine'); else if (a === 2 || a === 4) mapTree(x, y, 0, 'dead'); else mapTree(x, y, R.r(5, 8), 'round'); }
      P(['#7a9a48', '#3a5a38', '#4a5a4a', '#5a6a48', '#2a1e28'][a], 0, 262, w, 160); P('#9a7a50', 0, 280, w, 26); P('#7a5a38', 0, 278, w, 2); P('#6a4a30', 0, 306, w, 2);
      for (let i = 0; i < 120; i++) P(R() < .5 ? '#8a6a44' : '#b89868', R.r(0, w), R.r(282, 304), R.i(1, 3), 1);
      for (let x = 10; x < w; x += 34) { P('#5a3a20', x, 254, 3, 16); P('#7a5a30', x - 16, 258, 34, 2); P('#7a5a30', x - 16, 264, 34, 2); }
      P('#4a2a18', 560, 236, 4, 40); P('#8a6a3a', 536, 238, 50, 12); P('#5a3a20', 536, 249, 50, 1); pText(['← CREEK', 'WOODS →', 'GRAVES →', 'MAZE →', 'FORTRESS →'][a], 561, 247, 7, '#2a1a10', 'center');
    });
    Cam.apply(c, .9); c.drawImage(bg, -130, 0);
    Cam.apply(c, 1);
    // visitor
    const talking = Dialog.open && Dialog.talking, vSpeak = talking && Dialog.speaker === this.v.name, pSpeak = talking && Dialog.speaker === S.name;
    if (this.v.frog) drawFrog(this.vx, 312, t, vSpeak, 1.3);
    else { const L = Object.assign({ s: 1.5, face: -1, t, talking: vSpeak, expr: this.outcome === 'help' ? 'happy' : this.outcome === 'leave' ? 'annoyed' : this.outcome === 'pay' ? 'surprise' : 'neutral', crouch: this.id === 'hero' && this.outcome !== 'help' ? 2 : 0, lean: this.id === 'hero' && this.outcome !== 'help' ? 2 : 0 }, this.v.look); if (this.react > 0) L.sq = 1 + Math.sin(this.react * 20) * .05; drawChar(this.vx, 312, L); }
    drawChar(this.px, 314, playerLook({ s: 1.5, face: 1, t, walk: this.state !== 'talk' ? t * 10 : undefined, talking: pSpeak, low: S.hp / Stats.maxHP() < .3 }));
    Particles.draw(false);
    Light.begin(World.ambient(a >= 2 ? .6 : 1)); if (World.nightK() > .2) Light.add(this.px, 260, 90, '#ffd8a0', .6 * World.nightK()); Light.apply();
    c.setTransform(1, 0, 0, 1, 0, 0); outdoorWeather(300); Weather.fog(World.fog + (a === 2 ? .6 : 0), '#c8c0d8', Cam.x);
  },
  ui() {
    UI.text('ON THE ROAD', 640, 42, { align: 'center', size: 22, col: COL.gold2 }); UI.text(`${AREAS[this.a.area].name} · a stranger blocks the path`, 640, 64, { align: 'center', size: 14, col: COL.dim, bold: false, italic: true });
  }
};
