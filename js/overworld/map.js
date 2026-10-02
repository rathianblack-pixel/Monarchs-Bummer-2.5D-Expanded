'use strict';
/* =========================================================
   OVERWORLD MAP
   ========================================================= */
const MW = 1400, MH = 900;
const MAP_NODES = [[150, 780],
  [260, 760], [350, 720], [320, 650], [420, 620], [520, 660],
  [640, 690], [740, 650], [820, 700], [920, 660], [1000, 600],
  [1080, 540], [1180, 520], [1240, 450], [1160, 400], [1220, 330],
  [1120, 280], [1020, 300], [940, 250], [860, 290], [780, 230],
  [680, 200], [580, 230], [500, 180], [420, 210], [330, 140]];
const REGION_C = [[380, 700], [820, 660], [1180, 440], [960, 270], [480, 180]];
const REGION_GROUND = ['#7aa850', '#3e7a44', '#5e6e62', '#6f8058', '#3a2c38'];
const nodeArea = i => i === 0 ? -1 : Math.floor((i - 1) / 5), nodeLvl = i => i === 0 ? -1 : (i - 1) % 5;
const riverX = y => 585 + Math.sin(y / 110) * 46 + Math.sin(y / 37) * 8;
// segments between consecutive nodes (quadratic curves)
const MAP_SEGS = [];
for (let i = 0; i < MAP_NODES.length - 1; i++) {
  const [x0, y0] = MAP_NODES[i], [x1, y1] = MAP_NODES[i + 1]; const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, off = (i % 2 ? 1 : -1) * l * .22;
  const cx = mx - dy / l * off, cy = my + dx / l * off; const pts = []; let len = 0;
  for (let k = 0; k <= 24; k++) { const t = k / 24, p = [bez(x0, cx, x1, t), bez(y0, cy, y1, t)]; if (k) len += Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]); p.push(len); pts.push(p); }
  MAP_SEGS.push({ pts, len });
}
const MAP_PATH_PTS = MAP_SEGS.flatMap(s => s.pts);
function segPoint(i, t) { const s = MAP_SEGS[i], d = t * s.len; let k = 1; while (k < s.pts.length - 1 && s.pts[k][2] < d) k++; const a = s.pts[k - 1], b = s.pts[k], f = (d - a[2]) / Math.max(.001, b[2] - a[2]); return [lerp(a[0], b[0], clamp(f, 0, 1)), lerp(a[1], b[1], clamp(f, 0, 1))]; }
function nearPath(x, y, r) { for (const p of MAP_PATH_PTS) if (Math.abs(p[0] - x) < r && Math.abs(p[1] - y) < r) return true; for (const n of MAP_NODES) if (Math.hypot(n[0] - x, n[1] - y) < r + 10) return true; return false; }
function regionAt(x, y) { let best = 0, bd = 1e9; REGION_C.forEach((c, i) => { const d = Math.hypot(c[0] - x, (c[1] - y) * 1.25) + noise1(x * .02 + y * .013 + i * 9) * 40; if (d < bd) { bd = d; best = i; } }); return best; }
function mapTree(x, y, r, kind) {
  if (kind === 'pine') { P('#1a2a1e', x - 1, y - 2, 3, 4); for (let k = 0; k < 3; k++) pPoly(k === 2 ? '#3a6a4a' : '#24493a', [[x - 7 + k * 1.5, y - 2 - k * 5], [x + 7 - k * 1.5, y - 2 - k * 5], [x, y - 11 - k * 5]]); P('#5a8a5a', x - 1, y - 16, 1, 3); return; }
  if (kind === 'dead') { pLine('#3a3030', x, y, x, y - 12, 2); pLine('#3a3030', x, y - 8, x - 5, y - 13, 1); pLine('#3a3030', x, y - 10, x + 4, y - 15, 1); return; }
  P('#4a3020', x - 1, y - 4, 2, 5); pEll('#2e5a2a', x, y - 8, r + 1, r); pEll(kind === 'dark' ? '#2e5e38' : '#4a8a3a', x - 1, y - 9, r, r - 1); pEll(kind === 'dark' ? '#447a4a' : '#6aaa4a', x - 2, y - 11, r * .5, r * .4);
}
function buildMap(c, w, h) {
  // terrain
  const cell = 4;
  for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) { const r = regionAt(x, y), n = noise1(x * .05 + y * .031) * .08 + noise1(x * .21 + y * .17) * .04; P(shade(REGION_GROUND[r], n), x, y, cell, cell); }
  const R = RNG(4242);
  // fields near the village
  for (let i = 0; i < 16; i++) { const fx = R.r(40, 520), fy = R.r(640, 880), fw = R.r(30, 60), fh = R.r(18, 34); if (regionAt(fx, fy) !== 0 || nearPath(fx + fw / 2, fy + fh / 2, 30)) continue; const col = R.pick(['#b8a050', '#8aaa40', '#a07a40', '#c8b060']); P(shade(col, -.2), fx - 1, fy - 1, fw + 2, fh + 2); P(col, fx, fy, fw, fh); for (let k = 2; k < fh; k += 4) P(shade(col, -.12), fx, fy + k, fw, 1); }
  // river
  for (let y = 0; y < h; y += 2) { const x = riverX(y), wd = 9 + Math.sin(y / 60) * 2; P('#2a5a7a', x - wd - 2, y, wd * 2 + 4, 2); P('#3a7aa8', x - wd, y, wd * 2, 2); if (y % 14 === 0) P('#8ac8e8', x - wd / 2 + Math.sin(y) * 3, y, 4, 1); }
  // mountains in the north-west (fortress)
  for (let i = 0; i < 22; i++) { const mx = R.r(160, 760), my = R.r(40, 150), mh = R.r(30, 60); if (nearPath(mx, my, 26)) continue; pPoly('#1e1620', [[mx - mh * .8, my + 8], [mx, my - mh], [mx + mh * .8, my + 8]]); pPoly('#3a2a3a', [[mx - mh * .6, my + 6], [mx, my - mh + 3], [mx + 2, my + 6]]); pPoly('#5a4a58', [[mx - 5, my - mh + 10], [mx, my - mh + 2], [mx + 4, my - mh + 9]]); }
  // lava cracks
  for (let i = 0; i < 26; i++) { let x = R.r(200, 760), y = R.r(120, 280); if (regionAt(x, y) !== 4) continue; for (let k = 0; k < 6; k++) { const nx = x + R.r(-7, 7), ny = y + R.r(2, 6); pLine('#c04020', x, y, nx, ny, 1); x = nx; y = ny; } }
  // decorations by region
  for (let i = 0; i < 1500; i++) {
    const x = R.r(10, w - 10), y = R.r(20, h - 10); if (nearPath(x, y, 14) || Math.abs(riverX(y) - x) < 16) continue; const r = regionAt(x, y);
    if (r === 0) { if (R() < .5) mapTree(x, y, R.r(4, 6), 'round'); else grassTuft(x, y, '#5a8a3a', 0, 3, R); }
    else if (r === 1) { if (R() < .8) mapTree(x, y, R.r(4, 7), R() < .55 ? 'pine' : 'dark'); else { P('#d84a3a', x, y - 2, 3, 2); P('#e8e0d0', x + 1, y, 1, 2); } }
    else if (r === 2) { const q = R(); if (q < .35) { P('#2a2a30', x - 3, y - 7, 7, 8); P('#8a8a90', x - 2, y - 7, 5, 7); P('#5a5a60', x - 1, y - 5, 3, 1); } else if (q < .5) { P('#6a6a70', x, y - 8, 2, 8); P('#6a6a70', x - 2, y - 6, 6, 2); } else if (q < .75) mapTree(x, y, 0, 'dead'); else grassTuft(x, y, '#4a5a4a', 0, 3, R); }
    else if (r === 3) { if (R() < .45) { const horiz = R() < .5, len = R.r(10, 26); P('#3a4030', x, y, horiz ? len : 5, horiz ? 5 : len); P('#8a9068', x, y - 2, horiz ? len : 5, horiz ? 3 : len - 2); if (R() < .3) P('#70d0e0', x + 1, y - 1, 1, 1); } else mapTree(x, y, R.r(3, 5), 'round'); }
    else { if (R() < .3) mapTree(x, y, 0, 'dead'); else if (R() < .5) { P('#1a1018', x - 3, y - 3, 7, 4); P('#4a3a48', x - 2, y - 4, 5, 3); } }
  }
  // road
  for (const p of MAP_PATH_PTS) pCirc('#5a4028', p[0], p[1] + 1, 4);
  for (const p of MAP_PATH_PTS) pCirc('#b89868', p[0], p[1], 3);
  for (let i = 0; i < MAP_PATH_PTS.length; i += 2) { const p = MAP_PATH_PTS[i]; P('#d8c090', p[0], p[1] - 1, 1, 1); if (Math.abs(riverX(p[1]) - p[0]) < 13) { P('#3a2414', p[0] - 5, p[1] - 3, 10, 7); P('#8a5a30', p[0] - 4, p[1] - 3, 8, 5); P('#6a4020', p[0] - 4, p[1], 8, 1); } }
  // village
  const [vx, vy] = MAP_NODES[0];
  for (let i = 0; i < 7; i++) { const hx = vx - 50 + (i % 4) * 26 + (i > 3 ? 12 : 0), hy = vy - 26 + (i > 3 ? 30 : 0); P('#3a2418', hx - 1, hy - 1, 16, 12); P('#c8b088', hx, hy, 14, 10); pPoly('#8a3a2a', [[hx - 3, hy + 1], [hx + 7, hy - 8], [hx + 17, hy + 1]]); P('#4a2a18', hx + 5, hy + 4, 4, 6); P('#f0c060', hx + 10, hy + 3, 2, 2); }
  P('#3a3040', vx + 50, vy - 50, 14, 40); P('#a8a0a8', vx + 51, vy - 49, 12, 38); pPoly('#5a4a6a', [[vx + 49, vy - 49], [vx + 57, vy - 70], [vx + 65, vy - 49]]); P('#e0c050', vx + 56, vy - 78, 1, 8); P('#e0c050', vx + 54, vy - 75, 5, 1);
  // fortress (Lucien)
  const [fx, fy] = MAP_NODES[25];
  P('#0e080e', fx - 46, fy - 34, 92, 40); P('#2a1e2a', fx - 44, fy - 32, 88, 36);
  [[-44, 60], [-18, 80], [10, 92], [36, 66]].forEach(([ox, th]) => { P('#0e080e', fx + ox - 1, fy - th, 14, th - 30); P('#3a2a3a', fx + ox, fy - th + 1, 12, th - 32); pPoly('#1a0e1a', [[fx + ox - 3, fy - th + 2], [fx + ox + 6, fy - th - 16], [fx + ox + 15, fy - th + 2]]); P('#a060e0', fx + ox + 4, fy - th + 10, 3, 4); });
  P('#0a060a', fx - 8, fy - 14, 16, 20); pEll('#0a060a', fx, fy - 14, 8, 7);
  // parchment edge
  c.globalAlpha = .5; for (let i = 0; i < 40; i++) { P('#2a1a10', 0, 0, w, 1 + i % 3); } c.globalAlpha = 1;
  const gr = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .45, w / 2, h / 2, Math.max(w, h) * .75); gr.addColorStop(0, 'rgba(40,24,10,0)'); gr.addColorStop(1, 'rgba(40,24,10,.55)'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  // region labels painted into the map
  AREAS.forEach((A, i) => { if (i > 4) return; const [x, y] = REGION_C[i]; PFont.draw(c, A.name.toUpperCase(), x, y + 46, 12, 'rgba(250,236,200,.9)', 'center', 'alphabetic', 'rgba(20,12,8,.6)'); });
}
function buildFog(a) {
  return Cache.get('fog' + a, MW, MH, (c, w, h) => {
    const R = RNG(900 + a);
    for (let y = 0; y < h; y += 6) for (let x = 0; x < w; x += 6) { if (regionAt(x, y) !== a) continue; const n = noise1(x * .03 + y * .02 + a * 7); P(n > .3 ? '#d8d4dc' : n > -.2 ? '#bab4c4' : '#9a94a8', x - 3, y - 3, 12, 12); }
    for (let i = 0; i < 90; i++) { const x = REGION_C[a][0] + R.r(-220, 220), y = REGION_C[a][1] + R.r(-130, 130); if (regionAt(x, y) !== a) continue; pEll('#e8e4ec', x, y, R.r(14, 30), R.r(6, 12)); }
  });
}
function drawFrog(x, y, t, talking, s = 1) {
  const L = (c, a, b, w, h) => P(c, x + a * s, y + b * s, w * s, h * s), E = (c, a, b, rx, ry) => pEll(c, x + a * s, y + b * s, rx * s, ry * s);
  ctx.globalAlpha = .3; E('#000', 0, 1, 14, 3); ctx.globalAlpha = 1;
  E('#3a2a1a', 0, -3, 13, 5); E('#6a4a2a', 0, -5, 12, 4); E('#5a8a3a', -4, -8, 6, 2);
  const br = Math.sin(t * 2) * .5, puff = talking ? Math.abs(Math.sin(t * 14)) * 2 : Math.max(0, Math.sin(t * 1.3)) * 1.5;
  E('#1a2a10', 0, -14 + br, 11, 8); E('#5aa040', 0, -14 + br, 10, 7); E('#7ac860', -2, -16 + br, 6, 3); E('#e8e0a0', 1, -10 + br, 6 + puff, 3 + puff * .6);
  [-5, 5].forEach(ex => { E('#1a2a10', ex, -21 + br, 4, 4); E('#f0f0d0', ex, -21 + br, 3, 3); L('#1a1418', ex - (ex < 0 ? 1 : 0), -22 + br, 2, Math.sin(t * .7 + ex) > .96 ? 1 : 2); });
  L('#2a4a18', -3, -13 + br, 6, 1); if (talking) L('#8a2a2a', -2, -12 + br, 4, 1 + Math.round(Math.abs(Math.sin(t * 14))));
  L('#4a8a30', -10, -9, 4, 3); L('#4a8a30', 6, -9, 4, 3);
  // tiny prophetic hat
  pPoly('#3a2a6a', [[x - 5 * s, y + (-24 + br) * s], [x + 5 * s, y + (-24 + br) * s], [x + 1 * s, y + (-36 + br) * s]]); L('#e0c050', -1, -30 + br, 1, 1); L('#e0c050', 1, -27 + br, 1, 1);
}
Scenes.overworld = {
  timeRuns: true,
  enter(a) {
    this.t = 0; Music.resetLayers(); Music.play('overworld', 1.4); Amb.set('overworld'); this.map = Cache.get('worldmap', MW, MH, buildMap);
    for (let i = 0; i < 5; i++) buildFog(i);
    this.node = a.node !== undefined ? a.node : (a.from === 'village' ? 0 : (S.mapNode || 0)); if (!this.unlockedNode(this.node)) this.node = 0; S.mapNode = this.node;
    this.pos = MAP_NODES[this.node].slice(); this.route = null; this.walk = 0; this.face = 1; this.sel = this.node; this.pending = null; this.queued = null;
    this.fogA = [0, 1, 2, 3, 4].map(i => areaUnlocked(i) ? 0 : 1); this.bolt = 0; this.nextBolt = rnd(4, 9); this.birds = null; this.nextBirds = rnd(3, 8); this.panelK = 0;
    Cam.reset(clamp(this.pos[0], 320, MW - 320), clamp(this.pos[1], 180, MH - 180)); Cam.follow = 4; this.camOverride = null;
    if (a.reveal !== undefined && a.reveal < 5) {
      const r = a.reveal; this.fogA[r] = 1; this.revealing = true; const tgt = MAP_NODES[r * 5 + 1];
      Later.add(.9, () => { this.camOverride = [tgt[0], tgt[1]]; SFX.play('whoosh'); });
      Later.add(2.2, () => { Music.sting('discover'); SFX.play('breakready'); Tweens.to(this.fogA, { [r]: 0 }, 1.8, Ease.ioQ); Banner.show('NEW REGION REVEALED', AREAS[r].name + ' — ' + AREAS[r].field, COL.gold2, 3.2); for (let i = 0; i < 30; i++) Particles.spawn({ x: tgt[0] + rnd(-80, 80), y: tgt[1] + rnd(-50, 50), vx: rnd(-10, 10), vy: rnd(-20, -5), life: rnd(1, 2.2), c: '#fff4c0', type: 'star', size: 2, drag: .98 }); });
      Later.add(5.2, () => { this.camOverride = null; this.revealing = false; });
    }
    if (a.from === 'flee') Toast.add('You made a tactical exit. The smoke smells of cinnamon.', COL.dim, '☁');
  },
  exit() { Cam.follow = 6; },
  unlockedNode(i) { return i === 0 || levelUnlocked(nodeArea(i), nodeLvl(i)); },
  goTo(i) {
    if (!this.unlockedNode(i) || this.revealing) { SFX.play('error'); return; }
    if (this.route) { this.queued = i; return; }
    this.sel = i; if (i === this.node) return;
    const from = this.node; const route = []; const dir = i > from ? 1 : -1; for (let k = from; k !== i; k += dir) route.push(k);
    this.route = { list: route, dir, cur: from, k: 0, t: 0 };
  },
  update(dt) {
    this.t += dt; const busy = Overlays.stack.length || this.revealing;
    // movement along curves
    if (this.route) {
      const R = this.route; const segI = R.dir > 0 ? R.list[R.k] : R.list[R.k] - 1; const seg = MAP_SEGS[segI]; R.t += dt * 95 / seg.len; const tt = R.dir > 0 ? R.t : 1 - R.t;
      const p = segPoint(segI, clamp(tt, 0, 1)); if (Math.abs(p[0] - this.pos[0]) > .05) this.face = p[0] > this.pos[0] ? 1 : -1; this.pos = p; this.walk += dt * 11;
      if (this.walk % 6.28 < dt * 11) SFX.play('step', { v: .25, surf: 'grass' });
      if (R.t >= 1) { R.k++; R.t = 0; R.cur = R.list[R.k - 1] + R.dir; this.node = R.cur; if (R.k >= R.list.length) { this.route = null; this.node = this.sel; S.mapNode = this.node; this.pos = MAP_NODES[this.node].slice(); SFX.play('flick'); if (this.queued !== undefined && this.queued !== null) { const q = this.queued; this.queued = null; this.pending = null; this.goTo(q); } else if (this.pending) { const f = this.pending; this.pending = null; f(); } } }
    } else this.walk = 0;
    // input
    if (!busy) {
      if (Input.mouse.clicked && Input.mouse.y > 70 && !(Input.mouse.x > 900 && Input.mouse.y > 440)) {
        const best = this.pickNode(16);
        if (best >= 0) { if (best === this.sel && !this.route) this.confirm(); else this.goTo(best); }
      }
    }
    // camera
    const tgt = this.camOverride || this.pos; Cam.tx = clamp(tgt[0], 320, MW - 320); Cam.ty = clamp(tgt[1] - 10, 180, MH - 180); Cam.follow = this.camOverride ? 1.6 : 4;
    // ambience
    this.nextBolt -= dt; if (this.nextBolt <= 0) { this.nextBolt = rnd(5, 12); this.bolt = 1; this.boltX = rnd(260, 720); SFX.play('thunder', { v: .25 }); }
    this.bolt = Math.max(0, this.bolt - dt * 2.5);
    this.nextBirds -= dt; if (this.nextBirds <= 0 && !this.birds) { this.birds = { x: Cam.x - 360, y: Cam.y + rnd(-120, 40), n: rndi(3, 6), vx: rnd(40, 60) }; this.nextBirds = rnd(10, 18); }
    if (this.birds) { this.birds.x += this.birds.vx * dt; if (this.birds.x > Cam.x + 400) this.birds = null; }
    const [vx, vy] = MAP_NODES[0]; if (chance(dt * 3)) Particles.spawn({ x: vx - 42 + rndi(0, 3) * 26, y: vy - 32, vx: 4 + World.wind * 8, vy: -8, life: 3, c: '#d8d0c8', type: 'smoke', size: 2, drag: .99 });
    if (chance(dt * 4)) { const [fx, fy] = MAP_NODES[25]; Particles.spawn({ x: fx + rnd(-50, 50), y: fy - rnd(0, 60), vx: rnd(-3, 3), vy: -rnd(6, 14), life: 2, c: '#c060ff', c2: '#401040', size: 1, glow: 1 }); }
    const want = this.unlockedNode(this.sel) ? 1 : 0; this.panelK += (want - this.panelK) * Math.min(1, dt * 8);
  },
  confirm() {
    if (this.route) return; const i = this.sel;
    if (i === 0) { SFX.play('door'); Scene.go('village', { from: 'gate' }, { out: .5, in: .6 }); return; }
    const a = nodeArea(i), l = nodeLvl(i); if (!levelUnlocked(a, l)) { SFX.play('error'); return; }
    SFX.play('confirm'); S.mapNode = i; Save.save(true);
    const [sx, sy] = Cam.toScreen(this.pos[0], this.pos[1]);
    const boss = l === 4, visitorOK = !boss && chance(.3);
    if (visitorOK) Scene.go('road', { area: a, lvl: l }, { type: 'fade', out: .6, in: .6 });
    else Scene.go('combat', { area: a, lvl: l }, boss ? { type: 'bars', out: .8, in: .6, hold: .2, sound: 'boom' } : { type: 'iris', out: .7, in: .5, cx: sx * 2, cy: sy * 2 });
  },
  draw() {
    if (HD.live && this.drawHD) return this.drawHD();
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); P('#2a1a10', 0, 0, 640, 360);
    Cam.apply(c, 1); c.drawImage(this.map, 0, 0);
    const t = this.t;
    // river shimmer
    for (let y = Math.max(0, Math.floor((Cam.y - 190) / 6) * 6); y < Math.min(MH, Cam.y + 190); y += 6) { const x = riverX(y); if (Math.sin(y * .3 + t * 3) > .6) P('#bfe6ff', x - 3 + Math.sin(y + t * 2) * 4, y, 3, 1); }
    // windmill
    const wmx = 60, wmy = 700; P('#3a2a20', wmx - 5, wmy - 22, 10, 24); P('#c8b898', wmx - 4, wmy - 21, 8, 22); pPoly('#8a3a2a', [[wmx - 7, wmy - 21], [wmx, wmy - 30], [wmx + 7, wmy - 21]]);
    for (let k = 0; k < 4; k++) { const an = t * 1.4 + k * Math.PI / 2; pLine('#5a4030', wmx, wmy - 24, wmx + Math.cos(an) * 16, wmy - 24 + Math.sin(an) * 16, 2); pLine('#e8e0d0', wmx + Math.cos(an) * 5, wmy - 24 + Math.sin(an) * 5, wmx + Math.cos(an + .2) * 15, wmy - 24 + Math.sin(an + .2) * 15, 1); }
    // pumpkins in the graveyard
    this.pumpkins = this.pumpkins || (() => { const R = RNG(55), out = []; while (out.length < 9) { const x = R.r(1040, 1330), y = R.r(320, 600); if (regionAt(x, y) === 2 && !nearPath(x, y, 12)) out.push([x, y]); } return out; })();
    this.pumpkins.forEach(([x, y], i) => { pEll('#5a2a0a', x, y, 4, 3); pEll('#e07a20', x, y - 1, 4, 3); P('#3a6a2a', x, y - 5, 1, 2); const fl = .6 + noise1(t * 6 + i) * .4; c.globalAlpha = fl; P('#ffe060', x - 2, y - 2, 1, 1); P('#ffe060', x + 1, y - 2, 1, 1); P('#ffc040', x - 1, y, 3, 1); c.globalAlpha = 1; });
    // flags on fortress, runes in maze
    const [fx, fy] = MAP_NODES[25]; for (let k = 0; k < 2; k++) { const px = fx - 10 + k * 22, py = fy - 104 + k * 12; P('#1a0e1a', px, py, 1, 12); for (let j = 0; j < 8; j++) P('#8a1428', px + 1 + j, py + Math.sin(t * 5 + j * .6 + k) * 1.2, 1, 5); }
    // lightning
    if (this.bolt > .6) { let x = this.boltX, y = 0; for (let k = 0; k < 8; k++) { const nx = x + rnd(-10, 10), ny = y + 18; pLine('#f0e8ff', x, y, nx, ny, 1); x = nx; y = ny; } }
    // nodes
    MAP_NODES.forEach((n, i) => {
      const a = nodeArea(i), l = nodeLvl(i), open = this.unlockedNode(i), clear = i > 0 && S.clears[a][l], boss = l === 4, sel = i === this.sel, hid = i > 0 && this.fogA[a] > .5;
      if (hid) return; const [x, y] = n, pulse = sel ? Math.sin(t * 5) * 1 : 0, r = (boss ? 8 : i === 0 ? 7 : 6) + pulse;
      if (sel) { c.globalAlpha = .35 + Math.sin(t * 5) * .15; pCirc('#fff4c0', x, y, r + 5); c.globalAlpha = 1; }
      pCirc('#1a1016', x, y + 1, r + 2); pCirc(!open ? '#5a5458' : boss ? '#8a1c30' : i === 0 ? '#4a6a8a' : '#b88a40', x, y, r + 1); pCirc(!open ? '#7a7478' : boss ? '#c83a4a' : i === 0 ? '#7aa0c8' : '#e8c070', x, y - 1, r - 1);
      if (!open) { P('#2a2428', x - 2, y - 2, 5, 4); P('#2a2428', x - 1, y - 5, 3, 3); P('#7a7478', x, y - 4, 1, 2); }
      else if (boss) { pCirc('#f0e8d8', x, y - 2, 3); P('#f0e8d8', x - 2, y + 1, 5, 2); P('#1a1016', x - 2, y - 3, 1, 2); P('#1a1016', x + 1, y - 3, 1, 2); }
      else if (i === 0) { pPoly('#f0e8d8', [[x - 4, y], [x, y - 4], [x + 4, y]]); P('#f0e8d8', x - 3, y, 6, 3); }
      else { P('#3a2410', x - 1, y - 3, 3, 1); pText(String(l + 1), x, y + 2, 7, '#3a2410', 'center'); }
      if (clear) { pCirc('#1a1016', x + r - 1, y - r + 1, 3); pCirc('#7fc46a', x + r - 1, y - r + 1, 2); }
    });
    // fog of locked regions
    for (let i = 0; i < 5; i++) if (this.fogA[i] > .01) { c.globalAlpha = this.fogA[i] * (.92 + Math.sin(t * .7 + i) * .05); c.drawImage(buildFog(i), Math.sin(t * .2 + i) * 4, 0); c.globalAlpha = 1; }
    // token
    const [px, py] = this.pos; drawChar(px, py + 2, playerLook({ s: .9, face: this.face, walk: this.route ? this.walk : undefined, t }));
    // birds
    if (this.birds) for (let k = 0; k < this.birds.n; k++) { const bx = this.birds.x - k * 9, by = this.birds.y + Math.abs(k - this.birds.n / 2) * 5, f = Math.sin(t * 10 + k) > 0 ? 1 : 0; P('#2a2028', bx - 3, by - f, 3, 1); P('#2a2028', bx + 1, by - f, 3, 1); P('#2a2028', bx, by, 1, 1); }
    Particles.draw(false);
    // cloud shadows & clouds (screen-ish parallax)
    for (let k = 0; k < 6; k++) { const cx = ((k * 311 + t * (6 + World.wind * 10)) % (MW + 300)) - 150, cy = (k * 173) % MH; c.globalAlpha = .1; pEll('#1a1020', cx + 30, cy + 40, 60, 22); c.globalAlpha = .55; pEll('#f4f0f8', cx, cy, 44, 14); pEll('#ffffff', cx - 12, cy - 6, 26, 10); c.globalAlpha = 1; }
    // lighting
    Light.begin(mixA(World.ambient(), [255, 255, 255], .25));
    if (this.bolt > .3) Light.add(this.boltX, 120, 260, '#c0b0ff', this.bolt);
    Light.add(fx, fy - 30, 90, '#a040e0', .7, .2); Light.add(MAP_NODES[0][0], MAP_NODES[0][1] - 20, 70 + World.nightK() * 30, '#ffb060', .3 + World.nightK() * .6, .1);
    if (World.nightK() > .2) { this.pumpkins.forEach(([x, y]) => Light.add(x, y, 22, '#ff9030', .8 * World.nightK(), .3)); Light.add(px, py - 6, 40, '#ffd090', .5 * World.nightK(), .2); }
    Light.apply();
    c.setTransform(1, 0, 0, 1, 0, 0); outdoorWeather(400, .6);
  },
  ui() {
    HUD.draw({ buttons: [['VILLAGE', () => { this.goTo(0); if (this.route) this.pending = () => this.confirm(); else this.confirm(); }, 'Walk home', 78]] });
    // node labels on hover
    const i = this.sel, k = this.panelK;
    if (k > .02 && !this.revealing) {
      const x = 900, y = 450 + (1 - k) * 40, w = 360, h = 250; g.globalAlpha = k;
      UI.panel(x, y, w, h);
      if (i === 0) {
        UI.text('PLACENTA CREEK VILLAGE', x + w / 2, y + 36, { align: 'center', size: 18, col: COL.gold2 }); UI.para('Home. Shops, a cathedral, a blacksmith and a bed. The turnips are judging you.', x + 26, y + 70, w - 52, { size: 15, col: COL.cream });
        if (UI.btn('ENTER VILLAGE', x + 30, y + h - 66, w - 60, 44, { accent: true })) { if (this.route) this.pending = () => this.confirm(); else this.confirm(); }
      } else {
        const a = nodeArea(i), l = nodeLvl(i), e = ENEMIES[a * 5 + l], st = STORIES[a * 5 + l], cleared = S.clears[a][l], known = S.codex[e.id];
        UI.text(`${AREAS[a].name.toUpperCase()} · ${l === 4 ? 'BOSS' : 'LEVEL ' + (l + 1)}`, x + 24, y + 32, { maxW: w - 48, size: 13, col: l === 4 ? COL.red : COL.dim });
        UI.text(st[0], x + 24, y + 58, { maxW: w - 48, size: 19, col: COL.gold2 });
        UI.text('Foe: ' + (known || cleared ? e.name : '???') + (l === 4 && (known || cleared) ? ' — ' + e.title : ''), x + 24, y + 86, { maxW: w - 48, size: 14, col: COL.cream, bold: false });
        UI.text(`Field: ${AREAS[a].field}`, x + 24, y + 110, { maxW: w - 48, size: 14, col: COL.blue }); UI.text(AREAS[a].fieldDesc, x + 24, y + 128, { maxW: w - 48, size: 13, col: COL.dim, bold: false });
        UI.text(cleared ? '✔ Cleared — replay for coins & XP' : '◆ Not yet cleared — first-clear bonus', x + 24, y + 154, { maxW: w - 48, size: 13, col: cleared ? COL.green : COL.gold });
        if (UI.btn(l === 4 ? 'FACE THE BOSS' : 'TRAVEL & FIGHT', x + 30, y + h - 66, w - 60, 44, { accent: true, danger: l === 4 })) { if (this.route) this.pending = () => this.confirm(); else this.confirm(); }
      }
      g.globalAlpha = 1;
    }
    UI.text('Tap a location to travel there · tap it again or use the button to begin', 24, 704, { size: 13, col: COL.dim, bold: false });
    // hover tooltip on nodes
    const hov = this.pickNode(12);
    MAP_NODES.forEach((n, j) => { if (j === hov && UI.active === 'scene') { const a = nodeArea(j); if (j > 0 && this.fogA[a] > .5) return; UI.cursor = 'pointer'; const lab = j === 0 ? 'Village' : this.unlockedNode(j) ? STORIES[j - 1][0] : 'Locked'; const [sx, sy] = Cam.toScreen(n[0], n[1]); UI.pill(lab, sx * 2 - UI.measure(lab, 12) / 2 - 9, sy * 2 - 44, this.unlockedNode(j) ? COL.gold2 : COL.dim); } });
  }
};
