'use strict';
/* =========================================================
   UTILITIES / MATH / EASING
   ========================================================= */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const chance = p => Math.random() < p;
const TAU = Math.PI * 2;
const Ease = {
  lin: t => t,
  inQ: t => t * t, outQ: t => 1 - (1 - t) * (1 - t), ioQ: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  inC: t => t * t * t, outC: t => 1 - Math.pow(1 - t, 3), ioC: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inBack: t => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (TAU / 3)) + 1,
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2
};
function bez(p0, p1, p2, t) { const u = 1 - t; return u * u * p0 + 2 * u * t * p1 + t * t * p2; }
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgb(r, g, b, a) { return a === undefined ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`; }
function mix(c1, c2, t) { const a = hexToRgb(c1), b = hexToRgb(c2); return rgb(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)); }
function mixA(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function shade(h, k) { const a = hexToRgb(h); return k >= 0 ? rgb(lerp(a[0], 255, k), lerp(a[1], 255, k), lerp(a[2], 255, k)) : rgb(a[0] * (1 + k), a[1] * (1 + k), a[2] * (1 + k)); }

/* =========================================================
   RNG (seeded, for static decoration)
   ========================================================= */
function RNG(seed) { let s = seed >>> 0 || 1; const f = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; f.r = (a, b) => a + f() * (b - a); f.i = (a, b) => Math.floor(a + f() * (b - a + 1)); f.pick = arr => arr[Math.floor(f() * arr.length)]; return f; }
function hash(n) { n = (n << 13) ^ n; return 1 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824; }
function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); }
