'use strict';
/* =========================================================
   LIGHTING
   ========================================================= */
// perf: soft light blobs are pre-rendered once per colour (and reused every frame) instead of
// building a new radial gradient for every light, every frame - night scenes have 40+ lights.
const LightSprite = {
  cache: new Map(), N: 128,
  get(col, kind) { const k = col + kind; let c = this.cache.get(k); if (c) return c; c = document.createElement('canvas'); c.width = c.height = this.N; const x = c.getContext('2d'), h = this.N / 2, [r, g2, b] = hexToRgb(col), gr = x.createRadialGradient(h, h, 0, h, h, h);
    if (kind === 'g') { gr.addColorStop(0, rgb(r, g2, b, 1)); gr.addColorStop(1, rgb(r, g2, b, 0)); } else { gr.addColorStop(0, rgb(r, g2, b, .9)); gr.addColorStop(.35, rgb(r, g2, b, .45)); gr.addColorStop(1, rgb(r, g2, b, 0)); }
    x.fillStyle = gr; x.fillRect(0, 0, this.N, this.N); if (this.cache.size > 80) this.cache.clear(); this.cache.set(k, c); return c; },
  draw(x, col, kind, X, Y, R, a) { if (a <= 0 || R <= 0) return; const sm = x.imageSmoothingEnabled; x.imageSmoothingEnabled = true; x.globalAlpha = Math.min(1, a); x.drawImage(this.get(col, kind), X - R, Y - R, R * 2, R * 2); x.globalAlpha = 1; x.imageSmoothingEnabled = sm; }
};
const Light = {
  list: [],
  begin(amb) { lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalCompositeOperation = 'source-over'; lctx.fillStyle = rgb(amb[0], amb[1], amb[2]); lctx.fillRect(0, 0, CONFIG.LW, CONFIG.LH); this.list.length = 0; },
  add(x, y, r, col, a = 1, flick = 0, glow = .35) {
    const f = flick ? 1 + (noise1(T * 9 + x * .3) * .5 + noise1(T * 23 + y) * .5) * flick : 1; const rr = r * f; const tr = wctx.getTransform();
    const X = tr.a * x + tr.e, Y = tr.d * y + tr.f, R = rr * tr.a; if (X < -R || Y < -R || X > CONFIG.LW + R || Y > CONFIG.LH + R) return;
    this.list.push({ X, Y, R, col, a: a * f, glow });
  },
  apply() {
    lctx.globalCompositeOperation = 'lighter';
    for (const L of this.list) LightSprite.draw(lctx, L.col, 'l', L.X, L.Y, L.R, L.a);
    wctx.save(); wctx.setTransform(1, 0, 0, 1, 0, 0); wctx.globalCompositeOperation = 'multiply'; wctx.drawImage(lc, 0, 0);
    wctx.globalCompositeOperation = 'lighter';
    for (const L of this.list) { if (L.glow) LightSprite.draw(wctx, L.col, 'g', L.X, L.Y, L.R * .45, L.glow * L.a * .5); }
    wctx.restore();
  }
};
