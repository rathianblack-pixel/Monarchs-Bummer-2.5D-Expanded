'use strict';
/* =========================================================
   ACT II WORLD MAP — "The Bummer Below"
   26 main nodes (port + 5 regions × 5) and 10 side nodes (cursed elite +
   Sigh Shard keeper per region), branching routes, HD 2.5D + LOW 2D.
   ========================================================= */
const MW2 = 1400, MH2 = 900;
const M2_MAIN = [[130, 800],
  [250, 770], [370, 810], [490, 770], [610, 810], [730, 770],
  [850, 730], [950, 690], [1050, 730], [1150, 690], [1250, 720],
  [1240, 610], [1170, 540], [1250, 470], [1170, 400], [1230, 320],
  [1110, 230], [1000, 180], [880, 220], [760, 175], [640, 205],
  [540, 290], [440, 240], [330, 280], [250, 350], [330, 430]];
const M2_SIDE = [ // [area, kind, x, y]  kind A = cursed elite, B = Sigh Shard keeper
  [5, 'A', 470, 858], [5, 'B', 560, 700], [6, 'A', 1030, 822], [6, 'B', 1080, 632], [7, 'A', 1335, 505], [7, 'B', 1125, 470],
  [8, 'A', 905, 120], [8, 'B', 815, 290], [9, 'A', 225, 225], [9, 'B', 405, 375]];
const M2_KEEPER = { 5: 'brendan', 6: 'kelp', 7: 'frostbeard', 8: 'vane', 9: 'chuckles' };
const M2_REG = { 5: [[470, 790, 340, 115], [140, 800, 120, 95]], 6: [[1050, 710, 270, 125]], 7: [[1215, 450, 175, 225]], 8: [[880, 195, 340, 115]], 9: [[390, 320, 255, 175]] };
const M2_PAL = { 5: ['#a88a50', '#c8a868', '#d8c088', '#ecd8a8', '#f8ecc8'], 6: ['#06141e', '#0a1e2c', '#0e2a3a', '#16384a', '#24506a'], 7: ['#8aa0b8', '#b0c4d8', '#d8e8f0', '#eaf4fa', '#ffffff'], 8: ['#a8a8d0', '#c8c8e8', '#e4e2f6', '#f2f0fc', '#ffffff'], 9: ['#c870a8', '#e090c0', '#f8b8d8', '#fcd0e4', '#ffe8f4'], sea: ['#0e2a50', '#163a68', '#1e4a7a', '#2a5e90', '#4a80b0'] };
const M2 = { built: false };
function m2Nodes() {
  if (M2.nodes) return M2.nodes;
  const N = M2_MAIN.map(([x, y], i) => i === 0 ? { x, y, type: 'port', area: -1, lvl: -1 } : { x, y, type: 'main', area: 5 + Math.floor((i - 1) / 5), lvl: (i - 1) % 5 });
  M2_SIDE.forEach(([a, k, x, y]) => N.push({ x, y, type: 'side', area: a, lvl: k === 'A' ? 2 : 3, kind: k, from: (a - 5) * 5 + 3, key: sideKey(a, k) }));
  const adj = N.map(() => []); for (let i = 0; i < M2_MAIN.length - 1; i++) { adj[i].push(i + 1); adj[i + 1].push(i); } N.forEach((n, i) => { if (n.type === 'side') { adj[i].push(n.from); adj[n.from].push(i); } });
  M2.adj = adj; return (M2.nodes = N);
}
function region2At(x, y) { let best = -1, bd = 1; for (const a in M2_REG) for (const [cx, cy, rx, ry] of M2_REG[a]) { const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + noise1(x * .018 + y * .011 + +a * 7) * .22; if (d < bd) { bd = d; best = +a; } } return best; }
const Map2 = {
  nodeOf(a, l) { return (a - 5) * 5 + l + 1; },
  route(from, to) { const N = m2Nodes(), prev = new Array(N.length).fill(-1), q = [from], seen = new Set([from]); while (q.length) { const c = q.shift(); if (c === to) break; for (const n of M2.adj[c]) if (!seen.has(n)) { seen.add(n); prev[n] = c; q.push(n); } } const out = []; let c = to; while (c !== -1 && c !== from) { out.unshift(c); c = prev[c]; } return out; },
  open(i) { const n = m2Nodes()[i]; if (n.type === 'port') return true; if (n.type === 'main') return levelUnlocked(n.area, n.lvl); return areaUnlocked(n.area) && !!S.clears[n.area][2]; },
  done(i) { const n = m2Nodes()[i]; if (n.type === 'port') return false; if (n.type === 'main') return !!S.clears[n.area][n.lvl]; return !!S.side[n.key]; },
  foe(i) { const n = m2Nodes()[i]; if (n.type === 'main') return ENEMIES[n.area * 5 + n.lvl]; if (n.type === 'side') return n.kind === 'A' ? makeCursed(ENEMIES[n.area * 5 + 1]) : ENEMY[M2_KEEPER[n.area]]; return null; },
  story(i) { const n = m2Nodes()[i]; if (n.type === 'main') return STORIES[n.area * 5 + n.lvl]; if (n.type === 'side') return n.kind === 'A' ? SIDE_STORIES.cursed : SIDE_STORIES[M2_KEEPER[n.area]]; return ['PORT MOPEWAY', '']; }
};
/* ---------------- art ---------------- */
const m2C = (k, w, h, fn) => Cache.get('m2_' + k, w, h, fn);
function m2Palm(v) { return { c: m2C('palm' + v, 30, 40, () => { const R = RNG(v + 3), lean = R.r(-5, 5); for (let k = 0; k < 24; k++) { const t2 = k / 24, x = 15 + lean * t2 * t2, y = 38 - t2 * 26; P(OLC, x - 2, y, 4, 2); P(k % 3 ? '#a87a4a' : '#8a5a34', x - 1, y, 2, 2); } const tx = 15 + lean, ty = 12; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .55; for (let k = 0; k < 11; k++) { const x = tx + Math.cos(a) * k, y = ty + Math.sin(a) * k * .55 + k * k * .06; P(OLC, x - 1, y - 1, 3, 3); P(k > 6 ? '#3a8a3a' : '#4aa848', x, y, 2, 1 + (k % 2)); } } P('#6a4a2a', tx - 2, ty, 2, 2); P('#6a4a2a', tx + 1, ty + 1, 2, 2); }), bx: 15, by: 38 }; }
function m2Ruin(v) { return { c: m2C('ruin' + v, 26, 34, () => { const R = RNG(v + 11), h = R.i(14, 28); P(OLC, 7, 33 - h, 12, h); P('#3a6a7a', 8, 34 - h, 10, h - 1); P('#5a8a9a', 8, 34 - h, 2, h - 1); for (let y = 36 - h; y < 32; y += 4) P('#2a4a5a', 8, y, 10, 1); P(OLC, 5, 33 - h - 3, 16, 4); P('#6a9aaa', 6, 33 - h - 2, 14, 2); if (R() < .5) { pEll(OLC, 13, 33 - h - 6, 7, 4); pEll('#4a8a8a', 13, 33 - h - 6, 6, 3); } for (let i = 0; i < 4; i++) P('#3a8a4a', 7 + R.i(0, 10), 33 - R.i(0, h), 1, 3); }), bx: 13, by: 33 }; }
function m2Tent(v) { return { c: m2C('tent' + v, 34, 34, () => { const cols = [['#f05a8a', '#ffffff'], ['#8a5af0', '#f0d040'], ['#5ac0f0', '#ffffff']][v % 3]; pPoly(OLC, [[2, 32], [17, 4], [32, 32]]); for (let i = 0; i < 6; i++) pPoly(cols[i % 2], [[3 + i * 4.8, 31], [17, 6], [3 + (i + 1) * 4.8, 31]]); P(OLC, 13, 22, 8, 10); P('#3a1a2a', 14, 23, 6, 9); P(OLC, 16, 0, 2, 6); pPoly('#f0d040', [[18, 0], [24, 2], [18, 4]]); }), bx: 17, by: 32 }; }
function m2Lolli(v) { return { c: m2C('lol' + v, 16, 30, () => { P(OLC, 7, 12, 3, 18); P('#f8f0f0', 8, 12, 1, 18); pCirc(OLC, 8, 8, 7); const c1 = ['#f05a8a', '#5af0c0', '#f0d040'][v % 3]; pCirc(c1, 8, 8, 6); for (let a = 0; a < 6; a += .5) P('#ffffff', 8 + Math.cos(a * 2) * a * .9, 8 + Math.sin(a * 2) * a * .9, 1, 1); }), bx: 8, by: 29 }; }
function m2Boat(big) { return { c: m2C('boat' + (big ? 1 : 0), 40, 34, () => { pPoly(OLC, [[2, 22], [38, 22], [32, 31], [8, 31]]); pPoly('#8a5a34', [[3, 23], [37, 23], [31, 30], [9, 30]]); P('#c08a58', 4, 23, 32, 1); P(OLC, 19, 2, 2, 21); pPoly(OLC, [[21, 3], [34, 18], [21, 18]]); pPoly('#f0e8d8', [[22, 5], [32, 17], [22, 17]]); if (big) { P('#5a7ab0', 24, 9, 3, 3); P('#8a3a4a', 14, 18, 4, 5); } }), bx: 20, by: 30 }; }
function m2SidePin(kind, done) { return { c: m2C('spin' + kind + (done ? 1 : 0), 20, 30, () => { const x = 10, y = 10, cols = kind === 'A' ? ['#4a1868', '#8a30c0', '#e0a0ff'] : ['#1a5a7a', '#5ac0e8', '#e0f8ff']; P(OLC, x - 1, y + 6, 3, 20); P('#8a7a6a', x, y + 7, 1, 18); P(OLC, x - 4, 26, 9, 3); pPoly(OLC, [[x, y - 9], [x + 9, y], [x, y + 9], [x - 9, y]]); pPoly(cols[0], [[x, y - 8], [x + 8, y], [x, y + 8], [x - 8, y]]); pPoly(cols[1], [[x, y - 6], [x + 6, y], [x, y + 6], [x - 6, y]]); P(cols[2], x - 2, y - 3, 2, 2); if (kind === 'A') { P('#1a0828', x - 2, y - 1, 2, 2); P('#1a0828', x + 1, y - 1, 2, 2); P('#1a0828', x - 1, y + 2, 3, 1); } else { pPoly('#ffffff', [[x, y - 3], [x + 2, y], [x, y + 3], [x - 2, y]]); } }), bx: 10, by: 28 }; }
function m2Snowpine(v) { const t2 = owTree(7 + (v % 4), 'leafDark', v, 'pine'); return { c: m2C('spine' + v, t2.c.width, t2.c.height, () => { ctx.drawImage(t2.c, 0, 0); const W = t2.c.width, D = ctx.getImageData(0, 0, W, t2.c.height).data; for (let y = 0; y < t2.c.height - 6; y += 3) for (let x = 0; x < W; x += 2) if (owHash(x + v, y) < .3) { if (D[(y * W + x) * 4 + 3] > 100) P('#f0f8ff', x, y, 2, 1); } }), bx: t2.bx, by: t2.by }; }
function m2Fin() { return m2C('fin', 40, 20, () => { pPoly('#0a1430', [[0, 18], [26, 0], [22, 18]]); pPoly('#1a2a50', [[4, 18], [24, 3], [21, 18]]); P('#4a70a8', 18, 6, 2, 8); }); }
function m2Build() {
  if (M2.built) return; M2.built = true; m2Nodes();
  const R = RNG(4242), O = [], put = (art, x, y, reg, o = {}) => O.push(Object.assign({ art, x, y, reg }, o));
  const nearN = (x, y, r) => M2.nodes.some(n => Math.hypot(n.x - x, n.y - y) < r) || M2.segs.some(s => { for (let k = 0; k <= 10; k++) { const px = lerp(s[0], s[2], k / 10), py = lerp(s[1], s[3], k / 10); if (Math.abs(px - x) < r * .7 && Math.abs(py - y) < r * .7) return true; } return false; });
  M2.segs = []; M2.nodes.forEach((n, i) => { for (const j of M2.adj[i]) if (j > i) M2.segs.push([n.x, n.y, M2.nodes[j].x, M2.nodes[j].y, Math.max(n.area, M2.nodes[j].area), M2.nodes[j].type === 'side' || n.type === 'side']); });
  for (let i = 0; i < 3200; i++) { const x = R.r(10, MW2 - 10), y = R.r(20, MH2 - 6), r = region2At(x, y), q = R(); if (r < 0 || nearN(x, y, 14)) continue;
    if (r === 5) { if (q < .1) put(m2Palm(R.i(0, 6)), x, y, 5, { sway: 1 }); else if (q < .13) put(owRock(R.i(0, 5)), x, y, 5); else if (q < .16) put(owBush(R.i(0, 4), 'leaf'), x, y, 5); }
    else if (r === 6) { if (q < .07) put(m2Ruin(R.i(0, 8)), x, y, 6); else if (q < .09) put(owRock(R.i(0, 5), true), x, y, 6); }
    else if (r === 7) { if (q < .2) put(m2Snowpine(R.i(0, 8)), x, y, 7, { sway: .5 }); else if (q < .24) put(owRock(R.i(0, 5)), x, y, 7); }
    else if (r === 8) { if (q < .03) put(owStatue(), x, y, 8); else if (q < .05) put(owTopiary(R.i(0, 2)), x, y, 8); }
    else if (r === 9) { if (q < .05) put(m2Tent(R.i(0, 3)), x, y, 9); else if (q < .12) put(m2Lolli(R.i(0, 3)), x, y, 9, { sway: .3 }); else if (q < .15) put(owTopiary(1), x, y, 9); } }
  for (let i = 0; i < 26; i++) { const x = R.r(1060, 1390), y = R.r(250, 640); if (region2At(x, y) === 7 && !nearN(x, y, 30)) put(owMount(R.i(50, 90), R.i(40, 80), R.i(0, 8), 'snow'), x, y, 7); }
  for (let x = -200; x < MW2 + 220; x += R.r(50, 90)) put(owMount(R.i(90, 150), R.i(60, 110), R.i(0, 9), 'snow'), x, R.r(-30, -6), -1, { far: 1 });
  M2.clouds = []; for (let i = 0; i < 18; i++) { const x = R.r(560, 1220), y = R.r(110, 300); if (region2At(x, y) === 8) M2.clouds.push([x, y, R.i(0, 3), R.r(.6, 1.1)]); }
  M2.boats = [[90, 830, 1], [190, 850, 0]];
  O.sort((a, b) => a.y - b.y); M2.objs = O;
}
function m2Ground() {
  return Cache.get('m2_ground', MW2, MH2, (c, w, h) => {
    m2Build(); const id = c.createImageData(w, h), d = id.data, pals = {}; for (const k in M2_PAL) pals[k] = M2_PAL[k].map(hexToRgb);
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const r = region2At(x, y), n = vnoise2(x * .013, y * .017) * .7 + vnoise2(x * .05, y * .06) * .3, j = owHash(x >> 1, y >> 1), dd = ((x + y) >> 1) & 1;
      let k = n < -.3 ? 1 : n < .25 ? 2 : n < .3 ? (dd ? 3 : 2) : n < .55 ? 3 : 4; if (j < .03) k = 0;
      let col = (r < 0 ? pals.sea : pals[r])[k];
      if (r < 0) { const wave = Math.sin(x * .05 + Math.sin(y * .03) * 3 + y * .02); if (wave > .93) col = pals.sea[4]; // shore foam
        let near = 0; for (const a in M2_REG) for (const [cx, cy, rx, ry] of M2_REG[a]) near = Math.max(near, 1.12 - Math.hypot((x - cx) / rx, (y - cy) / ry)); if (near > 0 && +owHash(x, y * 3) < near * 3) col = near > .06 ? hexToRgb('#3a7aa8') : hexToRgb('#8ac8e0'); }
      for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) { const o = ((y + yy) * w + x + xx) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; } }
    c.putImageData(id, 0, 0);
    const R = RNG(919);
    for (let i = 0; i < 7000; i++) { const x = R.r(0, w), y = R.r(0, h), r = region2At(x, y);
      if (r === 5 && R() < .4) P(R() < .5 ? '#b89a60' : '#f8ecc8', x, y, R.i(1, 3), 1);
      else if (r === 6) { if (R() < .08) P('#80ffe0', x, y, 1, 1); else if (R() < .2) P('#16384a', x, y, R.i(2, 6), 1); }
      else if (r === 7 && R() < .3) P(R() < .5 ? '#b0c4d8' : '#ffffff', x, y, R.i(1, 4), 1);
      else if (r === 9 && R() < .2) P(pick(['#f05a8a', '#5af0c0', '#f0d040', '#ffffff', '#8a5af0']), x, y, 1, 1);
      else if (r === 8 && R() < .25) pEll('#ffffff', x, y, R.r(2, 6), R.r(1, 2)); else if (r < 0 && R() < .05) P('#4a80b0', x, y, R.i(2, 6), 1); }
    // Grinhaven candy stripes road + Glub glowing streets
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, x = 1050 + Math.cos(a) * 120, y = 710 + Math.sin(a) * 50; pEll('#24506a', x, y, 14, 6); pEll('#80ffe0', x, y - 1, 2, 1); }
    // roads (main = dirt/planks, sea crossings = dotted lanes, side = narrow)
    for (const [x0, y0, x1, y1, a, side] of M2.segs) { const len = Math.hypot(x1 - x0, y1 - y0), st = side ? 5 : 3; for (let k = 0; k <= len; k += st) { const t2 = k / len, x = lerp(x0, x1, t2) + Math.sin(t2 * Math.PI) * (side ? 0 : 6) * Math.sign(y1 - y0 || 1), y = lerp(y0, y1, t2); const r = region2At(x, y);
      if (r < 0) { if ((k / st) % 3 < 1.5) { P('#f0f8ff', x - 1, y - 1, 3, 2); } }
      else { const pc = r === 7 ? '#a8b8d0' : r === 9 ? (Math.floor(k / 6) % 2 ? '#ffffff' : '#f05a8a') : r === 8 ? '#c8a040' : r === 6 ? '#3a7a8a' : '#a87a4a'; P(OLC, x - (side ? 2 : 4), y - (side ? 1 : 3), side ? 4 : 8, side ? 3 : 6); P(pc, x - (side ? 1 : 3), y - (side ? 1 : 2), side ? 3 : 6, side ? 2 : 4); } } }
    // the port: pier and planks
    P(OLC, 60, 812, 70, 10); for (let x = 61; x < 129; x += 4) { P('#a87a4a', x, 813, 3, 8); P('#c89a68', x, 813, 1, 8); } P(OLC, 120, 790, 40, 26); P('#8a6a4a', 121, 791, 38, 24);
    // the deep: a dark trench where something enormous sleeps
    for (let i = 0; i < 60; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * 110; c.globalAlpha = .06; pEll('#020818', 700 + Math.cos(a) * rr, 470 + Math.sin(a) * rr * .5, 50, 22); } c.globalAlpha = 1;
  });
}
function m2Fog(a) { return Cache.get('m2_fog' + a, MW2, MH2, (c, w, h) => { const R = RNG(a * 77); for (let i = 0; i < 900; i++) { const x = R.r(0, w), y = R.r(0, h); if (region2At(x, y) !== a) continue; c.globalAlpha = .5; pEll(R() < .5 ? '#c8c8d8' : '#a8a8c0', x, y, R.r(16, 36), R.r(8, 16)); } c.globalAlpha = 1; }); }
/* ---------------- scene ---------------- */
Scenes.overworld2 = { hd: true, timeRuns: true,
  enter(a) {
    this.t = 0; Music.resetLayers(); Music.play('map2', 1.4); Amb.set('map2'); m2Build(); m2Ground(); for (let i = 5; i < 10; i++) m2Fog(i);
    const N = m2Nodes(); this.node = a.node !== undefined ? a.node : (S.map2Node || 0); if (!Map2.open(this.node)) this.node = 0; S.map2Node = this.node;
    this.pos = [N[this.node].x, N[this.node].y]; this.route = null; this.walk = 0; this.face = 1; this.sel = this.node; this.pending = null; this.queued = null; this.panelK = 0;
    this.fogA = {}; for (let i = 5; i < 10; i++) this.fogA[i] = areaUnlocked(i) ? 0 : 1; this.camOverride = null;
    Cam.reset(clamp(this.pos[0], 320, MW2 - 320), clamp(this.pos[1], 180, MH2 - 180)); Cam.follow = 4;
    if (a.reveal !== undefined && a.reveal >= 5 && a.reveal < 10) { const r = a.reveal, tgt = N[Map2.nodeOf(r, 0)]; this.fogA[r] = 1; this.revealing = true;
      Later.add(.9, () => { this.camOverride = [tgt.x, tgt.y]; SFX.play('whoosh'); });
      Later.add(2.2, () => { Music.sting('discover'); SFX.play('breakready'); Tweens.to(this.fogA, { [r]: 0 }, 1.8, Ease.ioQ); Banner.show('NEW REGION REVEALED', AREAS[r].name + ' — ' + AREAS[r].field, COL.gold2, 3.2); for (let i = 0; i < 30; i++) Particles.spawn({ x: tgt.x + rnd(-80, 80), y: tgt.y + rnd(-50, 50), vx: rnd(-10, 10), vy: rnd(-20, -5), life: rnd(1, 2.2), c: '#fff4c0', type: 'star', size: 2, drag: .98 }); });
      Later.add(5.2, () => { this.camOverride = null; this.revealing = false; }); }
  },
  exit() { Cam.follow = 6; },
  goTo(i) { if (!Map2.open(i) || this.revealing) { SFX.play('error'); return; } if (this.route) { this.queued = i; return; } this.sel = i; if (i === this.node) return; const list = Map2.route(this.node, i); if (!list.length) return; this.route = { list, k: 0, t: 0, from: this.node }; },
  update(dt) {
    this.t += dt; const busy = Overlays.stack.length || this.revealing, N = m2Nodes();
    if (this.route) { const R = this.route, a = N[R.k ? R.list[R.k - 1] : R.from], b = N[R.list[R.k]], len = Math.hypot(b.x - a.x, b.y - a.y) || 1; R.t += dt * 95 / len; const k = clamp(R.t, 0, 1), side = a.type === 'side' || b.type === 'side';
      const px = lerp(a.x, b.x, k) + (side ? 0 : Math.sin(k * Math.PI) * 6 * Math.sign(b.y - a.y || 1)), py = lerp(a.y, b.y, k); if (Math.abs(px - this.pos[0]) > .05) this.face = px > this.pos[0] ? 1 : -1; this.pos = [px, py]; this.walk += dt * 11;
      this.sailing = region2At(px, py) < 0; if (!this.sailing && this.walk % 6.28 < dt * 11) SFX.play('step', { v: .25, surf: 'grass' });
      if (R.t >= 1) { this.node = R.list[R.k]; R.k++; R.t = 0; if (R.k >= R.list.length) { this.route = null; this.sailing = false; this.node = this.sel; S.map2Node = this.node; this.pos = [N[this.node].x, N[this.node].y]; SFX.play('flick'); if (this.queued !== null && this.queued !== undefined) { const q = this.queued; this.queued = null; this.pending = null; this.goTo(q); } else if (this.pending) { const f = this.pending; this.pending = null; f(); } } } }
    else this.walk = 0;
    if (!busy && Input.mouse.clicked && Input.mouse.y > 70 && !(Input.mouse.x > 900 && Input.mouse.y > 440)) { const best = this.pickNode(16); if (best >= 0) { if (best === this.sel && !this.route) this.confirm(); else this.goTo(best); } }
    const tgt = this.camOverride || this.pos; Cam.tx = clamp(tgt[0], 320, MW2 - 320); Cam.ty = clamp(tgt[1] - 10, 180, MH2 - 180); Cam.follow = this.camOverride ? 1.6 : 4;
    if (chance(dt * 3)) Particles.spawn({ x: 1050 + rnd(-120, 120), y: 710 + rnd(-40, 40), vx: 0, vy: -rnd(4, 10), life: 2.4, c: '#a0f0ff', size: 1, glow: 1 });
    if (chance(dt * 2) && this.fogA[9] < .5) Particles.spawn({ x: 390 + rnd(-160, 160), y: 320 + rnd(-90, 90), vx: rnd(-4, 4), vy: -rnd(4, 12), life: 2, c: pick(['#f05a8a', '#f0d040', '#5af0c0']), size: 1 });
    const want = Map2.open(this.sel) ? 1 : 0; this.panelK += (want - this.panelK) * Math.min(1, dt * 8);
  },
  confirm() {
    if (this.route) return; const i = this.sel, n = m2Nodes()[i];
    if (n.type === 'port') { SFX.play('door'); Scene.go('port', { from: 'map' }, { out: .5, in: .6 }); return; }
    if (!Map2.open(i)) { SFX.play('error'); return; }
    SFX.play('confirm'); S.map2Node = i; Save.save(true); const [sx, sy] = Cam.toScreen(this.pos[0], this.pos[1]);
    const args = { area: n.area, lvl: n.lvl, node: i };
    if (n.type === 'side') { args.side = n.key; if (n.kind === 'A') args.cursedOf = ENEMIES[n.area * 5 + 1].id; else args.enemyId = M2_KEEPER[n.area]; }
    const boss = n.type === 'main' && n.lvl === 4;
    Scene.go('combat', args, boss ? { type: 'bars', out: .8, in: .6, hold: .2, sound: 'boom' } : { type: 'iris', out: .7, in: .5, cx: sx * 2, cy: sy * 2 });
  },
  worldMouse() { if (HD.live) return HD.unproject(Input.mouse.lx, Input.mouse.ly); return [Input.mouse.lx - 320 + Cam.x, Input.mouse.ly - 180 + Cam.y]; },
  pickNode(rad = 14) { let best = -1, bd = rad; const lift = HD.live ? 11 : 0; m2Nodes().forEach((n, i) => { if (n.area >= 5 && this.fogA[n.area] > .5) return; const [sx, sy] = Cam.toScreen(n.x, n.y); const d = Math.hypot(sx - Input.mouse.lx, sy - lift - Input.mouse.ly); if (d < bd) { bd = d; best = i; } }); return best; },
  pinArt(i) { const n = m2Nodes()[i]; if (n.type === 'side') return m2SidePin(n.kind, Map2.done(i)); const open = Map2.open(i); return owPin(n.type === 'port' ? 'home' : !open ? 'lock' : n.lvl === 4 ? 'boss' : 'open', String(n.lvl + 1)); },
  drawHD() {
    m2Build(); const t = this.t, N = m2Nodes(), nk = World.nightK(); let c;
    HD.begin({ pitch: 38, fov: 40, zs: 'auto', tx: Cam.x - Cam.rx + Cam.sx, ty: Cam.y + Cam.sy + 10, zoom: (Cam.zoom + Cam.punch) * 1.05, maxBack: 360, clear: [.08, .16, .28], fog: [560, 1100, .4], fogC: nk > .5 ? [.1, .12, .26] : [.7, .8, .95], cloud: .2 * (1 - nk), dof: [.2, .2, .92, .9], bloom: [.66, .5], vig: .5, shafts: sunShafts({ base: .42 }), motes: { n: 40, a: .35 } });
    HD.ground(m2SeaTile(), -900, -700, { w: MW2 + 1800, h: MH2 + 1400, rep: true }); HD.ground(m2Ground(), 0, 0);
    const v = HD.view, vx0 = v.x0 - 40, vx1 = v.x1 + 40, vy0 = v.y0 - 10, vy1 = v.y1 + 140;
    HD.layer('decal'); c = ctx;
    for (let i = 0; i < 40; i++) { const x = (i * 97 + t * 8) % MW2, y = (i * 211) % MH2; if (region2At(x, y) < 0 && Math.sin(t * 2 + i) > .3) P('#c8e8ff', x, y, 4, 1); }
    N.forEach((n, i) => { if (n.area >= 5 && this.fogA[n.area] > .5) return; c.globalAlpha = .35; pEll('#0a1020', n.x + 2, n.y + 1, 9, 3); c.globalAlpha = 1; if (i === this.sel) { c.globalAlpha = .45 + Math.sin(t * 5) * .2; c.strokeStyle = '#fff4c0'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(n.x, n.y, 12 + Math.sin(t * 5), 7, 0, 0, TAU); c.stroke(); c.globalAlpha = 1; } });
    HD.groundLayer('decal');
    for (let a = 5; a < 10; a++) if (this.fogA[a] > .01) { const f = m2Fog(a), al = this.fogA[a]; [[2, .85], [14, .55], [30, .35]].forEach(([lift, k2], k) => HD.ground(f, Math.sin(t * .2 + a + k) * 5, 0, { lift, col: [1, 1, 1, al * k2 + 2] })); }
    const L = [];
    for (const o of M2.objs) { if (o.x < vx0 - 80 || o.x > vx1 + 80 || o.y < vy0 - (o.far ? 200 : 20) || o.y > vy1) continue; const fa = o.reg >= 5 ? this.fogA[o.reg] : 0; if (fa > .98) continue; L.push([o.y, o, 1 - fa]); }
    for (const [x, y, k, sc] of M2.clouds) L.push([y, { art: owCloud(k), x: x + Math.sin(t * .3 + x) * 6, y, sc, dy: -30 }, (1 - this.fogA[8]) * .9]);
    for (const [x, y, big] of M2.boats) L.push([y, { art: m2Boat(big), x, y: y + Math.sin(t * 1.5 + x) * 1, dy: Math.sin(t * 2 + x) }, 1]);
    // the Bummer, far below: a slow fin crossing the deep
    const wx = 700 + Math.sin(t * .05) * 90, wy = 470 + Math.cos(t * .05) * 30; L.push([wy, { art: { c: m2Fin(), bx: 20, by: 18 }, x: wx, y: wy, dy: Math.sin(t * .7) * 2 + 4 }, .55 + Math.sin(t * .3) * .25]);
    N.forEach((n, i) => { if (n.area >= 5 && this.fogA[n.area] > .5) return; const bob = i === this.sel ? Math.abs(Math.sin(t * 4)) * 2 : 0; L.push([n.y + .2, { art: this.pinArt(i), x: n.x, y: n.y, dy: -bob }, 1]); if (n.type !== 'port' && Map2.done(i)) L.push([n.y + .3, { art: { c: owC('chk', 9, 9, () => { pCirc(OLC, 4.5, 4.5, 4); pCirc('#7fc46a', 4.5, 4.5, 3); P('#f0fff0', 3, 4, 1, 2); P('#f0fff0', 4, 5, 1, 1); P('#f0fff0', 5, 2, 1, 3); }), bx: 4.5, by: 8 }, x: n.x + 7, y: n.y, dy: -22 - bob }, 1]); });
    const [px, py] = this.pos;
    L.push([py + .4, () => HD.capture(py + 2.4, () => { if (this.sailing) { const b = m2Boat(0); ctx.drawImage(b.c, Math.round(px - 20), Math.round(py - 28 + Math.sin(t * 3))); drawChar(px - 2, py - 8 + Math.sin(t * 3), playerLook({ s: .8, face: this.face, t })); } else drawChar(px, py + 2, playerLook({ s: .9, face: this.face, walk: this.route ? this.walk : undefined, t })); }, null, 0, [px - 26, py - 50, 52, 56], HI_CHAR)]);
    L.sort((a, b) => a[0] - b[0]);
    for (const [, o, al] of L) { if (typeof o === 'function') { o(); continue; } const A = o.art, sc = o.sc || 1; HD.art(A.c, o.x - A.bx * sc, o.y - A.by * sc + (o.dy || 0), o.y, { alpha: al, scale: sc, sway: o.sway ? World.windSway(o.x, .5) * .8 : 0 }); }
    HD.layer('top'); c = ctx; Particles.draw(false);
    for (let a = 5; a < 10; a++) { if (this.fogA[a] > .6) continue; const [x, y] = M2_REG[a][0]; c.globalAlpha = 1 - this.fogA[a]; PFont.draw(c, AREAS[a].name.toUpperCase(), x, y + 52, 12, 'rgba(255,244,214,.92)', 'center', 'alphabetic', 'rgba(20,12,8,.7)'); c.globalAlpha = 1; }
    PFont.draw(c, 'PORT MOPEWAY', 130, 845, 10, 'rgba(255,244,214,.92)', 'center', 'alphabetic', 'rgba(20,12,8,.7)'); PFont.draw(c, 'THE DEEP', 700, 470, 10, 'rgba(160,200,255,.5)', 'center', 'alphabetic', null);
    HD.groundLayer('top');
    Light.begin(mixA(World.ambient(), [255, 255, 255], .3)); Light.add(1050, 700, 200, '#40e0d0', .5, .2); Light.add(390, 320, 220, '#ff90d0', .35, .2); Light.add(130, 790, 80, '#ffb060', .3 + nk * .6, .1); if (nk > .2) Light.add(px, py - 6, 40, '#ffd090', .5 * nk, .2); Light.apply();
    HD.screenLayer(); if (World.rain > .05) Weather.draw(400, World.rain * .6);
  },
  draw() {
    if (HD.live && this.drawHD) return this.drawHD();
    const c = ctx, t = this.t, N = m2Nodes(); c.setTransform(1, 0, 0, 1, 0, 0); P('#0e2a50', 0, 0, 640, 360); Cam.apply(c, 1); c.drawImage(m2Ground(), 0, 0);
    const vx0 = Cam.x - 340, vx1 = Cam.x + 340, vy0 = Cam.y - 200, vy1 = Cam.y + 220;
    for (let i = 0; i < 40; i++) { const x = (i * 97 + t * 8) % MW2, y = (i * 211) % MH2; if (region2At(x, y) < 0 && Math.sin(t * 2 + i) > .3) P('#c8e8ff', x, y, 4, 1); }
    const L = []; for (const o of M2.objs) { if (o.far || o.x < vx0 || o.x > vx1 || o.y < vy0 || o.y > vy1 + 40) continue; if (o.reg >= 5 && this.fogA[o.reg] > .5) continue; L.push(o); }
    for (const [x, y, big] of M2.boats) L.push({ art: m2Boat(big), x, y });
    const wx = 700 + Math.sin(t * .05) * 90, wy = 470 + Math.cos(t * .05) * 30; c.globalAlpha = .5; c.drawImage(m2Fin(), Math.round(wx - 20), Math.round(wy - 14)); c.globalAlpha = 1;
    N.forEach((n, i) => { if (n.area >= 5 && this.fogA[n.area] > .5) return; const bob = i === this.sel ? Math.abs(Math.sin(t * 4)) * 2 : 0; L.push({ art: this.pinArt(i), x: n.x, y: n.y + .2, dy: -bob }); });
    L.sort((a, b) => a.y - b.y); for (const o of L) c.drawImage(o.art.c, Math.round(o.x - o.art.bx), Math.round(o.y - o.art.by + (o.dy || 0)));
    N.forEach((n, i) => { if (n.type !== 'port' && Map2.done(i) && !(n.area >= 5 && this.fogA[n.area] > .5)) { pCirc(OLC, n.x + 7, n.y - 26, 4); pCirc('#7fc46a', n.x + 7, n.y - 26, 3); } });
    for (let a = 5; a < 10; a++) if (this.fogA[a] > .01) { c.globalAlpha = this.fogA[a] * .95; c.drawImage(m2Fog(a), 0, 0); c.globalAlpha = 1; }
    for (const [x, y, k, sc] of M2.clouds) { if (this.fogA[8] > .5) continue; const cl = owCloud(k); c.globalAlpha = .8; c.drawImage(cl.c, Math.round(x - cl.bx * sc), Math.round(y - 30 - cl.by * sc), cl.c.width * sc, cl.c.height * sc); c.globalAlpha = 1; }
    const [px, py] = this.pos; if (this.sailing) { const b = m2Boat(0); c.drawImage(b.c, Math.round(px - 20), Math.round(py - 28 + Math.sin(t * 3))); drawChar(px - 2, py - 8 + Math.sin(t * 3), playerLook({ s: .8, face: this.face, t })); } else drawChar(px, py + 2, playerLook({ s: .9, face: this.face, walk: this.route ? this.walk : undefined, t }));
    for (let a = 5; a < 10; a++) { if (this.fogA[a] > .6) continue; const [x, y] = M2_REG[a][0]; PFont.draw(c, AREAS[a].name.toUpperCase(), x, y + 52, 12, 'rgba(255,244,214,.92)', 'center', 'alphabetic', 'rgba(20,12,8,.7)'); }
    PFont.draw(c, 'PORT MOPEWAY', 130, 845, 10, 'rgba(255,244,214,.92)', 'center', 'alphabetic', 'rgba(20,12,8,.7)');
    Particles.draw(false);
    Light.begin(mixA(World.ambient(), [255, 255, 255], .3)); Light.add(1050, 700, 160, '#40e0d0', .5, .2); Light.add(390, 320, 180, '#ff90d0', .3, .2); Light.apply();
    c.setTransform(1, 0, 0, 1, 0, 0); if (World.rain > .05) Weather.draw(400, World.rain * .6);
  },
  ui() {
    HUD.draw({ buttons: [['PORT', () => { this.goTo(0); if (this.route) this.pending = () => this.confirm(); else this.confirm(); }, 'Back to Port Mopeway', 64]] });
    const i = this.sel, k = this.panelK, N = m2Nodes(), n = N[i];
    if (k > .02 && !this.revealing) { const x = 900, y = 450 + (1 - k) * 40, w = 360, h = 250; g.globalAlpha = k; UI.panel(x, y, w, h);
      if (n.type === 'port') { UI.text('PORT MOPEWAY', x + w / 2, y + 36, { align: 'center', size: 18, col: COL.gold2 }); UI.para('A pier, a bounty board, a fishing spot, your party and a boat home. Everyone is a bit sad. It\'s cosy.', x + 26, y + 70, w - 52, { size: 15, col: COL.cream }); if (UI.btn('ENTER PORT', x + 30, y + h - 66, w - 60, 44, { accent: true })) { if (this.route) this.pending = () => this.confirm(); else this.confirm(); } }
      else { const e = Map2.foe(i), st = Map2.story(i), done = Map2.done(i), known = S.codex[e.id], boss = n.type === 'main' && n.lvl === 4;
        UI.text(`${AREAS[n.area].name.toUpperCase()} · ${n.type === 'side' ? (n.kind === 'A' ? 'CURSED ELITE' : 'SIGH SHARD') : boss ? 'BOSS' : 'LEVEL ' + (n.lvl + 1)}`, x + 24, y + 32, { maxW: w - 48, size: 13, col: boss ? COL.red : n.type === 'side' ? (n.kind === 'A' ? COL.purple : '#a0e0ff') : COL.dim });
        UI.text(st[0], x + 24, y + 58, { maxW: w - 48, size: 19, col: COL.gold2 });
        UI.text('Foe: ' + (known || done ? e.name : '???') + (boss && (known || done) ? ' — ' + e.title : ''), x + 24, y + 86, { maxW: w - 48, size: 14, col: COL.cream, bold: false });
        UI.text(`Field: ${AREAS[n.area].field}`, x + 24, y + 110, { maxW: w - 48, size: 14, col: COL.blue }); UI.text(AREAS[n.area].fieldDesc, x + 24, y + 128, { maxW: w - 48, size: 12, col: COL.dim, bold: false });
        const reward = n.type === 'side' ? (n.kind === 'A' ? 'Reward: Cursed Ember + rare trinket chance' : (S.shards.includes(M2_KEEPER[n.area]) ? '◇ Sigh Shard collected' : '◇ Reward: a Sigh Shard')) : (done ? '✔ Cleared — replay for coins & XP' : '◆ Not yet cleared — first-clear bonus + lore');
        UI.text(reward, x + 24, y + 154, { maxW: w - 48, size: 13, col: done ? COL.green : COL.gold });
        if (UI.btn(boss ? 'FACE THE BOSS' : 'TRAVEL & FIGHT', x + 30, y + h - 66, w - 60, 44, { accent: true, danger: boss })) { if (this.route) this.pending = () => this.confirm(); else this.confirm(); } }
      g.globalAlpha = 1; }
    UI.text(`Act II · The Bummer Below · Sigh Shards ${S.shards.length}/5 · Tap a location to travel`, 24, 704, { size: 13, col: COL.dim, bold: false });
    const hov = this.pickNode(12); if (hov >= 0 && UI.active === 'scene') { const hn = N[hov]; UI.cursor = 'pointer'; const lab = hn.type === 'port' ? 'Port Mopeway' : Map2.open(hov) ? Map2.story(hov)[0] : 'Locked'; const [sx, sy] = Cam.toScreen(hn.x, hn.y); UI.pill(lab, sx * 2 - UI.measure(lab, 12) / 2 - 9, sy * 2 - 44, Map2.open(hov) ? COL.gold2 : COL.dim); }
  }
};
function m2SeaTile() { return Cache.get('m2_seatile', 128, 128, (c) => { const R = RNG(5); P('#0e2a50', 0, 0, 128, 128); for (let i = 0; i < 260; i++) P(R() < .5 ? '#163a68' : '#0a2244', R.r(0, 128), R.r(0, 128), R.i(2, 8), 1); for (let i = 0; i < 20; i++) P('#2a5e90', R.r(0, 128), R.r(0, 128), R.i(3, 6), 1); }); }
