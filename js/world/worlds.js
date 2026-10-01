'use strict';
/* =========================================================
   WORLDS / ACT SYSTEM
   Act I  = the Kingdom (areas 0–4, scene 'overworld', hub 'village')
   Act II = the Bummer Below (areas 5–9, scene 'overworld2', hub 'port')
   ========================================================= */
const WORLDS = {
  1: { name: 'The Kingdom of Placenta Creek', areas: [0, 1, 2, 3, 4], map: 'overworld', hub: 'village', hubName: 'Placenta Creek' },
  2: { name: 'The Bummer Below', areas: [5, 6, 7, 8, 9], map: 'overworld2', hub: 'port', hubName: 'Port Mopeway' }
};
const Act = {
  cur() { return S && S.act >= 2 ? 2 : 1; },
  world(a) { return a >= 5 ? 2 : 1; },
  open2() { return !!(S && (S.act2Open || S.act >= 2)); },
  // first arrival in Act II: party joins, Act II regions start unlocking
  begin2() { S.act = 2; S.act2Open = true; S.unlocked = Math.max(S.unlocked, 6); Party.join('lucien'); Party.join('pell'); Party.join('honk'); if (!S.comp) S.comp = 'lucien'; Ach.unlock('knock'); Save.save(true); },
  sail(to) { Scene.go('sail', { to }, { type: 'fade', out: .8, in: .8 }); }
};
