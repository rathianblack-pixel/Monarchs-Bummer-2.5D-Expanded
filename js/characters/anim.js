'use strict';
/* =========================================================
   ANIMATION LAYER v2  (loaded after render/style.js so it wraps the final drawChar)
   - ANIM8.walk: an 8-key walk cycle (contact / down / passing / up, both feet) that
     drawChar snaps to instead of a smooth sine, so walking reads as hand-keyed frames.
   - 4-frame breathing idle, 3-frame (sometimes double) blinks, head follow-through:
     handled inside drawChar via ANIM8.
   - Secondary motion: capes, long hair, scarf ends and robe hems are little Verlet chains
     simulated in world space per character (inertia, gravity, wind, a spring back to the
     rest shape), then handed to drawChar as local points (o._cape / o._tail / o._hem).
   Settings.anim === false turns all of it off (legacy sine animation).
   ========================================================= */
const ANIM8 = {
  get on() { return typeof Settings === 'undefined' || Settings.anim !== false; },
  //        legF  liftF liftB  bob   arm
  walk: [[3.0, 0.0, 0.0, 0.0, .60],   // contact (front foot down)
         [2.2, 0.0, 0.9, 0.7, .45],   // down (weight lands, knees bend)
         [0.2, 0.0, 2.3, -.3, .05],   // passing (back foot swings through)
         [-2.0, 0.0, 1.2, -1.2, -.45], // up (push off)
         [-3.0, 0.0, 0.0, 0.0, -.60], // contact (other foot)
         [-2.2, 0.9, 0.0, 0.7, -.45],
         [-0.2, 2.3, 0.0, -.3, -.05],
         [2.0, 1.2, 0.0, -1.2, .45]]
};
const Sec = {
  st: new Map(), clock: 0, lastT: -1,
  sig(o) { return (o.seed | 0) + '|' + (o.hair || '') + '|' + (o.top || '') + '|' + (o.cape || '') + '|' + (o.hairStyle || '') + '|' + (o.s || 1); },
  find(x, y, o) {
    const k = this.sig(o); let arr = this.st.get(k); if (!arr) { arr = []; this.st.set(k, arr); }
    let best = null, bd = 40 * (o.s || 1);
    for (const e of arr) { if (e.used === this.clock) continue; const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } }
    if (!best) { best = { x, y, vx: 0, ch: {}, hem: 0, hv: 0, born: this.clock }; arr.push(best); if (arr.length > 24) arr.shift(); }
    best.used = this.clock; best.seen = T; return best;
  },
  // one chain: n points hanging from a local anchor with a local rest shape
  chain(e, name, x, y, face, s, anchor, rest, segL, dt, stiff) {
    let c = e.ch[name]; const ax = x + anchor[0] * face * s, ay = y + anchor[1] * s;
    if (!c) { c = e.ch[name] = rest.map(r => { const px = ax + r[0] * face * s, py = ay + r[1] * s; return { x: px, y: py, px, py }; }); }
    const wind = (typeof World !== 'undefined' ? World.wind : 0) * 90 + Math.sin(T * 1.7 + e.born) * 14, g = 260;
    const dt2 = dt * dt;
    for (let i = 0; i < c.length; i++) { const p = c[i], tx = ax + rest[i][0] * face * s, ty = ay + rest[i][1] * s, k = stiff * (i + 1) / c.length;
      const vx = (p.x - p.px) * .9, vy = (p.y - p.py) * .9; p.px = p.x; p.py = p.y;
      p.x += vx + ((tx - p.x) * k + wind * (i + 1) / c.length) * dt2; p.y += vy + ((ty - p.y) * k + g * .25) * dt2; }
    for (let it = 0; it < 3; it++) { let qx = ax, qy = ay; for (let i = 0; i < c.length; i++) { const p = c[i], dx = p.x - qx, dy = p.y - qy, d = Math.hypot(dx, dy) || 1, L = segL * s, f = (d - L) / d; p.x -= dx * f; p.y -= dy * f; qx = p.x; qy = p.y; } }
    // keep it behind the body and below the anchor-ish
    const out = [[anchor[0], anchor[1]]];
    for (const p of c) { let lx = (p.x - x) / (face * s), ly = (p.y - y) / s; lx = Math.min(lx, anchor[0] + 1.5); ly = Math.max(ly, anchor[1] - 3); out.push([lx, ly]); }
    return out;
  },
  prep(x, y, o) {
    if (!o || PAINT || !ANIM8.on || o.noSec) return o;
    if (T !== this.lastT) { this.clock++; this.lastT = T; if (this.clock % 120 === 0) for (const [k, arr] of this.st) { const keep = arr.filter(e => T - e.seen < 3); if (keep.length) this.st.set(k, keep); else this.st.delete(k); } }
    const e = this.find(x, y, o), dt = clamp(DT || 1 / 60, 1 / 240, 1 / 30), face = (o.face || 1) < 0 ? -1 : 1, s = o.s || 1;
    const vx = (x - e.x) / dt; e.vx = lerp(e.vx, Math.abs(vx) > 900 ? 0 : vx, .3); e.x = x; e.y = y;
    const n = Object.assign({}, o), A = o.armor || (typeof ARMOR_TIERS !== 'undefined' ? ARMOR_TIERS[o.tier || 0] : null), sit = !!o.sit;
    const topY = sit ? -22 : -23 + (o.crouch || 0) * 3;
    if (!o.rot && !sit) {
      if ((o.cape || (A && A.cape))) n._cape = this.chain(e, 'cape', x, y, face, s, [-3.5, topY + 1], [[-2.5, 5], [-4.5, 10.5], [-6.5, 16], [-8.5, 21.5]], 5.6, dt, 260);
      const hs = o.hairStyle; if ((hs === 'long' || hs === 'longdark') && !o.hat && !o.hood) n._tail = this.chain(e, 'hair', x, y, face, s, [-5, topY - 8], [[-1.2, 3.2], [-2.2, 6.4], [-3, 9.4]], 3.2, dt, 420);
      else if (o.hat === 'scarf') { n._tail = this.chain(e, 'scarf', x, y, face, s, [-4, topY - 1], [[-2.6, 2.4], [-5, 4.6], [-7.4, 6.6]], 3.3, dt, 300); n._tailC = shade(o.hatC || '#a84a5a', -.05); }
      if (o.robe) { const tgt = clamp(-e.vx * face * .03, -3, 3) + Math.sin(T * 2 + e.born) * .25; e.hv = e.hv * .86 + (tgt - e.hem) * 18 * dt; e.hem += e.hv; n._hem = clamp(e.hem, -3.5, 3.5); }
    }
    // a hint of forward lean while moving quickly
    if (Math.abs(e.vx) > 30 && o.lean === undefined && o.walk !== undefined && o.walk !== null) n.lean = clamp(Math.abs(e.vx) / 120, 0, .9);
    return n;
  }
};
(function () { const _dcA = drawChar; drawChar = function (x, y, o) { return _dcA(x, y, Sec.prep(x, y, o)); }; })();
