'use strict';
/* =========================================================
   MONSTER DETAIL PASS
   Wraps every non-humanoid creature rig (MON.*) with an "under" pass (spines, tails, legs
   that sit behind the body) and an "over" pass (fangs, claws, glowing eyes, scars, texture,
   drool). Same local space as the rigs: facing +x, feet at the origin, units * s.
   The base rigs and their animation are untouched; set Settings.monsterDetail = false to
   see the old look. Glows are skipped while a hit-flash silhouette (PAINT) is active.
   ========================================================= */
const MFX = {
  IV: '#efe6cc', IVD: '#b8ab88', BLD: '#7a1a24', SCAR: '#b06a6a',
  on() { return typeof Settings === 'undefined' || Settings.monsterDetail !== false; },
  // alpha helper that respects the dodge ghost / fade alpha the caller already set
  alpha(k, fn) { const a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * k; try { fn(); } finally { ctx.globalAlpha = a0; } },
  glow(b, col, x, y, r, k = .35) { if (PAINT) return; MFX.alpha(k, () => b.E(col, x, y, r, r)); },
  // a fang: triangle from (x,y) pointing (dx,dy), w = base half-width
  fang(b, x, y, dx, dy, w = .9, col = MFX.IV) { b.Poly(OL, [[x - w - .5, y - .3], [x + dx, y + dy + (dy > 0 ? .6 : -.6)], [x + w + .5, y - .3]]); b.Poly(col, [[x - w, y], [x + dx, y + dy], [x + w, y]]); },
  claw(b, x, y, dir = 1, len = 2) { b.Ln(OL, x, y, x + dir * len, y + len * .6, 1.6); b.Ln(MFX.IV, x, y, x + dir * len * .8, y + len * .45, .8); },
  spike(b, x, y, h, lean, col, w = 1.4) { b.Poly(OL, [[x - w - .7, y + 1], [x + lean, y - h - .8], [x + w + .7, y + 1]]); b.Poly(col, [[x - w, y + 1], [x + lean, y - h], [x + w, y + 1]]); },
  // point on the top edge of an ellipse (cx,cy,rx,ry) at x
  top(cx, cy, rx, ry, x) { const k = clamp((x - cx) / rx, -1, 1); return cy - ry * Math.sqrt(1 - k * k); },
  drip(b, x, y, len, t, ph, col) { const k = (t * .8 + ph) % 1; b.L(col, x, y, 1, 1 + k * len); if (k > .7) b.L(col, x, y + 1 + len + (k - .7) * 8, 1, 1); },
  scar(b, x0, y0, x1, y1) { b.Ln(MFX.SCAR, x0, y0, x1, y1, 1); const n = 3; for (let i = 1; i <= n; i++) { const k = i / (n + 1), x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k; b.L(shade(MFX.SCAR, -.35), x - .5, y - 1, 1, 2); } },
  // slit-pupil glowing eye
  eye(b, x, y, col, w = 2, h = 2, slit = true) { MFX.glow(b, col, x + w / 2, y + h / 2, Math.max(w, h) + 1.2, .3); b.L(col, x, y, w, h); if (slit) b.L(OL, x + w / 2 - .25, y, .5 > 0 && w > 1.5 ? 1 : .5, h); b.L('#ffffff', x, y, .5 + (w > 1.5 ? .5 : 0), .5 + (h > 1.5 ? .5 : 0)); },
  wrap(arch, under, over) {
    const base = MON[arch]; if (!base) return;
    MON[arch] = function (s, st, c) {
      if (!MFX.on()) return base(s, st, c);
      const b = monsterBase(s);
      if (under) try { under(b, s, st, c || {}); } catch (e) { console.error('MFX', arch, e); }
      base(s, st, c);
      if (over) try { over(b, s, st, c || {}); } catch (e) { console.error('MFX', arch, e); }
    };
  }
};

/* ---------------- ACT I ---------------- */
// Slime Rat: bristled spine, oozing pustules, yellow incisors, red glare, claws, slime drips
MFX.wrap('rat', (b, s, st, c) => {
  const t = st.t, br = Math.sin(t * 4) * .6, body = c.body || '#7a8a6a', dk = shade(body, -.4);
  for (let i = 0; i < 8; i++) { const x = -9 + i * 2.4, y = MFX.top(0, -8 + br, 11, 7, x); MFX.spike(b, x, y + 1.5, 2.5 + (i % 2) * 1.6 + Math.sin(t * 3 + i) * .3, -1.2, dk, 1); }
}, (b, s, st, c) => {
  const t = st.t, br = Math.sin(t * 4) * .6, hx = 11 + (st.atk || 0) * 3, hy = -10 + br, ph = st.walk || t * 6;
  // pustules + mange
  for (const [x, y, r] of [[-5, -9, 1.6], [1, -6, 1.2], [-1, -12, 1.1], [5, -9, 1]]) { b.E(OL, x, y + br, r + .5, r + .4); b.E('#9ae070', x, y + br, r, r * .9); b.L('#e8ffd0', x - .5, y + br - r * .6, 1, .5 + .5); }
  MFX.scar(b, -7, -12 + br, -2, -7 + br);
  // torn ear + glare
  b.L(OL, hx - 3, hy - 6, 1, 1); MFX.eye(b, hx + 1.5, hy - 2.5, st.low ? '#ff8040' : '#ff2a20', 2, 2);
  b.Ln(OL, hx, hy - 4.5, hx + 4, hy - 3, 1.2);
  // big yellowed incisors
  MFX.fang(b, hx + 6.5, hy + 2, 0, 3.4, .8, '#e8d890'); MFX.fang(b, hx + 8, hy + 2, .2, 2.8, .7, '#e8d890');
  // claws on the feet
  MFX.claw(b, -3 + Math.sin(ph) * 2, -1, 1, 1.8); MFX.claw(b, 8 - Math.sin(ph) * 2, -1, 1, 1.8);
  for (let i = 0; i < 3; i++) MFX.drip(b, -6 + i * 5, -2 + br, 2.5, t, i * .37, 'rgba(120,230,110,.85)');
});

// Angry Goose: hackled neck, serrated "tooth" beak (geese really have them), blood-red eye, ragged black primaries, talons
MFX.wrap('goose', (b, s, st, c) => {
  const t = st.t, br = Math.sin(t * 3) * .6;
  for (let i = 0; i < 4; i++) { const y = -16 + br + i * 1.6; b.Poly(OL, [[-9, y - 1], [-19 - i * 1.5, y - 3 + i], [-10, y + 1.5]]); b.Poly(i % 2 ? '#3a3a42' : '#4a4a54', [[-9, y - .5], [-18 - i * 1.5, y - 2.5 + i], [-10, y + 1]]); }
}, (b, s, st, c) => {
  const t = st.t, br = Math.sin(t * 3) * .6, str = st.atk || 0, low = st.low, lp = st.walk || 0;
  const nx0 = 7, ny0 = -17 + br, nx1 = 9 + str * 16 + (low ? 2 : 0), ny1 = -31 + br + str * 12 + (low ? 4 : 0);
  // hackles: ruffled spiky feathers down the back of the neck
  const dx = nx1 - nx0, dy = ny1 - ny0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, px = uy, py = -ux; // px,py = back side
  for (let i = 1; i < 6; i++) { const k = i / 6.5, x = nx0 + dx * k + px * 1.8, y = ny0 + dy * k + py * 1.8; b.Poly(OL, [[x - ux * 1.6, y - uy * 1.6], [x + px * 3.4 - ux * 2, y + py * 3.4 - uy * 2], [x + ux * 1.6, y + uy * 1.6]]); b.Poly('#e2ddd2', [[x - ux * 1.2, y - uy * 1.2], [x + px * 2.8 - ux * 1.8, y + py * 2.8 - uy * 1.8], [x + ux * 1.2, y + uy * 1.2]]); }
  // serrated beak + tongue spikes when it hisses
  const bw = 6 + str * 2; for (let i = 0; i < 4; i++) { b.L('#ffffff', nx1 + 5 + i * (bw / 4), ny1 + 1, .5 + .5, 1); }
  if (str > .2) { b.L('#9a2030', nx1 + 4, ny1 + 1, bw - 1, 1 + str); for (let i = 0; i < 3; i++) b.L('#ffd8d8', nx1 + 5 + i * 2, ny1 + 1.5 + str, 1, .5 + .5); }
  MFX.eye(b, nx1 + .5, ny1 - 3.5, '#ff3020', 2, 2, false); b.L(OL, nx1 + 1.2, ny1 - 3, 1, 1);
  b.Ln(OL, nx1 - 2.5, ny1 - 6.5, nx1 + 4, ny1 - 3.5, 1.6);
  // battle scars + talons
  MFX.scar(b, -5, -17 + br, 1, -11 + br);
  MFX.claw(b, -1 + Math.sin(lp) * 2, 0, 1, 1.4); MFX.claw(b, 6 - Math.sin(lp) * 2, 0, 1, 1.4);
});

// Wolves (wolf / raccoon / zombie / timber / gloom / snow): hackles, real fangs, brow, claws, fur, per-variant horror
MFX.wrap('quad', (b, s, st, c) => {
  const t = st.t, v = c.variant || 'wolf', low = st.low, body = c.body || '#6a6a72', dk = shade(body, -.38);
  const bh = v === 'raccoon' ? .7 : 1, y0 = -14 * bh + (st.crouch || 0) * 3, br = Math.sin(t * (low ? 5 : 3)) * .7;
  const col = v === 'timber' ? '#4a2e1a' : v === 'zombie' ? '#4a5a48' : v === 'gloom' ? '#241c34' : c.eye === '#60c0ff' ? '#b8d8f0' : dk;
  const n = v === 'raccoon' ? 7 : 9;
  for (let i = 0; i < n; i++) { const x = -11 + i * (22 / n), y = MFX.top(0, y0 + br, 14, 7.5 * bh, x); const h = (v === 'timber' ? 4.5 : v === 'raccoon' ? 2.2 : 3.2) + (i % 2) * 1.6 + (low || st.atk ? 1.2 : 0); MFX.spike(b, x, y + 1.6, h, -1.6 - (i % 2) * .6, col, v === 'timber' ? 1.2 : 1); }
  if (c.eye === '#60c0ff') for (let i = 0; i < 4; i++) { const x = -6 + i * 4, y = MFX.top(0, y0 + br, 14, 7.5, x); b.Poly('#e8f8ff', [[x - .8, y], [x - .2, y - 5 - (i % 2) * 2], [x + .6, y]]); }
}, (b, s, st, c) => {
  const t = st.t, v = c.variant || 'wolf', low = st.low, body = c.body || '#6a6a72', dk = shade(body, -.3), lt = shade(body, .25);
  const bh = v === 'raccoon' ? .7 : 1, y0 = -14 * bh + (st.crouch || 0) * 3, br = Math.sin(t * (low ? 5 : 3)) * .7, ph = st.walk !== undefined ? st.walk : 0, a = st.atk || 0;
  const hx = 15 + a * 4, hy = y0 - 5 * bh + br - a * 2 + (low ? 2 : 0), jaw = a * 3;
  // fur strokes
  const R = RNG(31 + v.length); for (let i = 0; i < 11; i++) { const x = R.r(-11, 9), y = y0 + br + R.r(-4, 3) * bh; b.Ln(i % 3 ? dk : lt, x, y, x - 2.2, y + .8, 1); }
  if (v !== 'zombie' && v !== 'gloom') MFX.scar(b, 3, y0 - 5 + br, 7, y0 + 1 + br);
  // heavy brow + glowing eye
  const eyeC = c.eye || (v === 'gloom' || v === 'timber' ? '#c070ff' : v === 'zombie' ? '#c0ff60' : v === 'raccoon' ? '#ff4030' : '#ffcc30');
  MFX.glow(b, eyeC, hx + 3, hy - 1.5, 3.4, .32); b.L(eyeC, hx + 1.5, hy - 2.5, 3, 1.5); b.L('#ffffff', hx + 3.5, hy - 2.5, 1, 1);
  b.Ln(OL, hx - 1, hy - 4.5, hx + 6, hy - 2.5, 1.8);
  // snarl: wrinkled muzzle, gum line, upper + lower fangs
  b.Ln(dk, hx + 5, hy - 1.5, hx + 7, hy - .5, 1); b.Ln(dk, hx + 7, hy - 1.5, hx + 9, hy - .5, 1);
  b.L('#8a2a3a', hx + 4, hy + 3, 8, 1);
  MFX.fang(b, hx + 6, hy + 3.5, 0, 2.8 + jaw * .4, .7); MFX.fang(b, hx + 10, hy + 3.5, .2, 3.4 + jaw * .5, .8);
  MFX.fang(b, hx + 8, hy + 4 + jaw, 0, -2.4, .6);
  if (a > .2 || low || v === 'raccoon') MFX.alpha(.8, () => { const k = (t * 1.3) % 1; b.L(v === 'raccoon' ? '#f4f8ff' : '#c8e0f0', hx + 8, hy + 5 + jaw, 1, 1.5 + k * 3); });
  // claws on the front paws (same maths as the rig's legs)
  for (const [lx, off] of [[-6, Math.PI * .5], [9, Math.PI * 1.5]]) { const lift = Math.max(0, Math.sin(ph + off)) * 2, sw = Math.cos(ph + off) * 2.5; MFX.claw(b, lx + sw + 2.6, -1 - lift, 1, 1.6); MFX.claw(b, lx + sw + 1.2, -1 - lift, 1, 1.4); }
  // ---- variants ----
  if (v === 'raccoon') { // rabid: foam, mange, bloodshot
    for (let i = 0; i < 4; i++) { const k = Math.sin(t * 6 + i * 1.7); b.E('#f4f8ff', hx + 10 + i * .8, hy + 4.5 + jaw + (i % 2), 1.1 + k * .3, .9); }
    for (const [x, y] of [[-6, -1], [2, 1]]) { b.E('#c89090', x, y0 + y + br, 2, 1.2); b.L('#a06868', x - 1, y0 + y + br, 1, 1); }
    b.L('#ff8080', hx + 1.5, hy - 1, 1, .5 + .5);
  }
  if (v === 'zombie') { // stitched, rotting, flies
    b.Ln('#3a2a2a', -9, y0 - 3 + br, -2, y0 + 2 + br, 1); for (let i = 0; i < 4; i++) b.Ln('#d8d0b8', -8.5 + i * 2, y0 - 3.5 + i * 1.4 + br, -7.5 + i * 2, y0 - 1.5 + i * 1.4 + br, .8);
    b.E('#4a1a20', 6, y0 + 1 + br, 2.4, 1.6); b.L('#e8e0cc', 5, y0 + 1 + br, 1, 1); b.L('#e8e0cc', 7, y0 + 1 + br, 1, 1);
    b.L('#e8e0cc', hx + 3, hy + 3.5 + jaw, 8, 1); for (let i = 0; i < 3; i++) b.L(OL, hx + 4 + i * 2.5, hy + 3.5 + jaw, .5 + .5, 1);
    MFX.drip(b, -3, y0 + 4 + br, 3, t, .2, '#6a8a3a');
    for (let i = 0; i < 2; i++) { const a2 = t * 7 + i * 3; b.L(OL, hx - 4 + Math.cos(a2) * 7, hy - 9 + Math.sin(a2 * 1.3) * 3, 1, 1); }
  }
  if (v === 'timber') { // branch antlers, moss, glowing knots
    for (const [ox, oy, dx, dy] of [[-2, -6, -5, -12], [1, -6, 2, -13]]) { b.Ln(OL, hx + ox, hy + oy, hx + ox + dx, hy + oy + dy, 2.6); b.Ln('#6a4a2a', hx + ox, hy + oy, hx + ox + dx, hy + oy + dy, 1.4); b.Ln('#6a4a2a', hx + ox + dx * .5, hy + oy + dy * .5, hx + ox + dx * .5 - 3, hy + oy + dy * .5 - 3, 1); b.L('#6aa040', hx + ox + dx - 1, hy + oy + dy - 1, 2, 2); }
    for (const [x, y] of [[-7, -5], [1, -6], [6, -4]]) { b.E('#5a8a3a', x, y0 + y + br, 2.4, 1); b.L('#8ac050', x - 1, y0 + y - .5 + br, 1, .5 + .5); }
    for (const [x, y] of [[-4, 0], [4, 2]]) { MFX.glow(b, '#c070ff', x, y0 + y + br, 2, .4); b.E(OL, x, y0 + y + br, 1.2, 1); b.L('#e0a0ff', x - .5, y0 + y - .5 + br, 1, 1); }
  }
  if (v === 'gloom') { // brow horns, ember eye trail, spectral teeth glow
    for (const [ox, dx] of [[-3, -6], [1, -3]]) { b.Poly(OL, [[hx + ox - 1.4, hy - 4], [hx + ox + dx, hy - 12], [hx + ox + 1.6, hy - 4]]); b.Poly('#4a3a5a', [[hx + ox - .8, hy - 4.3], [hx + ox + dx + .4, hy - 11], [hx + ox + 1, hy - 4.3]]); }
    MFX.alpha(.6, () => { for (let i = 1; i < 6; i++) b.L('#e080ff', hx + 1.5 - i * 1.6, hy - 2.5 + Math.sin(t * 6 + i) * .6, 1.2, 1); });
    MFX.glow(b, '#b060ff', hx + 8, hy + 4, 4, .25);
  }
  if (c.eye === '#60c0ff') { // snow wolf: frosted muzzle + breath
    b.L('#ffffff', hx + 4, hy - 1, 6, .5 + .5); const k = (t * .6) % 1; if (!PAINT) MFX.alpha(.5 * (1 - k), () => b.E('#e8f4ff', hx + 13 + k * 6, hy + 2 - k * 3, 1.5 + k * 3, 1 + k * 2));
  }
});

// Sprites (bullying / misdirection): veined insect wings, black-sclera eyes, needle grin, antennae, pointed ears, stinger
MFX.wrap('sprite', null, (b, s, st, c) => {
  const t = st.t, fl = Math.sin(t * 3) * 3, y = -26 + fl, flap = Math.abs(Math.sin(t * 18)), a = st.atk || 0, skin = c.skin || '#c8f0b0';
  const ec = c.variant === 'misdirect' ? '#ffb020' : '#ff50b0';
  MFX.alpha(.7, () => { b.Ln(OL, -4, y - 5, -11, y - 8 - flap * 3, .8); b.Ln(OL, -5, y - 4, -12, y - 4 - flap * 2, .8); b.Ln(OL, -4, y - 3, -8, y - 1 - flap, .8); });
  // pointed ears + antennae
  b.Poly(OL, [[-4, y - 8], [-9, y - 12], [-4, y - 5]]); b.Poly(skin, [[-4, y - 7.5], [-8, y - 11], [-4, y - 5.5]]);
  b.Ln(OL, 0, y - 11, -2, y - 17, 1); b.Ln(OL, 3, y - 11, 6, y - 17, 1); MFX.glow(b, ec, -2, y - 17.5, 1.8, .45); b.L(ec, -2.5, y - 18, 1.5, 1.5); b.L(ec, 5.5, y - 18, 1.5, 1.5);
  // black eyes with a glowing pinprick
  for (const ex of [1.5, 4.5]) { b.E(OL, ex + .5, y - 6.5, 1.4, 1.6); b.L(ec, ex + .5, y - 7, .5 + .5, 1); }
  // needle grin
  b.L(OL, 1, y - 3.5, 5.5, 1.5); for (let i = 0; i < 4; i++) b.Poly('#ffffff', [[1.3 + i * 1.3, y - 3.5], [1.8 + i * 1.3, y - 2.2], [2.3 + i * 1.3, y - 3.5]]);
  // claws on the pointing hand + stinger
  const hx = 8 + a * 5, hy = y - 3 - a * 3; MFX.claw(b, hx, hy, 1, 1.5); MFX.claw(b, hx - .5, hy + 1, 1, 1.3);
  b.Poly(OL, [[-1.5, y + 6], [-6, y + 14 + Math.sin(t * 4)], [.5, y + 7]]); b.Poly(shade(c.body || '#6ac070', -.3), [[-1.2, y + 6.5], [-5, y + 13 + Math.sin(t * 4)], [0, y + 7.2]]);
});

// Grave Wraith: skeletal claw, skull in the hood, eye trails, torn cloak, ghost ribs, wisps
MFX.wrap('wraith', (b, s, st, c) => {
  const t = st.t, y = -12 + Math.sin(t * 2) * 3;
  if (!PAINT) MFX.alpha(.35, () => { for (let i = 0; i < 4; i++) { const k = (t * .4 + i * .25) % 1; b.E(c.eye || '#90ffd0', -6 + i * 4 + Math.sin(t * 2 + i) * 2, y + 10 + k * 8, 2.4 * (1 - k) + .5, 1.6 * (1 - k) + .4); } });
}, (b, s, st, c) => {
  const t = st.t, y = -12 + Math.sin(t * 2) * 3, gl = c.eye || '#90ffd0', ar = (st.atk || 0) * 10, cloak = c.body || '#3a4a5a';
  // ghostly ribs through the cloak
  MFX.alpha(.4, () => { for (let i = 0; i < 4; i++) { b.Ln('#c8e8e0', -4, y - 12 + i * 3, 4, y - 11 + i * 3, 1); } b.Ln('#c8e8e0', 0, y - 13, 0, y - 2, 1); });
  // tears in the cloak
  for (const [x, yy, r] of [[-6, -2, 1.6], [3, 4, 1.3], [-2, 7, 1.1]]) { b.E(OL, x, y + yy, r + .4, r * .8 + .3); b.E('#0a0810', x, y + yy, r, r * .7); }
  // skull face in the hood
  b.E('#c8c8b8', 3, y - 17, 3.4, 3.6); b.L('#0a0810', 1, y - 18.5, 2, 2); b.L('#0a0810', 4.5, y - 18.5, 2, 2); b.L('#0a0810', 3, y - 16, 1, 1);
  b.L('#0a0810', 1.2, y - 14.6, 4, 1); for (let i = 0; i < 4; i++) b.L('#c8c8b8', 1.2 + i * 1, y - 14.6, .5, 1);
  MFX.glow(b, gl, 3.5, y - 17.5, 5, .3); b.L(gl, 1.5, y - 18, 1, 1); b.L(gl, 5, y - 18, 1, 1);
  MFX.alpha(.55, () => { for (let i = 1; i < 6; i++) b.L(gl, 1.5 - i * 1.5, y - 18 + Math.sin(t * 5 + i) * .8, 1, 1); });
  // skeletal claw at the end of the sleeve
  const hx = 15 + ar, hy = y - 6.5 - ar * .5;
  for (let i = 0; i < 3; i++) { const dy = -1.5 + i * 1.6; b.Ln(OL, hx, hy + dy * .4, hx + 4.5, hy + dy, 1.6); b.Ln('#d8d8c8', hx, hy + dy * .4, hx + 4.2, hy + dy, .8); b.L(OL, hx + 4.5, hy + dy, 1, 1); }
  b.Ln(shade(cloak, -.4), 8, y - 11, 14 + ar, y - 8 - ar * .5, 1);
});

// Rune Mimic: spider legs, an eye in the lock, teeth in the seam, a long tongue, claw marks
MFX.wrap('mimic', (b, s, st, c) => {
  const t = st.t, hop = st.hop || 0, y = -hop, ph = t * 7;
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
    const bx = sd * (8 - i * 3), by = y - 5, kx = sd * (17 + i * 2), ky = y - 12 + i * 2 + Math.sin(ph + i * 2 + (sd > 0 ? 1 : 0)) * 1.5, fx = sd * (19 + i * 3), fy = 0;
    b.Ln(OL, bx, by, kx, ky, 2.4); b.Ln(OL, kx, ky, fx, fy, 2.2); b.Ln('#4a2a2a', bx, by, kx, ky, 1.2); b.Ln('#4a2a2a', kx, ky, fx, fy, 1); b.L('#8a5a5a', kx - .5, ky - .5, 1, 1); b.L(MFX.IV, fx - .5, fy - 1, 1, 1);
  }
}, (b, s, st, c) => {
  const t = st.t, open = Math.max(st.atk || 0, (Math.sin(t * 1.3) > .92 ? .3 : 0)), hop = st.hop || 0, y = -hop;
  // eyeball where the rune was
  const blink = Math.sin(t * .7) > .97; b.E(OL, 0, y - 7.5, 4, 3.2);
  if (!blink) { b.E('#f0e6d8', 0, y - 7.5, 3.4, 2.6); b.Ln('#c04050', -3, y - 8, -1.5, y - 7.5, .5 + .5); b.E('#a01828', 1.2, y - 7.5, 1.7, 1.7); b.L(OL, .9, y - 9, .5 + .5, 3); b.L('#ffffff', .5, y - 8.5, .5 + .5, .5 + .5); }
  else b.L('#5a3418', -3, y - 7.5, 6, 1);
  // claw marks + rivets
  for (let i = 0; i < 3; i++) b.Ln('#3a2010', -10 + i * 2, y - 13, -7 + i * 2, y - 4, .8);
  for (const x of [-11, 11]) for (const yy of [-14, -2]) b.L('#d8d8e0', x - .5, y + yy, 1, 1);
  // teeth poking out of the seam even when shut
  if (open < .2) for (let i = 0; i < 6; i++) MFX.fang(b, -10 + i * 4, y - 15.6, 0, 2.6, .8);
  else { // long tongue + drool
    const la = open * 1.1, tx = 8 + open * 10, ty = y - 15 + Math.sin(t * 6) * 2;
    b.Ln(OL, 2, y - 16, tx, ty, 3.6); b.Ln('#c04060', 2, y - 16, tx, ty, 2.2); b.E('#c04060', tx + 1, ty + 1, 2, 1.6); b.L('#e07090', 3, y - 16.5, tx - 4, .5 + .5);
    MFX.drip(b, tx, ty + 2, 3, t, 0, 'rgba(220,200,230,.8)');
  }
});

// Pressure Plate Gremlin: horn nubs, veined bat ears, slit eyes, fangs, claws, spiked tail, warts
MFX.wrap('gremlin', (b, s, st, c) => {
  const t = st.t, body = c.body || '#8a6aa8', w = Math.sin(t * 3) * 2;
  b.Ln(OL, -4, -10, -10, -6 + w * .3, 2.6); b.Ln(OL, -10, -6 + w * .3, -15, -10 + w, 2.4); b.Ln(body, -4, -10, -10, -6 + w * .3, 1.2); b.Ln(body, -10, -6 + w * .3, -15, -10 + w, 1.1);
  b.Poly(OL, [[-15, -13 + w], [-19, -9 + w], [-14, -7.5 + w]]); b.Poly(shade(body, -.35), [[-15, -12 + w], [-18, -9 + w], [-14.5, -8.3 + w]]);
}, (b, s, st, c) => {
  const t = st.t, bob = Math.abs(Math.sin(t * 5)) * 2, body = c.body || '#8a6aa8', hy = -23 - bob * .5, dk = shade(body, -.35), up = st.atk || 0, py = -38 - bob - up * 6;
  b.Ln(dk, -6, hy - 1.5, -12, hy - 5.5, 1); b.Ln(dk, 6, hy - 1.5, 12, hy - 5.5, 1); b.Ln(dk, -8, hy - 2, -10, hy - 1, .8); b.Ln(dk, 8, hy - 2, 10, hy - 1, .8);
  for (const x of [-3, 3]) { b.Poly(OL, [[x - 1.6, hy - 5], [x * 1.4, hy - 9.5], [x + 1.6, hy - 5]]); b.Poly('#d8c8a0', [[x - 1, hy - 5.2], [x * 1.4, hy - 8.8], [x + 1, hy - 5.2]]); }
  MFX.glow(b, '#ffe040', 3.5, hy - 1, 4.5, .22); b.L(OL, 1.6, hy - 2, .5 + .5 > 1 ? 1 : 1, 2); b.L(OL, 5.6, hy - 2, 1, 2); b.L('#ffffff', 1, hy - 2, .5 + .5 > 1 ? 1 : .5, .5 + .5);
  b.Ln(OL, -.5, hy - 4, 3, hy - 3, 1.2); b.Ln(OL, 8, hy - 4, 4.5, hy - 3, 1.2);
  MFX.fang(b, 1.5, hy + 4.6, 0, 2.6, .7); MFX.fang(b, 6.5, hy + 4.6, 0, 2.6, .7);
  for (const [x, y] of [[-2, -14], [2, -10], [-3, hy + 3]]) { b.E(dk, x, y - bob * .3, 1, .8); b.L(shade(body, .3), x - .5, y - .6 - bob * .3, .5 + .5, .5); }
  for (const sd of [-1, 1]) { MFX.claw(b, sd * 7, py + 4, sd, 1.5); MFX.claw(b, sd * 5, 0, sd, 1.4); }
});

// Doom Gauntlet: cracked with living rune-light, knuckle spikes, an eye on the back of the hand, dripping void
MFX.wrap('gauntlet', (b, s, st, c) => {
  const t = st.t, y = -24 + Math.sin(t * 2.5) * 3, g = c.glow || '#a050ff';
  if (!PAINT) MFX.alpha(.45, () => { for (let i = 0; i < 3; i++) { const k = (t * .7 + i * .33) % 1; b.E(g, -18 - k * 6, y - 3 + i * 3 + Math.sin(t * 3 + i) * 1.5, 2.6 * (1 - k) + .4, 1.4 * (1 - k) + .3); } });
}, (b, s, st, c) => {
  const t = st.t, y = -24 + Math.sin(t * 2.5) * 3, g = c.glow || '#a050ff', pulse = .55 + .45 * Math.sin(t * 4);
  for (let i = 0; i < 4; i++) MFX.spike(b, 12.2, y - 5.7 + i * 4, 2.6, 1.4, '#d0d0d8', .8);
  MFX.alpha(.6 + pulse * .4, () => { b.Ln(g, -8, y - 4, -3, y - 1, 1); b.Ln(g, -3, y - 1, 2, y - 5, 1); b.Ln(g, -2, y + 4, 4, y + 3, 1); b.Ln(g, 4, y + 3, 6, y + 6, 1); b.Ln(g, -12, y + 2, -7, y + 4, 1); });
  MFX.glow(b, g, 1, y - .5, 6, .18 * pulse + .08);
  const blink = Math.sin(t * .9) > .96; b.E(OL, 1, y - .5, 3.6, 2.6);
  if (!blink) { b.E('#f0e6d8', 1, y - .5, 3, 2); b.E(g, 2, y - .5, 1.5, 1.5); b.L(OL, 1.7, y - 2, .5 + .5, 3); b.L('#ffffff', 1.2, y - 1.5, .5 + .5, .5 + .5); }
  else b.L(shade(c.body || '#6a6a7a', -.3), -2, y - .5, 6, 1);
  for (let i = 0; i < 2; i++) MFX.drip(b, -9 + i * 4, y + 6, 3, t, i * .5, g);
});

// Gargoyle: spade tail, curled horns, molten cracks, fangs, talons, moss, wing claw
MFX.wrap('gargoyle', (b, s, st, c) => {
  const t = st.t, stone = c.body || '#7a7a86', y = -(st.atk ? 6 : 0), w = Math.sin(t * 2) * 2;
  b.Ln(OL, -6, y - 8, -15, y - 3, 3.4); b.Ln(OL, -15, y - 3, -21, y - 8 + w, 3); b.Ln(stone, -6, y - 8, -15, y - 3, 2); b.Ln(stone, -15, y - 3, -21, y - 8 + w, 1.8);
  b.Poly(OL, [[-21, y - 13 + w], [-25, y - 8 + w], [-21, y - 4 + w], [-19, y - 8 + w]]); b.Poly(shade(stone, -.25), [[-21, y - 12 + w], [-24, y - 8 + w], [-21, y - 5 + w], [-19.5, y - 8 + w]]);
}, (b, s, st, c) => {
  const t = st.t, stone = c.body || '#7a7a86', dk = shade(stone, -.35), hov = st.atk ? 6 : 0, y = -hov, flap = Math.sin(t * (st.atk ? 14 : 2)) * (st.atk ? 5 : 1.5), hx = 4, hy = y - 28, pulse = .6 + .4 * Math.sin(t * 3);
  for (const [bx, tx, ty] of [[-4, -13, -19], [3, 9, -20]]) { b.Poly(OL, [[hx + bx - 2.2, hy - 4], [hx + tx, hy + ty], [hx + bx + 2.2, hy - 5]]); b.Poly(dk, [[hx + bx - 1.4, hy - 4.6], [hx + tx + (tx < 0 ? 1 : -1), hy + ty + 1.4], [hx + bx + 1.4, hy - 5.2]]); b.L(shade(stone, .25), hx + bx + (tx < 0 ? -2 : 1.5), hy - 9, 1, 2); }
  MFX.alpha(.7 + pulse * .3, () => { b.Ln('#ff6a30', -4, y - 20, -1, y - 15, 1); b.Ln('#ff6a30', -1, y - 15, -4, y - 10, 1); b.Ln('#ff6a30', 3, y - 12, 6, y - 9, 1); b.L('#ffd080', -1.5, y - 15.5, 1, 1); });
  MFX.glow(b, '#ff5030', hx + 3, hy - 1.5, 4, .25);
  b.Ln(OL, hx - .5, hy - 4, hx + 7, hy - 2.5, 1.6);
  MFX.fang(b, hx + 2, hy + 3.6, 0, 2.6, .7); MFX.fang(b, hx + 6, hy + 3.6, 0, 2.6, .7);
  for (const fx of [-11, 6]) { MFX.claw(b, fx, y - .5, -1, 1.4); MFX.claw(b, fx + 6, y - .5, 1, 1.6); }
  for (const [x, yy] of [[-6, -20], [5, -9]]) { b.E('#5a7a4a', x, y + yy, 2, 1); b.L('#7aa060', x - 1, y + yy - .5, 1, .5 + .5); }
  MFX.claw(b, -26, y - 38 - flap, -1, 2);
});

/* ---------------- ACT II ---------------- */
// Sulking Crab: spiked shell, barnacles, serrated pincers, glaring stalks, mouthparts
MFX.wrap('crab', null, (b, s, st, c) => {
  const t = st.t, br = Math.sin(t * 3) * .5, a = st.atk || 0, m = matR(c.body || 'shell');
  for (let i = 0; i < 6; i++) { const x = -10 + i * 4, yy = MFX.top(0, -8 + br, 13, 7, x); MFX.spike(b, x, yy + 1, 2 + (i % 2), x * .08, m[1], .9); }
  for (const [x, y] of [[-6, -10], [4, -11], [8, -7]]) { b.E(OL, x, y + br, 1.6, 1.3); b.E('#d8d0c0', x, y + br, 1.2, 1); b.L('#6a6050', x - .5, y + br - .5, 1, 1); }
  b.Ln(m[0], -2, -14 + br, 1, -9 + br, 1); b.Ln(m[0], 1, -9 + br, -1, -6 + br, 1);
  const cx = 14 + a * 6, cy = -10 + br - a * 3, op = Math.abs(Math.sin(t * 5)) * 2 + a * 3;
  for (let i = 0; i < 3; i++) { b.L('#ffffff', cx + 2 + i * 1.5, cy - 1.5 - op * .25, .5 + .5, 1); b.L('#ffffff', cx + 2 + i * 1.5, cy - .5, .5 + .5, .5 + .5); }
  MFX.spike(b, cx - 2, cy - 3, 2, -.5, m[1], .7);
  for (const ex of [-3, 3]) { b.Ln(OL, ex - 1, -22 + br, ex + 3, -21 + br, 1.2); b.L(st.low ? '#ff4040' : '#e04020', ex + .5, -20 + br, 1, 1); }
  b.Ln(OL, 9, -6 + br, 12, -3 + br, 1); b.Ln(OL, 9, -5 + br, 11, -1 + br, 1); MFX.fang(b, 10.5, -7 + br, .3, 1.8, .5);
});

// Gull / Harpy: hooked, toothed beak, cold yellow eyes, ragged feathers, talons (harpy: crest, fangs, big talons)
MFX.wrap('gull', null, (b, s, st, c) => {
  const t = st.t, harpy = c.variant === 'harpy', a = st.atk || 0, fl = Math.sin(t * (harpy ? 6 : 9)), bob = harpy ? -10 + fl * 3 : Math.sin(t * 3) * .5, hx = 8 + a * 4, hy = -19 + bob + a * 2;
  const wy = -14 + bob - fl * 7, wcol = harpy ? '#3a2458' : '#4a4e58';
  for (let i = 0; i < 3; i++) { b.Poly(OL, [[-16 + i * 3, wy - 2 + i], [-23 + i * 2, wy + 1 + i * 1.5], [-14 + i * 3, wy + i * .8]]); b.Poly(wcol, [[-16 + i * 3, wy - 1.5 + i], [-22 + i * 2, wy + 1 + i * 1.5], [-14.5 + i * 3, wy + .3 + i * .8]]); }
  if (!harpy) {
    b.Poly(OL, [[hx + 9 + a * 3, hy + .5], [hx + 12 + a * 3, hy + 1.5], [hx + 10 + a * 3, hy + 4]]); b.Poly('#e0a020', [[hx + 9.5 + a * 3, hy + 1], [hx + 11.3 + a * 3, hy + 1.7], [hx + 10 + a * 3, hy + 3.2]]);
    for (let i = 0; i < 3; i++) b.L('#ffffff', hx + 5 + i * 1.6, hy + 2, .5 + .5, .5 + .5);
    b.L('#f0d040', hx, hy - 2, 3, 3); b.L(OL, hx + 1, hy - 1, 1, 1); b.Ln(OL, hx - 1.5, hy - 3.5, hx + 4, hy - 2, 1.4);
    const lp = st.walk || 0; MFX.claw(b, -2 + Math.sin(lp) * 2, 0, 1, 1.2); MFX.claw(b, 3 - Math.sin(lp) * 2, 0, 1, 1.2);
  } else {
    for (let i = 0; i < 3; i++) { b.Poly(OL, [[hx - 3, hy - 4 + i], [hx - 11 - i, hy - 9 + i * 2], [hx - 2, hy - 2 + i]]); b.Poly(i % 2 ? '#5a3a7a' : '#7a5a9a', [[hx - 3, hy - 3.6 + i], [hx - 10 - i, hy - 8.4 + i * 2], [hx - 2.4, hy - 2.4 + i]]); }
    MFX.glow(b, '#c060ff', hx + 1.5, hy - .5, 3, .35); MFX.fang(b, hx, hy + 3, 0, 1.8, .5); MFX.fang(b, hx + 2.4, hy + 2.6, 0, 1.6, .5);
    for (let i = 0; i < 3; i++) { const x = -3 + i * 1.5, y2 = 2.5 + bob; b.Ln(OL, x, y2, x + 1.5, y2 + 2, 1.4); b.L(MFX.IV, x + 1.2, y2 + 1.8, .5 + .5, .5 + .5); }
  }
});

// Jellyfish: glowing nematocyst barbs, visible innards, bioluminescent rim, jagged mouth
MFX.wrap('jelly', null, (b, s, st, c) => {
  const t = st.t, m = matR(c.body || 'jelly'), pu = Math.sin(t * 2.4), y0 = -26 - pu * 2 - (st.atk || 0) * 4, sh = .5 + .5 * Math.sin(t * 5);
  MFX.alpha(.75, () => { b.E(shade(m[1], -.25), -1, y0 + 1, 5, 3); b.E(m[3], -1, y0 + 1, 2.4 + sh * .6, 1.6); b.Ln(shade(m[1], -.3), -4, y0 + 2, 3, y0 + 3, 1); });
  for (let i = 0; i < 7; i++) { const x = -10 + i * 3.4, yy = y0 + 4 + Math.sin(i * 1.3) * .5; MFX.glow(b, '#f0a0ff', x, yy, 1.6, .25 * sh + .1); b.L(i % 2 ? '#ffe0ff' : '#c0f0ff', x - .5, yy - .5, 1, 1); }
  for (let i = 0; i < 6; i++) { const x0 = -8 + i * 3.2; for (const k of [3, 6, 8]) { const x = x0 + Math.sin(t * 2 + i + k * .7) * 2.2, y = y0 + 4 + k * 3; b.L(k === 8 ? '#ffffff' : '#e8b0ff', x - .5, y - .5, 1, 1); if (k === 8) { b.L('#e8b0ff', x - 1.5, y - 1, 1, .5 + .5); b.L('#e8b0ff', x + .5, y - 1, 1, .5 + .5); } } }
  b.L('#2a1040', -3, y0 + 3.5, 5, 1); for (let i = 0; i < 3; i++) b.Poly('#ffffff', [[-2.6 + i * 1.6, y0 + 3.5], [-2.1 + i * 1.6, y0 + 4.8], [-1.6 + i * 1.6, y0 + 3.5]]);
  b.Ln('#2a1040', -6, y0 - 2.5, -3, y0 - 1.5, 1); b.Ln('#2a1040', 6, y0 - 2.5, 3, y0 - 1.5, 1);
});

// Angler: dorsal spines, giant needle fangs, photophores, warty hide, barbels, red-rimmed eye
MFX.wrap('angler', (b, s, st, c) => {
  const t = st.t, m = matR(c.body || 'deepsea'), bob = Math.sin(t * 2) * 1.5 - 10;
  for (let i = 0; i < 5; i++) { const x = -9 + i * 3, yy = MFX.top(0, bob, 13, 10, x); MFX.spike(b, x, yy + 1.5, 3 + (i % 2) * 1.5, -1.5, m[0], .8); }
}, (b, s, st, c) => {
  const t = st.t, m = matR(c.body || 'deepsea'), a = st.atk || 0, bob = Math.sin(t * 2) * 1.5 - 10, open = 2 + a * 5 + Math.abs(Math.sin(t * 1.5)) * 1.5;
  const R = RNG(51); for (let i = 0; i < 9; i++) { const x = R.r(-10, 4), y = bob + R.r(-6, 6); b.E(m[1], x, y, .9, .7); b.L(m[3], x - .5, y - .7, 1, .5 + .5); }
  MFX.fang(b, 6, bob + 1, 0, 4 + open * .4, .8); MFX.fang(b, 11, bob + 1, .3, 3.4 + open * .35, .7); MFX.fang(b, 9, bob + 5 + open, 0, -3.4, .6);
  const p = .5 + .5 * Math.sin(t * 3); for (const [x, y] of [[-7, 3], [-3, 6], [1, 7], [-9, -2]]) { MFX.glow(b, '#70ffe0', x, bob + y, 1.8, .2 + p * .25); b.L('#a0fff0', x - .5, bob + y - .5, 1, 1); }
  b.E('#c02030', 5.5, bob - 3.5, 2.4, 2.4); b.L('#ffff90', 4.5, bob - 4.5, 2, 2); b.L(OL, 5, bob - 4, 1, 1);
  for (let i = 0; i < 3; i++) { const x = 7 + i * 2.5, y = bob + 6 + open * .5; b.Ln(m[1], x, y, x - 1 + Math.sin(t * 2 + i), y + 4 + i, .8); }
});

// Clam: toothed shell lips, barnacles + weed, feelers when open (keeps the hat & monocle)
MFX.wrap('clam', null, (b, s, st, c) => {
  const t = st.t, m = matR(c.body || 'clam'), a = st.atk || 0, op = Math.max(0, Math.sin(t * .9)) * 3 + a * 8, ty = -10 - op;
  if (op > .5) { for (let i = 0; i < 7; i++) { MFX.fang(b, -9 + i * 3, -8.5, 0, -1.6 - op * .18, .7); MFX.fang(b, -9 + i * 3 + 1.5, ty + 5.5, 0, 1.6 + op * .18, .7); } for (const sd of [-1, 1]) b.Ln('#d07888', sd * 9, -9 - op * .3, sd * (15 + Math.sin(t * 3) * 2), -12 - op * .5, 1.2); }
  else for (let i = 0; i < 6; i++) MFX.fang(b, -8 + i * 3.2, -9.2, 0, 1.6, .6);
  for (const [x, y] of [[-8, -2], [6, -1]]) { b.E(OL, x, ty + y, 1.5, 1.2); b.E('#d8d0c0', x, ty + y, 1.1, .9); b.L('#6a6050', x - .5, ty + y - .5, 1, 1); }
  for (let i = 0; i < 3; i++) b.Ln(i % 2 ? '#3a7a3a' : '#5a9a4a', 10 + i, ty + 3, 12 + i + Math.sin(t * 2 + i) * 1.5, ty + 8, 1);
});

// Eels: fin spikes along the back, fanged open jaw, gills, glowing lateral line
MFX.wrap('eel', null, (b, s, st, c) => {
  const t = st.t, m = matR(c.body || 'eel'), a = st.atk || 0;
  const pts = []; for (let i = 0; i <= 14; i++) { const k = i / 14, x = -16 + k * 26 + a * k * 8, y = -4 - k * 26 + Math.sin(t * 3 + k * 6) * 4 * (1 - k * .5); pts.push([x, y]); }
  for (let i = 2; i < 13; i += 2) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = dy / L, ny = -dx / L, w = 5 - i * .18; const bx = x0 - nx * w * .5, by = y0 - ny * w * .5; b.Poly(OL, [[bx - dx * .5, by - dy * .5], [bx - nx * 3.2 - dx * .2, by - ny * 3.2 - dy * .2], [bx + dx * .5, by + dy * .5]]); b.Poly(m[1], [[bx - dx * .35, by - dy * .35], [bx - nx * 2.6 - dx * .2, by - ny * 2.6 - dy * .2], [bx + dx * .35, by + dy * .35]]); }
  const p = .5 + .5 * Math.sin(t * 4); for (let i = 1; i < 13; i += 3) { const [x, y] = pts[i]; MFX.glow(b, '#f0ff80', x, y, 1.6, .15 + p * .2); b.L('#f8ffb0', x - .5, y - .5, 1, 1); }
  const [hx, hy] = pts[14];
  for (let i = 0; i < 3; i++) b.Ln(OL, hx - 2 + i * 1.2, hy - 1.5, hx - 2.5 + i * 1.2, hy + 2, .8);
  b.L('#3a0a14', hx + 4, hy + 1, 5, 1.5 + a * 2); MFX.fang(b, hx + 5, hy + 1, 0, 1.8, .5); MFX.fang(b, hx + 7.5, hy + 1, 0, 1.8, .5); MFX.fang(b, hx + 6.3, hy + 2.5 + a * 2, 0, -1.6, .5);
  MFX.glow(b, '#e0e040', hx + 4, hy - 1.5, 2.4, .35);
});

// Penguin: rockhopper crest, toothed beak (penguins really have tongue spikes), glare + scar, ice shards, claws
MFX.wrap('penguin', null, (b, s, st, c) => {
  const t = st.t, a = st.atk || 0, br = Math.sin(t * 2) * .4, w = st.walk || 0, sw = Math.sin(w) * 2;
  for (let i = 0; i < 3; i++) b.Ln(i % 2 ? '#e8c030' : '#f0d850', 1 - i, -22 + br + i, -6 - i * 1.5, -26 + br + i * 1.5 + Math.sin(t * 3 + i) * .6, 1);
  b.L('#ff3020', 3, -19 + br, 2, 2); b.L('#ffffff', 3, -19 + br, 1, 1);
  b.Ln(OL, 1, -22 + br, 6, -20 + br, 1.4); MFX.scar(b, 1.5, -22.5 + br, 5, -16.5 + br);
  for (let i = 0; i < 3; i++) b.L('#ffffff', 6 + i * 1.4, -15.5 + br, .5 + .5, .5 + .5);
  for (let i = 0; i < 3; i++) { const x = -6 + i * 2.5, y = MFX.top(0, -12 + br, 9, 12, x); b.Poly('#d8f0ff', [[x - .7, y + 1], [x - 1.5, y - 2.5 - (i % 2)], [x + .7, y + 1]]); }
  MFX.claw(b, -.5 + sw * .5, -1, 1, 1.2); MFX.claw(b, 7 - sw * .5, -1, 1, 1.2);
});

// Yeti / Grudge: tusks, ram horns, shaggy silhouette, claws, frost breath (grudge: cracks of cold light)
MFX.wrap('yeti', null, (b, s, st, c) => {
  const t = st.t, g = c.variant === 'grudge', a = st.atk || 0, br = Math.sin(t * 2) * .8, m = matR(g ? 'ice' : 'fur'), fx = 6, fy = -30 + br;
  for (let i = 0; i < 14; i++) { const ang = Math.PI * .15 + i / 13 * Math.PI * .85, x = Math.cos(ang) * 15, y = -22 + br + Math.sin(ang) * 16; if (y < -24) continue; b.Ln(i % 2 ? m[1] : m[3], x, y, x + Math.cos(ang) * 2 - .6, y + Math.sin(ang) * 2 + 1.2, 1); }
  if (!g) for (const sd of [-1, 1]) { const hx = fx + sd * 5.5, hy = fy - 5; b.Ln(OL, hx, hy, hx + sd * 3.5, hy - 3, 2.8); b.Ln(OL, hx + sd * 3.5, hy - 3, hx + sd * 5, hy + 1, 2.6); b.Ln('#9a8a72', hx, hy, hx + sd * 3.5, hy - 3, 1.6); b.Ln('#9a8a72', hx + sd * 3.5, hy - 3, hx + sd * 5, hy + 1, 1.4); b.L('#c8b898', hx + sd * 2, hy - 2.5, 1, .5 + .5); }
  MFX.fang(b, fx - 1, fy + 3.2, -.3, -3.4, .8); MFX.fang(b, fx + 5, fy + 3.2, .3, -3.4, .8);
  const ec = g ? (st.phase2 ? '#ff4040' : '#80e0ff') : '#ffb030'; MFX.glow(b, ec, fx + 1.5, fy - 1, 5, .25); if (!g) { b.L(ec, fx - 2, fy - 2, 2, 2); b.L(ec, fx + 3, fy - 2, 2, 2); } b.Ln(OL, fx - 3.5, fy - 4.5, fx + .5, fy - 3, 1.4); b.Ln(OL, fx + 6.5, fy - 4.5, fx + 2.5, fy - 3, 1.4);
  MFX.scar(b, -8, -28 + br, -3, -20 + br);
  const ra = -.3 - a * 2.2, ax = 10 + Math.cos(ra) * 14, ay = -26 + br - Math.sin(ra) * 14 + 8; for (let i = 0; i < 3; i++) MFX.claw(b, ax + 2.5, ay - 2 + i * 1.8, 1, 2);
  if (g) MFX.alpha(.6 + .4 * Math.sin(t * 3), () => { b.Ln('#c0f4ff', -6, -30 + br, -2, -22 + br, 1); b.Ln('#c0f4ff', -2, -22 + br, -6, -14 + br, 1); b.Ln('#c0f4ff', 4, -18 + br, 8, -12 + br, 1); });
  const k = (t * .5) % 1; if (!PAINT && k < .6) MFX.alpha(.45 * (1 - k / .6), () => b.E('#eaf6ff', fx + 8 + k * 10, fy + 2 - k * 4, 1.5 + k * 5, 1 + k * 3));
});

// Sheep: demon slit eyes, curled ram horns, fangs, brambles in the wool and something blinking inside it
MFX.wrap('sheep', null, (b, s, st, c) => {
  const t = st.t, a = st.atk || 0, br = Math.sin(t * 2) * .6, bob = -4 + Math.sin(t * 1.5) * 1.5, hx = 12 + a * 5, hy = -14 + bob;
  b.Ln(OL, hx - 1, hy - 3, hx - 5, hy - 5, 2.6); b.Ln(OL, hx - 5, hy - 5, hx - 6, hy - 1, 2.4); b.Ln(OL, hx - 6, hy - 1, hx - 3, hy + 1, 2.2);
  b.Ln('#4a3a30', hx - 1, hy - 3, hx - 5, hy - 5, 1.4); b.Ln('#4a3a30', hx - 5, hy - 5, hx - 6, hy - 1, 1.3); b.Ln('#4a3a30', hx - 6, hy - 1, hx - 3, hy + 1, 1.1); for (let i = 0; i < 3; i++) b.L('#7a6a58', hx - 2 - i * 1.6, hy - 4 - (i === 1 ? 1 : 0), .5 + .5, .5 + .5);
  MFX.glow(b, '#f0c030', hx + .8, hy - .7, 2.2, .3); b.L('#f0c030', hx - .5, hy - 1.2, 2.6, 1.2); b.L(OL, hx - .5, hy - .8, 2.6, .5);
  MFX.fang(b, hx + 1.5, hy + 2.6, 0, 1.6, .5); MFX.fang(b, hx + 3, hy + 2.4, 0, 1.4, .45);
  for (const [x, y] of [[-10, -15], [-3, -20], [6, -17], [-12, -6], [2, -4]]) { b.Ln('#3a2a20', x, y + bob + br, x + 1.5, y - 2 + bob + br, 1); b.Ln('#3a2a20', x + .5, y - 1 + bob + br, x - 1.2, y - 2 + bob + br, .8); }
  const bl = Math.sin(t * 1.1 + 1) > .2; if (bl) for (const [x, y] of [[-6, -11], [-3, -11]]) { b.L(OL, x - .5, y + bob + br - .5, 2, 2); b.L('#ff3040', x, y + bob + br, 1, 1); }
});

// Horses (the stallion and the Haughtsworth mount): bared teeth, steaming nostrils, spiked hooves, veins, burning eye
{ const dh = drawHorse;
  drawHorse = function (L, E, Ln, Poly, B, s, st, c, x0) {
    dh(L, E, Ln, Poly, B, s, st, c, x0); if (!MFX.on()) return;
    const b = { L, E, Ln, Poly }, t = st.t, a = st.atk || 0, w = st.walk || st.t * (st.gallop || 0), br = Math.sin(t * 2) * .5, nx = x0 + 14 + a * 3, ny = -36 + br, m = matR(c.body || 'horse');
    for (const [lx, ph] of [[-12, 0], [-8, 2.2], [8, 1], [12, 3.1]]) { const sw = Math.sin(w + ph) * 3; b.Poly('#e8d070', [[x0 + lx + sw - 1.5, -1], [x0 + lx + sw - 2.6, .6], [x0 + lx + sw - .5, -.2]]); b.Poly('#e8d070', [[x0 + lx + sw + 1.5, -1], [x0 + lx + sw + 2.6, .6], [x0 + lx + sw + .5, -.2]]); }
    MFX.alpha(.45, () => { b.Ln(m[1], x0 - 6, -26 + br, x0 - 3, -20 + br, 1); b.Ln(m[1], x0 + 3, -27 + br, x0 + 5, -21 + br, 1); });
    b.L('#5a1a24', nx + 5, ny + 1.5, 5, 1.4); for (let i = 0; i < 3; i++) b.L('#ffffff', nx + 5.5 + i * 1.5, ny + 1.5, 1, 1); MFX.fang(b, nx + 9.5, ny + 1.5, .2, 1.6, .5);
    MFX.glow(b, '#ff4060', nx + 3.5, ny - 1.5, 2.2, .35); b.L('#ff4060', nx + 3, ny - 2, 1, 1); b.Ln(OL, nx + 1, ny - 4.5, nx + 6, ny - 3, 1.2);
    const k = (t * .7) % 1; if (!PAINT && k < .7) MFX.alpha(.5 * (1 - k / .7), () => b.E('#f0f0ff', nx + 11 + k * 6, ny + 1 - k * 2, 1 + k * 3, .8 + k * 2));
  };
}

// Balloon creatures: stitched seams, wide needle grin, hollow glowing eyes, tied-off knots
MFX.wrap('balloon', null, (b, s, st, c) => {
  const t = st.t, m = matR(c.body || 'balloon'), a = st.atk || 0, bob = -14 + Math.sin(t * 2.2) * 2.5 - a * 4, hx = 12, hy = bob - 12;
  for (const [x, y] of [[-6, bob - 6], [6, bob - 6], [-7, bob + 2], [8, bob + 1], [10, bob - 8]]) { b.Ln(OL, x - 1, y - 1, x + 1, y + 1, 1); b.Ln(OL, x + 1, y - 1, x - 1, y + 1, 1); b.L(m[1], x - .5, y - .5, 1, 1); }
  b.Ln(m[0], -3, bob - 13, -1, bob - 4, 1); for (let i = 0; i < 3; i++) b.Ln('#f0e8f0', -3.5 + i * .7, bob - 11 + i * 3, -.5 + i * .7, bob - 11.5 + i * 3, .8);
  b.L(OL, hx - 3.5, hy + 1, 7, 2.2 + a); for (let i = 0; i < 5; i++) b.Poly('#ffffff', [[hx - 3.2 + i * 1.4, hy + 1], [hx - 2.6 + i * 1.4, hy + 2.6], [hx - 2 + i * 1.4, hy + 1]]);
  b.L(OL, hx - 2, hy - 3, 3, 3); MFX.glow(b, '#ff60a0', hx - .5, hy - 1.5, 2.2, .45); b.L('#ff80b0', hx - 1, hy - 2, 1, 1);
  b.Ln(OL, hx - 3, hy - 4.5, hx + 2, hy - 3.5, 1.2);
});
