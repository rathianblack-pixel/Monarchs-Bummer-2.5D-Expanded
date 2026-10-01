'use strict';
/* =========================================================
   PLACENTA CREEK — 3/4 top-down village hub
   World is VW x VH low-res pixels. Characters walk on the ground plane
   (x, y = feet). Everything with a footprint is depth-sorted by its base y.
   ========================================================= */
const VW = 1440, VH = 760;
const RIVER = { x0: y => 70 + Math.sin(y * .02) * 7 + Math.sin(y * .051) * 3, x1: y => 150 + Math.sin(y * .017 + 1) * 7 + Math.sin(y * .043) * 3, bridgeY0: 466, bridgeY1: 502 };
const ROAD = [[30, 486], [170, 486], [260, 488], [380, 478], [470, 470], [560, 472], [700, 486], [860, 484], [1000, 478], [1120, 486], [1260, 490], [1440, 486]];
const HILL = { x0: 996, x1: 1244, y: 262, face: 22, stairX0: 1104, stairX1: 1146 };
const GY = { x0: 1262, x1: 1372, y0: 262, y1: 404 };
const PALI = 1402; // palisade x
const B = { // buildings: x = left of wall, y = front base line
  house: { x: 206, y: 332, w: 140, wallH: 40, roofH: 50, depth: 74 },
  merchant: { x: 600, y: 330, w: 156, wallH: 42, roofH: 46, depth: 70 },
  smith: { x: 826, y: 382, w: 160, wallH: 44, roofH: 44, depth: 72 },
  cath: { x: 1030, y: 230, w: 180, wallH: 76, roofH: 58, depth: 100 }
};
const DOORS = [
  { id: 'house', x: 300, y: 336, label: 'Enter Home', scene: 'house' },
  { id: 'merchant', x: 690, y: 334, label: 'Enter Merchant', scene: 'merchant' },
  { id: 'smith', x: 896, y: 386, label: 'Enter Blacksmith', scene: 'smith' },
  { id: 'cathedral', x: 1120, y: 234, label: 'Enter Cathedral', scene: 'cathedral' },
  { id: 'gate', x: 1392, y: 486, label: 'Leave for the Overworld', scene: 'overworld' }
];
const WELL = { x: 516, y: 418 };
/* ---------- collision ---------- */
function vBlocked(x, y) {
  if (x < 8 || x > VW - 8 || y < 70 || y > VH - 14) return true;
  if (y < HILL.y + 2 && x > HILL.x0 && x < HILL.x1 && y > HILL.y - 40) { /* plateau top: walkable strip in front of cathedral */ }
  if (y >= HILL.y - 2 && y < HILL.y + HILL.face + 4 && x > HILL.x0 - 2 && x < HILL.x1 + 2 && !(x > HILL.stairX0 + 4 && x < HILL.stairX1 - 4)) return true;
  if (y < HILL.y && (x < HILL.x0 + 4 && x > HILL.x0 - 6 || x > HILL.x1 - 4 && x < HILL.x1 + 6)) return true;
  if (y < 196 && x > HILL.x0 && x < HILL.x1) return true;
  if (!(y > RIVER.bridgeY0 + 4 && y < RIVER.bridgeY1 - 2) && x > RIVER.x0(y) - 3 && x < RIVER.x1(y) + 3) return true;
  for (const k in B) { const b = B[k]; if (x > b.x - 4 && x < b.x + b.w + 4 && y > b.y - b.depth && y < b.y + 3) return true; }
  if (Math.hypot(x - WELL.x, (y - WELL.y) * 1.4) < 18) return true;
  if (x > PALI - 6 && !(y > 462 && y < 512)) return true;
  // graveyard fence (open on the south side between 1300 and 1330)
  if (y > GY.y0 - 4 && y < GY.y1 + 3) { if (Math.abs(x - GY.x0) < 4 || Math.abs(x - GY.x1) < 4) return true; }
  if (x > GY.x0 && x < GY.x1 && Math.abs(y - GY.y1) < 4 && !(x > 1300 && x < 1334)) return true;
  if (x > GY.x0 && x < GY.x1 && Math.abs(y - GY.y0) < 4) return true;
  for (const t of VTREES) if (t.solid && Math.hypot(x - t.x, (y - t.y) * 1.6) < t.r * .35 + 4) return true;
  return false;
}
function vSurface(x, y) {
  if (y > RIVER.bridgeY0 && y < RIVER.bridgeY1 && x > RIVER.x0(y) - 16 && x < RIVER.x1(y) + 16) return 'wood';
  if (Math.hypot(x - WELL.x, y - WELL.y) < 80 || (y < HILL.y + 30 && x > HILL.x0 && x < HILL.x1)) return 'stone';
  if (World.rain > .5) return 'water';
  for (let i = 0; i < ROAD.length - 1; i++) { const a = ROAD[i], b = ROAD[i + 1]; if (x >= a[0] && x <= b[0] && Math.abs(y - lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]))) < 18) return 'dirt'; }
  return 'grass';
}
/* ---------- static decoration list ---------- */
const VTREES = [];
(function () {
  const R = RNG(4242), add = (x, y, r, pal, kind = 'round', solid = true, fade = false) => VTREES.push({ x, y, r, pal, kind, solid, fade, seed: VTREES.length + 11 });
  // north forest edge
  for (let x = 170; x < 990; x += R.i(30, 44)) add(x + R.i(-6, 6), 70 + R.i(0, 26), R.i(16, 24), R() < .2 ? 'leafGold' : 'leaf', R() < .15 ? 'pine' : 'round');
  for (let x = 1250; x < 1400; x += 36) add(x, 120 + R.i(0, 30), R.i(15, 20), 'leaf', 'pine');
  // west bank
  for (let y = 100; y < 440; y += R.i(40, 60)) add(R.i(14, 44), y, R.i(14, 20), 'leaf');
  for (let y = 560; y < 740; y += R.i(40, 60)) add(R.i(14, 44), y, R.i(14, 22), 'leaf');
  // south framing (big, fade when you walk behind)
  for (let x = 180; x < 1400; x += R.i(70, 110)) { if (x > 620 && x < 700) continue; add(x, 744 + R.i(0, 12), R.i(26, 34), R() < .3 ? 'leafAut' : 'leaf', 'big', false, true); }
  add(200, 218, 20, 'leaf'); add(390, 250, 16, 'leafGold'); add(560, 250, 18, 'leaf'); add(800, 300, 17, 'leafAut'); add(990, 330, 18, 'leaf');
  add(1010, 600, 22, 'leafAut'); add(820, 640, 18, 'leaf'); add(430, 630, 20, 'leaf'); add(260, 600, 17, 'leafGold'); add(1200, 610, 20, 'leaf'); add(1340, 640, 18, 'leafAut');
  for (let y = 60; y < VH + 40; y += R.i(26, 36)) add(PALI + 26 + R.i(-4, 6), y, R.i(18, 26), R() < .5 ? 'leafDark' : 'leaf', R() < .4 ? 'pine' : 'round', false);
  add(GY.x0 + 20, GY.y0 + 40, 16, 'leaf', 'dead', true); add(GY.x1 - 16, GY.y1 - 30, 14, 'leaf', 'dead', true); add(HILL.x0 + 20, HILL.y - 26, 15, 'leaf', 'dead', true);
})();
const VPROPS = [];
function buildVillageProps() {
  if (VPROPS.length) return VPROPS; const R = RNG(5151);
  const ok = (x, y, pad = 0) => { if (vSurface(x, y) !== 'grass' || vBlocked(x, y)) return false; for (const d of DOORS) if (Math.hypot(d.x - x, d.y - y) < 34) return false; if (Math.hypot(x - WELL.x, (y - WELL.y) * 1.3) < 90) return false; if (x > 210 && x < 300 && y > 355 && y < 420) return false; if (y > 550 && y < 660 && x > 210 && x < 1140) return false; for (const p of VPROPS) if (Math.hypot(p.x - x, p.y - y) < pad + p.r) return false; return true; };
  const put = (kind, x, y, r, extra = {}) => { if (ok(x, y, r)) VPROPS.push(Object.assign({ kind, x, y, r, seed: VPROPS.length + 70, pal: R.pick(['leaf', 'leaf', 'leaf', 'leafGold', 'leafAut']) }, extra)); };
  // hedges behind and beside buildings
  for (const k of ['house', 'merchant', 'smith']) { const b = B[k]; for (let x = b.x - 14; x < b.x + b.w + 18; x += R.i(12, 18)) put('bush', x, b.y - b.depth - 2 + R.i(-2, 4), R.i(7, 10), { pal: 'leaf' }); put('bush', b.x - 12, b.y - 6, 8); put('bush', b.x + b.w + 12, b.y - 4, 9); }
  // bushes along paths and edges
  for (let i = 0; i < 46; i++) { const cx = R.r(170, PALI - 20), cy = R.r(110, VH - 30), pal = R.pick(['leaf', 'leaf', 'leafGold', 'leafAut', 'leaf']); const n = R.i(3, 7); for (let k = 0; k < n; k++) put('bush', cx + R.r(-22, 22), cy + R.r(-12, 12), R.i(6, 11), { pal: R() < .75 ? pal : 'leaf' }); if (R() < .4) put('rock', cx + R.r(-26, 26), cy + R.r(-10, 14), R.i(6, 9)); }
  for (let i = 0; i < 10; i++) put(R() < .5 ? 'stump' : 'log', R.r(170, PALI - 20), R.r(110, VH - 30), 10);
  for (let i = 0; i < 4; i++) put('hay', 260 + i * 260 + R.i(-20, 20), 548 + R.i(-6, 0), 9);
  put('hay', 1180, 560, 9); put('hay', 1196, 572, 9);
  return VPROPS;
}
function drawVProp(p) {
  const pal = PAL[p.pal];
  if (p.kind === 'bush') tdBush(p.x, p.y, p.r, pal, p.seed);
  else if (p.kind === 'rock') tdRock(p.x, p.y, p.r * .8, PAL.stone, p.seed);
  else if (p.kind === 'stump') { const x = p.x, y = p.y; tdShadowRect(x - 5, y - 1, 13, 3); pEll(OLC, x, y - 4, 7, 5); P(OLC, x - 7, y - 7, 15, 4); P('#8a5434', x - 6, y - 7, 13, 6); P('#a86a40', x - 6, y - 7, 3, 6); pEll(OLC, x, y - 8, 7, 3); pEll('#e0b878', x, y - 8, 6, 2.2); pEll('#c09060', x, y - 8, 3, 1.2); P('#5aa03a', x + 4, y - 2, 3, 2); }
  else if (p.kind === 'log') { const x = p.x, y = p.y; tdShadowRect(x - 10, y - 1, 24, 3); P(OLC, x - 12, y - 9, 24, 9); P('#8a5434', x - 11, y - 8, 22, 7); P('#b07a4a', x - 11, y - 8, 22, 2); P('#6a4030', x - 11, y - 3, 22, 1); pEll(OLC, x + 11, y - 4.5, 4, 5); pEll('#e0b878', x + 11, y - 4.5, 3, 4); pEll('#b08050', x + 11, y - 4.5, 1.5, 2); P('#5aa03a', x - 6, y - 9, 6, 1); P('#88c848', x - 5, y - 10, 3, 1); }
  else if (p.kind === 'hay') { const x = p.x, y = p.y; tdShadowRect(x - 8, y - 1, 20, 4); pEll(OLC, x, y - 7, 11, 8); pEll('#d8a840', x, y - 7, 10, 7); pEll('#f0c860', x - 2, y - 9, 6, 4); for (let i = -8; i < 9; i += 3) P('#b08030', x + i, y - 9 + Math.abs(i) * .2, 1, 5); P('#8a5a2a', x - 10, y - 7, 20, 1); }
}
/* ---------- ground layer (cached) ---------- */
function buildVillageGround() {
  return Cache.get('v_ground', VW, VH, () => {
    const R = RNG(1234), G = PAL.grass;
    tdGroundFill(G, 0, 0, VW, VH, R, 1);
    // farmland south
    for (let f = 0; f < 3; f++) { const fx = 220 + f * 330, fy = 560, fw = 230, fh = 90; P(PAL.dirt.edge, fx - 2, fy - 2, fw + 4, fh + 4); P(PAL.mud.base, fx, fy, fw, fh); for (let y = fy + 4; y < fy + fh; y += 9) { P(PAL.mud.dk2, fx, y + 4, fw, 2); P(PAL.mud.lt, fx, y, fw, 1); for (let x = fx + 4; x < fx + fw - 4; x += 7) { const c = f === 1 ? ['#f0c040', '#e8a020'] : f === 2 ? ['#e86040', '#c03a2a'] : ['#7ac040', '#5a9a30']; P('#3a6a2a', x, y - 1, 3, 3); P(c[0], x, y - 3, 2, 2); P(c[1], x + 1, y - 2, 2, 1); } } }
    // hill plateau (cathedral)
    const hx0 = HILL.x0, hx1 = HILL.x1, hy = HILL.y;
    P(OLC, hx0 - 2, 60, hx1 - hx0 + 4, hy - 58); tdGroundFill(PAL.grass, hx0, 60, hx1 - hx0, hy - 60, R, .7);
    ctx.globalAlpha = .15; P('#fff8c0', hx0, 60, hx1 - hx0, hy - 60); ctx.globalAlpha = 1;
    tdCobbles((hx0 + hx1) / 2, hy - 20, 100, 14, PAL.stone, R);
    // cliff face
    for (let x = hx0 - 2; x < hx1 + 2; x += 2) { const h = HILL.face + Math.round(noise1(x * .2) * 2); for (let y = 0; y < h; y++) { const k = y / h; P(k < .12 ? '#d8ccc0' : mix('#a89088', '#5a4858', k), x, hy + y, 2, 1); } if (R() < .25) P('#4a3a4a', x, hy + R.i(4, 16), 2, R.i(2, 5)); }
    P(OLC, hx0 - 2, hy + HILL.face, hx1 - hx0 + 4, 2); ctx.globalAlpha = .3; P('#1e2040', hx0 - 2, hy + HILL.face + 2, hx1 - hx0 + 4, 5); ctx.globalAlpha = 1;
    for (let x = hx0; x < hx1; x += R.i(6, 14)) { P('#5a9a3a', x, hy - 1, R.i(3, 7), 2); P('#88c848', x + 1, hy - 2, 2, 1); } // grass lip
    for (let i = 0; i < 6; i++) { const yy = hy + i * 4; stoneTexture('#c8bcb0', HILL.stairX0 + 2, yy, HILL.stairX1 - HILL.stairX0 - 4, 4, R, 8, 4); P('#7a6e70', HILL.stairX0 + 2, yy + 3, HILL.stairX1 - HILL.stairX0 - 4, 1); }
    P(OLC, HILL.stairX0, hy, 2, HILL.face + 2); P(OLC, HILL.stairX1 - 2, hy, 2, HILL.face + 2);
    // ivy on cliff
    for (let i = 0; i < 18; i++) { const x = hx0 + R() * (hx1 - hx0); if (x > HILL.stairX0 - 4 && x < HILL.stairX1 + 4) continue; for (let k = 0; k < R.i(4, 14); k++) P(R() < .5 ? '#4a8a3a' : '#2e6a3a', x + R.i(-1, 1), hy + k, 2, 1); }
    // paths
    tdPath([[1125, hy + HILL.face + 2], [1125, 330], [1120, 420], [1118, 482]], 26, PAL.dirt, R);
    tdPath([[300, 342], [302, 400], [330, 470]], 20, PAL.dirt, R);
    tdPath([[690, 340], [680, 400], [640, 470]], 20, PAL.dirt, R);
    tdPath([[896, 392], [900, 440], [880, 482]], 22, PAL.dirt, R);
    tdPath([[1316, 410], [1318, 450], [1300, 488]], 16, PAL.dirt, R);
    tdPath(ROAD, 34, PAL.dirt, R);
    // plaza
    tdCobbles(WELL.x, WELL.y + 4, 74, 40, PAL.stone, R);
    // river
    for (let y = 0; y < VH; y++) { const a = RIVER.x0(y), b = RIVER.x1(y); P(PAL.water.edge, a - 4, y, 4, 1); P(PAL.water.edge, b, y, 4, 1); P(PAL.water.dk, a, y, b - a, 1); P(PAL.water.base, a + 4, y, b - a - 10, 1); P(PAL.water.dk2, a + (b - a) * .45, y, (b - a) * .15, 1); P('#d8c090', a - 7, y, 3, 1); P('#d8c090', b + 4, y, 3, 1); }
    for (let y = 0; y < VH; y += 2) { const a = RIVER.x0(y), b = RIVER.x1(y); ctx.globalAlpha = .35; P('#1e3a5a', a, y, 6, 2); ctx.globalAlpha = 1; if (R() < .3) tdTuft(a - 6, y, PAL.grass, R); if (R() < .3) tdTuft(b + 6, y, PAL.grass, R); }
    for (let i = 0; i < 14; i++) { const y = R() * VH, x = R() < .5 ? RIVER.x0(y) + 2 : RIVER.x1(y) - 6; tdRock(x, y, R.r(3, 6), PAL.stone, i); }
    // lily pads
    for (let i = 0; i < 16; i++) { const y = R() * VH, x = lerp(RIVER.x0(y), RIVER.x1(y), R.r(.15, .85)); if (y > RIVER.bridgeY0 - 10 && y < RIVER.bridgeY1 + 10) continue; pEll('#2a6a4a', x, y + 1, 5, 3); pEll('#5aa84a', x, y, 5, 3); P('#88d060', x - 2, y - 1, 2, 1); P(PAL.water.dk, x, y, 3, 1); if (R() < .3) { P('#f8a0c0', x - 1, y - 2, 3, 2); P('#fff', x, y - 2, 1, 1); } }
    // bridge deck
    const by0 = RIVER.bridgeY0, by1 = RIVER.bridgeY1, bx0 = 50, bx1 = 172;
    tdShadowRect(bx0, by1, bx1 - bx0, 5, .35);
    P(OLC, bx0 - 1, by0 - 1, bx1 - bx0 + 2, by1 - by0 + 2);
    for (let x = bx0; x < bx1; x += 6) { const c2 = R.pick(['#b8784a', '#a86a40', '#c08450']); P(c2, x, by0, 5, by1 - by0); P('#e0a868', x, by0, 5, 1); P('#7a4a30', x + 5, by0, 1, by1 - by0); if (R() < .4) P('#7a4a30', x + 2, by0 + R.i(6, 28), 1, 1); }
    P('#5a3428', bx0, by0 + 6, bx1 - bx0, 1); P('#5a3428', bx0, by1 - 7, bx1 - bx0, 1);
    // north railing (behind the walker)
    for (let x = bx0; x <= bx1; x += 20) { P(OLC, x - 1, by0 - 12, 5, 13); P('#9a6440', x, by0 - 11, 3, 11); } P(OLC, bx0, by0 - 11, bx1 - bx0 + 3, 4); P('#c08450', bx0, by0 - 10, bx1 - bx0 + 3, 2);
    // dock west of river
    P(OLC, 20, 438, 40, 16); for (let x = 21; x < 60; x += 5) { P('#a86a40', x, 439, 4, 14); P('#d09a60', x, 439, 4, 1); } tdShadowRect(20, 454, 40, 3);
    // garden plot beside house
    P(PAL.dirt.edge, 214, 362, 84, 52); P(PAL.mud.base, 216, 364, 80, 48); for (let y = 368; y < 410; y += 8) { P(PAL.mud.dk2, 216, y + 4, 80, 2); for (let x = 220; x < 292; x += 8) { P('#3a7a2a', x, y - 1, 4, 4); P('#6ac040', x + 1, y - 2, 2, 2); P('#a8e060', x + 1, y - 2, 1, 1); } }
    // flowers & tufts everywhere on grass
    const onRoad = (x, y) => vSurface(x, y) !== 'grass';
    for (let i = 0; i < 420; i++) { const x = R() * VW, y = 80 + R() * (VH - 80); if (onRoad(x, y) || (x > RIVER.x0(y) - 8 && x < RIVER.x1(y) + 8)) continue; if (R() < .2) tdFlowers(x, y, R, ['#ffffff', '#f8e060', '#f890c0', '#a8c8ff', '#ff8a60'], R.i(2, 5)); else tdTuft(x, y, PAL.grass, R, R() < .3); }
    // ground shadows of buildings (cast down-right)
    for (const k in B) { const b = B[k]; ctx.globalAlpha = .3; pPoly('#1e2040', [[b.x + 6, b.y + 2], [b.x + b.w + 6, b.y + 2], [b.x + b.w + 20, b.y - b.depth * .6], [b.x + b.w + 6, b.y - b.depth]]); ctx.globalAlpha = 1; }
    for (const t of VTREES) if (t.kind !== 'dead') tdTreeShadow(t.x, t.y, t.r); else tdTreeShadow(t.x, t.y, t.r * .5);
    // graveyard ground: darker, mossy
    ctx.globalAlpha = .35; P('#2e4a3a', GY.x0, GY.y0, GY.x1 - GY.x0, GY.y1 - GY.y0); ctx.globalAlpha = 1;
    for (let i = 0; i < 40; i++) P(R.pick(['#3a5a3a', '#5a7a4a', '#2a4030']), GY.x0 + R() * (GY.x1 - GY.x0), GY.y0 + R() * (GY.y1 - GY.y0), R.i(2, 5), 1);
    // palisade gate ground: worn dirt patch
    pEll(PAL.dirt.dk, PALI - 6, 487, 30, 20); pEll(PAL.dirt.base, PALI - 6, 487, 26, 17);
    // rocks scattered
    for (let i = 0; i < 26; i++) { const x = R() * VW, y = 90 + R() * (VH - 120); if (onRoad(x, y) || vBlocked(x, y)) continue; tdRock(x, y, R.r(3, 7), PAL.stone, 100 + i); }
  });
}
/* ---------- building art ---------- */
function buildVillageBuildings() {
  const house = tdBuilding('house', { w: B.house.w, wallH: B.house.wallH, roofH: B.house.roofH, roof: 'thatch', motif: true, roofCol: '#c89048', wall: 'timber', beams: [68], braces: [10, 108], windows: [[18, 12, 16, 14], [104, 12, 16, 14]], flowerBox: true, door: [86, 16, 26, '#8a5030'], chimney: [104, 22], seed: 3 });
  const merchant = tdBuilding('merchant', { w: B.merchant.w, wallH: B.merchant.wallH, roofH: B.merchant.roofH, roof: 'tile', roofCol: '#c8583a', wall: 'wood', wallCol: '#b87a4a', windows: [[18, 12, 22, 14], [118, 12, 22, 14]], door: [80, 18, 30, '#6a3a24'], seed: 5,
    extra: (c, x0, yR, yW, yB) => { /* hanging sign */ P(OLC, x0 + 52, yW + 6, 22, 12); P('#e8d0a0', x0 + 53, yW + 7, 20, 10); pCirc('#c8583a', x0 + 58, yW + 12, 3); pCirc('#f0c040', x0 + 66, yW + 12, 3); } });
  const smith = tdBuilding('smith', { w: B.smith.w, wallH: B.smith.wallH, roofH: B.smith.roofH, roof: 'slate', roofCol: '#5a6a8a', wall: 'stone', wallCol: '#9a9298', windows: [[124, 12, 18, 12]], door: [60, 20, 30, '#5a3a24'], chimney: [130, 30], seed: 7,
    extra: (c, x0, yR, yW, yB) => { // open forge bay
      P(OLC, x0 + 8, yW + 8, 44, yB - yW - 12); P('#2a1a1e', x0 + 10, yW + 10, 40, yB - yW - 14); stoneTexture('#8a4a3a', x0 + 14, yB - 26, 30, 22, RNG(2), 5, 3); P('#1a0e0e', x0 + 20, yB - 20, 18, 12); P('#5a3428', x0 + 10, yW + 10, 40, 3); } });
  const cath = tdBuilding('cath', { w: B.cath.w, wallH: B.cath.wallH, roofH: B.cath.roofH, roof: 'slate', roofCol: '#6a5a7a', wall: 'stone', wallCol: '#c4bcc0', door: [76, 28, 40, '#6a3a24'], arch: true, top: 120, seed: 9,
    extra: (c, x0, yR, yW, yB, R) => {
      // buttresses
      for (const bx of [-2, 60, 116, 176]) { P(OLC, x0 + bx - 1, yW + 10, 8, yB - yW - 10); stoneTexture('#a8a0a8', x0 + bx, yW + 11, 6, yB - yW - 12, R, 6, 4); P('#e0dce0', x0 + bx, yW + 11, 6, 1); }
      // bell tower (right) rising above the roof
      const tx = x0 + 132, tw = 40, ty = 18; P(OLC, tx - 1, ty - 1, tw + 2, yB - ty + 1); stoneTexture('#c8c0c4', tx, ty, tw, yB - ty, R, 9, 7); ctx.globalAlpha = .25; P('#1e1840', tx + tw - 8, ty, 8, yB - ty); ctx.globalAlpha = 1;
      P(OLC, tx + 10, ty + 14, 20, 22); P('#1a1424', tx + 11, ty + 15, 18, 20); pEll(OLC, tx + 20, ty + 15, 10, 6); pEll('#1a1424', tx + 20, ty + 15, 9, 5);
      pPoly(OLC, [[tx - 5, ty + 1], [tx + tw / 2, ty - 18], [tx + tw + 5, ty + 1]]); pPoly('#6a5a7a', [[tx - 3, ty], [tx + tw / 2, ty - 16], [tx + tw + 3, ty]]); pPoly('#8a7a9a', [[tx - 1, ty - 1], [tx + tw / 2, ty - 15], [tx + tw / 2, ty - 1]]);
      P('#f0c860', tx + tw / 2 - 1, ty - 28, 2, 12); P('#f0c860', tx + tw / 2 - 4, ty - 24, 8, 2);
      // stained glass frames (glass drawn live)
      for (const wx of [18, 44, 104]) { P(OLC, x0 + wx - 1, yW + 18, 12, 30); pEll(OLC, x0 + wx + 5, yW + 18, 6, 5); }
      P(OLC, x0 + 78, yW + 2, 26, 26);
    } });
  return { house, merchant, smith, cath };
}
/* ---------- villagers ---------- */
const VILLAGER_LOOKS = {
  farmer: { skin: '#e0a878', hair: '#6a4a2a', hairStyle: 'short', hat: 'straw', top: '#6a8a3a', pants: '#5a4a3a', boots: '#3a2a1a', belt: '#5a3a1a', weapon: 'pitchfork', body: 'round', seed: 11, beard: '#6a4a2a' },
  old: { skin: '#f0c8a8', hair: '#e8e0d8', hairStyle: 'bun', top: '#a85a8a', robe: '#7a4a7a', pants: '#4a3a4a', boots: '#2a1a1a', weapon: 'cane', body: 'round', seed: 12, s: .92 },
  child: { skin: '#f4cfa6', hair: '#d8902a', hairStyle: 'spiky', top: '#e05a4a', pants: '#3a5a9a', boots: '#3a2a1a', belt: '#3a2a1a', child: true, s: .72, seed: 13 },
  gossipA: { skin: '#e8b48a', hair: '#5a2a1a', hat: 'scarf', hatC: '#d04a6a', top: '#c86a4a', robe: '#a85a4a', pants: '#3a2a2a', boots: '#2a1a1a', seed: 14 },
  gossipB: { skin: '#c8885a', hair: '#2a1c18', hairStyle: 'curly', top: '#3a8ad0', robe: '#2a6aa8', pants: '#3a2a2a', boots: '#2a1a1a', seed: 15, body: 'round' },
  guard: { skin: '#e8b48a', hair: '#3a2a1a', hairStyle: 'short', hat: 'helmet', tier: 2, top: '#8a929c', weapon: 'spear', seed: 16 },
  guard2: { skin: '#9a6440', hair: '#2a1c18', hairStyle: 'short', hat: 'helmet', tier: 2, top: '#8a929c', weapon: 'spear', seed: 17, body: 'lanky' },
  guard3: { skin: '#f4cfa6', hair: '#8a2a1a', hairStyle: 'short', hat: 'helmet', tier: 2, top: '#8a929c', weapon: 'spear', seed: 18, beard: '#8a2a1a', body: 'round' },
  baker: { skin: '#f0c49a', hair: '#e8e0d0', hairStyle: 'short', top: '#f0e8d8', apron: '#e0d8c8', pants: '#6a5a4a', boots: '#3a2a1a', seed: 19, body: 'round' },
  fisher: { skin: '#c8885a', hair: '#3a3a3a', hairStyle: 'short', hat: 'cap', hatC: '#3a6a8a', top: '#4a7a9a', pants: '#4a4a3a', boots: '#2a2a2a', seed: 20, beard: '#5a5a5a' }
};
function makeVillagers() {
  const V = [], add = (kind, x, y, area, o = {}) => V.push(Object.assign({ kind, x, y, area, home: o.home || [x, y], dir: 1, state: 'IDLE', t: rnd(1, 3), speed: o.speed || 14, walk: 0, talk: o.talk || kind, voice: o.voice || 'farmer', look: VILLAGER_LOOKS[o.look || kind], vis: 1, tx: x, ty: y, bub: 0, wave: 0 }, o));
  const door = id => { const d = DOORS.find(q => q.id === id); return [d.x, d.y + 4]; };
  add('farmer', 260, 420, [222, 400, 300, 440], { voice: 'farmer', home: door('house') });
  add('old', 560, 440, [440, 400, 600, 470], { voice: 'old', speed: 7, home: door('house'), sits: [588, 450] });
  add('child', 440, 520, [200, 360, 900, 540], { voice: 'child', speed: 30, home: door('merchant') });
  add('gossipA', 640, 372, [610, 350, 720, 400], { voice: 'gossip', home: door('merchant'), pair: 'gossipB' });
  add('gossipB', 668, 376, [620, 352, 730, 402], { voice: 'gossip', home: door('merchant'), pair: 'gossipA' });
  add('guard', 1370, 456, [1362, 452, 1380, 458], { voice: 'guard', look: 'guard', speed: 8, guard: true, post: true });
  add('guard', 900, 500, [200, 470, 1350, 506], { voice: 'guard', look: 'guard2', speed: 12, guard: true, patrol: true });
  const b = S.bosses; if (b.barnaby) add('baker', 780, 370, [748, 356, 810, 400], { voice: 'merchant', talk: 'gossipB', home: door('merchant') });
  if (b.gloomfang) add('fisher', 40, 446, [26, 442, 56, 450], { voice: 'farmer', talk: 'farmer', home: [4, 446], speed: 5, rod: true });
  if (b.timmy) add('guard', 1200, 520, [1000, 440, 1360, 530], { voice: 'guard', look: 'guard3', speed: 10, guard: true, patrol: true });
  return V;
}
function vMove(e, dx, dy) { // axis-separated slide; returns true if moved at all
  let moved = false; const nx = e.x + dx, ny = e.y + dy;
  if (!vBlocked(nx, e.y)) { e.x = nx; moved = true; } if (!vBlocked(e.x, ny)) { e.y = ny; moved = true; } return moved;
}
Scenes.village = { hd: true,
  timeRuns: true,
  enter(a) {
    this.ground = buildVillageGround(); this.bld = buildVillageBuildings(); this.vill = makeVillagers();
    const from = a.from || 'gate'; const door = DOORS.find(d => d.id === from);
    let px = 300, py = 352;
    if (door) { px = door.x + (from === 'gate' ? -26 : 0); py = door.y + (from === 'gate' ? 0 : 14); }
    if (a.from === 'revive') { px = 1120; py = 252; }
    if (from === 'load' && S.posY) { px = S.pos; py = S.posY; }
    if (vBlocked(px, py)) { px = 300; py = 352; }
    this.P = { x: px, y: py }; this.pdir = from === 'gate' ? -1 : 1; this.walkPh = 0; this.moving = false; this.target = null; this.pendingAct = null; this.stepAcc = 0; this.idleT = 0; this.stopSettle = 0; this.stuck = 0;
    Cam.reset(clamp(px, 320, VW - 320), clamp(py - 10, 180, VH - 180), 1); Cam.follow = 3.2;
    this.chickens = []; for (let i = 0; i < 5; i++) this.chickens.push({ x: 380 + i * 34, y: 420 + (i % 2) * 22, z: 0, vz: 0, dir: 1, st: 'peck', t: rnd(2), flee: 0, fx: 0, fy: 0 });
    this.cat = { x: 770, y: 344, st: 'sleep', t: 4, dir: -1, look: 0 };
    this.birdPerches = [[B.smith.x + 100, B.smith.y - B.smith.wallH - B.smith.roofH + 10], [B.merchant.x + 90, B.merchant.y - B.merchant.wallH - B.merchant.roofH + 10], [B.house.x + 70, B.house.y - B.house.wallH - B.house.roofH + 10], [B.merchant.x + 40, B.merchant.y - B.merchant.wallH - B.merchant.roofH + 10]];
    this.bird = { perch: 0, x: this.birdPerches[0][0], y: this.birdPerches[0][1], fly: 0, t: 5, from: 0, to: 0 };
    this.crows = [[GY.x0 + 40, GY.y0 + 60], [PALI - 4, 440]].map(h => ({ x: h[0], y: h[1], home: h, fly: 0, vx: 0, vy: 0, t: 0 }));
    this.butter = []; for (let i = 0; i < 8; i++) this.butter.push({ x: rnd(200, 1000), y: rnd(340, 560), p: rnd(10), c: pick(['#f8e060', '#f8a0c0', '#a0d8ff', '#fff']) });
    this.fireflies = []; for (let i = 0; i < 26; i++) this.fireflies.push({ x: rnd(0, VW), y: rnd(100, VH), p: rnd(10) });
    this.fishes = [{ y: 300, d: 1, t: 0 }, { y: 600, d: -1, t: 2 }];
    this.raidCheckedDay = -1; this.raiding = 0;
    this.setMusic(); Amb.set('village');
    if (from === 'new') Later.add(.9, () => Dialog.start([D(S.name, 'player', 'Placenta Creek. Home. It smells of turnips and minor grievances.'), D(S.name, 'player', 'The priest wanted a word. Something about a missing reliquary. The cathedral\'s up on the hill.'), D('', 'narrator', 'Tap the ground to walk (hold to steer). Tap a door or a person to go and use it. The gate on the far east leads out.')]));
    if (from === 'ng') Later.add(.9, () => Dialog.start([D(S.name, 'player', 'Placenta Creek again. Everything feels familiar. Stronger monsters, same turnips.')]));
    if (a.raidWon) Later.add(.7, () => { Dialog.start([D('Guard', 'guard', pick(['That\'s the last of them. Nice work. I\'ll be writing a strongly worded report to the forest.', 'You saved the chickens. Well. Most of the chickens. One chicken\'s gone missing but he was always like that.', 'Raid repelled. The gossips will be talking about this for weeks. Mostly about your hair.']))]); });
    Post.letter = 0;
  },
  setMusic() { this.night = World.isNight(); Music.play(this.night ? 'village_night' : 'village_day', 3); },
  exit() { S.pos = Math.round(this.P.x); S.posY = Math.round(this.P.y); Cam.follow = 6; },
  nearestTarget() {
    let best = null, bd = 22; const p = this.P;
    for (const d of DOORS) { const dd = Math.hypot(d.x - p.x, (d.y - p.y) * 1.3); if (dd < bd) { bd = dd; best = { type: 'door', d }; } }
    for (const v of this.vill) { if (!v.vis) continue; const dd = Math.hypot(v.x - p.x, (v.y - p.y) * 1.5); if (dd < Math.min(bd, 22)) { bd = dd; best = { type: 'npc', v }; } }
    return best;
  },
  interact(tgt) {
    if (!tgt || Dialog.open) return;
    if (tgt.type === 'door') { const d = tgt.d; SFX.play('door'); if (d.scene === 'overworld') Scene.go('overworld', { from: 'village' }, { type: 'fade', out: .5, in: .6 }); else Scene.go(d.scene, {}, { type: 'door', out: .22, in: .28 }); return; }
    const v = tgt.v; v.state = 'TALK_P'; v.t = 99; v.dir = this.P.x < v.x ? -1 : 1; this.pdir = -v.dir;
    const pool = (VILLAGER_TALK[v.talk] || VILLAGER_TALK.farmer).filter(e => !e[2] || e[2](S)); S.talk[v.talk] = ((S.talk[v.talk] || 0) + 1); const L = pool[S.talk[v.talk] % pool.length];
    const lines = [D(L[0], v.voice, L[1])];
    if (v.kind === 'guard' && S.bosses.timmy && !S.quests.survey) { lines.push(D('Guard', 'guard', 'Say — the Crown surveyor lost his maps in that hedge maze. Bring back 3 Map Scraps and he\'ll pay. He\'s very embarrassed.')); lines.push(D('', 'narrator', '', { fx: () => Quests.start('survey'), t: 'Quest accepted: The Surveyor\'s Folly.' })); }
    if (v.kind === 'guard' && S.quests.survey && S.quests.survey.state === 'ready') { lines.push(D('Guard', 'guard', 'Map scraps! The surveyor will weep. He weeps a lot, actually.', { fx: () => Quests.complete('survey') })); }
    Dialog.start(lines, () => { v.state = 'IDLE'; v.t = 1.5; });
  },
  worldMouse() { if (HD.live) return HD.unproject(Input.mouse.lx, Input.mouse.ly); return [Input.mouse.lx - CONFIG.LW / 2 + Cam.x, Input.mouse.ly - CONFIG.LH / 2 + Cam.y]; },
  pickAt(wx, wy) {
    for (const v of this.vill) if (v.vis && Math.abs(v.x - wx) < 11 && wy > v.y - 40 && wy < v.y + 6) return { type: 'npc', v };
    for (const d of DOORS) { if (d.id === 'gate') { if (wx > PALI - 40 && wy > 440 && wy < 530) return { type: 'door', d }; continue; } const b = d.id === 'cathedral' ? B.cath : B[d.id]; if (wx > b.x - 4 && wx < b.x + b.w + 4 && wy > b.y - b.wallH - b.roofH - 10 && wy < b.y + 6) return { type: 'door', d }; if (Math.hypot(wx - d.x, wy - d.y) < 16) return { type: 'door', d }; }
    return null;
  },
  update(dt) {
    const night = World.isNight(); if (night !== this.night) this.setMusic();
    if (Dialog.open || Scene.transitioning || Overlays.stack.length) { this.moving = false; this.updateLife(dt); return; }
    const p = this.P;
    // TAP / CLICK TO WALK in 2D. Tap the ground to walk there (hold to steer); tap a door or a person to walk over and use it.
    const onUI = UI.prevHover || Input.mouse.y < 90 || (Input.mouse.x > 1210 && Input.mouse.y > 660);
    if ((Input.mouse.clicked || (Input.mouse.down && this.steer)) && !onUI) {
      const [wx, wy] = this.worldMouse(); let hit = null;
      if (Input.mouse.clicked) { hit = this.pickAt(wx, wy); this.steer = !hit; }
      let tx = wx, ty = wy;
      if (hit) { if (hit.type === 'npc') { tx = hit.v.x - Math.sign(hit.v.x - p.x || 1) * 14; ty = hit.v.y; } else { tx = hit.d.x; ty = hit.d.y + 6; } }
      const hd = hit ? Math.hypot((hit.type === 'npc' ? hit.v.x : hit.d.x) - p.x, ((hit.type === 'npc' ? hit.v.y : hit.d.y) - p.y) * 1.3) : 99;
      if (hit && hd <= 20) { this.target = null; this.pendingAct = null; this.interact(hit); }
      else { this.target = [clamp(tx, 10, VW - 10), clamp(ty, 72, VH - 16)]; this.stuck = 0; if (Input.mouse.clicked) { this.pendingAct = hit; Particles.spawn({ x: this.target[0], y: this.target[1], type: 'ring', c: hit ? '#f0d890' : '#fff4c0', life: .4, size: 1, drag: 1 }); } }
    }
    if (!Input.mouse.down) this.steer = false;
    let mvx = 0, mvy = 0;
    if (this.target) { const dx = this.target[0] - p.x, dy = this.target[1] - p.y, d = Math.hypot(dx, dy); if (d < 2.5) { this.target = null; if (this.pendingAct) { const a = this.pendingAct; this.pendingAct = null; this.interact(a); } } else { mvx = dx / d; mvy = dy / d; } }
    const speed = 64 * (World.rain > .5 ? 1.1 : 1);
    if (mvx || mvy) {
      const ox = p.x, oy = p.y; vMove(p, mvx * speed * dt, mvy * speed * .85 * dt); const prog = Math.hypot(p.x - ox, p.y - oy);
      if (prog < speed * dt * .25) { this.stuck += dt; if (this.stuck > .35) { this.target = null; if (this.pendingAct && this.pendingAct.type === 'door' && Math.hypot(this.pendingAct.d.x - p.x, this.pendingAct.d.y - p.y) < 30) this.interact(this.pendingAct); this.pendingAct = null; } } else this.stuck = 0;
      if (Math.abs(mvx) > .2) this.pdir = Math.sign(mvx); this.walkPh += dt * 11; this.moving = true; this.idleT = 0;
      this.stepAcc += dt; if (this.stepAcc > .27) { this.stepAcc = 0; const surf = vSurface(p.x, p.y); SFX.play('step', { surf, v: .8 }); Particles.spawn({ x: p.x - mvx * 3, y: p.y - 1, vx: -mvx * 8, vy: -4, life: .4, c: surf === 'water' ? '#a8c8e8' : surf === 'grass' ? '#a8d060' : '#d8b080', type: 'smoke', size: 1.5, drag: .92 }); }
    } else { if (this.moving) this.stopSettle = .15; this.moving = false; this.idleT += dt; }
    this.stopSettle = Math.max(0, this.stopSettle - dt);
    Cam.tx = clamp(p.x + this.pdir * 24, 320, VW - 320); Cam.ty = clamp(p.y - 14, 180, VH - 180);
    this.updateLife(dt);
    this.checkRaid(dt);
  },
  checkRaid(dt) {
    if (this.raiding) { this.raiding -= dt; if (this.raiding <= 0) { const base = S.bosses.timmy && chance(.5) ? 'skarcher' : 'zwolf'; Scene.go('combat', { raid: true, enemy: base }, { type: 'bars', out: .6, in: .5 }); } return; }
    if (!S.bosses.gloomfang || !World.isNight() || S.lastRaidDay === S.day || this.raidCheckedDay === S.day) return;
    if (S.time > 21 || S.time < 4) { this.raidCheckedDay = S.day; if (chance(.4)) { S.lastRaidDay = S.day; this.raiding = 3.2; SFX.play('raid'); Music.sting('raid'); Banner.show('VILLAGE RAIDED', 'Something is coming over the palisade.', COL.red, 2.8); for (const v of this.vill) { v.state = v.guard ? 'RUN_GATE' : 'FLEE'; v.t = 5; } } }
  },
  walkTo(v, tx, ty, sp, dt) { const dx = tx - v.x, dy = ty - v.y, d = Math.hypot(dx, dy); if (d < 2.5) { v.walk = null; return true; } const ok = vMove(v, dx / d * sp * dt, dy / d * sp * .85 * dt); if (Math.abs(dx) > 1) v.dir = Math.sign(dx); v.walk = (v.walk || 0) + dt * (sp > 20 ? 14 : 9); if (!ok) { v.blocked = (v.blocked || 0) + dt; if (v.blocked > .6) { v.blocked = 0; return true; } } return false; },
  updateLife(dt) {
    const night = World.isNight(), rain = World.rain > .5, p = this.P;
    for (const v of this.vill) {
      v.t -= dt; v.bub = Math.max(0, v.bub - dt); v.wave = Math.max(0, v.wave - dt);
      const goHome = (night && !v.guard) || (rain && !v.guard && v.kind !== 'child') || v.state === 'FLEE';
      if (v.state === 'TALK_P') { v.walk = null; continue; }
      if (v.state === 'RUN_GATE') { this.walkTo(v, 1360, 486, 60, dt); continue; }
      if (goHome) { if (this.walkTo(v, v.home[0], v.home[1], v.state === 'FLEE' ? 55 : rain ? 30 : v.speed + 6, dt)) { v.vis = 0; v.walk = null; } else v.vis = 1; continue; }
      if (!v.vis) { v.vis = 1; v.x = v.home[0]; v.y = v.home[1] + 6; v.state = 'WALK'; v.tx = rnd(v.area[0], v.area[2]); v.ty = rnd(v.area[1], v.area[3]); }
      const dp = Math.hypot(p.x - v.x, (p.y - v.y) * 1.4);
      if (dp < 34 && v.state !== 'WALK' && v.state !== 'TALK') { if (v.state !== 'LOOK') { v.state = 'LOOK'; v.t = rnd(1.5, 3); if (chance(.35)) v.wave = .8; } v.dir = p.x < v.x ? -1 : 1; v.walk = null; if (v.t <= 0) v.state = 'IDLE'; continue; }
      if (v.t <= 0) {
        const ar = v.area, rp = () => { v.tx = rnd(ar[0], ar[2]); v.ty = rnd(ar[1], ar[3]); };
        if (v.patrol) { v.state = 'WALK'; v.leg = !v.leg; v.tx = v.leg ? ar[2] : ar[0]; v.ty = rnd(ar[1], ar[3]); if (night) rp(); v.t = 99; }
        else if (v.pair) { const o = this.vill.find(x => x.kind === v.pair); if (o && Math.hypot(o.x - v.x, o.y - v.y) < 40 && chance(.6)) { v.state = 'TALK'; v.t = rnd(3, 6); v.dir = o.x < v.x ? -1 : 1; v.bub = 1.2; } else { v.state = 'WALK'; rp(); v.t = 99; } }
        else if (v.sits && chance(.6)) { v.state = 'SIT'; v.tx = v.sits[0]; v.ty = v.sits[1]; v.t = rnd(6, 12); }
        else if (v.kind === 'farmer' && chance(.5)) { v.state = 'WORK'; v.t = rnd(4, 7); }
        else if (v.rod) { v.state = 'FISH'; v.t = rnd(6, 10); v.dir = 1; }
        else if (chance(.55)) { v.state = 'WALK'; rp(); v.t = 99; }
        else { v.state = 'IDLE'; v.t = rnd(1.5, 4); }
      }
      if (v.state === 'WALK' || v.state === 'SIT') { if (this.walkTo(v, v.tx, v.ty, v.speed, dt)) { v.walk = null; if (v.state === 'WALK') { v.state = 'IDLE'; v.t = rnd(1, 3.5); } else v.seated = true; } else v.seated = false; }
      else v.walk = null;
    }
    // chickens
    for (const c of this.chickens) {
      c.t -= dt; c.z = Math.max(0, c.z + c.vz * dt); c.vz -= 400 * dt; if (c.z <= 0) c.vz = Math.max(0, c.vz);
      const dx = c.x - p.x, dy = c.y - p.y;
      if (Math.hypot(dx, dy * 1.4) < 28 && c.flee <= 0) { const d = Math.hypot(dx, dy) || 1; c.flee = 1.4; c.fx = dx / d; c.fy = dy / d; c.dir = Math.sign(dx) || 1; c.vz = 90; if (chance(.7)) SFX.play('cluck', { v: .6 }); Particles.spawn({ x: c.x, y: c.y - 6, vx: rnd(-20, 20), vy: -30, g: 40, life: 1, c: '#f4f0e6', type: 'leaf', drag: .95 }); }
      if (c.flee > 0) { c.flee -= dt; vMove(c, c.fx * 70 * dt, c.fy * 50 * dt); c.st = 'run'; }
      else if (c.t <= 0) { c.t = rnd(1, 3); c.st = chance(.5) ? 'peck' : 'walk'; c.dir = chance(.5) ? 1 : -1; c.wy = rnd(-.6, .6); }
      else if (c.st === 'walk') vMove(c, c.dir * 10 * dt, (c.wy || 0) * 8 * dt);
      c.x = clamp(c.x, 330, 640); c.y = clamp(c.y, 400, 540);
    }
    // cat
    const cat = this.cat; cat.t -= dt; cat.look = Math.hypot(cat.x - p.x, cat.y - p.y) < 40 ? 1 : 0;
    if (cat.t <= 0) { const opts = ['sleep', 'stretch', 'walk', 'lick', 'meow', 'sit']; cat.st = pick(opts); cat.t = cat.st === 'sleep' ? rnd(6, 12) : cat.st === 'walk' ? rnd(2, 4) : rnd(1.5, 3); if (cat.st === 'walk') cat.dir = chance(.5) ? 1 : -1; if (cat.st === 'meow' && Math.abs(cat.x - p.x) < 200) SFX.play('meow', { v: .6 }); }
    if (cat.st === 'walk') cat.x = clamp(cat.x + cat.dir * 12 * dt, 740, 820);
    // rooftop bird
    const b = this.bird; if (b.fly > 0) { b.fly = Math.min(1, b.fly + dt * .8); const [x0, y0] = this.birdPerches[b.from], [x1, y1] = this.birdPerches[b.to]; b.x = lerp(x0, x1, Ease.ioQ(b.fly)); b.y = lerp(y0, y1, b.fly) - Math.sin(b.fly * Math.PI) * 40; if (b.fly >= 1) { b.fly = 0; b.perch = b.to; b.t = rnd(4, 9); } }
    else { b.t -= dt; if (b.t <= 0) { b.from = b.perch; b.to = (b.perch + 1) % this.birdPerches.length; b.fly = .001; } }
    // crows
    for (const c of this.crows) { if (c.fly) { c.x += c.vx * dt; c.y += c.vy * dt; c.vy -= 20 * dt; c.t += dt; if (c.t > 6) { c.fly = 0; c.x = c.home[0]; c.y = c.home[1]; } } else if (Math.hypot(c.x - p.x, c.y - p.y) < 36) { c.fly = 1; c.t = 0; c.vx = (c.x > p.x ? 1 : -1) * 70; c.vy = -60; AMB_EV.crow && Audio.ctx && AMB_EV.crow(Audio.ctx.currentTime, .9); } }
    // smithy hammer (synced sound + sparks)
    const ax = B.smith.x + 150, ay = B.smith.y + 18, sd = Math.hypot(p.x - ax, p.y - ay);
    const hammer = !night && (T % 1.6) < dt && sd < 400; if (hammer) { const vol = clamp(1 - sd / 400, 0, 1); SFX.play('anvil', { v: .15 + vol * .4 }); for (let i = 0; i < 8; i++) Particles.spawn({ x: ax - 4, y: ay - 13, vx: rnd(-50, 50), vy: rnd(-70, -20), g: 160, life: rnd(.3, .6), c: '#ffe080', c2: '#e04010', type: 'spark', glow: 1, ground: ay + rnd(-2, 4) }); if (vol > .7) Cam.shake(.04); }
    const roofTop = (k) => B[k].y - B[k].wallH - B[k].roofH;
    if (chance(dt * 6)) Particles.spawn({ x: B.house.x + 110 + rnd(-2, 2), y: roofTop('house') + 8, vx: 6 + World.wind * 25, vy: -12, life: rnd(2, 3.5), c: '#e0d8d8', type: 'smoke', size: 3, drag: .99 });
    if (chance(dt * 5)) Particles.spawn({ x: B.smith.x + 136 + rnd(-2, 2), y: roofTop('smith') - 4, vx: 5 + World.wind * 25, vy: -14, life: rnd(2, 3.5), c: '#7a7078', type: 'smoke', size: 4, drag: .99 });
    if (chance(dt * (1.5 + World.wind * 6))) Particles.spawn({ x: Cam.x + rnd(-340, 340), y: Cam.y - 190, vx: 12 + World.wind * 40, vy: rnd(14, 26), life: rnd(6, 9), c: pick(['#c8b040', '#e8902a', '#88c040', '#f0c848']), type: 'leaf', rot: rnd(6), vr: rnd(-3, 3), drag: 1, ground: Cam.y + rnd(-120, 180) });
  },
  /* ---------- drawing ---------- */
  draw() {
    const t = T, hd = HD.live; let c = ctx; c.setTransform(1, 0, 0, 1, 0, 0);
    const nk = World.nightK(), night = World.isNight();
    if (hd) {
      HD.begin({ pitch: 44, fov: 42, zs: 'auto', tx: Cam.x - Cam.rx + Cam.sx, ty: Cam.y + Cam.sy, zoom: Cam.zoom + Cam.punch, maxBack: 330, clear: [.09, .16, .1],
        water: typeof Life !== 'undefined' && World.rain > .3 ? Life.rainMask() : HD.waterMask('village', [0, 0, VW, VH], (x, y) => x > RIVER.x0(y) + 3 && x < RIVER.x1(y) - 3 && !(y > RIVER.bridgeY0 - 2 && y < RIVER.bridgeY1 + 2), [.22, .36, .5]),
        fog: [640, 1150, .32 + World.fog * .4], fogC: night ? [.12, .14, .26] : [.72, .8, .9], cloud: nk < .8 ? .2 * (1 - nk) * (1 - World.rain * .5) : 0, dof: [.17, .16, .9, .95], bloom: [.7, night ? .6 : .35], vig: .55, shafts: sunShafts({ base: .8 }), motes: { n: 80 } });
      HD.shimmerAt(B.smith.x + 30, B.smith.y - 10, 20, 34, .6);
      HD.ground(vForestTile(), -900, -700, { w: VW + 1800, h: VH + 1400, rep: true }); HD.ground(this.ground, 0, 0);
      HD.layer('decal'); c = ctx;
    } else { P('#3a6a3a', 0, 0, 640, 360); Cam.apply(c, 1); }
    const vx0 = hd ? HD.view.x0 - 20 : Cam.x - 340, vx1 = hd ? HD.view.x1 + 20 : Cam.x + 340, vy0 = hd ? HD.view.y0 - 10 : Cam.y - 200, vy1 = hd ? HD.view.y1 + 30 : Cam.y + 200;
    if (!hd) c.drawImage(this.ground, 0, 0);
    // river animation
    for (let y = Math.max(0, Math.floor(vy0 / 8) * 8); y < Math.min(VH, vy1); y += Gfx.level > 0 ? 8 : 16) { const a = RIVER.x0(y) + 4, b = RIVER.x1(y) - 4; if (y > RIVER.bridgeY0 - 4 && y < RIVER.bridgeY1) continue; tdShimmer(a, b, y, t * 3, PAL.water, y * 7 + 1); }
    for (const f of this.fishes) { f.t += DT; f.y += f.d * 9 * DT; if (f.y < 80 || f.y > VH - 40) f.d *= -1; if (f.y > RIVER.bridgeY0 - 6 && f.y < RIVER.bridgeY1 + 6) f.y += f.d * 20 * DT; const fx = lerp(RIVER.x0(f.y), RIVER.x1(f.y), .5 + Math.sin(f.t * .7) * .2); c.globalAlpha = .7; P('#e8903a', fx, f.y, 1, 4); P('#f8b860', fx, f.y + (f.d > 0 ? 3 : 0), 1, 1); P('#e8903a', fx - 1, f.y - f.d * 2 + 1, 3, 1); c.globalAlpha = 1; }
    // puddles
    if (World.rain > .3) { c.globalAlpha = World.rain * .55; for (let i = 0; i < 26; i++) { const r = RNG(i + 700), x = r() * VW, y = 100 + r() * (VH - 120); if (x < vx0 || x > vx1 || vSurface(x, y) === 'grass') continue; pEll('#8ab0d8', x, y, r.r(6, 14), r.r(2, 4)); const rp = (t * 1.5 + r()) % 1; c.globalAlpha = World.rain * .5 * (1 - rp); c.strokeStyle = '#d8e8ff'; c.beginPath(); c.ellipse(Math.round(x + r.r(-4, 4)), Math.round(y), rp * 5, rp * 2, 0, 0, TAU); c.stroke(); c.globalAlpha = World.rain * .55; } c.globalAlpha = 1; }
    if (typeof Life !== 'undefined') Life.villageDecal(c, t, vx0, vy0, vx1, vy1, hd);
    if (hd) HD.groundLayer('decal');
    // ---- depth-sorted world objects ----  (key: cache the drawing as a static billboard; true = fn emits HD quads itself)
    const L = []; const add = (y, fn, key, ver, rect, o) => L.push([y, fn, key, ver, rect, o]);
    const bl = (k, o) => { const b = B[k], a = this.bld[o || k]; add(b.y, () => { ctx.drawImage(a.c, b.x - a.ox, b.y - a.oy); if (hd) this.drawWindows(t, nk); }, 'bld' + (o || k), Math.round(nk * 6), [b.x - a.ox, b.y - a.oy, a.c.width, a.c.height]); };
    bl('house'); bl('merchant'); bl('smith'); bl('cath');
    // trees
    const p = this.P;
    for (const tr of VTREES) { if (tr.x < vx0 - 60 || tr.x > vx1 + 60 || tr.y < vy0 - 20 || tr.y > vy1 + 100) continue; add(tr.y, () => { const art = tdTreeArt(tr.r, PAL[tr.pal], tr.seed, tr.kind); const sw = Math.round(World.windSway(tr.x, .5) * .5); let a = 1; if (tr.fade && p.y < tr.y && Math.abs(p.x - tr.x) < tr.r * 1.2 && p.y > tr.y - tr.r * 2.4) a = .45; if (hd) { HD.art(art, Math.round(tr.x - art.width / 2), tr.y - art.height + 3, tr.y, { alpha: a, sway: World.windSway(tr.x, .5) * 1.4 }); return; } ctx.globalAlpha = a; ctx.drawImage(art, Math.round(tr.x - art.width / 2 + sw * .3), tr.y - art.height + 3); ctx.globalAlpha = 1; }, true); }
    for (const pr of buildVillageProps()) { if (pr.x < vx0 - 20 || pr.x > vx1 + 20 || pr.y < vy0 - 10 || pr.y > vy1 + 40) continue; add(pr.y, () => drawVProp(pr), 'pr' + pr.x + '_' + pr.y); }
    // well
    add(WELL.y + 8, () => this.drawWell(t));
    // lamp post
    add(392, () => { const x = 466, y = 392; tdShadowRect(x, y - 1, 8, 3); P(OLC, x - 1, y - 40, 4, 41); P('#3a3a48', x, y - 39, 2, 39); P(OLC, x - 5, y - 48, 11, 9); P(nk > .2 ? '#ffd870' : '#8a8a9a', x - 4, y - 47, 9, 7); P(OLC, x - 6, y - 50, 13, 3); if (nk > .2) { const f = noise1(t * 7); P('#fff4c0', x - 1 + f * .5, y - 45, 3, 3); } }, 'lamp', Math.round(nk * 4));
    // bench near well
    add(452, () => { const x = 574, y = 452; tdShadowRect(x, y, 30, 3); P(OLC, x - 1, y - 9, 32, 5); P('#b8784a', x, y - 8, 30, 3); P('#e0a868', x, y - 8, 30, 1); P(OLC, x + 2, y - 5, 3, 6); P(OLC, x + 25, y - 5, 3, 6); }, 'bench');
    // home yard: laundry, firewood, shed, barrels
    add(318, () => { const x0 = 362, x1 = 424, y = 318; P(OLC, x0, y - 30, 2, 31); P(OLC, x1, y - 30, 2, 31); P('#e8e0d0', x0, y - 30, x1 - x0, 1); for (let i = 0; i < 4; i++) { const x = x0 + 4 + i * 15, sw = World.windSway(x, 1.2) + Math.sin(t * 2.3 + i) * .6, col = ['#f4ece0', '#7ab0e8', '#e8705a', '#f8d870'][i]; pPoly(OLC, [[x - 1, y - 30], [x + 11, y - 30], [x + 12 + sw, y - 16], [x - 2 + sw, y - 16]]); pPoly(col, [[x, y - 29], [x + 10, y - 29], [x + 11 + sw, y - 17], [x - 1 + sw, y - 17]]); P(shade(col, .3), x + 1, y - 28, 3, 1); } });
    add(338, () => { const x = 356, y = 338; for (let yy = 0; yy < 3; yy++) for (let i = 0; i < 4 - yy; i++) { const lx = x + i * 7 + yy * 3, ly = y - 3 - yy * 5; pCirc(OLC, lx, ly, 3.5); pCirc('#c08450', lx, ly, 2.5); P('#8a5a34', lx, ly, 1, 1); } }, 'wood');
    add(350, () => { tdBarrel(196, 350); tdCrate(212, 352, 12, 9); }, 'bar1');
    // merchant stall + awning (in front of the shop, right side)
    add(372, () => this.drawStall(t));
    add(330 + 30, () => { tdCrate(612, 350); tdCrate(626, 352, 10, 8); tdBarrel(604, 360); }, 'crt1');
    // smithy yard: anvil, rack, barrels, coal
    add(B.smith.y + 20, () => this.drawSmithYard(t, night));
    add(B.smith.y + 10, () => { tdBarrel(B.smith.x - 8, B.smith.y + 10); tdBarrel(B.smith.x + 4, B.smith.y + 14); }, 'sbar');
    // signpost at crossroads
    add(462, () => { const x = 1088, y = 462; tdShadowRect(x, y - 1, 8, 3); P(OLC, x - 1, y - 30, 4, 31); P('#9a6440', x, y - 29, 2, 29); P(OLC, x - 16, y - 32, 30, 10); P('#d8a868', x - 15, y - 31, 28, 8); P('#8a5a34', x - 12, y - 28, 22, 1); P('#8a5a34', x - 12, y - 26, 16, 1); pPoly(OLC, [[x + 14, y - 32], [x + 19, y - 27], [x + 14, y - 22]]); }, 'sign');
    // graveyard: fence, graves, pumpkins, flowers
    this.addGraveyard(add, t);
    // palisade + gate
    this.addPalisade(add, t, nk);
    // bridge south railing (in front)
    add(RIVER.bridgeY1 + 1, () => { const bx0 = 50, bx1 = 172, by = RIVER.bridgeY1 + 1; for (let x = bx0; x <= bx1; x += 20) { P(OLC, x - 1, by - 12, 5, 13); P('#b8784a', x, by - 11, 3, 11); P('#e0a868', x, by - 11, 1, 10); } P(OLC, bx0, by - 11, bx1 - bx0 + 3, 4); P('#d09458', bx0, by - 10, bx1 - bx0 + 3, 2); }, 'brail');
    // field fences
    for (let f = 0; f < 3; f++) { const fx = 220 + f * 330; add(560, () => tdFenceH(fx, fx + 230, 558), 'ffa' + f); add(652, () => tdFenceH(fx, fx + 230, 652), 'ffb' + f); }
    // festival bunting (after Barnaby) strung across the plaza
    if (S.bosses.barnaby) add(406, () => this.drawFestival(t));
    // wolf pelts on the garden fence (after Gloomfang)
    add(416, () => { tdFenceH(214, 298, 416); if (S.bosses.gloomfang) for (let i = 0; i < 2; i++) { const x = 230 + i * 30, sw = World.windSway(x, .5); pPoly(OLC, [[x - 1, 404], [x + 13, 404], [x + 14 + sw, 416], [x - 2 + sw, 416]]); pPoly('#8a8a96', [[x, 405], [x + 12, 405], [x + 13 + sw, 415], [x - 1 + sw, 415]]); P('#b0b0bc', x + 2, 406, 6, 1); } });
    // animals
    for (const ch of this.chickens) if (ch.x > vx0 - 20 && ch.x < vx1 + 20 && ch.y > vy0 - 10 && ch.y < vy1 + 30) add(ch.y, () => this.drawChicken(ch), null, 0, [ch.x - 10, ch.y - 22, 20, 26], HI_SMALL);
    add(this.cat.y, () => this.drawCat(), null, 0, [this.cat.x - 14, this.cat.y - 22, 28, 26], HI_SMALL);
    for (const cr of this.crows) add(cr.fly ? 9999 : cr.y + 1, () => this.drawCrow(cr));
    // villagers
    for (const v of this.vill) { if (!v.vis || v.x < vx0 - 40 || v.x > vx1 + 40 || v.y < vy0 - 10 || v.y > vy1 + 80) continue; add(v.y, () => this.drawVillager(v, t), null, 0, [v.x - 38, v.y - 66, 76, 74], HI_CHAR); }
    // player
    add(p.y + .1, () => {
      const low = S.hp / Stats.maxHP() < .3; const pl = playerLook({ t, face: this.pdir, walk: this.moving ? this.walkPh : null, low, expr: low ? 'tired' : (World.rain > .6 ? 'annoyed' : (Dialog.speaker === S.name && Dialog.talking ? 'neutral' : undefined)), talking: Dialog.speaker === S.name && Dialog.talking, sq: this.stopSettle > 0 ? 1 - this.stopSettle * .3 : 1 });
      if (this.idleT > 6) pl.look = Math.sin(T * .6) > 0 ? 1 : -1;
      drawChar(p.x, p.y, pl);
    }, null, 0, [p.x - 38, p.y - 66, 76, 74], HI_CHAR);
    if (typeof Life !== 'undefined') Life.villageProps(add, t, hd, this);
    L.sort((a, b) => a[0] - b[0]);
    const later = [];
    if (hd) { for (const [y, fn, key, ver, rect, o] of L) { if (key === true) fn(); else if (y >= 9000) later.push(fn); else HD.capture(y, fn, key, ver, rect, o); } }
    else for (const [, fn] of L) fn();
    // windows (lit at night) + stained glass, drawn over the cached building art (HD: baked into the building billboards)
    if (!hd) this.drawWindows(t, nk);
    else { HD.layer('top'); c = ctx; for (const fn of later) fn(); }
    // rooftop bird
    { const bd = this.bird, fl = bd.fly > 0 ? (Math.sin(T * 30) > 0 ? -2 : 1) : 0, hop = bd.fly ? 0 : (Math.sin(T * 3) > .95 ? -1 : 0); P(OLC, bd.x - 3, bd.y - 4 + hop, 6, 4); P('#6a5aa8', bd.x - 2, bd.y - 3 + hop, 4, 2); P('#a898e0', bd.x - 2, bd.y - 3 + hop, 2, 1); P('#f0a020', bd.x + 3, bd.y - 2 + hop, 1, 1); if (bd.fly) { P(OLC, bd.x - 5, bd.y - 3 + fl, 3, 1); P(OLC, bd.x + 3, bd.y - 3 + fl, 3, 1); } }
    // butterflies / fireflies
    if (nk < .5 && World.rain < .3) for (const bf of this.butter) { bf.x += Math.sin(T * .7 + bf.p) * 12 * DT; const by = bf.y + Math.sin(T * 1.3 + bf.p) * 10 - 10; const f = Math.sin(T * 16 + bf.p) > 0; c.globalAlpha = .3; P('#1e2040', bf.x, bf.y + 4, 2, 1); c.globalAlpha = 1; P(bf.c, bf.x - (f ? 2 : 1), by, f ? 2 : 1, 2); P(bf.c, bf.x + 1, by, f ? 2 : 1, 2); P(OLC, bf.x, by, 1, 2); }
    if (nk > .4) for (const f of this.fireflies) { const x = f.x + Math.sin(T * .5 + f.p) * 20, y = f.y + Math.sin(T * .8 + f.p * 2) * 12, a = .5 + .5 * Math.sin(T * 3 + f.p * 5); c.globalAlpha = a * nk; P('#e0ff80', x, y, 1, 1); c.globalAlpha = a * nk * .3; pCirc('#e0ff80', x, y, 3); c.globalAlpha = 1; }
    Particles.draw(false);
    // drifting cloud shadows (day)
    if (nk < .8 && Gfx.level > 0 && !hd) { c.globalAlpha = .1 * (1 - nk) * (1 - World.rain * .5); for (let i = 0; i < 5; i++) { const R = RNG(900 + i), x = ((R() * 2000 + t * (6 + World.wind * 14)) % 2000) - 300, y = R() * VH; pEll('#1e2850', x, y, R.r(60, 120), R.r(26, 50)); pEll('#1e2850', x + 40, y - 14, R.r(40, 70), R.r(20, 30)); } c.globalAlpha = 1; }
    if (hd) HD.groundLayer('top');
    // ---- lighting ----
    Light.begin(World.ambient()); const L2 = (x, y, r2, col, a, fl) => Light.add(x, y, r2, col, a, fl);
    const wl = nk;
    if (wl > .05) { for (const [x, y] of this.windowLights()) L2(x, y, 40, '#ffb050', wl * .9, .08); L2(467, 346, 70, '#ffc060', wl, .12); L2(1120, 200, 50, '#ffc060', wl * .8, .1); L2(B.cath.x + 92, B.cath.y - B.cath.wallH + 16, 40, '#e060a0', wl * .7); for (const f of this.fireflies) L2(f.x + Math.sin(T * .5 + f.p) * 20, f.y, 10, '#c0ff60', nk * .5); }
    L2(PALI - 14, 448, 60, '#ff9040', .5 + wl * .5, .2); L2(PALI - 14, 518, 60, '#ff9040', .5 + wl * .5, .2);
    L2(B.smith.x + 30, B.smith.y - 14, 70, '#ff7a30', .8, .25); if (World.lightning > 0) L2(Cam.x, Cam.y, 600, '#ffffff', World.lightning);
    if (typeof Life !== 'undefined') Life.villageLights(L2, nk);
    Light.apply();
    if (hd) { HD.screenLayer(); c = ctx; }
    Weather.fog(World.fog, '#c8d4e0', Cam.x); c.setTransform(1, 0, 0, 1, 0, 0);
    Weather.draw((x) => 40 + ((Math.floor(x) * 53) % 300));
    // screen-space framing: overhanging leaves in the top corners (parallax)
    this.drawFraming(t, nk);
    if (this.raiding > 0) { c.globalAlpha = .25 + .15 * Math.sin(T * 8); P('#6a0010', 0, 0, 640, 360); c.globalAlpha = 1; }
  },
  drawFraming(t, nk) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0);
    const ox = -((Cam.x * 1.15) % 640), oy = -(Cam.y - 180) * .25;
    const art = Cache.get('v_frame', 640, 120, () => { const R = RNG(31); for (let i = 0; i < 9; i++) { const x = R() < .5 ? R.r(-20, 110) : R.r(530, 660), y = R.r(-30, 20); tdCanopy(x, y, R.r(18, 30), R() < .3 ? PAL.leafAut : PAL.leafDark, R, 7); } for (let i = 0; i < 6; i++) { const x0 = i < 3 ? 0 : 640, dir = i < 3 ? 1 : -1, y0 = R.r(10, 50); let x = x0, y = y0; for (let k = 0; k < 6; k++) { const nx = x + dir * R.r(10, 20), ny = y + R.r(-2, 6); pLine(OLC, x, y, nx, ny, 3); pLine('#5a3a30', x, y - 1, nx, ny - 1, 1); x = nx; y = ny; if (R() < .6) tdCanopy(x, y + 3, R.r(5, 8), PAL.leafDark, R, 3); } } });
    c.globalAlpha = .96; c.drawImage(art, 0, Math.round(Math.min(0, oy))); c.globalAlpha = 1;
  },
  drawWell(t) {
    const x = WELL.x, y = WELL.y + 8;
    const a = Cache.get('v_well', 50, 64, () => { const cx = 25, by = 60; ctx.globalAlpha = .3; pEll('#1e2040', cx + 4, by - 1, 20, 6); ctx.globalAlpha = 1; pEll(OLC, cx, by - 12, 18, 10); stoneTexture('#b0a8a8', cx - 17, by - 18, 34, 14, RNG(4), 6, 4); pEll(OLC, cx, by - 18, 17, 7); pEll('#c8c0bc', cx, by - 18, 16, 6); pEll('#2a4a6a', cx, by - 18, 12, 4); pEll('#3a6a9a', cx - 2, by - 19, 6, 2); P(OLC, cx - 16, by - 48, 4, 32); P(OLC, cx + 13, by - 48, 4, 32); P('#9a6440', cx - 15, by - 47, 2, 30); P('#9a6440', cx + 14, by - 47, 2, 30); pPoly(OLC, [[cx - 22, by - 44], [cx + 22, by - 44], [cx + 14, by - 58], [cx - 14, by - 58]]); pPoly('#c8583a', [[cx - 20, by - 45], [cx + 20, by - 45], [cx + 13, by - 57], [cx - 13, by - 57]]); for (let yy = by - 55; yy < by - 45; yy += 3) P('#a04030', cx - 18, yy, 36, 1); P('#e88060', cx - 12, by - 56, 12, 1); P(OLC, cx - 14, by - 38, 28, 2); });
    ctx.drawImage(a, x - 25, y - 60);
    const bb = Math.sin(t * .7); P('#a8804a', x + bb * .2, y - 37, 1, 10 + bb); P(OLC, x - 4, y - 28 + bb, 8, 6); P('#8a5a34', x - 3, y - 27 + bb, 6, 4); P('#a8a8b8', x - 3, y - 27 + bb, 6, 1);
    const wb = Math.sin(t * 2) * (1 + World.wind * 2); pPoly('#3a8ad0', [[x + 15, y - 44], [x + 26 + wb, y - 42], [x + 15, y - 38]]);
  },
  drawStall(t) {
    const x = B.merchant.x + 112, y = 372;
    const a = Cache.get('v_stall', 64, 60, () => { const R = RNG(8); ctx.globalAlpha = .3; P('#1e2040', 4, 52, 58, 5); ctx.globalAlpha = 1; P(OLC, 3, 34, 58, 18); P('#a8703a', 4, 35, 56, 6); P('#d09458', 4, 35, 56, 1); P('#7a4a2e', 4, 41, 56, 10); for (let i = 0; i < 8; i++) { pCirc(OLC, 9 + i * 6.5, 33, 3.2); pCirc(R.pick(['#e84a3a', '#f8a020', '#88c840', '#d03a6a', '#f8d860']), 9 + i * 6.5, 33, 2.4); P('#fff', 8 + i * 6.5, 32, 1, 1); } P(OLC, 4, 12, 3, 40); P(OLC, 57, 12, 3, 40); });
    ctx.drawImage(a, x, y - 56);
    for (let i = 0; i < 10; i++) { const xx = x + 2 + i * 6, sw = Math.sin(t * 2 + i * .5) * World.wind; pPoly(OLC, [[xx - 1, y - 46], [xx + 7, y - 46], [xx + 7 + sw, y - 36], [xx - 1 + sw, y - 36]]); pPoly(i % 2 ? '#e84a5a' : '#fff4e0', [[xx, y - 45], [xx + 6, y - 45], [xx + 6 + sw, y - 37], [xx + sw, y - 37]]); pEll(i % 2 ? '#e84a5a' : '#fff4e0', xx + 3 + sw, y - 37, 3, 2); }
    P(OLC, x, y - 47, 62, 2);
  },
  drawSmithYard(t, night) {
    const sx = B.smith.x, y = B.smith.y + 20, ax = sx + 150;
    // anvil
    tdShadowRect(ax - 8, y - 1, 18, 3); pPoly(OLC, [[ax - 12, y - 14], [ax + 10, y - 14], [ax + 6, y - 9], [ax + 3, y - 9], [ax + 5, y], [ax - 7, y], [ax - 5, y - 9], [ax - 8, y - 9]]); P('#6a6a7a', ax - 11, y - 13, 20, 3); P('#b0b0c0', ax - 11, y - 13, 20, 1);
    // weapon rack
    const rx = sx + 104; P(OLC, rx - 1, y - 30, 34, 3); for (let i = 0; i < 4; i++) { pLine(OLC, rx + 4 + i * 8, y - 28, rx + 4 + i * 8, y - 4, 3); pLine(i % 2 ? '#c0c8d0' : '#e0e8f0', rx + 4 + i * 8, y - 27, rx + 4 + i * 8, y - 8, 1); P('#7a4a2e', rx + 3 + i * 8, y - 6, 3, 4); } P(OLC, rx - 1, y - 2, 34, 3);
    // forge glow in the open bay
    const fg = .7 + .3 * noise1(t * 6), fx = sx + 20, fy = B.smith.y - 24; P(mix('#8a2a08', '#ffb040', fg), fx, fy, 18, 12); P(mix('#e06010', '#fff0a0', fg), fx + 4, fy + 3, 10, 6);
    if (!night) { const hk = (T % 1.6) / 1.6, arm = hk < .7 ? lerp(.2, -2.4, hk / .7) : lerp(-2.4, 1.2, (hk - .7) / .3); drawChar(ax + 16, y + 2, { skin: '#c8885a', hairStyle: 'bald', beard: '#3a2a1a', top: '#7a6a5a', apron: '#4a3a2a', pants: '#3a3030', boots: '#2a2020', weapon: 'hammer', armF: arm, face: -1, body: 'round', seed: 30, t, s: .95 }); P('#ff8030', ax - 4, y - 15, 6, 2); }
  },
  addGraveyard(add, t) {
    const { x0, x1, y0, y1 } = GY;
    add(y0, () => { for (let x = x0; x <= x1; x += 8) { P(OLC, x, y0 - 14, 2, 14); P(OLC, x - 1, y0 - 16, 4, 2); } P(OLC, x0, y0 - 10, x1 - x0 + 2, 2); }, 'gy0');
    for (let y = y0 + 8; y < y1; y += 8) { add(y, () => { P(OLC, x0, y - 14, 2, 14); P(OLC, x0 - 1, y - 16, 4, 2); P(OLC, x1, y - 14, 2, 14); P(OLC, x1 - 1, y - 16, 4, 2); }, 'gyr' + y); }
    add(y1, () => { for (let x = x0; x <= x1; x += 8) { if (x > 1300 && x < 1334) continue; P(OLC, x, y1 - 14, 2, 14); P(OLC, x - 1, y1 - 16, 4, 2); } P(OLC, x0, y1 - 10, 1300 - x0, 2); P(OLC, 1334, y1 - 10, x1 - 1334 + 2, 2); P('#3a3040', 1298, y1 - 22, 4, 22); P('#3a3040', 1332, y1 - 22, 4, 22); P('#3a3040', 1298, y1 - 24, 38, 3); }, 'gy1');
    const R = RNG(77);
    for (let i = 0; i < 9; i++) { const gx = x0 + 16 + (i % 3) * 34 + R.i(-3, 3), gy = y0 + 30 + Math.floor(i / 3) * 38 + R.i(-3, 3), k = R() < .5; add(gy, () => { tdGrave(gx, gy, k); if (S.bosses.timmy) { P('#f86080', gx - 3, gy + 1, 2, 2); P('#f8e060', gx + 4, gy + 2, 2, 2); } }, 'gv' + i, S.bosses.timmy ? 1 : 0); }
    for (let i = 0; i < 3; i++) { const px = x0 + 24 + i * 34, py = y1 - 12; add(py, () => tdPumpkin(px, py), 'pk' + i); }
    // skull post (Kevin)
    add(470, () => { const x = PALI - 30, y = 470; P(OLC, x - 1, y - 30, 4, 31); P('#9a6440', x, y - 29, 2, 29); pEll(OLC, x + 1, y - 33, 5, 5); pEll('#f0e8d4', x + 1, y - 33, 4, 4); P(OLC, x - 1, y - 34, 1, 2); P(OLC, x + 2, y - 34, 1, 2); P(OLC, x, y - 30, 3, 1); }, 'skull');
  },
  addPalisade(add, t, nk) {
    const art = Cache.get('v_stake', 14, 44, () => { P(OLC, 1, 6, 12, 38); P('#9a6440', 2, 7, 10, 36); P('#c08450', 2, 7, 3, 36); P('#6a4030', 10, 7, 2, 36); pPoly(OLC, [[1, 7], [7, 0], [13, 7]]); pPoly('#c08450', [[2, 7], [7, 1.5], [12, 7]]); P('#6a4030', 2, 18, 10, 1); P('#6a4030', 2, 30, 10, 1); });
    for (let y = 70; y < VH; y += 6) { if (y > 456 && y < 518) continue; const yy = y, col = (y / 6) % 2; add(yy, () => { if (HD.live) { HD.art(art, PALI - 10 + col * 7, yy - 42 + col * 2, yy); return; } ctx.drawImage(art, PALI - 10 + col * 7, yy - 42 + col * 2); }, true); }
    add(VH + 1, () => {}); 
    // gate posts + beam + torches
    add(458, () => { P(OLC, PALI - 8, 410, 12, 50); P('#7a4a30', PALI - 7, 411, 10, 48); P('#a86a40', PALI - 7, 411, 3, 48); const fh = 3 + noise1(t * 9) * 2; P(OLC, PALI - 16, 440, 4, 10); pEll('#f08020', PALI - 14, 437, 2.5, fh); pEll('#ffe070', PALI - 14, 438, 1.2, fh * .5); });
    add(518, () => { P(OLC, PALI - 8, 470, 12, 50); P('#7a4a30', PALI - 7, 471, 10, 48); P('#a86a40', PALI - 7, 471, 3, 48); const fh = 3 + noise1(t * 9 + 2) * 2; P(OLC, PALI - 16, 508, 4, 10); pEll('#f08020', PALI - 14, 505, 2.5, fh); pEll('#ffe070', PALI - 14, 506, 1.2, fh * .5); P(OLC, PALI - 6, 404, 8, 70); P('#8a5434', PALI - 5, 405, 6, 68); P('#b07a4a', PALI - 5, 405, 2, 68); });
  },
  drawFestival(t) {
    const strings = [[[346, 300], [520, 330], [600, 300]]];
    for (const pts of strings) { for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 10); for (let i = 0; i < n; i++) { const u = i / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u) - 40 + Math.sin(u * Math.PI) * 12 + Math.sin(t * 2 + i) * .8; P('#3a2a1a', x, y - 1, 10, 1); pPoly(OLC, [[x - .5, y - .5], [x + 7.5, y - .5], [x + 3.5, y + 7.5]]); pPoly(['#e84a5a', '#f8c840', '#4a9ae8', '#68c858', '#f8f0e0'][(i + k) % 5], [[x, y], [x + 7, y], [x + 3.5, y + 6]]); } } }
    const fx = 520, fy = 368; P(OLC, fx - 36, fy - 2, 3, 40); P(OLC, fx + 33, fy - 2, 3, 40); P('#8a5434', fx - 35, fy - 1, 1, 38); P('#8a5434', fx + 34, fy - 1, 1, 38); P(OLC, fx - 33, fy - 14, 66, 14); P('#c8304a', fx - 32, fy - 13, 64, 12); P('#f0c860', fx - 32, fy - 13, 64, 1); ctx.save(); pText('FESTIVAL', fx, fy - 4, 8, '#fff4dc', 'center'); ctx.restore();
  },
  drawChicken(ch) {
    const c = ctx, x = ch.x, y = ch.y - ch.z, peck = ch.st === 'peck' && Math.sin(T * 8 + x) > .3;
    c.globalAlpha = .3; pEll('#1e2040', ch.x, ch.y, 5, 1.6); c.globalAlpha = 1;
    c.save(); c.translate(Math.round(x), Math.round(y)); if (ch.dir < 0) c.scale(-1, 1);
    pEll(OLC, 0, -5, 5, 4); pEll('#fffaf0', 0, -5, 4, 3); pEll('#e0d8cc', 1, -4, 2.5, 2); P('#fffaf0', -5, -8, 2, 3); const hx = peck ? 5 : 3, hy = peck ? -4 : -9; pEll(OLC, hx, hy, 2.6, 2.6); pEll('#fffaf0', hx, hy, 2, 2); P('#f03030', hx - 1, hy - 3, 2, 1); P('#f8a820', hx + 2, hy, 2, 1); P(OLC, hx + 1, hy - 1, 1, 1);
    const lg = ch.st !== 'peck' ? Math.sin(T * 20) : 0; P('#f8a820', -1 + lg, -2, 1, 2); P('#f8a820', 1 - lg, -2, 1, 2); c.restore();
  },
  drawCat() {
    const c = ctx, cat = this.cat; c.globalAlpha = .3; pEll('#1e2040', cat.x, cat.y, 7, 2); c.globalAlpha = 1; c.save(); c.translate(Math.round(cat.x), Math.round(cat.y)); if (cat.dir < 0) c.scale(-1, 1); const cc = '#4a3a48', cl = '#6a5a6a';
    if (cat.st === 'sleep') { pEll(OLC, 0, -3, 8, 4); pEll(cc, 0, -3, 7, 3); pEll(cl, -1, -4, 4, 1.5); pEll(cc, 5, -4, 3, 2.5); P(cc, -8, -2, 5, 1); if (Math.sin(T * 1.5) > 0) pText('z', 8, -9, 6, '#f8f0e0'); }
    else { const st = cat.st === 'stretch' ? 2 : 0; pEll(OLC, 0, -5 + st * .5, 7, 4); pEll(cc, 0, -5 + st * .5, 6, 3); pEll(cl, -1, -6, 3, 1); const wl = cat.st === 'walk' ? Math.sin(T * 12) : 0; P(cc, -4 + wl, -3, 2, 3); P(cc, 3 - wl, -3, 2, 3); const hx = 6 + (cat.look ? 1 : 0), hy = -8 + (cat.st === 'lick' ? 2 : 0) + st; pEll(OLC, hx, hy, 3.6, 3.6); pEll(cc, hx, hy, 3, 3); P(cc, hx - 2, hy - 4, 1, 2); P(cc, hx + 1, hy - 4, 1, 2); P(cat.look ? '#f0f040' : '#98d040', hx, hy - 1, 1, 1); P(cat.look ? '#f0f040' : '#98d040', hx + 2, hy - 1, 1, 1); const tw = Math.sin(T * 2) * 2; pLine(cc, -6, -6, -9, -10 + tw, 1); if (cat.st === 'meow' || cat.st === 'lick') P('#f09090', hx + (cat.st === 'lick' ? 3 : 2), hy + 1, 1, 1); }
    c.restore();
  },
  drawCrow(cr) { const fl = cr.fly ? (Math.sin(T * 25) > 0 ? -2 : 1) : 0; P('#0e0a14', cr.x - 3, cr.y - 3, 6, 3); P('#0e0a14', cr.x + 2, cr.y - 5, 3, 3); P('#4a3a5a', cr.x - 2, cr.y - 3, 3, 1); P('#f0a020', cr.x + 5, cr.y - 4, 2, 1); if (cr.fly) { P('#0e0a14', cr.x - 6, cr.y - 3 + fl, 4, 1); P('#0e0a14', cr.x + 2, cr.y - 3 + fl, 4, 1); } else { P('#0e0a14', cr.x - 5, cr.y - 2, 2, 1); } },
  drawVillager(v, t) {
    const talkingNow = Dialog.open && Dialog.speaker && (Dialog.speaker === v.look?.name || (v.state === 'TALK_P' && Dialog.talking));
    const o = Object.assign({}, v.look, { t, face: v.dir, walk: v.walk, talking: talkingNow || (v.state === 'TALK' && Math.sin(T * 3 + v.x) > 0), expr: v.state === 'TALK' ? 'happy' : v.state === 'LOOK' ? 'neutral' : undefined });
    if (v.state === 'SIT' && v.seated) o.sit = true;
    if (v.state === 'WORK') { o.armF = -.3 + Math.sin(T * 4) * .9; o.wAng = o.armF + 2.8; }
    if (v.state === 'FISH') { o.weapon = 'spear'; o.armF = -.9; o.wAng = .9 + Math.sin(T * .8) * .05; }
    if (v.wave > 0) { o.armF = Math.PI + .4 + Math.sin(T * 14) * .3; o.expr = 'happy'; }
    if (World.rain > .5 && !v.guard) { o.armF = Math.PI - .2; o.expr = 'annoyed'; }
    SpriteFX.minor = true; try { drawChar(v.x, v.y, o); } finally { SpriteFX.minor = false; }
    if (v.state === 'FISH') { const ex = v.x + 22, ey = v.y - 30; pLine('#e8e0d0', ex, ey, ex + 10, v.y + 4 + Math.sin(T * 2) * 1.5, 1); P('#f04040', ex + 10, v.y + 4 + Math.sin(T * 2) * 1.5, 2, 2); }
    if (v.bub > 0 || (v.state === 'TALK' && Math.sin(T * 2 + v.x) > .6)) { const yy = v.y; P(OLC, v.x - 4, yy - 59, 11, 9); P('#fff8e8', v.x - 3, yy - 58, 9, 7); P('#fff8e8', v.x - 1, yy - 51, 2, 2); P('#3a2a1a', v.x - 1, yy - 55, 1, 1); P('#3a2a1a', v.x + 1, yy - 55, 1, 1); P('#3a2a1a', v.x + 3, yy - 55, 1, 1); }
  },
  windowDefs() { // [x, y, w, h] in world space for each window pane block
    const hw = (k, list) => { const b = B[k], yW = b.y - b.wallH; return list.map(([wx, wy, ww, wh]) => [b.x + wx, yW + wy, ww, wh]); };
    return [...hw('house', [[18, 12, 16, 14], [104, 12, 16, 14]]), ...hw('merchant', [[18, 12, 22, 14], [118, 12, 22, 14]]), ...hw('smith', [[124, 12, 18, 12]])];
  },
  windowLights() { return this.windowDefs().map(([x, y, w, h]) => [x + w / 2, y + h / 2]); },
  drawWindows(t, nk) {
    for (const [x, y, w, h] of this.windowDefs()) { const f = .85 + .15 * noise1(t * 2 + x); const col = mix('#3a4a7a', '#ffc860', nk * f); P(col, x, y + 2, w / 2 - 1, h / 2 - 3); P(col, x + w / 2 + 1, y + 2, w / 2 - 1, h / 2 - 3); P(col, x, y + h / 2 + 1, w / 2 - 1, h / 2 - 1); P(col, x + w / 2 + 1, y + h / 2 + 1, w / 2 - 1, h / 2 - 1); if (nk < .3) { P('rgba(255,255,255,.55)', x + 1, y + 2, 2, 1); P('rgba(255,255,255,.35)', x + w / 2 + 2, y + h / 2 + 2, 1, 1); } }
    // cathedral stained glass + rose window
    const cb = B.cath, yW = cb.y - cb.wallH;
    [18, 44, 104].forEach((wx, i) => { const x = cb.x + wx, y = yW + 19; for (let k = 0; k < 6; k++) P(['#d83a4a', '#3a7ad8', '#f0b840', '#7a3ab8'][(k + i) % 4], x, y + k * 5, 10, 5); pEll('#f0b840', x + 5, y, 5, 4); P('rgba(255,255,255,.4)', x + 1, y + 2, 1, 6); });
    const rx = cb.x + 91, ry = yW + 15; pCirc('#9a2048', rx, ry, 11); for (let k = 0; k < 8; k++) { const a = k * TAU / 8; P(['#f0b840', '#3a7ad8'][k % 2], rx + Math.cos(a) * 7 - 1, ry + Math.sin(a) * 7 - 1, 3, 3); } pCirc('#fff0a0', rx, ry, 2);
    // bell swing in the tower
    const bs = Math.sin(t * .8) * .15, bx = cb.x + 152, by = cb.y - cb.wallH - cb.roofH - 120 + 18 + 22 + (120 - 18); pEll('#d8b040', bx + bs * 10, cb.y - cb.wallH - cb.roofH + 25, 5, 6); P('#8a6a20', bx - 5 + bs * 10, cb.y - cb.wallH - cb.roofH + 29, 11, 2);
    // cathedral lanterns
    [[cb.x + 66, cb.y - 26], [cb.x + 118, cb.y - 26]].forEach(([x, y]) => { P(OLC, x, y, 6, 8); P(nk > .2 ? '#ffd870' : '#8a7a5a', x + 1, y + 2, 4, 5); });
  },
  ui() {
    const tgt = !Dialog.open && this.nearestTarget();
    if (tgt) { const x = tgt.type === 'door' ? tgt.d.x : tgt.v.x, y = (tgt.type === 'door' ? tgt.d.y - (tgt.d.id === 'gate' ? 60 : 50) : tgt.v.y - 62); const [sx, sy] = Cam.toScreen(x, y); const lab = tgt.type === 'door' ? tgt.d.label : 'Talk'; const w = UI.measure(lab, 14) + 52, bob = Math.sin(T * 4) * 2;
      g.fillStyle = 'rgba(16,12,20,.85)'; g.fillRect(sx * 2 - w / 2, sy * 2 - 18 + bob, w, 26); g.strokeStyle = COL.gold; g.strokeRect(sx * 2 - w / 2 + .5, sy * 2 - 17.5 + bob, w - 1, 25); UI.text('TAP', sx * 2 - w / 2 + 18, sy * 2 + bob, { size: 11, col: COL.gold2, align: 'center' }); UI.text(lab, sx * 2 - w / 2 + 36, sy * 2 + bob, { size: 14 }); }
    HUD.draw({ buttons: [['MAP', () => { SFX.play('door'); Scene.go('overworld', { from: 'village' }, { out: .5, in: .6 }); }, 'Overworld', 56]] });
  }
};
// endless forest canopy around the village (2.5D view can see past the map edge)
function vForestTile() {
  return Cache.get('v_ftile', 256, 256, () => {
    const R = RNG(919); P('#173322', 0, 0, 256, 256);
    for (let i = 0; i < 70; i++) { const x = R.r(0, 256), y = R.r(0, 256), r = R.r(14, 26), pal = R() < .12 ? PAL.leafAut : PAL.leafDark;
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) if (x + ox > -40 && x + ox < 296 && y + oy > -40 && y + oy < 296) tdCanopy(x + ox, y + oy, r, pal, RNG(i * 7 + 1), 6); }
  });
}
