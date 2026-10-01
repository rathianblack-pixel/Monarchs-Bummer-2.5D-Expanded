'use strict';
/* =========================================================
   TWEEN / TIMELINE SYSTEM
   ========================================================= */
const Tweens = {
  list: [],
  to(obj, props, dur, ease = Ease.outQ, delay = 0, done) {
    const tw = { obj, from: {}, props, dur, ease, t: -delay, done };
    this.list.push(tw); return tw;
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const tw = this.list[i]; const wasNeg = tw.t < 0; tw.t += dt;
      if (tw.t < 0) continue;
      if (wasNeg || !tw.started) { tw.started = true; for (const k in tw.props) tw.from[k] = tw.obj[k]; }
      const p = clamp(tw.t / tw.dur, 0, 1), e = tw.ease(p);
      for (const k in tw.props) tw.obj[k] = lerp(tw.from[k], tw.props[k], e);
      if (p >= 1) { this.list.splice(i, 1); tw.done && tw.done(); }
    }
  },
  clear() { this.list.length = 0; }
};
// Timeline: sequence of timed callbacks (in scene-time, affected by hit-stop)
class Timeline {
  constructor() { this.t = 0; this.ev = []; this.running = false; }
  at(time, fn) { this.ev.push({ time, fn, done: false }); return this; }
  start() { this.t = 0; this.running = true; this.ev.sort((a, b) => a.time - b.time); return this; }
  update(dt) { if (!this.running) return; this.t += dt; let pending = false; for (const e of this.ev) { if (!e.done && this.t >= e.time) { e.done = true; e.fn(); } if (!e.done) pending = true; } if (!pending) this.running = false; }
}
// simple scheduled callbacks (real time)
const Later = { list: [], add(t, fn) { this.list.push({ t, fn }); }, update(dt) { for (let i = this.list.length - 1; i >= 0; i--) { const l = this.list[i]; l.t -= dt; if (l.t <= 0) { this.list.splice(i, 1); l.fn(); } } }, clear() { this.list.length = 0; } };
