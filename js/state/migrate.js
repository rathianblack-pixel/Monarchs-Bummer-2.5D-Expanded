'use strict';
/* =========================================================
   SAVE VERSIONING + MIGRATION (v2 → v3)
   v3 adds Act II: 10 areas of clears, act/party/perks/gear/shards/lore/etc.
   Old saves load untouched and are upgraded in place on first load.
   ========================================================= */
const SAVE_V = 3, N_AREAS = 10;
function act2Defaults() {
  return { act: 1, act2Open: false, party: [], comp: null, side: {}, shards: [], crown: false, lore: [], bounties: {}, bountyKills: {}, cursedKills: 0, gear: { trinket: null }, trinkets: {},
    perks: { a: 0, b: 0, c: 0 }, pp: 0, fish: {}, fishN: 0, achievements: {}, endings: {}, assists: 0, map2Node: 0 };
}
function migrateSave(d) {
  const v = d.v || 1;
  if (!Array.isArray(d.clears)) d.clears = [];
  while (d.clears.length < N_AREAS) d.clears.push([0, 0, 0, 0, 0]);
  d.clears = d.clears.map(r => { r = Array.isArray(r) ? r.slice(0, 5) : []; while (r.length < 5) r.push(0); return r; });
  const def = act2Defaults();
  for (const k in def) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(def[k]));
  d.perks = Object.assign({ a: 0, b: 0, c: 0 }, d.perks); d.gear = Object.assign({ trinket: null }, d.gear);
  // a v2 save that already beat Lucien gets the Act II door opened
  if (v < 3 && d.bosses && d.bosses.lucien) d.act2Open = true;
  // perk points for levels already earned (1 per level above 1, minus spent)
  if (v < 3) d.pp = Math.max(0, (d.level || 1) - 1) - (d.perks.a + d.perks.b + d.perks.c);
  d.level = Math.min(d.level || 1, LEVEL_CAP);
  d.v = SAVE_V; return d;
}
const LEVEL_CAP = 40;
{ const _ns = newSave; newSave = function (o) { const s = _ns(o); s.v = SAVE_V; return migrateSave(s); }; }
{ const _ld = Save.load.bind(Save); Save.load = function () { const ok = _ld(); if (ok && S) { migrateSave(S); } return ok; }; }
// areas beyond the first five unlock independently of Act I order; the Act II map uses the same rule
function sideKey(area, k) { return area + ':' + k; }
