'use strict';
/* =========================================================
   ACT II CREATURE RIGS — layered parts (body · limbs · face · fx)
   All face +x, origin at the feet, drawn with MAT ramps + matBlob.
   ========================================================= */
const A2R = s => { const b = monsterBase(s); b.B = (m, x, y, rx, ry, o) => matBlob(b.E, m, x, y, rx, ry, o); return b; };
const eyeDot = (L, x, y, low, col = '#1a1016') => { L('#ffffff', x - 1, y - 1, 3, 3); L(low ? '#c02020' : col, x, y, 2, 2); L('#ffffff', x, y, 1, 1); };
MON.crab = (s, st, c) => {
  const { L, E, Ln, B } = A2R(s), t = st.t, br = Math.sin(t * 3) * .5, a = st.atk || 0, m = matR(c.body || 'shell'), w = st.walk || 0;
  for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const ph = w + i * 1.3 + (sd > 0 ? Math.PI : 0), lx = sd * (6 + i * 4); Ln(OL, lx, -5, lx + sd * 4, -1 + Math.sin(ph) * 1.2, 2.4); Ln(m[1], lx, -5, lx + sd * 4, -1 + Math.sin(ph) * 1.2, 1.2); }
  B(m, 0, -8 + br, 13, 7); L(m[0], -10, -4 + br, 20, 1); for (let i = -2; i <= 2; i++) L(m[3], i * 4 - 1, -13 + br, 2, 1);
  // claws (the front one snaps)
  const cx = 14 + a * 6, cy = -10 + br - a * 3; Ln(OL, 8, -9 + br, cx - 3, cy + 2, 3); Ln(m[1], 8, -9 + br, cx - 3, cy + 2, 1.5);
  B(m, cx, cy, 5, 4); const op = Math.abs(Math.sin(t * 5)) * 2 + a * 3; E(OL, cx + 4, cy - 2 - op * .5, 4, 2); E(m[3], cx + 4, cy - 2 - op * .5, 3, 1.2); L(OL, cx + 1, cy - op * .2, 5, 1);
  B(m, -12, -10 + br, 4, 3);
  // eye stalks + sulk
  for (const ex of [-3, 3]) { Ln(OL, ex, -14 + br, ex + 1, -19 + br, 2); Ln(m[2], ex, -14 + br, ex + 1, -19 + br, 1); E(OL, ex + 1, -20 + br, 2.2, 2.2); E('#ffffff', ex + 1, -20 + br, 1.6, 1.6); L(st.low ? '#c02020' : OL, ex + 1, -19.5 + br, 1, 1); }
  Ln(OL, -3, -8 + br, 3, -9 + br, 1); // frown
};
MON.gull = (s, st, c) => {
  const { L, E, Ln, Poly, B } = A2R(s), t = st.t, harpy = c.variant === 'harpy', a = st.atk || 0, fl = Math.sin(t * (harpy ? 6 : 9)), bob = harpy ? -10 + fl * 3 : Math.sin(t * 3) * .5;
  const m = matR(harpy ? '#8a6aa8' : 'feather'), wg = matR(harpy ? '#5a3a7a' : 'gullgrey');
  if (!harpy) { const lp = st.walk || 0; Ln('#e8a020', -1, -7, -2 + Math.sin(lp) * 2, 0, 1.6); Ln('#e8a020', 3, -7, 3 - Math.sin(lp) * 2, 0, 1.6); }
  else { Ln(OL, -2, -6 + bob, -3, 2 + bob, 2.5); Ln('#c8a040', -2, -6 + bob, -3, 2 + bob, 1.2); Ln('#c8a040', -3, 2 + bob, 0, 3 + bob, 1); }
  Poly(OL, [[-6, -10 + bob], [-18, -8 + bob + fl], [-16, -14 + bob]]); Poly(wg[2], [[-6, -11 + bob], [-16, -9 + bob + fl], [-15, -13 + bob]]);
  B(m, 0, -12 + bob, 9, 6);
  const wy = -14 + bob - fl * 7; Poly(OL, [[-4, -14 + bob], [-14, wy - 6], [-22, wy - 2], [2, -10 + bob]]); Poly(wg[2], [[-3, -14 + bob], [-14, wy - 5], [-20, wy - 2], [1, -11 + bob]]); Ln(wg[0], -12, wy - 3, -20, wy - 1, 1.2);
  const hx = 8 + a * 4, hy = -19 + bob + a * 2;
  if (harpy) { E(OL, hx, hy, 6, 6); E(MAT.skin[2], hx, hy, 5, 5); E('#2a1a3a', hx - 2, hy - 3, 5, 4); eyeDot(L, hx + 1, hy - 1, st.low, '#6a2a8a'); Poly('#e8b030', [[hx + 4, hy], [hx + 9 + a * 2, hy + 1], [hx + 4, hy + 2]]); Ln(OL, hx - 1, hy + 3, hx + 3, hy + 2, 1); }
  else { B(m, hx, hy, 5, 4.5); eyeDot(L, hx + 1, hy - 1, st.low); L(OL, hx - 1, hy - 3, 4, 1); Poly(OL, [[hx + 3, hy - 1], [hx + 11 + a * 3, hy + 1], [hx + 3, hy + 3]]); Poly('#f0c030', [[hx + 4, hy], [hx + 10 + a * 3, hy + 1], [hx + 4, hy + 2]]); L('#e04020', hx + 8, hy + 1, 2, 1); }
};
MON.jelly = (s, st, c) => {
  const { L, E, Ln, B } = A2R(s), t = st.t, m = matR(c.body || 'jelly'), pu = Math.sin(t * 2.4), y0 = -26 - pu * 2 - (st.atk || 0) * 4;
  ctx.globalAlpha *= .9;
  for (let i = 0; i < 6; i++) { const x0 = -8 + i * 3.2; let px = x0, py = y0 + 4; for (let k = 1; k <= 8; k++) { const nx = x0 + Math.sin(t * 2 + i + k * .7) * 2.2, ny = y0 + 4 + k * 3; Ln(i % 2 ? m[3] : m[1], px, py, nx, ny, 1.2); px = nx; py = ny; } }
  ctx.globalAlpha *= .85; E(OL, 0, y0, 13 + pu, 9 - pu * .5); E(m[2], 0, y0, 12 + pu, 8 - pu * .5); E(m[1], 0, y0 + 3, 11, 4); E(m[3], -3, y0 - 3, 6, 3); E(m[4], -5, y0 - 5, 2, 1);
  ctx.globalAlpha /= .85; E('rgba(255,255,255,.35)', 0, y0 + 5, 10, 2);
  L('#2a1040', -4, y0, 2, 2); L('#2a1040', 3, y0, 2, 2); Ln('#2a1040', -2, y0 + 4, 2, y0 + 3, 1); if (!st.low) { L('#a0e0ff', -4, y0 + 2, 1, 2); }
  ctx.globalAlpha /= .9;
};
MON.angler = (s, st, c) => {
  const { L, E, Ln, Poly, B } = A2R(s), t = st.t, m = matR(c.body || 'deepsea'), a = st.atk || 0, bob = Math.sin(t * 2) * 1.5 - 10, open = 2 + a * 5 + Math.abs(Math.sin(t * 1.5)) * 1.5;
  Poly(OL, [[-10, bob], [-20, bob - 7 + Math.sin(t * 4) * 2], [-20, bob + 7 + Math.sin(t * 4) * 2]]); Poly(m[1], [[-11, bob], [-19, bob - 5 + Math.sin(t * 4) * 2], [-19, bob + 5 + Math.sin(t * 4) * 2]]);
  B(m, 0, bob, 13, 10); Poly(m[1], [[-2, bob - 9], [4, bob - 14], [6, bob - 8]]);
  // jaw
  E(OL, 8, bob + 3, 7, 3 + open * .5); E('#1a0a14', 8, bob + 3, 6, 2 + open * .5); for (let i = 0; i < 5; i++) { Poly('#f0f0e0', [[4 + i * 2.2, bob + 1], [5 + i * 2.2, bob + 3.5], [6 + i * 2.2, bob + 1]]); Poly('#f0f0e0', [[4 + i * 2.2, bob + 5 + open], [5 + i * 2.2, bob + 2.5 + open], [6 + i * 2.2, bob + 5 + open]]); }
  eyeDot(L, 5, bob - 4, st.low, '#e0e060');
  // the lure
  const lx = 16 + Math.sin(t * 1.3) * 2, ly = bob - 18 + Math.cos(t * 1.7) * 2; Ln(OL, 2, bob - 9, lx, ly, 1.5); Ln(m[3], 2, bob - 9, lx, ly, .8);
  E('rgba(200,255,160,.25)', lx, ly, 6, 6); E('#e8ff90', lx, ly, 2.4, 2.4); L('#ffffff', lx - 1, ly - 1, 1, 1);
};
MON.clam = (s, st, c) => {
  const { L, E, Ln, Poly, B } = A2R(s), t = st.t, m = matR(c.body || 'clam'), a = st.atk || 0, op = Math.max(0, Math.sin(t * .9)) * 3 + a * 8;
  E(OL, 0, -5, 15, 6); E(m[1], 0, -5, 14, 5); for (let i = -3; i <= 3; i++) Ln(m[0], i * 3.5, -1, i * 4.2, -9, 1);
  if (op > .5) { E('#f0b8c0', 0, -9 - op * .3, 11, op * .5 + 1); E('#ffffff', 3, -9 - op * .4, 2.4, 2.4); eyeDot(L, -3, -10 - op * .5, st.low); eyeDot(L, 4, -10 - op * .5, st.low); L(OL, -5, -12 - op * .6, 4, 1); L(OL, 2, -12 - op * .6, 4, 1); }
  const ty = -10 - op; E(OL, 0, ty, 15, 6.5); E(m[2], 0, ty, 14, 5.5); E(m[3], -3, ty - 2, 9, 2.5); for (let i = -3; i <= 3; i++) Ln(m[1], i * 3.5, ty + 4, i * 4.2, ty - 4, 1);
  // tiny bureaucrat hat + monocle
  L(OL, -4, ty - 10, 9, 5); L('#2a2430', -3, ty - 9, 7, 4); L(OL, -6, ty - 6, 13, 1.5); E('#c8a040', 6, ty - 1, 2, 2);
};
MON.eel = (s, st, c) => {
  const { L, E, Ln, Poly, B } = A2R(s), t = st.t, m = matR(c.body || 'eel'), a = st.atk || 0;
  const pts = []; for (let i = 0; i <= 14; i++) { const k = i / 14, x = -16 + k * 26 + a * k * 8, y = -4 - k * 26 + Math.sin(t * 3 + k * 6) * 4 * (1 - k * .5); pts.push([x, y]); }
  for (let i = 0; i < pts.length - 1; i++) { const w = 5 - i * .18; Ln(OL, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w + 2); }
  for (let i = 0; i < pts.length - 1; i++) { const w = 5 - i * .18; Ln(m[2], pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w); Ln(m[3], pts[i][0] - .6, pts[i][1] - .6, pts[i + 1][0] - .6, pts[i + 1][1] - .6, 1); if (i % 2 === 0) Ln(m[1], pts[i][0] + 1, pts[i][1] + 1, pts[i + 1][0] + 1, pts[i + 1][1] + 1, 1); }
  const [hx, hy] = pts[14]; B(m, hx + 2, hy, 6, 4.5); eyeDot(L, hx + 3, hy - 2, st.low, '#e0e040'); Ln(OL, hx + 3, hy + 2, hx + 8, hy + 1 + a * 2, 1);
  if (c.kelp) { for (let i = 0; i < 5; i++) Ln(i % 2 ? '#3a7a2a' : '#5a9a3a', hx - 4 + i * 2, hy - 4, hx - 6 + i * 2 + Math.sin(t * 2 + i) * 2, hy - 12, 1.5); L('#8a6a40', hx - 4, hy - 6, 10, 2); }
  if ((st.t * 3 | 0) % 4 === 0) { ctx.globalAlpha *= .8; for (let i = 0; i < 3; i++) { const p = pts[rndi(2, 12)]; Ln('#f0ff80', p[0], p[1], p[0] + rnd(-5, 5), p[1] + rnd(-5, 5), .8); } ctx.globalAlpha /= .8; }
};
MON.penguin = (s, st, c) => {
  const { L, E, Ln, Poly, B } = A2R(s), t = st.t, a = st.atk || 0, w = st.walk || 0, sw = Math.sin(w) * 2, br = Math.sin(t * 2) * .4;
  E('#e8a020', -3 + sw * .5, -1, 3, 1.4); E('#e8a020', 4 - sw * .5, -1, 3, 1.4);
  B('pengblack', 0, -12 + br, 9, 12); E('#f0f0f4', 2, -10 + br, 6, 9); E('#d0d8e0', 3, -6 + br, 5, 4);
  const fa = -.4 - a * 1.6; Ln(OL, -4, -14 + br, -4 + Math.cos(fa + Math.PI) * -10, -14 + br + Math.sin(fa) * 10, 3.5); Ln(MAT.pengblack[2], 6, -15 + br, 6 + Math.cos(fa) * 10, -15 + br - Math.sin(fa) * 10 * -1 + a * 4, 2.4);
  eyeDot(L, 3, -19 + br, st.low); L(OL, 1, -21 + br, 5, 1); L(OL, 1, -20.5 + br, 1, 1); // half-lidded
  Poly('#f0a020', [[5, -17 + br], [10 + a * 2, -16 + br], [5, -15 + br]]);
  L('#c83a4a', -6, -15 + br, 13, 2); L('#e85a6a', -6, -15 + br, 13, 1); L('#c83a4a', -7, -14 + br, 2, 6); // scarf
};
MON.yeti = (s, st, c) => {
  const { L, E, Ln, Poly, B } = A2R(s), t = st.t, g = c.variant === 'grudge', a = st.atk || 0, w = st.walk || 0, br = Math.sin(t * 2) * .8, m = matR(g ? 'ice' : 'fur'), ang = g && st.phase2;
  for (const [lx, ph] of [[-6, 0], [6, Math.PI]]) { const sw = Math.sin(w + ph) * 2; B(m, lx + sw, -5, 5, 5); }
  if (g) { Poly(OL, [[-18, -14], [-14, -42], [-6, -34], [0, -50], [6, -34], [14, -44], [18, -14]]); Poly(m[1], [[-17, -15], [-13, -40], [-6, -33], [0, -48], [6, -33], [13, -42], [17, -15]]); Poly(m[3], [[-6, -33], [0, -48], [2, -36]]); }
  B(m, 0, -22 + br, 15, 16);
  for (let i = 0; i < 9; i++) Ln(m[3], -12 + i * 3, -34 + br + (i % 2), -13 + i * 3, -30 + br, 1);
  const ra = -.3 - a * 2.2; Ln(OL, 10, -26 + br, 10 + Math.cos(ra) * 14, -26 + br + Math.sin(ra) * 14 * -1 + 8, 7); Ln(m[2], 10, -26 + br, 10 + Math.cos(ra) * 14, -26 + br + Math.sin(ra) * 14 * -1 + 8, 5); B(m, 10 + Math.cos(ra) * 14, -26 + br - Math.sin(ra) * 14 + 8, 4, 4);
  Ln(OL, -10, -26 + br, -14, -12 + br, 7); Ln(m[1], -10, -26 + br, -14, -12 + br, 5);
  // face
  const fx = 6, fy = -30 + br; E(g ? '#2a4a7a' : '#8a98a8', fx, fy, 7, 6); E(g ? '#1a2a50' : '#a8b4c0', fx + 1, fy + 1, 6, 4.5);
  const eg = ang ? '#ff4040' : g ? '#80e0ff' : '#1a1016'; L(eg, fx - 2, fy - 2, 2, 2); L(eg, fx + 3, fy - 2, 2, 2); if (g || st.low) { Ln(OL, fx - 3, fy - 4, fx, fy - 3, 1); Ln(OL, fx + 6, fy - 4, fx + 3, fy - 3, 1); }
  L(OL, fx - 1, fy + 2, 6, 1); L('#f0f0f0', fx, fy + 2, 1, 2); L('#f0f0f0', fx + 3, fy + 2, 1, 2);
  if (!g) { L('#c83a4a', fx - 3, fy - 9, 9, 2); E('#c83a4a', fx + 1, fy - 10, 3, 2); } // a little bow tie of a hat. Manners.
  if (g && chance(.3)) { const px = rnd(-18, 18), py = rnd(-50, -10); L('#e8f8ff', px, py, 1, 1); }
};
MON.sheep = (s, st, c) => {
  const { L, E, Ln, B } = A2R(s), t = st.t, a = st.atk || 0, w = st.walk || 0, br = Math.sin(t * 2) * .6, bob = -4 + Math.sin(t * 1.5) * 1.5;
  for (const [lx, ph] of [[-6, 0], [-2, 2], [3, 1], [7, 3]]) Ln(OL, lx, -6 + bob, lx + Math.sin(w + ph) * 1.5, 0 + bob * .2, 2);
  for (const [x, y, r] of [[-8, -12, 6], [0, -15, 7], [7, -12, 6], [-4, -8, 6], [4, -8, 6], [-11, -9, 4]]) B('cloud', x, y + bob + br, r, r * .8, { matte: true });
  const hx = 12 + a * 5, hy = -14 + bob; E(OL, hx, hy, 4.5, 4); E('#3a3440', hx, hy, 3.6, 3.2); L('#ffffff', hx, hy - 1, 2, 1); L(OL, hx + 1, hy - 1, 1, 1);
  Ln('#c8a040', hx - 3, hy - 3, hx - 6, hy - 7, 1.5); Ln('#c8a040', hx - 6, hy - 7, hx - 3, hy - 9, 1.5); // smug horn
  L(OL, hx + 1, hy + 2, 2, 1);
};
function drawHorse(L, E, Ln, Poly, B, s, st, c, x0) {
  const t = st.t, a = st.atk || 0, w = st.walk || st.t * (st.gallop || 0), m = matR(c.body || 'horse'), mane = c.mane || '#d8b8f0', br = Math.sin(t * 2) * .5;
  for (const [lx, ph] of [[-12, 0], [-8, 2.2], [8, 1], [12, 3.1]]) { const sw = Math.sin(w + ph) * 3; Ln(OL, x0 + lx, -16, x0 + lx + sw, -1, 3.4); Ln(m[1], x0 + lx, -16, x0 + lx + sw, -1, 2); L('#c8a040', x0 + lx + sw - 1, -2, 3, 2); }
  Ln(OL, x0 - 15, -22 + br, x0 - 22, -10 + Math.sin(t * 3) * 2, 4); Ln(mane, x0 - 15, -22 + br, x0 - 22, -10 + Math.sin(t * 3) * 2, 2.4);
  B(m, x0, -22 + br, 16, 8);
  const nx = x0 + 14 + a * 3, ny = -36 + br; Ln(OL, x0 + 10, -24 + br, nx, ny, 8); Ln(m[2], x0 + 10, -24 + br, nx, ny, 6); B(m, nx + 4, ny - 1, 6, 4);
  for (let i = 0; i < 5; i++) Ln(mane, x0 + 9 - i * .2 + i * 1.1, -26 + br - i * 2.2, x0 + 7 + i * 1.1, -22 + br - i * 2.2 + Math.sin(t * 4 + i), 2);
  eyeDot(L, nx + 3, ny - 2, st.low); L(OL, nx + 8, ny, 1, 1); Ln(OL, nx + 1, ny - 4, nx, ny - 8, 1.5); // ear
}
MON.horse = (s, st, c) => { const b = A2R(s); drawHorse(b.L, b.E, b.Ln, b.Poly, b.B, s, st, c, 0); };
MON.rider = (s, st, c) => {
  const b = A2R(s), down = st.phase2;
  if (!down) { drawHorse(b.L, b.E, b.Ln, b.Poly, b.B, s, st, c, 0); b.L('#6a1a3a', -10, -30, 20, 6); b.L('#c8a040', -10, -30, 20, 1); }
  const look = { s, face: 1, t: st.t, seed: 9, skin: '#f0d0b8', hair: '#d8c8a0', hairStyle: 'short', hat: 'tophat', top: '#6a1a3a', sleeve: '#8a2a4a', pants: '#e8e0d0', boots: '#1a1418', belt: '#c8a040', cape: '#2a1a3a', armor: { tabard: '#e8e0f0', gold: true }, weapon: 'spear', mustache: true, expr: down ? (st.low ? 'hurt' : 'surprise') : st.expr || 'smug', body: 'lanky', talking: st.talking, low: st.low, armF: st.armF, draw: st.draw };
  if (down) { look.walk = st.walk; look.crouch = st.crouch; look.lean = st.lean; drawChar(0, 0, look); }
  else { look.sit = true; drawChar(-1 * s, -28 * s, look); }
};
MON.balloon = (s, st, c) => {
  const { L, E, Ln, B } = A2R(s), t = st.t, m = matR(c.body || 'balloon'), a = st.atk || 0, bob = -14 + Math.sin(t * 2.2) * 2.5 - a * 4, sq = 1 + Math.sin(t * 4) * .04;
  Ln('#e8e0e8', 0, 0, Math.sin(t * 2) * 2, bob + 6, 1);
  const parts = [[0, bob - 8, 7, 6], [-9, bob - 2, 5, 4], [9, bob - 3, 5, 4], [-5, bob + 5, 3, 4], [5, bob + 5, 3, 4], [12, bob - 12, 4, 4], [-11, bob - 10, 3, 5]];
  for (const [x, y, rx, ry] of parts) B(m, x, y, rx * sq, ry / sq);
  for (const [x, y] of [[-3, bob - 2], [4, bob - 2]]) { L(m[0], x, y, 1, 2); }
  const hx = 12, hy = bob - 12; eyeDot(L, hx, hy - 1, st.low); Ln(OL, hx - 2, hy + 2, hx + 2, hy + 2.5, 1); L(OL, hx - 2, hy + 1, 1, 1); L(OL, hx + 2, hy + 1, 1, 1); // wide grin
  if (c.bow) { E(OL, 0, bob - 15, 5, 3); E('#f0d040', -3, bob - 15, 3, 2); E('#f0d040', 3, bob - 15, 3, 2); }
};
MON.whale = (s, st, c) => {
  const { L, E, Ln, Poly, B } = A2R(s), t = st.t, m = matR('whale'), br = st.breath === undefined ? Math.sin(t * .8) : st.breath;
  const sy = 1 + br * .06;
  Poly(OL, [[-40, -20], [-60, -34 + Math.sin(t) * 3], [-58, -8 + Math.sin(t) * 3]]); Poly(m[1], [[-41, -20], [-57, -32 + Math.sin(t) * 3], [-56, -10 + Math.sin(t) * 3]]);
  B(m, 0, -22, 44, 18 * sy); E(m[3], 6, -12, 32, 6); for (let i = 0; i < 7; i++) L(m[1], -10 + i * 6, -10, 4, 1);
  Ln(OL, 4, -10, 18, 2, 5); Ln(m[2], 4, -10, 18, 2, 3);
  const ex = 30, ey = -26; E('#ffffff', ex, ey, 3, 2.5); E('#1a1016', ex + .5, ey, 2, 2); L('#ffffff', ex, ey - 1, 1, 1); Ln(OL, ex - 3, ey - 3, ex + 3, ey - 4, 1);
  if (st.tear) { E('#a0d8ff', ex + 1, ey + 4 + (t * 6 % 6), 1, 1.5); }
  Ln(OL, 26, -16, 38, -17, 1);
};
