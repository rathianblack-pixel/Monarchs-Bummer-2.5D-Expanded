'use strict';
/* =========================================================
   DIALOGUE
   ========================================================= */
const Dialog = {
  ov: null, lines: [], i: 0, shown: 0, done: null, speaker: null, talking: false, blipT: 0, onLine: null,
  get open() { return !!this.ov; },
  start(lines, done, o = {}) {
    if (!lines || !lines.length) { done && done(); return; }
    this.lines = lines; this.i = 0; this.shown = 0; this.done = done; this.onLine = o.onLine || null; this.opts = o;
    if (!this.ov) this.ov = Overlays.push({ name: 'dialog', update: dt => this.update(dt), draw: () => this.draw() });
    this.enterLine();
  },
  enterLine() { const L = this.lines[this.i]; this.speaker = L.n; this.shown = 0; this.appear = 0; if (L.fx) L.fx(); this.onLine && this.onLine(L, this.i); if (L.sfx) SFX.play(L.sfx); },
  close() { Overlays.pop(this.ov); this.ov = null; this.speaker = null; this.talking = false; const d = this.done; this.done = null; d && d(); },
  update(dt) {
    const L = this.lines[this.i]; if (!L) return; this.appear = Math.min(1, (this.appear || 0) + dt * 6);
    const full = L.t.length; const speed = 42 * Settings.text * (L.slow ? .55 : 1);
    if (this.shown < full) { const before = Math.floor(this.shown); this.shown = Math.min(full, this.shown + dt * speed); this.talking = true; this.blipT -= dt; if (Math.floor(this.shown) !== before && this.blipT <= 0 && L.t[Math.floor(this.shown) - 1] !== ' ') { blip(L.v || 'narrator'); this.blipT = .065; } }
    else this.talking = false;
    const adv = Input.hit(' ') || (Input.mouse.clicked && !L.c);
    if (L.c && this.shown >= full) return; // choices handled in draw
    if (adv) { Input.consume(' '); Input.mouse.clicked = false; if (this.shown < full) this.shown = full; else this.next(); }
  },
  choose(f) { SFX.play('page', { v: .6 }); Overlays.pop(this.ov); this.ov = null; this.speaker = null; this.talking = false; const d = this.done; this.done = null; if (f) f(); else d && d(); },
  next() { SFX.play('page', { v: .6 }); this.i++; if (this.i >= this.lines.length) this.close(); else this.enterLine(); },
  draw() {
    const L = this.lines[this.i]; if (!L) return; const k = Ease.outQ(this.appear || 1);
    // size the box from the FULL line (so it doesn't grow while typing) — text can never spill past the border
    let fs = 19, lh = 27, lines = UI.wrap(L.t, 860 - 70, fs);
    if (lines.length > 4) { fs = 17; lh = 23; lines = UI.wrap(L.t, 860 - 70, fs); }
    if (lines.length > 6) { fs = 15; lh = 20; lines = UI.wrap(L.t, 860 - 70, fs); }
    const x = 210, w = 860, h = Math.max(L.c ? 150 : 128, 44 + lines.length * lh + (L.c ? 64 : 14)), y = 706 - h + (1 - k) * 20; g.globalAlpha = k;
    UI.panel(x, y, w, h, { bg: 'rgba(18,13,22,.92)' });
    if (L.n) { const nw = Math.min(520, UI.measure(L.n, 16) + 30); g.fillStyle = '#2a1e18'; g.fillRect(x + 24, y - 16, nw, 28); g.strokeStyle = COL.gold; g.strokeRect(x + 24.5, y - 15.5, nw - 1, 27); UI.text(L.n, x + 24 + nw / 2, y + 4, { align: 'center', size: 16, col: L.col || COL.gold2, maxW: nw - 20 }); }
    // reveal characters line-by-line using the pre-wrapped layout
    let left = Math.floor(this.shown); lines.forEach((ln, i) => { if (left <= 0) return; const part = ln.slice(0, left); left -= ln.length + 1; UI.text(part, x + 34, y + 46 + i * lh, { size: fs, col: COL.cream, bold: false }); });
    if (L.c && this.shown >= L.t.length) {
      const bw = Math.min(250, (w - 60) / L.c.length - 10); L.c.forEach((c, j) => { if (UI.btn(c.t, x + 30 + j * (bw + 10), y + h - 50, bw, 36, { size: 15, accent: j === 0 })) this.choose(c.f); });
    } else if (this.shown >= L.t.length) { const b = Math.sin(T * 5) * 2; UI.text('▼', x + w - 36, y + h - 20 + b, { size: 14, col: COL.gold2 }); }
    g.globalAlpha = 1;
  }
};
/* helper to make line objects: D('Name','voice','text') */
function D(n, v, t, extra) { return Object.assign({ n, v, t }, extra || {}); }
