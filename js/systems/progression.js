'use strict';
/* =========================================================
   PROGRESSION — level cap 40, perk trees (3 branches × 5 ranks per class),
   trinket gear with rarity, bounties, lore pages, achievements.
   ========================================================= */
const PERKS = {
  // per class: [branch name, rank desc] × 3 — a: offence, b: defence, c: technique
  sword: [['Edge', '+4% damage per rank'], ['Bulwark', '+5% max HP & +0.6 DEF per rank'], ['Riposte', '+4 Break per PERFECT, +3% bleed per rank']],
  bow: [['Fletching', '+4% damage per rank'], ['Footwork', '+5% max HP & +0.6 DEF per rank'], ['Eagle Eye', '+1.5% accuracy & +4 Break per PERFECT per rank']],
  fire: [['Kindling', '+4% damage per rank'], ['Ashen Hide', '+5% max HP & +0.6 DEF per rank'], ['Wildfire', '+4 Break per PERFECT, +1 Mana regen at rank 3+']],
  water: [['Undertow', '+4% damage per rank'], ['Still Water', '+5% max HP & +0.6 DEF per rank'], ['Riptide', '+4 Break per PERFECT, +1 Mana regen at rank 3+']],
  light: [['Radiance', '+4% damage per rank'], ['Sanctuary', '+5% max HP & +0.6 DEF per rank'], ['Halo', '+4 Break per PERFECT, +2 heal on Blessed per rank']]
};
const PERK_MAX = 5;
const Prog = {
  perks() { return (S && S.perks) || { a: 0, b: 0, c: 0 }; },
  trinket() { return S && S.gear && S.gear.trinket ? TRINKETS[S.gear.trinket] : null; },
  spend(k) { if (!S.pp || S.perks[k] >= PERK_MAX) { SFX.play('error'); return false; } S.pp--; S.perks[k]++; SFX.play('anvil'); Music.sting('upgrade'); const spent = S.perks.a + S.perks.b + S.perks.c; if (spent >= 5) Ach.unlock('perk'); if (S.perks[k] >= PERK_MAX) Ach.unlock('perkmax'); Save.save(true); return true; },
  giveTrinket(id) { S.trinkets[id] = (S.trinkets[id] || 0) + 1; const T2 = TRINKETS[id]; Toast.add(`Found: ${T2.name} (${RARITY[T2.rar][0]})`, RARITY[T2.rar][1], '◆'); },
  rollTrinket(minR = 0) { const ids = Object.keys(TRINKETS).filter(k => TRINKETS[k].rar >= minR); const w = ids.map(k => [1, .45, .18, .06][TRINKETS[k].rar]); let r = rnd(w.reduce((a, b) => a + b, 0)); for (let i = 0; i < ids.length; i++) { r -= w[i]; if (r <= 0) return ids[i]; } return ids[0]; },
  equip(id) { S.gear.trinket = S.gear.trinket === id ? null : id; SFX.play('clank'); if (id && TRINKETS[id].rar >= 3) Ach.unlock('trinket'); S.hp = Math.min(S.hp, Stats.maxHP()); Save.save(true); },
  lore(i) { if (i < 0 || i >= LORE_PAGES.length || S.lore.includes(i)) return false; S.lore.push(i); Toast.add(`Lore page ${S.lore.length}/${LORE_PAGES.length} found`, COL.purple, '❧'); if (S.lore.length >= 10) Ach.unlock('lore10'); if (S.lore.length >= LORE_PAGES.length) Ach.unlock('lore30'); return true; },
  kill(id, cursed) { S.bountyKills[id] = (S.bountyKills[id] || 0) + 1; if (cursed) { S.cursedKills++; S.bountyKills['*cursed'] = S.cursedKills; } },
  bountyState(b) { const st = S.bounties[b.id]; if (st === 'done') return 'done'; return (S.bountyKills[b.foe] || 0) >= b.n ? 'ready' : 'open'; },
  claim(b) { if (this.bountyState(b) !== 'ready') return; S.bounties[b.id] = 'done'; addCoins(b.coins); SFX.play('coin'); Music.sting('quest'); Banner.show('BOUNTY CLAIMED', `${b.name} — +${b.coins} coins`, COL.gold2, 2.6); Ach.unlock('bounty'); if (Object.values(S.bounties).filter(v => v === 'done').length >= 5) Ach.unlock('bounty5'); Save.save(true); }
};
// stat hooks (perks + trinket) layered over the base formulas
{ const _a = Stats.atk.bind(Stats), _h = Stats.maxHP.bind(Stats), _d = Stats.def.bind(Stats), _c = Stats.acc.bind(Stats);
  Stats.atk = function () { const p = Prog.perks(), t2 = Prog.trinket(); return (_a() + (t2 && t2.atk || 0)) * (1 + p.a * .04); };
  Stats.maxHP = function () { const p = Prog.perks(), t2 = Prog.trinket(); return Math.round((_h() + (t2 && t2.hp || 0)) * (1 + p.b * .05)); };
  Stats.def = function () { const p = Prog.perks(), t2 = Prog.trinket(); return _d() + p.b * .6 + (t2 && t2.def || 0); };
  Stats.acc = function () { const p = Prog.perks(); return _c() + (S && S.cls === 'bow' ? p.c * .015 : 0); };
  const _xn = Stats.xpNeed.bind(Stats); Stats.xpNeed = function (l = S.level) { return l >= 20 ? Math.round(_xn(l) * (1 + (l - 20) * .05)) : _xn(l); };
}
/* ---------------- achievements ---------------- */
const Ach = {
  unlock(id) { if (!S || !S.achievements || S.achievements[id] || !ACHIEVEMENTS[id]) return; S.achievements[id] = Date.now(); Later.add(.6, () => { Toast.add('ACHIEVEMENT: ' + ACHIEVEMENTS[id][0], COL.gold2, '★'); SFX.play('breakready', { v: .5 }); }); },
  count() { return S && S.achievements ? Object.keys(S.achievements).length : 0; },
  checkLevel() { if (S.level >= 20) this.unlock('lv20'); if (S.level >= 30) this.unlock('lv30'); if (S.level >= LEVEL_CAP) this.unlock('lv40'); }
};
/* ---------------- shared menu overlays (used from Port Mopeway) ---------------- */
function a2Panel(title, w = 860, h = 560) { const x = 640 - w / 2, y = 360 - h / 2; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, 1280, 720); UI.panel(x, y, w, h, { bg: 'rgba(18,13,24,.96)' }); UI.text(title, 640, y + 44, { align: 'center', size: 26, col: COL.gold2, stroke: 3 }); return { x, y, w, h }; }
function openPerks() {
  SFX.play('page'); const ov = Overlays.push({ name: 'perks', draw() {
    const P0 = a2Panel('TRAINING · PERK TREE', 900, 540), cls = PERKS[S.cls] || PERKS.sword, keys = ['a', 'b', 'c'];
    UI.text(`${CLASSES[S.cls].name} · Level ${S.level}/${LEVEL_CAP} · Perk points: ${S.pp}`, 640, P0.y + 76, { align: 'center', size: 15, col: S.pp ? COL.green : COL.dim });
    keys.forEach((k, i) => { const x = P0.x + 40 + i * 280, y = P0.y + 110, r = S.perks[k];
      UI.panel(x, y, 260, 330, { bg: 'rgba(40,28,40,.9)' }); UI.text(cls[i][0].toUpperCase(), x + 130, y + 36, { align: 'center', size: 20, col: COL.gold2 });
      UI.para(cls[i][1], x + 20, y + 62, 220, { size: 13, col: COL.cream, lh: 18 });
      for (let j = 0; j < PERK_MAX; j++) { const on = j < r; g.fillStyle = on ? COL.gold2 : 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(x + 50 + j * 40, y + 170, 13, 0, TAU); g.fill(); g.strokeStyle = '#2a1a10'; g.lineWidth = 2; g.stroke(); if (on) UI.text('★', x + 50 + j * 40, y + 176, { align: 'center', size: 13, col: '#3a2010', shadow: false }); }
      UI.text(`Rank ${r}/${PERK_MAX}`, x + 130, y + 214, { align: 'center', size: 14, col: COL.dim });
      if (UI.btn(r >= PERK_MAX ? 'MASTERED' : 'TRAIN (+1)', x + 30, y + 250, 200, 44, { accent: !!S.pp && r < PERK_MAX, disabled: !S.pp || r >= PERK_MAX, id: 'perk' + k })) Prog.spend(k); });
    UI.text('You earn one perk point per level (cap 40). Effects apply to every fight.', 640, P0.y + P0.h - 70, { align: 'center', size: 13, col: COL.dim, bold: false });
    if (UI.btn('Close', 580, P0.y + P0.h - 56, 120, 38, { key: 'Escape' })) Overlays.pop(ov); } });
}
function openGear() {
  SFX.play('page'); const ov = Overlays.push({ name: 'gear', draw() {
    const P0 = a2Panel('GEAR · TRINKET SLOT', 820, 560), ids = Object.keys(S.trinkets).filter(k => S.trinkets[k] > 0), eq = S.gear.trinket;
    UI.text(`Weapon: ${Stats.weaponName()} · Armour: ${Stats.armorName()} · Trinket: ${eq ? TRINKETS[eq].name : '—'}`, 640, P0.y + 78, { align: 'center', size: 14, col: COL.cream, maxW: 760 });
    UI.text(`ATK ${Stats.atk().toFixed(1)} · DEF ${Stats.def().toFixed(1)} · HP ${Stats.maxHP()}`, 640, P0.y + 102, { align: 'center', size: 14, col: COL.blue });
    if (!ids.length) UI.para('No trinkets yet. Cursed foes, bounties and fishing turn them up. Legendary ones glow gold.', P0.x + 80, P0.y + 160, P0.w - 160, { size: 16, col: COL.dim, align: 'center' });
    ids.forEach((id, i) => { const T2 = TRINKETS[id], y = P0.y + 130 + i * 46, on = eq === id;
      if (UI.btn(`${on ? '✔ ' : ''}${T2.name}  ·  ${T2.desc}`, P0.x + 60, y, P0.w - 120, 40, { align: 'left', size: 14, col: RARITY[T2.rar][1], accent: on, id: 'tr' + id, sub: RARITY[T2.rar][0] })) Prog.equip(id); });
    if (UI.btn('Close', 580, P0.y + P0.h - 56, 120, 38, { key: 'Escape' })) Overlays.pop(ov); } });
}
function openBounties() {
  SFX.play('page'); const ov = Overlays.push({ name: 'bounty', draw() {
    const P0 = a2Panel('BOUNTY BOARD · PORT MOPEWAY', 940, 620);
    BOUNTIES.forEach((b, i) => { const col = i % 2, row = i >> 1, x = P0.x + 30 + col * 445, y = P0.y + 76 + row * 72, st = Prog.bountyState(b), n = Math.min(b.n, S.bountyKills[b.foe] || 0);
      UI.parchment(x, y, 430, 64); UI.text(b.name, x + 16, y + 26, { size: 16, col: '#3a2010', shadow: false, maxW: 260 }); UI.text(`${b.desc} · ${n}/${b.n}`, x + 16, y + 48, { size: 12, col: '#6a4a2a', shadow: false, bold: false, maxW: 270 });
      if (st === 'done') UI.text('CLAIMED', x + 410, y + 38, { size: 14, col: '#3a7a2a', align: 'right', shadow: false });
      else if (UI.btn(st === 'ready' ? `CLAIM ${b.coins}` : `${b.coins} c`, x + 300, y + 14, 116, 36, { size: 13, accent: st === 'ready', disabled: st !== 'ready', id: 'bn' + b.id })) Prog.claim(b); });
    if (UI.btn('Close', 580, P0.y + P0.h - 52, 120, 38, { key: 'Escape' })) Overlays.pop(ov); } });
}
function openLore() {
  SFX.play('page'); let sel = S.lore.length ? S.lore[S.lore.length - 1] : -1; const ov = Overlays.push({ name: 'lore', draw() {
    const P0 = a2Panel(`LORE PAGES · ${S.lore.length}/${LORE_PAGES.length}`, 960, 600);
    for (let i = 0; i < LORE_PAGES.length; i++) { const have = S.lore.includes(i), x = P0.x + 30 + (i % 6) * 70, y = P0.y + 80 + Math.floor(i / 6) * 70; if (UI.btn(have ? String(i + 1) : '?', x, y, 60, 60, { size: 18, disabled: !have, accent: sel === i, id: 'lp' + i, sound: 'page' })) sel = i; }
    UI.parchment(P0.x + 470, P0.y + 80, 460, 420); if (sel >= 0) { UI.text(`PAGE ${sel + 1}`, P0.x + 700, P0.y + 120, { align: 'center', size: 18, col: '#3a2010', shadow: false }); UI.para(LORE_PAGES[sel], P0.x + 500, P0.y + 160, 400, { size: 17, col: '#3a2414', shadow: false, lh: 25, italic: true }); }
    else UI.para('Lore pages turn up after Act II fights and from the Sigh Shard keepers.', P0.x + 500, P0.y + 160, 400, { size: 16, col: '#6a4a2a', shadow: false });
    if (UI.btn('Close', 580, P0.y + P0.h - 52, 120, 38, { key: 'Escape' })) Overlays.pop(ov); } });
}
function openAchievements() {
  SFX.play('page'); const ids = Object.keys(ACHIEVEMENTS); const ov = Overlays.push({ name: 'ach', draw() {
    const P0 = a2Panel(`ACHIEVEMENTS · ${Ach.count()}/${ids.length}`, 1000, 640);
    ids.forEach((id, i) => { const col = i % 3, row = Math.floor(i / 3), x = P0.x + 24 + col * 322, y = P0.y + 70 + row * 50, on = !!S.achievements[id];
      g.fillStyle = on ? 'rgba(240,200,90,.16)' : 'rgba(255,255,255,.05)'; g.fillRect(x, y, 310, 44); UI.text((on ? '★ ' : '☆ ') + ACHIEVEMENTS[id][0], x + 10, y + 19, { size: 13, col: on ? COL.gold2 : COL.dim, maxW: 290 }); UI.text(ACHIEVEMENTS[id][1], x + 10, y + 37, { size: 11, col: COL.dim, bold: false, maxW: 290 }); });
    if (UI.btn('Close', 580, P0.y + P0.h - 50, 120, 38, { key: 'Escape' })) Overlays.pop(ov); } });
}
