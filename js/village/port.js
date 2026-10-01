'use strict';
/* =========================================================
   PORT MOPEWAY — the Act II hub (HD 2.5D + LOW 2D)
   Party, perk training, gear, bounty board, fishing pier, shop,
   lore & achievements, the boat home and the road out.
   ========================================================= */
const PW = 640, PH = 420;
const PORT_SPOTS = [
  { id: 'map', x: 96, y: 352, r: 26, label: 'Set Out', sub: 'Act II map' },
  { id: 'boat', x: 70, y: 214, r: 30, label: 'The Boat Home', sub: 'Sail to Placenta Creek' },
  { id: 'lucien', x: 196, y: 300, r: 18, label: 'Lucien', sub: 'Former Demon Lord' },
  { id: 'pell', x: 246, y: 312, r: 16, label: 'Sister Pell', sub: 'Party' },
  { id: 'honk', x: 290, y: 322, r: 14, label: 'Sir Honkington', sub: 'A goose' },
  { id: 'board', x: 338, y: 216, r: 20, label: 'Bounty Board', sub: '12 bounties' },
  { id: 'shop', x: 440, y: 212, r: 26, label: 'Bev\'s Quartermastery', sub: 'Supplies & trinkets' },
  { id: 'dummy', x: 380, y: 330, r: 16, label: 'Training Dummy', sub: 'Perk tree' },
  { id: 'fisher', x: 566, y: 196, r: 22, label: 'Old Marnie', sub: 'Fishing pier' }
];
const PORT_SHOP = [['drumstick', 8], ['mid', 20], ['high', 32], ['antidote', 8], ['tonic', 16], ['smoke', 18]];
function portGround() {
  return Cache.get('port_ground', PW, PH, (c, w, h) => {
    const R = RNG(808);
    for (let y = 0; y < 190; y++) { P(mix('#2a6aa0', '#1a4a7a', y / 190), 0, y, w, 1); if (y % 2 === 0) for (let x = 0; x < w; x += 3) if (R() < .08) P('#6aa8d8', x, y, R.i(2, 6), 1); }
    for (let x = 0; x < w; x += 2) { const f = Math.sin(x * .05) * 2; P('#e8f8ff', x, 188 + f, 2, 2); }
    tdGroundFill(PAL.beach, 0, 192, w, 40, R, .8, 5);
    // boardwalk
    P(OLC, 0, 228, w, h - 228); for (let y = 230; y < h; y += 8) { for (let x = (y / 8 % 2) * 20; x < w; x += 40) { P(R.pick(['#a87a4a', '#9a6e42', '#b8885a']), x, y, 38, 7); P('#c89a68', x, y, 38, 1); P('#6a4a2a', x + 37, y, 1, 7); } }
    for (let i = 0; i < 40; i++) P('#5a3a20', R.r(0, w), R.r(232, h), 1, 1);
    // pier into the sea (east) + boat dock (west)
    P(OLC, 520, 150, 80, 82); for (let y = 152; y < 230; y += 6) { P('#a87a4a', 522, y, 76, 5); P('#c89a68', 522, y, 76, 1); } for (const x of [520, 596]) for (let y = 150; y < 230; y += 26) P('#5a3a20', x, y, 4, 8);
    P(OLC, 30, 200, 70, 30); for (let x = 32; x < 98; x += 6) { P('#a87a4a', x, 202, 5, 26); P('#c89a68', x, 202, 1, 26); }
    // rope coils, nets
    pEll('#c8a870', 470, 300, 8, 4); pEll('#8a6a40', 470, 300, 4, 2); for (let i = 0; i < 6; i++) pLine('#c8b898', 120 + i * 6, 240, 150 + i * 4, 270, 1);
  });
}
function portArt() {
  if (portArt.v) return portArt.v;
  const shop = tdBuilding('port_shop', { w: 92, wallH: 34, roofH: 30, roof: 'tile', roofCol: '#3a6a8a', wall: 'wood', windows: [[10, 10, 14, 10], [66, 10, 14, 10]], door: [36, 14, 22, '#5a3a24'], seed: 31 });
  const tav = tdBuilding('port_tav', { w: 110, wallH: 38, roofH: 36, roof: 'thatch', roofCol: '#8a7a5a', wall: 'timber', beams: [55], windows: [[12, 12, 14, 10], [82, 12, 14, 10]], door: [44, 14, 22, '#5a3a24'], chimney: [80, 14], seed: 7 });
  const board = { c: Cache.get('port_board', 40, 46, () => { P(OLC, 4, 14, 3, 32); P(OLC, 33, 14, 3, 32); P('#6a4a2a', 5, 14, 1, 32); P('#6a4a2a', 34, 14, 1, 32); P(OLC, 0, 2, 40, 28); P('#8a6040', 1, 3, 38, 26); for (let i = 0; i < 6; i++) { const x = 3 + (i % 3) * 12, y = 5 + Math.floor(i / 3) * 12; P('#f0e4c8', x, y, 10, 10); P('#3a2010', x + 2, y + 2, 6, 1); P('#3a2010', x + 2, y + 4, 4, 1); P(i === 2 ? '#c83a4a' : '#8a6a4a', x + 2, y + 6, 6, 2); } }), bx: 20, by: 45 };
  const sign = { c: Cache.get('port_sign', 34, 40, () => { P(OLC, 15, 8, 4, 32); P('#8a5a34', 16, 8, 2, 32); pPoly(OLC, [[0, 4], [28, 4], [34, 10], [28, 16], [0, 16]]); pPoly('#c89a68', [[1, 5], [27, 5], [32, 10], [27, 15], [1, 15]]); PFont.draw(ctx, 'ACT II', 14, 13, 7, '#3a2010', 'center', 'alphabetic', null); }), bx: 17, by: 39 };
  const dummy = { c: Cache.get('port_dummy', 24, 40, () => { P(OLC, 10, 14, 4, 26); P('#8a5a34', 11, 14, 2, 26); P(OLC, 2, 16, 20, 4); P('#8a5a34', 3, 17, 18, 2); pEll(OLC, 12, 22, 8, 9); pEll('#d8b878', 12, 22, 7, 8); pCirc(OLC, 12, 8, 6); pCirc('#d8b878', 12, 8, 5); P('#c83a4a', 9, 6, 6, 1); P('#c83a4a', 11, 4, 2, 5); P('#3a2010', 8, 20, 8, 1); }), bx: 12, by: 39 };
  const crate = { c: Cache.get('port_crate', 22, 20, () => { P(OLC, 1, 2, 20, 18); P('#a87a4a', 2, 3, 18, 16); P('#c89a68', 2, 3, 18, 2); pLine('#7a5a34', 3, 4, 19, 18, 1); }), bx: 11, by: 19 };
  const lamp = { c: Cache.get('port_lamp', 12, 44, () => { P(OLC, 5, 8, 3, 36); P('#3a3a48', 5, 8, 1, 36); P(OLC, 1, 0, 10, 10); P('#ffd870', 2, 1, 8, 8); P('#fff4c0', 4, 3, 3, 3); }), bx: 6, by: 43 };
  return (portArt.v = { shop: { c: shop.c, bx: shop.c.width / 2, by: shop.oy + 1 }, tav: { c: tav.c, bx: tav.c.width / 2, by: tav.oy + 1 }, board, sign, dummy, crate, lamp });
}
Scenes.port = { hd: true, timeRuns: true,
  enter(a) {
    this.t = 0; this.sel = null; this.hov = null; Music.resetLayers(); Music.play('port', 1.2); Amb.set('port'); portGround(); portArt();
    Cam.reset(320, 250); Cam.follow = 3; Cam.tx = 320; Cam.ty = 250;
    if (S.act < 2) Act.begin2(); S.hub = 'port';
    if (a.revive) { S.hp = Math.max(S.hp, Math.ceil(Stats.maxHP() / 2)); Later.add(.8, () => Dialog.start([D('Sister Pell', 'priest', 'Oh! You\'re awake. You were face-down in a rock pool. I did bandages. Lots of bandages.'), D('Lucien', 'lucien', 'She charged you nothing. I tried to charge you something. She stopped me.')])); }
    else if (a.from === 'sail') Later.add(.6, () => Banner.show('PORT MOPEWAY', 'Act II · The Bummer Below', COL.gold2, 2.4));
    if (!S.talk.port1) { S.talk.port1 = 1; Later.add(1.4, () => Dialog.start([D('Lucien', 'lucien', 'Welcome to Port Mopeway. Everyone here is sad. It\'s the only honest town left.'), D('Sister Pell', 'priest', 'Talk to us if you want to change who helps in fights. The board has bounties, Bev sells things, Marnie fishes.'), D('Sir Honkington', 'monster', 'HONK.'), D('Lucien', 'lucien', 'The signpost leads out to the coast. Grinhaven is at the far end. That\'s where they took the Bummer.')])); }
    Save.save(true);
  },
  spots() { return PORT_SPOTS; },
  pick() {
    let best = null, bd = 1e9; const lift = HD.live ? 14 : 8;
    for (const s of PORT_SPOTS) { const [sx, sy] = Cam.toScreen(s.x, s.y); const d = Math.hypot(sx - Input.mouse.lx, sy - lift - Input.mouse.ly); if (d < s.r && d < bd) { bd = d; best = s; } }
    return best;
  },
  update(dt) {
    this.t += dt; Cam.tx = 320 + (Input.mouse.lx - 320) * .04; Cam.ty = 250;
    this.hov = Overlays.stack.length || Dialog.open ? null : this.pick();
    if (this.hov && Input.mouse.clicked && UI.active === 'scene' && Input.mouse.y > 70) this.use(this.hov.id);
    if (chance(dt * .5)) Particles.spawn({ x: rnd(0, 640), y: rnd(150, 186), vx: rnd(-4, 4), vy: 0, life: 1.4, c: '#ffffff', size: 1 });
  },
  use(id) {
    SFX.play('click');
    const T2 = (arr, done, v = 'monster') => Dialog.start(arr.map(([n, t]) => D(n, n === 'Lucien' ? 'lucien' : n === 'Sister Pell' ? 'priest' : n === '' ? 'narrator' : v, t)), done);
    if (id === 'map') { Scene.go('overworld2', {}, { type: 'iris', out: .6, in: .6 }); return; }
    if (id === 'boat') { Act.sail(1); return; }
    if (id === 'lucien') { T2(S.shards.length >= 5 && !S.crown ? [['Lucien', 'Five shards. You actually did it.'], ['Lucien', 'Take them to Grinwell\'s cathedral. When the moment comes, you\'ll know what to make.']] : PORT_TALK.lucien, () => openParty()); return; }
    if (id === 'pell' || id === 'honk') { T2(PORT_TALK[id], () => openParty()); return; }
    if (id === 'board') { openBounties(); return; }
    if (id === 'dummy') { openPerks(); return; }
    if (id === 'shop') { openPortShop(); return; }
    if (id === 'fisher') { if (!S.talk.marnie) { S.talk.marnie = 1; T2(PORT_TALK.fisher, () => openFishing()); } else openFishing(); return; }
  },
  draw() {
    const t = this.t, A = portArt(), nk = World.nightK(), hd = HD.live;
    const figs = [
      [196, 300, () => { drawChar(196, 300 - 6, COMP_LOOK.lucien({ s: 1.1, t, sit: true, face: 1, talking: Dialog.speaker === 'Lucien' })); }],
      [246, 312, () => drawCompanion('pell', 246, 312, { s: 1.1, t, talking: Dialog.speaker === 'Sister Pell' })],
      [290, 322, () => drawCompanion('honk', 290, 322, { s: 1.1, t: t, face: -1 })],
      [440, 214, () => drawChar(452, 214, { s: 1, t, face: -1, seed: 3, skin: '#c8885a', hair: '#2a1c18', hairStyle: 'bun', apron: '#e8e0d0', top: '#3a6a8a', pants: '#3a3a4a', boots: '#3a2a20', weapon: 'none', expr: 'happy', body: 'round' })],
      [566, 196, () => drawChar(566, 196, { s: 1, t, face: 1, seed: 5, skin: '#e8b090', hair: '#e8e8e8', hairStyle: 'bun', hat: 'straw', top: '#c8a040', pants: '#4a4a3a', boots: '#3a2a20', weapon: 'none', expr: 'tired', sit: true })],
      [580, 196, () => { pLine('#6a4a2a', 576, 176, 610, 150, 1); pLine('#e8e8e8', 610, 150, 612, 188 + Math.sin(t * 2) * 1.5, 1); pCirc('#e04040', 612, 189 + Math.sin(t * 2) * 1.5, 1.5); }],
      [160, 316, () => drawChar(160, 316, playerLook({ s: 1.1, face: 1, t }))]
    ];
    const statics = [[A.tav, 230, 206], [A.shop, 440, 206], [A.board, 338, 222], [A.sign, 96, 354], [A.dummy, 380, 334], [A.crate, 186, 306], [A.crate, 500, 300], [A.lamp, 150, 240], [A.lamp, 500, 238], [m2Boat(1), 70, 220]];
    if (hd) {
      HD.begin({ water: HD.waterMask('port', [-200, -300, PW + 400, PH + 300], (x, y) => y < 186 && !(x > 518 && x < 602 && y > 148) && !(x > 28 && x < 102 && y > 198), [.2, .4, .6]), pitch: 30, fov: 36, zs: 'auto', tx: Cam.x, ty: Cam.y - 20, zoom: 1.12, maxBack: 400, clear: [.2, .4, .6], fog: [600, 1200, .3], fogC: nk > .5 ? [.1, .12, .26] : [.75, .85, .95], cloud: .18, dof: [.16, .2, .92, .9], bloom: [.66, .45], vig: .45, shafts: sunShafts({ base: .5, y: -70 }), motes: { n: 60, rise: 2.4 } });
      HD.ground(m2SeaTile(), -800, -900, { w: PW + 1600, h: 900, rep: true }); HD.ground(portGround(), 0, 0);
      HD.layer('decal'); for (let i = 0; i < 30; i++) { const x = (i * 53 + t * 6) % 640, y = 20 + (i * 37) % 160; if (Math.sin(t * 2 + i) > .4) P('#c8e8ff', x, y, 4, 1); } if (this.hov) { ctx.globalAlpha = .5 + Math.sin(t * 6) * .2; ctx.strokeStyle = '#fff4c0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(this.hov.x, this.hov.y, this.hov.r * .7, this.hov.r * .35, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; } HD.groundLayer('decal');
      const L = []; for (const [a, x, y] of statics) L.push([y, () => HD.art(a.c, x - a.bx, y - a.by + (a === statics[9][0] ? Math.sin(t * 1.4) : 0), y)]);
      for (const [x, y, fn] of figs) L.push([y + .5, () => HD.capture(y + 2, fn, null, 0, [x - 40, y - 60, 80, 66], HI_CHAR)]);
      for (let k = 0; k < 4; k++) { const cl = owCloud(k), cx = ((k * 211 + t * 6) % 900) - 150; L.push([-40, () => HD.art(cl.c, cx - cl.bx, -60, -20, { alpha: .7, unlit: true, scale: 1.4 })]); }
      L.sort((a, b) => a[0] - b[0]); for (const [, f] of L) f();
      HD.layer('top'); Particles.draw(false); HD.groundLayer('top');
      Light.begin(mixA(World.ambient(), [255, 250, 240], .35)); Light.add(150, 200, 70, '#ffd070', .3 + nk * .7, .2); Light.add(500, 200, 70, '#ffd070', .3 + nk * .7, .2); Light.add(230, 200, 90, '#ffb060', nk * .7, .1); Light.apply();
      HD.screenLayer(); if (World.rain > .05) Weather.draw(400, World.rain * .6); return;
    }
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); P('#1a4a7a', 0, 0, 640, 360); Cam.apply(c, 1); c.drawImage(portGround(), 0, 0);
    for (let i = 0; i < 30; i++) { const x = (i * 53 + t * 6) % 640, y = 20 + (i * 37) % 160; if (Math.sin(t * 2 + i) > .4) P('#c8e8ff', x, y, 4, 1); }
    if (this.hov) { c.globalAlpha = .5; c.strokeStyle = '#fff4c0'; c.beginPath(); c.ellipse(this.hov.x, this.hov.y, this.hov.r * .7, this.hov.r * .35, 0, 0, TAU); c.stroke(); c.globalAlpha = 1; }
    const L = []; for (const [a, x, y] of statics) L.push([y, () => c.drawImage(a.c, Math.round(x - a.bx), Math.round(y - a.by))]); for (const [x, y, fn] of figs) L.push([y + .5, fn]);
    L.sort((a, b) => a[0] - b[0]); for (const [, f] of L) f(); Particles.draw(false);
    Light.begin(mixA(World.ambient(), [255, 250, 240], .35)); Light.add(150, 200, 70, '#ffd070', .3 + nk * .7, .2); Light.add(500, 200, 70, '#ffd070', .3 + nk * .7, .2); Light.apply(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (World.rain > .05) Weather.draw(400, World.rain * .6);
  },
  ui() {
    HUD.draw({ buttons: [['MAP', () => this.use('map'), 'Set out', 56], ['SAIL', () => this.use('boat'), 'Sail home', 56], ['★', () => openAchievements(), 'Achievements'], ['❧', () => openLore(), 'Lore'], ['GEAR', () => openGear(), 'Gear', 56]] });
    UI.panel(14, 600, 560, 106); UI.text('PORT MOPEWAY', 32, 630, { size: 18, col: COL.gold2 }); UI.text(`Sigh Shards ${S.shards.length}/5 · Perk points ${S.pp} · Lore ${S.lore.length}/${LORE_PAGES.length} · ★ ${Ach.count()}`, 32, 654, { size: 13, col: COL.cream, bold: false, maxW: 530 });
    UI.text(`Assist: ${Party.active() ? COMPANIONS[Party.active()].name + ' — ' + COMPANIONS[Party.active()].move : '—'}`, 32, 676, { size: 13, col: COL.dim, bold: false, maxW: 530 });
    UI.text('Tap people and places. The signpost leads out to the Act II map.', 32, 696, { size: 12, col: COL.dim, bold: false });
    if (this.hov) { UI.cursor = 'pointer'; const [sx, sy] = Cam.toScreen(this.hov.x, this.hov.y), lab = this.hov.label; UI.pill(lab, sx * 2 - UI.measure(lab, 12) / 2 - 9, sy * 2 - 110, COL.gold2); }
  }
};
function openPortShop() {
  SFX.play('page'); const ov = Overlays.push({ name: 'pshop', draw() {
    const P0 = a2Panel('BEV\'S QUARTERMASTERY', 760, 560); UI.text(`Coins: ${S.coins}`, 640, P0.y + 76, { align: 'center', size: 16, col: COL.gold2 });
    PORT_SHOP.forEach(([id, pr], i) => { const it = ITEMS[id], y = P0.y + 100 + i * 50; if (UI.btn(`${it.name} ×${S.inv[id] || 0}  —  ${it.desc}`, P0.x + 40, y, P0.w - 220, 42, { align: 'left', size: 13, id: 'ps' + id, disabled: S.coins < pr })) { addCoins(-pr); addItem(id); SFX.play('coin'); } UI.text(`${pr} c`, P0.x + P0.w - 60, y + 27, { size: 15, col: COL.gold2, align: 'right' }); });
    const y = P0.y + 100 + PORT_SHOP.length * 50 + 6; if (UI.btn('Mystery Trinket Crate  —  a random trinket (rarity varies)', P0.x + 40, y, P0.w - 220, 42, { align: 'left', size: 13, accent: true, disabled: S.coins < 140, id: 'pscrate' })) { addCoins(-140); Prog.giveTrinket(Prog.rollTrinket(0)); SFX.play('coin'); Save.save(true); } UI.text('140 c', P0.x + P0.w - 60, y + 27, { size: 15, col: COL.gold2, align: 'right' });
    if (UI.btn('Close', 580, P0.y + P0.h - 52, 120, 38, { key: 'Escape' })) { Save.save(true); Overlays.pop(ov); } } });
}
/* ---------------- fishing (timing minigame, 20 fish) ---------------- */
function openFishing() {
  SFX.play('splash'); const F = { st: 'wait', t: 0, bite: rnd(1.2, 3.2), pos: 0, dir: 1, hits: 0, need: 3, fish: null, msg: 'Waiting for a bite… (tap / SPACE when the bob dips)' };
  const roll = () => { const r = Math.random(), tier = r < .5 ? 0 : r < .8 ? 1 : r < .96 ? 2 : 3, pool = FISH.filter(f => f[1] === tier); return pick(pool); };
  const ov = Overlays.push({ name: 'fish', update(dt) { F.t += dt;
      if (F.st === 'wait' && F.t > F.bite) { F.st = 'bite'; F.t = 0; F.fish = roll(); SFX.play('splash'); F.msg = 'BITE! Tap now!'; }
      else if (F.st === 'bite' && F.t > .7) { F.st = 'lost'; F.t = 0; F.msg = 'Too slow. The fish sighs and swims off.'; }
      else if (F.st === 'reel') { const sp = 1.1 + F.fish[1] * .45; F.pos += F.dir * dt * sp; if (F.pos > 1) { F.pos = 1; F.dir = -1; } if (F.pos < 0) { F.pos = 0; F.dir = 1; } }
      const press = Input.hit(' ', 'Enter') || (Input.mouse.clicked && Input.mouse.y < 560 && UI.active === 'fish');
      if (press) { if (F.st === 'bite') { F.st = 'reel'; F.t = 0; F.msg = 'Reel it in! Stop the marker in the gold zone ×3'; SFX.play('reel'); }
        else if (F.st === 'reel') { const zw = .22 - F.fish[1] * .04; if (Math.abs(F.pos - .5) < zw / 2) { F.hits++; SFX.play('perfect'); if (F.hits >= F.need) { F.st = 'caught'; const nm = F.fish[0], first = !S.fish[nm]; S.fish[nm] = (S.fish[nm] || 0) + 1; S.fishN = (S.fishN || 0) + 1; addCoins(F.fish[2]); F.msg = `Caught: ${nm}! +${F.fish[2]} coins${first ? ' · NEW!' : ''}`; Music.sting('quest'); Ach.unlock('fish1'); if (Object.keys(S.fish).length >= 10) Ach.unlock('fish10'); if (F.fish[1] === 3 && nm.startsWith('Old')) Ach.unlock('legend'); if (F.fish[1] >= 2 && chance(.25)) Prog.giveTrinket(Prog.rollTrinket(1)); Save.save(true); } } else { F.hits = Math.max(0, F.hits - 1); SFX.play('miss'); } }
        else if (F.st === 'lost' || F.st === 'caught') { F.st = 'wait'; F.t = 0; F.bite = rnd(1.2, 3.2); F.hits = 0; F.msg = 'Waiting for a bite…'; SFX.play('splash'); } } },
    draw() { const P0 = a2Panel('FISHING · THE END OF THE PIER', 760, 520), cx = 640, cy = P0.y + 200;
      g.fillStyle = '#1e4a7a'; g.fillRect(P0.x + 40, P0.y + 90, P0.w - 80, 190); g.fillStyle = '#2a6aa0'; for (let i = 0; i < 12; i++) g.fillRect(P0.x + 50 + ((i * 61 + T * 20) % (P0.w - 120)), P0.y + 110 + (i * 23) % 150, 30, 2);
      const dip = F.st === 'bite' ? 10 + Math.sin(T * 40) * 4 : Math.sin(T * 2) * 3; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy + dip, 8, 0, TAU); g.fill(); g.fillStyle = '#e04040'; g.beginPath(); g.arc(cx, cy + dip - 3, 8, Math.PI, TAU); g.fill();
      if (F.st === 'reel' || F.st === 'caught') { const bx = P0.x + 100, bw = P0.w - 200, by = P0.y + 300, zw = (.22 - F.fish[1] * .04) * bw; g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(bx, by, bw, 24); g.fillStyle = COL.gold2; g.fillRect(bx + bw / 2 - zw / 2, by, zw, 24); g.fillStyle = '#fff'; g.fillRect(bx + F.pos * bw - 3, by - 6, 6, 36); for (let i = 0; i < F.need; i++) { g.fillStyle = i < F.hits ? COL.green : 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(640 - 30 + i * 30, by + 50, 8, 0, TAU); g.fill(); } }
      UI.text(F.msg, 640, P0.y + 420, { align: 'center', size: 17, col: F.st === 'caught' ? COL.green : F.st === 'bite' ? COL.gold2 : COL.cream, maxW: 700 });
      UI.text(`Fish log: ${Object.keys(S.fish).length}/${FISH.length} species · ${S.fishN || 0} caught`, 640, P0.y + 448, { align: 'center', size: 13, col: COL.dim, bold: false });
      if (UI.btn('Close', 580, P0.y + P0.h - 52, 120, 38, { key: 'Escape' })) Overlays.pop(ov); } });
}
