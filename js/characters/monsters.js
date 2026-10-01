'use strict';
/* =========================================================
   MONSTER RENDERERS — local facing +x, feet at origin
   ========================================================= */
const MON = {};
function monsterBase(s) { return { L: (c, a, b, w, h) => P(c, a * s, b * s, w * s, h * s), E: (c, a, b, rx, ry) => pEll(c, a * s, b * s, rx * s, ry * s), Ln: (c, a, b, c2, d, th = 1) => pLine(c, a * s, b * s, c2 * s, d * s, Math.max(1, Math.round(th * s))), Poly: (c, pts) => pPoly(c, pts.map(p => [p[0] * s, p[1] * s])) }; }
const OL = '#1a1016';
MON.rat = (s, st, c) => {
  const { L, E, Ln } = monsterBase(s), t = st.t, br = Math.sin(t * 4) * .6, low = st.low;
  E('rgba(90,200,90,.35)', 0, -1, 14, 2.5);
  const tw = Math.sin(t * 3) * 3; for (let i = 0; i < 8; i++) { const k = i / 8; Ln(OL, -10 - k * 10, -5 + Math.sin(k * 5 + t * 3) * 3, -11 - k * 10, -5 + Math.sin((k + .12) * 5 + t * 3) * 3, 3); } for (let i = 0; i < 8; i++) { const k = i / 8; Ln('#c89a9a', -10 - k * 10, -5 + Math.sin(k * 5 + t * 3) * 3, -11 - k * 10, -5 + Math.sin((k + .12) * 5 + t * 3) * 3, 1); }
  E(OL, 0, -8 + br, 12, 8); E(c.body || '#7a8a6a', 0, -8 + br, 11, 7); E(shade(c.body || '#7a8a6a', -.2), -3, -6 + br, 8, 5); E(shade(c.body || '#7a8a6a', .15), 2, -11 + br, 6, 3);
  E('rgba(120,230,110,.75)', -2, -13 + br, 7, 3); for (let i = 0; i < 3; i++) { const d = ((t * .7 + i * .33) % 1); L('rgba(120,230,110,.85)', -6 + i * 4, -11 + br + d * 9, 2, 2 + d * 2); }
  const hx = 11 + (st.atk || 0) * 3, hy = -10 + br; E(OL, hx, hy, 7, 5.5); E(c.body || '#7a8a6a', hx, hy, 6, 4.6); E('#e8a0a8', hx - 2, hy - 5, 2.5, 2.5); E(OL, hx - 2, hy - 5, 1, 1);
  E('#e89aa0', hx + 6, hy + 1, 1.5, 1.5); L(low ? '#ff6060' : '#ff3030', hx + 2, hy - 2, 2, 2); L('#fff', hx + 2, hy - 2, 1, 1); Ln('#e8e0d0', hx + 5, hy + 1, hx + 10, hy, 1); Ln('#e8e0d0', hx + 5, hy + 2, hx + 10, hy + 3, 1);
  L('#fff8e0', hx + 3, hy + 3, 1, 2); const ph = st.walk || t * 6; L(OL, -6 + Math.sin(ph) * 2, -2, 3, 2); L(OL, 5 - Math.sin(ph) * 2, -2, 3, 2);
};
MON.goose = (s, st, c) => {
  const { L, E, Ln } = monsterBase(s), t = st.t, br = Math.sin(t * 3) * .6, str = st.atk || 0, low = st.low;
  const lp = st.walk || 0; Ln('#e08a20', -2, -7, -3 + Math.sin(lp) * 2, 0, 2); Ln('#e08a20', 3, -7, 3 - Math.sin(lp) * 2, 0, 2); L('#e08a20', -5 + Math.sin(lp) * 2, 0, 4, 1); L('#e08a20', 2 - Math.sin(lp) * 2, 0, 4, 1);
  E(OL, 0, -13 + br, 12, 8); E('#f4f0e6', 0, -13 + br, 11, 7); E('#d8d4cc', -3, -11 + br, 8, 5); E('#c8c4bc', -12, -15 + br, 4, 3); L('#b8b4ac', -2, -13 + br, 8, 1); L('#b8b4ac', -1, -11 + br, 7, 1);
  const nx0 = 7, ny0 = -17 + br, nx1 = 9 + str * 16 + (low ? 2 : 0), ny1 = -31 + br + str * 12 + (low ? 4 : 0);
  Ln(OL, nx0, ny0, nx1, ny1, 6); Ln('#f4f0e6', nx0, ny0, nx1, ny1, 4); Ln('#d8d4cc', nx0 - 1, ny0, nx1 - 1, ny1, 1);
  E(OL, nx1 + 1, ny1 - 1, 5, 4); E('#f4f0e6', nx1 + 1, ny1 - 1, 4, 3); L('#e8801a', nx1 + 4, ny1 - 1, 6 + str * 2, 2); L(OL, nx1 + 4, ny1 + 1, 6 + str * 2, 1); L('#c86010', nx1 + 4, ny1, 5, 1);
  L(OL, nx1 + 1, ny1 - 3, 2, 2); L('#fff', nx1 + 2, ny1 - 3, 1, 1); Ln(OL, nx1 - 1, ny1 - 5, nx1 + 4, ny1 - 3, 1);
  if (str > .3) { L('#ff4040', nx1 + 6, ny1 - 7, 1, 3); L('#ff4040', nx1 + 9, ny1 - 6, 1, 2); }
};
MON.quad = (s, st, c) => {
  const { L, E, Ln, Poly } = monsterBase(s), t = st.t, v = c.variant || 'wolf', low = st.low;
  const br = Math.sin(t * (low ? 5 : 3)) * .7, body = c.body || '#6a6a72', dk = shade(body, -.28), lt = shade(body, .18), ph = st.walk !== undefined ? st.walk : 0, crouch = st.crouch || 0;
  const bh = v === 'raccoon' ? .7 : 1, y0 = -14 * bh + crouch * 3;
  // tail
  const tw = Math.sin(t * 2.5) * 2;
  if (v === 'raccoon') { for (let i = 0; i < 5; i++) { E(OL, -13 - i * 2.5, y0 - 1 - i * 1.5 + tw * .2 * i, 3.8, 3.2); } for (let i = 0; i < 5; i++) E(i % 2 ? '#2a2a30' : '#9a9aa2', -13 - i * 2.5, y0 - 1 - i * 1.5 + tw * .2 * i, 3, 2.5); }
  else { Poly(OL, [[-12, y0 - 2], [-26, y0 - 8 + tw], [-25, y0 - 3 + tw], [-12, y0 + 3]]); Poly(dk, [[-12, y0 - 1], [-24, y0 - 7 + tw], [-23, y0 - 3 + tw], [-12, y0 + 2]]); }
  // legs back layer
  const leg = (lx, off, dark) => { const lift = Math.max(0, Math.sin(ph + off)) * 2, sw = Math.cos(ph + off) * 2.5; Ln(OL, lx, y0 + 3, lx + sw, -1 - lift, 4.4); Ln(dark ? dk : body, lx, y0 + 3, lx + sw, -1 - lift, 2.6); L(OL, lx + sw - 1, -2 - lift, 4, 2); };
  leg(-8, Math.PI, true); leg(7, 0, true);
  E(OL, 0, y0 + br, 15, 8.5 * bh + 1); E(body, 0, y0 + br, 14, 7.5 * bh); E(dk, -3, y0 + 3 + br, 11, 4 * bh); E(lt, 2, y0 - 4 + br, 9, 2.5);
  if (v === 'zombie') { for (let i = 0; i < 4; i++) L('#e8e0cc', -4 + i * 3, y0 - 1 + br, 1, 5); E('#6a8a5a', -6, y0 - 3, 3, 2); }
  if (v === 'timber') { for (let i = 0; i < 5; i++) { L('#5a3a22', -9 + i * 4, y0 - 5 + (i % 2) * 3 + br, 3, 2); } }
  if (v === 'gloom') { const ph2 = st.phase2; for (let i = 0; i < 7; i++) { const fh = (ph2 ? 7 : 4) + Math.abs(Math.sin(t * 8 + i)) * (ph2 ? 6 : 3); L('#8a3ae0', -10 + i * 3.5, y0 - 7 - fh + br, 2, fh); L('#e0b0ff', -10 + i * 3.5, y0 - 7 - fh * .5 + br, 1, fh * .4); } }
  leg(-6, Math.PI * .5, false); leg(9, Math.PI * 1.5, false);
  // head
  const hx = 15 + (st.atk || 0) * 4, hy = y0 - 5 * bh + br - (st.atk || 0) * 2 + (low ? 2 : 0);
  E(OL, 10, y0 - 1 + br, 7, 7 * bh); E(lt, 10, y0 - 1 + br, 6, 6 * bh);
  E(OL, hx, hy, 7.5, 6.5); E(body, hx, hy, 6.5, 5.5); E(dk, hx - 3, hy + 2, 4, 3);
  const jaw = (st.atk || 0) * 3; L(OL, hx + 3, hy - 1, 9, 5 + jaw * .3); L(shade(body, .08), hx + 4, hy, 7, 3); L(OL, hx + 11, hy - 1, 2, 2); if (jaw > .5) { L('#8a2a2a', hx + 4, hy + 3, 7, jaw); L('#fff', hx + 5, hy + 3, 1, 1); L('#fff', hx + 8, hy + 3, 1, 1); }
  Poly(OL, [[hx - 4, hy - 4], [hx - 3, hy - 13], [hx + 2, hy - 5]]); Poly(v === 'zombie' ? '#8a9a7a' : dk, [[hx - 3, hy - 5], [hx - 3, hy - 11], [hx + 1, hy - 5]]); Poly(OL, [[hx, hy - 5], [hx + 2, hy - 12], [hx + 5, hy - 4]]); Poly(body, [[hx + 1, hy - 5], [hx + 2, hy - 10], [hx + 4, hy - 5]]);
  if (v === 'raccoon') { L('#1a1a20', hx - 3, hy - 2, 10, 3); L('#e8e8e8', hx - 2, hy - 4, 8, 1); }
  const eyeC = c.eye || (v === 'gloom' || v === 'timber' ? '#c070ff' : v === 'zombie' ? '#c0ff60' : '#ffcc30'); L(eyeC, hx + 2, hy - 2, 2, 1); L('#fff', hx + 3, hy - 2, 1, 1); if (st.atk > .2 || low) Ln(OL, hx, hy - 4, hx + 4, hy - 3, 1);
  if (v === 'gloom') { const broken = st.phase2; for (let i = 0; i < 5; i++) { L(i % 2 ? '#6a6a78' : '#9a9aa8', 6 + i * 2, y0 - 6 + i + br, 2, 2); } if (!broken) { for (let i = 0; i < 6; i++) L(i % 2 ? '#6a6a78' : '#9a9aa8', 4 - i * 2, y0 + 4 + i * 1.5, 2, 2); } else { for (let i = 0; i < 4; i++) L(i % 2 ? '#6a6a78' : '#9a9aa8', 8 - i, y0 + 3 + i * 3 + Math.sin(t * 4 + i), 2, 2); } }
};
MON.sprite = (s, st, c) => {
  const { L, E, Ln } = monsterBase(s), t = st.t, fl = Math.sin(t * 3) * 3, y = -26 + fl, flap = Math.abs(Math.sin(t * 18));
  ctx.globalAlpha = .55; E(c.wing || '#b0f0ff', -5, y - 6, 7, 3 + flap * 4); E(c.wing || '#b0f0ff', -3, y - 3, 5, 2 + flap * 3); ctx.globalAlpha = 1;
  E('rgba(0,0,0,.2)', 0, 0, 6, 1.5);
  Ln(OL, 0, y + 4, -1, y + 13, 3); Ln(c.body || '#6ac070', 0, y + 4, -1, y + 13, 1.6); Ln(OL, 1, y + 4, 3, y + 12, 3); Ln(c.body || '#6ac070', 1, y + 4, 3, y + 12, 1.6);
  E(OL, 0, y + 2, 5, 5); E(c.body || '#6ac070', 0, y + 2, 4, 4); E(OL, 1, y - 6, 6.5, 6); E(c.skin || '#c8f0b0', 1, y - 6, 5.5, 5); E(shade(c.skin || '#c8f0b0', -.2), -1, y - 5, 3, 4);
  E(c.hair || '#40a060', 0, y - 10, 6, 3); Ln(c.hair || '#40a060', 3, y - 11, 7, y - 15, 1); L(OL, 2, y - 7, 1, 2); L(OL, 5, y - 7, 1, 2); L(OL, 1, y - 9, 2, 1); L(OL, 5, y - 9, 2, 1); L(OL, 2, y - 3, 4, 1); L(OL, 5, y - 4, 1, 1);
  Ln(OL, 3, y + 1, 8 + (st.atk || 0) * 5, y - 3 - (st.atk || 0) * 3, 2);
  if (c.variant === 'misdirect') { const r = t * .8; for (let i = 0; i < 3; i++) { const a = r + i * 2.1, ax = Math.cos(a) * 13, ay = y - 2 + Math.sin(a) * 7; L('#7a5230', ax - 4, ay - 1, 8, 3); L('#e8dcc0', ax - 3, ay, 6, 1); L('#e8dcc0', ax + (Math.cos(a * 3) > 0 ? 3 : -4), ay - 1, 1, 3); } }
  ctx.globalAlpha = .4 + flap * .2; for (let i = 0; i < 3; i++) L('#fff8c0', Math.sin(t * 4 + i * 2) * 8, y + 6 + ((t * 20 + i * 7) % 14), 1, 1); ctx.globalAlpha = 1;
};
MON.wraith = (s, st, c) => {
  const { L, E, Poly } = monsterBase(s), t = st.t, fl = Math.sin(t * 2) * 3, y = -12 + fl, cloak = c.body || '#3a4a5a';
  ctx.globalAlpha = .88; const pts = [[-8, y - 22], [8, y - 22], [12, y - 4], [8, y + 8]]; for (let i = 0; i <= 6; i++) { const k = i / 6; pts.push([8 - k * 20, y + 8 + Math.sin(t * 5 + k * 6) * 3 + (i % 2) * 4]); } pts.push([-12, y - 4]);
  Poly(OL, pts.map(p => [p[0] + (p[0] > 0 ? 1 : -1), p[1] + 1])); Poly(cloak, pts); Poly(shade(cloak, -.3), [[-6, y - 18], [-2, y - 18], [-6, y + 8], [-10, y + 6]]);
  E(OL, 1, y - 20, 9, 9); E(cloak, 1, y - 20, 8, 8); E('#0a0810', 3, y - 18, 5, 6); const gl = c.eye || '#90ffd0'; L(gl, 1, y - 19, 2, 1); L(gl, 5, y - 19, 2, 1);
  ctx.globalAlpha = .7; const ar = (st.atk || 0) * 10; Poly(shade(cloak, .1), [[6, y - 12], [14 + ar, y - 8 - ar * .5], [16 + ar, y - 5 - ar * .5], [8, y - 6]]); for (let i = 0; i < 3; i++) L('#d0fff0', 16 + ar + i, y - 7 - ar * .5 + i * 2, 3, 1);
  ctx.globalAlpha = .3; E(gl, 3, y - 18, 10, 10); ctx.globalAlpha = 1;
};
MON.mimic = (s, st, c) => {
  const { L, E, Ln, Poly } = monsterBase(s), t = st.t, open = Math.max(st.atk || 0, (Math.sin(t * 1.3) > .92 ? .3 : 0)), hop = st.hop || 0, y = -hop;
  L(OL, -13, y - 16, 26, 17); L('#7a4a2a', -12, y - 15, 24, 15); L('#5a3418', -12, y - 15, 3, 15); L('#9a6a3a', -12, y - 15, 24, 2); for (let i = 0; i < 3; i++) L('#5a3418', -12, y - 11 + i * 4, 24, 1);
  L('#8a8a96', -12, y - 15, 2, 15); L('#8a8a96', 10, y - 15, 2, 15); L('#c8c8d0', 10, y - 15, 1, 15);
  const rg = .5 + .5 * Math.sin(t * 3); L(mix('#206a6a', '#60fff0', rg), -3, y - 10, 6, 5); L('#e0ffff', -1, y - 8, 2, 1);
  const la = open * 1.1, lx = -13, ly = y - 16; const lid = [[lx, ly], [lx + 26 * Math.cos(la), ly - 26 * Math.sin(la)], [lx + 26 * Math.cos(la) + 8 * Math.sin(la), ly - 26 * Math.sin(la) - 8 * Math.cos(la)], [lx + 8 * Math.sin(la), ly - 8 * Math.cos(la)]];
  if (open > .1) { Poly('#3a0a12', [[-12, ly], [12, ly], [lid[1][0], lid[1][1]], [lid[3][0] + 2, lid[3][1]]]); for (let i = 0; i < 6; i++) { L('#f4ecd8', -11 + i * 4, ly - 1, 2, 3); L('#f4ecd8', lx + (i * 4 + 2) * Math.cos(la), ly - (i * 4 + 2) * Math.sin(la), 2, 2); } E('#c04060', 4, ly - 2 - open * 4, 4, 2); }
  Poly(OL, lid.map(p => [p[0] - .5, p[1] - .5])); Poly('#8a5a32', lid); Ln('#8a8a96', lid[0][0], lid[0][1], lid[1][0], lid[1][1], 1);
  if (open < .2) { L('#1a1016', -2, y - 16, 4, 1); L('#e0c050', -1, y - 17, 2, 3); }
  const ph = t * 5; L(OL, -9 + Math.sin(ph) * 1.5, y, 3, 3 + hop * .3); L(OL, 6 - Math.sin(ph) * 1.5, y, 3, 3 + hop * .3);
};
MON.gremlin = (s, st, c) => {
  const { L, E, Ln, Poly } = monsterBase(s), t = st.t, bob = Math.abs(Math.sin(t * 5)) * 2, body = c.body || '#8a6aa8';
  const up = (st.atk || 0); const py = -38 - bob - up * 6;
  L(OL, -10, py - 1, 20, 6); L('#8a8a92', -9, py, 18, 4); L('#b0b0b8', -9, py, 18, 1); L('#6a6a72', -3, py + 1, 6, 2);
  Ln(OL, -4, -20, -7, py + 4, 3); Ln(body, -4, -20, -7, py + 4, 1.5); Ln(OL, 4, -20, 7, py + 4, 3); Ln(body, 4, -20, 7, py + 4, 1.5);
  Ln(OL, -3, -8, -5, 0, 3); Ln(OL, 3, -8, 5, 0, 3); E(OL, 0, -12 - bob * .3, 7, 6); E(body, 0, -12 - bob * .3, 6, 5);
  const hy = -23 - bob * .5; Poly(OL, [[-5, hy - 2], [-15, hy - 7], [-6, hy + 2]]); Poly(body, [[-5, hy - 1], [-13, hy - 6], [-6, hy + 1]]); Poly(OL, [[5, hy - 2], [15, hy - 7], [6, hy + 2]]); Poly(body, [[5, hy - 1], [13, hy - 6], [6, hy + 1]]);
  E(OL, 0, hy, 8, 7); E(body, 0, hy, 7, 6); E(shade(body, -.2), -2, hy + 2, 4, 3); L('#ffe040', 1, hy - 2, 2, 2); L('#ffe040', 5, hy - 2, 2, 2); L(OL, 2, hy - 1, 1, 1); L(OL, 6, hy - 1, 1, 1);
  L(OL, 0, hy + 3, 8, 2); for (let i = 0; i < 4; i++) L('#fff', 1 + i * 2, hy + 3, 1, 1);
};
MON.gauntlet = (s, st, c) => {
  const { L, E, Ln, Poly } = monsterBase(s), t = st.t, fl = Math.sin(t * 2.5) * 3, y = -24 + fl, m = c.body || '#6a6a7a', lt = shade(m, .3), dk = shade(m, -.3);
  ctx.globalAlpha = .35; E(c.glow || '#a050ff', 0, y, 18, 14); ctx.globalAlpha = 1;
  L(OL, -14, y - 7, 10, 14); L(dk, -13, y - 6, 8, 12); L(lt, -13, y - 6, 8, 2); for (let i = 0; i < 3; i++) L(shade(m, -.1), -12, y - 3 + i * 3, 6, 1);
  E(OL, 1, y, 10, 9); E(m, 1, y, 9, 8); E(lt, 0, y - 4, 6, 3); for (let i = 0; i < 4; i++) { E(OL, 9, y - 6 + i * 4, 3.5, 2.5); E(i === 0 ? lt : m, 9, y - 6 + i * 4, 2.8, 1.8); L('#d8d8e0', 11, y - 7 + i * 4, 1, 1); }
  for (let i = 0; i < 3; i++) Poly('#c8c8d0', [[-2 + i * 4, y - 8], [0 + i * 4, y - 13], [2 + i * 4, y - 8]]);
  L(c.glow || '#c080ff', -12, y - 1, 2, 2); E(OL, 2, y + 7, 5, 2); L('#c8a040', -1, y - 1, 4, 3);
};
MON.gargoyle = (s, st, c) => {
  const { L, E, Ln, Poly } = monsterBase(s), t = st.t, stone = c.body || '#7a7a86', dk = shade(stone, -.3), lt = shade(stone, .2), flap = Math.sin(t * (st.atk ? 14 : 2)) * (st.atk ? 5 : 1.5), hov = st.atk ? 6 : 0;
  const y = -hov;
  Poly(OL, [[-4, y - 26], [-26, y - 38 - flap], [-30, y - 20 - flap], [-20, y - 22], [-14, y - 12], [-4, y - 14]]); Poly(dk, [[-4, y - 25], [-24, y - 36 - flap], [-28, y - 21 - flap], [-19, y - 22], [-13, y - 13], [-4, y - 15]]); Ln(shade(dk, -.2), -6, y - 24, -24, y - 35 - flap, 1); Ln(shade(dk, -.2), -8, y - 20, -26, y - 22 - flap, 1);
  Ln(OL, -5, y - 8, -8, y, 5); Ln(stone, -5, y - 8, -8, y, 3); Ln(OL, 5, y - 8, 8, y, 5); Ln(stone, 5, y - 8, 8, y, 3); L(OL, -11, y - 1, 6, 2); L(OL, 6, y - 1, 6, 2);
  E(OL, 0, y - 15, 10, 10); E(stone, 0, y - 15, 9, 9); E(dk, -3, y - 12, 6, 6); E(lt, 2, y - 19, 5, 3);
  Ln(OL, 5, y - 18, 13 + (st.atk || 0) * 6, y - 10, 4); Ln(stone, 5, y - 18, 13 + (st.atk || 0) * 6, y - 10, 2); for (let i = 0; i < 3; i++) L('#e8e8f0', 13 + (st.atk || 0) * 6 + i, y - 10 + i, 1, 2);
  const hx = 4, hy = y - 28; E(OL, hx, hy, 8, 7); E(stone, hx, hy, 7, 6); Poly(OL, [[hx - 5, hy - 4], [hx - 9, hy - 13], [hx - 2, hy - 6]]); Poly(OL, [[hx + 2, hy - 6], [hx + 5, hy - 14], [hx + 6, hy - 4]]); Poly(lt, [[hx - 5, hy - 5], [hx - 8, hy - 11], [hx - 3, hy - 6]]);
  L('#ff5030', hx + 1, hy - 2, 2, 1); L('#ff5030', hx + 5, hy - 2, 2, 1); L(OL, hx + 1, hy + 2, 7, 2); L('#fff', hx + 2, hy + 2, 1, 1); L('#fff', hx + 6, hy + 2, 1, 1);
  const r = RNG(22); for (let i = 0; i < 6; i++) L(dk, r.r(-7, 7), y + r.r(-24, -8), r.i(1, 3), 1);
};
/* humanoid enemies & bosses — presets for drawChar */
function drawMonster(def, x, y, st) {
  const s = (def.scale || 1) * (st.sMul || 1), face = st.face === undefined ? -1 : st.face;
  if (st.flash) PAINT = st.flashCol || '#ffffff';
  if (def.arch === 'human') {
    const o = Object.assign({ s, face, t: st.t, seed: def.id.length, low: st.low, walk: st.walk, crouch: st.crouch, lean: st.lean, sq: st.sq, rot: st.rot, alpha: st.alpha, expr: st.expr || def.look.expr, talking: st.talking }, def.look);
    if (st.armF !== undefined) o.armF = st.armF; if (st.wAng !== undefined) o.wAng = st.wAng; if (st.armB !== undefined) o.armB = st.armB; if (st.draw !== undefined) o.draw = st.draw;
    if (st.phase2 && def.look2) Object.assign(o, def.look2);
    if (def.throne && !st.phase2 && !st.noThrone) drawThrone(x, y, s, st.t);
    if (def.throne && st.phase2) { if (!st.noThrone) drawThroneShards(x, y, s, st.t); y -= 14 * s + Math.sin(st.t * 2) * 3 * s; }
    if (def.float && !def.throne) y -= (6 + Math.sin(st.t * 2) * 2) * s;
    drawChar(x, y, o);
  } else {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (face < 0) ctx.scale(-1, 1); if (st.rot) ctx.rotate(st.rot); if (st.sq && st.sq !== 1) ctx.scale(1 + (1 - st.sq) * .7, st.sq); if (st.alpha !== undefined) ctx.globalAlpha = st.alpha;
    if (def.arch !== 'sprite' && def.arch !== 'wraith' && def.arch !== 'gauntlet') { ctx.globalAlpha *= .3; pEll('#000', 0, 0, 14 * s, 3 * s); ctx.globalAlpha = st.alpha === undefined ? 1 : st.alpha; }
    MON[def.arch](s, st, def.look || {});
    ctx.restore();
  }
  PAINT = null;
}
function drawThrone(x, y, s, t) { const L = (c, a, b, w, h) => P(c, x + a * s, y + b * s, w * s, h * s); L(OL, -18, -60, 30, 62); L('#8ac8e8', -17, -59, 28, 60); L('#c8f0ff', -15, -57, 3, 55); L('#5a9ac0', 6, -57, 4, 55); for (let i = 0; i < 4; i++) { pPoly('#e0f8ff', [[x + (-17 + i * 8) * s, y - 59 * s], [x + (-13 + i * 8) * s, y - 70 * s], [x + (-9 + i * 8) * s, y - 59 * s]]); } L('#e8e2cc', -6, -66, 6, 6); L(OL, -5, -64, 1, 1); L(OL, -2, -64, 1, 1); L('#5a9ac0', -22, -24, 38, 6); L('#c8f0ff', -22, -24, 38, 1); }
function drawThroneShards(x, y, s, t) { for (let i = 0; i < 6; i++) { const a = t * .6 + i * 1.05, r = 26 + Math.sin(t + i) * 4; const px = x + Math.cos(a) * r * s, py = y - 40 * s + Math.sin(a) * 12 * s; pPoly('#a8e0f8', [[px, py - 6 * s], [px + 3 * s, py], [px, py + 5 * s], [px - 3 * s, py]]); P('#ffffff', px, py - 3 * s, 1, 2); } }
