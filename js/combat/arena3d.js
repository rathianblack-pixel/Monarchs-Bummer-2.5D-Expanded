'use strict';
/* =========================================================
   COMBAT ARENAS — 2.5D dioramas (used when the HD renderer is on)
   Low camera, real ground plane that runs to a painted horizon, props standing at
   many depths (tilt-shift blurred far + near), animated details, lights.
   ========================================================= */
const A3 = { near: { x: -420, y: CGY - 300, w: 1480, h: 550 }, far: { x: -1100, y: CGY - 1150, w: 2840, h: 850, s: 3 }, skyS: 5, skyW: 808, skyH: 220 };
const a3c = (key, w, h, fn) => Cache.get('a3_' + key, w, h, fn);
// art helper: returns { c, bx, by } — (bx, by) is the pixel that stands on the ground
function a3art(key, w, h, bx, by, fn) { const c = a3c(key, w, h, fn); return { c, bx, by }; }
function a3put(L, a, x, yb, o = {}) { L.push(Object.assign({ a, x, yb }, o)); }
const A3PAL = {
  day: { top: '#3a76d0', mid: '#78b2ee', hor: '#d4ecf6', fog: [.80, .89, .95], clear: [.83, .92, .96] },
  forest: { top: '#0c2016', mid: '#1c4430', hor: '#3a6a48', fog: [.25, .42, .32], clear: [.16, .3, .22] },
  night: { top: '#080a20', mid: '#1e2250', hor: '#4a4c80', fog: [.25, .27, .42], clear: [.2, .21, .36] },
  dusk: { top: '#2a2a6c', mid: '#b0607a', hor: '#f4b878', fog: [.86, .64, .55], clear: [.9, .68, .5] },
  hall: { top: '#0c0610', mid: '#1e1222', hor: '#2e1a34', fog: [.18, .09, .2], clear: [.1, .05, .1] },
  raid: { top: '#0a0a1e', mid: '#2a1e40', hor: '#7a3a3a', fog: [.32, .2, .26], clear: [.3, .18, .22] }
};
/* ---------------- sky / backdrop panels (world 4040 x 1100, scaled x5) ---------------- */
function a3sky(kind) {
  const W = A3.skyW, H = A3.skyH, pal = A3PAL[kind];
  return a3c('sky_' + kind, W, H, () => {
    const R = RNG(31 + kind.length * 7);
    // dithered vertical gradient
    for (let y = 0; y < H; y++) { const k = y / H, c = k < .55 ? mix(pal.top, pal.mid, k / .55) : mix(pal.mid, pal.hor, (k - .55) / .45); P(c, 0, y, W, 1); if (y % 2 === 0) for (let x = (y / 2) % 4; x < W; x += 4) if (R() < .3) P(mix(c, pal.hor, .12), x, y, 1, 1); }
    const ridge = (yb, amp, fq, col, lt, seed) => { for (let x = 0; x < W; x++) { const h = amp * (.55 + .45 * Math.sin(x * fq + seed) * Math.sin(x * fq * 2.3 + seed * 2)) + amp * .3 * vnoise2(x * .05 + seed, seed); P(col, x, Math.round(yb - h), 1, Math.ceil(h) + H); if (lt && x % 3 === 0 && Math.sin(x * fq * 4 + seed) > .4) P(lt, x, Math.round(yb - h), 1, 1); } };
    const clouds = (n, y0, y1, col, sh) => { for (let i = 0; i < n; i++) { const cx = R.r(0, W), cy = R.r(y0, y1), s = R.r(10, 24); for (let k = 0; k < 6; k++) { const ox = R.r(-s * 1.6, s * 1.6), oy = R.r(-s * .3, s * .2), r = s * R.r(.5, .9); pEll(sh, cx + ox, cy + oy + 2, r, r * .55); pEll(col, cx + ox, cy + oy, r, r * .5); } } };
    if (kind === 'day') {
      pCirc('#fffbe0', 600, 46, 13); ctx.globalAlpha = .25; pCirc('#fffbe0', 600, 46, 24); ctx.globalAlpha = 1;
      clouds(14, 20, 120, '#ffffff', '#c4d6ee');
      ridge(H - 52, 34, .011, '#9ab8d0', '#b8d0e0', 1); ridge(H - 34, 24, .019, '#7aa486', '#94b896', 4); ridge(H - 18, 14, .031, '#5a8e52', '#78a85a', 7);
      // farm silhouettes + tiny windmills on the hills
      for (let i = 0; i < 6; i++) { const x = R.r(20, W - 20), y = H - 20 - R.r(0, 8); P('#4a6a4a', x - 4, y - 5, 8, 5); pPoly('#8a4a3a', [[x - 5, y - 5], [x, y - 9], [x + 5, y - 5]]); }
      for (let i = 0; i < 3; i++) { const x = R.r(40, W - 40), y = H - 30; P('#6a8a8a', x - 1, y - 12, 3, 12); pLine('#6a8a8a', x - 6, y - 18, x + 6, y - 6, 1); pLine('#6a8a8a', x + 6, y - 18, x - 6, y - 6, 1); }
      P('#4a8a46', 0, H - 6, W, 6);
    } else if (kind === 'forest') {
      for (let L = 0; L < 4; L++) { const col = ['#1e4a34', '#18402c', '#123424', '#0e2a1c'][L]; for (let i = 0; i < 40; i++) { const x = R.r(0, W), w = R.r(4, 10); P(shade(col, -.2), x, 0, w, H); P(shade(col, .1), x, 0, 1, H); } for (let i = 0; i < 26; i++) tdCanopy(R.r(0, W), R.r(-10, 60 + L * 20), R.r(22, 40), { base: col, lt: shade(col, .15), lt2: shade(col, .3), dk: shade(col, -.15), dk2: shade(col, -.3), ol: shade(col, -.45) }, R, 7); }
      for (let i = 0; i < 30; i++) { ctx.globalAlpha = R.r(.3, .7); P('#b8e070', R.r(0, W), R.r(0, 90), R.i(1, 3), R.i(1, 2)); } ctx.globalAlpha = 1;
      ridge(H - 20, 20, .03, '#1a3a26', null, 3); P('#24402a', 0, H - 8, W, 8);
    } else if (kind === 'night' || kind === 'raid') {
      for (let i = 0; i < 260; i++) { const x = R.r(0, W), y = R.r(0, H * .7), b = R(); P(b > .9 ? '#ffffff' : b > .6 ? '#c8d0ff' : '#7a80b8', x, y, 1, 1); if (b > .97) { P('#ffffff', x - 1, y, 3, 1); P('#ffffff', x, y - 1, 1, 3); } }
      const mx = kind === 'night' ? 250 : 560, my = 50; ctx.globalAlpha = .12; pCirc('#e8e8ff', mx, my, 40); ctx.globalAlpha = .2; pCirc('#e8e8ff', mx, my, 26); ctx.globalAlpha = 1;
      pCirc(kind === 'raid' ? '#f0c0a0' : '#f4f0d8', mx, my, 17); pCirc(kind === 'raid' ? '#d89a80' : '#d8d4c0', mx + 4, my + 3, 4); pCirc(kind === 'raid' ? '#d89a80' : '#d8d4c0', mx - 6, my - 4, 3); pCirc(kind === 'raid' ? '#d89a80' : '#d8d4c0', mx - 2, my + 8, 2);
      clouds(8, 30, 110, kind === 'raid' ? '#4a2a40' : '#2e3062', kind === 'raid' ? '#2a1a2a' : '#1e2046');
      ridge(H - 44, 30, .013, '#24264a', '#30325a', 2); ridge(H - 24, 18, .024, '#1a1c36', null, 5);
      if (kind === 'night') { // chapel + dead trees silhouette
        const cx = 520, by = H - 22; P('#12122a', cx - 20, by - 26, 40, 26); pPoly('#12122a', [[cx - 24, by - 26], [cx, by - 44], [cx + 24, by - 26]]); P('#12122a', cx + 10, by - 62, 10, 40); pPoly('#12122a', [[cx + 8, by - 62], [cx + 15, by - 80], [cx + 22, by - 62]]); P('#ffd890', cx - 8, by - 18, 3, 5); P('#ffd890', cx + 4, by - 18, 3, 5); P('#12122a', cx + 14, by - 88, 1, 8); P('#12122a', cx + 12, by - 85, 5, 1);
        for (let i = 0; i < 9; i++) { const x = R.r(0, W), y = H - 18; pLine('#10102a', x, y, x, y - 18, 2); pLine('#10102a', x, y - 10, x - 6, y - 16, 1); pLine('#10102a', x, y - 13, x + 5, y - 20, 1); }
      } else { // burning village horizon
        for (let i = 0; i < 12; i++) { const x = R.r(0, W), y = H - 16; P('#1a1220', x - 6, y - 8, 12, 8); pPoly('#1a1220', [[x - 8, y - 8], [x, y - 15], [x + 8, y - 8]]); if (R() < .4) { ctx.globalAlpha = .5; pEll('#ff7030', x, y - 16, 6, 8); ctx.globalAlpha = 1; } }
        for (let i = 0; i < 5; i++) { const x = R.r(0, W); for (let k = 0; k < 8; k++) { ctx.globalAlpha = .25; pEll('#3a2a3a', x + k * 4, H - 30 - k * 12, 10 + k * 2, 6 + k); } ctx.globalAlpha = 1; }
      }
      P('#20223e', 0, H - 8, W, 8);
    } else if (kind === 'dusk') {
      pCirc('#ffe8b0', 420, H - 70, 18); ctx.globalAlpha = .3; pCirc('#ffd090', 420, H - 70, 32); ctx.globalAlpha = 1;
      clouds(12, 30, 130, '#f0a8a0', '#a8607a');
      ridge(H - 40, 24, .014, '#7a5070', '#8a6080', 3);
      const mx = 260, by = H - 26; P('#3a2440', mx - 60, by - 40, 120, 40); for (const [ox, h] of [[-60, 70], [44, 70], [-12, 56]]) { P('#3a2440', mx + ox, by - h, 18, h); pPoly('#3a2440', [[mx + ox - 3, by - h], [mx + ox + 9, by - h - 18], [mx + ox + 21, by - h]]); }
      for (let i = 0; i < 10; i++) P('#ffd070', mx - 50 + i * 10, by - 26 + (i % 2) * 10, 3, 4);
      ridge(H - 16, 10, .05, '#2a4a30', '#3a5a38', 6); P('#2e5032', 0, H - 6, W, 6);
    } else if (kind === 'hall') { // back wall of the throne hall
      P('#1a1020', 0, 0, W, H);
      for (let y = 0; y < H; y += 6) for (let x = (y / 6 % 2) * 6 - 6; x < W; x += 12) { const col = R.pick(['#2e2034', '#332438', '#2a1c30']); P(col, x + 1, y + 1, 11, 5); P(shade(col, .12), x + 1, y + 1, 11, 1); }
      for (let i = 0; i < 7; i++) { const x = 50 + i * 118, y = 40; P('#0e0812', x - 16, y - 4, 32, 96); pEll('#0e0812', x, y - 4, 16, 14); const cols = ['#8a2a6a', '#3a3ab0', '#b03a4a', '#6a2ab0']; for (let k = 0; k < 8; k++) for (let j = 0; j < 4; j++) P(cols[(k + j + i) % 4], x - 13 + j * 7, y + k * 11, 6, 10); pEll('#b04aa0', x, y - 4, 12, 10); pCirc('#f0a0e0', x, y - 4, 3); P('#0e0812', x - 1, y - 14, 2, 104); }
      for (let i = 0; i < 6; i++) { const x = 108 + i * 118; P('#4a0e20', x - 10, 30, 20, 90); P('#7a1830', x - 9, 30, 4, 88); pPoly('#4a0e20', [[x - 10, 120], [x, 130], [x + 10, 120]]); pCirc('#e0a040', x, 60, 4); }
      P('#100810', 0, H - 30, W, 30); for (let x = 0; x < W; x += 16) P('#20142a', x, H - 30, 14, 3);
    }
  });
}
/* ---------------- floors ---------------- */
function a3floor(area, raid, which) {
  const F = which === 'near' ? A3.near : A3.far, s = which === 'near' ? 1 : A3.far.s, W = Math.ceil(F.w / s), H = Math.ceil(F.h / s);
  return a3c('fl_' + (raid ? 'r' : area) + which, W, H, () => {
    const R = RNG(500 + area * 11 + (raid ? 77 : 0) + (which === 'near' ? 0 : 3));
    const toX = x => (x - F.x) / s, toY = y => (y - F.y) / s, Y = toY(CGY);
    const gpal = raid ? PAL.grassNight : [PAL.grass, PAL.grassDark, PAL.grassNight, PAL.grass, PAL.stone][area];
    if (area === 4 && !raid) { // hall flagstones + carpet runner
      const t = which === 'near' ? 24 : 10;
      for (let y = 0; y < H; y += t) for (let x = -(y / t % 2) * t / 2; x < W; x += t) { const chk = ((x / t | 0) + (y / t)) % 2, col = R.pick(chk ? ['#5a4258', '#604660'] : ['#463248', '#4a364c']); P('#1a0e1c', x, y, t, t); P(col, x + 1, y + 1, t - 2, t - 2); P(shade(col, .14), x + 1, y + 1, t - 2, 1); P(shade(col, -.2), x + 1, y + t - 2, t - 2, 1); if (which === 'near' && R() < .1) { let cx = x + R.r(4, 18), cy = y + R.r(3, 12); for (let k = 0; k < 4; k++) { const nx = cx + R.r(-4, 4), ny = cy + R.r(1, 4); pLine('#1a0e1c', cx, cy, nx, ny, 1); cx = nx; cy = ny; } } }
      const cw = which === 'near' ? 1 : 0; const runner = (y0, y1) => { P('#2a0a14', 0, y0 - 1, W, y1 - y0 + 2); P('#6a1428', 0, y0, W, y1 - y0); P('#8a2034', 0, y0, W, 2); P('#c89a30', 0, y0 + 3, W, 1); P('#c89a30', 0, y1 - 4, W, 1); if (cw) for (let x = 0; x < W; x += 22) { P('#c89a30', x, y0 + 7, 10, 2); P('#c89a30', x + 4, y0 + 5, 2, 6); } };
      if (which === 'near') runner(Y - 30, Y + 30); else { const cx = toX(320); P('#2a0a14', cx - 11, 0, 22, H); P('#6a1428', cx - 10, 0, 20, H); P('#c89a30', cx - 7, 0, 1, H); P('#c89a30', cx + 6, 0, 1, H); }
      if (which === 'near') { const cx = toX(320); P('#2a0a14', cx - 31, 0, 62, Y - 30); P('#6a1428', cx - 30, 0, 60, Y - 30); P('#c89a30', cx - 26, 0, 1, Y - 30); P('#c89a30', cx + 25, 0, 1, Y - 30); }
      return;
    }
    tdGroundFill(gpal, 0, 0, W, H, R, which === 'near' ? 1 : .5, area * 3 + (raid ? 9 : 0));
    if (which === 'far') {
      if (area === 0 && !raid) { for (let i = 0; i < 70; i++) { const fx = R.r(0, W), fy = R.r(0, H * .9), fw = R.r(30, 90), fh = R.r(10, 26), col = R.pick(['#c8b050', '#8aaa40', '#a07a40', '#d0c060', '#6a9a3a']); P(shade(col, -.25), fx - 1, fy - 1, fw + 2, fh + 2); P(col, fx, fy, fw, fh); for (let k = 1; k < fh; k += 3) P(shade(col, -.12), fx, fy + k, fw, 1); } for (let i = 0; i < 18; i++) { const y = R.r(0, H); P('#3a6a34', 0, y, W, 2); } tdStroke([[toX(320), H], [toX(300), H * .7], [toX(420), H * .4], [toX(380), 0]], 6, '#a87a4a'); }
      if (area === 2 || raid) for (let i = 0; i < 60; i++) { const x = R.r(0, W), y = R.r(0, H); P('#2a2a40', x, y, 3, 2); }
      if (area === 3 && !raid) for (let y = 4; y < H; y += R.i(14, 26)) { P('#1e3a22', 0, y, W, 6); P('#3e6a3a', 0, y, W, 2); }
      return;
    }
    // ---- near floor ----
    if (area === 0 && !raid) {
      // crop field behind the road
      const fy0 = toY(CGY - 290), fy1 = toY(CGY - 92);
      for (let y = fy0; y < fy1; y += 6) { P('#7a4e30', 0, y, W, 4); P('#9a6a40', 0, y, W, 1); for (let x = R.i(0, 6); x < W; x += R.i(5, 9)) { P('#3a7a2a', x, y - 2, 2, 3); P('#6ab040', x, y - 3, 1, 2); if (R() < .1) P('#e0b040', x + 1, y - 3, 1, 1); } }
      P('#4a8a3a', 0, fy1, W, 3);
      // muddy road along the fight line
      const pts = []; for (let x = -20; x <= W + 20; x += 40) pts.push([x, Y + Math.sin(x * .01) * 6 + 2]);
      tdPath(pts, 70, PAL.mud, R);
      for (let i = 0; i < 16; i++) { const x = R.r(0, W), y = Y + R.r(-26, 26), rx = R.r(8, 20); pEll('#3a2a22', x, y + 1, rx + 1, rx * .32 + 1); pEll('#4a8ab8', x, y, rx, rx * .3); pEll('#8ac8e8', x - rx * .3, y - 1, rx * .4, 1); }
      for (let i = 0; i < 60; i++) tdFlowers(R.r(0, W), R() < .5 ? R.r(toY(CGY + 50), H) : R.r(toY(CGY - 88), toY(CGY - 40)), R, ['#ffffff', '#ffe060', '#f080a0', '#a0c0ff'], 3);
    } else if (area === 1 && !raid) {
      const pts = []; for (let x = -20; x <= W + 20; x += 40) pts.push([x, Y + Math.sin(x * .013) * 8]); tdPath(pts, 58, PAL.dirt, R);
      for (let i = 0; i < 40; i++) { let x = R.r(0, W), y = R.r(0, H); for (let k = 0; k < 10; k++) { const nx = x + R.r(-14, 14), ny = y + R.r(-3, 5); pLine('#2a1a14', x, y + 1, nx, ny + 1, 4); pLine('#6a4430', x, y, nx, ny, 3); pLine('#8a5a3a', x, y - 1, nx, ny - 1, 1); x = nx; y = ny; } }
      for (let i = 0; i < 400; i++) P(R.pick(['#8a6a2a', '#a07a30', '#6a5a2a', '#c08a3a']), R.r(0, W), R.r(0, H), 2, 1);
      for (let i = 0; i < 50; i++) { const x = R.r(0, W), y = R.r(0, H); P('#e8e0d0', x, y - 1, 1, 2); pEll(R() < .5 ? '#d84a3a' : '#c8a060', x, y - 2, 2, 1.4); }
      for (let i = 0; i < 30; i++) { ctx.globalAlpha = .25; pEll('#c8f070', R.r(0, W), R.r(0, H), R.r(20, 50), R.r(6, 14)); } ctx.globalAlpha = 1;
    } else if (area === 2 && !raid) {
      const pts = []; for (let x = -20; x <= W + 20; x += 40) pts.push([x, Y + Math.sin(x * .02) * 4]); tdPath(pts, 54, PAL.mud, R);
      for (let x = -10; x < W; x += R.i(18, 26)) { const y = Y + R.r(-16, 16); pEll('#2a2a3a', x, y + 1, 9, 5); pEll(R.pick(['#8a8a9a', '#7a7a8a']), x, y, 8, 4); pEll('#a8a8b8', x - 2, y - 1, 4, 2); }
      for (let i = 0; i < 20; i++) { const x = R.r(0, W), y = R.r(0, toY(CGY - 50)); pEll('#3a2a24', x, y, 14, 5); pEll('#5a4030', x, y - 1, 12, 4); }
      for (let i = 0; i < 40; i++) { P('#e8e0d0', R.r(0, W), R.r(0, H), 2, 1); }
    } else if (area === 3 && !raid) {
      tdCobbles(toX(320), Y, 360, 70, PAL.stone, R);
      for (let r = 0; r < 3; r++) { const y = toY(CGY - 120 - r * 70); P('#8a7a68', 0, y - 8, W, 16); for (let x = 0; x < W; x += 10) { P(R.pick(['#c4b4a0', '#b0a090', '#d0c0aa']), x + 1, y - 7, 8, 6); P(R.pick(['#c4b4a0', '#b0a090']), x + 5, y + 1, 8, 6); } }
      for (let i = 0; i < 40; i++) tdFlowers(R.r(0, W), R.r(toY(CGY + 80), H), R, ['#ffffff', '#f080a0', '#c080ff'], 3);
    } else { // raid: village road at night
      const pts = []; for (let x = -20; x <= W + 20; x += 40) pts.push([x, Y + Math.sin(x * .01) * 5]); tdPath(pts, 66, PAL.dirt, R);
      ctx.globalAlpha = .35; P('#101830', 0, 0, W, H); ctx.globalAlpha = 1;
    }
    // tufts everywhere off the path
    for (let i = 0; i < W * H / 900; i++) { const x = R.r(0, W), y = R.r(0, H); if (Math.abs(y - Y) < 40) continue; tdTuft(x, y, gpal, R, R() < .3); }
  });
}
/* ---------------- prop art ---------------- */
function a3tree(r, pal, seed, kind) { const c = tdTreeArt(r, PAL[pal], seed, kind); return { c, bx: c.width / 2, by: c.height - 3 }; }
function a3tall(r, th, pal, seed) {
  const W = Math.ceil(r * 2.6 + 16), H = Math.ceil(th + r * 1.8 + 14);
  return a3art('tall' + r + '_' + th + pal + seed, W, H, W / 2, H - 3, () => {
    const R = RNG(seed), cx = W / 2, by = H - 3, P2 = PAL[pal];
    for (let y = by - th; y < by; y++) { const k = (y - (by - th)) / th, w = 5 + k * k * 9; P(OLC, cx - w - 1, y, w * 2 + 2, 1); P('#5a3c2c', cx - w, y, w * 2, 1); P('#7a5238', cx - w, y, Math.max(1, w * .6), 1); P('#3a2620', cx + w - 2, y, 2, 1); if (R() < .3) P('#2e1e18', cx + R.r(-w, w), y, 1, 2); }
    for (let k = 0; k < 4; k++) { const d = k < 2 ? -1 : 1, len = R.r(10, 18); pLine(OLC, cx + d * 6, by - 4, cx + d * (8 + len), by, 4); pLine('#6a4630', cx + d * 6, by - 4, cx + d * (8 + len), by - 1, 2); }
    for (let i = 0; i < 6; i++) { const y = by - R.r(th * .2, th * .8); ctx.globalAlpha = .7; P('#4a7a3a', cx - 4 + R.r(-3, 3), y, R.i(2, 5), R.i(2, 4)); ctx.globalAlpha = 1; }
    tdCanopy(cx, by - th - r * .4, r, P2, R, 12); tdCanopy(cx - r * .5, by - th - r * .1, r * .6, P2, R, 6); tdCanopy(cx + r * .55, by - th - r * .05, r * .55, P2, R, 6);
  });
}
function a3hay() { return a3art('hay', 30, 24, 15, 21, () => { pEll(OLC, 15, 13, 14, 10); pEll('#d8a840', 15, 13, 13, 9); for (let i = 0; i < 18; i++) P(i % 2 ? '#f0cc60' : '#b08030', 4 + (i * 7) % 22, 6 + (i * 5) % 14, 3, 1); pEll('#b88a30', 15, 13, 5, 4); pEll('#e8c050', 14, 12, 3, 2); }); }
function a3scarecrow() { return a3art('scare', 34, 56, 17, 53, () => { P(OLC, 16, 14, 3, 40); P('#8a5a34', 17, 14, 1, 40); P(OLC, 2, 22, 30, 3); P('#8a5a34', 3, 23, 28, 1); P(OLC, 8, 20, 18, 18); P('#4a6aa8', 9, 21, 16, 16); P('#c84a3a', 9, 28, 16, 3); for (let i = 0; i < 5; i++) P('#e0c060', 3 + i * 6, 24, 2, 4); pCirc(OLC, 17, 13, 7); pCirc('#e8d8a0', 17, 13, 6); P(OLC, 14, 12, 2, 2); P(OLC, 19, 12, 2, 2); P(OLC, 15, 16, 5, 1); P(OLC, 8, 5, 18, 3); P('#6a4a2a', 9, 5, 16, 2); P(OLC, 12, 0, 10, 6); P('#7a5a34', 13, 1, 8, 4); }); }
function a3cart() { return a3art('cart', 54, 34, 27, 31, () => { P(OLC, 4, 8, 44, 14); P('#a8703a', 5, 9, 42, 12); P('#c88a4a', 5, 9, 42, 2); for (let x = 8; x < 46; x += 8) P('#7a4a2e', x, 11, 1, 10); P(OLC, 46, 16, 8, 2); for (const wx of [14, 38]) { pCirc(OLC, wx, 24, 8); pCirc('#7a4a2e', wx, 24, 7); pCirc(OLC, wx, 24, 5); pCirc('#a8703a', wx, 24, 4); pCirc(OLC, wx, 24, 1); } pEll('#d8a840', 22, 8, 14, 5); pEll('#f0cc60', 20, 6, 8, 2); }); }
function a3fence(n, col = '#a8703a') { const W = n * 12 + 4; return a3art('fence' + n + col, W, 18, W / 2, 16, () => tdFenceH(1, W - 3, 16, col)); }
function a3windmill() { return a3art('wmill', 60, 110, 30, 107, () => { pPoly(OLC, [[14, 107], [20, 30], [40, 30], [46, 107]]); pPoly('#e8dcc4', [[15, 106], [21, 31], [39, 31], [45, 106]]); pPoly('#c8b898', [[34, 106], [37, 31], [39, 31], [45, 106]]); for (let y = 40; y < 104; y += 8) P('#b8a888', 18, y, 26, 1); P(OLC, 25, 84, 10, 22); P('#7a4a2e', 26, 85, 8, 21); P(OLC, 27, 52, 6, 8); P('#3a4a78', 28, 53, 4, 6); pPoly(OLC, [[12, 32], [30, 10], [48, 32]]); pPoly('#a83a2a', [[14, 31], [30, 12], [46, 31]]); pPoly('#c8503a', [[14, 31], [30, 12], [26, 31]]); }); }
function a3cottage(seed, roofCol, wall) { const b = tdBuilding('a3cot' + seed, { w: 70, wallH: 30, roofH: 34, roof: seed % 2 ? 'thatch' : 'tile', roofCol: roofCol || (seed % 2 ? '#c89048' : '#b8583a'), wall: wall || 'timber', beams: [34], windows: [[10, 9, 12, 10], [48, 9, 12, 10]], door: [28, 12, 20, '#7a4a30'], chimney: seed % 3 ? [50, 14] : null, seed }); return { c: b.c, bx: b.c.width / 2, by: b.oy + 1 }; }
function a3fern(seed, pal = 'leaf') { return a3art('fern' + seed + pal, 40, 26, 20, 24, () => { const R = RNG(seed), p = PAL[pal]; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + R.r(-1.3, 1.3), len = R.r(12, 20); let x = 20, y = 24; for (let k = 0; k < len; k += 2) { const nx = 20 + Math.cos(a) * k, ny = 24 + Math.sin(a) * k + k * k * .02; P(p.ol, nx, ny + 1, 2, 2); P(k < len * .5 ? p.dk : p.base, nx, ny, 2, 1); if (k % 4 === 0) { P(p.lt, nx - 2, ny - 1, 2, 1); P(p.lt, nx + 1, ny - 1, 2, 1); } x = nx; y = ny; } } }); }
function a3mush(seed) { return a3art('mush' + seed, 22, 16, 11, 14, () => { const R = RNG(seed); for (let i = 0; i < 3; i++) { const x = 5 + i * 6 + R.r(-1, 1), h = R.r(4, 8), r = R.r(3, 5), c = R.pick(['#d84a3a', '#c8a060', '#e07a30']); P(OLC, x - 1, 14 - h, 3, h); P('#f0e8d8', x, 14 - h, 1, h); pEll(OLC, x, 14 - h, r + 1, r * .6 + 1); pEll(c, x, 14 - h, r, r * .6); P('#ffffff', x - 1, 13 - h, 1, 1); P('#ffffff', x + 1, 14 - h, 1, 1); } }); }
function a3log() { return a3art('log', 70, 22, 35, 20, () => { P(OLC, 6, 6, 58, 14); P('#6a4630', 7, 7, 56, 12); P('#8a5a3a', 7, 7, 56, 3); for (let x = 10; x < 60; x += 7) P('#4a3022', x, 10, 4, 1); pEll(OLC, 63, 13, 6, 7); pEll('#c09060', 63, 13, 5, 6); pEll('#8a6040', 63, 13, 3, 4); for (let i = 0; i < 6; i++) P('#5a9a3a', 10 + i * 8, 5, 5, 2); }); }
function a3stump() { return a3art('stump', 30, 22, 15, 20, () => { P(OLC, 6, 7, 18, 14); P('#6a4630', 7, 8, 16, 12); P('#8a5a3a', 7, 8, 4, 12); pEll(OLC, 15, 8, 10, 4); pEll('#c09060', 15, 8, 9, 3); pEll('#9a7048', 15, 8, 5, 2); P(OLC, 2, 18, 6, 3); P(OLC, 22, 18, 7, 3); }); }
function a3grave(kind, seed) {
  return a3art('grave' + kind + seed, 30, 40, 15, 37, () => { const R = RNG(seed), st = R.pick(['#9a96a8', '#8a8698', '#a8a4b4']), dk = shade(st, -.3), lt = shade(st, .2);
    ctx.globalAlpha = .3; pEll('#101020', 16, 37, 13, 3); ctx.globalAlpha = 1; pEll('#3a2a24', 15, 36, 11, 3);
    if (kind === 0) { P(OLC, 6, 12, 18, 25); pEll(OLC, 15, 12, 9, 8); P(st, 7, 13, 16, 23); pEll(st, 15, 12, 8, 7); P(lt, 7, 9, 2, 26); P(dk, 21, 12, 2, 24); P(dk, 11, 18, 8, 1); P(dk, 11, 22, 8, 1); P(dk, 12, 26, 6, 1); }
    else if (kind === 1) { P(OLC, 13, 4, 6, 33); P(OLC, 6, 11, 20, 6); P(st, 14, 5, 4, 31); P(st, 7, 12, 18, 4); P(lt, 14, 5, 1, 31); P(lt, 7, 12, 18, 1); }
    else if (kind === 2) { pPoly(OLC, [[9, 37], [12, 6], [15, 1], [18, 6], [21, 37]]); pPoly(st, [[10, 36], [13, 7], [15, 3], [17, 7], [20, 36]]); P(lt, 13, 8, 1, 28); P(OLC, 6, 33, 18, 4); P(st, 7, 34, 16, 2); }
    else { P(OLC, 5, 20, 20, 17); P(st, 6, 21, 18, 15); P(lt, 6, 21, 18, 2); P(dk, 6, 34, 18, 2); P(dk, 14, 24, 3, 8); P(dk, 12, 26, 7, 2); }
    for (let i = 0; i < 4; i++) { ctx.globalAlpha = .7; P('#4a6a3a', R.r(6, 22), R.r(26, 35), R.i(2, 4), 1); } ctx.globalAlpha = 1; });
}
function a3crypt() { const b = tdBuilding('a3crypt', { w: 64, wallH: 40, roofH: 26, roof: 'slate', roofCol: '#4a4a5a', wall: 'stone', wallCol: '#8a8698', door: [22, 20, 30, '#2a2030'], arch: true, top: 30, seed: 41, extra: (cx, x0, yR) => { P(OLC, x0 + 30, yR - 22, 4, 22); P('#a8a4b4', x0 + 31, yR - 21, 2, 20); P(OLC, x0 + 25, yR - 16, 14, 4); P('#a8a4b4', x0 + 26, yR - 15, 12, 2); } }); return { c: b.c, bx: b.c.width / 2, by: b.oy + 1 }; }
function a3ironFence(n) { const W = n * 8 + 4; return a3art('ifence' + n, W, 30, W / 2, 28, () => { for (let x = 2; x < W - 1; x += 8) { P(OLC, x, 6, 2, 22); pPoly(OLC, [[x - 1, 7], [x + 1, 2], [x + 3, 7]]); } P(OLC, 1, 10, W - 2, 2); P(OLC, 1, 22, W - 2, 2); P('#4a4a5a', 1, 10, W - 2, 1); }); }
function a3lantern() { return a3art('lantern', 14, 46, 7, 44, () => { P(OLC, 6, 10, 3, 34); P('#3a3a48', 6, 10, 1, 34); P(OLC, 1, 2, 12, 12); P('#ffd870', 3, 4, 8, 8); P('#fff4c0', 4, 5, 3, 3); P(OLC, 0, 0, 14, 3); P(OLC, 2, 42, 10, 3); }); }
function a3hedge(w, h, seed) {
  return a3art('hedge' + w + '_' + h + seed, w + 4, h + 18, (w + 4) / 2, h + 15, () => { const R = RNG(seed), top = 12, P2 = PAL.leaf;
    P(P2.ol, 1, 2, w + 2, h + top + 2); P(P2.dk, 2, top + 2, w, h); P(P2.base, 2, 3, w, top);
    for (let i = 0; i < w * h / 18; i++) { const x = R.r(3, w), y = R.r(top + 3, top + h); P(R() < .5 ? P2.dk2 : P2.base, x, y, R.i(2, 4), R.i(1, 3)); }
    for (let i = 0; i < w * top / 6; i++) { const x = R.r(3, w), y = R.r(3, top + 2); P(R() < .5 ? P2.lt : P2.lt2, x, y, R.i(1, 3), 1); }
    for (let x = 2; x < w + 2; x += 3) P(P2.ol, x, top + 2 + (x % 2), 3, 1);
    ctx.globalAlpha = .35; P('#0e2018', 2, top + h - 6, w, 6); ctx.globalAlpha = 1; });
}
function a3topiary(seed) { return a3art('topi' + seed, 34, 56, 17, 53, () => { const R = RNG(seed); P(OLC, 10, 40, 14, 14); P('#a8603a', 11, 41, 12, 12); P('#c8804a', 11, 41, 12, 2); P(OLC, 16, 30, 3, 12); tdCanopy(17, 30, 13, PAL.leaf, R, 7); tdCanopy(17, 14, 9, PAL.leaf, R, 5); }); }
function a3statue(seed) { return a3art('statue' + seed, 34, 72, 17, 69, () => { const st = '#b8b0b8', dk = '#8a8290', lt = '#e0d8e0'; P(OLC, 4, 52, 26, 18); P(dk, 5, 53, 24, 16); P(st, 5, 53, 24, 3); P(lt, 5, 53, 24, 1); P(OLC, 10, 22, 14, 32); P(st, 11, 23, 12, 30); P(lt, 11, 23, 3, 30); P(dk, 20, 23, 3, 30); pCirc(OLC, 17, 17, 6); pCirc(st, 17, 17, 5); P(lt, 14, 14, 2, 3); if (seed % 2) { pLine(OLC, 24, 26, 30, 4, 3); pLine(lt, 24, 26, 30, 4, 1); } else { pPoly(OLC, [[6, 28], [2, 14], [10, 24]]); pPoly(OLC, [[28, 28], [32, 14], [24, 24]]); } }); }
function a3fountain() { return a3art('fount', 80, 60, 40, 57, () => { pEll(OLC, 40, 46, 38, 12); pEll('#a8a0a8', 40, 45, 37, 11); pEll('#c8c0c8', 40, 43, 37, 10); pEll(OLC, 40, 43, 33, 8); pEll('#3a8ac0', 40, 43, 32, 7); pEll('#6ac0e0', 34, 41, 14, 3); P(OLC, 36, 16, 8, 28); P('#c8c0c8', 37, 17, 6, 26); pEll(OLC, 40, 16, 14, 4); pEll('#c8c0c8', 40, 15, 13, 3); P(OLC, 37, 6, 6, 10); P('#c8c0c8', 38, 7, 4, 8); }); }
function a3torch() { return a3art('torch', 12, 50, 6, 48, () => { P(OLC, 5, 10, 3, 38); P('#7a4a2e', 5, 10, 1, 38); P(OLC, 2, 6, 8, 6); P('#5a5a66', 3, 7, 6, 4); P(OLC, 3, 46, 7, 3); }); }
function a3rune() { return a3art('rune', 20, 34, 10, 32, () => { pPoly(OLC, [[3, 32], [5, 4], [10, 1], [15, 4], [17, 32]]); pPoly('#6a7068', [[4, 31], [6, 5], [10, 2], [14, 5], [16, 31]]); P('#8a9088', 6, 6, 2, 24); P('#70e0f0', 9, 10, 2, 8); P('#70e0f0', 7, 13, 6, 2); P('#70e0f0', 9, 22, 2, 4); }); }
function a3pillar(h) { return a3art('pillar' + h, 44, h + 4, 22, h + 1, () => { const R = RNG(h); P(OLC, 2, h - 14, 40, 15); stoneTexture('#5a4058', 3, h - 13, 38, 13, R, 8, 5); P('#7a5a76', 3, h - 13, 38, 2); P(OLC, 6, 14, 32, h - 26); stoneTexture('#4a3448', 7, 15, 30, h - 28, R, 10, 8); for (let x = 10; x < 36; x += 6) P('#3a2638', x, 15, 1, h - 28); P('#6a4a66', 7, 15, 3, h - 28); ctx.globalAlpha = .35; P('#0a0410', 28, 15, 9, h - 28); ctx.globalAlpha = 1; P(OLC, 0, 2, 44, 14); stoneTexture('#5a4058', 1, 3, 42, 12, R, 8, 5); P('#7a5a76', 1, 3, 42, 2); P('#a040d0', 19, h * .45, 6, 12); P('#e0a0ff', 21, h * .45 + 2, 2, 8); }); }
function a3brazier() { return a3art('braz', 26, 40, 13, 38, () => { P(OLC, 2, 4, 22, 9); P('#3a2a3a', 3, 5, 20, 7); P('#5a4058', 3, 5, 20, 2); P(OLC, 8, 12, 10, 22); P('#2a1a2a', 9, 12, 8, 21); P('#4a3448', 9, 12, 2, 21); P(OLC, 4, 33, 18, 5); P('#3a2a3a', 5, 34, 16, 3); }); }
function a3throne() { return a3art('throne', 90, 110, 45, 107, () => { for (let k = 0; k < 4; k++) { P(OLC, 4 + k * 6, 84 + k * 6, 82 - k * 12, 7); P(k % 2 ? '#4a3448' : '#5a4058', 5 + k * 6, 85 + k * 6, 80 - k * 12, 5); P('#6a1428', 30, 85 + k * 6, 30, 5); } P(OLC, 26, 4, 38, 82); P('#2a1a2e', 27, 5, 36, 80); P('#8a2034', 31, 14, 28, 50); P('#a83048', 31, 14, 4, 50); pPoly(OLC, [[26, 6], [32, -2], [38, 6]]); pPoly(OLC, [[52, 6], [58, -2], [64, 6]]); P('#c89a30', 27, 5, 36, 2); P(OLC, 18, 54, 12, 30); P(OLC, 60, 54, 12, 30); P('#3a2a3e', 19, 55, 10, 28); P('#3a2a3e', 61, 55, 10, 28); pCirc('#e0a040', 45, 10, 4); pCirc('#ff6080', 45, 10, 2); }); }
function a3gargoyle() { return a3art('garg', 40, 60, 20, 57, () => { P(OLC, 6, 40, 28, 18); P('#4a3a4e', 7, 41, 26, 16); P('#6a5a6e', 7, 41, 26, 2); pEll(OLC, 20, 30, 10, 12); pEll('#5a4a5e', 20, 30, 9, 11); pPoly(OLC, [[11, 26], [0, 12], [8, 30]]); pPoly(OLC, [[29, 26], [40, 12], [32, 30]]); pCirc(OLC, 20, 16, 6); pCirc('#5a4a5e', 20, 16, 5); pPoly(OLC, [[15, 12], [14, 6], [18, 11]]); pPoly(OLC, [[25, 12], [26, 6], [22, 11]]); P('#c040e0', 17, 15, 2, 1); P('#c040e0', 22, 15, 2, 1); }); }
function a3stakes(n) { const W = n * 8 + 6; return a3art('stakes' + n, W, 48, W / 2, 46, () => { for (let i = 0; i < n; i++) { const x = 2 + i * 8, h = 38 + (i % 3) * 3; P(OLC, x, 46 - h, 9, h); P('#8a5a3a', x + 1, 47 - h, 7, h - 1); P('#a8704a', x + 1, 47 - h, 2, h - 1); pPoly(OLC, [[x, 47 - h], [x + 4.5, 40 - h], [x + 9, 47 - h]]); pPoly('#a8704a', [[x + 1, 47 - h], [x + 4.5, 42 - h], [x + 8, 47 - h]]); } P(OLC, 0, 20, W, 3); P('#6a4030', 0, 21, W, 1); }); }
function a3fog() { return a3art('fogpuff2', 240, 44, 120, 30, () => { for (let i = 0; i < 6; i++) { ctx.globalAlpha = .07; pEll('#e0e8ff', 120 + (i - 2.5) * 14, 22, 54 - i * 4, 14 - i); } ctx.globalAlpha = 1; }); }
function a3ray() { return a3art('ray', 70, 300, 35, 296, () => { for (let y = 0; y < 300; y++) { const k = y / 300, w = 14 + k * 30, x = 30 + (1 - k) * 26 - w / 2; ctx.globalAlpha = .16 * Math.sin(k * Math.PI) + .02; P('#f8ffc0', x, y, w, 1); } ctx.globalAlpha = 1; }); }
/* ---------------- arena composition ---------------- */
const A3DEF = {};
function a3def(area, raid) {
  const key = raid ? 'r' : area; if (A3DEF[key]) return A3DEF[key];
  const R = RNG(1200 + area * 31 + (raid ? 5 : 0)), L = [], put = (a, x, yb, o) => a3put(L, a, x, yb, o);
  const fightClear = (x, y) => Math.abs(y - CGY) < 70 && x > 60 && x < 600;
  const rows = (n, y0, y1, fn) => { for (let i = 0; i < n; i++) { const yb = R.r(y0, y1), x = R.r(-700, 1340); if (fightClear(x, yb)) continue; fn(x, yb, i); } };
  let kind = 'day', anim = [], lights = [];
  if (raid) {
    kind = 'raid';
    for (let i = 0; i < 6; i++) put(a3cottage(60 + i, i % 2 ? '#6a4a6a' : '#5a3a4a', i % 2 ? 'wood' : 'timber'), -360 + i * 230 + R.r(-30, 30), CGY - 170 - R.r(0, 80));
    for (let x = -700; x < 1400; x += 62) put(a3stakes(8), x, CGY - 330);
    rows(26, CGY - 1000, CGY - 340, (x, y, i) => put(a3tree(R.i(18, 30), 'leafDark', i + 300, R() < .4 ? 'pine' : 'round'), x, y, { scale: 1.2 }));
    rows(18, CGY - 160, CGY - 80, (x, y, i) => put(i % 3 ? a3fence(R.i(3, 6), '#7a5a4a') : (i % 2 ? a3hay() : a3cart()), x, y));
    for (const x of [-60, 120, 520, 700]) { put(a3torch(), x, CGY - 60); anim.push({ type: 'flame', x, y: CGY - 60 - 46, yb: CGY - 59, s: 1.1 }); lights.push([x, CGY - 106, 120, '#ff9040', .9, .3]); }
  } else if (area === 0) {
    kind = 'day';
    rows(16, CGY - 300, CGY - 96, (x, y, i) => put(i % 4 ? a3hay() : a3scarecrow(), x, y));
    for (let x = -420; x < 1060; x += 60) put(a3fence(5), x, CGY - 76);
    put(a3cottage(3), -140, CGY - 420); put(a3cottage(4, '#b8583a'), 60, CGY - 560); put(a3cottage(7), 980, CGY - 470); put(a3cart(), 760, CGY - 330);
    put(a3windmill(), 820, CGY - 700, { scale: 2.2 }); anim.push({ type: 'blades', x: 820, y: CGY - 700 - 77 * 2.2, yb: CGY - 699, s: 2.2 });
    rows(40, CGY - 1100, CGY - 320, (x, y, i) => put(a3tree(R.i(16, 28), R() < .25 ? 'leafAut' : R() < .2 ? 'leafGold' : 'leaf', i + 40, 'round'), x, y, { scale: 1 + (CGY - y) / 900, sway: 1 }));
    rows(30, CGY - 420, CGY - 90, (x, y, i) => { const b = R(); put(b < .5 ? { c: a3c('bush' + i, 40, 30, () => tdBush(20, 27, R.r(8, 12), PAL.leaf, i)), bx: 20, by: 27 } : { c: a3c('rock' + i, 30, 24, () => tdRock(15, 21, R.r(5, 8), PAL.stone, i)), bx: 15, by: 21 }, x, y); });
    for (let i = 0; i < 9; i++) { const x = i < 5 ? R.r(-260, 80) : R.r(580, 900), y = R.r(CGY + 70, CGY + 220); put(i % 3 ? a3fern(i, 'leaf') : { c: a3c('fgbush' + i, 50, 40, () => tdBush(25, 36, R.r(12, 16), PAL.leaf, i + 9)), bx: 25, by: 36 }, x, y, { scale: 1.6 }); }
    lights.push([320, CGY - 200, 900, '#fff4d8', .25]);
  } else if (area === 1) {
    kind = 'forest';
    rows(60, CGY - 1100, CGY - 90, (x, y, i) => { const far = (CGY - y) / 1000; put(a3tall(R.i(26, 40), R.i(80, 150), R() < .15 ? 'leafGold' : 'leafDark', i + 70), x, y, { scale: 1 + far * .8, sway: .6 }); });
    rows(50, CGY - 600, CGY - 60, (x, y, i) => { const q = R(); put(q < .45 ? a3fern(i, R() < .5 ? 'leaf' : 'leafDark') : q < .65 ? a3mush(i) : q < .8 ? a3stump() : q < .9 ? a3log() : { c: a3c('frock' + i, 30, 24, () => tdRock(15, 21, R.r(6, 9), PAL.stone, i)), bx: 15, by: 21 }, x, y); });
    for (let i = 0; i < 10; i++) { const x = i < 5 ? R.r(-300, 70) : R.r(580, 940), y = R.r(CGY + 70, CGY + 230); put(i % 4 === 0 ? a3tall(36, 160, 'leafDark', 900 + i) : a3fern(i + 50, 'leafDark'), x, y, { scale: i % 4 === 0 ? 1 : 1.8 }); }
    for (let i = 0; i < 6; i++) anim.push({ type: 'ray', x: -100 + i * 160 + R.r(-30, 30), yb: CGY - 140 - R.r(0, 200), ph: i * 1.7 });
    lights.push([320, CGY - 60, 260, '#e8f0b0', .35]);
  } else if (area === 2) {
    kind = 'night';
    rows(70, CGY - 900, CGY - 80, (x, y, i) => put(a3grave(R.i(0, 3), i), x, y, { scale: 1.3 }));
    put(a3crypt(), -170, CGY - 280, { scale: 1.3 }); put(a3crypt(), 860, CGY - 420, { scale: 1.3 });
    for (let x = -700; x < 1400; x += 92) put(a3ironFence(11), x, CGY - 980, { scale: 1.2 });
    for (let x = -420; x < 1060; x += 92) if (x < 40 || x > 560) put(a3ironFence(11), x, CGY - 70);
    rows(16, CGY - 1000, CGY - 120, (x, y, i) => put(a3tree(R.i(20, 30), 'leaf', i + 500, 'dead'), x, y, { scale: 1.3 }));
    for (const [x, y] of [[-40, CGY - 110], [690, CGY - 130], [300, CGY - 400]]) { put(a3lantern(), x, y); lights.push([x, y - 38, 110, '#ffc870', .9, .2]); }
    for (let i = 0; i < 14; i++) anim.push({ type: 'fog', x: R.r(-500, 1100), yb: R.r(CGY - 700, CGY + 120), sp: R.r(4, 12), ph: R.r(0, 1000) });
    for (let i = 0; i < 8; i++) { const x = i < 4 ? R.r(-260, 60) : R.r(600, 900), y = R.r(CGY + 70, CGY + 220); put(i % 2 ? a3grave(R.i(0, 3), i + 200) : a3tree(24, 'leaf', i + 600, 'dead'), x, y, { scale: 1.8 }); }
    lights.push([320, CGY - 120, 380, '#b8c4ff', .5]);
  } else if (area === 3) {
    kind = 'dusk';
    const hedgeRows = [[CGY - 160, 1], [CGY - 330, 2], [CGY - 520, 3], [CGY - 760, 4], [CGY - 1000, 5]];
    for (const [y, k] of hedgeRows) { for (let x = -800; x < 1500;) { const w = R.i(120, 260); if (R() < .82) put(a3hedge(w, 50 + k * 4, k * 100 + x), x + w / 2, y, { shift: k % 2 ? 1 : -1, scale: 1 + k * .12 }); x += w + R.i(30, 80) * (1 + k * .2); } }
    put(a3fountain(), 320, CGY - 230, { scale: 1.4 }); anim.push({ type: 'water', x: 320, y: CGY - 230 - 50 * 1.4, yb: CGY - 229 });
    for (const x of [40, 600]) { put(a3statue(x), x, CGY - 100); }
    rows(14, CGY - 900, CGY - 180, (x, y, i) => put(a3topiary(i), x, y, { scale: 1.2 }));
    for (const x of [-80, 140, 500, 720]) { put(a3torch(), x, CGY - 70); anim.push({ type: 'flame', x, y: CGY - 70 - 46, yb: CGY - 69, s: 1 }); lights.push([x, CGY - 116, 120, '#ffa050', .85, .25]); }
    for (let i = 0; i < 6; i++) { const x = R.r(-300, 1000), y = R.r(CGY - 600, CGY - 120); put(a3rune(), x, y); anim.push({ type: 'rune', x, y: y - 22, yb: y + 1, ph: i }); }
    for (let i = 0; i < 6; i++) { const x = i < 3 ? R.r(-240, 60) : R.r(600, 880), y = R.r(CGY + 80, CGY + 220); put(a3topiary(i + 30), x, y, { scale: 1.7 }); }
    lights.push([320, CGY - 200, 900, '#ffd8b0', .2]);
  } else {
    kind = 'hall';
    for (let k = 0; k < 7; k++) { const y = CGY - 70 - k * 150; for (const x of [-60 - k * 20, 700 + k * 20]) { put(a3pillar(220), x, y, { scale: 1.2 }); } }
    for (let k = 0; k < 3; k++) for (const x of [-360, 1000]) put(a3pillar(220), x, CGY - 200 - k * 300, { scale: 1.3 });
    put(a3throne(), 320, CGY - 820, { scale: 2 });
    for (const x of [140, 500]) { put(a3gargoyle(), x, CGY - 330, { scale: 1.2 }); }
    const BZ = [[120, CGY - 40], [520, CGY - 40], [200, CGY - 600], [440, CGY - 600], [-200, CGY - 360], [840, CGY - 360]];
    for (const [x, y] of BZ) { put(a3brazier(), x, y, { scale: 1.2 }); anim.push({ type: 'pflame', x, y: y - 40 * 1.2, yb: y + 1, s: 1.5 }); lights.push([x, y - 50, 170, '#b060ff', 1, .25]); }
    for (let i = 0; i < 4; i++) { const x = i < 2 ? R.r(-260, 40) : R.r(600, 900); put(a3pillar(220), x, CGY + 150 + R.r(0, 60), { scale: 1.3 }); }
    lights.push([320, CGY - 900, 600, '#c040a0', .5]);
  }
  L.sort((a, b) => a.yb - b.yb);
  return (A3DEF[key] = { L, kind, anim, lights, pal: A3PAL[kind] });
}
// emit everything behind the fight line (call before the action plane) or in front of it
function drawArena3D(area, raid, t, opts, front) {
  const d = a3def(area, raid), tint = opts.dark ? [1 - opts.dark * .85, 1 - opts.dark * .85, 1 - opts.dark * .8] : null;
  HD.tint = tint;
  if (!front) {
    const F = A3.far, N = A3.near;
    HD.ground(a3floor(area, raid, 'far'), F.x, F.y, { w: F.w, h: F.h });
    HD.ground(a3floor(area, raid, 'near'), N.x, N.y);
    const sky = a3sky(d.kind), sw = A3.skyW * A3.skyS, sh = A3.skyH * A3.skyS, amb = World.ambient(), dayK = area === 0 && !raid ? 1 : 0;
    const sc = dayK ? mixA(amb, [255, 255, 255], .45).map(v => v / 255) : (tint || [1, 1, 1]);
    HD.art(sky, 320 - sw / 2, F.y - sh + 4, F.y, { scale: A3.skyS, lean: 0, unlit: true, col: [sc[0], sc[1], sc[2], 1] });
  }
  const sh = opts.wallShift || 0, bolt = opts.bolt > .5;
  let ai = 0; const animUpTo = (yb) => { while (ai < d.anim.length && d.anim[ai].yb <= yb) a3anim(d.anim[ai++], t); };
  d.anim.sort((a, b) => a.yb - b.yb);
  for (const p of d.L) {
    if (!front && p.yb > CGY) break; if (front && p.yb <= CGY) continue;
    if (!front) animUpTo(p.yb);
    const s = p.scale || 1, sway = p.sway ? World.windSway(p.x, .4) * 1.2 * p.sway : 0, dx = p.shift ? p.shift * sh * 40 : 0;
    HD.art(p.a.c, p.x - p.a.bx * s + dx, p.yb - p.a.by * s, p.yb, { scale: s, sway });
  }
  if (!front) animUpTo(CGY); else { ai = d.anim.findIndex(a => a.yb > CGY); if (ai >= 0) while (ai < d.anim.length) a3anim(d.anim[ai++], t); }
  if (bolt && !front) HD.tint = [1.4, 1.3, 1.6];
  HD.tint = null;
}
function a3anim(a, t) {
  if (a.type === 'flame' || a.type === 'pflame') { const cols = a.type === 'pflame' ? ['#6a20c0', '#b060ff', '#f0d0ff'] : ['#ff6020', '#ffb040', '#fff0a0']; HD.capture(a.yb, () => flame(a.x, a.y, t + a.x * .01, a.s, cols), null, null, [a.x - 20, a.y - 40, 40, 50], { unlit: true }); if (chance(DT * 4)) Particles.spawn({ x: a.x + rnd(-3, 3), y: a.y - 8, vx: rnd(-6, 6), vy: -rnd(20, 40), life: 1.2, c: a.type === 'pflame' ? '#c070ff' : '#ffb040', size: 1, glow: 1 }); }
  else if (a.type === 'blades') { HD.capture(a.yb, () => { const x = a.x, y = a.y, s = a.s; for (let k = 0; k < 4; k++) { const an = t * 1.1 + k * Math.PI / 2, ex = x + Math.cos(an) * 40 * s, ey = y + Math.sin(an) * 40 * s; pLine(OLC, x, y, ex, ey, 4); pLine('#7a5a3a', x, y, ex, ey, 2); const px = -Math.sin(an), py = Math.cos(an); for (let j = 10; j < 40; j += 3) { const bx = x + Math.cos(an) * j * s, by = y + Math.sin(an) * j * s; pLine('#f0e8d8', bx, by, bx + px * 9 * s, by + py * 9 * s, 2); } } pCirc(OLC, x, y, 5); pCirc('#8a5a3a', x, y, 4); }, null, null, [a.x - 52 * a.s, a.y - 52 * a.s, 104 * a.s, 104 * a.s]); }
  else if (a.type === 'ray') { const al = .55 + .35 * Math.sin(t * .6 + a.ph); HD.art(a3ray().c, a.x - 35 * 2, a.yb - 296 * 2, a.yb, { scale: 2, alpha: al, unlit: true, lean: .6 }); }
  else if (a.type === 'fog') { const x = ((a.x + t * a.sp + a.ph) % 1800) - 600, f = a3fog(); HD.art(f.c, x - 120 * 2.4, a.yb - 30 * 2.4, a.yb, { scale: 2.4, alpha: .9, unlit: true }); }
  else if (a.type === 'water') { HD.capture(a.yb, () => { for (let i = 0; i < 14; i++) { const k = ((t * .9 + i / 14) % 1), dir = i % 2 ? 1 : -1, x = a.x + dir * k * 26, y = a.y + 6 - Math.sin(k * Math.PI) * 18 + k * 30; P(i % 3 ? '#a8e0f8' : '#ffffff', x, y, 2, 2); } P('#c8f0ff', a.x - 1, a.y - 4, 2, 10); }, null, null, [a.x - 40, a.y - 10, 80, 60], { unlit: true }); }
  else if (a.type === 'rune') { const pu = .5 + .5 * Math.sin(t * 2 + a.ph); HD.capture(a.yb, () => { ctx.globalAlpha = .3 + pu * .7; P('#a0f8ff', a.x - 1, a.y - 10, 2, 8); P('#a0f8ff', a.x - 3, a.y - 7, 6, 2); P('#a0f8ff', a.x - 1, a.y + 2, 2, 4); ctx.globalAlpha = .2 * pu; pCirc('#70e0f0', a.x, a.y - 4, 8); ctx.globalAlpha = 1; }, null, null, [a.x - 10, a.y - 14, 20, 24], { unlit: true }); }
}
function combatLights3D(area, raid, t, opts) {
  const d = a3def(area, raid), dayAmb = World.ambient();
  const amb = raid ? [150, 140, 185] : area === 0 ? mixA(dayAmb, [255, 250, 240], .35) : area === 1 ? [150, 175, 150] : area === 2 ? [135, 140, 190] : area === 3 ? [215, 196, 190] : [175, 125, 160];
  Light.begin(opts.bolt > .5 ? [255, 240, 255] : amb);
  for (const l of d.lights) Light.add(l[0], l[1], l[2], l[3], l[4], l[5] || 0);
}
