'use strict';
/* =========================================================
   PIXEL ICONS (for cards, class picker, items)
   ========================================================= */
function icon(name, size = 48) {
  const c = Cache.get('icon_' + name, 24, 24, (x) => {
    const r = RNG(name.length * 31);
    const O = '#1a1016';
    switch (name) {
      case 'sword': pLine(O, 5, 19, 19, 5, 4); pLine('#d0d8e0', 6, 18, 18, 6, 2); pLine('#fff', 8, 15, 17, 6, 1); pLine(O, 4, 14, 10, 20, 3); pLine('#c8a040', 5, 15, 9, 19, 1); pLine('#6a3a1a', 3, 21, 6, 18, 2); break;
      case 'bow': for (let i = 0; i < 12; i++) { const a = -1.2 + i * .2; P(O, 12 + Math.cos(a) * 9 - 1, 12 + Math.sin(a) * 9 - 1, 3, 3); } for (let i = 0; i < 12; i++) { const a = -1.2 + i * .2; P('#9a6a3a', 12 + Math.cos(a) * 9, 12 + Math.sin(a) * 9, 1, 1); } pLine('#e8e0d0', 15, 3, 15, 21, 1); pLine('#8a6a4a', 4, 12, 20, 12, 1); P('#d0d8e0', 20, 11, 2, 3); break;
      case 'fire': pEll(O, 12, 14, 7, 8); pEll('#e04818', 12, 14, 6, 7); pEll('#f8a030', 12, 16, 4, 5); pEll('#fff0a0', 12, 18, 2, 3); pPoly('#e04818', [[8, 10], [10, 2], [13, 8]]); pPoly('#f8a030', [[12, 9], [16, 3], [16, 11]]); break;
      case 'water': pEll(O, 12, 15, 7, 7); pPoly(O, [[12, 2], [5, 14], [19, 14]]); pEll('#3a8ad8', 12, 15, 6, 6); pPoly('#3a8ad8', [[12, 4], [6, 14], [18, 14]]); pEll('#9ad8ff', 10, 14, 2, 3); P('#fff', 9, 12, 1, 2); break;
      case 'light': pCirc('#8a7a3a', 12, 12, 6); pCirc('#fff0a0', 12, 12, 4.5); pCirc('#fff', 11, 11, 1.5); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; pLine('#fff0a0', 12 + Math.cos(a) * 7, 12 + Math.sin(a) * 7, 12 + Math.cos(a) * 10, 12 + Math.sin(a) * 10, 1); } break;
      case 'guard': pPoly(O, [[4, 3], [20, 3], [20, 12], [12, 22], [4, 12]]); pPoly('#6a7a9a', [[5, 4], [19, 4], [19, 12], [12, 20], [5, 12]]); pPoly('#8a9aba', [[5, 4], [12, 4], [12, 20], [5, 12]]); P('#e8c050', 11, 6, 2, 11); P('#e8c050', 8, 9, 8, 2); break;
      case 'evade': for (let i = 0; i < 3; i++) pLine(['#4a6a8a', '#6a9aca', '#bfe0ff'][i], 3 + i * 3, 18 - i * 2, 12 + i * 3, 6 - i, 2); pCirc('#bfe0ff', 18, 8, 3); break;
      case 'items': pEll(O, 12, 15, 7, 7); P(O, 9, 3, 7, 8); pEll('#c03a4a', 12, 15, 6, 6); P('#e8dcc0', 10, 4, 5, 6); P('#8a5a2a', 10, 3, 5, 2); pEll('#f07080', 10, 13, 2, 2); P('#fff', 9, 12, 1, 1); break;
      case 'break': for (let i = 0; i < 10; i++) { const a = i * TAU / 10 - Math.PI / 2, rr = i % 2 ? 4 : 10; P('#1a1016', 12 + Math.cos(a) * rr - 1, 12 + Math.sin(a) * rr - 1, 3, 3); } pPoly('#e8b030', Array.from({ length: 10 }, (_, i) => { const a = i * TAU / 10 - Math.PI / 2, rr = i % 2 ? 4 : 10; return [12 + Math.cos(a) * rr, 12 + Math.sin(a) * rr]; })); pCirc('#fff4c0', 12, 12, 2); break;
      case 'skill_sword': pLine(O, 4, 20, 20, 4, 5); pLine('#e0e8f0', 5, 19, 19, 5, 3); pLine('#fff', 8, 16, 19, 5, 1); pLine('#e04040', 14, 3, 21, 10, 1); pLine('#e04040', 12, 3, 21, 12, 1); P('#6a3a1a', 3, 19, 3, 3); break;
      case 'skill_bow': for (let k = 0; k < 3; k++) { pLine('#8a6a4a', 3, 6 + k * 6, 17, 6 + k * 6, 1); P('#d0d8e0', 17, 5 + k * 6, 3, 3); P('#e04040', 2, 5 + k * 6, 2, 3); } break;
      case 'skill_fire': pCirc(O, 12, 12, 9); pCirc('#c03010', 12, 12, 8); pCirc('#f08020', 12, 12, 6); pCirc('#ffe070', 12, 12, 3); for (let i = 0; i < 6; i++) P('#ffe070', 12 + Math.cos(i) * 10, 12 + Math.sin(i) * 10, 1, 1); break;
      case 'skill_water': for (let k = 0; k < 3; k++) for (let i = 0; i < 20; i++) P(['#2a6ab8', '#4a9ae0', '#bfe8ff'][k], 2 + i, 8 + k * 4 + Math.sin(i * .6 + k) * 3, 1, 2); break;
      case 'skill_light': pPoly('#fff0a0', [[12, 1], [15, 9], [23, 12], [15, 15], [12, 23], [9, 15], [1, 12], [9, 9]]); pCirc('#fff', 12, 12, 3); break;
      case 'drumstick': pEll(O, 10, 10, 7, 6); pEll('#b86a2a', 10, 10, 6, 5); pEll('#e0944a', 9, 8, 3, 2); pLine(O, 14, 14, 20, 20, 4); pLine('#f4ecd8', 14, 14, 20, 20, 2); pCirc('#f4ecd8', 21, 21, 2); break;
      case 'mid': pEll(O, 12, 15, 7, 7); P(O, 9, 4, 7, 7); pEll('#3a8ad8', 12, 15, 6, 6); P('#e8dcc0', 10, 5, 5, 5); P('#8a5a2a', 10, 3, 5, 2); pEll('#9ad8ff', 10, 13, 2, 2); break;
      case 'high': pEll(O, 12, 15, 8, 7); P(O, 9, 3, 7, 7); pEll('#e8b030', 12, 15, 7, 6); P('#e8dcc0', 10, 4, 5, 5); P('#8a5a2a', 10, 2, 5, 2); pEll('#fff4a0', 10, 13, 2, 2); P('#fff', 16, 8, 1, 3); P('#fff', 15, 9, 3, 1); break;
      case 'antidote': P(O, 7, 4, 11, 17); P('#6ac070', 8, 8, 9, 12); P('#e8dcc0', 8, 5, 9, 3); P('#fff', 11, 11, 3, 6); P('#fff', 9, 13, 7, 2); break;
      case 'tonic': pEll(O, 12, 15, 7, 7); P(O, 10, 4, 5, 7); pEll('#8a4ad8', 12, 15, 6, 6); P('#e8dcc0', 11, 5, 3, 5); for (let i = 0; i < 4; i++) P('#e0c0ff', 9 + i * 2, 12 + (i % 2) * 3, 1, 1); break;
      case 'smoke': pCirc(O, 12, 14, 8); pCirc('#4a4a5a', 12, 14, 7); pCirc('#6a6a7a', 10, 12, 3); P('#8a5a2a', 11, 3, 3, 5); P('#f8a030', 12, 1, 1, 2); break;
      case 'coin': pCirc('#8a5a10', 12, 12, 8); pCirc('#e8b030', 12, 12, 7); pCirc('#fff0a0', 10, 10, 2); P('#8a5a10', 11, 7, 2, 10); break;
      case 'flee': pPoly('#bfe0ff', [[4, 12], [12, 4], [12, 9], [20, 9], [20, 15], [12, 15], [12, 20]]); break;
      default: pCirc('#888', 12, 12, 8);
    }
  });
  return c;
}
function drawIcon(name, x, y, size = 48, alpha = 1) { g.imageSmoothingEnabled = false; g.globalAlpha = alpha; g.drawImage(icon(name), Math.round(x - size / 2), Math.round(y - size / 2), size, size); g.globalAlpha = 1; }
