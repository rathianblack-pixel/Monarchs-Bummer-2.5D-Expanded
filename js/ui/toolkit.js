'use strict';
/* =========================================================
   UI TOOLKIT (1280x720, immediate-mode)
   ========================================================= */
const COL = { bg: 'rgba(20,16,28,0.86)', bg2: 'rgba(38,28,32,0.9)', gold: '#c9a45a', gold2: '#f0d890', cream: '#f3e6c8', dim: '#a89878', red: '#d8574a', green: '#7fc46a', blue: '#6aa8e0', purple: '#a878d8', ink: '#1a1218' };
const FONT = 'Georgia, "Palatino Linotype", "Book Antiqua", serif';
const UI = {
  layer: 'scene', active: 'scene', hot: {}, hoverId: null, prevHover: null, cursor: 'default',
  // o.maxW: shrink the font (down to 70%) and then ellipsize so text never spills out of its box
  pixel: true,
  text(s, x, y, o = {}) {
    let size = o.size || 16; s = String(s);
    if (this.pixel && !o.font) {
      if (o.maxW) { while (size > 8 && PFont.width(s, size) > o.maxW && PFont.scaleFor(size) > 1) size--; if (PFont.width(s, size) > o.maxW) { while (s.length > 1 && PFont.width(s + '…', size) > o.maxW) s = s.slice(0, -1); s = s.trimEnd() + '…'; } }
      const a0 = g.globalAlpha; if (o.alpha !== undefined) g.globalAlpha = o.alpha;
      PFont.draw(g, s, x, y, size, o.col || COL.cream, o.align || 'left', o.base || 'alphabetic', o.shadow === false ? null : (o.shadowCol || 'rgba(0,0,0,.6)'), o.stroke, o.strokeCol);
      g.globalAlpha = o.alpha !== undefined ? 1 : a0; return;
    }
    const fnt = sz => `${o.italic ? 'italic ' : ''}${o.bold === false ? '' : 'bold '}${sz}px ${o.font || FONT}`;
    g.font = fnt(size);
    if (o.maxW) {
      const min = Math.max(8, Math.floor(size * .7));
      while (size > min && g.measureText(s).width > o.maxW) { size--; g.font = fnt(size); }
      if (g.measureText(s).width > o.maxW) { while (s.length > 1 && g.measureText(s + '…').width > o.maxW) s = s.slice(0, -1); s = s.trimEnd() + '…'; }
    } g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'alphabetic';
    if (o.alpha !== undefined) g.globalAlpha = o.alpha;
    if (o.shadow !== false) { g.fillStyle = o.shadowCol || 'rgba(0,0,0,.55)'; g.fillText(s, x + 1, y + 2); }
    if (o.stroke) { g.lineWidth = o.stroke; g.strokeStyle = o.strokeCol || '#000'; g.lineJoin = 'round'; g.strokeText(s, x, y); }
    g.fillStyle = o.col || COL.cream; g.fillText(s, x, y); g.globalAlpha = 1;
  },
  measure(s, size = 16, bold = true) { if (this.pixel) return PFont.width(s, size); g.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`; return g.measureText(s).width; },
  wrap(s, maxW, size = 16, bold = false) { const mw = t => this.pixel ? PFont.width(t, size) : (g.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`, g.measureText(t).width); const out = []; for (const para of String(s).split('\n')) { let line = ''; for (const w of para.split(' ')) { const test = line ? line + ' ' + w : w; if (mw(test) > maxW && line) { out.push(line); line = w; } else line = test; } out.push(line); } return out; },
  para(s, x, y, maxW, o = {}) { const lines = this.wrap(s, maxW, o.size || 16, o.bold); const lh = o.lh || (o.size || 16) * 1.35; lines.forEach((l, i) => this.text(l, x, y + i * lh, Object.assign({ bold: false }, o))); return lines.length * lh; },
  panel(x, y, w, h, o = {}) {
    g.save(); g.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 4, y + 5, w, h);
    g.fillStyle = o.bg || COL.bg; g.fillRect(x + 3, y, w - 6, h); g.fillRect(x, y + 3, w, h - 6);
    g.fillStyle = 'rgba(255,230,180,.05)'; g.fillRect(x + 3, y + 3, w - 6, 2);
    g.strokeStyle = o.border || 'rgba(201,164,90,.8)'; g.lineWidth = 1; g.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    g.strokeStyle = 'rgba(201,164,90,.25)'; g.strokeRect(x + 6.5, y + 6.5, w - 13, h - 13);
    const c = o.border || COL.gold; g.fillStyle = c; [[x + 2, y + 2], [x + w - 6, y + 2], [x + 2, y + h - 6], [x + w - 6, y + h - 6]].forEach(([a, b]) => { g.fillRect(a, b, 4, 4); g.fillStyle = COL.ink; g.fillRect(a + 1, b + 1, 2, 2); g.fillStyle = c; });
    if (o.title) { this.text(o.title, x + w / 2, y + 26, { align: 'center', size: o.titleSize || 18, col: COL.gold2, maxW: w - 36 }); g.fillStyle = 'rgba(201,164,90,.6)'; g.fillRect(x + w / 2 - 60, y + 34, 120, 1); g.fillRect(x + w / 2 - 3, y + 32, 6, 5); }
    g.restore();
  },
  parchment(x, y, w, h) {
    g.save(); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x + 6, y + 8, w, h);
    const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#efdcb2'); gr.addColorStop(1, '#d9bf8a'); g.fillStyle = gr; g.fillRect(x, y, w, h);
    const r = RNG(Math.floor(x * 7 + y)); g.fillStyle = 'rgba(120,80,40,.08)'; for (let i = 0; i < 90; i++) g.fillRect(x + r() * w, y + r() * h, r() * 30, 2);
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.strokeRect(x + 6, y + 6, w - 12, h - 12); g.strokeStyle = 'rgba(138,106,58,.4)'; g.lineWidth = 1; g.strokeRect(x + 11, y + 11, w - 22, h - 22);
    g.fillStyle = 'rgba(90,60,30,.25)'; g.fillRect(x, y, w, 3); g.fillRect(x, y + h - 3, w, 3); g.restore();
  },
  inRect(x, y, w, h) { const m = Input.mouse; return m.x >= x && m.x < x + w && m.y >= y && m.y < y + h; },
  interactive() { return this.layer === this.active && !Scene.transitioning; },
  btn(label, x, y, w, h, o = {}) {
    const id = o.id || (label + '|' + Math.round(x) + '|' + Math.round(y)); const live = this.interactive() && !o.disabled;
    const hov = live && this.inRect(x, y, w, h); if (hov) { this.hoverId = id; this.cursor = 'pointer'; }
    const st = this.hot[id] || (this.hot[id] = { h: 0, p: 0 }); st.h += ((hov ? 1 : 0) - st.h) * Math.min(1, DT * 16); st.seen = T;
    let clicked = false;
    if (live && ((hov && Input.mouse.clicked) || (o.key && Input.hit(...[].concat(o.key))))) { clicked = true; st.p = 1; SFX.play(o.sound || 'click'); if (o.key) Input.consume(...[].concat(o.key)); Input.mouse.clicked = false; }
    st.p = Math.max(0, st.p - DT * 6);
    const lift = o.noLift ? 0 : st.h * 2 - st.p * 3;
    const yy = y - lift;
    g.save(); if (o.disabled) g.globalAlpha = .45;
    if (o.style === 'ghost') {
      if (st.h > .02) { g.fillStyle = `rgba(201,164,90,${.12 * st.h})`; g.fillRect(x, yy, w, h); }
      this.text(label, x + (o.align === 'left' ? 12 : w / 2), yy + h / 2 + (o.size || 16) * .36, { align: o.align || 'center', size: o.size || 16, col: hov ? COL.gold2 : (o.col || COL.cream), maxW: w - 20 });
    } else {
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x + 2, y + 3, w, h);
      const top = o.danger ? '#5a2226' : o.accent ? '#4e3a1e' : '#2e2430', bot = o.danger ? '#3a1216' : o.accent ? '#33240f' : '#1c1620';
      const gr = g.createLinearGradient(0, yy, 0, yy + h); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(x + 2, yy, w - 4, h); g.fillRect(x, yy + 2, w, h - 4);
      g.strokeStyle = hov ? COL.gold2 : 'rgba(201,164,90,.7)'; g.lineWidth = 1; g.strokeRect(x + 1.5, yy + 1.5, w - 3, h - 3);
      g.fillStyle = `rgba(255,236,190,${.06 + st.h * .08})`; g.fillRect(x + 3, yy + 3, w - 6, 2);
      const tx = o.align === 'left' ? x + 14 : x + w / 2, lw = w - (o.align === 'left' ? 24 + (o.right ? 60 : 0) : 16);
      if (o.sub) { this.text(label, tx, yy + h / 2 - 2, { align: o.align || 'center', size: o.size || 16, col: hov ? '#fff4d8' : COL.cream, maxW: lw }); this.text(o.sub, tx, yy + h / 2 + 14, { align: o.align || 'center', size: 12, bold: false, col: COL.dim, maxW: lw }); }
      else this.text(label, tx, yy + h / 2 + (o.size || 16) * .36, { align: o.align || 'center', size: o.size || 16, col: hov ? '#fff4d8' : COL.cream, maxW: lw });
      if (o.right) this.text(o.right, x + w - 14, yy + h / 2 + 6, { align: 'right', size: 15, col: o.rightCol || COL.gold2 });
      
    }
    g.restore();
    return clicked;
  },
  slider(label, x, y, w, val, o = {}) {
    this.text(label, x, y, { size: 15, col: COL.cream }); const bx = x + 150, bw = w - 210, by = y - 8;
    g.fillStyle = '#120c14'; g.fillRect(bx, by, bw, 8); g.fillStyle = COL.gold; g.fillRect(bx, by, bw * val, 8); g.strokeStyle = 'rgba(201,164,90,.6)'; g.strokeRect(bx + .5, by + .5, bw - 1, 7);
    g.fillStyle = COL.gold2; g.fillRect(bx + bw * val - 4, by - 4, 8, 16);
    this.text(o.fmt ? o.fmt(val) : Math.round(val * 100) + '%', x + w - 40, y, { size: 14, col: COL.dim });
    if (this.interactive() && Input.mouse.down && this.inRect(bx - 6, by - 8, bw + 12, 24)) { const nv = clamp((Input.mouse.x - bx) / bw, 0, 1); if (Math.abs(nv - val) > .001) { val = nv; this._sliderT = (this._sliderT || 0) + DT; if (this._sliderT > .06) { SFX.play('hover'); this._sliderT = 0; } } }
    return val;
  },
  bar(x, y, w, h, k, col, o = {}) {
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = o.bg || '#1a0f16'; g.fillRect(x, y, w, h);
    if (o.ghost !== undefined && o.ghost > k) { g.fillStyle = o.ghostCol || '#f0e0c0'; g.fillRect(x, y, w * clamp(o.ghost, 0, 1), h); }
    g.fillStyle = col; g.fillRect(x, y, w * clamp(k, 0, 1), h); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x, y, w * clamp(k, 0, 1), Math.max(1, h / 3));
    g.strokeStyle = 'rgba(201,164,90,.55)'; g.lineWidth = 1; g.strokeRect(x - .5, y - .5, w + 1, h + 1);
  },
  pill(s, x, y, col = COL.gold, o = {}) { const w = this.measure(s, o.size || 12) + 18, h = 20; g.fillStyle = 'rgba(14,10,18,.85)'; g.fillRect(x, y, w, h); g.strokeStyle = col; g.strokeRect(x + .5, y + .5, w - 1, h - 1); this.text(s, x + w / 2, y + 14, { align: 'center', size: o.size || 12, col, shadow: false }); return w; },
  endFrame() { if (this.hoverId && this.hoverId !== this.prevHover && Input.mouse.x) SFX.play('hover'); this.prevHover = this.hoverId; this.hoverId = null; cv.style.cursor = this.cursor; this.cursor = 'default'; for (const k in this.hot) if (T - this.hot[k].seen > 2) delete this.hot[k]; }
};
