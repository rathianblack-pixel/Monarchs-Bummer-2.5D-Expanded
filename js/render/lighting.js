'use strict';
/* =========================================================
   LIGHTING
   ========================================================= */
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
    for (const L of this.list) { const [r, g2, b] = hexToRgb(L.col); const gr = lctx.createRadialGradient(L.X, L.Y, 0, L.X, L.Y, L.R); gr.addColorStop(0, rgb(r, g2, b, .9 * L.a)); gr.addColorStop(.35, rgb(r, g2, b, .45 * L.a)); gr.addColorStop(1, rgb(r, g2, b, 0)); lctx.fillStyle = gr; lctx.fillRect(L.X - L.R, L.Y - L.R, L.R * 2, L.R * 2); }
    wctx.save(); wctx.setTransform(1, 0, 0, 1, 0, 0); wctx.globalCompositeOperation = 'multiply'; wctx.drawImage(lc, 0, 0);
    wctx.globalCompositeOperation = 'lighter';
    for (const L of this.list) { if (!L.glow) continue; const [r, g2, b] = hexToRgb(L.col); const R = L.R * .45; const gr = wctx.createRadialGradient(L.X, L.Y, 0, L.X, L.Y, R); gr.addColorStop(0, rgb(r, g2, b, L.glow * L.a * .5)); gr.addColorStop(1, rgb(r, g2, b, 0)); wctx.fillStyle = gr; wctx.fillRect(L.X - R, L.Y - R, R * 2, R * 2); }
    wctx.restore();
  }
};
