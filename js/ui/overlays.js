'use strict';
/* =========================================================
   OVERLAYS
   ========================================================= */
const Overlays = {
  stack: [],
  push(o) { this.stack.push(o); o.id = o.id || ('ov' + Math.random()); return o; },
  pop(o) { const i = this.stack.indexOf(o); if (i >= 0) this.stack.splice(i, 1); },
  has(name) { return this.stack.some(o => o.name === name); },
  top() { return this.stack[this.stack.length - 1]; },
  update(dt) { const t = this.top(); if (t && t.update) t.update(dt); },
  draw() { for (const o of this.stack) { UI.layer = o.id; o.draw(); } UI.layer = 'scene'; },
  clear() { this.stack.length = 0; }
};
/* Toasts */
const Toast = {
  list: [],
  add(text, col = COL.gold2, icon = '◆') { this.list.push({ text, col, icon, t: 0, life: 3.4 }); if (this.list.length > 4) this.list.shift(); },
  update(dt) { for (let i = this.list.length - 1; i >= 0; i--) { this.list[i].t += dt; if (this.list[i].t > this.list[i].life) this.list.splice(i, 1); } },
  draw() {
    this.list.forEach((o, i) => {
      const k = o.t < .25 ? Ease.outBack(o.t / .25) : o.t > o.life - .4 ? 1 - (o.t - (o.life - .4)) / .4 : 1; const w = Math.min(900, UI.measure(o.text, 15) + 50), x = 640 - w / 2, y = (Scene.name === 'combat' ? 168 : 88) + i * 38 - (1 - k) * 16;
      g.globalAlpha = clamp(k, 0, 1); g.fillStyle = 'rgba(16,12,20,.9)'; g.fillRect(x, y, w, 30); g.fillStyle = o.col; g.fillRect(x, y, 3, 30); g.strokeStyle = 'rgba(201,164,90,.4)'; g.strokeRect(x + .5, y + .5, w - 1, 29);
      UI.text(o.icon, x + 18, y + 21, { size: 14, col: o.col, align: 'center' }); UI.text(o.text, x + 32, y + 20, { size: 15, col: COL.cream, maxW: w - 44 }); g.globalAlpha = 1;
    });
  }
};
/* Banner (big red notification etc.) */
const Banner = { t: 0, text: '', sub: '', col: COL.red, life: 0, show(text, sub = '', col = COL.red, life = 2.6) { this.text = text; this.sub = sub; this.col = col; this.t = 0; this.life = life; }, update(dt) { if (this.life) this.t += dt; if (this.t > this.life) this.life = 0; },
  draw() { if (!this.life) return; const k = this.t < .3 ? this.t / .3 : this.t > this.life - .5 ? (this.life - this.t) / .5 : 1; g.globalAlpha = clamp(k, 0, 1); const h = 90; g.fillStyle = 'rgba(10,4,8,.78)'; g.fillRect(0, 300 - h / 2, 1280, h); g.fillStyle = this.col; g.fillRect(0, 300 - h / 2, 1280, 2); g.fillRect(0, 300 + h / 2 - 2, 1280, 2);
    UI.text(this.text, 640 + (1 - k) * 30, 308, { align: 'center', size: 40, col: this.col }); if (this.sub) UI.text(this.sub, 640, 332, { align: 'center', size: 16, col: COL.cream, bold: false, italic: true }); g.globalAlpha = 1; } };
