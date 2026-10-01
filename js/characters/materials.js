'use strict';
/* =========================================================
   MATERIALS — named 5-step colour ramps (dk2, dk, base, lt, lt2)
   Shared by the Act II creature rigs and the Model Sheet so every
   surface reads as one material: shadow core → base → rim light.
   ========================================================= */
const MAT = {
  shell: ['#4a1408', '#8a2a18', '#d0583a', '#f08a5a', '#ffc8a0'], sand: ['#6a5030', '#a08050', '#d8c088', '#f0dca8', '#fff4d8'],
  feather: ['#6a6a70', '#a8a8b0', '#f0f0f0', '#ffffff', '#ffffff'], gullgrey: ['#3a4048', '#6a7480', '#a8b4c0', '#d0d8e0', '#f0f4f8'],
  jelly: ['#4a2a6a', '#8a5ab0', '#c890e8', '#e8c0ff', '#ffffff'], deepsea: ['#0a1020', '#1a2438', '#3a4a6a', '#5a7090', '#8ab0d0'],
  clam: ['#4a3a4a', '#7a6a7a', '#b8a8b0', '#e0d0d8', '#fff0f8'], eel: ['#1a2a10', '#2a4a1a', '#4a6a3a', '#6a9a50', '#a8d888'],
  pengblack: ['#08080c', '#14141c', '#24242e', '#3a3a4a', '#6a6a80'], snow: ['#6a88a8', '#a8c0d8', '#d8e8f0', '#f0f8ff', '#ffffff'],
  fur: ['#5a6878', '#8a98a8', '#c8d0d8', '#e8eef4', '#ffffff'], ice: ['#2a5a8a', '#4a8ac0', '#8ac8f0', '#c8f0ff', '#ffffff'],
  cloud: ['#8a90c8', '#b8bce0', '#e8e8f8', '#ffffff', '#ffffff'], horse: ['#7a7a90', '#b0b0c8', '#f0f0f8', '#ffffff', '#ffffff'],
  gold: ['#5a3a08', '#8a6018', '#c8a040', '#f0d070', '#fff4c0'], balloon: ['#6a1a3a', '#b02a5a', '#f05a8a', '#ff9ab8', '#ffffff'],
  candy: ['#6a2a5a', '#b05a9a', '#f8b8d8', '#ffd8ec', '#ffffff'], whale: ['#0a1430', '#1a2a50', '#2a4a7a', '#4a70a8', '#8ab0e0'],
  skin: ['#6a3a28', '#a86a48', '#e8b090', '#f8d0b0', '#fff0e0'], cursed: ['#1a0828', '#4a1868', '#8a30c0', '#c070ff', '#f0d0ff']
};
// derive a ramp from any hex so callers can pass either a MAT name or a colour
function matR(m) { if (Array.isArray(m)) return m; if (MAT[m]) return MAT[m]; return [shade(m, -.55), shade(m, -.28), m, shade(m, .22), shade(m, .45)]; }
// rim-lit blob: outline, base, core shadow on the underside, highlight toward the key light (up-left)
function matBlob(E, m, x, y, rx, ry, o = {}) {
  const r = matR(m); E(o.ol || OL, x, y, rx + 1, ry + 1); E(r[2], x, y, rx, ry);
  E(r[1], x + rx * .12, y + ry * .32, rx * .86, ry * .62); E(r[2], x - rx * .1, y - ry * .08, rx * .8, ry * .7);
  E(r[3], x - rx * .3, y - ry * .38, rx * .42, ry * .3); if (!o.matte) E(r[4], x - rx * .42, y - ry * .5, Math.max(.8, rx * .14), Math.max(.6, ry * .1));
}
