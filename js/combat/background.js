'use strict';
/* =========================================================
   COMBAT ARENAS — 3/4 top-down battlefields
   The fighters stand on the ground plane at CGY. Each arena is a cached
   floor (760x420, drawn 1:1 with the camera) plus animated details.
   ========================================================= */
const CGY = 250; // combat ground line (low-res)
const ARENA_OX = -60, ARENA_OY = -30;
function tdTreeAt(x, y, r, pal, seed, kind) { if (kind !== 'dead') tdTreeShadow(x, y, r); const a = tdTreeArt(r, pal, seed, kind); ctx.drawImage(a, Math.round(x - a.width / 2), Math.round(y - a.height + 3)); }
function bgFar(area, raid) {
  return Cache.get('cbg_td' + (raid ? 'r' : area), 760, 420, (c, w, h) => {
    const R = RNG(700 + area * 13 + (raid ? 99 : 0)), Y = CGY - ARENA_OY; // ground line inside the canvas
    const X = x => x - ARENA_OX;
    if (raid) {
      tdGroundFill(PAL.grassNight, 0, 0, w, h, R, .8, 3);
      tdPath([[0, Y + 10], [w * .3, Y + 4], [w * .7, Y + 12], [w, Y + 6]], 70, PAL.dirt, R);
      // house fronts along the back
      const hs = [['raid1', 30, 'thatch', '#a87a40', 'timber'], ['raid2', 250, 'tile', '#a8483a', 'wood'], ['raid3', 470, 'slate', '#4a5a7a', 'stone']];
      for (const [k, hx, roof, rc, wall] of hs) { const b = tdBuilding(k, { w: 150, wallH: 40, roofH: 44, roof, roofCol: rc, wall, motif: roof === 'thatch', windows: [[16, 12, 16, 14], [118, 12, 16, 14]], door: [66, 18, 28], seed: hx }); c.drawImage(b.c, hx - b.ox, 120 - b.oy); }
      for (let x = 0; x < w; x += 9) { const hh = 34 + R.i(-3, 3); P(OLC, x, 150 - hh, 9, hh); P('#7a4a30', x + 1, 151 - hh, 7, hh - 2); P('#9a6440', x + 1, 151 - hh, 2, hh - 2); pPoly('#9a6440', [[x + 1, 151 - hh], [x + 4.5, 143 - hh], [x + 8, 151 - hh]]); }
      for (let i = 0; i < 30; i++) tdBush(R.r(0, w), R.r(Y + 70, h), R.i(8, 13), PAL.leafDark, i);
      for (let i = 0; i < 8; i++) tdRock(R.r(0, w), R.r(Y + 40, h - 10), R.r(4, 7), PAL.stone, i + 40);
      return;
    }
    if (area === 0) { // MUDDY ROAD through farmland
      tdGroundFill(PAL.grass, 0, 0, w, h, R, 1, 1);
      // crop fields at the back
      for (let f = 0; f < 3; f++) { const fx = 30 + f * 250, fy = 46, fw = 200, fh = 70; P(PAL.dirt.edge, fx - 2, fy - 2, fw + 4, fh + 4); P(PAL.mud.base, fx, fy, fw, fh); for (let y = fy + 4; y < fy + fh; y += 9) { P(PAL.mud.dk2, fx, y + 4, fw, 2); P(PAL.mud.lt, fx, y, fw, 1); for (let x = fx + 4; x < fx + fw - 4; x += 7) { const col = f === 1 ? ['#f0c040', '#e8a020'] : ['#7ac040', '#5a9a30']; P('#3a6a2a', x, y - 1, 3, 3); P(col[0], x, y - 3, 2, 2); P(col[1], x + 1, y - 2, 2, 1); } } }
      tdFenceH(10, w - 10, 132);
      // the muddy road
      tdPath([[-10, Y - 4], [w * .25, Y + 6], [w * .55, Y - 2], [w * .8, Y + 8], [w + 10, Y]], 86, PAL.mud, R);
      for (let i = 0; i < 9; i++) { const px = R.r(20, w - 20), py = Y + R.r(-26, 34), pw = R.r(16, 34); pEll(PAL.mud.edge, px, py + 1, pw / 2 + 2, 5); pEll('#4a8ab0', px, py, pw / 2, 4); P('#9ad0e8', px - pw / 4, py - 2, pw / 3, 1); P('#c8f0ff', px - pw / 4, py - 2, 3, 1); }
      for (let i = 0; i < 40; i++) { const x = R.r(0, w), y = Y + R.r(-36, 40); P(PAL.mud.dk2, x, y, R.i(6, 14), 1); }
      // verge: tufts, flowers, bushes, rocks
      for (let i = 0; i < 160; i++) { const x = R.r(0, w), y = R.r(150, h); if (Math.abs(y - Y) < 50) continue; if (R() < .25) tdFlowers(x, y, R, ['#ffffff', '#f8e060', '#f890c0', '#a8c8ff'], 3); else tdTuft(x, y, PAL.grass, R, R() < .4); }
      for (let i = 0; i < 6; i++) tdBush(R.r(0, w), R.r(150, 175), R.i(7, 11), R() < .3 ? PAL.leafGold : PAL.leaf, i + 3);
      for (let i = 0; i < 10; i++) tdBush(R.r(0, w), R.r(Y + 62, h), R.i(9, 14), PAL.leaf, i + 20);
      for (let i = 0; i < 4; i++) { const x = 60 + i * 190 + R.r(-20, 20); pEll(OLC, x, 165, 11, 8); pEll('#d8a840', x, 164, 10, 7); pEll('#f0c860', x - 2, 162, 6, 4); for (let k = -8; k < 9; k += 3) P('#b08030', x + k, 162, 1, 5); }
      tdTreeAt(14, 120, 26, PAL.leaf, 3, 'big'); tdTreeAt(744, 128, 24, PAL.leafAut, 4, 'big');
    } else if (area === 1) { // TANGLED ROOTS — deep forest clearing
      tdGroundFill(PAL.grassDark, 0, 0, w, h, R, 1, 5);
      tdPath([[-10, Y], [w * .3, Y + 8], [w * .6, Y - 4], [w + 10, Y + 4]], 80, { base: '#5a4a32', lt: '#7a6440', lt2: '#9a8050', dk: '#4a3a28', dk2: '#3a2c22', edge: '#2a2020' }, R);
      // moss + leaf litter
      for (let i = 0; i < 400; i++) P(R.pick(['#4a6a2a', '#6a8a3a', '#8a6a2a', '#a8782a']), R.r(0, w), R.r(0, h), R.i(1, 3), 1);
      // giant roots snaking across
      for (let i = 0; i < 9; i++) { let x = R.r(0, w), y = R.r(110, h - 20); const pts = [[x, y]]; for (let k = 0; k < 9; k++) { x += R.r(8, 20) * (i % 2 ? 1 : -1); y += R.r(-6, 6); pts.push([x, y]); } tdStroke(pts, 4, OLC, 2); tdStroke(pts, 3, '#6a4a32', 2); for (const [a, b] of pts) P('#9a7048', a - 1, b - 2, 3, 1); }
      // mushrooms
      for (let i = 0; i < 16; i++) { const x = R.r(0, w), y = R.r(150, h); P('#f0e8d0', x, y - 3, 2, 3); pEll(OLC, x + 1, y - 4, 4, 3); pEll(R() < .7 ? '#e04a3a' : '#e8a040', x + 1, y - 4, 3, 2); P('#fff', x, y - 5, 1, 1); }
      for (let i = 0; i < 26; i++) tdBush(R.r(0, w), R.r(Y + 60, h), R.i(9, 15), PAL.leafDark, i + 5);
      // wall of huge trees at the back
      for (let x = -10; x < w + 20; x += R.i(40, 58)) tdTreeAt(x, R.r(118, 150), R.i(30, 40), R() < .25 ? PAL.leafGold : PAL.leafDark, R.i(1, 999), 'big');
      for (let i = 0; i < 8; i++) tdBush(R.r(0, w), R.r(160, 185), R.i(8, 12), PAL.leaf, i + 50);
    } else if (area === 2) { // RESTLESS SOIL — graveyard at night
      tdGroundFill(PAL.grassNight, 0, 0, w, h, R, 1, 7);
      for (let i = 0; i < 14; i++) { const x = R.r(0, w), y = R.r(150, h - 20); pEll('#3a2e2a', x, y, R.r(14, 26), R.r(5, 9)); pEll('#4a3a32', x - 2, y - 1, R.r(10, 18), R.r(3, 6)); }
      tdPath([[-10, Y + 2], [w * .5, Y - 4], [w + 10, Y + 6]], 70, { base: '#5a5250', lt: '#6e6660', lt2: '#8a8278', dk: '#463e40', dk2: '#342e34', edge: '#221c26' }, R);
      // rows of graves at the back + iron fence
      for (let row = 0; row < 3; row++) for (let x = 14 + row * 12; x < w; x += R.i(36, 52)) tdGrave(x, 70 + row * 34, R() < .5, R);
      for (let x = 0; x < w; x += 7) { P('#1a1824', x, 152, 2, 16); P('#1a1824', x - 1, 150, 4, 2); } P('#1a1824', 0, 156, w, 2); P('#1a1824', 0, 164, w, 2);
      tdTreeAt(70, 120, 30, PAL.leaf, 2, 'dead'); tdTreeAt(690, 130, 26, PAL.leaf, 7, 'dead'); tdTreeAt(380, 70, 24, PAL.leaf, 9, 'dead');
      // open grave + skulls
      P(OLC, 560, 300, 30, 14); P('#1a1418', 561, 301, 28, 12); P('#4a3a32', 561, 312, 28, 2); pEll('#f0e8d4', 600, 312, 3, 3); P(OLC, 599, 311, 1, 1);
      for (let i = 0; i < 20; i++) tdTuft(R.r(0, w), R.r(170, h), PAL.grassNight, R);
      for (let i = 0; i < 12; i++) tdBush(R.r(0, w), R.r(Y + 64, h), R.i(9, 13), PAL.leafDark, i + 30);
    } else if (area === 3) { // SHIFTING WALLS — hedge maze courtyard
      tdGroundFill(PAL.grass, 0, 0, w, h, R, .8, 9);
      // flagstone courtyard
      for (let y = 150; y < h; y += 14) for (let x = (y / 14 % 2) * 12 - 12; x < w; x += 24) { if (y > Y + 70 && R() < .4) continue; const col = R.pick(['#b8aca0', '#c8bcb0', '#a89c94', '#d0c4b8']); P('#6a5e60', x, y, 24, 14); P(col, x + 1, y + 1, 22, 12); P(shade(col, .18), x + 1, y + 1, 22, 1); P(shade(col, -.15), x + 1, y + 12, 22, 1); if (R() < .15) P('#5a9a3a', x + R.r(2, 18), y + R.r(2, 9), 3, 2); }
      // hedge walls (top-down blocks with a lit top face and a dark front face)
      const hedge = (x, y, ww, hh) => { const top = 14; P(OLC, x - 1, y - top - 1, ww + 2, hh + top + 2); P(PAL.leaf.dk, x, y - top, ww, hh); for (let i = 0; i < ww * hh / 30 + 6; i++) { const bx = x + R() * ww, by = y - top + R() * hh; pEll(PAL.leaf.dk, bx, by + 1, 5, 4); pEll(PAL.leaf.base, bx - 1, by, 4, 3); pEll(PAL.leaf.lt, bx - 2, by - 1, 2, 1.5); } P(PAL.leaf.dk2, x, y + hh - top, ww, top); for (let xx = x; xx < x + ww; xx += 4) P(PAL.leaf.dk, xx + R.i(0, 2), y + hh - top + R.i(0, top - 4), 2, 3); P(OLC, x, y + hh, ww, 1); };
      hedge(-20, 40, 260, 90); hedge(300, 20, 180, 100); hedge(540, 40, 240, 90); hedge(-20, 330, 150, 80); hedge(640, 330, 150, 80);
      // stone arch posts with runes
      for (const ax of [X(150), X(490)]) { P(OLC, ax - 7, 98, 14, 46); stoneTexture('#a8a0a8', ax - 6, 99, 12, 44, R, 6, 4); P('#e0dce0', ax - 6, 99, 12, 1); }
      for (let i = 0; i < 6; i++) tdFlowers(R.r(0, w), R.r(Y + 50, h), R, ['#ffffff', '#f8e060', '#a8c8ff'], 4);
    } else { // MIDNIGHT FLAME — dread fortress throne hall
      P('#1e1420', 0, 0, w, h);
      for (let y = 0; y < h; y += 24) for (let x = -12 + (y / 24 % 2) * 12; x < w; x += 24) { const chk = ((x + 12) / 24 + y / 24) % 2 < 1, col = R.pick(chk ? ['#5a4258', '#604660', '#563e56'] : ['#463248', '#4a364c', '#42304a']); P('#1a0e1c', x, y, 24, 24); P(col, x + 1, y + 1, 22, 22); P(shade(col, .16), x + 1, y + 1, 22, 2); P(shade(col, .08), x + 1, y + 1, 2, 22); P(shade(col, -.22), x + 1, y + 21, 22, 2); P(shade(col, -.12), x + 21, y + 1, 2, 22); for (let k = 0; k < 6; k++) P(shade(col, R() < .5 ? .07 : -.07), x + R.r(3, 19), y + R.r(3, 19), R.r(1, 3), 1); if (chk && R() < .5) { P(shade(col, -.1), x + 9, y + 9, 6, 6); P(shade(col, .1), x + 10, y + 10, 4, 4); } if (R() < .12) { let cx = x + R.r(4, 18), cy = y + R.r(3, 10); for (let k = 0; k < 4; k++) { const nx = cx + R.r(-4, 4), ny = cy + R.r(1, 4); pLine('#1a0e1c', cx, cy, nx, ny, 1); cx = nx; cy = ny; } } if (R() < .06) { ctx.globalAlpha = .5; P('#a050d0', x, y + 23, 24, 1); ctx.globalAlpha = 1; } }
      // vignette of dust toward the walls
      for (let y = 0; y < h; y += 2) { const d = Math.max(0, 1 - Math.abs(y - Y) / 170); ctx.globalAlpha = (1 - d) * .35; P('#0a0410', 0, y, w, 2); } ctx.globalAlpha = 1;
      // carpet runner along the fighting line
      P(OLC, 0, Y - 32, w, 64); P('#6a1428', 0, Y - 31, w, 62); P('#8a2034', 0, Y - 31, w, 3); P('#4a0e1e', 0, Y + 27, w, 4); for (let x = 0; x < w; x += 22) { P('#c89a30', x, Y - 26, 10, 2); P('#c89a30', x + 4, Y - 28, 2, 6); } P('#c89a30', 0, Y - 22, w, 1); P('#c89a30', 0, Y + 22, w, 1);
      // pillar bases along the back wall
      P('#0e0810', 0, 0, w, 74); for (let y = 8; y < 70; y += 8) for (let x = (y / 8 % 2) * 8 - 8; x < w; x += 16) { const col = R.pick(['#2e2032', '#33243a', '#2a1c2e']); P(col, x + 1, y + 1, 15, 7); P(shade(col, .12), x + 1, y + 1, 15, 1); } P(OLC, 0, 0, w, 9); P('#4a3448', 0, 0, w, 7); P('#6a4a66', 0, 0, w, 2); ctx.globalAlpha = .5; P('#0a0410', 0, 70, w, 8); ctx.globalAlpha = .25; P('#0a0410', 0, 78, w, 6); ctx.globalAlpha = 1;
      for (const px of [40, 230, 420, 610]) { P(OLC, px - 1, 30, 44, 110); stoneTexture('#4a3448', px, 31, 42, 108, R, 10, 8); P('#6a4a66', px, 31, 3, 108); ctx.globalAlpha = .35; P('#0a0410', px + 30, 31, 12, 108); ctx.globalAlpha = 1; P(OLC, px - 5, 134, 52, 10); P('#5a4058', px - 4, 135, 50, 8); P('#a040d0', px + 18, 60, 6, 12); P('#e0a0ff', px + 20, 62, 2, 8); }
      // banners hanging between pillars
      for (const bx of [140, 330, 520]) { P(OLC, bx - 1, 20, 22, 70); P('#6a1428', bx, 21, 20, 66); P('#8a2034', bx, 21, 3, 66); pPoly('#6a1428', [[bx, 86], [bx + 10, 96], [bx + 20, 86]]); P('#e0a040', bx + 7, 40, 6, 6); P('#c89a30', bx, 21, 20, 2); }
    }
  });
}
const BRAZIERS = [[120, CGY - 40], [520, CGY - 40]];
function drawCombatBG(area, raid, t, opts = {}) {
  const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0);
  P(raid ? '#1e2630' : area === 4 ? '#140c16' : area === 2 ? '#1e2632' : '#2a4a2a', 0, 0, 640, 360);
  Cam.apply(c, 1); c.drawImage(bgFar(area, raid), ARENA_OX, ARENA_OY);
  // animated bits (world space)
  if (raid) { [[40, 110], [330, 108], [600, 110]].forEach(([x, y], i) => { P(OLC, x - 2, y, 4, 26); P('#5a3a22', x - 1, y, 2, 26); flame(x, y, t + i, 1, ['#ff6020', '#ffb040', '#fff0a0']); }); if (chance(DT * 10)) Particles.spawn({ x: rnd(0, 640), y: CGY + rnd(-20, 60), vx: rnd(-8, 8), vy: -rnd(20, 40), life: 2, c: '#ff9030', c2: '#401008', size: 1, glow: 1 }); }
  else if (area === 0) {
    // windmill seen 3/4 at the back right
    const wx = 560, wy = 74; P(OLC, wx - 9, wy - 34, 18, 36); stoneTexture('#d8ccb8', wx - 8, wy - 33, 16, 34, RNG(5), 6, 4); pPoly(OLC, [[wx - 12, wy - 32], [wx, wy - 46], [wx + 12, wy - 32]]); pPoly('#c8583a', [[wx - 10, wy - 33], [wx, wy - 44], [wx + 10, wy - 33]]); P(OLC, wx - 3, wy - 10, 6, 10);
    for (let k = 0; k < 4; k++) { const an = t * .9 + k * Math.PI / 2; pLine(OLC, wx, wy - 30, wx + Math.cos(an) * 26, wy - 30 + Math.sin(an) * 26, 3); pLine('#f0e8d8', wx + Math.cos(an) * 5, wy - 30 + Math.sin(an) * 5, wx + Math.cos(an + .16) * 25, wy - 30 + Math.sin(an + .16) * 25, 2); }
    for (let i = 0; i < 4; i++) { const bx = (t * 14 + i * 230) % 800 - 80, by = 190 + Math.sin(t * 3 + i) * 14; const f = Math.sin(t * 16 + i) > 0; c.globalAlpha = .3; P('#1e2040', bx, by + 8, 2, 1); c.globalAlpha = 1; P(OLC, bx, by, 1, 2); P(i % 2 ? '#f8a0c0' : '#fff', bx - (f ? 2 : 1), by - (f ? 1 : 0), f ? 2 : 1, 2); P(i % 2 ? '#f8a0c0' : '#fff', bx + 1, by - (f ? 1 : 0), f ? 2 : 1, 2); }
    // cloud shadows
    c.globalAlpha = .1 * (1 - World.nightK()); for (let i = 0; i < 3; i++) { const R = RNG(40 + i), x = ((R() * 1200 + t * 8) % 1200) - 300, y = R.r(40, 320); pEll('#1e2850', x, y, R.r(70, 120), R.r(30, 50)); } c.globalAlpha = 1;
  }
  else if (area === 1) { c.globalAlpha = .08 + Math.sin(t * .7) * .02; for (let i = 0; i < 4; i++) pPoly('#f0f8b0', [[60 + i * 180, -30], [96 + i * 180, -30], [160 + i * 180 + 30, CGY + 40], [96 + i * 180 + 20, CGY + 40]]); c.globalAlpha = 1; if (chance(DT * 3)) Particles.spawn({ x: rnd(-20, 700), y: -5, vx: rnd(4, 14), vy: rnd(12, 22), life: 8, c: pick(['#6a9a3a', '#8aaa3a', '#d8a83a']), type: 'leaf', rot: rnd(6), vr: rnd(-3, 3), drag: 1, ground: CGY + rnd(-30, 80) }); for (let i = 0; i < 8; i++) { const fx = 40 + i * 80 + Math.sin(t * .6 + i) * 20, fy = 160 + Math.sin(t * .9 + i * 2) * 40; if (Math.sin(t * 2 + i * 1.7) > .3) { P('#e8ff90', fx, fy, 1, 1); c.globalAlpha = .3; P('#e8ff90', fx - 1, fy - 1, 3, 3); c.globalAlpha = 1; } } }
  else if (area === 2) { for (let i = 0; i < 5; i++) { const wx = 60 + i * 140 + Math.sin(t * .5 + i) * 30, wy = 150 + Math.sin(t * 1.3 + i * 2) * 20; c.globalAlpha = .5 + Math.sin(t * 3 + i) * .2; pCirc('#80ffd0', wx, wy, 2); c.globalAlpha = .15; pCirc('#80ffd0', wx, wy, 6); c.globalAlpha = 1; } c.globalAlpha = .12; for (let i = 0; i < 4; i++) { const x = ((t * 6 + i * 220) % 900) - 150; pEll('#c8d8f0', x, 230 + i * 20, 120, 14); } c.globalAlpha = 1; }
  else if (area === 3) { const sh = opts.wallShift || 0; for (let i = 0; i < 6; i++) { const rx = 30 + i * 110 + sh * (i % 2 ? 30 : -30), ry = 30 + (i % 3) * 22, pulse = .5 + Math.sin(t * 2 + i) * .5; c.globalAlpha = .4 + pulse * .6; P('#70e0f0', rx, ry, 8, 1); P('#70e0f0', rx + 3, ry - 3, 1, 8); P('#70e0f0', rx + 1, ry + 3, 6, 1); c.globalAlpha = 1; } [[90, 100], [430, 100]].forEach(([x, y], i) => { P(OLC, x - 2, y, 4, 14); P('#6a5a4a', x - 4, y + 12, 8, 3); flame(x, y, t + i * 3, 1, ['#ff6020', '#ffb040', '#fff0a0']); }); }
  else if (area === 4) { if (opts.bolt > .5) { c.globalAlpha = .4; P('#c0a0ff', -60, -30, 760, 420); c.globalAlpha = 1; } BRAZIERS.forEach(([x, y], i) => { tdShadowRect(x - 8, y + 14, 20, 3); P(OLC, x - 9, y - 5, 18, 8); P('#3a2a3a', x - 8, y - 4, 16, 6); P(OLC, x - 4, y + 2, 8, 12); P('#2a1a2a', x - 3, y + 2, 6, 11); P(OLC, x - 7, y + 12, 14, 4); flame(x, y - 4, t + i * 2, 1.6, ['#6a20c0', '#b060ff', '#f0d0ff']); }); if (chance(DT * 8)) { const b = pick(BRAZIERS); Particles.spawn({ x: b[0] + rnd(-4, 4), y: b[1] - 14, vx: rnd(-6, 6), vy: -rnd(20, 40), life: 1.6, c: '#c070ff', c2: '#301040', size: 1, glow: 1 }); } }
  Cam.apply(c, 1);
}
// foreground framing drawn after the fighters (screen corners, slight parallax)
function drawCombatFG(area, raid, t) {
  const c = ctx; const pal = raid ? PAL.leafDark : area === 0 ? PAL.leaf : area === 1 ? PAL.leafDark : area === 2 ? PAL.leafDark : area === 3 ? PAL.leaf : null;
  if (!pal) return;
  const art = Cache.get('cfg_' + (raid ? 'r' : area), 760, 140, () => { const R = RNG(90 + area); for (let i = 0; i < 7; i++) { const x = i < 4 ? R.r(-10, 120) : R.r(640, 770), y = R.r(-30, 10); if (area === 2 || raid) { tdTreeAt(x, y + 60, 26, PAL.leaf, i, 'dead'); continue; } tdCanopy(x, y, R.r(20, 32), R() < .25 && area === 0 ? PAL.leafAut : pal, R, 8); } for (let i = 0; i < 4; i++) { const x0 = i < 2 ? 0 : 760, dir = i < 2 ? 1 : -1; let x = x0, y = R.r(14, 46); for (let k = 0; k < 6; k++) { const nx = x + dir * R.r(10, 20), ny = y + R.r(-2, 6); pLine(OLC, x, y, nx, ny, 3); pLine('#5a3a30', x, y - 1, nx, ny - 1, 1); x = nx; y = ny; if (R() < .6 && area !== 2) tdCanopy(x, y + 3, R.r(5, 8), pal, R, 3); } } });
  c.save(); Cam.apply(c, 1.12); const sw = Math.round(World.windSway(0, .6)); c.drawImage(art, ARENA_OX + sw, ARENA_OY - 4); c.restore(); Cam.apply(c, 1);
}
function flame(x, y, t, s, cols) {
  for (let i = 0; i < 3; i++) { const h = (7 - i * 2 + Math.sin(t * 13 + i) * 1.5 + noise1(t * 8 + i * 3) * 2) * s, w = (4 - i) * s; pPoly(cols[i], [[x - w, y], [x + Math.sin(t * 9 + i) * s, y - h * 1.6], [x + w, y]]); }
}
function combatLights(area, raid, t, opts = {}) {
  const amb = raid ? [115, 120, 175] : area === 0 ? mixA(World.ambient(), [255, 250, 240], .3) : area === 1 ? [150, 180, 150] : area === 2 ? [100, 104, 160] : area === 3 ? [200, 196, 190] : [130, 70, 110];
  Light.begin(opts.dark ? mixA(amb, [20, 10, 30], opts.dark) : amb);
  if (raid) [[40, 104], [330, 102], [600, 104]].forEach(([x, y]) => Light.add(x, y, 110, '#ff9040', .9, .25));
  if (area === 0 && !raid && World.nightK() > .2) Light.add(320, 200, 260, '#ffe0b0', .4 * World.nightK());
  if (area === 1 && !raid) for (let i = 0; i < 4; i++) Light.add(140 + i * 180, 160, 130, '#e8f0b0', .35);
  if (area === 2 && !raid) Light.add(320, 230, 240, '#c0c8ff', .45);
  if (area === 3 && !raid) [[90, 96], [430, 96]].forEach(([x, y]) => Light.add(x, y, 120, '#ffa050', .8, .25));
  if (area === 4 && !raid) BRAZIERS.forEach(([x, y]) => Light.add(x, y - 10, 150, '#b060ff', 1, .25));
  if (opts.bolt > .3) Light.add(320, 60, 500, '#d0c0ff', opts.bolt);
}
