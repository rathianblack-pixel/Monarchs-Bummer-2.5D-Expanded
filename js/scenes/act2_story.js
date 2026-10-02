'use strict';
/* =========================================================
   ACT II STORY SCENES
   knock   – post-credits hook (Lucien at the door in a bathrobe)
   sail    – boat crossing between Act I and Act II (HD + LOW)
   act2end – after Saint Grinwell: Grin / Bummer / True ending choice
   comfort – the True ending: breathe with the Bummer
   ========================================================= */

// ---------- hooks into existing scenes ----------
(function () {
  // credits: once Lucien has been beaten, a knock follows THE END
  const cu = Scenes.credits.ui;
  Scenes.credits.ui = function () {
    cu.call(this);
    const ey = 760 + CREDITS.length * 90 - this.y + 40;
    if (ey < 700 && Act.open2() && !Overlays.stack.length) {
      const y = Math.max(300, ey) + 168;
      if (Math.sin(T * 6) > 0) UI.text('*knock knock*', 1020, y - 8, { align: 'center', size: 13, col: COL.gold2, italic: true });
      if (UI.btn(S.act >= 2 ? 'Back to Port Mopeway' : 'A KNOCK AT THE DOOR…', 880, y, 280, 44, { accent: true, sub: 'Act II · The Bummer Below' })) { Save.save(true); if (S.act >= 2) Scene.go('port', { from: 'sail' }, { out: 1, in: 1 }); else Scene.go('knock', {}, { out: 1, in: 1 }); }
    }
  };
  // SAIL button on Act I hub + overworld once Act II is open
  const hd = HUD.draw;
  HUD.draw = function (o = {}) {
    if (o.buttons && (Scene.name === 'village' || Scene.name === 'overworld') && Act.open2() && !o.buttons.some(b => b[0] === 'SAIL'))
      o.buttons = o.buttons.concat([['SAIL', () => { SFX.play('confirm'); if (S.act >= 2) Act.sail(2); else Scene.go('knock', {}, { out: .8, in: .8 }); }, S.act >= 2 ? 'Sail to Port Mopeway' : 'Someone is knocking…', 56]]);
    return hd.call(this, o);
  };
  // "Continue" lands you in whichever hub you last stood in
  const go = Scene.go;
  Scene.go = function (name, args, tr) {
    if (name === 'village' && args && args.from === 'load' && S && S.act >= 2 && S.hub === 'port') { name = 'port'; args = { from: 'load' }; }
    if (name === 'village' && S) S.hub = 'village';
    return go.call(this, name, args, tr);
  };
})();

// ---------- shared cinematic bits ----------
function a2Sea(t, y0, hd) {
  const c = ctx; const gr = c.createLinearGradient(0, y0, 0, 360); gr.addColorStop(0, '#2a6aa0'); gr.addColorStop(1, '#0a2244'); c.fillStyle = gr; c.fillRect(0, y0, 640, 360 - y0);
  const rows = hd ? 14 : 8;
  for (let r = 0; r < rows; r++) { const yy = y0 + 4 + r * r * 1.2 + r * 3, sp = 10 + r * 6, a = .25 + r * .04; c.globalAlpha = a; for (let x = -40; x < 680; x += 26 + r * 4) { const xx = ((x + t * sp) % 720 + 720) % 720 - 40; P(r % 2 ? '#8ac8f0' : '#c8e8ff', xx, yy + Math.sin(t * 2 + x) * 1.2, 6 + r, 1); } }
  c.globalAlpha = 1;
}
function a2DrawBoat(x, y, t, who) {
  const bob = Math.sin(t * 1.6) * 2, tilt = Math.sin(t * 1.1) * .04;
  ctx.save(); ctx.translate(x, y + bob); ctx.rotate(tilt);
  pPoly(OLC, [[-46, -6], [46, -6], [36, 14], [-36, 14]]); pPoly('#8a5a34', [[-44, -4], [44, -4], [35, 12], [-35, 12]]); P('#c08a58', -44, -4, 88, 2); P('#6a4024', -34, 6, 68, 2);
  P(OLC, -2, -66, 4, 62); P('#8a5a34', -1, -66, 2, 62);
  pPoly(OLC, [[2, -64], [34, -22], [2, -18]]); pPoly('#f0e4c8', [[3, -61], [31, -23], [3, -20]]); P('#c83a4a', 3, -40, 22, 2);
  ctx.restore();
  (who || []).forEach((f, i) => f(x - 26 + i * 18, y - 4 + bob));
}

// ---------- KNOCK: the post-credits hook ----------
Scenes.knock = {
  enter() {
    this.t = 0; this.door = 0; this.out = 0; Music.stop && Music.stop(1); Amb.set('silent'); Post.letter = 1;
    Later.add(1.2, () => { SFX.play('knock'); Cam.shake(.25); });
    Later.add(2.0, () => { SFX.play('knock'); Cam.shake(.25); });
    Later.add(3.0, () => { this.door = .01; SFX.play('door'); });
    Later.add(4.2, () => Dialog.start([
      D('Lucien', 'lucien', 'Hi. Sorry. Hi. I know it\'s late. I know you beat me up. That was fair.'),
      D(S.name, 'player', '…are you wearing a bathrobe?'),
      D('Lucien', 'lucien', 'I was having a bath when they took it. The Bummer. The big sad whale under the sea. The thing that let the whole world feel bad on a Tuesday.'),
      D('Sister Pell', 'priest', 'A man called Saint Grinwell dragged it to Grinhaven. He wants everyone to be FINE. Permanently. It\'s horrible.'),
      D('Sir Honkington', 'monster', 'HONK.'),
      D('Lucien', 'lucien', 'There\'s a boat. It leaks a little. Like me. Coming?', { c: [{ t: 'Get in the boat', f: () => this.leave() }, { t: '…fine. Get in the boat.', f: () => this.leave() }] })
    ]));
  },
  leave() { Act.begin2(); Post.letter = 0; Act.sail(2); },
  exit() { Post.letter = 0; },
  update(dt) { this.t += dt; if (this.door) this.door = Math.min(1, this.door + dt * 1.4); },
  draw() {
    const c = ctx, t = this.t, hd = Gfx.level >= 1; c.setTransform(1, 0, 0, 1, 0, 0);
    drawSkyGradient('#0a0a22', '#2a2244'); drawStars(.8, 33, 200);
    P('#3a2a24', 0, 60, 640, 240); for (let y = 60; y < 300; y += 12) P('#2a1e1a', 0, y, 640, 1); for (let x = 0; x < 640; x += 46) P('#2a1e1a', x + ((x / 46) % 2) * 23, 60, 1, 240);
    P('#1a1210', 0, 296, 640, 64); P('#4a3a2a', 0, 296, 640, 4);
    // window w/ warm light
    P(OLC, 420, 120, 80, 70); P('#ffd890', 424, 124, 72, 62); P(OLC, 458, 124, 3, 62); P(OLC, 424, 154, 72, 3);
    // door frame + door
    P(OLC, 236, 110, 128, 190); P('#140e0c', 242, 116, 116, 184);
    const dw = 112 * (1 - this.door * .85); P(OLC, 244, 118, dw, 180); P('#7a4a2a', 246, 120, dw - 4, 176); if (dw > 30) { P('#5a3420', 256, 134, dw - 24, 60); P('#5a3420', 256, 212, dw - 24, 70); pCirc('#e0c060', 244 + dw - 14, 210, 3); }
    if (this.door > .3) {
      const k = Ease.outQ(clamp((this.door - .3) / .7, 0, 1));
      c.globalAlpha = k; drawCompanion('pell', 330, 300, { s: 1.15, t, talking: Dialog.speaker === 'Sister Pell' }); drawCompanion('honk', 352, 304, { s: .9, t, face: -1 });
      drawChar(300, 300, COMP_LOOK.lucien({ s: 1.3, t, face: -1, talking: Dialog.speaker === 'Lucien' })); c.globalAlpha = 1;
    }
    drawChar(140, 312, playerLook({ s: 1.4, face: 1, t, expr: this.door ? 'surprise' : 'tired', talking: Dialog.speaker === S.name }));
    if (hd) for (let i = 0; i < 3; i++) { const yy = (t * 8 + i * 40) % 120; c.globalAlpha = .15; pCirc('#e8e0ff', 300 + Math.sin(t + i) * 10, 290 - yy, 6); c.globalAlpha = 1; }
    Light.begin([90, 90, 140]); Light.add(460, 154, 120, '#ffd080', .8, .3); if (this.door) Light.add(300, 210, 140, '#c8d8ff', .4 * this.door); Light.add(140, 270, 90, '#ffe0c0', .3); Light.apply(); c.setTransform(1, 0, 0, 1, 0, 0);
  },
  ui() { if (this.t < 4 && !Dialog.open) UI.text('Placenta Creek · some nights after THE END', 640, 680, { align: 'center', size: 14, col: COL.dim, italic: true, bold: false }); }
};

// ---------- SAIL: crossing the water between acts ----------
Scenes.sail = { hd: true,
  enter(a) {
    this.to = a.to || 2; this.t = 0; this.dur = 7; this.done = false; Music.play('map2', 1); Amb.set('map2');
    Later.add(.8, () => Banner.show(this.to === 2 ? 'THE BUMMER BELOW' : 'THE KINGDOM', this.to === 2 ? 'Sailing to Port Mopeway…' : 'Sailing home to Placenta Creek…', COL.gold2, 2.6));
    Cam.reset(320, 200); Cam.follow = 0; Ach.unlock('sail');
  },
  finish() { if (this.done) return; this.done = true; if (this.to === 2) { S.act = 2; S.hub = 'port'; Scene.go('port', { from: 'sail' }, { out: .8, in: .8 }); } else { S.act = 1; Scene.go('village', { from: 'gate' }, { out: .8, in: .8 }); } },
  update(dt) {
    this.t += dt; if (this.t > this.dur) this.finish();
    if (this.t > 1 && (Input.hit(' ', 'Enter') || Input.mouse.clicked)) { Input.mouse.clicked = false; this.finish(); }
    if (chance(dt * 3)) Particles.spawn({ x: rnd(0, 640), y: rnd(220, 340), vx: -20, vy: -4, life: 1, c: '#e8f4ff', size: 1, drag: 1 });
  },
  crew(t) { const L = COMP_LOOK; return [(x, y) => drawChar(x, y, playerLook({ s: .9, face: this.to === 2 ? 1 : -1, t })), (x, y) => drawChar(x, y, L.lucien({ s: .9, t, face: 1 })), (x, y) => drawCompanion('pell', x, y, { s: .9, t }), (x, y) => drawCompanion('honk', x, y, { s: .7, t, face: 1 })]; },
  boatX() { const k = clamp(this.t / this.dur, 0, 1); return this.to === 2 ? 120 + k * 420 : 520 - k * 420; },
  draw() {
    const t = this.t, nk = World.nightK(), bx = this.boatX();
    if (HD.live) {
      HD.begin({ pitch: 18, fov: 40, zs: 'auto', tx: 320, ty: 230, zoom: 1, maxBack: 600, clear: nk > .5 ? [.05, .07, .16] : [.45, .65, .9], fog: [300, 1100, .55], fogC: nk > .5 ? [.08, .1, .22] : [.7, .82, .95], cloud: .25, dof: [.2, .22, .9, .9], bloom: [.62, .5], vig: .5 });
      HD.ground(m2SeaTile(), -1000, -900, { w: 2640, h: 1600, rep: true, sx: (t * 14) % 128, sy: (t * 4) % 128 });
      for (let k = 0; k < 5; k++) { const cl = owCloud(k), cx = ((k * 197 + t * 10) % 1000) - 200; HD.art(cl.c, cx - cl.bx, -80 - k * 20, -60, { alpha: .75, unlit: true, scale: 1.6 }); }
      // distant shore (destination) & the other one shrinking behind
      HD.capture(-100, () => { const left = this.to === 1; for (let i = 0; i < 7; i++) { const x = (left ? 40 : 460) + i * 22, h = 20 + ((i * 37) % 30); pPoly(i % 2 ? '#2a4a3a' : '#3a5a44', [[x, -100], [x + 30, -100 - h], [x + 60, -100]]); } }, null, 0, [0, -160, 640, 70]);
      HD.capture(230, () => { a2DrawBoat(bx, 230, t, this.crew(t)); }, null, 0, [bx - 70, 140, 140, 110]);
      HD.layer('top'); Particles.draw(false); HD.groundLayer('top');
      Light.begin(mixA(World.ambient(), [255, 250, 240], .4)); Light.add(bx, 200, 120, '#fff0d0', .3); Light.apply();
      HD.screenLayer(); outdoorWeather(300, .8); return;
    }
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0);
    drawSkyGradient(nk > .5 ? '#0a1030' : '#4a8ad0', nk > .5 ? '#2a3a6a' : '#c8e0f0', 0, 200); drawStars(nk, 9, 160); drawClouds(12, 60, '#f0f4ff', 8, .8);
    const left = this.to === 1; for (let i = 0; i < 7; i++) { const x = (left ? 20 : 470) + i * 22, h = 14 + ((i * 37) % 22); pPoly(i % 2 ? '#2a4a3a' : '#3a5a44', [[x, 190], [x + 30, 190 - h], [x + 60, 190]]); }
    a2Sea(t, 186, Gfx.level >= 1); a2DrawBoat(bx, 262, t, this.crew(t));
    c.globalAlpha = .35; for (let i = 0; i < 6; i++) P('#e8f4ff', bx - (this.to === 2 ? 60 + i * 12 : -60 - i * 12), 274 + Math.sin(t * 3 + i) * 2, 8, 1); c.globalAlpha = 1;
    Particles.draw(false);
    Light.begin(mixA(World.ambient(), [255, 250, 240], .4)); Light.apply(); c.setTransform(1, 0, 0, 1, 0, 0); outdoorWeather(300, .8);
  },
  ui() { UI.text('Click / SPACE to skip', 1260, 700, { align: 'right', size: 12, col: COL.dim, bold: false }); }
};

// ---------- ACT II ENDINGS ----------
const ENDING_TEXT = {
  grin: { title: 'THE GRIN ENDING', sub: 'Everyone is fine. Forever.', lines: ['You took the Saint\'s smile and put it on.', 'It fit perfectly. That was the worst part.', 'Grinhaven threw you a parade. You waved. You could not stop waving.', 'Somewhere under the sea, the Bummer sang one last low note, and then nobody could hear it any more.'] },
  bummer: { title: 'THE BUMMER ENDING', sub: 'It is Tuesday again.', lines: ['You broke the chains and the Bummer sank home, slow and enormous.', 'The next morning, everyone in Grinhaven woke up a little bit sad.', 'Some cried. Some called their mums. One clown quit.', 'It wasn\'t happy. It was honest. Lucien says that\'s the same thing, on a good day.'] },
  true: { title: 'THE TRUE ENDING', sub: 'The Crown of Small Sorrows', lines: ['You wore five small sorrows as a crown, and sat with a whale until it could breathe.', 'Saint Grinwell cried for the first time in forty years. It took a while. Pell held the tissues.', 'The Bummer went home. It visits on Tuesdays.', 'Being sad, it turns out, is just love with nowhere to go. So you gave it somewhere.'] }
};
Scenes.act2end = {
  enter(a) {
    this.t = 0; this.stage = a.stage || 'choice'; this.kind = a.kind || null; this.forge = 0; Music.play(this.stage === 'card' ? (this.kind === 'grin' ? 'grin_end' : 'whale') : 'whale', 1.5); Amb.set('deep'); Post.letter = 1;
    S.bosses = S.bosses || {}; S.bosses.grinwell = 1; Save.save(true);
    if (this.stage === 'choice') Later.add(1, () => Dialog.start([
      D('Saint Grinwell', 'monster', 'You don\'t understand. If nobody is sad, nobody gets hurt. I just wanted everyone to be FINE.'),
      D('Lucien', 'lucien', 'Nobody is fine, Grinwell. That\'s the whole thing. That\'s the whole point of the whale.'),
      D('Sister Pell', 'priest', 'It\'s your choice. It was always going to be your choice. Sorry. That\'s a lot.')
    ], () => { this.ask = true; }));
  },
  exit() { Post.letter = 0; },
  pick(k) {
    SFX.play('confirm'); this.ask = false; S.endings = S.endings || {};
    if (k === 'crown') { this.stage = 'forge'; this.forge = 0; Music.play('whale', 1); SFX.play('anvil'); return; }
    this.finishEnding(k);
  },
  finishEnding(k) { S.endings[k] = 1; Ach.unlock(k); Save.save(true); Scene.go('act2end', { stage: 'card', kind: k }, { out: 1.2, in: 1, col: k === 'grin' ? '#fff' : '#000' }); },
  update(dt) {
    this.t += dt;
    if (this.stage === 'forge') { this.forge += dt / 4; if (this.forge >= 1 && !this.forged) { this.forged = true; S.crown = true; Ach.unlock('crown'); SFX.play('levelup'); Post.doFlash(.6); Save.save(true); Later.add(1.6, () => Scene.go('comfort', {}, { out: 1.2, in: 1.2 })); } }
    if (chance(dt * 6)) Particles.spawn({ x: rnd(0, 640), y: 360, vx: rnd(-4, 4), vy: rnd(-24, -10), life: rnd(3, 6), c: this.kind === 'grin' ? '#f8c0e0' : '#a8d8ff', size: 1, drag: 1 });
  },
  draw() {
    const c = ctx, t = this.t, hd = Gfx.level >= 1, k = this.kind; c.setTransform(1, 0, 0, 1, 0, 0);
    if (this.stage === 'card' && k === 'grin') { drawSkyGradient('#f8b8d8', '#fff0c0'); for (let i = 0; i < 18; i++) { const x = (i * 41 + t * 30) % 680 - 20, y = 40 + (i * 53) % 160 + Math.sin(t + i) * 6; pCirc(['#ff6aa0', '#ffd040', '#6ad0ff'][i % 3], x, y, 7); pLine('#8a6a6a', x, y + 7, x + 2, y + 30, 1); } }
    else { drawSkyGradient('#06142a', k === 'bummer' ? '#3a5a8a' : '#1a3a6a'); drawStars(hd ? .9 : .6, 45, 180); }
    // cathedral silhouette
    if (this.stage !== 'card' || k !== 'grin') { pPoly('#0a0a18', [[380, 300], [380, 140], [430, 90], [480, 140], [480, 300]]); P('#0a0a18', 330, 200, 200, 100); if (hd) { c.globalAlpha = .5; pCirc('#ffe0a0', 430, 150, 10); c.globalAlpha = 1; } }
    a2Sea(t, 270, hd);
    // the Bummer, chained or freed
    const whaleUp = this.stage === 'card' ? (k === 'grin' ? -1 : 0) : 1;
    if (whaleUp >= 0) { const wy = 300 - whaleUp * 10; drawMonster({ id: 'whale', arch: 'whale', scale: 1.5, look: {} }, 520, wy + Math.sin(t * .8) * 3, { t, face: -1, breath: Math.sin(t * .8), tear: k !== 'bummer' }); if (whaleUp > 0) for (let i = 0; i < 6; i++) pLine('#5a5a6a', 470 + i * 14, 300, 480 + i * 10, 360, 1); }
    if (this.stage !== 'card') {
      drawMonster(ENEMY.grinwell, 300, 300, { t, face: -1, phase2: true, expr: 'sad', sMul: .9, crouch: .4 });
      drawChar(150, 304, playerLook({ s: 1.3, face: 1, t, talking: Dialog.speaker === S.name }));
      drawChar(110, 304, COMP_LOOK.lucien({ s: 1.1, face: 1, t, talking: Dialog.speaker === 'Lucien' })); drawCompanion('pell', 80, 306, { s: 1.05, t, talking: Dialog.speaker === 'Sister Pell' }); drawCompanion('honk', 186, 308, { s: .8, t });
    } else if (k === 'grin') { for (let i = 0; i < 5; i++) drawChar(120 + i * 90, 310, { s: 1, t, face: i % 2 ? -1 : 1, seed: i + 2, skin: SKIN_TONES[i % 5], hair: HAIR_COLS[i % 6], top: '#f8f0e0', pants: '#e8d8b8', weapon: 'none', expr: 'happy', armF: .5 + Math.sin(t * 8 + i) * .4 }); drawChar(320, 300, playerLook({ s: 1.3, face: 1, t, expr: 'happy', armF: .5 + Math.sin(t * 8) * .5 })); }
    else { drawChar(300, 306, playerLook({ s: 1.3, face: 1, t, expr: k === 'true' ? 'happy' : 'tired' })); drawChar(250, 306, COMP_LOOK.lucien({ s: 1.1, face: 1, t })); drawCompanion('pell', 220, 308, { s: 1.05, t }); drawCompanion('honk', 340, 310, { s: .8, t }); if (k === 'true' || S.crown) a2Crown(300, 262, t, 1); }
    if (this.stage === 'forge') { const f = clamp(this.forge, 0, 1); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + t * (1 + f * 3), r = 60 * (1 - f) + 4; const px = 150 + Math.cos(a) * r, py = 250 + Math.sin(a) * r * .5; pCirc('#a8d8ff', px, py, 3); if (hd) { c.globalAlpha = .3; pCirc('#c8e8ff', px, py, 7); c.globalAlpha = 1; } } if (f > .9) a2Crown(150, 256, t, (f - .9) * 10); }
    Particles.draw(false);
    Light.begin(k === 'grin' && this.stage === 'card' ? [255, 240, 240] : [120, 140, 200]); Light.add(520, 280, 140, '#a8d0ff', .5); if (this.stage === 'forge') Light.add(150, 250, 90 + this.forge * 80, '#c8e8ff', .9, .5); Light.add(200, 280, 120, '#ffe8d0', .4); Light.apply(); c.setTransform(1, 0, 0, 1, 0, 0);
  },
  ui() {
    if (this.stage === 'choice' && this.ask && !Dialog.open && !Overlays.stack.length) {
      UI.panel(340, 470, 600, 220); UI.text('What do you do with the Bummer?', 640, 506, { align: 'center', size: 20, col: COL.gold2 });
      if (UI.btn('Take Grinwell\'s smile', 370, 530, 260, 46, { sub: 'Everyone will be fine. Forever.', key: '1' })) this.pick('grin');
      if (UI.btn('Break the chains', 650, 530, 260, 46, { sub: 'Let the world be sad again.', key: '2' })) this.pick('bummer');
      const can = (S.shards || []).length >= 5;
      if (UI.btn(can ? 'Forge the Crown of Small Sorrows' : `??? (Sigh Shards ${(S.shards || []).length}/5)`, 440, 600, 400, 50, { accent: can, disabled: !can, sub: can ? 'Five small sorrows. One big hug.' : 'Find every Sigh Shard on the side paths', key: '3' })) this.pick('crown');
    }
    if (this.stage === 'forge') UI.text('The five Sigh Shards hum together…', 640, 660, { align: 'center', size: 18, col: '#c8e8ff', italic: true });
    if (this.stage === 'card') {
      const E = ENDING_TEXT[this.kind]; const a = clamp(this.t / 2, 0, 1); g.globalAlpha = a;
      UI.panel(300, 60, 680, 330); UI.text(E.title, 640, 110, { align: 'center', size: 30, col: COL.gold2, stroke: 3 }); UI.text(E.sub, 640, 140, { align: 'center', size: 15, col: COL.dim, italic: true, bold: false });
      E.lines.forEach((l, i) => { if (this.t > 1.5 + i * 1.6) UI.para(l, 340, 180 + i * 50, 600, { size: 15, col: COL.cream }); });
      g.globalAlpha = 1;
      const seen = Object.keys(S.endings || {}).filter(k => S.endings[k]).length;
      UI.text(`Endings seen: ${seen}/3`, 640, 418, { align: 'center', size: 13, col: COL.dim, bold: false });
      if (this.t > 3) {
        if (UI.btn('Roll Credits', 520, 440, 240, 44, { accent: true, key: 'Enter' })) Scene.go('credits', {}, { out: 1, in: 1 });
        if (UI.btn('Back to Port Mopeway', 520, 494, 240, 40, { style: 'ghost' })) Scene.go('port', { from: 'sail' }, { out: 1, in: 1 });
      }
    }
  }
};
function a2Crown(x, y, t, a = 1) {
  ctx.globalAlpha = clamp(a, 0, 1); P(OLC, x - 10, y - 2, 20, 6); P('#8ab8d8', x - 9, y - 1, 18, 4);
  for (let i = 0; i < 5; i++) { const px = x - 8 + i * 4; pPoly(OLC, [[px - 2, y - 1], [px, y - 8 - (i === 2 ? 3 : 0)], [px + 2, y - 1]]); pPoly('#c8e8ff', [[px - 1, y - 1], [px, y - 6 - (i === 2 ? 3 : 0)], [px + 1, y - 1]]); }
  P('#ffffff', x - 7 + ((t * 6) | 0) % 14, y, 1, 1); ctx.globalAlpha = 1;
}

// ---------- COMFORT: breathe with the Bummer (true ending minigame) ----------
Scenes.comfort = {
  enter() {
    this.t = 0; this.period = 6; this.good = 0; this.need = 5; this.breath = 0; this.sync = 0; this.cyc = -1; this.cycSync = 0; this.cycN = 0; this.done = false; this.fb = '';
    Music.play('whale', 2); Amb.set('deep'); Post.letter = 1; SFX.play('whale');
    Later.add(.8, () => Dialog.start([D('Lucien', 'lucien', 'It\'s panicking. It\'s been chained up and grinned at for weeks.'), D('Sister Pell', 'priest', 'Breathe with it. HOLD when it breathes in. LET GO when it breathes out. Five good breaths.')], () => { this.go = true; }));
  },
  exit() { Post.letter = 0; },
  update(dt) {
    this.t += dt; if (!this.go || this.done) return;
    const ph = (this.t % this.period) / this.period, want = ph < .5, cyc = Math.floor(this.t / this.period);
    const held = Input.held(' ') || Input.mouse.down;
    this.breath = clamp(this.breath + (held ? dt : -dt) * 1.4, 0, 1);
    if (cyc !== this.cyc) {
      if (this.cyc >= 0 && this.cycN > 0) { const k = this.cycSync / this.cycN; if (k > .68) { this.good++; this.fb = ['Good.', 'Slow…', 'It\'s calming down.', 'Nearly…', 'There.'][Math.min(4, this.good - 1)]; SFX.play('breathe'); } else this.fb = 'Out of rhythm — try again.'; }
      this.cyc = cyc; this.cycSync = 0; this.cycN = 0;
      if (this.good >= this.need) { this.done = true; SFX.play('whale'); Later.add(2.5, () => Scenes.act2end.finishEnding('true')); }
    }
    this.cycN += dt; if (held === want) this.cycSync += dt;
    this.sync = lerp(this.sync, held === want ? 1 : 0, dt * 4);
    if (chance(dt * 4)) Particles.spawn({ x: rnd(330, 620), y: rnd(150, 300), vx: 0, vy: rnd(-12, -4), life: 3, c: '#a8d8ff', size: 1, drag: 1 });
  },
  draw() {
    const c = ctx, t = this.t, hd = Gfx.level >= 1, ph = (t % this.period) / this.period, wb = Math.sin(ph * TAU - Math.PI / 2) * -1; c.setTransform(1, 0, 0, 1, 0, 0);
    const calm = this.good / this.need; 
    drawSkyGradient(calm > .6 ? '#1a3a6a' : '#0a1428', calm > .6 ? '#6a9ad0' : '#1a2a4a'); drawStars(1 - calm * .6, 81, 180);
    if (hd) for (let i = 0; i < 6; i++) { c.globalAlpha = .06 + calm * .05; pEll('#c8e8ff', 320 + Math.sin(t * .2 + i) * 200, 80 + i * 40, 160, 6); } c.globalAlpha = 1;
    a2Sea(t * .5, 280, hd);
    drawMonster({ id: 'whale', arch: 'whale', scale: 2.2, look: {} }, 470, 296 + Math.sin(t * .5) * 2, { t, face: -1, breath: wb, tear: this.good < this.need });
    drawChar(170, 300, playerLook({ s: 1.4, face: 1, t, expr: 'tired' })); a2Crown(170, 236, t, 1);
    drawChar(110, 302, COMP_LOOK.lucien({ s: 1.1, face: 1, t })); drawCompanion('pell', 80, 304, { s: 1.05, t }); drawCompanion('honk', 214, 306, { s: .8, t });
    // breathing ring: guide (whale) vs you
    const gx = 320, gy = 140, gr = 18 + (wb * .5 + .5) * 30, yr = 18 + this.breath * 30;
    c.globalAlpha = .35; c.strokeStyle = '#a8d8ff'; c.lineWidth = 2; c.beginPath(); c.arc(gx, gy, gr, 0, TAU); c.stroke(); c.globalAlpha = .9; c.strokeStyle = this.sync > .6 ? '#c8ffd8' : '#ffc8a8'; c.lineWidth = 1; c.beginPath(); c.arc(gx, gy, yr, 0, TAU); c.stroke(); c.globalAlpha = 1;
    Particles.draw(false);
    Light.begin([110 + calm * 100, 130 + calm * 90, 190 + calm * 50]); Light.add(470, 260, 160, '#a8d0ff', .5); Light.add(170, 240, 60 + this.breath * 30, '#e8f4ff', .7, .4); Light.add(gx, gy, 70, '#c8e8ff', .3); Light.apply(); c.setTransform(1, 0, 0, 1, 0, 0);
  },
  ui() {
    if (!this.go) return; const ph = (this.t % this.period) / this.period;
    UI.text(this.done ? 'The Bummer is calm.' : ph < .5 ? 'BREATHE IN — hold' : 'BREATHE OUT — let go', 640, 470, { align: 'center', size: 22, col: COL.gold2, stroke: 2 });
    UI.text('Hold SPACE / mouse with the whale\'s breath', 640, 496, { align: 'center', size: 13, col: COL.dim, bold: false });
    for (let i = 0; i < this.need; i++) { g.fillStyle = i < this.good ? '#a8d8ff' : 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(560 + i * 40, 530, 10, 0, TAU); g.fill(); }
    if (this.fb) UI.text(this.fb, 640, 570, { align: 'center', size: 15, col: COL.cream, italic: true, bold: false });
    if (this.t > 60 && !this.done && UI.btn('Just hug it', 1080, 650, 170, 40, { style: 'ghost' })) { this.done = true; Scenes.act2end.finishEnding('true'); }
  }
};
