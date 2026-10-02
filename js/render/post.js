'use strict';
/* =========================================================
   POST PROCESSING (UI resolution)
   ========================================================= */
const Post = {
  flash: 0, flashCol: '#fff', fade: 0, fadeCol: '#000', letter: 0, vignette: null, tint: null, tintA: 0,
  init() { const [c, x] = mkCanvas(CONFIG.W, CONFIG.H); const gr = x.createRadialGradient(640, 360, 250, 640, 360, 820); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(8,4,16,.62)'); x.fillStyle = gr; x.fillRect(0, 0, CONFIG.W, CONFIG.H); this.vignette = c; },
  doFlash(a = .8, col = '#fff') { this.flash = Settings.flashes ? a : a * .3; this.flashCol = col; },
  update(dt) { this.flash = Math.max(0, this.flash - dt * 3.5); },
  draw(baked) {
    if (!baked) g.drawImage(this.vignette, 0, 0); // baked: the HD renderer already applied it on the GPU
    if (this.tintA > 0.01) { g.globalAlpha = this.tintA; g.fillStyle = this.tint; g.fillRect(0, 0, CONFIG.W, CONFIG.H); g.globalAlpha = 1; }
    if (this.letter > .01) { const h = 70 * this.letter; g.fillStyle = '#000'; g.fillRect(0, 0, CONFIG.W, h); g.fillRect(0, CONFIG.H - h, CONFIG.W, h); }
  },
  // flash is drawn above the UI; vignette/tint/letterbox are drawn BELOW the UI so they never hide text
  drawFlash() { if (this.flash > .01) { g.globalAlpha = this.flash; g.fillStyle = this.flashCol; g.fillRect(0, 0, CONFIG.W, CONFIG.H); g.globalAlpha = 1; } },
  drawFade() { if (this.fade > .003) { g.globalAlpha = Math.min(1, this.fade); g.fillStyle = this.fadeCol; g.fillRect(0, 0, CONFIG.W, CONFIG.H); g.globalAlpha = 1; } }
};
Post.init();
/* hit-stop / slow motion */
const TimeFX = { stop: 0, slow: 0, slowK: 1, hit(s) { this.stop = Math.max(this.stop, s); }, slowmo(d, k = .3) { this.slow = d; this.slowK = k; }, scale(dt) { if (this.stop > 0) { this.stop -= dt; return 0; } if (this.slow > 0) { this.slow -= dt; return this.slowK; } return 1; } };
/* sky helper */
function drawSkyGradient(top, bot, y0 = 0, h = CONFIG.LH) { const gr = ctx.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, top); gr.addColorStop(1, bot); ctx.fillStyle = gr; ctx.fillRect(0, y0, CONFIG.LW, h); }
function drawStars(alpha, seed = 7, h = 200) { if (alpha <= .01) return; const r = RNG(seed); ctx.globalAlpha = alpha; for (let i = 0; i < 90; i++) { const x = r() * CONFIG.LW, y = r() * h, tw = .5 + .5 * Math.sin(T * r.r(1, 4) + i); if (tw > .3) P(tw > .85 ? '#ffffff' : '#bcc8f0', x, y, 1, 1); } ctx.globalAlpha = 1; }
function drawMoon(x, y, alpha) { if (alpha <= .01) return; ctx.globalAlpha = alpha; pCirc('#3a4270', x, y, 13); pCirc('#e9ecf6', x, y, 9); pCirc('#c8cce0', x + 3, y - 2, 2); pCirc('#c8cce0', x - 3, y + 3, 1.5); ctx.globalAlpha = alpha * .15; pCirc('#e9ecf6', x, y, 18); ctx.globalAlpha = 1; }
function drawClouds(seed, y, col, speed, alpha = 1, scale = 1) { const r = RNG(seed); ctx.globalAlpha = alpha; for (let i = 0; i < 7; i++) { const w = r.r(50, 110) * scale, x = ((r() * 900 + T * speed * r.r(.7, 1.3)) % 900) - 130, yy = y + r.r(-20, 20); pEll(shade(col, -.1), x, yy + 3, w * .5, 6 * scale); pEll(col, x - w * .2, yy, w * .3, 7 * scale); pEll(col, x + w * .15, yy - 2, w * .28, 8 * scale); pEll(shade(col, .15), x, yy - 4, w * .2, 4 * scale); } ctx.globalAlpha = 1; }
