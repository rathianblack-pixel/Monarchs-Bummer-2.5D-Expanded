'use strict';
/* =========================================================
   TITLE SCENE
   ========================================================= */
Scenes.title = {
  enter() { this.t = 0; this.menu = false; this.eyes = []; for (let i = 0; i < 7; i++) this.eyes.push({ x: rnd(30, 610), y: rnd(250, 330), p: rnd(10), s: rnd(.6, 1) }); this.birds = []; Music.play('title', 2); Amb.set('title'); this.nextBolt = 3; this.bolt = 0; Post.letter = 0; },
  update(dt) {
    this.t += dt; this.nextBolt -= dt; this.bolt = Math.max(0, this.bolt - dt * 3);
    if (this.nextBolt <= 0) { this.nextBolt = rnd(5, 11); this.bolt = 1; SFX.play('thunder', { v: .7 }); Later.add(.08, () => this.bolt = .4); Later.add(.16, () => this.bolt = .9); }
    if (chance(dt * .15)) this.birds.push({ x: -10, y: rnd(60, 140), v: rnd(20, 35), p: rnd(10) });
    for (const b of this.birds) b.x += b.v * dt; this.birds = this.birds.filter(b => b.x < 660);
    if (chance(dt * 22)) Particles.spawn({ x: rnd(-20, 640), y: -5, vx: rnd(8, 20), vy: rnd(10, 25), life: rnd(6, 12), c: chance(.3) ? '#f08050' : '#8a7a7a', size: 1, drag: 1, type: 'dot', glow: chance(.3) ? 1 : 0 });
    if (!this.menu && (Input.hit(' ', 'Enter') || (Input.mouse.clicked && !UI.inRect(1180, 660, 90, 50)))) { this.menu = true; SFX.play('confirm'); Input.mouse.clicked = false; Input.consume(' ', 'Enter'); }
  },
  draw() {
    const t = T, mx = (Input.mouse.lx - 320) / 320, my = (Input.mouse.ly - 180) / 180; ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawSkyGradient('#1a0a1a', '#6a1a22'); const par = (k) => [Math.round(-mx * k), Math.round(-my * k * .4)];
    // storm clouds
    drawClouds(3, 40, '#4a1a28', 6, .9, 1.4); drawClouds(8, 90, '#6a2230', 10, .7, 1.1);
    if (this.bolt > .01) { ctx.globalAlpha = this.bolt * (Settings.flashes ? .5 : .15); P('#ffe0e0', 0, 0, 640, 360); ctx.globalAlpha = 1; }
    // far mountains
    let [ox, oy] = par(3); ctx.drawImage(Cache.get('t_mtn1', 700, 200, () => { const r = RNG(11); const pts = [[0, 200]]; for (let x = 0; x <= 700; x += 14) pts.push([x, 90 + Math.sin(x * .013) * 30 + r.r(-12, 12)]); pts.push([700, 200]); pPoly('#2a1020', pts); for (let i = 0; i < 40; i++) P('#3a1828', r() * 700, 100 + r() * 60, r.i(2, 8), 1); }), ox - 30, 60 + oy);
    // fortress
    [ox, oy] = par(5); const fx = 400 + ox, fy = 120 + oy;
    ctx.drawImage(Cache.get('t_fort', 200, 160, () => { const O = '#0e0610', B = '#1a0c18'; P(B, 40, 60, 120, 100); P(B, 20, 30, 26, 130); P(B, 150, 40, 26, 120); P(B, 85, 0, 30, 160); pPoly(B, [[15, 32], [33, 5], [51, 32]]); pPoly(B, [[145, 42], [163, 12], [181, 42]]); pPoly(B, [[80, 2], [100, -30], [120, 2]]); for (let i = 0; i < 12; i++) P(B, 40 + i * 10, 54, 6, 7); const r = RNG(4); for (let i = 0; i < 30; i++) P('#2a1424', r() * 180 + 10, r() * 140 + 20, 1, r.i(2, 6)); }), fx, fy);
    const wins = [[28, 60], [30, 90], [95, 30], [100, 70], [158, 70], [60, 100], [130, 110], [98, 110]];
    wins.forEach(([wx, wy], i) => { const fl = .6 + .4 * noise1(t * 3 + i * 7); P(mix('#8a3010', '#ffb040', fl), fx + wx, fy + wy, 3, 4); ctx.globalAlpha = .25 * fl; pCirc('#ff9040', fx + wx + 1, fy + wy + 2, 5); ctx.globalAlpha = 1; });
    for (let i = 0; i < 3; i++) { const bx = fx + [33, 100, 163][i], by = fy + [5, -30, 12][i] - 2; P('#1a0c18', bx, by - 12, 1, 12); const w2 = Math.sin(t * 3 + i) * 2; pPoly('#8a1020', [[bx + 1, by - 12], [bx + 10 + w2, by - 10], [bx + 1, by - 7]]); }
    // bird silhouettes
    for (const b of this.birds) { const f = Math.sin(t * 10 + b.p) > 0 ? -1 : 1; P('#0e0610', b.x, b.y, 1, 1); P('#0e0610', b.x - 2, b.y + f, 2, 1); P('#0e0610', b.x + 1, b.y + f, 2, 1); }
    // mid mountains
    [ox, oy] = par(9); ctx.drawImage(Cache.get('t_mtn2', 720, 200, () => { const r = RNG(21); const pts = [[0, 200]]; for (let x = 0; x <= 720; x += 10) pts.push([x, 70 + Math.abs(Math.sin(x * .02)) * -40 + r.r(-8, 8) + 40]); pts.push([720, 200]); pPoly('#1a0a14', pts); }), ox - 40, 190 + oy);
    // road
    [ox, oy] = par(12); ctx.drawImage(Cache.get('t_road', 720, 140, () => { const r = RNG(31); P('#140810', 0, 0, 720, 140); for (let y = 0; y < 140; y++) { const cx = 360 + Math.sin(y * .05) * 60 * (1 - y / 140), w = 6 + y * .8; P('#3a2028', cx - w / 2, y, w, 1); if (r() < .3) P('#4a2830', cx - w / 2 + r() * w, y, 2, 1); } for (let i = 0; i < 12; i++) { const x = r() * 720, h = r.r(20, 60); pPoly('#0a0408', [[x, 30], [x - 8, 30 + h * .4], [x + 1, 30 - h], [x + 10, 30 + h * .4]]); } }), ox - 40, 250 + oy);
    // torchlights on road
    for (let i = 0; i < 4; i++) { const tx = 320 + ox + Math.sin(i * 1.3) * 40, ty = 262 + i * 7 + oy, fl = .6 + .4 * noise1(t * 4 + i); P('#ffc060', tx, ty, 1, 1); ctx.globalAlpha = .3 * fl; pCirc('#ff9040', tx, ty, 3); ctx.globalAlpha = 1; }
    // black trees
    [ox, oy] = par(16); ctx.drawImage(Cache.get('t_trees', 760, 200, () => { const r = RNG(41); for (let i = 0; i < 16; i++) { const x = r() * 760, h = r.r(60, 130), base = 200; P('#07030a', x, base - h, r.i(3, 5), h); for (let k = 0; k < 6; k++) { const by = base - h + r() * h * .7, dir = r() < .5 ? -1 : 1, len = r.r(8, 26); pLine('#07030a', x + 2, by, x + 2 + dir * len, by - r.r(4, 14), r() < .5 ? 2 : 1); } } }), ox - 60, 160 + oy);
    // eyes in darkness
    for (const e of this.eyes) { const blink = (t * e.s + e.p) % 5; if (blink > 4.85) continue; const a = clamp(Math.sin(t * .4 + e.p) + .3, 0, 1); if (a <= 0) continue; ctx.globalAlpha = a; P('#ff3030', e.x + ox, e.y + oy, 2, 1); P('#ff3030', e.x + 5 + ox, e.y + oy, 2, 1); ctx.globalAlpha = 1; }
    // foreground rocks & weeds
    [ox, oy] = par(24); ctx.drawImage(Cache.get('t_fg', 760, 90, () => { const r = RNG(51); const pts = [[0, 90]]; for (let x = 0; x <= 760; x += 12) pts.push([x, 40 + r.r(-18, 10) + (x > 250 && x < 500 ? 30 : 0)]); pts.push([760, 90]); pPoly('#050206', pts); for (let i = 0; i < 30; i++) P('#140a12', r() * 760, 50 + r() * 30, r.i(3, 12), 1); }), ox - 60, 290 + oy);
    for (let i = 0; i < 22; i++) { const r = RNG(60 + i), x = r() * 680 - 20 + ox, base = 330 + r.r(-8, 20) + oy; if (x > 250 + ox && x < 390 + ox) continue; const sw = Math.sin(t * 1.6 + i) * 2; pLine('#0a040a', x, base, x + sw, base - r.r(8, 18), 1); pLine('#0a040a', x + 2, base, x + 2 + sw * 1.3, base - r.r(6, 14), 1); }
    Particles.draw(false);
    // title lettering
    const fl = Math.round(Math.sin(t * 1.2) * 1.5);
    const drawTitle = (str, y, size) => { ctx.font = `bold ${size}px ${FONT}`; ctx.textAlign = 'center'; for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 3; dy++) { ctx.fillStyle = '#0a0408'; ctx.fillText(str, 320 + dx, y + dy + fl); } ctx.fillStyle = '#6a1a14'; ctx.fillText(str, 320, y + 2 + fl); const gr = ctx.createLinearGradient(0, y - size, 0, y); gr.addColorStop(0, '#fff0b0'); gr.addColorStop(.5, '#e8b040'); gr.addColorStop(1, '#a06020'); ctx.fillStyle = gr; ctx.fillText(str, 320, y + fl); };
    drawTitle('THE DEMON LORD\'S', 70, 26); drawTitle('BUMMER', 118, 50);
    ctx.globalAlpha = .6 + .4 * Math.sin(t * 2); P('#e8b040', 250, 128 + fl, 140, 1); ctx.globalAlpha = 1;
  },
  ui() {
    if (!this.menu) { const b = .55 + .45 * Math.sin(T * 2.4); UI.text('START GAME', 640, 520, { align: 'center', size: 26 + b * 2, col: mix('#c9a45a', '#fff4d0', b) }); UI.text('click or press Space', 640, 548, { align: 'center', size: 13, col: COL.dim, bold: false, alpha: .7 }); }
    else {
      const has = Save.has();
      if (UI.btn('New Game', 540, 470, 200, 46, { accent: true, key: has ? '1' : ['1', 'Enter', ' '], size: 18 })) { SFX.play('confirm'); Music.stop(1.2); Scene.go('intro', { ng: false }, { out: 1, in: .8 }); }
      if (UI.btn('Continue', 540, 526, 200, 46, { disabled: !has, key: has ? ['2', 'Enter', ' '] : '2', size: 18 })) { if (Save.load()) { S.hp = Math.max(1, S.hp || Stats.maxHP()); Scene.go('village', { from: 'load' }, { out: .6, in: .6 }); } }
      if (!has) UI.text('No save found', 640, 592, { align: 'center', size: 12, col: COL.dim, bold: false });
    }
    if (UI.btn('⚙', 1220, 664, 44, 40, { size: 18 })) openSettings();
    UI.text('An original procedural RPG · all art & audio generated in code', 20, 706, { size: 11, col: 'rgba(200,180,160,.4)', bold: false, shadow: false });
  }
};
