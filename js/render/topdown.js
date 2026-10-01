'use strict';
/* =========================================================
   TOP-DOWN (3/4 view) ART KIT
   Lush, saturated, hue-shifted pixel art: ground textures, paths, water,
   trees, bushes, rocks, props and 3/4 buildings. Everything draws on the
   active ctx; heavy pieces are cached via Cache.
   ========================================================= */
const OLC = '#2a1a26'; // warm dark outline used across the kit
const PAL = {
  grass: { base: '#5c9c3a', lt: '#78b442', lt2: '#a2d052', dk: '#478638', dk2: '#33683e', sh: '#2a5448' },
  grassAut: { base: '#a8a03a', lt: '#c8b848', lt2: '#e8d468', dk: '#8a7a30', dk2: '#6a5a2e', sh: '#4a3e3a' },
  grassDark: { base: '#3e6a3a', lt: '#4e8240', lt2: '#6a9a48', dk: '#2e5634', dk2: '#22443a', sh: '#1a2e36' },
  grassNight: { base: '#4a5a48', lt: '#5a6e52', lt2: '#6e8060', dk: '#3a4a40', dk2: '#2c3a3a', sh: '#1e2632' },
  dirt: { base: '#c88a52', lt: '#e0a868', lt2: '#f0c888', dk: '#a46a40', dk2: '#7a4a34', edge: '#6a4234' },
  mud: { base: '#8a5e3a', lt: '#a8784a', lt2: '#c09060', dk: '#6a4630', dk2: '#4e3228', edge: '#3a2422' },
  sand: { base: '#e8c08a', lt: '#f4d8a8', lt2: '#fff0cc', dk: '#c89a6a', dk2: '#a87a58', edge: '#8a5e4a' },
  stone: { base: '#c4b4a0', lt: '#dccfb8', lt2: '#f0e8d4', dk: '#9a8a80', dk2: '#7a6a6a', edge: '#4a3a44' },
  water: { base: '#38a8c4', lt: '#68d0dc', lt2: '#b8f4f0', dk: '#2a7ea8', dk2: '#1e5a88', edge: '#2a4a5a' },
  leaf: { base: '#5aa03a', lt: '#88c848', lt2: '#c0e868', dk: '#3a7a3a', dk2: '#255a40', ol: '#1a3030' },
  leafAut: { base: '#d0702a', lt: '#f09a3a', lt2: '#ffc860', dk: '#a04a28', dk2: '#6a2e2a', ol: '#3a1a1e' },
  leafGold: { base: '#c8a030', lt: '#e8c848', lt2: '#fff070', dk: '#9a7428', dk2: '#6a4e26', ol: '#3a2a1e' },
  leafDark: { base: '#2e5a3a', lt: '#3e7442', lt2: '#5a9050', dk: '#22442e', dk2: '#16302a', ol: '#0e1a1e' }
};
/* ---------- ground ---------- */
function vnoise2(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const h = (a, b) => { let n = Math.imul(a, 374761393) ^ Math.imul(b, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n & 0xffff) / 32768 - 1; }; return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v); }
function tdGroundFill(pal, x, y, w, h, R, dens = 1, seed = 0) {
  P(pal.base, x, y, w, h);
  // large painterly tonal regions with dithered borders (low-frequency noise)
  for (let yy = 0; yy < h; yy += 2) for (let xx = 0; xx < w; xx += 2) {
    const X = x + xx, Y = y + yy, n = vnoise2(X * .012 + seed, Y * .016) * .7 + vnoise2(X * .05, Y * .06 + seed) * .3, d = ((xx + yy) >> 1) & 1;
    if (n > .16 || (n > .08 && d)) P(pal.lt, X, Y, 2, 2); else if (n < -.18 || (n < -.10 && d)) P(pal.dk, X, Y, 2, 2);
    if (n > .44 || (n > .36 && d)) P(pal.lt2, X, Y, 2, 2); else if (n < -.48 || (n < -.40 && d)) P(pal.dk2, X, Y, 2, 2);
  }
  // clustered blade tufts (denser in the light regions), a few dark specks
  for (let i = 0; i < w * h / 170 * dens; i++) { const bx = Math.round(x + R() * w), by = Math.round(y + R() * h), n = vnoise2(bx * .012 + seed, by * .016); const c = n > .2 ? pal.lt2 : n < -.2 ? pal.dk2 : (R() < .5 ? pal.dk : pal.lt); P(c, bx, by, 1, 2); P(c, bx + 2, by, 1, 2); P(c, bx + 1, by + 1, 1, 2); }
  for (let i = 0; i < w * h / 260 * dens; i++) P(pal.dk2, x + R() * w, y + R() * h, 1, 1);
}
function tdTuft(x, y, pal, R, big) { const h = big ? 6 : 4; P(pal.dk2, x - 2, y - h + 2, 1, h - 1); P(pal.dk2, x + 2, y - h + 2, 1, h - 1); P(pal.dk, x - 1, y - h, 1, h); P(pal.lt, x, y - h - 1, 1, h + 1); P(pal.lt2, x + 1, y - h, 1, h - 1); P(pal.sh, x - 2, y, 6, 1); }
function tdFlowers(x, y, R, cols, n = 5) { for (let i = 0; i < n; i++) { const fx = Math.round(x + R.r(-8, 8)), fy = Math.round(y + R.r(-5, 5)), c = R.pick(cols); P('#3a6a2a', fx, fy + 1, 1, 2); P(c, fx - 1, fy, 3, 1); P(c, fx, fy - 1, 1, 3); P('#fff8d0', fx, fy, 1, 1); } }
// brush along a polyline (paths, roads, river banks)
function tdStroke(pts, r, col, step = 2) { for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / step)); for (let k = 0; k <= n; k++) { const t = k / n; pEll(col, lerp(x0, x1, t), lerp(y0, y1, t), r, r * .82); } } }
function tdPath(pts, w, pal, R) {
  tdStroke(pts, w / 2 + 2, pal.edge); tdStroke(pts, w / 2 + 1, pal.dk); tdStroke(pts, w / 2, pal.base);
  // inner highlight band + pebbles + ruts
  for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 3); const nx = -(y1 - y0) / (d || 1), ny = (x1 - x0) / (d || 1);
    for (let k = 0; k < n; k++) { const t = k / n, cx = lerp(x0, x1, t), cy = lerp(y0, y1, t);
      if (R() < .55) { const o = R.r(-w * .4, w * .4); P(R() < .5 ? pal.lt : pal.dk, cx + nx * o, cy + ny * o, R.i(1, 3), 1); }
      if (R() < .12) { const o = R.r(-w * .35, w * .35), px = cx + nx * o, py = cy + ny * o; P(pal.dk2, px, py + 1, 3, 1); P(pal.lt2, px, py, 2, 1); }
      if (R() < .05) { const o = R.r(-w * .3, w * .3); pEll(pal.lt, cx + nx * o, cy + ny * o, R.r(3, 6), 2); }
    } }
}
function tdCobbles(cx, cy, rx, ry, pal, R) {
  pEll(pal.edge, cx, cy + 2, rx + 3, ry + 3); pEll(pal.dk2, cx, cy, rx + 2, ry + 2);
  for (let y = -ry; y < ry; y += 5) { const row = Math.round(y / 5); for (let x = -rx + (row % 2 ? 3 : 0); x < rx; x += R.i(6, 8)) { const k = (x * x) / (rx * rx) + ((y + 2) * (y + 2)) / (ry * ry); if (k > .95) continue; const w = R.i(4, 6), c = R.pick([pal.base, pal.base, pal.lt, pal.dk]); P(pal.dk2, cx + x - 1, cy + y + 3, w + 1, 1); P(c, cx + x, cy + y, w, 3); P(pal.lt2, cx + x, cy + y, w - 1, 1); } }
}
/* ---------- water ---------- */
function tdWaterBase(x, y, w, h, pal) { for (let yy = 0; yy < h; yy += 2) P(mix(pal.base, pal.dk, (yy % 16) / 16 * .25), x, y + yy, w, 2); }
function tdShimmer(x0, x1, y, t, pal, seed) { const R = RNG(seed); const n = Math.max(1, (x1 - x0) / 14); for (let i = 0; i < n; i++) { const xx = x0 + ((R() * (x1 - x0) + t * R.r(4, 10)) % (x1 - x0)), ph = Math.sin(t * 2 + i * 1.7); if (ph > -.2) P(ph > .6 ? pal.lt2 : pal.lt, xx, y + R.i(0, 6), R.i(2, 5), 1); } }
/* ---------- trees / foliage ---------- */
function tdCanopy(cx, cy, r, pal, R, n = 9) {
  const blobs = []; for (let i = 0; i < n; i++) { const a = R() * TAU, d = R() * r * .55; blobs.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8, r * R.r(.42, .6)]); }
  blobs.push([cx, cy, r * .62]); blobs.sort((a, b) => a[1] - b[1]);
  for (const [x, y, rr] of blobs) pEll(pal.ol, x, y + 1, rr + 1.5, rr * .88 + 1.5);
  for (const [x, y, rr] of blobs) pEll(pal.dk2, x, y + 1, rr, rr * .88);
  for (const [x, y, rr] of blobs) { pEll(pal.dk, x, y - .5, rr * .94, rr * .8); pEll(pal.base, x - rr * .08, y - rr * .12, rr * .8, rr * .64); pEll(pal.lt, x - rr * .2, y - rr * .3, rr * .52, rr * .38); pEll(pal.lt2, x - rr * .3, y - rr * .42, rr * .2, rr * .14); }
  // leaf flecks + dark gaps
  for (let i = 0; i < r * 2; i++) { const a = R() * TAU, d = R() * r * .8, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .8; P(R() < .6 ? pal.lt : pal.dk2, x, y, R.i(1, 2), 1); }
}
function tdTreeArt(r, pal, seed, kind = 'round') {
  const th = Math.round(r * .55), W = Math.ceil(r * 2.6 + 10), H = Math.ceil(r * 2 + th + 14);
  return Cache.get('tdtree_' + kind + r + '_' + seed + '_' + pal.base, W, H, () => {
    const R = RNG(seed * 7 + 3), cx = W / 2, by = H - 3;
    // trunk + roots
    P(OLC, cx - 4, by - th - 2, 9, th + 3); P('#7a4e34', cx - 3, by - th - 2, 7, th + 2); P('#9a6a44', cx - 3, by - th - 2, 2, th + 1); P('#5a3428', cx + 2, by - th - 2, 1, th + 2);
    P(OLC, cx - 7, by - 2, 4, 3); P('#7a4e34', cx - 6, by - 2, 3, 2); P(OLC, cx + 4, by - 2, 4, 3); P('#5a3428', cx + 4, by - 2, 3, 2);
    if (kind === 'pine') { for (let k = 0; k < 4; k++) { const yy = by - th - k * r * .45, ww = r * (1.05 - k * .22); pPoly(pal.ol, [[cx - ww - 1, yy + 1], [cx, yy - r * .75 - 1], [cx + ww + 1, yy + 1]]); pPoly(pal.dk, [[cx - ww, yy], [cx, yy - r * .75], [cx + ww, yy]]); pPoly(pal.base, [[cx - ww * .8, yy - 2], [cx - ww * .05, yy - r * .7], [cx + ww * .3, yy - 2]]); pPoly(pal.lt, [[cx - ww * .6, yy - 3], [cx - ww * .1, yy - r * .6], [cx - ww * .05, yy - 3]]); } return; }
    if (kind === 'dead') { pLine(OLC, cx, by - th, cx, by - th - r, 4); pLine('#6a5048', cx, by - th, cx, by - th - r, 2); for (let k = 0; k < 6; k++) { const yy = by - th - R() * r * .9, dir = R() < .5 ? -1 : 1, len = R.r(6, r * .8); pLine(OLC, cx, yy, cx + dir * len, yy - R.r(4, 12), 3); pLine('#6a5048', cx, yy, cx + dir * len, yy - R.r(4, 12), 1); } return; }
    tdCanopy(cx, by - th - r * .8, r, pal, R, kind === 'big' ? 13 : 9);
  });
}
function tdTreeShadow(x, y, r) { ctx.globalAlpha = .32; pEll('#1e2a40', x + r * .35, y + 1, r * 1.05, r * .38); ctx.globalAlpha = 1; }
function tdBush(x, y, r, pal, seed) { const R = RNG(seed); ctx.globalAlpha = .3; pEll('#1e2a40', x + 2, y + 1, r + 2, r * .4); ctx.globalAlpha = 1; tdCanopy(x, y - r * .6, r, pal, R, 5); if (R() < .5) for (let i = 0; i < 3; i++) { const fx = x + R.r(-r * .6, r * .6), fy = y - r * .6 + R.r(-r * .5, r * .3); P('#ffffff', fx, fy, 2, 2); P('#f0d060', fx, fy, 1, 1); } }
function tdRock(x, y, r, pal, seed) { const R = RNG(seed); ctx.globalAlpha = .3; pEll('#1e2a40', x + 2, y + 1, r + 2, r * .45); ctx.globalAlpha = 1; pEll(pal.edge, x, y - r * .45, r + 1, r * .7 + 1); pEll(pal.dk, x, y - r * .45, r, r * .7); pEll(pal.base, x - r * .1, y - r * .58, r * .82, r * .52); pEll(pal.lt, x - r * .3, y - r * .72, r * .45, r * .26); P(pal.lt2, x - r * .4, y - r * .85, 2, 1); if (R() < .6) { P('#5a9a3a', x + R.r(-r * .5, r * .3), y - r * .9, 3, 1); P('#88c848', x + R.r(-r * .5, r * .3), y - r, 2, 1); } }
function tdShadowRect(x, y, w, h, a = .3) { ctx.globalAlpha = a; P('#1e2040', x, y, w, h); ctx.globalAlpha = 1; }
/* ---------- props ---------- */
function tdCrate(x, y, w = 12, h = 10) { tdShadowRect(x - w / 2 + 2, y - 1, w, 3); P(OLC, x - w / 2 - 1, y - h - 5, w + 2, h + 6); P('#c08a4a', x - w / 2, y - h - 4, w, 4); P('#a8703a', x - w / 2, y - h, w, h); P('#e0aa62', x - w / 2, y - h - 4, w, 1); P('#7a4a2e', x - w / 2, y - h, w, 1); P('#7a4a2e', x - w / 2 + 1, y - h + 1, 1, h - 1); P('#7a4a2e', x + w / 2 - 2, y - h + 1, 1, h - 1); pLine('#7a4a2e', x - w / 2 + 1, y - 1, x + w / 2 - 2, y - h + 1, 1); }
function tdBarrel(x, y) { tdShadowRect(x - 4, y - 1, 11, 3); pEll(OLC, x, y - 8, 6, 9); pEll('#a8683a', x, y - 8, 5, 8); P('#c88a4a', x - 3, y - 15, 2, 13); P('#7a4a2e', x + 3, y - 14, 1, 12); P('#5a5a66', x - 5, y - 12, 10, 1); P('#5a5a66', x - 5, y - 4, 10, 1); pEll(OLC, x, y - 16, 5, 2); pEll('#c88a4a', x, y - 16, 4, 1.5); }
function tdFenceH(x0, x1, y, col = '#a8703a') { for (let x = x0; x <= x1; x += 12) { P(OLC, x - 1, y - 13, 4, 14); P(col, x, y - 12, 2, 12); P(shade(col, .25), x, y - 12, 1, 11); } P(OLC, x0, y - 11, x1 - x0 + 2, 3); P(shade(col, .2), x0, y - 10, x1 - x0 + 2, 1); P(OLC, x0, y - 6, x1 - x0 + 2, 3); P(shade(col, .2), x0, y - 5, x1 - x0 + 2, 1); }
function tdFencePost(x, y, col = '#a8703a') { P(OLC, x - 1, y - 13, 4, 14); P(col, x, y - 12, 2, 12); P(shade(col, .25), x, y - 12, 1, 11); P(OLC, x - 1, y - 14, 4, 2); }
function tdGrave(x, y, kind, R) { tdShadowRect(x - 4, y - 1, 12, 3); if (kind) { P(OLC, x - 1, y - 15, 4, 16); P('#a8a4b0', x, y - 14, 2, 14); P(OLC, x - 5, y - 12, 12, 4); P('#a8a4b0', x - 4, y - 11, 10, 2); P('#d8d4e0', x - 4, y - 11, 4, 1); } else { pEll(OLC, x + 2, y - 11, 6, 5); P(OLC, x - 4, y - 11, 13, 12); pEll('#9a96a4', x + 2, y - 11, 5, 4); P('#9a96a4', x - 3, y - 11, 11, 11); P('#c8c4d0', x - 3, y - 12, 4, 6); P('#6a6676', x + 6, y - 10, 1, 10); P('#6a6676', x - 1, y - 8, 6, 1); P('#6a6676', x - 1, y - 5, 5, 1); } P('#5a8a3a', x - 3, y, 10, 1); }
function tdPumpkin(x, y) { tdShadowRect(x - 4, y - 1, 10, 2); pEll(OLC, x, y - 4, 6, 5); pEll('#e07820', x, y - 4, 5, 4); pEll('#f8a040', x - 2, y - 5, 2, 2); P('#a84a10', x, y - 8, 1, 7); P('#3a6a2a', x, y - 10, 2, 3); }
/* ---------- buildings (3/4 view) ---------- */
// returns { c: canvas, ox, oy } where (ox, oy) in the canvas is the front-left bottom corner
function tdBuilding(key, o) {
  const w = o.w, wallH = o.wallH, roofH = o.roofH, ov = o.ov === undefined ? 7 : o.ov, top = o.top || 26, W = w + ov * 2 + 4, H = top + roofH + wallH + 6;
  const c = Cache.get('tdb_' + key, W, H, (cx) => {
    const R = RNG(o.seed || 9), x0 = ov + 2, yRoof = top, yWall = top + roofH - 4, yBase = top + roofH + wallH - 4;
    // ---- wall ----
    P(OLC, x0 - 1, yWall - 1, w + 2, wallH + 2);
    if (o.wall === 'stone') { stoneTexture(o.wallCol || '#a8a0a0', x0, yWall, w, wallH, R, 10, 6); }
    else if (o.wall === 'wood') { for (let x = 0; x < w; x += 6) { const c2 = R.pick([o.wallCol || '#b8784a', shade(o.wallCol || '#b8784a', -.06), shade(o.wallCol || '#b8784a', .05)]); P(c2, x0 + x, yWall, 6, wallH); P(shade(o.wallCol || '#b8784a', -.3), x0 + x, yWall, 1, wallH); P(shade(o.wallCol || '#b8784a', .18), x0 + x + 1, yWall, 1, wallH); if (R() < .5) P(shade(o.wallCol || '#b8784a', -.2), x0 + x + 3, yWall + R.i(4, wallH - 6), 1, 2); } }
    else { // timber frame
      P(o.wallCol || '#f0e2c4', x0, yWall, w, wallH); textureNoise('#e0cca8', x0, yWall, w, wallH, w * wallH / 14, R); textureNoise('#fff4dc', x0, yWall, w, wallH, w * wallH / 30, R);
      const bm = '#7a4a30'; const beam = (x, y, ww, hh) => { P(OLC, x - 1, y, ww + 2, hh); P(bm, x, y, ww, hh); P('#9a6440', x, y, ww, 1); };
      beam(x0, yWall, w, 4); beam(x0, yBase - 6, w, 3); beam(x0, yWall, 4, wallH); beam(x0 + w - 4, yWall, 4, wallH); for (const bx of (o.beams || [])) beam(x0 + bx, yWall, 3, wallH);
      for (const bx of (o.braces || [])) { pLine(OLC, x0 + bx, yBase - 6, x0 + bx + 14, yWall + 4, 4); pLine(bm, x0 + bx, yBase - 6, x0 + bx + 14, yWall + 4, 2); }
    }
    // foundation
    stoneTexture('#8a8088', x0 - 1, yBase - 4, w + 2, 5, R, 7, 3); P(OLC, x0 - 1, yBase + 1, w + 2, 1);
    // shadow side + under-eave shadow (light from top-left)
    ctx.globalAlpha = .28; P('#1e1840', x0 + w - 6, yWall, 6, wallH); P('#1e1840', x0, yWall, w, 7); ctx.globalAlpha = .14; P('#1e1840', x0 + w - 14, yWall, 8, wallH); ctx.globalAlpha = 1;
    // windows
    for (const [wx, wy, ww, wh] of (o.windows || [])) { const X = x0 + wx, Y = yWall + wy; P(OLC, X - 2, Y - 2, ww + 4, wh + 4); P('#6a4030', X - 1, Y - 1, ww + 2, wh + 2); P('#2a2a48', X, Y, ww, wh); P('#3a4a78', X, Y, ww, 2); P('#6a4030', X + ww / 2 - 1, Y, 2, wh); P('#6a4030', X, Y + wh / 2 - 1, ww, 2); P('#8a5a3a', X - 3, Y + wh + 1, ww + 6, 3); P('#b07a4a', X - 3, Y + wh + 1, ww + 6, 1); if (o.flowerBox) { for (let i = 0; i < ww / 2 + 1; i++) { P(R.pick(['#e85060', '#f8c840', '#f080c0', '#ffffff']), X - 2 + i * 2 + R.i(0, 1), Y + wh - 1 + R.i(-1, 0), 2, 2); } P('#4a8a3a', X - 2, Y + wh, ww + 4, 1); } }
    // door
    if (o.door) { const [dx, dw, dh, dc] = o.door, X = x0 + dx, Y = yBase - 4 - dh; P(OLC, X - 2, Y - 3, dw + 4, dh + 3); if (o.arch) pEll(OLC, X + dw / 2, Y, dw / 2 + 2, 6); for (let x = 0; x < dw; x += 4) { P(shade(dc || '#8a5030', R.r(-.08, .06)), X + x, Y, 4, dh); P(shade(dc || '#8a5030', -.3), X + x, Y, 1, dh); } if (o.arch) { pEll(dc || '#8a5030', X + dw / 2, Y, dw / 2, 5); } P(shade(dc || '#8a5030', .25), X, Y, dw, 1); P('#f0c860', X + dw - 4, Y + dh / 2, 2, 2); P('#5a5a66', X, Y + 4, dw, 1); P('#5a5a66', X, Y + dh - 6, dw, 1); }
    // ---- roof ----
    const rc = o.roofCol || '#c0583a', rx0 = x0 - ov, rw = w + ov * 2, back = Math.round(roofH * .26), front = roofH - back;
    P(OLC, rx0 - 1, yRoof - 1, rw + 2, roofH + 2);
    P(shade(rc, -.32), rx0, yRoof, rw, back); for (let y = yRoof + 2; y < yRoof + back; y += 3) P(shade(rc, -.42), rx0, y, rw, 1);
    P(OLC, rx0, yRoof + back - 1, rw, 1); P(shade(rc, .3), rx0, yRoof + back, rw, 2); P(shade(rc, .5), rx0 + 2, yRoof + back, rw - 4, 1);
    const fy = yRoof + back + 2, fh = front - 2;
    if (o.roof === 'thatch') {
      P(rc, rx0, fy, rw, fh);
      for (let y = fy; y < fy + fh; y += 4) { for (let x = rx0; x < rx0 + rw; x += 2) { const l = R.i(2, 5); P(R() < .5 ? shade(rc, .18) : shade(rc, -.12), x, y + R.i(0, 1), 1, l); } P(shade(rc, -.3), rx0, y + 3, rw, 1); }
      if (o.motif) { const my = fy + Math.round(fh * .45); P(shade(rc, -.45), rx0, my - 1, rw, 8); for (let x = rx0 + 3; x < rx0 + rw - 6; x += 10) pPoly('#f4e8cc', [[x, my + 6], [x + 3.5, my], [x + 7, my + 6]]); }
      for (let x = rx0; x < rx0 + rw; x += 3) P(shade(rc, -.38), x, fy + fh - 2 + (x % 2), 3, 3);
    } else if (o.roof === 'slate') {
      P(rc, rx0, fy, rw, fh);
      for (let y = fy, row = 0; y < fy + fh; y += 5, row++) { P(shade(rc, -.3), rx0, y + 4, rw, 1); for (let x = rx0 + (row % 2 ? 4 : 0); x < rx0 + rw; x += 8) { P(shade(rc, -.3), x, y, 1, 5); P(shade(rc, R.r(.05, .22)), x + 1, y, R.i(3, 6), 1); } }
    } else { // clay tiles: curved rows
      P(rc, rx0, fy, rw, fh);
      for (let y = fy, row = 0; y < fy + fh; y += 5, row++) { for (let x = rx0 + (row % 2 ? 3 : 0); x < rx0 + rw; x += 6) { P(shade(rc, -.28), x, y, 1, 5); P(shade(rc, .2), x + 1, y, 4, 1); P(shade(rc, -.15), x + 1, y + 3, 4, 1); } P(shade(rc, -.38), rx0, y + 4, rw, 1); }
    }
    // roof light/shade: lit left, darker right; eave edge
    ctx.globalAlpha = .16; P('#fff0c0', rx0, fy, Math.round(rw * .35), fh); ctx.globalAlpha = .22; P('#1e1840', rx0 + Math.round(rw * .72), fy, rw - Math.round(rw * .72), fh); ctx.globalAlpha = 1;
    P(OLC, rx0, fy + fh, rw, 1); P(shade(rc, -.5), rx0, fy + fh - 1, rw, 1);
    // chimney
    if (o.chimney) { const [chx, chh] = o.chimney, X = x0 + chx, Y = yRoof + back - chh; P(OLC, X - 1, Y - 1, 14, chh + 3); stoneTexture('#a8645a', X, Y, 12, chh + 2, R, 6, 3); P('#4a3036', X, Y, 12, 3); P('#c88070', X, Y - 1, 12, 1); ctx.globalAlpha = .25; P('#1e1840', X + 8, Y + 2, 4, chh); ctx.globalAlpha = 1; }
    if (o.extra) o.extra(cx, x0, yRoof, yWall, yBase, R);
  });
  return { c, ox: ov + 2, oy: top + roofH + wallH - 4 };
}
