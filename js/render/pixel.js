'use strict';
/* =========================================================
   PIXEL ART PRIMITIVES (operate on active ctx)
   ========================================================= */
let PAINT = null;
// ctx._q = internal super-sampling of the current target (HD hi-res sprite captures draw at 2x: positions snap to 1/q px)
function P(c, x, y, w = 1, h = 1) { ctx.fillStyle = PAINT || c; const q = ctx._q; if (q > 1) { ctx.fillRect(Math.round(x * q) / q, Math.round(y * q) / q, Math.max(q, Math.round(w * q)) / q, Math.max(q, Math.round(h * q)) / q); return; } ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); }
function pEll(c, cx, cy, rx, ry) {
  ctx.fillStyle = PAINT || c; rx = Math.max(.5, rx); ry = Math.max(.5, ry); const q = ctx._q;
  if (q > 1) { const y0 = Math.round((cy - ry) * q), y1 = Math.round((cy + ry) * q); for (let Y = y0; Y < y1; Y++) { const dy = ((Y + .5) / q - cy) / ry; const k = 1 - dy * dy; if (k <= 0) continue; const hw = rx * Math.sqrt(k), a = Math.round((cx - hw) * q), b = Math.round((cx + hw) * q); ctx.fillRect(a / q, Y / q, Math.max(1, b - a) / q, 1 / q); } return; }
  const y0 = Math.round(cy - ry), y1 = Math.round(cy + ry);
  for (let y = y0; y < y1; y++) { const dy = (y + .5 - cy) / ry; const k = 1 - dy * dy; if (k <= 0) continue; const hw = rx * Math.sqrt(k); ctx.fillRect(Math.round(cx - hw), y, Math.max(1, Math.round(cx + hw) - Math.round(cx - hw)), 1); }
}
function pCirc(c, cx, cy, r) { pEll(c, cx, cy, r, r); }
function pEllO(c, o, cx, cy, rx, ry, t = 1) { pEll(o, cx, cy, rx + t, ry + t); pEll(c, cx, cy, rx, ry); }
function pLine(c, x0, y0, x1, y1, th = 1) {
  ctx.fillStyle = PAINT || c; const dx = x1 - x0, dy = y1 - y0, n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)))), o = Math.floor(th / 2), q = ctx._q;
  if (q > 1) { const m = n * q; for (let i = 0; i <= m; i++) { const t = i / m; ctx.fillRect(Math.round((x0 + dx * t - o) * q) / q, Math.round((y0 + dy * t - o) * q) / q, th, th); } return; }
  for (let i = 0; i <= n; i++) { const t = i / n; ctx.fillRect(Math.round(x0 + dx * t) - o, Math.round(y0 + dy * t) - o, th, th); }
}
function pPoly(c, pts) {
  ctx.fillStyle = PAINT || c; let minY = 1e9, maxY = -1e9; for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  const q = ctx._q; if (q > 1) { for (let Y = Math.round(minY * q); Y <= Math.round(maxY * q); Y++) { const yy = (Y + .5) / q, xs = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); } xs.sort((a, b) => a - b); for (let i = 0; i + 1 < xs.length; i += 2) { const a = Math.round(xs[i] * q), b = Math.round(xs[i + 1] * q); if (b > a) ctx.fillRect(a / q, Y / q, (b - a) / q, 1 / q); } } return; }
  minY = Math.round(minY); maxY = Math.round(maxY);
  for (let y = minY; y <= maxY; y++) {
    const yy = y + .5, xs = [];
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
    xs.sort((a, b) => a - b); for (let i = 0; i + 1 < xs.length; i += 2) { const x0 = Math.round(xs[i]), x1 = Math.round(xs[i + 1]); if (x1 > x0) ctx.fillRect(x0, y, x1 - x0, 1); }
  }
}
function pPolyO(c, o, pts) { // outline by drawing expanded copies
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) pPoly(o, pts.map(p => [p[0] + dx, p[1] + dy])); pPoly(c, pts);
}
function jaggedEdge(c, x, y, w, amp, rng, step = 2) { for (let i = 0; i < w; i += step) P(c, x + i, y - Math.floor(rng() * amp), step, Math.floor(rng() * amp) + 1); }
function ditherCluster(c, x, y, w, h, density, rng) { ctx.fillStyle = c; for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { if (((xx + yy) & 1) === 0 && rng() < density) ctx.fillRect(Math.round(x + xx), Math.round(y + yy), 1, 1); } }
function textureNoise(c, x, y, w, h, n, rng, sz = 1) { ctx.fillStyle = c; for (let i = 0; i < n; i++) ctx.fillRect(Math.round(x + rng() * w), Math.round(y + rng() * h), sz, sz); }
function highlightCluster(c, x, y, rng, n = 4) { for (let i = 0; i < n; i++) P(c, x + Math.floor(rng() * 4), y + Math.floor(rng() * 3), 1, 1); }
function shadowCluster(c, x, y, w, h, rng) { for (let i = 0; i < w * h / 6; i++) P(c, x + rng() * w, y + rng() * h, rng() < .3 ? 2 : 1, 1); }
function woodGrain(base, x, y, w, h, rng, vertical) {
  P(base, x, y, w, h); const dk = shade(base, -.22), lt = shade(base, .12);
  if (vertical) { for (let i = 0; i < w; i += rng.i(3, 5)) P(dk, x + i, y, 1, h); for (let i = 0; i < h * w / 40; i++) P(lt, x + rng() * w, y + rng() * h, 1, rng.i(2, 5)); }
  else { for (let i = 0; i < h; i += rng.i(3, 5)) P(dk, x, y + i, w, 1); for (let i = 0; i < h * w / 40; i++) P(lt, x + rng() * w, y + rng() * h, rng.i(2, 6), 1); }
  for (let i = 0; i < w * h / 120; i++) P(shade(base, -.35), x + rng() * w, y + rng() * h, 1, 1);
}
function stoneTexture(base, x, y, w, h, rng, bw = 10, bh = 6) {
  P(base, x, y, w, h); const dk = shade(base, -.28), lt = shade(base, .15);
  for (let yy = 0, row = 0; yy < h; yy += bh, row++) {
    P(dk, x, y + yy, w, 1); let off = row % 2 ? bw / 2 : 0;
    for (let xx = -off; xx < w; xx += bw + rng.i(-2, 2)) { if (xx > 0) P(dk, x + xx, y + yy, 1, Math.min(bh, h - yy)); if (rng() < .5) P(lt, x + Math.max(0, xx) + 1, y + yy + 1, rng.i(2, bw - 2), 1); }
  }
  textureNoise(shade(base, -.15), x, y, w, h, w * h / 20, rng);
}
function leafCluster(cx, cy, r, col, rng, lt, dk) {
  lt = lt || shade(col, .2); dk = dk || shade(col, -.3);
  pEll(dk, cx, cy + 1, r, r * .85);
  for (let i = 0; i < 5; i++) pEll(col, cx + rng.r(-r * .5, r * .5), cy + rng.r(-r * .4, r * .2), r * rng.r(.45, .7), r * rng.r(.35, .6));
  for (let i = 0; i < r; i++) P(lt, cx + rng.r(-r * .6, r * .5), cy - rng.r(0, r * .6), rng.i(1, 2), 1);
  for (let i = 0; i < r / 2; i++) P(dk, cx + rng.r(-r * .7, r * .7), cy + rng.r(0, r * .6), 1, 1);
}
function grassTuft(x, y, col, sway, h = 4, rng) { const s = Math.round(sway); P(col, x, y - h + 1, 1, h); P(col, x + 1 + s, y - h - 1, 1, h); P(shade(col, .2), x - 1 + (s > 0 ? 1 : 0), y - h + 2, 1, h - 1); P(col, x + 2 + s, y - h + 2, 1, h - 2); }
function clothFold(c, x, y, h) { P(shade(c, -.25), x, y, 1, h); P(shade(c, .15), x + 1, y, 1, Math.max(1, h - 2)); }
function metalHighlight(x, y, len, vertical) { if (vertical) { P('#ffffff', x, y, 1, 1); P('#dfe8f0', x, y + 1, 1, len - 1); } else { P('#ffffff', x, y, 1, 1); P('#dfe8f0', x + 1, y, len - 1, 1); } }
function pText(str, x, y, size, col, align = 'left', font) { const tr = ctx.getTransform(); PFont.draw(ctx, str, x, y, size <= 10 ? 8 : size, col, align, 'alphabetic', null); }
/* cached drawing */
const Cache = { m: {}, get(key, w, h, fn) { let c = this.m[key]; if (!c) { const [cc, cx] = mkCanvas(w, h); const prev = useCtx(cx); fn(cx, w, h); useCtx(prev); c = this.m[key] = cc; } return c; }, drop(prefix) { for (const k in this.m) if (k.startsWith(prefix)) delete this.m[k]; } };
