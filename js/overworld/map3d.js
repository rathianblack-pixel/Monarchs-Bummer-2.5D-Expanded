'use strict';
/* =========================================================
   OVERWORLD — 2.5D diorama (used when the HD renderer is on)
   Detailed painted ground (regions, fields, river, roads, lava), and everything that
   stands up — forests, mountains, the village, graves, hedges, the fortress, map pins —
   as billboards on a tilted ground plane, with tilt-shift blur, haze and drifting clouds.
   ========================================================= */
const owC = (key, w, h, fn) => Cache.get('ow3_' + key, w, h, fn);
const OW_PAL = [
  { base: '#6aa046', lt: '#80b64e', lt2: '#a2cc5c', dk: '#558a40', dk2: '#3e6e3e' },
  { base: '#3a6a40', lt: '#487c46', lt2: '#5e9050', dk: '#2e5838', dk2: '#224632' },
  { base: '#4e5e58', lt: '#5c6e64', lt2: '#70826e', dk: '#404e4c', dk2: '#323e40' },
  { base: '#668a4c', lt: '#789c56', lt2: '#92b064', dk: '#54743e', dk2: '#425c36' },
  { base: '#3e2e3a', lt: '#4c3a46', lt2: '#5e4656', dk: '#30242e', dk2: '#221a24' }
];
const OW_FIELD = ['#c8a850', '#9ab448', '#b0844a', '#d4bc62', '#88a040'];
const ow3 = { built: false };
function owHash(x, y) { let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296; }

/* ---------------- billboard arts ---------------- */
function owTree(r, pal, seed, kind) { const c = tdTreeArt(r, PAL[pal], seed, kind); return { c, bx: c.width / 2, by: c.height - 3 }; }
function owMount(w, h, seed, kind) {
  const W = w + 6, H = h + 8;
  const c = owC('mt' + kind + w + '_' + h + '_' + seed, W, H, () => {
    const R = RNG(seed * 13 + 7), cx = W / 2 + R.r(-w * .12, w * .12), by = H - 3;
    const pal = kind === 'snow' ? ['#5a6488', '#8a94b4', '#b8c0d8', '#3e4466'] : kind === 'ash' ? ['#3a2836', '#6e5468', '#9a7a90', '#22161e'] : ['#4a4a58', '#7a7a88', '#a4a2ac', '#2e2e3a'];
    const L = [[3, by]], Rr = [];
    const n = 7; for (let i = 1; i < n; i++) { const t = i / n; L.push([lerp(3, cx, t) + R.r(-3, 3), lerp(by, 3, t) + R.r(-4, 4) * (1 - t)]); }
    for (let i = 1; i < n; i++) { const t = i / n; Rr.push([lerp(cx, W - 3, t) + R.r(-3, 3), lerp(3, by, t) + R.r(-4, 4) * t]); }
    const pts = [...L, [cx, 3], ...Rr, [W - 3, by]];
    pPoly('#1a141e', pts.map(([x, y]) => [x + (x < cx ? -1 : 1), y - 1]));
    pPoly(pal[0], pts);
    // lit left face, ridge line zig-zag down the middle
    const ridge = [[cx, 3]]; let rx = cx; for (let i = 1; i <= 6; i++) { rx += R.r(-w * .05, w * .07); ridge.push([rx, 3 + (by - 3) * i / 6]); }
    pPoly(pal[1], [[3, by], ...L.slice(1), [cx, 3], ...ridge.slice(1), [3, by]]);
    // rim light on the lit edge + light streaks down the sunny face
    for (let i = 0; i < L.length - 1; i++) pLine(pal[2], L[i][0] + 1, L[i][1], L[i + 1][0] + 1, L[i + 1][1] + 1, 1);
    for (let k = 0; k < w / 8; k++) { const y0 = R.r(h * .2, h * .7), half = (y0 - 3) / (by - 3) * (w / 2), x0 = cx - R.r(2, half * .8); pLine(pal[2], x0, y0, x0 - R.r(3, 8), y0 + R.r(6, 14), 1); }
    for (let k = 0; k < w / 10; k++) { const y0 = R.r(h * .25, h * .8), half = (y0 - 3) / (by - 3) * (w / 2), x0 = cx + R.r(4, half * .9); pLine(pal[3], x0, y0, x0 + R.r(2, 6), y0 + R.r(6, 12), 1); }
    // gullies & strata
    for (let i = 0; i < w * .5; i++) { const t = R(), y = lerp(10, by - 2, t), half = (y - 3) / (by - 3) * (w / 2), x = cx + R.r(-half, half) * .9; P(R() < .5 ? pal[3] : pal[2], x, y, R.i(2, 5), 1); }
    for (let k = 0; k < 4; k++) { let x = cx + R.r(-w * .25, w * .25), y = R.r(h * .25, h * .6); for (let s = 0; s < 6; s++) { const nx = x + R.r(-3, 3), ny = y + R.r(3, 6); pLine(pal[3], x, y, nx, ny, 1); x = nx; y = ny; } }
    // snow / ember caps
    const capH = kind === 'snow' ? h * R.r(.32, .45) : kind === 'ash' ? h * .14 : h * R.r(.14, .22);
    const capC = kind === 'ash' ? ['#d0502a', '#ff9a40'] : ['#d8e0f0', '#ffffff'];
    const cap = [[cx, 3]]; const steps = 8; for (let i = 0; i <= steps; i++) { const t = i / steps, yy = 3 + capH * (0.7 + .3 * Math.sin(i * 1.9 + seed)) , half = (yy - 3) / (by - 3) * (w / 2); cap.push([cx + lerp(half, -half, t), yy + (i % 2 ? R.r(2, 5) : 0)]); }
    if (kind !== 'rock' || R() < .7) { pPoly(capC[0], cap); pPoly(capC[1], cap.filter(([x]) => x <= cx + 1).concat([[cx - 1, 3 + capH * .5]])); }
    if (kind === 'snow') for (let i = 0; i < 6; i++) { const y = 3 + capH + R.r(2, h * .3), half = (y - 3) / (by - 3) * (w / 2) * .7; P('#c8d0e4', cx + R.r(-half, half * .2), y, R.i(2, 4), 1); }
    // foothill scree + pines
    for (let i = 0; i < w / 6; i++) { const x = R.r(6, W - 6), y = by - R.r(0, 5); P(pal[3], x, y, 2, 1); }
    if (kind !== 'ash') for (let i = 0; i < w / 14; i++) { const x = R.r(8, W - 8), y = by - R.r(0, 4); pPoly('#1e3a2e', [[x - 3, y + 1], [x, y - 7], [x + 3, y + 1]]); P('#3a6a4a', x - 1, y - 4, 1, 3); }
  });
  return { c, bx: W / 2, by: H - 3 };
}
function owHouse(v, lit) {
  return { c: owC('hs' + v + (lit ? 'L' : ''), 26, 30, () => {
    const R = RNG(v * 31 + 5), roof = ['#b04a3a', '#7a4a8a', '#3a6a9a', '#a87a3a'][v % 4], wall = ['#e8d4b0', '#d8c098', '#f0e0c4'][v % 3], x = 4, y = 12;
    P(OLC, x - 1, y - 1, 20, 16); P(wall, x, y, 18, 14); P(shade(wall, -.18), x + 12, y, 6, 14); P(shade(wall, .25), x, y, 18, 1);
    for (let i = 0; i < 18; i += 6) P(shade(wall, -.3), x + i, y + 4, 1, 10);
    pPoly(OLC, [[x - 4, y + 2], [x + 9, y - 10], [x + 22, y + 2]]); pPoly(roof, [[x - 2, y + 1], [x + 9, y - 8], [x + 20, y + 1]]); pPoly(shade(roof, .22), [[x - 2, y + 1], [x + 9, y - 8], [x + 9, y + 1]]);
    for (let k = 0; k < 3; k++) P(shade(roof, -.25), x + 1 + k * 2, y - 1 - k * 3, 16 - k * 4, 1);
    P(OLC, x + 13, y - 9, 4, 7); P('#8a6a5a', x + 14, y - 8, 2, 5);
    P(OLC, x + 7, y + 7, 5, 7); P('#6a3a22', x + 8, y + 8, 3, 6); P('#e0b050', x + 10, y + 11, 1, 1);
    const wc = lit ? '#ffd070' : '#4a6a8a'; P(OLC, x + 2, y + 5, 4, 4); P(wc, x + 3, y + 6, 2, 2); P(OLC, x + 13, y + 5, 4, 4); P(lit ? '#ffb850' : '#3a5a7a', x + 14, y + 6, 2, 2);
    if (R() < .6) { P('#4a8a3a', x - 1, y + 12, 4, 2); P('#e86a8a', x, y + 12, 1, 1); }
  }), bx: 13, by: 27 };
}
function owChapel(lit) {
  return { c: owC('chap' + (lit ? 'L' : ''), 30, 62, () => {
    const x = 6, y = 26;
    P(OLC, x - 1, y - 1, 20, 34); P('#b8b0b8', x, y, 18, 32); P('#8a8290', x + 12, y, 6, 32); for (let r = 0; r < 32; r += 4) P('#9a929e', x, y + r, 12, 1);
    pPoly(OLC, [[x - 2, y + 1], [x + 9, y - 22], [x + 20, y + 1]]); pPoly('#4a3a6a', [[x, y], [x + 9, y - 20], [x + 18, y]]); pPoly('#6a5a8a', [[x, y], [x + 9, y - 20], [x + 9, y]]);
    P('#e0c050', x + 8, y - 30, 2, 10); P('#e0c050', x + 5, y - 26, 8, 2);
    pCirc(OLC, x + 9, y + 8, 4); pCirc(lit ? '#ff70c0' : '#7a4a9a', x + 9, y + 8, 3); P(lit ? '#ffd070' : '#4a6a9a', x + 8, y + 7, 2, 2);
    P(OLC, x + 6, y + 21, 7, 11); P('#4a2a18', x + 7, y + 22, 5, 10); P(OLC, x + 2, y + 14, 3, 5); P(lit ? '#ffd070' : '#4a6a8a', x + 3, y + 15, 1, 3); P(OLC, x + 14, y + 14, 3, 5); P(lit ? '#ffb850' : '#3a5a7a', x + 15, y + 15, 1, 3);
  }), bx: 15, by: 59 };
}
function owWindmillBody() {
  return { c: owC('wmill', 22, 40, () => {
    const x = 11, by = 38; pPoly(OLC, [[x - 7, by], [x - 5, by - 26], [x + 5, by - 26], [x + 7, by]]); pPoly('#d8c8a8', [[x - 6, by - 1], [x - 4, by - 25], [x + 4, by - 25], [x + 6, by - 1]]); pPoly('#b0a080', [[x + 1, by - 1], [x + 1, by - 25], [x + 4, by - 25], [x + 6, by - 1]]);
    pPoly(OLC, [[x - 7, by - 24], [x, by - 34], [x + 7, by - 24]]); pPoly('#9a3a2a', [[x - 5, by - 25], [x, by - 32], [x + 5, by - 25]]);
    P(OLC, x - 2, by - 8, 4, 8); P('#5a3a22', x - 1, by - 7, 2, 7); P(OLC, x - 1, by - 19, 3, 3); P('#ffd070', x, by - 18, 1, 1);
  }), bx: 11, by: 38 };
}
function owHedge(len, seed) {
  return { c: owC('hdg' + len + '_' + seed, len + 2, 16, () => {
    const R = RNG(seed);
    P('#24301e', 0, 3, len + 2, 13); P('#3e5a30', 1, 7, len, 8); P('#5e7e40', 1, 4, len, 4); P('#7a9a50', 1, 4, len, 1);
    for (let i = 0; i < len * 1.4; i++) { P(R() < .5 ? '#2e4626' : '#4e6e38', 1 + R() * len, 8 + R() * 6, 1, 1); P(R() < .5 ? '#8aaa5a' : '#4e6e38', 1 + R() * len, 4 + R() * 3, 1, 1); }
    if (R() < .3) { P('#e8a0c8', 1 + R() * (len - 1), 5, 1, 1); }
  }), bx: len / 2 + 1, by: 14 };
}
function owGrave(k) {
  return { c: owC('grv' + k, 14, 18, () => {
    if (k === 0) { P(OLC, 3, 4, 8, 13); pEll(OLC, 7, 5, 4, 3); P('#a8a4b0', 4, 5, 6, 11); pEll('#a8a4b0', 7, 5, 3, 2); P('#c8c4d0', 4, 4, 2, 11); P('#6a6a76', 6, 8, 3, 1); P('#6a6a76', 6, 10, 3, 1); P('#5a7a4a', 4, 15, 3, 1); }
    else if (k === 1) { P(OLC, 5, 1, 4, 16); P(OLC, 2, 4, 10, 4); P('#9a96a4', 6, 2, 2, 14); P('#9a96a4', 3, 5, 8, 2); P('#c0bcc8', 6, 2, 1, 14); }
    else if (k === 2) { pPoly(OLC, [[3, 17], [6, 1], [8, 1], [11, 17]]); pPoly('#8a8696', [[4, 16], [6.5, 3], [7.5, 3], [10, 16]]); P('#aaa6b4', 6, 4, 1, 12); }
    else { P(OLC, 1, 9, 12, 8); P('#7a7684', 2, 10, 10, 6); P('#9a96a4', 2, 10, 10, 1); P('#5a5a66', 4, 12, 6, 1); }
  }), bx: 7, by: 16 };
}
function owCrypt() {
  return { c: owC('crypt', 30, 30, () => {
    P(OLC, 3, 10, 24, 18); P('#7a7684', 4, 11, 22, 16); P('#5e5a68', 18, 11, 8, 16); pPoly(OLC, [[1, 12], [15, 2], [29, 12]]); pPoly('#5a5666', [[3, 11], [15, 4], [27, 11]]); pPoly('#7a7684', [[3, 11], [15, 4], [15, 11]]);
    P(OLC, 11, 16, 8, 11); P('#1a1220', 12, 17, 6, 10); P('#a8a4b0', 5, 13, 2, 14); P('#a8a4b0', 23, 13, 2, 14); P('#a060e0', 14, 20, 2, 2);
  }), bx: 15, by: 27 };
}
function owRock(v, ash) {
  return { c: owC('rk' + v + (ash ? 'a' : ''), 18, 14, () => {
    const R = RNG(v * 17 + (ash ? 99 : 0)), c = ash ? ['#2a2028', '#4a3a46', '#6a5866'] : ['#5a5a66', '#8a8a96', '#b4b4c0'];
    const rx = R.r(4, 7), ry = R.r(3, 5); pEll(OLC, 9, 12 - ry, rx + 1, ry + 1); pEll(c[0], 9, 12 - ry, rx, ry); pEll(c[1], 8, 11 - ry, rx * .75, ry * .7); pEll(c[2], 7, 10 - ry, rx * .35, ry * .3);
    if (!ash && R() < .5) P('#5a8a3a', 6, 12 - ry * 2 + 1, 4, 1); if (ash && R() < .6) P('#e0602a', 9, 11, 2, 1);
  }), bx: 9, by: 12 };
}
function owSpike(v) {
  return { c: owC('spk' + v, 16, 26, () => {
    const R = RNG(v * 7 + 3);
    for (let k = 0; k < 3; k++) { const x = 8 + (k - 1) * 4 + R.r(-1, 1), h = R.r(10, 22) * (k === 1 ? 1 : .7); pPoly(OLC, [[x - 3, 25], [x, 25 - h - 1], [x + 3, 25]]); pPoly('#2a1a34', [[x - 2, 24], [x, 25 - h], [x + 2, 24]]); pPoly('#6a3a7a', [[x - 2, 24], [x, 25 - h], [x, 24]]); P('#c080e0', x - 1, 25 - h * .7, 1, 2); }
  }), bx: 8, by: 24 };
}
function owBush(v, pal) { return { c: owC('bsh' + v + pal, 22, 16, () => { const R = RNG(v * 5 + 1); tdCanopy(11, 9, R.r(4, 6), PAL[pal], R, 5); if (R() < .4) { P('#e86a6a', 9, 7, 1, 1); P('#f0e070', 13, 9, 1, 1); } }), bx: 11, by: 14 }; }
function owMush() { return { c: owC('mush', 10, 8, () => { P('#e8e0d0', 3, 4, 1, 3); P('#e8e0d0', 6, 5, 1, 2); pEll(OLC, 3.5, 4, 3, 2); pEll('#d84a3a', 3.5, 3.5, 2.5, 1.5); P('#fff', 3, 3, 1, 1); pEll(OLC, 6.5, 5, 2, 1.5); pEll('#e8803a', 6.5, 4.5, 1.5, 1); }), bx: 5, by: 7 }; }
function owReed(v) { return { c: owC('reed' + v, 8, 12, () => { const R = RNG(v + 40); for (let i = 0; i < 4; i++) { const x = 1 + i * 2, h = R.i(5, 10); P('#3e6a34', x, 11 - h, 1, h); if (R() < .5) P('#8a5a30', x, 11 - h, 1, 2); } }), bx: 4, by: 11 }; }
function owHay() { return { c: owC('hay', 14, 12, () => { pEll(OLC, 7, 6, 6, 5); pEll('#d8b050', 7, 6, 5, 4); pEll('#f0d070', 6, 5, 3, 2); P('#a88030', 3, 6, 8, 1); }), bx: 7, by: 10 }; }
function owScare() { return { c: owC('scare', 14, 20, () => { P(OLC, 6, 6, 2, 14); P(OLC, 1, 8, 12, 2); P('#6a4a2a', 7, 7, 1, 13); P('#3a6a9a', 4, 8, 6, 6); P('#c84a3a', 2, 8, 3, 2); P('#c84a3a', 9, 8, 3, 2); pCirc(OLC, 7, 5, 3); pCirc('#e8c870', 7, 5, 2); pPoly('#8a5a2a', [[3, 4], [7, 0], [11, 4]]); }), bx: 7, by: 19 }; }
function owStatue() { return { c: owC('statue', 12, 24, () => { P(OLC, 1, 18, 10, 6); P('#8a8a96', 2, 19, 8, 4); P(OLC, 3, 6, 6, 13); P('#a8a8b4', 4, 7, 4, 11); pCirc(OLC, 6, 5, 3); pCirc('#b8b8c4', 6, 5, 2); P('#c8c8d4', 4, 8, 1, 9); P('#70d0e0', 5, 12, 2, 1); }), bx: 6, by: 23 }; }
function owTopiary(v) { return { c: owC('topi' + v, 14, 22, () => { P(OLC, 6, 15, 3, 6); P('#6a4a2a', 7, 15, 1, 6); pCirc(OLC, 7, 9, 6); pCirc('#4e7a38', 7, 9, 5); pCirc('#6e9a48', 6, 8, 3); P('#8aba5a', 5, 6, 2, 1); if (v) { pCirc(OLC, 7, 2, 3); pCirc('#5e8a40', 7, 2, 2); } }), bx: 7, by: 20 }; }
function owLantern() { return { c: owC('lant', 10, 22, () => { P(OLC, 4, 4, 2, 18); P('#3a3a48', 4, 5, 1, 16); P(OLC, 2, 2, 6, 6); P('#ffd870', 3, 3, 4, 4); P('#fff4c0', 4, 4, 2, 2); P(OLC, 1, 1, 8, 2); }), bx: 5, by: 21 }; }
function owStake() { return { c: owC('stake', 5, 14, () => { pPoly(OLC, [[0, 14], [0, 3], [2, 0], [4, 3], [4, 14]]); P('#9a6a40', 1, 3, 2, 11); P('#c08a58', 1, 3, 1, 10); }), bx: 2, by: 13 }; }
function owPumpkin() { return { c: owC('pump', 12, 10, () => { pEll(OLC, 6, 6, 5, 4); pEll('#e07820', 6, 6, 4, 3); pEll('#f8a040', 4, 5, 1.5, 1.5); P('#3a6a2a', 6, 1, 1, 2); P('#ffe060', 4, 5, 1, 1); P('#ffe060', 7, 5, 1, 1); P('#ffc040', 5, 7, 3, 1); }), bx: 6, by: 9 }; }
function owFortress() {
  return { c: owC('fort', 150, 170, () => {
    const R = RNG(666), by = 166, cx = 75;
    // rocky crag it sits on
    pPoly('#120a12', [[0, by], [14, by - 30], [40, by - 46], [110, by - 48], [138, by - 28], [150, by]]); pPoly('#2a1e2a', [[4, by - 1], [18, by - 28], [42, by - 42], [108, by - 44], [134, by - 26], [146, by - 1]]); pPoly('#3e2e3c', [[4, by - 1], [18, by - 28], [42, by - 42], [70, by - 44], [60, by - 1]]);
    for (let i = 0; i < 40; i++) P(R() < .5 ? '#1a121a' : '#4a3a48', R.r(10, 140), R.r(by - 40, by - 4), R.i(2, 6), 1);
    // curtain wall with battlements
    const wy = by - 44; P('#0e080e', 20, wy - 34, 110, 36); P('#3a2a3a', 21, wy - 33, 108, 34); P('#4e3a4c', 21, wy - 33, 108, 3); for (let x = 21; x < 129; x += 6) { P('#0e080e', x, wy - 38, 4, 5); P('#4e3a4c', x + 1, wy - 37, 2, 4); }
    for (let r = 0; r < 34; r += 5) for (let x = 21 + (r % 10 ? 4 : 0); x < 128; x += 9) P('#2e202e', x, wy - 33 + r, 1, 4);
    // towers
    [[22, 70, 16], [46, 96, 18], [cx - 10, 124, 20], [94, 100, 18], [118, 74, 16]].forEach(([tx, th, tw], i) => {
      const ty = wy - th + 4; P('#0e080e', tx - 1, ty, tw + 2, th); P('#3a2a3a', tx, ty + 1, tw, th - 1); P('#2a1e2a', tx + tw - 5, ty + 1, 5, th - 1); P('#5a4658', tx, ty + 1, 2, th - 1);
      for (let r = 6; r < th - 4; r += 6) P('#2a1e2a', tx, ty + r, tw, 1);
      pPoly('#0e080e', [[tx - 4, ty + 2], [tx + tw / 2, ty - 26 - (i === 2 ? 14 : 0)], [tx + tw + 4, ty + 2]]); pPoly('#2a1430', [[tx - 2, ty + 1], [tx + tw / 2, ty - 24 - (i === 2 ? 14 : 0)], [tx + tw + 2, ty + 1]]); pPoly('#4a2a52', [[tx - 2, ty + 1], [tx + tw / 2, ty - 24 - (i === 2 ? 14 : 0)], [tx + tw / 2, ty + 1]]);
      for (let k = 0; k < 3; k++) { const wy2 = ty + 10 + k * 16; if (wy2 > ty + th - 10) break; P('#0e080e', tx + tw / 2 - 2, wy2, 4, 6); P(k % 2 ? '#c070ff' : '#a050e0', tx + tw / 2 - 1, wy2 + 1, 2, 4); }
    });
    // gate
    P('#0a060a', cx - 10, wy - 18, 20, 20); pEll('#0a060a', cx, wy - 18, 10, 8); for (let x = cx - 8; x < cx + 9; x += 3) P('#3a2a3a', x, wy - 22, 1, 22); P('#ff60a0', cx - 1, wy - 30, 2, 2);
    // banners hanging on the wall
    [[34, '#8a1428'], [108, '#8a1428']].forEach(([bx, col]) => { P(OLC, bx - 1, wy - 30, 9, 18); P(col, bx, wy - 29, 7, 15); pPoly(col, [[bx, wy - 14], [bx + 3.5, wy - 10], [bx + 7, wy - 14]]); P('#e0c050', bx + 2, wy - 25, 3, 3); });
    // stairway down the crag
    for (let k = 0; k < 8; k++) P(k % 2 ? '#5a4a58' : '#4a3a48', cx - 6 - k, wy + 2 + k * 5, 12 + k * 2, 3);
  }), bx: 75, by: 160 };
}
function owPin(st, lab) {
  return { c: owC('pin' + st + lab, 22, 32, () => {
    const x = 11, y = 11, r = st === 'boss' ? 9 : 8;
    P(OLC, x - 2, y + 6, 5, 22); P('#8a7a6a', x - 1, y + 7, 3, 20); P('#b0a08a', x - 1, y + 7, 1, 20); P(OLC, x - 5, 28, 11, 3); P('#6a5a4a', x - 4, 28, 9, 2);
    const ring = st === 'lock' ? ['#5a5458', '#7a7478', '#9a949a'] : st === 'boss' ? ['#7a1428', '#c83a4a', '#ff7a7a'] : st === 'home' ? ['#3a5a8a', '#6a9ac8', '#a8d0f0'] : ['#9a6a2a', '#e8b850', '#fff0a0'];
    pCirc(OLC, x, y, r + 1); pCirc(ring[0], x, y, r); pCirc(ring[1], x, y - .5, r - 1.5); pCirc(ring[2], x - 2, y - 3, 2);
    if (st === 'lock') { P(OLC, x - 3, y - 1, 7, 6); P('#c8c0c8', x - 2, y, 5, 4); P(OLC, x - 2, y - 5, 5, 4); P('#c8c0c8', x - 1, y - 4, 3, 3); P(OLC, x, y + 1, 1, 2); }
    else if (st === 'boss') { pCirc('#f0e8d8', x, y - 1, 4); P('#f0e8d8', x - 2, y + 2, 5, 2); P('#1a1016', x - 2, y - 2, 2, 2); P('#1a1016', x + 1, y - 2, 2, 2); P('#1a1016', x - 1, y + 2, 1, 1); P('#1a1016', x + 1, y + 2, 1, 1); }
    else if (st === 'home') { pPoly('#f8f0e0', [[x - 5, y], [x, y - 5], [x + 5, y]]); P('#f8f0e0', x - 4, y, 8, 4); P('#3a5a8a', x - 1, y + 1, 2, 3); }
    else PFont.draw(ctx, lab, x, y + 3, 8, '#3a2410', 'center', 'alphabetic', null);
  }), bx: 11, by: 30 };
}
function owCloud(v) {
  return { c: owC('cloud' + v, 120, 44, () => {
    const R = RNG(v * 9 + 2); const bl = []; for (let i = 0; i < 9; i++) bl.push([R.r(22, 98), R.r(18, 28), R.r(10, 20)]);
    for (const [x, y, r] of bl) pEll('#b8c0dc', x, y + 3, r, r * .7); for (const [x, y, r] of bl) pEll('#eef0fa', x, y, r * .9, r * .62); for (const [x, y, r] of bl) pEll('#ffffff', x - r * .3, y - r * .25, r * .45, r * .3);
  }), bx: 60, by: 40 };
}
function owPuff() { return owC('puff', 8, 8, () => { ctx.globalAlpha = .55; pCirc('#e8e4ec', 4, 4, 3.5); ctx.globalAlpha = .8; pCirc('#ffffff', 3.5, 3.5, 2); ctx.globalAlpha = 1; }); }
function owEmber() { return owC('ember', 4, 4, () => { P('#e0a0ff', 1, 1, 2, 2); P('#ffffff', 1, 1, 1, 1); }); }

/* ---------------- world composition ---------------- */
function ow3Build() {
  if (ow3.built) return; ow3.built = true;
  const R = RNG(7311), O = [], put = (art, x, y, reg, o = {}) => O.push(Object.assign({ art, x, y, reg }, o));
  const [vx, vy] = MAP_NODES[0], [fx, fy] = MAP_NODES[25];
  const riverD = (x, y) => Math.abs(riverX(y) - x);
  const vill = (x, y) => Math.hypot(x - vx, (y - vy + 10) * 1.3) < 78;
  const fort = (x, y) => Math.abs(x - fx) < 82 && y > fy - 60 && y < fy + 30;
  // fields near the village (also painted in the ground)
  ow3.fields = [];
  for (let i = 0; i < 40 && ow3.fields.length < 14; i++) { const x = R.r(30, 540), y = R.r(630, 880), w = R.r(34, 64), h = R.r(20, 34); if (regionAt(x + w / 2, y + h / 2) !== 0 || nearPath(x + w / 2, y + h / 2, 34) || vill(x + w / 2, y + h / 2) || riverD(x + w / 2, y) < 30 || Math.hypot(x + w / 2 - 60, y + h / 2 - 700) < 30) continue; if (ow3.fields.some(f => x < f.x + f.w + 6 && x + w + 6 > f.x && y < f.y + f.h + 6 && y + h + 6 > f.y)) continue; ow3.fields.push({ x, y, w, h, col: R.pick(OW_FIELD), hay: R() < .5 }); }
  const inField = (x, y) => ow3.fields.some(f => x > f.x - 4 && x < f.x + f.w + 4 && y > f.y - 3 && y < f.y + f.h + 6);
  for (const f of ow3.fields) { if (f.hay) for (let k = 0; k < 3; k++) put(owHay(), f.x + 8 + R() * (f.w - 16), f.y + 6 + R() * (f.h - 8), 0); else if (R() < .5) put(owScare(), f.x + f.w / 2, f.y + f.h / 2 + 4, 0); }
  // scatter
  for (let i = 0; i < 4200; i++) {
    const x = R.r(4, MW - 4), y = R.r(14, MH - 4);
    if (nearPath(x, y, 13) || riverD(x, y) < 15 || vill(x, y) || fort(x, y) || inField(x, y)) continue;
    const r = regionAt(x, y), q = R();
    if (r === 0) { const gv = vnoise2(x * .011, y * .013); if (q < (gv > .25 ? .55 : .07)) put(owTree(R.i(6, 10), R() < .2 ? 'leafAut' : R() < .15 ? 'leafGold' : 'leaf', R.i(0, 12), 'round'), x, y, 0, { sway: 1 }); else if (q < .26) put(owBush(R.i(0, 5), 'leaf'), x, y, 0); else if (q < .28) put(owRock(R.i(0, 5)), x, y, 0); }
    else if (r === 1) { if (q < .62) { const pine = R() < .55; put(owTree(R.i(pine ? 7 : 7, pine ? 12 : 11), 'leafDark', R.i(0, 10), pine ? 'pine' : 'round'), x, y, 1, { sway: 1 }); } else if (q < .67) put(owMush(), x, y, 1); else if (q < .7) put(owBush(R.i(0, 4), 'leafDark'), x, y, 1); }
    else if (r === 2) { if (q < .2) put(owGrave(R.i(0, 4)), x, y, 2); else if (q < .27) put(owTree(R.i(8, 12), 'leaf', R.i(0, 6), 'dead'), x, y, 2); else if (q < .3) put(owBush(R.i(0, 3), 'leafDark'), x, y, 2); else if (q < .305) put(owCrypt(), x, y, 2); else if (q < .31) put(owLantern(), x, y, 2, { lamp: 1 }); }
    else if (r === 3) { if (q < .05) put(owTopiary(R.i(0, 2)), x, y, 3); else if (q < .1) put(owTree(R.i(6, 9), 'leafGold', R.i(0, 6), 'round'), x, y, 3, { sway: 1 }); else if (q < .283) put(owStatue(), x, y, 3); }
    else { if (q < .08) put(owTree(R.i(7, 11), 'leaf', R.i(0, 6), 'dead'), x, y, 4); else if (q < .15) put(owRock(R.i(0, 6), true), x, y, 4); else if (q < .2) put(owSpike(R.i(0, 5)), x, y, 4); }
  }
  // a real hedge maze (DFS) across the dusk meadow, carved open where the road runs
  { const CS = 20, X0 = 740, Y0 = 160, NX = 22, NY = 12, vis = new Uint8Array(NX * NY), wallR = new Uint8Array(NX * NY).fill(1), wallD = new Uint8Array(NX * NY).fill(1), st = [[0, 0]]; vis[0] = 1;
    while (st.length) { const [cx, cy] = st[st.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < NX && y < NY && !vis[y * NX + x]);
      if (!nb.length) { st.pop(); continue; } const [nx, ny, dx, dy] = nb[(R() * nb.length) | 0]; if (dx === 1) wallR[cy * NX + cx] = 0; else if (dx === -1) wallR[ny * NX + nx] = 0; else if (dy === 1) wallD[cy * NX + cx] = 0; else wallD[ny * NX + nx] = 0; vis[ny * NX + nx] = 1; st.push([nx, ny]); }
    const ok = (x, y) => regionAt(x, y) === 3 && !nearPath(x, y, 15) && riverD(x, y) > 18;
    for (let gy = 0; gy < NY; gy++) for (let gx = 0; gx < NX; gx++) { const x = X0 + gx * CS, y = Y0 + gy * CS;
      if (wallD[gy * NX + gx] && R() > .12 && ok(x + CS / 2, y + CS)) put(owHedge(CS, R.i(0, 6)), x + CS / 2, y + CS, 3);
      if (wallR[gy * NX + gx] && R() > .12) for (let k = 2; k < CS; k += 4) if (ok(x + CS, y + k)) put(owHedge(5, R.i(0, 6)), x + CS, y + k, 3);
      if (R() < .025 && ok(x + 10, y + 10)) put(owStatue(), x + 10, y + 10, 3); else if (R() < .03 && ok(x + 10, y + 10)) put(owLantern(), x + 10, y + 10, 3, { lamp: 1 }); } }
  // mountains across the north-west (around the fortress) + a snowy range beyond the map edge
  for (let i = 0; i < 36; i++) { const x = R.r(120, 820), y = R.r(30, 170), h = R.i(34, 70); if (nearPath(x, y, 30) || fort(x, y + 10) || regionAt(x, y) !== 4 && regionAt(x, y) !== 3) continue; put(owMount(Math.round(h * R.r(1.3, 1.8)), h, R.i(0, 8), 'ash'), x, y, regionAt(x, y)); }
  for (let x = -240; x < MW + 260; x += R.r(40, 80)) put(owMount(R.i(90, 150), R.i(70, 120), R.i(0, 9), 'snow'), x, R.r(-40, -6), -1, { far: 1 });
  for (let x = -200; x < MW + 220; x += R.r(30, 60)) put(owMount(R.i(60, 100), R.i(40, 70), R.i(0, 9), x < 820 ? 'ash' : 'rock'), x, R.r(4, 18), -1);
  // forest margins (east / west / south) so the world doesn't end at a cliff
  for (let i = 0; i < 520; i++) { const side = R.i(0, 3); let x, y; if (side === 0) { x = R.r(-80, 10); y = R.r(20, MH + 60); } else if (side === 1) { x = R.r(MW - 10, MW + 80); y = R.r(20, MH + 60); } else { x = R.r(-80, MW + 80); y = R.r(MH - 8, MH + 70); } const r = regionAt(clamp(x, 0, MW), clamp(y, 0, MH)); put(owTree(R.i(8, 13), r === 2 || r === 4 ? 'leafDark' : r === 0 ? (R() < .25 ? 'leafAut' : 'leaf') : 'leafDark', R.i(0, 10), R() < (r === 1 ? .6 : .25) ? 'pine' : 'round'), x, y, -1, { sway: 1 }); }
  // reeds along the river
  for (let y = 10; y < MH; y += R.r(8, 20)) { const s = R() < .5 ? -1 : 1, x = riverX(y) + s * (12 + R() * 4); if (!nearPath(x, y, 10)) put(owReed(R.i(0, 4)), x, y, regionAt(x, y)); }
  // village: houses, chapel, palisade, windmill
  ow3.houses = [];
  [[-58, -30], [-32, -40], [-4, -44], [26, -38], [-66, 2], [-46, 26], [22, 24]].forEach(([dx, dy], i) => ow3.houses.push([vx + dx - 7, vy + dy - 10, i]));
  ow3.chapel = [vx + 52, vy - 14];
  for (let a = 0; a < TAU; a += .085) { const x = vx + Math.cos(a) * 80, y = vy - 8 + Math.sin(a) * 58; if (nearPath(x, y, 8)) continue; put(owStake(), x, y, 0); }
  ow3.mill = [60, 700];
  // graveyard pumpkins (map.js keeps its own list for the 2D path)
  ow3.pumpkins = []; while (ow3.pumpkins.length < 14) { const x = R.r(1040, 1330), y = R.r(320, 600); if (regionAt(x, y) === 2 && !nearPath(x, y, 12)) { ow3.pumpkins.push([x, y]); put(owPumpkin(), x, y, 2); } }
  // bridges where the road crosses the river
  ow3.bridges = []; for (let i = 0; i < MAP_PATH_PTS.length; i++) { const p = MAP_PATH_PTS[i]; if (riverD(p[0], p[1]) < 3 && !ow3.bridges.some(b => Math.hypot(b[0] - p[0], b[1] - p[1]) < 30)) ow3.bridges.push([p[0], p[1]]); }
  for (const [bx, by] of ow3.bridges) { const art = owC('brail', 34, 8, () => { for (let x = 1; x < 34; x += 6) { P(OLC, x - 1, 0, 3, 8); P('#a8703a', x, 1, 1, 7); } P(OLC, 0, 1, 34, 3); P('#c88a4a', 1, 2, 32, 1); }); put({ c: art, bx: 17, by: 7 }, bx, by + 7, regionAt(bx, by)); put({ c: art, bx: 17, by: 7 }, bx, by - 6, regionAt(bx, by)); }
  O.sort((a, b) => a.y - b.y); ow3.objs = O;
}
function ow3Ground() {
  return Cache.get('ow3_ground', MW, MH, (c, w, h) => {
    ow3Build();
    const id = c.createImageData(w, h), d = id.data, pals = OW_PAL.map(p => ['dk2', 'dk', 'base', 'lt', 'lt2'].map(k => hexToRgb(p[k])));
    const edge = hexToRgb('#173322');
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const j = owHash(x >> 1, y >> 1), r = regionAt(x + (j - .5) * 14, y + (owHash(y, x) - .5) * 14), n = vnoise2(x * .012 + r * 3, y * .016) * .7 + vnoise2(x * .05, y * .06 + r) * .3, dd = ((x + y) >> 1) & 1;
      let k = n < -.35 ? 1 : n < -.3 ? (dd ? 1 : 2) : n < .28 ? 2 : n < .33 ? (dd ? 3 : 2) : n < .55 ? 3 : n < .6 ? (dd ? 4 : 3) : 4;
      if (j < .03) k = 0; else if (j > .985) k = Math.min(4, k + 1);
      let col = pals[r][k];
      const m = Math.min(x, w - x, h - y); if (m < 26) { const t = 1 - m / 26; if (owHash(x * 3, y * 7) < t * t) col = edge; }
      for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) { const o = ((y + yy) * w + x + xx) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; }
    }
    c.putImageData(id, 0, 0);
    const R = RNG(5150);
    // region detail: tufts, flowers, dirt patches, bones, cracks
    for (let i = 0; i < 9000; i++) {
      const x = R.r(0, w), y = R.r(0, h), r = regionAt(x, y), pal = OW_PAL[r];
      if (r === 0) { const q = R(); if (q < .5) { P(pal.dk, x, y, 1, 2); P(pal.lt2, x + 1, y - 1, 1, 2); } else if (q < .62) P(R.pick(['#f8f0f0', '#f0d860', '#e88aa8', '#a8c8f8']), x, y, 1, 1); else if (q < .66) { pEll(shade(pal.base, -.1), x, y, R.r(4, 9), R.r(2, 4)); } }
      else if (r === 1) { const q = R(); if (q < .45) { P(pal.dk2, x, y, 2, 1); P(pal.lt, x, y - 1, 1, 1); } else if (q < .5) P('#a8c060', x, y, 1, 1); else if (q < .56) pEll('#2a4a30', x, y, R.r(4, 10), R.r(2, 4)); }
      else if (r === 2) { const q = R(); if (q < .3) P(pal.dk2, x, y, 2, 1); else if (q < .36) pEll('#4a4440', x, y, R.r(3, 8), R.r(2, 3)); else if (q < .38) P('#d8d0c0', x, y, 2, 1); else if (q < .45) P(pal.lt2, x, y, 1, 1); }
      else if (r === 3) { const q = R(); if (q < .35) { P(pal.dk, x, y, 1, 2); P(pal.lt2, x + 1, y, 1, 1); } else if (q < .45) P(R.pick(['#f0b0d0', '#f8e0a0', '#c0a0f0']), x, y, 1, 1); else if (q < .5) pEll('#b8a888', x, y, R.r(3, 7), R.r(1, 3)); }
      else { const q = R(); if (q < .3) P(pal.dk2, x, y, R.i(1, 4), 1); else if (q < .36) pEll('#2a1e28', x, y, R.r(4, 10), R.r(2, 4)); else if (q < .4) P('#5e4656', x, y, 1, 1); }
    }
    // maze gravel walks
    for (let i = 0; i < 26; i++) { const x = R.r(760, 1120), y = R.r(170, 360); if (regionAt(x, y) !== 3 || nearPath(x, y, 16)) continue; const horiz = R() < .5, len = R.r(20, 50); P('#a49a7a', x, y, horiz ? len : 6, horiz ? 6 : len); P('#bcb092', x + 1, y + 1, horiz ? len - 2 : 4, horiz ? 4 : len - 2); }
    // fields with crop rows
    for (const f of ow3.fields) { P(shade(f.col, -.45), f.x - 1, f.y - 1, f.w + 2, f.h + 3); P(shade(f.col, -.15), f.x, f.y, f.w, f.h); for (let k = 1; k < f.h; k += 3) { P(f.col, f.x + 1, f.y + k, f.w - 2, 1); for (let xx = 2; xx < f.w - 2; xx += 3) if (R() < .5) P(shade(f.col, .3), f.x + xx, f.y + k - 1, 1, 1); } }
    // object contact shadows
    for (const o of ow3.objs) { if (o.far || o.y < 0 || o.y > h) continue; const ww = o.art.c.width; c.globalAlpha = .26; pEll('#14182a', o.x + ww * .12, o.y + 1, ww * .42, Math.max(1.5, ww * .13)); }
    c.globalAlpha = 1;
    // river: sand banks, deep channel, foam
    for (let y = -2; y < h; y++) { const x = riverX(y), wd = 9 + Math.sin(y / 60) * 2; P('#b89a68', x - wd - 4, y, wd * 2 + 8, 1); P('#5a8a6a', x - wd - 2, y, wd * 2 + 4, 1); P('#3a8aac', x - wd, y, wd * 2, 1); P('#2a6a94', x - wd * .55, y, wd * 1.1, 1); if (owHash(y, 3) < .1) P('#a8e0f0', x - wd + 1, y, 2, 1); if (owHash(y, 9) < .1) P('#a8e0f0', x + wd - 3, y, 2, 1); }
    // pond near the village
    pEll('#b89a68', 250, 840, 30, 13); pEll('#3a8aac', 250, 840, 27, 11); pEll('#2a6a94', 252, 841, 17, 6); P('#d0f0f8', 238, 836, 6, 1);
    // road
    tdPath(MAP_PATH_PTS.map(p => [p[0], p[1]]), 8, PAL.dirt, R);
    for (const [bx, by] of ow3.bridges) { P(OLC, bx - 17, by - 6, 34, 14); for (let k = 0; k < 32; k += 3) { P(k % 6 ? '#b8784a' : '#a0683e', bx - 16 + k, by - 5, 2, 12); P('#d8a068', bx - 16 + k, by - 5, 1, 12); } }
    // village plaza + fortress courtyard
    const [vx, vy] = MAP_NODES[0]; pEll('#7a5236', vx, vy - 8, 62, 38); pEll(PAL.dirt.dk, vx, vy - 8, 60, 36); pEll(PAL.dirt.base, vx, vy - 9, 54, 31); for (let i = 0; i < 260; i++) { const a = R() * TAU, d = Math.sqrt(R()), x = vx + Math.cos(a) * d * 50, y = vy - 9 + Math.sin(a) * d * 28; P(R() < .5 ? PAL.dirt.lt : PAL.dirt.dk, x, y, R.i(1, 3), 1); } pEll('#8a8278', vx, vy - 4, 12, 6); pEll('#a8a094', vx, vy - 5, 10, 5); for (let i = 0; i < 14; i++) P('#c8c0b0', vx - 9 + R() * 18, vy - 8 + R() * 6, 2, 1);
    const [fx, fy] = MAP_NODES[25]; pEll('#1a121a', fx, fy - 4, 88, 26);
    // lava (base colour; the glowing part is a separate emissive layer)
    for (const L of ow3Lava(true)) { pLine('#1a0e12', L[0], L[1], L[2], L[3], 3); }
    // region names, painted onto the land like a map
  });
}
function ow3Lava(lines) {
  if (!ow3.lava) { const R = RNG(9090), out = []; for (let i = 0; i < 60; i++) { let x = R.r(160, 800), y = R.r(90, 300); if (regionAt(x, y) !== 4 || nearPath(x, y, 14)) continue; for (let k = 0; k < 9; k++) { const nx = x + R.r(-9, 9), ny = y + R.r(2, 7); out.push([x, y, nx, ny]); x = nx; y = ny; } } ow3.lava = out; }
  if (lines) return ow3.lava;
  return Cache.get('ow3_lava', MW, 360, () => { for (const [a, b, c2, d] of ow3.lava) { ctx.globalAlpha = .35; pLine('#ff6020', a, b, c2, d, 3); ctx.globalAlpha = 1; pLine('#ff9a30', a, b, c2, d, 1); } for (let i = 0; i < ow3.lava.length; i += 23) { const [x, y] = ow3.lava[i]; pEll('#c03010', x, y, 8, 4); pEll('#ff8a20', x, y, 6, 3); pEll('#ffe070', x - 1, y - 1, 2, 1); } });
}

/* ---------------- per-frame drawing ---------------- */
Scenes.overworld.hd = true;
Scenes.overworld.worldMouse = function () { if (HD.live) return HD.unproject(Input.mouse.lx, Input.mouse.ly); return [Input.mouse.lx - 320 + Cam.x, Input.mouse.ly - 180 + Cam.y]; };
// node picking in screen space (pins stand up in 2.5D)
Scenes.overworld.pickNode = function (rad = 14) {
  let best = -1, bd = rad; const lift = HD.live ? 11 : 0;
  MAP_NODES.forEach((n, i) => { const [sx, sy] = Cam.toScreen(n[0], n[1]); const d = Math.hypot(sx - Input.mouse.lx, sy - lift - Input.mouse.ly); if (d < bd) { bd = d; best = i; } });
  return best;
};
Scenes.overworld.drawHD = function () {
  ow3Build(); const t = this.t, nk = World.nightK(), night = nk > .5, lit = nk > .3; let c;
  HD.begin({ pitch: 38, fov: 40, zs: 'auto', tx: Cam.x - Cam.rx + Cam.sx, ty: Cam.y + Cam.sy + 10, zoom: (Cam.zoom + Cam.punch) * 1.05, maxBack: 360, clear: [.1, .14, .2],
    fog: [560, 1100, .38 + World.fog * .3], fogC: night ? [.12, .13, .25] : [.74, .8, .92], cloud: nk < .8 ? .26 * (1 - nk) : 0, dof: [.2, .2, .92, .9], bloom: [.68, night ? .7 : .4], vig: .5 });
  HD.ground(vForestTile(), -900, -700, { w: MW + 1800, h: MH + 1400, rep: true });
  HD.ground(ow3Ground(), 0, 0);
  const lk = .75 + Math.sin(t * 2.2) * .15 + noise1(t * 3) * .1; HD.ground(ow3Lava(), 0, 0, { col: [lk, lk * .9, lk * .8, 3] });
  const v = HD.view, vx0 = v.x0 - 40, vx1 = v.x1 + 40, vy0 = v.y0 - 10, vy1 = v.y1 + 140;
  // animated decals: river shimmer, pond, node rings
  HD.layer('decal'); c = ctx;
  for (let y = Math.max(0, Math.floor(vy0 / 5) * 5); y < Math.min(MH, vy1); y += 5) { const x = riverX(y); if (Math.sin(y * .3 + t * 3) > .55) P('#d8f4ff', x - 3 + Math.sin(y + t * 2) * 4, y, 3, 1); }
  if (Math.sin(t * 1.7) > 0) P('#d8f4ff', 246 + Math.sin(t) * 6, 843, 4, 1);
  MAP_NODES.forEach((n, i) => { const a = nodeArea(i); if (i > 0 && this.fogA[a] > .5) return; const [x, y] = n, sel = i === this.sel; c.globalAlpha = .35; pEll('#14182a', x + 2, y + 1, 9, 3); c.globalAlpha = 1; if (sel) { c.globalAlpha = .45 + Math.sin(t * 5) * .2; c.strokeStyle = '#fff4c0'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, y, 12 + Math.sin(t * 5), 7, 0, 0, TAU); c.stroke(); c.globalAlpha = 1; } });
  HD.groundLayer('decal');
  // locked-region fog: layered sheets just above the ground (billboards inside fade out)
  for (let i = 0; i < 5; i++) if (this.fogA[i] > .01) { const f = buildFog(i), a = this.fogA[i]; [[2, .8], [14, .5], [30, .35]].forEach(([lift, al], k) => HD.ground(f, Math.sin(t * .2 + i + k) * 5, 0, { lift, col: [1, 1, 1, a * al + 2] })); }
  // ---- depth-sorted billboards ----
  const L = [];
  for (const o of ow3.objs) { if (o.x < vx0 - 80 || o.x > vx1 + 80 || o.y < vy0 - (o.far ? 200 : 20) || o.y > vy1) continue; const fa = o.reg >= 0 ? this.fogA[o.reg] : 0; if (fa > .98) continue; L.push([o.y, o, 1 - fa]); }
  const [vx, vy] = MAP_NODES[0];
  for (const [hx, hy, i] of ow3.houses) L.push([hy + 10, { art: owHouse(i, lit), x: hx + 7, y: hy + 10 }, 1]);
  L.push([ow3.chapel[1], { art: owChapel(lit), x: ow3.chapel[0], y: ow3.chapel[1] }, 1]);
  L.push([ow3.mill[1], { art: owWindmillBody(), x: ow3.mill[0], y: ow3.mill[1] }, 1]);
  L.push([ow3.mill[1] + .5, () => HD.capture(ow3.mill[1] + .5, () => { const wx = ow3.mill[0], wy = ow3.mill[1] - 27; for (let k = 0; k < 4; k++) { const an = t * 1.4 + k * Math.PI / 2; pLine('#3a2a20', wx, wy, wx + Math.cos(an) * 17, wy + Math.sin(an) * 17, 2); pLine('#f0e8d8', wx + Math.cos(an) * 5, wy + Math.sin(an) * 5, wx + Math.cos(an + .22) * 16, wy + Math.sin(an + .22) * 16, 2); } P(OLC, wx - 1, wy - 1, 3, 3); }, null, 0, [ow3.mill[0] - 20, ow3.mill[1] - 47, 40, 40])]);
  const [fx, fy] = MAP_NODES[25]; if (this.fogA[4] < .98) {
    L.push([fy - 4, { art: owFortress(), x: fx, y: fy - 4 }, 1 - this.fogA[4]]);
    L.push([fy - 3, () => HD.capture(fy - 3, () => { for (let k = 0; k < 2; k++) { const px = fx - 14 + k * 28, py = fy - 150 + k * 6; P('#1a0e1a', px, py, 1, 14); for (let j = 0; j < 10; j++) P(k ? '#a01830' : '#8a1428', px + 1 + j, py + Math.sin(t * 5 + j * .6 + k) * 1.4, 1, 6); } }, null, 0, [fx - 20, fy - 160, 50, 30], { alpha: 1 - this.fogA[4] })]);
  }
  // pins
  MAP_NODES.forEach((n, i) => {
    const a = nodeArea(i), l = nodeLvl(i), open = this.unlockedNode(i); if (i > 0 && this.fogA[a] > .5) return;
    const st = i === 0 ? 'home' : !open ? 'lock' : l === 4 ? 'boss' : 'open', bob = i === this.sel ? Math.abs(Math.sin(t * 4)) * 2 : 0;
    L.push([n[1] + .2, { art: owPin(st, String(l + 1)), x: n[0], y: n[1], dy: -bob }, 1]);
    if (i > 0 && S.clears[a][l]) L.push([n[1] + .3, { art: { c: owC('chk', 9, 9, () => { pCirc(OLC, 4.5, 4.5, 4); pCirc('#7fc46a', 4.5, 4.5, 3); P('#f0fff0', 3, 4, 1, 2); P('#f0fff0', 4, 5, 1, 1); P('#f0fff0', 5, 2, 1, 3); }), bx: 4.5, by: 8 }, x: n[0] + 7, y: n[1], dy: -22 - bob }, 1]);
  });
  // traveller
  const [px, py] = this.pos;
  L.push([py + .4, () => HD.capture(py + 2.4, () => drawChar(px, py + 2, playerLook({ s: .9, face: this.face, walk: this.route ? this.walk : undefined, t })), null, 0, [px - 24, py - 46, 48, 52])]);
  L.sort((a, b) => a[0] - b[0]);
  for (const [, o, al] of L) { if (typeof o === 'function') { o(); continue; } const A = o.art, sc = o.sc || 1; HD.art(A.c, o.x - A.bx * sc, o.y - A.by * sc + (o.dy || 0), o.y, { alpha: al, scale: sc, sway: o.sway ? World.windSway(o.x, .5) * .8 : 0 }); }
  // chimney smoke + fortress embers (rising billboards)
  this.puffs = this.puffs || []; if (Math.random() < DT * 6) { const hh = ow3.houses[(Math.random() * 7) | 0]; this.puffs.push({ x: hh[0] + 15, y: hh[1] + 10, h: 24, a: 0, k: 0 }); }
  if (this.fogA[4] < .5 && Math.random() < DT * 8) this.puffs.push({ x: fx + rnd(-60, 60), y: fy - 4, h: rnd(10, 80), a: 0, k: 1 });
  for (const p of this.puffs) { p.a += DT; p.h += DT * (p.k ? 14 : 7); p.x += DT * (p.k ? Math.sin(p.a * 3) * 4 : 3 + World.wind * 8); }
  this.puffs = this.puffs.filter(p => p.a < (p.k ? 2.2 : 3.2));
  for (const p of this.puffs) { const life = p.a / (p.k ? 2.2 : 3.2), al = Math.sin(life * Math.PI) * (p.k ? 1 : .45); if (p.k) HD.art(owEmber(), p.x - 2, p.y - p.h - 2, p.y, { alpha: al, unlit: true }); else HD.art(owPuff(), p.x - 4, p.y - p.h - 4, p.y, { alpha: al, scale: 1 + life * 1.6 }); }
  // birds gliding high above
  if (this.birds) { const B = this.birds; HD.capture(B.y + 60, () => { for (let k = 0; k < B.n; k++) { const bx = B.x - k * 9, by = B.y + Math.abs(k - B.n / 2) * 5, f = Math.sin(t * 10 + k) > 0 ? 1 : 0; P('#2a2028', bx - 3, by - f, 3, 1); P('#2a2028', bx + 1, by - f, 3, 1); P('#2a2028', bx, by, 1, 1); } }, null, 0, [B.x - B.n * 9 - 6, B.y - 6, B.n * 9 + 12, B.n * 4 + 14]); }
  // reveal sparkles etc.
  HD.layer('top'); c = ctx; Particles.draw(false);
  AREAS.forEach((A, i) => { if (i > 4 || this.fogA[i] > .6) return; const [x, y] = REGION_C[i]; c.globalAlpha = 1 - this.fogA[i]; PFont.draw(c, A.name.toUpperCase(), x, y + 46, 12, 'rgba(255,244,214,.92)', 'center', 'alphabetic', 'rgba(20,12,8,.7)'); c.globalAlpha = 1; });
  HD.groundLayer('top');
  // drifting clouds high over the land
  for (let k = 0; k < 7; k++) { const cl = owCloud(k % 4), cx = ((k * 331 + t * (5 + World.wind * 9)) % (MW + 500)) - 250, cy = 60 + (k * 197) % (MH - 40); if (cx < vx0 - 140 || cx > vx1 + 140 || cy < vy0 || cy > vy1 + 60) continue; HD.art(cl.c, cx - cl.bx, cy - 150, cy, { alpha: (.5 - nk * .25) * (1 - World.rain * .4), unlit: nk > .5 ? false : true, lean: .6 }); }
  // ---- lighting ----
  Light.begin(mixA(World.ambient(), [255, 255, 255], .25));
  if (this.bolt > .3) Light.add(this.boltX, 120, 300, '#c0b0ff', this.bolt);
  Light.add(fx, fy - 30, 110, '#a040e0', .8, .2); Light.add(vx, vy - 20, 80 + nk * 30, '#ffb060', .3 + nk * .6, .1);
  for (let i = 0; i < ow3.lava.length; i += 30) Light.add(ow3.lava[i][0], ow3.lava[i][1], 34, '#ff6a20', .55, .25);
  if (nk > .2) { ow3.pumpkins.forEach(([x, y]) => Light.add(x, y, 22, '#ff9030', .8 * nk, .3)); for (const o of ow3.objs) if (o.lamp && o.x > vx0 && o.x < vx1) Light.add(o.x, o.y - 10, 30, '#ffd070', .8 * nk, .2); for (const [hx, hy] of ow3.houses) Light.add(hx + 7, hy + 6, 22, '#ffb050', .7 * nk, .1); Light.add(px, py - 6, 40, '#ffd090', .5 * nk, .2); }
  Light.apply();
  // ---- screen overlays ----
  HD.screenLayer(); c = ctx;
  if (this.bolt > .6) { const [sx] = Cam.toScreen(this.boltX, 200); let x = sx, y = 0; for (let k = 0; k < 9; k++) { const nx = x + rnd(-12, 12), ny = y + 20; pLine('#f0e8ff', x, y, nx, ny, 1); x = nx; y = ny; } }
  if (World.rain > .05) Weather.draw(400, World.rain * .6);
};
