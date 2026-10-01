'use strict';
/* =========================================================
   DUST MOTES  (Part 1 — atmosphere)
   Slow floating specks in screen space with depth parallax. They catch the light:
   motes inside a light shaft (cfg.shafts) or near the sun glint brighter, at night
   they turn into faint cool flecks.  HD scenes opt in with cfg.motes in HD.begin
   (true or { n, col, a, rise }); 2D/LOW scenes can call Motes.draw(ctx, cfg, camX, camY).
   Settings.motes === false turns them off.
   ========================================================= */
const Motes = {
  list: [], lx: null, ly: null,
  ensure(n) { while (this.list.length < n) this.list.push({ x: rnd(CONFIG.LW), y: rnd(CONFIG.LH), z: rnd(.25, 1), p: rnd(TAU), s: rnd(.6, 1.4) }); },
  draw(c, cfg, camX = 0, camY = 0) {
    if (Settings.motes === false || !cfg) return; const o = cfg === true ? {} : cfg, lvl = Gfx.level;
    const N = Math.round((o.n || 70) * (lvl >= 2 ? 1 : lvl >= 1 ? .6 : .35)); this.ensure(N);
    const nk = typeof World !== 'undefined' ? World.nightK() : 0, rain = typeof World !== 'undefined' ? World.rain : 0;
    if (rain > .6 && !o.indoor) return;
    const dx = this.lx === null ? 0 : camX - this.lx, dy = this.ly === null ? 0 : camY - this.ly; this.lx = camX; this.ly = camY;
    const col = o.col || (nk > .5 ? '#c8d8ff' : '#fff2c8'), baseA = (o.a || .5) * (1 - nk * .45) * (1 - rain * .6);
    const sh = o.shafts, sx = sh ? sh[1] : -999, sy = sh ? sh[2] : -999, st = sh ? sh[0] : 0, wind = (typeof World !== 'undefined' ? World.wind : 0);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.fillStyle = col;
    for (let i = 0; i < N; i++) {
      const m = this.list[i];
      // drift: lazy brownian float, gentle rise, wind push, parallax against camera motion (near motes move more)
      m.p += DT * (.4 + m.s * .3);
      m.x += (Math.sin(m.p * .7 + i) * 3 + wind * 14 * m.z) * DT - (Math.abs(dx) < 80 ? dx : 0) * m.z * .6;
      m.y += (Math.cos(m.p * .53 + i * 1.7) * 2.4 - (o.rise || 1.6) * m.s) * DT - (Math.abs(dy) < 80 ? dy : 0) * m.z * .45;
      if (m.x < -4) m.x += CONFIG.LW + 8; if (m.x > CONFIG.LW + 4) m.x -= CONFIG.LW + 8; if (m.y < -4) m.y += CONFIG.LH + 8; if (m.y > CONFIG.LH + 4) m.y -= CONFIG.LH + 8;
      let a = baseA * (.35 + .65 * (.5 + .5 * Math.sin(m.p * 1.9 + i))) * (.5 + m.z * .5);
      if (st > 0) { const ang = Math.atan2(m.y - sy, m.x - sx), band = Math.pow(.5 + .5 * Math.sin(ang * 26 + T * .08), 6); a *= 1 + band * st * 3.2; }
      if (a < .02) continue; c.globalAlpha = Math.min(1, a);
      const r = m.z > .8 ? 2 : 1; c.fillRect(Math.round(m.x), Math.round(m.y), r, r);
      if (m.z > .9 && a > .35) { c.globalAlpha = a * .25; c.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 1, r + 2, r + 2); }
    }
    c.restore();
  }
};
// HD: draw the motes into the screen layer right before the frame is composed
(function () {
  const rd = HD.render;
  HD.render = function () { const k = this.cfg; if (k && k.motes && Gfx.level >= 1) { try { Motes.draw(this.scrx, Object.assign({}, k.motes === true ? {} : k.motes, { shafts: Gfx.level >= 2 && Settings.postFX !== false ? k.shafts : null }), k.tx || 0, k.ty || 0); } catch (e) { console.error(e); } } return rd.apply(this, arguments); };
})();
// sun position (low-res screen px) + shaft strength for a time of day: low sun = long warm shafts; none at night / heavy rain
function sunShafts(o = {}) {
  if (typeof World === 'undefined') return null; const t = World.time, nk = World.nightK(); if (nk > .85 || World.rain > .7) return null;
  const morning = t < 13, k = morning ? clamp(1 - Math.abs(t - 8.5) / 4.5, 0, 1) : clamp(1 - Math.abs(t - 16.5) / 4, 0, 1);
  const s = (o.base || .55) * (.35 + .65 * k) * (1 - nk) * (1 - World.rain * .8) * (1 - World.fog * .3) + World.fog * .25;
  const x = morning ? (o.x0 === undefined ? -60 : o.x0) : (o.x1 === undefined ? CONFIG.LW + 60 : o.x1), y = o.y === undefined ? -50 : o.y;
  const warm = t < 9.5 || t > 15.5; return [s, x, y, o.col || (warm ? [1, .78, .5] : [1, .95, .8]), o.decay || .9];
}
// per-arena light shafts / motes / shimmer for 2.5D combat
const COMBAT_FX = {
  0: { sh: [.5, 70, -40, [1, .84, .58]], m: { n: 50 } },
  1: { sh: [.85, 230, -70, [.86, 1, .6]], m: { n: 70, col: '#e8ffb0', a: .55 } },
  2: { sh: [.38, 520, -40, [.7, .8, 1]], m: { n: 60, col: '#b8ffe0', a: .45, rise: .6 } },
  3: { sh: [.5, 120, -60, [.95, 1, .75]], m: { n: 50 } },
  4: { sh: [.32, 330, -30, [.85, .5, 1]], m: { n: 70, col: '#ffb060', a: .7, rise: 16 }, shim: [.8, 0, 150, 640, 360] },
  5: { sh: [.55, 80, -50, [1, .9, .7]], m: { n: 40, rise: 3 } },
  6: { sh: [.95, 320, -90, [.5, .9, 1]], m: { n: 70, col: '#a8e8ff', a: .5, rise: 11 }, shim: [.35, 0, 0, 640, 360] },
  7: { sh: [.42, 520, -50, [.82, .92, 1]], m: { n: 90, col: '#ffffff', a: .6, rise: -9 } },
  8: { sh: [.65, 160, -80, [1, .95, .85]], m: { n: 45, rise: 5 } },
  9: { sh: [.45, 320, -60, [1, .7, .88]], m: { n: 60, col: '#ffc8e8', a: .5 } }
};
function combatShafts(area, raid) { if (raid) return sunShafts({ base: .5, x0: 60 }); const f = COMBAT_FX[area]; return f ? f.sh : null; }
function combatMotes(area, raid) { if (raid) return { n: 40 }; const f = COMBAT_FX[area]; return f ? f.m : { n: 40 }; }
function combatShimmer(sc) {
  if (!HD.cfg) return; const f = !sc.raid && COMBAT_FX[sc.area]; if (f && f.shim) HD.cfg.shimmer = f.shim.slice();
  // a hot spell in flight / being charged: shimmer follows it
  const hot = sc.proj && sc.proj.find(p => p.type === 'fireball' || p.type === 'flame');
  if (hot) { const p = HD.toScreen(hot.x, hot.y); HD.cfg.shimmer = [1, p[0] - 40, p[1] - 50, p[0] + 40, p[1] + 26]; }
  else if (S && S.cls === 'fire' && sc.P && (sc.P.pose === 'cast') && sc.mg) { const p = HD.toScreen(sc.P.x + 18, CGY - 60); HD.cfg.shimmer = [.9, p[0] - 30, p[1] - 46, p[0] + 30, p[1] + 20]; }
}
