'use strict';
/* =========================================================
   CANVASES
   ========================================================= */
const cv = document.getElementById('game');
cv.width = CONFIG.W; cv.height = CONFIG.H;
const g = cv.getContext('2d');
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
const wc = document.createElement('canvas'); wc.width = CONFIG.LW; wc.height = CONFIG.LH; const wctx = wc.getContext('2d'); wctx.imageSmoothingEnabled = false;
const [lc, lctx] = mkCanvas(CONFIG.LW, CONFIG.LH);
let ctx = wctx; // active pixel context
function useCtx(c) { const p = ctx; ctx = c; return p; }
function fitCanvas() {
  const s = Math.min(innerWidth / CONFIG.W, innerHeight / CONFIG.H);
  cv.style.width = (CONFIG.W * s) + 'px'; cv.style.height = (CONFIG.H * s) + 'px';
}
addEventListener('resize', fitCanvas); fitCanvas();
