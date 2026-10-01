'use strict';
/* =========================================================
   COMPANIONS — Lucien (bathrobe), Sir Honkington, Sister Pell
   Drawn in combat behind the hero, at the port, and in cutscenes.
   ========================================================= */
const COMP_LOOK = {
  lucien: o => Object.assign({ face: 1, seed: 4, hairStyle: 'longdark', hair: '#141018', skin: '#ecd6c8', eye: '#8a2030', robe: '#8a7aa8', top: '#8a7aa8', sleeve: '#9a8ab8', pants: '#ecd6c8', boots: '#e8c8d8', belt: '#c8b8d8', stole: '#f0e8f0', weapon: 'none', expr: 'tired', body: 'lanky' }, o),
  pell: o => Object.assign({ face: 1, seed: 7, hood: true, hoodC: '#1a1a24', hair: '#8a5a3a', hairStyle: 'short', robe: '#22222e', top: '#22222e', sleeve: '#22222e', pants: '#22222e', boots: '#3a2a20', stole: '#f0f0f0', cross: true, skin: '#f4cfa6', expr: 'happy', body: 'round', weapon: 'none', book: true }, o)
};
function drawCompanion(id, x, y, o = {}) {
  if (id === 'honk') { drawMonster(Object.assign({}, ENEMY.goose, { scale: 1 }), x, y, { t: o.t || T, face: o.face === undefined ? 1 : o.face, sMul: (o.s || 1) * .95, walk: o.walk, atk: o.atk, talking: o.talking }); const s = (o.s || 1) * .95, f = o.face === undefined ? 1 : o.face; P('#c8a040', x + f * 8 * s - 2, y - 30 * s, 5, 2); return; }
  if (COMP_LOOK[id]) drawChar(x, y, COMP_LOOK[id](o));
}
const Party = {
  active() { return S && S.act >= 2 && S.comp && S.party.includes(S.comp) ? S.comp : null; },
  join(id) { if (!S.party.includes(id)) { S.party.push(id); Toast.add(`${COMPANIONS[id].name} joined the party`, COL.gold2, '♥'); } if (!S.comp) S.comp = id; },
  pick(id) { S.comp = id; SFX.play('confirm'); Toast.add(`${COMPANIONS[id].name} will assist in fights`, COMPANIONS[id].col, '♥'); Save.save(true); }
};
function openParty() {
  SFX.play('page'); const ov = Overlays.push({ name: 'party', draw() {
    const P0 = a2Panel('PARTY · CHOOSE YOUR ASSIST', 900, 480);
    ['lucien', 'honk', 'pell'].forEach((id, i) => { const C = COMPANIONS[id], x = P0.x + 30 + i * 285, y = P0.y + 80, have = S.party.includes(id), on = S.comp === id;
      UI.panel(x, y, 270, 300, { bg: on ? 'rgba(80,60,30,.9)' : 'rgba(40,28,40,.9)' }); UI.text(have ? C.name : '???', x + 135, y + 34, { align: 'center', size: 18, col: have ? C.col : COL.dim });
      UI.text(have ? C.title : 'Not met yet', x + 135, y + 56, { align: 'center', size: 12, col: COL.dim, bold: false, maxW: 250 });
      if (have) { UI.text(C.move, x + 135, y + 200, { align: 'center', size: 15, col: COL.gold2 }); UI.para(C.desc, x + 20, y + 222, 230, { size: 12, col: COL.cream, lh: 16, align: 'center' }); }
      if (UI.btn(on ? 'ASSISTING' : 'CHOOSE', x + 45, y + 250, 180, 38, { accent: on, disabled: !have, id: 'pt' + id })) Party.pick(id); });
    // portraits drawn by the scene (port) under the overlay are not visible, so sketch tiny ones here
    if (UI.btn('Close', 580, P0.y + P0.h - 52, 120, 38, { key: 'Escape' })) Overlays.pop(ov); } });
}
