'use strict';
/* =========================================================
   PLAYER APPEARANCE
   ========================================================= */
const CLASSES = {
  sword: { name: 'Sword', hp: 5, dmg: 4, acc: 3, def: 4, mana: 0, weapon: 'sword', desc: 'Sword attacks can cause Bleeding and Stagger. Bleeding hurts over time; Stagger makes an enemy miss its next turn. Guarding may counterattack.', skill: 'CLEAVE', skillDesc: 'Heavy strike. Bleed & Stagger chance.', ult: 'ABSOLUTELY REASONABLE SLASH', guard: 'GUARD' },
  bow: { name: 'Bow', hp: 2, dmg: 3, acc: 5, def: 3, mana: 0, weapon: 'bow', desc: 'Bow attacks can cause Bleeding. Evade gives a high chance to avoid the next attack; otherwise Guard reduces damage.', skill: 'TRIPLE SHOT', skillDesc: 'Three timed arrows. Bleed chance.', ult: 'RAIN OF MILD REGRET', guard: 'EVADE' },
  fire: { name: 'Fire', hp: 3, dmg: 5, acc: 3, def: 1, mana: 5, weapon: 'staff', element: 'fire', desc: 'Fire spells can apply Burning. The target keeps taking damage when its turn begins.', skill: 'FIREBALL', skillDesc: 'Hold to charge. Applies Burning.', ult: 'MIDNIGHT FLAME (BORROWED)', guard: 'GUARD' },
  water: { name: 'Water', hp: 3, dmg: 3, acc: 4, def: 4, mana: 5, weapon: 'staff', element: 'water', desc: 'Water spells can Soak a target, weakening its attacks and strengthening your next two hits.', skill: 'TIDAL CRASH', skillDesc: 'Wave rhythm. Applies Soaked.', ult: 'TSUNAMI OF TUESDAY', guard: 'GUARD' },
  light: { name: 'Light', hp: 3, dmg: 3, acc: 4, def: 5, mana: 5, weapon: 'staff', element: 'light', desc: 'Light spells can restore your HP after a successful hit and grant Blessed.', skill: 'SMITE', skillDesc: 'Damage, healing and Blessed.', ult: 'DIVINE DISAPPOINTMENT', guard: 'GUARD' }
};
const SKIN_TONES = ['#f4cfa6', '#e8b48a', '#c8885a', '#9a6440', '#6a4028'];
const HAIR_COLS = ['#5a3a24', '#2a1c18', '#c8903a', '#8a2a1a', '#d8d0c0', '#3a3a5a'];
function playerLook(extra = {}) {
  const c = CLASSES[S.cls] || CLASSES.sword;
  return Object.assign({ skin: SKIN_TONES[S.skin || 0], hair: HAIR_COLS[S.hairC || 0], hairStyle: 'short', hood: S.armorLv <= 1, tier: S.armorLv || 0, wTier: S.weaponLv || 0, weapon: c.weapon, element: c.element, body: S.body || 'sturdy', seed: 1, eye: '#3a2a1a' }, extra);
}
