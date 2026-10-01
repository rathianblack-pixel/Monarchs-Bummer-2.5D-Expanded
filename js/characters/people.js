'use strict';
/* =========================================================
   CHARACTER RENDERER — compact expressive pixel-cartoon people
   Local space: feet at origin, facing +x. Scaled by s.
   ========================================================= */
const ARMOR_TIERS = [
  { name: 'Patched Tunic', top: '#8a6a4c', pants: '#4c4036', boots: '#3a2a20', belt: '#6a4a2a', hood: '#6e5a42', patch: '#a88a5c' },
  { name: 'Leather Jerkin', top: '#9a6438', pants: '#4a3a30', boots: '#4a2e1c', belt: '#3a2414', strap: '#5a3418', hood: '#7a5230' },
  { name: 'Riveted Mail', top: '#8a929c', pants: '#3e3a40', boots: '#3a2c26', belt: '#5a3a22', mail: true, tabard: '#5a6a8a' },
  { name: 'Knightsteel Plate', top: '#b4bec8', pants: '#3a3a48', boots: '#6a7078', belt: '#4a3020', plate: true, tabard: '#3a4c7a' },
  { name: 'Gilded Regret Plate', top: '#c4c8d4', pants: '#2e2a3a', boots: '#7a7a86', belt: '#8a6a20', plate: true, gold: true, tabard: '#8a2432', cape: '#7a1c2a' }
];
const WEAPON_TIERS = {
  sword: ['Rusty Shortsword', 'Honest Blade', 'Tempered Longsword', 'Knightsteel Edge', 'Reasonably Large Sword'],
  bow: ['Twig Bow', 'Hunter\'s Bow', 'Recurve of Mild Concern', 'Yew Longbow', 'Bow of Petty Vengeance'],
  fire: ['Singed Stick', 'Ember Rod', 'Cinder Staff', 'Pyre Scepter', 'Borrowed Midnight Staff'],
  water: ['Damp Branch', 'Brook Wand', 'Tidecaller Staff', 'Deepwater Rod', 'Staff of Tuesdays'],
  light: ['Candle Stick', 'Lantern Rod', 'Dawn Staff', 'Halo Scepter', 'Staff of Divine Disappointment']
};
function drawChar(x, y, o) {
  const s = o.s || 1, t = o.t === undefined ? T : o.t, seed = o.seed || 0;
  const L = (c, a, b, w, h) => P(c, a * s, b * s, w * s, h * s), E = (c, a, b, rx, ry) => pEll(c, a * s, b * s, rx * s, ry * s), Ln = (c, a, b, c2, d, th = 1) => pLine(c, a * s, b * s, c2 * s, d * s, Math.max(1, Math.round(th * s)));
  const ol = o.outline || '#1c1218';
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if ((o.face || 1) < 0) ctx.scale(-1, 1);
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (o.rot) ctx.rotate(o.rot);
  if (o.sq && o.sq !== 1) ctx.scale(1 + (1 - o.sq) * .7, o.sq);
  const body = o.body || 'sturdy', low = !!o.low;
  const bw = body === 'round' ? 15 : body === 'lanky' ? 10 : 13, legH = body === 'lanky' ? 12 : 10, torsoH = body === 'lanky' ? 14 : 13;
  const brSp = low ? 1.4 : 2.2, brA = low ? 1 : .5, walking = o.walk !== undefined && o.walk !== null;
  // 4-frame breathing idle (held keys read as hand-animated pixel frames); smooth sine when ANIM8 is off
  const br = typeof ANIM8 !== 'undefined' && ANIM8.on && !walking ? [-1, 0, 1, 0][(((Math.floor((t * brSp + seed) / (Math.PI / 2)) % 4) + 4) % 4)] * brA * 1.25 : Math.sin(t * brSp + seed) * brA;
  let walk = o.walk, legF = 0, legB = 0, liftF = 0, liftB = 0, bob = 0, armSwing = 0;
  if (walking && typeof ANIM8 !== 'undefined' && ANIM8.on) { const K = ANIM8.walk[(((Math.floor(walk / (Math.PI / 4) + .5) % 8) + 8) % 8)]; legF = K[0]; legB = -K[0]; liftF = K[1]; liftB = K[2]; bob = K[3]; armSwing = K[4]; }
  else if (walking) { legF = Math.sin(walk) * 3; legB = -legF; liftF = Math.max(0, -Math.cos(walk)) * 1.5; liftB = Math.max(0, Math.cos(walk)) * 1.5; bob = -Math.abs(Math.sin(walk)) * 1; armSwing = Math.sin(walk) * .6; }
  const crouch = o.crouch || 0, lean = (o.lean || 0) + (low ? 1 : 0);
  const hipY = o.sit ? -9 : -legH + crouch * 3, topY = hipY - torsoH + br * .5 + bob;
  const tier = o.tier || 0, A = o.armor || ARMOR_TIERS[tier];
  const topC = o.top || A.top, pants = o.pants || A.pants, boots = o.boots || A.boots, skin = o.skin || '#f0c49a', skinD = shade(skin, -.22);
  if (o.shadow !== false) { ctx.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * .42; pEll('#24123a', 0, 0, 10 * s, 3 * s); pEll('#24123a', 0, 0, 7 * s, 2 * s); ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha; }
  // cape
  const capeC = o.cape || A.cape;
  if (capeC && o._cape) { const C = o._cape, f = [3, topY + 1], S2 = (p) => [p[0] * s, p[1] * s]; const front = [f, [C[2][0] + 5.5, C[2][1]], [C[4][0] + 4.5, C[4][1] + 1]], back = [[C[4][0] - 1, C[4][1]], [C[3][0] - 1, C[3][1]], [C[2][0] - 1, C[2][1]], [C[1][0], C[1][1]], [-4, topY + 1]];
    pPoly(ol, front.concat(back).map(p => [(p[0] - 1) * s, (p[1] + .6) * s])); pPoly(capeC, front.concat(back).map(S2)); Ln(shade(capeC, -.3), C[1][0] + 2, C[1][1] + 1, C[3][0] + 2, C[3][1], 1); Ln(shade(capeC, .18), 2, topY + 2, C[2][0] + 4.5, C[2][1], 1); if (o.fur) E(o.fur, 0, topY + 1, 7, 3); }
  else if (capeC) { const fl = Math.sin(t * 2.6 + seed) * 1.5 + (o.windCape || 0) + (walk !== undefined && walk !== null ? -2 : 0); pPoly(ol, [[-4 * s, (topY + 1) * s], [3 * s, (topY + 1) * s], [(-8 + fl) * s, (hipY + 9) * s], [(-13 + fl) * s, (hipY + 8) * s]].map(p => [p[0] - s, p[1]])); pPoly(capeC, [[-4 * s, (topY + 1) * s], [3 * s, (topY + 1) * s], [(-8 + fl) * s, (hipY + 8) * s], [(-12 + fl) * s, (hipY + 7) * s]]); L(shade(capeC, -.3), -6 + fl * .5, topY + 6, 1, 8); if (o.fur) E(o.fur, 0, topY + 1, 7, 3); }
  // secondary-motion tails behind the body (long hair, scarf ends) from the chain sim
  if (o._tail) { const C = o._tail, hc = o._tailC || o.hair || '#5a3a24'; for (let i = 0; i < C.length - 1; i++) Ln(ol, C[i][0], C[i][1], C[i + 1][0], C[i + 1][1], 5 - i * .7); for (let i = 0; i < C.length - 1; i++) Ln(hc, C[i][0], C[i][1], C[i + 1][0], C[i + 1][1], 3 - i * .5); L(shade(hc, .25), C[0][0], C[0][1], 1, 2); }
  // back arm
  const shB = [-bw / 2 + 2 + lean * .5, topY + 3], armLen = 9;
  const aB = (o.armB !== undefined ? o.armB : -.15 - armSwing) - (low ? .1 : 0);
  const sleeve = o.sleeve || topC;
  const hB = [shB[0] + Math.sin(aB) * armLen, shB[1] + Math.cos(aB) * armLen];
  Ln(ol, shB[0], shB[1], hB[0], hB[1], 4); Ln(shade(sleeve, -.25), shB[0], shB[1], hB[0], hB[1], 2.6); L(shade(skin, -.3), hB[0] - 1, hB[1] - 1, 2, 2);
  // legs
  const legW = body === 'round' ? 5 : 4;
  const drawLeg = (lx, lift, dark) => { if (o.sit) { const pc = dark ? shade(pants, -.25) : pants, bc = dark ? shade(boots, -.25) : boots; L(ol, lx - 1, hipY - 1, 11, legW + 2); L(pc, lx, hipY, 10, legW); L(ol, lx + 7, hipY, legW + 2, -hipY + 1); L(pc, lx + 8, hipY + 1, legW, -hipY - 3); L(bc, lx + 8, -3, legW + 2, 3); return; } const pc = dark ? shade(pants, -.25) : pants, bc = dark ? shade(boots, -.25) : boots; L(ol, lx - 1, hipY - 1, legW + 2, legH - lift + 1); L(pc, lx, hipY, legW, legH - 3 - lift); L(ol, lx - 1, -4 - lift, legW + 3, 4); L(bc, lx, -3 - lift, legW + 2, 3); L(shade(bc, .25), lx + 1, -3 - lift, 2, 1); };
  drawLeg(-4 + legB * .8, liftB, true); drawLeg(0 + legF * .8, liftF, false);
  // robe / skirt
  if (o.robe) { const rc = o.robe, hm = o._hem || 0; pPoly(ol, [[(-bw / 2 - 1 + lean * .3) * s, (hipY - 2) * s], [(bw / 2 + 1 + lean * .3) * s, (hipY - 2) * s], [(bw / 2 + 3 + hm) * s, (-1) * s], [(-bw / 2 - 3 + hm) * s, (-1) * s]]); pPoly(rc, [[(-bw / 2 + lean * .3) * s, (hipY - 2) * s], [(bw / 2 + lean * .3) * s, (hipY - 2) * s], [(bw / 2 + 2 + hm) * s, (-2) * s], [(-bw / 2 - 2 + hm) * s, (-2) * s]]); L(shade(rc, -.25), -2, hipY, 1, -hipY - 3); L(shade(rc, .12), 3, hipY, 1, -hipY - 4); }
  // torso
  const tx = -bw / 2 + lean * .6;
  L(ol, tx - 1, topY - 1, bw + 2, torsoH + 2);
  if (body === 'round') { E(ol, tx + bw / 2, topY + torsoH * .6, bw / 2 + 2, torsoH * .5 + 1); E(topC, tx + bw / 2, topY + torsoH * .6, bw / 2 + 1, torsoH * .5); }
  L(topC, tx, topY, bw, torsoH); L(shade(topC, -.22), tx, topY, 2, torsoH); L(shade(topC, .15), tx + bw - 3, topY + 1, 1, torsoH - 3);
  if (A.mail && !o.top) { for (let yy = 1; yy < torsoH - 1; yy += 2) for (let xx = 1 + (yy % 4 === 1 ? 1 : 0); xx < bw - 1; xx += 2) L(shade(topC, -.18), tx + xx, topY + yy, 1, 1); }
  if (A.plate && !o.top) { L(shade(topC, .3), tx + 3, topY + 2, bw - 6, 1); L(shade(topC, -.3), tx + 1, topY + torsoH / 2, bw - 2, 1); L('#ffffff', tx + bw - 4, topY + 2, 1, 2); }
  if (A.tabard && !o.top) { L(A.tabard, tx + bw / 2 - 2, topY + 3, 5, torsoH + 1); L(shade(A.tabard, .2), tx + bw / 2 - 1, topY + 3, 1, torsoH); if (A.gold) { L('#e8c050', tx + bw / 2 - 2, topY + 3, 5, 1); L('#e8c050', tx + bw / 2, topY + 6, 1, 3); } }
  if (A.patch && !o.top) { L(A.patch, tx + 3, topY + 4, 3, 3); L(shade(A.patch, -.3), tx + 3, topY + 4, 3, 1); L(A.patch, tx + bw - 5, topY + 8, 2, 3); }
  if (A.strap && !o.top) Ln(A.strap, tx + 1, topY + 1, tx + bw - 2, topY + torsoH - 3, 2);
  if (o.apron) { L(o.apron, tx + 2, topY + 4, bw - 4, torsoH + 3); L(shade(o.apron, -.2), tx + 2, topY + 4, bw - 4, 1); }
  if (o.stole) { L(o.stole, tx + 3, topY, 2, torsoH + 2); L(o.stole, tx + bw - 5, topY, 2, torsoH + 2); L('#e8c050', tx + 3, topY + torsoH, 2, 1); L('#e8c050', tx + bw - 5, topY + torsoH, 2, 1); }
  if (o.cross) { L('#e8c050', tx + bw / 2 - 1, topY + 3, 1, 5); L('#e8c050', tx + bw / 2 - 2, topY + 4, 3, 1); }
  if (o.fur) { E(ol, tx + bw / 2, topY, bw / 2 + 2, 3.5); E(o.fur, tx + bw / 2, topY, bw / 2 + 1, 2.8); for (let i = 0; i < 5; i++) L(shade(o.fur, -.2), tx + 1 + i * 3, topY + 1, 1, 2); }
  const beltC = o.belt || A.belt; if (beltC && !o.robe) { L(beltC, tx, hipY - 3, bw, 2); L('#d8b060', tx + bw / 2 + 1, hipY - 3, 2, 2); }
  if (o.dmg > .3) { const r = RNG(seed + 3); for (let i = 0; i < 4; i++) L(shade(topC, -.45), tx + r.i(1, bw - 3), topY + r.i(2, torsoH - 2), r.i(1, 3), 1); L('#6a4a3a', tx + 2, hipY - 1, 2, 1); }
  // head
  const hx = 1 + lean + (o.headX || 0), hy = topY - 8 + br * .3 + (low ? 1 : 0) + (o.headY || 0) + (walking && typeof ANIM8 !== 'undefined' && ANIM8.on ? ANIM8.walk[(((Math.floor(walk / (Math.PI / 4) + .5) % 8) + 7) % 8)][3] * .5 - bob * .5 : 0);
  drawHead(hx, hy, o, s, t, ol, skin, skinD);
  // front arm
  const shF = [bw / 2 - 3 + lean * .7, topY + 3];
  const aF = o.armF !== undefined ? o.armF : .15 + armSwing;
  const hF = [shF[0] + Math.sin(aF) * armLen, shF[1] + Math.cos(aF) * armLen];
  if (o.weapon === 'shield') drawWeapon(o, hF, aF, s, t, ol, 'behind');
  if (o.shield) drawWeapon({ weapon: 'shield', shieldC: o.shieldC }, [bw / 2 - 1 + lean * .7, topY + 9], 0, s, t, ol, 'behind');
  Ln(ol, shF[0], shF[1], hF[0], hF[1], 4); Ln(sleeve, shF[0], shF[1], hF[0], hF[1], 2.6);
  if (A.plate && !o.top) { E(ol, shF[0], shF[1], 3.5, 3); E(shade(topC, .1), shF[0], shF[1], 2.7, 2.2); L('#fff', shF[0], shF[1] - 1, 1, 1); if (A.gold) L('#e8c050', shF[0] - 2, shF[1] + 1, 4, 1); }
  L(ol, hF[0] - 1.5, hF[1] - 1.5, 3, 3); L(skin, hF[0] - 1, hF[1] - 1, 2, 2);
  drawWeapon(o, hF, aF, s, t, ol, 'front');
  if (o.book) { L(ol, hF[0] - 1, hF[1] - 4, 6, 7); L('#5a2a3a', hF[0], hF[1] - 3, 4, 5); L('#e8c050', hF[0] + 1, hF[1] - 1, 2, 1); }
  ctx.restore();
}
function drawHead(hx, hy, o, s, t, ol, skin, skinD) {
  const L = (c, a, b, w, h) => P(c, a * s, b * s, w * s, h * s), E = (c, a, b, rx, ry) => pEll(c, a * s, b * s, rx * s, ry * s), Ln = (c, a, b, c2, d, th = 1) => pLine(c, a * s, b * s, c2 * s, d * s, Math.max(1, Math.round(th * s)));
  const hs = o.hairStyle || 'short', hair = o.hair || '#5a3a24', ht = o.head || 'human', seed = o.seed || 0;
  const hr = o.child ? 9.5 : 8.5;
  // back hair / hood (behind head)
  if (hs === 'long' || hs === 'longdark') { const sw = Math.sin(t * 1.8 + seed) * 1; pPoly(ol, [[(hx - 9) * s, (hy - 3) * s], [(hx + 3) * s, (hy - 3) * s], [(hx - 2 + sw) * s, (hy + 17) * s], [(hx - 11 + sw) * s, (hy + 15) * s]]); pPoly(hair, [[(hx - 8) * s, (hy - 3) * s], [(hx + 2) * s, (hy - 3) * s], [(hx - 3 + sw) * s, (hy + 16) * s], [(hx - 10 + sw) * s, (hy + 14) * s]]); L(shade(hair, .2), hx - 6 + sw * .5, hy + 2, 1, 10); }
  if (o.hood || hs === 'hood') { const hc = o.hoodC || (o.armor || ARMOR_TIERS[o.tier || 0]).hood || '#6e5a42'; E(ol, hx - 1, hy - .5, hr + 2.5, hr + 2); E(hc, hx - 1, hy - .5, hr + 1.5, hr + 1); E(shade(hc, -.25), hx - 4, hy + 1, hr - 1, hr - 1); }
  if (ht === 'bull') { // big bull head
    E(ol, hx, hy, 10.5, 9.5); E(skin, hx, hy, 9.5, 8.5); E(skinD, hx - 3, hy + 1, 6, 7); E(skin, hx + 1, hy - 1, 8, 7);
    E(ol, hx + 7, hy + 3, 5.5, 4.5); E(shade(skin, .25), hx + 7, hy + 3, 4.5, 3.5); L('#3a2020', hx + 9, hy + 2, 1, 1); L('#3a2020', hx + 6, hy + 2, 1, 1);
    L('#e8d070', hx + 7, hy + 6, 2, 2);
    const hornC = '#e8dcc0'; Ln(ol, hx - 4, hy - 7, hx - 12, hy - 13, 4); Ln(hornC, hx - 4, hy - 7, hx - 12, hy - 13, 2); Ln(ol, hx + 3, hy - 8, hx + 9, hy - 15, 4); Ln(hornC, hx + 3, hy - 8, hx + 9, hy - 15, 2); L('#fff', hx + 8, hy - 14, 1, 1);
    E(shade(skin, -.3), hx - 7, hy - 4, 3, 2);
  } else {
    const sk = ht === 'skull' ? '#e8e2cc' : ht === 'orc' ? (o.skin || '#7a9a4a') : ht === 'goblin' ? (o.skin || '#8aaa4a') : ht === 'mummy' ? '#c8b890' : ht === 'helm' ? '#5a5a66' : skin;
    const skD = shade(sk, -.22);
    if (ht === 'goblin') { pPoly(ol, [[(hx - 3) * s, (hy - 3) * s], [(hx - 15) * s, (hy - 8) * s], [(hx - 4) * s, (hy + 2) * s]]); pPoly(sk, [[(hx - 3) * s, (hy - 2) * s], [(hx - 13) * s, (hy - 7) * s], [(hx - 4) * s, (hy + 1) * s]]); }
    E(ol, hx, hy, hr + 1, hr + .5); E(sk, hx, hy, hr, hr - .5); E(skD, hx - 2.5, hy + 1, hr - 2.5, hr - 2.5); E(sk, hx + .8, hy - .6, hr - 1.2, hr - 1.8);
    L(shade(sk, .25), hx + 2, hy - hr + 2, 3, 1); L(shade(sk, .25), hx + 5, hy - hr + 3, 1, 1);
    if (ht === 'human' || ht === 'orc') { E(ol, hx - 3.5, hy + 1, 2, 2.5); E(skD, hx - 3.5, hy + 1, 1.2, 1.8); }
    if (ht === 'helm') { L(ol, hx - hr, hy - 1, hr * 2, 1); L(o.visor || '#ff4030', hx + 1, hy - 1, 6, 1); L(shade(sk, .35), hx - 2, hy - hr + 1, 1, hr); if (o.plume) { const sw = Math.sin(t * 2) * 1; pPoly(o.plume, [[(hx - 2) * s, (hy - hr) * s], [(hx + 2) * s, (hy - hr) * s], [(hx - 8 + sw) * s, (hy - hr - 6) * s], [(hx - 12 + sw) * s, (hy - hr + 2) * s]]); } }
    // face
    if (ht !== 'helm') drawFace(hx, hy, o, s, t, ol, sk, ht);
    if (ht === 'mummy') { for (let i = -6; i < 7; i += 3) Ln(shade(sk, -.3), hx - 7, hy + i, hx + 8, hy + i - 2, 1); E('#6a8a4a', hx - 3, hy + 4, 1.5, 1); E('#6a8a4a', hx + 4, hy - 5, 1, 1); }
    if (ht === 'orc') { L('#fff8e0', hx + 3, hy + 3, 1, 3); L('#fff8e0', hx + 7, hy + 3, 1, 3); L(shade(sk, -.35), hx + 1, hy - 3, 8, 1); }
  }
  // hair / hats in front
  if (o.hood || hs === 'hood') { const hc = o.hoodC || (o.armor || ARMOR_TIERS[o.tier || 0]).hood || '#6e5a42'; E(hc, hx - 1, hy - 5.5, hr + .5, 4); L(shade(hc, .2), hx - 3, hy - 9, 6, 1); E(hc, hx - 6, hy, 4, 7); L(hair, hx + 1, hy - 3, 5, 1); L(hair, hx + 3, hy - 2, 2, 1); if ((o.tier || 0) === 0) { L((o.armor || ARMOR_TIERS[0]).patch || '#a88a5c', hx - 7, hy - 4, 3, 3); } }
  else if (hs === 'short' || hs === 'long' || hs === 'longdark' || hs === 'spiky' || hs === 'bun' || hs === 'curly') {
    E(ol, hx - 1, hy - 5, hr + .5, 5.5); E(hair, hx - 1, hy - 5, hr, 4.8); E(hair, hx - 5, hy - 1, 4.5, 6);
    L(shade(hair, .25), hx - 3, hy - 9, 5, 1); L(shade(hair, -.25), hx - 8, hy, 2, 4);
    L(hair, hx + 4, hy - 3, 3, 2); L(hair, hx + 7, hy - 3, 1, 2); if (hs === 'spiky') { for (let i = 0; i < 4; i++) { Ln(hair, hx - 6 + i * 3, hy - 8, hx - 8 + i * 3, hy - 13, 2); } }
    if (hs === 'bun') { E(ol, hx - 5, hy - 10, 4, 4); E(hair, hx - 5, hy - 10, 3, 3); }
    if (hs === 'curly') { for (let i = 0; i < 5; i++) E(hair, hx - 7 + i * 3, hy - 8 + (i % 2), 2.2, 2.2); }
  } else if (hs === 'bald') { L(shade(skin, .35), hx - 1, hy - 7, 3, 1); E(o.hair || '#c8c0b0', hx - 6, hy + 1, 2, 3); }
  if (o.beard) { E(ol, hx + 3, hy + 6, 6.5, 4.5); E(o.beard, hx + 3, hy + 6, 5.5, 3.8); L(shade(o.beard, .2), hx + 2, hy + 4, 3, 1); L('#2a1a1a', hx + 3, hy + 4, 3, 1); }
  if (o.mustache) { L(o.mustache, hx + 1, hy + 3, 7, 2); L(o.mustache, hx, hy + 4, 1, 2); L(o.mustache, hx + 8, hy + 4, 1, 2); }
  const hat = o.hat;
  if (hat === 'crown' || hat === 'crownfire') { const cx = hx - 5, cy = hy - hr - 2; L(ol, cx - 1, cy - 1, 12, 5); L('#e8b830', cx, cy, 10, 3); for (let i = 0; i < 4; i++) { L(ol, cx + i * 3 - .5, cy - 3, 2, 3); L('#f4d860', cx + i * 3, cy - 3, 1, 3); } L('#c02030', cx + 4, cy + 1, 2, 1); L('#fff8c0', cx + 1, cy, 1, 1); if (hat === 'crownfire') { for (let i = 0; i < 4; i++) { const fh = 3 + Math.abs(Math.sin(t * 9 + i * 1.7)) * 4; L('#f0c040', cx + i * 3, cy - 3 - fh, 1, fh); L('#6a2a8a', cx + i * 3 + 1, cy - 2 - fh * .6, 1, fh * .6); } } }
  else if (hat === 'helmet') { E(ol, hx - 1, hy - 4, hr + 1.5, 6.5); E('#8a929c', hx - 1, hy - 4, hr + .5, 5.5); L('#d0d8e0', hx - 3, hy - 8, 5, 1); L('#6a727c', hx - hr, hy - 1, hr * 2, 2); L('#8a929c', hx + 3, hy - 1, 2, 5); }
  else if (hat === 'straw') { E(ol, hx, hy - 6, hr + 5, 3); E('#d8b860', hx, hy - 6, hr + 4, 2.2); E('#c8a040', hx - 1, hy - 9, 6, 4); L('#8a3a2a', hx - 6, hy - 7, 11, 1); }
  else if (hat === 'tophat') { L(ol, hx - 7, hy - 8, 15, 3); L('#2a2430', hx - 6, hy - 8, 13, 2); L(ol, hx - 5, hy - 18, 11, 11); L('#2a2430', hx - 4, hy - 17, 9, 9); L('#8a2a3a', hx - 4, hy - 10, 9, 2); }
  else if (hat === 'feather') { E(ol, hx - 1, hy - 7, hr, 4); E('#3a6a4a', hx - 1, hy - 7, hr - 1, 3); const sw = Math.sin(t * 3) * 1; Ln('#e04040', hx - 4, hy - 9, hx - 12 + sw, hy - 17, 2); Ln('#f08060', hx - 5, hy - 10, hx - 10 + sw, hy - 16, 1); }
  else if (hat === 'wizard') { pPoly(ol, [[(hx - 10) * s, (hy - 5) * s], [(hx + 9) * s, (hy - 5) * s], [(hx - 6) * s, (hy - 22) * s]]); pPoly(o.hatC || '#3a2a5a', [[(hx - 9) * s, (hy - 6) * s], [(hx + 8) * s, (hy - 6) * s], [(hx - 6) * s, (hy - 21) * s]]); L(o.hatTrim || '#c8a040', hx - 9, hy - 7, 17, 2); }
  else if (hat === 'cap') { E(ol, hx - 1, hy - 6, hr, 4); E(o.hatC || '#6a4a8a', hx - 1, hy - 6, hr - 1, 3); L(o.hatC || '#6a4a8a', hx + 3, hy - 5, 7, 2); }
  else if (hat === 'scarf') { E(ol, hx - 1, hy - 3, hr + 1.5, hr); E(o.hatC || '#a84a5a', hx - 1, hy - 3, hr + .5, hr - 1); E(o.skin || skin, hx + 2, hy + 1, 6, 6); drawFace(hx, hy, o, s, t, ol, o.skin || skin, 'human'); L(shade(o.hatC || '#a84a5a', .2), hx - 5, hy - 9, 6, 1); }
  else if (hat === 'hoodDark') { E(ol, hx - 1, hy - 1, hr + 2.5, hr + 2); E(o.hatC || '#2a2238', hx - 1, hy - 1, hr + 1.5, hr + 1); E('#0e0a14', hx + 2, hy + 1, 6, 6); const glow = o.eyeGlow || '#80ff90'; L(glow, hx + 1, hy, 2, 1); L(glow, hx + 5, hy, 2, 1); }
  if (o.glasses) { L('#2a2a2a', hx, hy - 2, 4, 1); L('#2a2a2a', hx + 5, hy - 2, 4, 1); L('#2a2a2a', hx, hy + 1, 4, 1); L('#2a2a2a', hx + 5, hy + 1, 4, 1); L('#2a2a2a', hx + 4, hy - 1, 1, 1); L('rgba(220,240,255,.6)', hx + 1, hy - 1, 1, 1); }
  if (o.sweat) { const k = (t * 1.5 + seed) % 1; L('#a8d8ff', hx - 6, hy - 4 + k * 6, 1, 2); L('#a8d8ff', hx + 9, hy - 6 + ((k + .5) % 1) * 6, 1, 2); }
}
function drawFace(hx, hy, o, s, t, ol, sk, ht) {
  const L = (c, a, b, w, h) => P(c, a * s, b * s, w * s, h * s);
  const expr = o.expr || 'neutral', seed = o.seed || 0;
  const bp = (t + seed * 1.37) % 3.9, dbl = (seed % 3) === 1 && bp > .34 && bp < .44, blink = (bp < .12 || dbl) && expr !== 'hurt', half = !blink && expr !== 'hurt' && (bp < .19 || bp > 3.84 || (seed % 3 === 1 && bp > .27 && bp < .5));
  const look = o.look === undefined ? (Math.sin(t * .5 + seed) > .85 ? -1 : 0) : o.look;
  const ex1 = hx + 1, ex2 = hx + 5, ey = hy - 1;
  const eyeC = o.eye || '#2a1a14', white = '#fbf6ea';
  if (ht === 'skull') {
    L('#1a1418', ex1 - 1, ey - 1, 3, 4); L('#1a1418', ex2 - 1, ey - 1, 4, 4); const gl = o.eyeGlow || '#70e0ff'; L(gl, ex1, ey + 1, 1, 1); L(gl, ex2 + 1, ey + 1, 1, 1);
    L('#1a1418', hx + 3, ey + 4, 1, 2); for (let i = 0; i < 4; i++) L(i % 2 ? '#c8c2ac' : '#1a1418', hx + 1 + i * 2, hy + 6, 1, 2); return;
  }
  if (blink) { L(ol, ex1, ey + 1, 2, 1); L(ol, ex2, ey + 1, 2, 1); }
  else if (expr === 'happy') { L(ol, ex1, ey + 1, 1, 1); L(ol, ex1 + 1, ey, 1, 1); L(ol, ex1 + 2, ey + 1, 1, 1); L(ol, ex2, ey + 1, 1, 1); L(ol, ex2 + 1, ey, 1, 1); L(ol, ex2 + 2, ey + 1, 1, 1); }
  else if (expr === 'hurt') { L(ol, ex1, ey - 1, 1, 1); L(ol, ex1 + 1, ey, 1, 1); L(ol, ex1, ey + 1, 1, 1); L(ol, ex2 + 1, ey - 1, 1, 1); L(ol, ex2, ey, 1, 1); L(ol, ex2 + 1, ey + 1, 1, 1); }
  else {
    const tall = expr === 'surprise' ? 4 : 3, lid = expr === 'annoyed' || expr === 'tired' || expr === 'smug' ? 1 : 0;
    L(white, ex1, ey - (tall - 3), 2, tall); L(white, ex2, ey - (tall - 3), 2, tall);
    const px = look < 0 ? 0 : 1; L(eyeC, ex1 + px, ey, 1, 2); L(eyeC, ex2 + px, ey, 1, 2);
    if (o.eyeGlow) { L(o.eyeGlow, ex1 + px, ey, 1, 1); L(o.eyeGlow, ex2 + px, ey, 1, 1); }
    if (lid) { L(shade(sk, -.3), ex1, ey, 2, 1); L(shade(sk, -.3), ex2, ey, 2, 1); }
    if (half) { const lc = shade(sk, -.2); L(lc, ex1, ey - (tall - 3), 2, tall - 1); L(lc, ex2, ey - (tall - 3), 2, tall - 1); L(ol, ex1, ey + 1, 2, 1); L(ol, ex2, ey + 1, 2, 1); }
  }
  if (expr === 'annoyed' || expr === 'angry') { L(ol, ex1 - 1, ey - 3, 2, 1); L(ol, ex1 + 1, ey - 2, 1, 1); L(ol, ex2 + 1, ey - 3, 2, 1); L(ol, ex2, ey - 2, 1, 1); }
  else if (expr === 'surprise') { L(ol, ex1, ey - 4, 2, 1); L(ol, ex2, ey - 4, 2, 1); }
  else if (expr === 'smug') { L(ol, ex1, ey - 2, 2, 1); L(ol, ex2, ey - 3, 2, 1); }
  else if (!o.noBrow) { L(shade(o.hair || '#5a3a24', -.1), ex1, ey - 3, 2, 1); L(shade(o.hair || '#5a3a24', -.1), ex2, ey - 3, 2, 1); }
  // nose
  L(shade(sk, -.25), hx + 7, hy + 1, 1, 2); if (o.redNose) { L('#d05050', hx + 6, hy, 3, 3); L('#f09090', hx + 7, hy, 1, 1); }
  // mouth
  const my = hy + 4; const talkOpen = o.talking && Math.floor(t * 11 + seed) % 2 === 0;
  if (talkOpen) { L(ol, hx + 2, my, 3, 2); L('#a03a3a', hx + 3, my + 1, 1, 1); }
  else if (expr === 'happy') { L(ol, hx + 1, my, 1, 1); L(ol, hx + 2, my + 1, 3, 1); L(ol, hx + 5, my, 1, 1); L('#f09a8a', hx - 2, hy + 2, 2, 1); L('#f09a8a', hx + 7, hy + 2, 1, 1); }
  else if (expr === 'surprise') { L(ol, hx + 2, my, 2, 2); }
  else if (expr === 'hurt' || expr === 'tired') { L(ol, hx + 1, my + 1, 1, 1); L(ol, hx + 2, my, 1, 1); L(ol, hx + 3, my + 1, 1, 1); L(ol, hx + 4, my, 1, 1); }
  else if (expr === 'smug') { L(ol, hx + 2, my + 1, 3, 1); L(ol, hx + 5, my, 1, 1); }
  else if (expr === 'angry') { L(ol, hx + 1, my, 5, 2); L('#fff', hx + 2, my, 3, 1); }
  else L(ol, hx + 2, my, 3, 1);
}
function drawWeapon(o, h, a, s, t, ol, layer) {
  const w = o.weapon; if (!w || w === 'none') return;
  const L = (c, x, y, ww, hh) => P(c, x * s, y * s, ww * s, hh * s), Ln = (c, x0, y0, x1, y1, th = 1) => pLine(c, x0 * s, y0 * s, x1 * s, y1 * s, Math.max(1, Math.round(th * s))), E = (c, x, y, rx, ry) => pEll(c, x * s, y * s, rx * s, ry * s);
  const wt = o.wTier || 0, [hx, hy] = h;
  if (w === 'shield') { if (layer !== 'behind') return; const sx = hx + 3, sy = hy - 4; E(ol, sx, sy, 7, 10); E(o.shieldC || '#8a5a3a', sx, sy, 6, 9); E(shade(o.shieldC || '#8a5a3a', -.2), sx - 2, sy + 1, 3, 7); L('#a0a0a8', sx - 1, sy - 9, 2, 18); E('#c8a040', sx, sy, 2, 2); L('#6a3a1a', sx - 4, sy - 5, 2, 1); L('#6a3a1a', sx + 3, sy + 4, 2, 1); return; }
  if (layer !== 'front') return;
  const wa = o.wAng !== undefined ? o.wAng : a + 2.6; // angle of blade direction: 0 = up
  const dx = Math.sin(wa), dy = -Math.cos(wa);
  if (w === 'sword' || w === 'darksword' || w === 'knife') {
    const len = w === 'knife' ? 7 : 12 + wt * 1.6, blade = w === 'darksword' ? '#3a3040' : wt >= 3 ? '#e0e8f0' : wt >= 1 ? '#c8ccd4' : '#a89a88';
    const ex = hx + dx * len, ey = hy + dy * len;
    Ln(ol, hx, hy, ex, ey, 3.4); Ln(blade, hx, hy, ex, ey, 2); Ln(w === 'darksword' ? '#a060e0' : '#ffffff', hx + dx * 3 + .5, hy + dy * 3, ex, ey, 1);
    const gx = -dy, gy = dx, gw = 3 + (wt >= 2 ? 1 : 0); Ln(ol, hx - gx * gw, hy - gy * gw, hx + gx * gw, hy + gy * gw, 3); Ln(wt >= 4 || w === 'darksword' ? '#e8c050' : '#8a6a3a', hx - gx * gw, hy - gy * gw, hx + gx * gw, hy + gy * gw, 1.6);
    Ln('#5a3a22', hx, hy, hx - dx * 3, hy - dy * 3, 2); L(wt >= 4 ? '#e8c050' : '#8a8a8a', hx - dx * 4 - .5, hy - dy * 4 - .5, 1.6, 1.6);
    if (o.swordGlow) { ctx.globalAlpha = .4; Ln(o.swordGlow, hx, hy, ex, ey, 4); ctx.globalAlpha = 1; }
  } else if (w === 'bow' || w === 'ebow') {
    const dr = o.draw || 0, bc = w === 'ebow' ? '#d8d0c0' : wt >= 3 ? '#6a3a2a' : '#8a5a30', bend = 4 + dr * 2 + wt * .3, hh = 11 + wt;
    const pts = []; for (let i = 0; i <= 10; i++) { const k = i / 10, yy = hy - hh + k * hh * 2, xx = hx + 2 + Math.sin(k * Math.PI) * bend; pts.push([xx, yy]); }
    for (let i = 0; i < 10; i++) Ln(ol, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 3.2); for (let i = 0; i < 10; i++) Ln(bc, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 1.8);
    if (wt >= 4) { L('#e8c050', pts[5][0] - .5, pts[5][1] - 1, 2, 2); }
    const sx = hx + 2 - dr * 7; Ln('#e8e0d0', pts[0][0], pts[0][1], sx, hy, 1); Ln('#e8e0d0', sx, hy, pts[10][0], pts[10][1], 1);
    if (dr > .1 || o.nocked) { Ln('#8a6a4a', sx, hy, hx + 10, hy, 1); L('#c8ccd4', hx + 10, hy - 1, 2, 3); L('#e04040', sx - 1, hy - 1, 2, 1); L('#e04040', sx - 1, hy + 1, 2, 1); }
  } else if (w === 'staff' || w === 'skullstaff') {
    const len = 22, bx = hx - dx * 7, by = hy - dy * 7, ex = hx + dx * len * .7, ey = hy + dy * len * .7;
    Ln(ol, bx, by, ex, ey, 3.4); Ln(wt >= 3 ? '#5a3a5a' : '#7a5230', bx, by, ex, ey, 1.8); Ln(shade('#7a5230', .3), hx, hy, ex, ey, 1);
    const el = o.element || 'fire', pulse = Math.sin(t * 5) * .8;
    if (w === 'skullstaff') { E(ol, ex, ey - 2, 4, 4); E('#e8e2cc', ex, ey - 2, 3, 3); L('#1a1418', ex - 1, ey - 2, 1, 1); L('#1a1418', ex + 1, ey - 2, 1, 1); L('#80ff90', ex - 1, ey - 2, 1, 1); return; }
    if (el === 'fire') { const fh = 4 + Math.abs(Math.sin(t * 11)) * 2; E('#8a2a10', ex, ey - 1, 3, 2.5); E('#f06020', ex, ey - 2, 2.2, fh * .6); E('#ffd040', ex, ey - 2, 1.2, fh * .35); L('#fff4c0', ex, ey - 2, 1, 1); }
    else if (el === 'water') { E(ol, ex, ey - 3, 3, 4.5); E('#3a8ad8', ex, ey - 3, 2.2, 3.6); E('#9ad8ff', ex - .5, ey - 4, 1, 1.5); const a2 = t * 3; L('#bfe8ff', ex + Math.cos(a2) * 5, ey - 3 + Math.sin(a2) * 2, 1, 1); }
    else if (el === 'light') { E('#8a7a3a', ex, ey - 3, 3.5 + pulse * .3, 3.5 + pulse * .3); E('#fff0a0', ex, ey - 3, 2.4, 2.4); L('#ffffff', ex - .5, ey - 3.5, 1, 1); L('#fff8d0', ex - .5, ey - 8 - pulse, 1, 2); L('#fff8d0', ex - .5, ey + 1 + pulse, 1, 2); L('#fff8d0', ex - 5 - pulse, ey - 3.5, 2, 1); L('#fff8d0', ex + 3 + pulse, ey - 3.5, 2, 1); }
    else { E('#6a2a9a', ex, ey - 3, 3, 3); E('#c080ff', ex, ey - 3, 1.5, 1.5); }
  } else if (w === 'bottle') { const ex = hx + dx * 5, ey = hy + dy * 5; Ln(ol, hx, hy, ex, ey, 4.4); Ln('#4a8a4a', hx, hy, ex, ey, 3); Ln('#8ad08a', hx + dx, hy + dy, ex, ey, 1); L('#c8a060', ex - .5, ey - .5, 1.5, 1.5); }
  else if (w === 'club' || w === 'axe' || w === 'halberd' || w === 'spear' || w === 'pitchfork' || w === 'cane' || w === 'hammer') {
    const len = w === 'halberd' || w === 'spear' || w === 'pitchfork' ? 24 : w === 'cane' ? 9 : 12, ex = hx + dx * len, ey = hy + dy * len, bx = hx - dx * (w === 'halberd' || w === 'spear' ? 8 : 2), by = hy - dy * (w === 'halberd' || w === 'spear' ? 8 : 2);
    Ln(ol, bx, by, ex, ey, 3.4); Ln(w === 'cane' ? '#6a4a2a' : '#7a5230', bx, by, ex, ey, 1.8);
    if (w === 'club') { Ln(ol, hx + dx * 7, hy + dy * 7, ex, ey, 6); Ln('#8a6a42', hx + dx * 7, hy + dy * 7, ex, ey, 4); }
    if (w === 'axe' || w === 'halberd') { const px = -dy, py = dx; pPoly(ol, [[(ex - px * 1) * s, (ey - py * 1) * s], [(ex + px * 8 - dx * 3) * s, (ey + py * 8 - dy * 3) * s], [(ex + px * 8 - dx * 10) * s, (ey + py * 8 - dy * 10) * s], [(ex - px * 1 - dx * 7) * s, (ey - py * 1 - dy * 7) * s]]); pPoly(w === 'halberd' ? '#8a8a9a' : '#a0a0a8', [[ex * s, ey * s], [(ex + px * 7 - dx * 3) * s, (ey + py * 7 - dy * 3) * s], [(ex + px * 7 - dx * 9) * s, (ey + py * 7 - dy * 9) * s], [(ex - dx * 7) * s, (ey - dy * 7) * s]]); Ln('#ffffff', ex + px * 7 - dx * 3, ey + py * 7 - dy * 3, ex + px * 7 - dx * 8, ey + py * 7 - dy * 8, 1); }
    if (w === 'spear' || w === 'halberd') { Ln('#d0d8e0', ex, ey, ex + dx * 5, ey + dy * 5, 2); }
    if (w === 'pitchfork') { const px = -dy, py = dx; for (let k = -1; k <= 1; k++) Ln('#a0a0a8', ex + px * k * 2, ey + py * k * 2, ex + px * k * 2 + dx * 5, ey + py * k * 2 + dy * 5, 1); Ln('#a0a0a8', ex - px * 2, ey - py * 2, ex + px * 2, ey + py * 2, 1); }
    if (w === 'hammer') { const px = -dy, py = dx; Ln(ol, ex - px * 4, ey - py * 4, ex + px * 4, ey + py * 4, 5); Ln('#6a6a72', ex - px * 3, ey - py * 3, ex + px * 3, ey + py * 3, 3); }
  } else if (w === 'lute') { E(ol, hx + 1, hy, 5, 4); E('#b07a3a', hx + 1, hy, 4, 3); L('#3a2010', hx + 1, hy - 1, 2, 2); Ln('#8a5a2a', hx + 4, hy - 2, hx + 11, hy - 7, 2); }
  else if (w === 'ledger') { L(ol, hx - 1, hy - 5, 8, 9); L('#3a5a3a', hx, hy - 4, 6, 7); L('#e8e0c0', hx + 1, hy - 3, 4, 1); L('#e8e0c0', hx + 1, hy - 1, 3, 1); }
  else if (w === 'sign') { Ln('#7a5230', hx, hy + 4, hx, hy - 16, 2); L(ol, hx - 8, hy - 22, 17, 10); L('#e8dcc0', hx - 7, hy - 21, 15, 8); L('#c03030', hx - 5, hy - 19, 11, 1); L('#c03030', hx - 4, hy - 16, 8, 1); }
  else if (w === 'orb') { const pulse = Math.sin(t * 6); E('#3a1a4a', hx + 3, hy - 2, 4, 4); E(o.orbC || '#c060ff', hx + 3, hy - 2, 2.5 + pulse * .3, 2.5 + pulse * .3); L('#fff', hx + 2, hy - 3, 1, 1); }
}
