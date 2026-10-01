'use strict';
/* =========================================================
   SAVE SYSTEM + PLAYER STATE
   ========================================================= */
let S = null;
function newSave(o) {
  return {
    v: 2, name: o.name || 'Hero', cls: o.cls || 'sword', body: o.body || 'sturdy', skin: o.skin || 0, hairC: o.hairC || 0,
    level: 1, xp: 0, hp: 0, mana: 0, coins: 20, weaponLv: 0, armorLv: 0, focusLv: 0, blessHP: 0,
    inv: { drumstick: 2, mid: 1, high: 0, antidote: 1, tonic: 0, smoke: 0 }, mats: {},
    unlocked: 1, clears: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]], bosses: {},
    quests: { reliquary: { state: 'active', n: 0 } }, codex: {}, visitors: {}, talk: {}, rep: 0, buffs: [], stats: { geese: 0, deaths: 0, raids: 0 },
    time: 8.5, day: 1, weather: 'CLEAR', weatherT: 3, ng: 0, lastRaidDay: 0, pos: 380, festival: false, blessedNext: false, introSeen: false
  };
}
const Save = {
  has() { try { return !!localStorage.getItem(CONFIG.SAVE_KEY); } catch (e) { return false; } },
  save(quiet) { if (!S) return; try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(S)); if (!quiet) Toast.add('Game saved', COL.green, '✓'); } catch (e) { Toast.add('Could not save', COL.red); } },
  load() { try { const d = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY)); if (!d) return false; S = Object.assign(newSave({}), d); S.inv = Object.assign(newSave({}).inv, d.inv || {}); S.stats = Object.assign({ geese: 0, deaths: 0, raids: 0 }, d.stats || {}); return true; } catch (e) { return false; } },
  wipe() { try { localStorage.removeItem(CONFIG.SAVE_KEY); } catch (e) { } }
};
const Stats = {
  cls() { return CLASSES[S.cls]; },
  maxHP() { return Math.round(40 + this.cls().hp * 6 + (S.level - 1) * 6 + S.armorLv * 4 + S.blessHP); },
  atk() { return this.cls().dmg * 1.6 + 4 + (S.level - 1) * 1.4 + S.weaponLv * 2.6 + (this.cls().mana ? S.focusLv * 1.2 : 0); },
  def() { return this.cls().def * .8 + S.armorLv * 1.6; },
  acc() { return .74 + this.cls().acc * .045; },
  maxMana() { return this.cls().mana ? this.cls().mana * 2 + 4 + S.focusLv * 2 : 10; },
  manaName() { return this.cls().mana ? 'MANA' : 'FOCUS'; },
  xpNeed(l = S.level) { return 20 + l * 16; },
  ngMul() { return 1 + S.ng * .35; },
  weaponName() { return WEAPON_TIERS[S.cls][S.weaponLv]; },
  armorName() { return ARMOR_TIERS[S.armorLv].name; }
};
function heal(n) { const m = Stats.maxHP(); const before = S.hp; S.hp = Math.min(m, S.hp + n); return S.hp - before; }
function addCoins(n) { S.coins = Math.max(0, S.coins + n); }
function addMat(id, n = 1) { S.mats[id] = (S.mats[id] || 0) + n; Quests.onMat(id); }
function addItem(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; }
function areaUnlocked(a) { return a < S.unlocked; }
function levelUnlocked(a, l) { if (!areaUnlocked(a)) return false; if (l === 0) return true; return !!S.clears[a][l - 1]; }
/* ---------------- QUESTS ---------------- */
const Quests = {
  start(id) { if (S.quests[id]) return; S.quests[id] = { state: 'active', n: 0 }; SFX.play('quest'); Toast.add('New quest: ' + QUEST_DEFS[id].name, COL.gold2, '◆'); Quests.onMat('pelt'); Quests.onMat('scrap'); },
  progress(id, n = 1) { const q = S.quests[id]; if (!q || q.state !== 'active') return; q.n = Math.min(QUEST_DEFS[id].goal, q.n + n); SFX.play('quest'); Toast.add(`${QUEST_DEFS[id].name}: ${q.n}/${QUEST_DEFS[id].goal}`, COL.gold2, '◆'); if (q.n >= QUEST_DEFS[id].goal) { q.state = 'ready'; Toast.add('Quest ready to turn in: ' + QUEST_DEFS[id].giver, COL.green, '✔'); } },
  onMat(id) { const map = { pelt: 'pelts', scrap: 'survey' }; const qid = map[id]; if (!qid) return; const q = S.quests[qid]; if (!q || q.state === 'done') return; const have = Math.min(QUEST_DEFS[qid].goal, S.mats[id] || 0); if (have !== q.n) { q.n = have; if (q.n >= QUEST_DEFS[qid].goal) { if (q.state !== 'ready') { q.state = 'ready'; SFX.play('quest'); Toast.add('Quest ready to turn in: ' + QUEST_DEFS[qid].giver, COL.green, '✔'); } } else q.state = 'active'; } },
  complete(id) {
    const q = S.quests[id]; if (!q || q.state === 'done') return false; q.state = 'done'; SFX.play('quest'); Music.sting('quest');
    let msg = '';
    if (id === 'reliquary') { addCoins(40); S.blessHP += 10; S.hp = Stats.maxHP(); msg = '+40 coins, +10 max HP (Saint Elbert\'s blessing)'; }
    if (id === 'pelts') { S.mats.pelt = Math.max(0, (S.mats.pelt || 0) - 4); if (S.weaponLv < 4) S.weaponLv++; else addCoins(60); msg = 'Free weapon upgrade: ' + Stats.weaponName(); }
    if (id === 'goose') { addCoins(30); addItem('high', 1); msg = '+30 coins, High Potion'; }
    if (id === 'parish') { addCoins(50); S.blessHP += 8; S.hp = Stats.maxHP(); msg = '+50 coins, +8 max HP'; }
    if (id === 'survey') { S.mats.scrap = Math.max(0, (S.mats.scrap || 0) - 3); addCoins(45); addItem('smoke', 2); msg = '+45 coins, 2 Smoke Bombs'; }
    Banner.show('QUEST COMPLETE', QUEST_DEFS[id].name + ' — ' + msg, COL.gold2, 3.2); Save.save(true); return true;
  },
  tracker() { return Object.entries(S.quests).filter(([k, q]) => q.state !== 'done').map(([k, q]) => ({ id: k, name: QUEST_DEFS[k].name, n: q.n, goal: QUEST_DEFS[k].goal, state: q.state, desc: QUEST_DEFS[k].desc, giver: QUEST_DEFS[k].giver })); }
};
const Codex = { see(id) { if (!S.codex[id]) { S.codex[id] = { seen: true, kills: 0 }; Toast.add('Codex entry: ' + ENEMY[id].name, COL.purple, '◇'); } }, kill(id) { this.see(id); S.codex[id].kills++; } };
