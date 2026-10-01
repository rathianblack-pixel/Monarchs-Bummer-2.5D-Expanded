'use strict';
/* =========================================================
   ACT II ARENAS — HD 2.5D sets + LOW 2D backgrounds for areas 5–9
   New A3PAL kinds: sea · deep · snow · sky · candy
   Wraps a3sky / a3floor / a3def / a3anim / combatLights3D and the 2D
   drawCombatBG / drawCombatFG / combatLights for areas ≥ 5.
   ========================================================= */
Object.assign(A3PAL, {
  sea: { top: '#2a70c8', mid: '#7ab8ea', hor: '#f0e8c8', fog: [.82, .9, .96], clear: [.8, .9, .97] },
  deep: { top: '#02080e', mid: '#06202c', hor: '#0e4050', fog: [.05, .2, .26], clear: [.03, .12, .16] },
  snow: { top: '#5a7aa8', mid: '#a8c0dc', hor: '#eef4fa', fog: [.86, .9, .96], clear: [.88, .92, .97] },
  sky: { top: '#6a8ae8', mid: '#b8c8f8', hor: '#fff4e8', fog: [.92, .92, 1], clear: [.94, .94, 1] },
  candy: { top: '#c860b0', mid: '#f8a0c8', hor: '#fff0c0', fog: [.98, .8, .9], clear: [1, .86, .92] }
});
Object.assign(PAL, {
  beach: { base: '#e0c088', lt: '#f0d8a8', lt2: '#fff0cc', dk: '#c8a070', dk2: '#a88058', sh: '#8a6a50', edge: '#7a5a40' },
  deepsand: { base: '#1e4a52', lt: '#2a6068', lt2: '#3a7a80', dk: '#163a42', dk2: '#0e2a32', sh: '#081a20', edge: '#06141a' },
  snowfield: { base: '#e0ecf4', lt: '#f0f8ff', lt2: '#ffffff', dk: '#c0d4e4', dk2: '#a0b8d0', sh: '#8aa0b8', edge: '#6a88a8' },
  cloudfloor: { base: '#eceaf8', lt: '#f8f6ff', lt2: '#ffffff', dk: '#d0cceb', dk2: '#b8b4dc', sh: '#9a96c8', edge: '#8a86b8' },
  candyfloor: { base: '#f8c0d8', lt: '#fcd8e8', lt2: '#fff0f8', dk: '#e8a0c0', dk2: '#d080a8', sh: '#b06090', edge: '#904878' },
  palm: { base: '#3a9a48', lt: '#5ab858', lt2: '#90d870', dk: '#2a7a3a', dk2: '#1a5a30', ol: '#0e2a1e' },
  coral: { base: '#e86a7a', lt: '#f89aa0', lt2: '#ffd0c8', dk: '#b84a5a', dk2: '#8a2a40', ol: '#3a1020' }
});
const A2KIND = { 5: 'sea', 6: 'deep', 7: 'snow', 8: 'sky', 9: 'candy' }, A2FLOOR = { 5: 'beach', 6: 'deepsand', 7: 'snowfield', 8: 'cloudfloor', 9: 'candyfloor' };
/* ---------------- skies ---------------- */
function a3sky2(kind) {
  const W = A3.skyW, H = A3.skyH, pal = A3PAL[kind];
  return a3c('sky2_' + kind, W, H, () => {
    const R = RNG(77 + kind.length * 13);
    for (let y = 0; y < H; y++) { const k = y / H, c = k < .55 ? mix(pal.top, pal.mid, k / .55) : mix(pal.mid, pal.hor, (k - .55) / .45); P(c, 0, y, W, 1); if (y % 2 === 0) for (let x = (y / 2) % 4; x < W; x += 4) if (R() < .25) P(mix(c, pal.hor, .12), x, y, 1, 1); }
    const cloud = (cx, cy, s, col, sh) => { for (let k = 0; k < 6; k++) { const ox = R.r(-s * 1.6, s * 1.6), oy = R.r(-s * .3, s * .2), r = s * R.r(.5, .9); pEll(sh, cx + ox, cy + oy + 2, r, r * .55); pEll(col, cx + ox, cy + oy, r, r * .5); } };
    if (kind === 'sea') { pCirc('#fff8d8', 160, 60, 14); ctx.globalAlpha = .25; pCirc('#fff8d8', 160, 60, 26); ctx.globalAlpha = 1; for (let i = 0; i < 10; i++) cloud(R.r(0, W), R.r(20, 110), R.r(8, 18), '#ffffff', '#c8d8f0');
      for (let y = H - 46; y < H; y++) { const k = (y - (H - 46)) / 46; P(mix('#2a6aa8', '#5aa0d0', k), 0, y, W, 1); if (y % 3 === 0) for (let x = 0; x < W; x += 2) if (R() < .12) P('#d8f0ff', x, y, R.i(2, 6), 1); }
      for (let x = 560; x < 700; x++) { const h = 14 + Math.sin(x * .05) * 6; P('#3a6a5a', x, H - 46 - h, 1, h); } }
    else if (kind === 'deep') { for (let i = 0; i < 9; i++) { const x = R.r(0, W); ctx.globalAlpha = .07; pPoly('#a0f0ff', [[x - 8, 0], [x + 8, 0], [x + 60, H], [x + 20, H]]); } ctx.globalAlpha = 1;
      for (let i = 0; i < 14; i++) { const x = R.r(0, W), h = R.r(40, 110), w = R.r(14, 30); P('#04141c', x, H - h, w, h); pEll('#04141c', x + w / 2, H - h, w * .7, w * .4); for (let k = 0; k < 4; k++) if (R() < .5) P('#30a0a0', x + R.r(2, w - 3), H - h + R.r(6, h - 6), 2, 2); }
      for (let i = 0; i < 60; i++) P(R() < .5 ? '#3ac0c0' : '#80ffe0', R.r(0, W), R.r(0, H), 1, 1); }
    else if (kind === 'snow') { for (let L = 0; L < 3; L++) { const col = ['#b8c8e0', '#d0dcec', '#eaf2f8'][L], yb = H - 60 + L * 18; for (let x = 0; x < W; x++) { const h = 40 + L * -8 + Math.abs(Math.sin(x * (.012 + L * .006) + L * 3)) * (60 - L * 14) + vnoise2(x * .05, L) * 10; P(col, x, yb - h, 1, h + 80); if (L === 0 && x % 2 === 0 && h > 70) P('#ffffff', x, yb - h, 1, 3); } }
      for (let i = 0; i < 80; i++) P('#ffffff', R.r(0, W), R.r(0, H * .6), 1, 1); }
    else if (kind === 'sky') { pCirc('#fffbe8', 640, 50, 16); ctx.globalAlpha = .3; pCirc('#fffbe8', 640, 50, 30); ctx.globalAlpha = 1; for (let i = 0; i < 30; i++) cloud(R.r(0, W), R.r(H * .55, H - 6), R.r(12, 28), '#ffffff', '#d8d8f4');
      for (let i = 0; i < 6; i++) cloud(R.r(0, W), R.r(20, 70), R.r(6, 12), '#ffffff', '#e0e0f8');
      for (let i = 0; i < 3; i++) { const x = 120 + i * 260, y = H * .5 - i * 6; P('#d8d0e8', x, y - 40, 16, 40); pPoly('#c8b8e0', [[x - 4, y - 40], [x + 8, y - 58], [x + 20, y - 40]]); P('#f0e8ff', x + 2, y - 38, 3, 36); } }
    else if (kind === 'candy') { const sx = 400, sy = 64; ctx.globalAlpha = .3; pCirc('#fff4a0', sx, sy, 36); ctx.globalAlpha = 1; pCirc('#ffe870', sx, sy, 22); P('#3a2010', sx - 9, sy - 6, 4, 4); P('#3a2010', sx + 6, sy - 6, 4, 4); for (let a = .3; a < Math.PI - .3; a += .08) P('#3a2010', sx + Math.cos(a) * 13, sy + 2 + Math.sin(a) * 9, 2, 2); // the sun is smiling. too much.
      for (let i = 0; i < 12; i++) cloud(R.r(0, W), R.r(20, 120), R.r(8, 16), '#fff0f8', '#f0b8d8');
      for (let i = 0; i < 16; i++) { const x = R.r(0, W), h = R.r(30, 80); P('#e088b8', x, H - h, 10, h); pPoly('#f05a8a', [[x - 4, H - h], [x + 5, H - h - 16], [x + 14, H - h]]); P('#ffe0f0', x + 3, H - h + 8, 3, 4); } }
  });
}
{ const _sky = a3sky; a3sky = function (kind) { return A2KIND[5] && ['sea', 'deep', 'snow', 'sky', 'candy'].includes(kind) ? a3sky2(kind) : _sky(kind); }; }
/* ---------------- floors ---------------- */
function a3floor2(area, which) {
  const F = which === 'near' ? A3.near : A3.far, s = which === 'near' ? 1 : A3.far.s, W = Math.ceil(F.w / s), H = Math.ceil(F.h / s);
  return a3c('fl2_' + area + which, W, H, () => {
    const R = RNG(900 + area * 17 + (which === 'near' ? 0 : 5)), toY = y => (y - F.y) / s, Y = toY(CGY), pal = PAL[A2FLOOR[area]];
    tdGroundFill(pal, 0, 0, W, H, R, which === 'near' ? 1 : .4, area * 3);
    if (area === 5) { // wet sand + the tide line behind the fight
      const ty = toY(CGY - 230); for (let y = 0; y < ty; y++) { const k = y / Math.max(1, ty); P(mix('#1e5a8a', '#4a9ac8', k), 0, y, W, 1); if (R() < .4) for (let x = 0; x < W; x += 3) if (R() < .06) P('#c8e8ff', x, y, R.i(2, 8), 1); }
      for (let x = 0; x < W; x += 2) { const f = Math.sin(x * .03) * 4; P('#f8fcff', x, ty + f, 2, 2); P('#a8d0e0', x, ty + f + 2, 2, 5); }
      for (let i = 0; i < W * H / 900; i++) { const x = R.r(0, W), y = R.r(ty + 10, H); if (R() < .3) { pEll('#f8f0e0', x, y, 2, 1); } else if (R() < .1) { P('#d06a5a', x, y, 2, 1); } } }
    if (area === 6) { for (let i = 0; i < W * H / 500; i++) { const x = R.r(0, W), y = R.r(0, H); P(R() < .2 ? '#80ffe0' : '#3a7a80', x, y, 1, 1); } for (let i = 0; i < 30; i++) { const x = R.r(0, W), y = R.r(0, H); if (Math.abs(y - Y) < 40) continue; stoneTexture('#3a6a72', x, y, R.r(20, 60), R.r(8, 20), R, 8, 4); } }
    if (area === 7) { for (let i = 0; i < 20; i++) { const x = R.r(0, W), y = R.r(0, H); if (Math.abs(y - Y) < 50) continue; pEll('#a8d8f0', x, y, R.r(16, 50), R.r(5, 12)); pEll('#d8f4ff', x - 4, y - 2, R.r(8, 30), R.r(2, 6)); } }
    if (area === 8) { for (let i = 0; i < W * H / 300; i++) { const x = R.r(0, W), y = R.r(0, H); pEll(R() < .5 ? '#ffffff' : '#dcd8f0', x, y, R.r(3, 10), R.r(1, 3)); } const t0 = which === 'near' ? 40 : 14; for (let x = 0; x < W; x += t0) { P('#d8d0c0', x, Y - 18 / s, t0 - 2, 36 / s); P('#f0ead8', x + 1, Y - 17 / s, t0 - 4, 2); } }
    if (area === 9) { const t0 = which === 'near' ? 30 : 12; for (let y = 0; y < H; y += t0) for (let x = (y / t0 % 2) * t0; x < W; x += t0 * 2) { ctx.globalAlpha = .25; P('#ffffff', x, y, t0, t0); } ctx.globalAlpha = 1; for (let i = 0; i < W * H / 260; i++) P(pick(['#f05a8a', '#5af0c0', '#f0d040', '#8a5af0', '#ffffff']), R.r(0, W), R.r(0, H), 2, 1); }
  });
}
{ const _fl = a3floor; a3floor = function (area, raid, which) { return area >= 5 && !raid ? a3floor2(area, which) : _fl(area, raid, which); }; }
/* ---------------- props ---------------- */
function a3palm(seed) { return a3art('palm' + seed, 70, 120, 35, 117, () => { const R = RNG(seed), lean = R.r(-12, 12); for (let k = 0; k < 60; k++) { const t2 = k / 60, x = 35 + lean * t2 * t2, y = 117 - t2 * 84; P(OLC, x - 4, y, 8, 3); P(k % 4 < 2 ? '#a87a4a' : '#8a5a34', x - 3, y, 6, 3); P('#c89a68', x - 3, y, 2, 3); } const tx = 35 + lean, ty = 33;
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .52; for (let k = 0; k < 30; k++) { const x = tx + Math.cos(a) * k, y = ty + Math.sin(a) * k * .5 + k * k * .03; P(OLC, x - 2, y - 2, 4, 5); P(k > 20 ? PAL.palm.dk : PAL.palm.base, x - 1, y - 1, 2, 3); if (k % 3 === 0) P(PAL.palm.lt, x - 1, y + 1, 2, 2); } } for (let i = 0; i < 3; i++) { pCirc(OLC, tx - 3 + i * 3, ty + 4, 3); pCirc('#6a4a2a', tx - 3 + i * 3, ty + 4, 2); } }); }
function a3wreck() { return a3art('wreck', 140, 70, 70, 66, () => { pPoly(OLC, [[4, 40], [130, 30], [120, 66], [16, 66]]); pPoly('#6a4a30', [[6, 42], [128, 32], [118, 64], [18, 64]]); for (let x = 12; x < 124; x += 10) P('#4a3020', x, 40 - x * .08, 2, 24); P('#8a6a4a', 8, 42, 120, 2); P(OLC, 80, 0, 4, 40); P('#6a4a30', 81, 0, 2, 40); pPoly('#e8e0c8', [[84, 4], [110, 20], [84, 30]]); P('#c8b898', 84, 18, 16, 2); }); }
function a3crate(seed) { return a3art('crate' + seed, 26, 24, 13, 22, () => { P(OLC, 1, 2, 24, 21); P('#a87a4a', 2, 3, 22, 19); P('#c89a68', 2, 3, 22, 2); Ln2('#7a5a34', 3, 4, 23, 20); Ln2('#7a5a34', 23, 4, 3, 20); }); }
function Ln2(c, a, b, c2, d) { pLine(c, a, b, c2, d, 1); }
function a3coral(seed) { return a3art('coral' + seed, 40, 44, 20, 42, () => { const R = RNG(seed), col = R.pick([PAL.coral, { base: '#a060e0', lt: '#c090ff', dk: '#7040a8', ol: '#201030' }, { base: '#40c0b0', lt: '#80f0e0', dk: '#208080', ol: '#082020' }]); const br = (x, y, a, l, w) => { if (l < 4) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; pLine(col.ol, x, y, x2, y2, w + 2); pLine(col.base, x, y, x2, y2, w); pLine(col.lt, x - 1, y, x2 - 1, y2, 1); br(x2, y2, a - R.r(.3, .6), l * .7, Math.max(1, w - 1)); br(x2, y2, a + R.r(.3, .6), l * .7, Math.max(1, w - 1)); }; br(20, 42, -Math.PI / 2, 14, 4); }); }
function a3kelpArt(seed, h) { return a3art('kelp' + seed + '_' + h, 20, h + 4, 10, h + 2, () => { for (let k = 0; k < h; k++) { const x = 10 + Math.sin(k * .12 + seed) * 4; P('#0a2a14', x - 2, h + 2 - k, 4, 1); P(k % 7 < 3 ? '#3a8a3a' : '#2a6a2a', x - 1, h + 2 - k, 2, 1); if (k % 9 === 0) pEll('#4aa848', x + 3, h + 2 - k, 3, 1.5); } }); }
function a3gpillar(h, seed) { return a3art('gp' + h + '_' + seed, 44, h + 4, 22, h + 1, () => { const R = RNG(seed); P(OLC, 6, 8, 32, h - 6); P('#2a5a62', 7, 9, 30, h - 8); P('#3a7a80', 7, 9, 5, h - 8); P('#1a3a42', 31, 9, 5, h - 8); for (let y = 14; y < h - 6; y += 10) P('#1a4a52', 7, y, 30, 1); P(OLC, 2, 2, 40, 8); P('#4a8a90', 3, 3, 38, 5); P(OLC, 2, h - 6, 40, 7); P('#3a7a80', 3, h - 5, 38, 5); for (let i = 0; i < 5; i++) P('#3a8a4a', R.r(8, 34), R.r(10, h - 8), 2, R.i(3, 7)); if (R() < .5) pPoly('#06141a', [[24, 2], [40, 2], [40, 20]]); }); }
function a3snowpine(seed, r) { const base = tdTreeArt(r, PAL.leafDark, seed, 'pine'); return { c: a3c('snp' + seed + '_' + r, base.width, base.height, () => { ctx.drawImage(base, 0, 0); const W = base.width, D = ctx.getImageData(0, 0, W, base.height).data; for (let y = 0; y < base.height - 8; y += 3) for (let x = 0; x < W; x += 2) if (owHash(x + seed * 7, y) < .35) { const i = (y * W + x) * 4; if (D[i + 3] > 100 && D[i + 1] > 40) P(owHash(x, y + seed) < .5 ? '#f0f8ff' : '#d0e4f4', x, y, 2, 1); } }), bx: base.width / 2, by: base.height - 3 }; }
function a3ice(seed) { return a3art('ice' + seed, 40, 50, 20, 48, () => { const R = RNG(seed); for (let i = 0; i < 4; i++) { const x = 8 + i * 8 + R.r(-2, 2), h = R.r(16, 44); pPoly(OLC, [[x - 5, 48], [x, 48 - h], [x + 5, 48]]); pPoly('#8ac8f0', [[x - 4, 47], [x, 49 - h], [x + 4, 47]]); pPoly('#e0f8ff', [[x - 2, 46], [x, 50 - h], [x, 46]]); } }); }
function a3snowman() { return a3art('snowman', 30, 46, 15, 44, () => { pCirc(OLC, 15, 34, 11); pCirc('#f0f8ff', 15, 34, 10); pCirc(OLC, 15, 17, 8); pCirc('#f0f8ff', 15, 17, 7); P('#1a1016', 12, 15, 2, 2); P('#1a1016', 17, 15, 2, 2); P('#f08a20', 15, 18, 5, 2); P('#1a1016', 12, 21, 7, 1); P('#c83a4a', 8, 23, 15, 3); }); }
function a3column(h) { return a3art('col' + h, 40, h + 4, 20, h + 1, () => { P(OLC, 8, 8, 24, h - 6); P('#f0ead8', 9, 9, 22, h - 8); for (let x = 11; x < 30; x += 4) P('#d8d0c0', x, 9, 1, h - 8); P('#ffffff', 9, 9, 2, h - 8); P(OLC, 3, 2, 34, 8); P('#f8f2e4', 4, 3, 32, 5); P('#c8a040', 4, 7, 32, 1); P(OLC, 3, h - 6, 34, 7); P('#e8e0d0', 4, h - 5, 32, 5); }); }
function a3cloudProp(seed) { return a3art('cprop' + seed, 120, 50, 60, 46, () => { const R = RNG(seed); for (let i = 0; i < 9; i++) { const x = R.r(20, 100), y = R.r(20, 34), r = R.r(10, 18); pEll('#c8c4e8', x, y + 4, r, r * .6); pEll('#ffffff', x, y, r * .9, r * .55); } }); }
function a3banner(col) { return a3art('ban' + col, 24, 80, 12, 78, () => { P(OLC, 10, 0, 3, 80); P('#c8a040', 11, 0, 1, 80); P(OLC, 12, 4, 12, 34); P(col, 13, 5, 10, 30); pPoly(col, [[13, 35], [18, 30], [23, 35]]); P('#f0d070', 14, 12, 8, 2); }); }
function a3tentBig(seed) { return a3art('tentb' + seed, 110, 100, 55, 97, () => { const cols = [['#f05a8a', '#ffffff'], ['#8a5af0', '#f0d040'], ['#5ac0f0', '#ffffff']][seed % 3]; pPoly(OLC, [[4, 96], [55, 10], [106, 96]]); for (let i = 0; i < 10; i++) pPoly(cols[i % 2], [[6 + i * 10, 95], [55, 13], [6 + (i + 1) * 10, 95]]); P(OLC, 42, 62, 26, 34); P('#3a1a2a', 44, 64, 22, 32); P(OLC, 53, 0, 3, 14); pPoly('#f0d040', [[56, 0], [72, 4], [56, 9]]); for (let i = 0; i < 9; i++) pCirc(i % 2 ? '#f0d040' : '#ffffff', 10 + i * 11, 96 - (i < 5 ? i : 9 - i) * 0, 2); }); }
function a3lolli(seed) { return a3art('lolb' + seed, 40, 90, 20, 88, () => { P(OLC, 18, 34, 4, 56); P('#f8f0f0', 19, 34, 2, 56); pCirc(OLC, 20, 20, 19); const c1 = ['#f05a8a', '#5af0c0', '#f0d040', '#8a5af0'][seed % 4]; pCirc(c1, 20, 20, 18); for (let a = 0; a < 16; a += .25) P('#ffffff', 20 + Math.cos(a) * a * 1.05, 20 + Math.sin(a) * a * 1.05, 2, 2); }); }
function a3bunting(n) { return a3art('bunt' + n, n * 14 + 4, 30, n * 7 + 2, 28, () => { for (let i = 0; i <= n; i++) { P(OLC, i * 14 + 1, 0, 2, 30); } for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { const x = i * 14 + 3 + k * 4, y = 4 + Math.sin(k / 2 * Math.PI) * 2; pPoly(['#f05a8a', '#f0d040', '#5af0c0', '#8a5af0'][(i + k) % 4], [[x, y], [x + 4, y], [x + 2, y + 6]]); } }); }
{ const _def = a3def;
  a3def = function (area, raid) {
    if (raid || area < 5) return _def(area, raid);
    const key = 'a2_' + area; if (A3DEF[key]) return A3DEF[key];
    const R = RNG(4000 + area * 37), L = [], put = (a, x, yb, o) => a3put(L, a, x, yb, o);
    const fightClear = (x, y) => Math.abs(y - CGY) < 70 && x > 60 && x < 600;
    const rows = (n, y0, y1, fn) => { for (let i = 0; i < n; i++) { const yb = R.r(y0, y1), x = R.r(-700, 1340); if (fightClear(x, yb)) continue; fn(x, yb, i); } };
    const kind = A2KIND[area], anim = [], lights = [];
    if (area === 5) {
      rows(24, CGY - 220, CGY - 80, (x, y, i) => put(i % 5 === 0 ? a3crate(i) : a3palm(i + 3), x, y, { scale: i % 5 === 0 ? 1.4 : 1 + (CGY - y) / 600, sway: i % 5 ? .8 : 0 }));
      put(a3wreck(), 820, CGY - 200, { scale: 1.4 }); put(a3wreck(), -260, CGY - 170, { scale: 1.1 });
      rows(16, CGY - 200, CGY - 80, (x, y, i) => put({ c: a3c('srock' + i, 30, 24, () => tdRock(15, 21, R.r(5, 9), PAL.stone, i)), bx: 15, by: 21 }, x, y));
      for (let i = 0; i < 8; i++) { const x = i < 4 ? R.r(-260, 60) : R.r(600, 900), y = R.r(CGY + 70, CGY + 220); put(a3palm(i + 40), x, y, { scale: 1.5, sway: 1 }); }
      for (let i = 0; i < 10; i++) anim.push({ type: 'wave', x: -600 + i * 220, yb: CGY - 232, ph: i });
      lights.push([320, CGY - 200, 900, '#fff4d8', .3]);
    } else if (area === 6) {
      for (let k = 0; k < 6; k++) { const y = CGY - 90 - k * 160; for (const x of [-80 - k * 30, 720 + k * 30]) put(a3gpillar(200, k * 7 + x), x, y, { scale: 1.2 }); }
      rows(40, CGY - 900, CGY - 80, (x, y, i) => put(i % 3 ? a3coral(i) : a3kelpArt(i, R.i(40, 110)), x, y, { scale: 1.2, sway: i % 3 ? 0 : 1.6 }));
      for (let i = 0; i < 10; i++) { const x = i < 5 ? R.r(-300, 60) : R.r(600, 940), y = R.r(CGY + 70, CGY + 220); put(a3kelpArt(i + 70, 140), x, y, { scale: 1.4, sway: 2 }); }
      for (let i = 0; i < 6; i++) anim.push({ type: 'ray', x: -100 + i * 170 + R.r(-30, 30), yb: CGY - 160 - R.r(0, 200), ph: i * 1.3 });
      for (let i = 0; i < 14; i++) anim.push({ type: 'bubble', x: R.r(-300, 940), yb: R.r(CGY - 500, CGY + 160), ph: R.r(0, 10) });
      for (const [x, y] of [[40, CGY - 120], [600, CGY - 120], [320, CGY - 520]]) { put(a3lantern(), x, y); lights.push([x, y - 38, 140, '#60ffe0', .9, .2]); }
      lights.push([320, CGY - 120, 420, '#40c0d0', .5]);
    } else if (area === 7) {
      rows(46, CGY - 1000, CGY - 90, (x, y, i) => put(i % 6 === 0 ? a3ice(i) : a3snowpine(i + 100, R.i(16, 30)), x, y, { scale: 1 + (CGY - y) / 900, sway: i % 6 ? .4 : 0 }));
      put(a3snowman(), 660, CGY - 110, { scale: 1.3 }); put(a3snowman(), -40, CGY - 300, { scale: 1.1 });
      for (let i = 0; i < 8; i++) { const x = i < 4 ? R.r(-260, 60) : R.r(600, 900), y = R.r(CGY + 70, CGY + 220); put(i % 2 ? a3ice(i + 30) : a3snowpine(i + 300, 28), x, y, { scale: 1.6 }); }
      anim.push({ type: 'snowfall' });
      lights.push([320, CGY - 200, 900, '#e8f4ff', .3]);
    } else if (area === 8) {
      for (let k = 0; k < 5; k++) for (const x of [-40 - k * 30, 680 + k * 30]) put(a3column(200), x, CGY - 80 - k * 180, { scale: 1.2 });
      rows(30, CGY - 1000, CGY - 100, (x, y, i) => put(i % 4 === 0 ? a3banner(['#6a1a3a', '#c8a040', '#4a6ae0'][i % 3]) : a3cloudProp(i), x, y, { scale: i % 4 ? 1.4 : 1.3 }));
      for (const x of [100, 540]) put(a3statue(x + 3), x, CGY - 110, { scale: 1.2 });
      for (let i = 0; i < 8; i++) { const x = i < 4 ? R.r(-260, 60) : R.r(600, 900), y = R.r(CGY + 70, CGY + 220); put(a3cloudProp(i + 60), x, y, { scale: 1.8 }); }
      anim.push({ type: 'gusts' }); lights.push([320, CGY - 200, 900, '#fff8f0', .35]);
    } else {
      put(a3tentBig(0), -120, CGY - 300, { scale: 1.3 }); put(a3tentBig(1), 760, CGY - 360, { scale: 1.4 }); put(a3tentBig(2), 320, CGY - 640, { scale: 1.6 });
      rows(30, CGY - 900, CGY - 90, (x, y, i) => put(i % 3 === 0 ? a3bunting(5) : a3lolli(i), x, y, { scale: 1 + (CGY - y) / 900, sway: i % 3 ? .2 : 0 }));
      for (let i = 0; i < 8; i++) { const x = i < 4 ? R.r(-260, 60) : R.r(600, 900), y = R.r(CGY + 70, CGY + 220); put(a3lolli(i + 20), x, y, { scale: 1.6 }); }
      for (let i = 0; i < 10; i++) anim.push({ type: 'balloon', x: R.r(-400, 1000), yb: R.r(CGY - 600, CGY - 90), ph: R.r(0, 10), col: pick(['#f05a8a', '#5af0c0', '#f0d040', '#8a5af0']) });
      for (const x of [-60, 140, 500, 700]) { put(a3torch(), x, CGY - 70); anim.push({ type: 'flame', x, y: CGY - 70 - 46, yb: CGY - 69, s: 1 }); lights.push([x, CGY - 116, 120, '#ff90d0', .85, .25]); }
      lights.push([320, CGY - 200, 900, '#ffe0f0', .3]);
    }
    L.sort((a, b) => a.yb - b.yb);
    return (A3DEF[key] = { L, kind, anim, lights, pal: A3PAL[kind] });
  };
}
{ const _an = a3anim;
  a3anim = function (a, t) {
    if (a.type === 'wave') { HD.capture(a.yb, () => { const x = a.x + Math.sin(t * .8 + a.ph) * 20, y = a.yb - 4 - Math.abs(Math.sin(t * .8 + a.ph)) * 6; for (let k = 0; k < 40; k++) P(k % 5 ? '#e8f8ff' : '#ffffff', x + k * 5, y + Math.sin(k * .4 + t * 2) * 2, 4, 2); }, null, null, [a.x - 40, a.yb - 20, 280, 26], { unlit: false }); return; }
    if (a.type === 'bubble') { const k = ((t * .15 + a.ph * .1) % 1), y = a.yb - k * 300, x = a.x + Math.sin(t * 2 + a.ph) * 6; HD.capture(a.yb, () => { ctx.globalAlpha = 1 - k; pCirc('#a0f0ff', x, y, 2 + a.ph % 2); P('#ffffff', x - 1, y - 1, 1, 1); ctx.globalAlpha = 1; }, null, null, [x - 6, y - 6, 12, 12], { unlit: true }); return; }
    if (a.type === 'balloon') { const y = a.yb - 60 - Math.sin(t * .8 + a.ph) * 20, x = a.x + Math.sin(t * .5 + a.ph) * 14; HD.capture(a.yb, () => { pLine('#f0e0f0', x, y + 8, x + Math.sin(t + a.ph) * 3, y + 40, 1); pEll(OLC, x, y, 7, 9); pEll(a.col, x, y, 6, 8); P('#ffffff', x - 3, y - 4, 2, 3); }, null, null, [x - 10, y - 12, 20, 56], {}); return; }
    if (a.type === 'snowfall' || a.type === 'gusts') { if (chance(DT * (a.type === 'snowfall' ? 30 : 6))) Particles.spawn(a.type === 'snowfall' ? { x: rnd(-100, 740), y: -10, vx: rnd(-6, 10), vy: rnd(20, 40), life: 8, c: '#ffffff', size: rndi(1, 2), drag: 1, ground: CGY + rnd(-20, 80) } : { x: -40, y: CGY - rnd(10, 160), vx: rnd(160, 260), vy: rnd(-10, 10), life: 4, c: 'rgba(255,255,255,.8)', type: 'streak' }); return; }
    return _an(a, t);
  };
}
{ const _cl3 = combatLights3D;
  combatLights3D = function (area, raid, t, opts) {
    if (raid || area < 5) return _cl3(area, raid, t, opts);
    const d = a3def(area, raid), amb = { 5: [235, 230, 220], 6: [70, 120, 140], 7: [215, 225, 240], 8: [240, 236, 250], 9: [245, 205, 225] }[area];
    Light.begin(opts.bolt > .5 ? [255, 240, 255] : opts.dark ? mixA(amb, [20, 10, 30], opts.dark) : amb);
    for (const l of d.lights) Light.add(l[0], l[1], l[2], l[3], l[4], l[5] || 0);
    if (area === 6) Light.add(320 + Math.sin(t * .4) * 120, CGY - 80, 200, '#80ffe0', .25 + Math.sin(t * 1.3) * .1);
  };
}
/* ---------------- LOW (2D) ---------------- */
function a2BgFar(area) {
  return Cache.get('cbg2_' + area, 760, 420, (c, w, h) => {
    const R = RNG(1700 + area * 13), Y = CGY - ARENA_OY, pal = PAL[A2FLOOR[area]], X = x => x - ARENA_OX;
    tdGroundFill(pal, 0, 0, w, h, R, .8, area);
    const away = (x, y) => Math.abs(y - Y) > 46 || x < 70 || x > 690;
    if (area === 5) { for (let y = 0; y < 90; y++) { P(mix('#1e5a8a', '#4a9ac8', y / 90), 0, y, w, 1); } for (let x = 0; x < w; x += 2) { const f = Math.sin(x * .04) * 3; P('#f8fcff', x, 90 + f, 2, 2); P('#a8d0e0', x, 92 + f, 2, 4); } for (let i = 0; i < 14; i++) { const x = R.r(0, w), y = R.r(110, h); if (!away(x, y)) continue; tdTreeAt(x, y, R.r(10, 16), PAL.palm, i, 'round'); } for (let i = 0; i < 18; i++) { const x = R.r(0, w), y = R.r(100, h); if (away(x, y)) tdRock(x, y, R.r(4, 7), PAL.stone, i); } }
    if (area === 6) { for (let i = 0; i < 16; i++) { const x = R.r(0, w), y = R.r(0, h); if (!away(x, y)) continue; P(OLC, x - 7, y - 36, 14, 38); P('#2a5a62', x - 6, y - 35, 12, 36); P('#3a7a80', x - 6, y - 35, 3, 36); P(OLC, x - 9, y - 40, 18, 5); P('#4a8a90', x - 8, y - 39, 16, 3); } for (let i = 0; i < 30; i++) { const x = R.r(0, w), y = R.r(0, h); if (away(x, y)) { const kh = R.i(14, 34); for (let k = 0; k < kh; k++) P(k % 6 < 3 ? '#3a8a3a' : '#2a6a2a', x + Math.sin(k * .2 + i) * 2, y - k, 2, 1); } } }
    if (area === 7) { for (let i = 0; i < 26; i++) { const x = R.r(0, w), y = R.r(0, h); if (!away(x, y)) continue; tdTreeAt(x, y, R.r(10, 16), PAL.leafDark, i + 40, 'pine'); for (let k = 0; k < 8; k++) P('#f0f8ff', x + R.r(-8, 8), y - R.r(8, 28), 3, 1); } for (let i = 0; i < 10; i++) { const x = R.r(0, w), y = R.r(0, h); if (away(x, y)) { pEll('#a8d8f0', x, y, R.r(14, 30), R.r(4, 8)); pEll('#e0f8ff', x - 3, y - 1, R.r(6, 16), R.r(2, 4)); } } }
    if (area === 8) { for (let i = 0; i < 40; i++) { const x = R.r(0, w), y = R.r(0, h); if (away(x, y)) { pEll('#c8c4e8', x, y + 3, R.r(12, 26), R.r(5, 9)); pEll('#ffffff', x, y, R.r(10, 22), R.r(4, 8)); } } for (const x of [40, 720]) for (let y = 40; y < h; y += 90) { P(OLC, x - 9, y - 50, 18, 52); P('#f0ead8', x - 8, y - 49, 16, 50); P('#ffffff', x - 8, y - 49, 3, 50); } }
    if (area === 9) { for (let y = 0; y < h; y += 20) for (let x = (y / 20 % 2) * 20; x < w; x += 40) { c.globalAlpha = .2; P('#ffffff', x, y, 20, 20); } c.globalAlpha = 1; for (let i = 0; i < 14; i++) { const x = R.r(0, w), y = R.r(0, h); if (!away(x, y)) continue; P(OLC, x - 1, y - 30, 3, 30); P('#f8f0f0', x, y - 30, 1, 30); pCirc(OLC, x, y - 36, 9); pCirc(pick(['#f05a8a', '#5af0c0', '#f0d040', '#8a5af0']), x, y - 36, 8); pCirc('#ffffff', x - 2, y - 38, 2); } for (const [x, y, k] of [[110, 70, 0], [640, 60, 1]]) { const cols = [['#f05a8a', '#ffffff'], ['#8a5af0', '#f0d040']][k]; pPoly(OLC, [[x - 46, y + 40], [x, y - 30], [x + 46, y + 40]]); for (let i = 0; i < 8; i++) pPoly(cols[i % 2], [[x - 44 + i * 11, y + 39], [x, y - 27], [x - 44 + (i + 1) * 11, y + 39]]); } }
    // fight lane
    c.globalAlpha = .25; P(shade(pal.base, -.2), 0, Y - 30, w, 60); c.globalAlpha = 1;
  });
}
{ const _bg = drawCombatBG;
  drawCombatBG = function (area, raid, t, opts = {}) {
    if (raid || area < 5) return _bg(area, raid, t, opts);
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); P({ 5: '#2a5a8a', 6: '#06202c', 7: '#c8d8e8', 8: '#e8e8f8', 9: '#f8c0d8' }[area], 0, 0, 640, 360); Cam.apply(c, 1); c.drawImage(a2BgFar(area), ARENA_OX, ARENA_OY);
    if (area === 5) { for (let i = 0; i < 14; i++) { const x = ((i * 60 + t * 12) % 800) - 80, y = ARENA_OY + 88 + Math.sin(t * 1.2 + i) * 2; P('#ffffff', x, y, 10, 1); } }
    if (area === 6) { for (let i = 0; i < 12; i++) { const k = ((t * .15 + i * .083) % 1), x = 40 + i * 52 + Math.sin(t * 2 + i) * 5, y = CGY + 40 - k * 260; c.globalAlpha = 1 - k; pCirc('#a0f0ff', x, y, 1.5); c.globalAlpha = 1; } c.globalAlpha = .08 + Math.sin(t * .7) * .03; for (let i = 0; i < 4; i++) pPoly('#a0f0ff', [[60 + i * 170, -30], [90 + i * 170, -30], [170 + i * 170, CGY + 40], [110 + i * 170, CGY + 40]]); c.globalAlpha = 1; }
    if (area === 7 && chance(DT * 24)) Particles.spawn({ x: rnd(-60, 700), y: -10, vx: rnd(-6, 10), vy: rnd(20, 40), life: 8, c: '#ffffff', size: rndi(1, 2), drag: 1, ground: CGY + rnd(-20, 80) });
    if (area === 8) { c.globalAlpha = .5; for (let i = 0; i < 5; i++) { const x = ((t * 20 + i * 190) % 900) - 130; pEll('#ffffff', x, 60 + i * 50, 50, 10); } c.globalAlpha = 1; }
    if (area === 9) { for (let i = 0; i < 8; i++) { const x = 30 + i * 85 + Math.sin(t * .5 + i) * 10, y = 60 + Math.sin(t * .8 + i * 2) * 14; pLine('#f0e0f0', x, y + 8, x, y + 40, 1); pEll(OLC, x, y, 6, 8); pEll(['#f05a8a', '#5af0c0', '#f0d040', '#8a5af0'][i % 4], x, y, 5, 7); } }
    Cam.apply(c, 1);
  };
}
{ const _fg = drawCombatFG; drawCombatFG = function (area, raid, t) { if (!raid && area >= 5) { if (area === 6 || area === 7) { const c = ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = area === 6 ? .18 : .1; P(area === 6 ? '#0a3040' : '#ffffff', 0, 0, 640, 360); c.restore(); Cam.apply(c, 1); } return; } return _fg(area, raid, t); }; }
{ const _cl = combatLights;
  combatLights = function (area, raid, t, opts = {}) {
    if (raid || area < 5) return _cl(area, raid, t, opts);
    const amb = { 5: [230, 225, 215], 6: [70, 115, 135], 7: [210, 220, 235], 8: [240, 236, 250], 9: [240, 200, 220] }[area];
    Light.begin(opts.dark ? mixA(amb, [20, 10, 30], opts.dark) : amb);
    if (area === 6) { Light.add(320, 200, 260, '#60ffe0', .4); Light.add(320 + Math.sin(t * .4) * 120, CGY - 60, 160, '#80ffe0', .25); }
    if (area === 9) [[100, 120], [540, 120]].forEach(([x, y]) => Light.add(x, y, 140, '#ff90d0', .6, .25));
    if (opts.bolt > .3) Light.add(320, 60, 500, '#d0c0ff', opts.bolt);
  };
}
