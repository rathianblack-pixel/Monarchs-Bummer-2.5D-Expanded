'use strict';
/* =========================================================
   COMBAT — Act II hooks: field effects for areas 5–9, boss mechanics
   (Ledger's invoice, Brackish's silence, Grudge immunity, Haughtsworth
   dismount, Grinwell's third phase), cursed elites, companion assist bar,
   side-node rewards, Sigh Shards, lore, bounties, achievements.
   ========================================================= */
Object.assign(ENEMY_STATUS, { crab: 'bleed', gull: 'weak', deckhand: 'bleed', jelly: 'poison', ledger: 'weak', angler: 'bleed', clam: 'weak', choirboy: 'weak', eel: 'burn', brackish: 'soak', penguin: 'weak', swolf: 'bleed', hermit: 'weak', yeti: 'bleed', grudge: 'weak', sheep: 'weak', harpy: 'bleed', butler: 'weak', stallion: 'bleed', haughtsworth: 'weak', balloon: 'poison', mime: 'weak', clown: 'bleed', bertha: 'poison', grinwell: 'poison', brendan: 'bleed', kelp: 'poison', frostbeard: 'bleed', vane: 'weak', chuckles: 'burn' });
Object.assign(ARCH_H, { crab: 16, gull: 26, jelly: 34, angler: 26, clam: 22, eel: 30, penguin: 26, yeti: 42, sheep: 24, horse: 40, rider: 64, balloon: 32, whale: 40 });
Object.assign(INTENT_LINES, { INVOICE: ['prepares an itemised invoice.'] });
function makeCursed(base) {
  const d = Object.assign({}, base, { name: 'Cursed ' + base.name, cursed: true, drop: ['cursed', 1] });
  d.look = Object.assign({}, base.look || {}, base.arch === 'human' ? { eyeGlow: '#d080ff' } : {});
  return d;
}
const C2 = Scenes.combat;
{ const _enter = C2.enter;
  C2.enter = function (a) {
    a = a || {}; if (a.cursedOf) { a.def = makeCursed(ENEMY[a.cursedOf]); a.story = SIDE_STORIES.cursed; a.mini = true; }
    else if (a.enemyId) { a.def = ENEMY[a.enemyId]; a.story = SIDE_STORIES[a.enemyId] || a.story; a.mini = true; }
    _enter.call(this, a);
    this.side = a.side || null; this.used = { attack: 0, skill: 0 }; this.curKind = null; this.silence = false; this.assistK = 34; this.assistUsed = false;
    if (this.def.cursed) { this.E.hp = this.E.maxHp = this.E.ghost = Math.round(this.E.maxHp * 1.45); this.E.atk *= 1.15; }
    if (this.def.id === 'grinwell' || this.def.id === 'haughtsworth') this.E.h = (ARCH_H[this.def.arch] || 46) * 1.7 * (this.def.scale || 1);
  };
}
{ const _exit = C2.exit; C2.exit = function () { if (this.silence) { this.silence = false; } return _exit.call(this); }; }
// ---------- field effects ----------
{ const _spt = C2.startPlayerTurn;
  C2.startPlayerTurn = function () {
    if (this.over) return; const f = this.field, nt = this.turn + 1, P = this.P, E = this.E;
    this.assistUsed = false; if (Party.active()) this.assistK = Math.min(100, (this.assistK || 0) + 34);
    if (f === 5 && nt % 2 === 0) { P.st.soak = 1; this.addSt('E', 'soak', 2); this.mana = Math.min(Stats.maxMana(), this.mana + 2); Toast.add('TIDAL PULL: the tide turns — both Soaked, +2 ' + Stats.manaName(), COL.blue, '≈'); SFX.play('watercast', { v: .5 }); for (let i = 0; i < 24; i++) Particles.spawn({ x: rnd(80, 560), y: CGY + rnd(-4, 10), vx: rnd(-40, 40), vy: -rnd(30, 90), life: rnd(.5, 1), c: '#a0d8ff', type: 'drop', g: 220 }); }
    if (f === 7) { S.hp -= 1; this.float(P, '-1 FROSTBITE', '#a0d8ff', 14); if (nt % 4 === 0 && E.hp > 0) { E.st.stagger = 1; this.float(E, 'FROZEN SOLID', '#c8f0ff', 20); SFX.play('shield'); Particles.burst(E.x, CGY - E.h / 2, 26, { c: '#e0f8ff', type: 'star', smin: 20, smax: 90, size: 2 }); } }
    if (f === 9) { if (S.hp > Stats.maxHP() / 2) { S.hp -= 1; this.float(P, '-1 FORCED SMILE', '#f8a0d0', 14); } else { const h = heal(2); if (h) this.float(P, `+${h} IT'S OKAY NOT TO BE OKAY`, COL.green, 13); } }
    return _spt.call(this);
  };
}
{ const _ea = C2.enemyAttack;
  C2.enemyAttack = function (o) {
    o = Object.assign({}, o);
    if (this.field === 6) { const k = Math.min(.36, .06 * this.turn); o.mult *= 1 + k; if (k > 0 && this.turn % 2 === 0) this.float(this.E, `PRESSURE +${Math.round(k * 100)}%`, '#6ac8e0', 13, -26); }
    if (this.field === 8 && chance(.3)) { o.mult *= .6; this.float(this.E, 'UPDRAFT!', '#e8e8ff', 16, -26); SFX.play('whoosh'); for (let i = 0; i < 16; i++) Particles.spawn({ x: this.E.x + rnd(-30, 30), y: CGY - rnd(0, 60), vx: rnd(60, 160), vy: -rnd(10, 40), life: .6, c: '#ffffff', type: 'streak' }); }
    return _ea.call(this, o);
  };
}
// ---------- boss mechanics ----------
{ const _et = C2.enemyTurn;
  C2.enemyTurn = function () {
    if (this.over) return; const d = this.def, E = this.E;
    if (d.id === 'ledger' && this.turn > 0 && this.turn % 3 === 0 && E.hp > 0 && this.invoiced !== this.turn) {
      this.invoiced = this.turn; this.phase = 'enemy'; const amt = 12 + S.level; this.pose(E, 'charge'); SFX.play('page'); this.float(E, 'INVOICE: ' + amt + ' COINS', COL.gold2, 20);
      this.bubble = { text: `Invoice #${100 + this.turn}: ${amt} coins. Payable now.`, t: 0 };
      this.at(1, () => { if (S.coins >= amt) { addCoins(-amt); this.float(this.P, '-' + amt + ' COINS (PAID)', COL.gold2, 16); SFX.play('coin'); } else { const dmg = Math.round(Stats.maxHP() * .1), h = Math.round(E.maxHp * .08); S.hp = Math.max(1, S.hp - dmg); E.hp = Math.min(E.maxHp, E.hp + h); this.float(this.P, '-' + dmg + ' WRITTEN OFF', COL.red, 18); this.float(E, '+' + h, COL.green, 18); SFX.play('hurt'); } });
      this.at(1.8, () => _et.call(this)); return;
    }
    return _et.call(this);
  };
}
{ const _pt = C2.phaseTwo;
  C2.phaseTwo = function () {
    const d = this.def; _pt.call(this);
    if (d.id === 'brackish') { this.silence = true; this.at(1.4, () => { Music.stop(2.5); Amb.set('silent'); Toast.add('SILENCE: the music is gone. Watch her wind-up, not your ears.', COL.blue, '…'); }); }
    if (d.id === 'haughtsworth') { this.at(.6, () => { SFX.play('heavy'); Cam.shake(1); Particles.burst(this.E.x, CGY, 40, { c: '#ffffff', type: 'smoke', size: 5, smin: 20, smax: 120 }); Ach.unlock('haughty'); }); }
  };
}
{ const _sk = C2.startOffense; C2.startOffense = function (kind) { this.curKind = kind; if (this.used) this.used[kind] = (this.used[kind] || 0) + 1; return _sk.call(this, kind); }; }
{ const _hit = C2.hitE;
  C2.hitE = function (grade, mult, o = {}) {
    const d = this.def, E = this.E; let note = null, dismount = false;
    if (d.id === 'grudge' && !o.ult && this.used) { const k = o.counter ? null : this.curKind, other = k === 'attack' ? 'skill' : 'attack'; if (k && this.used[k] >= 2 && this.used[k] > this.used[other]) { mult *= .2; note = 'GRUDGE HELD: immune-ish to ' + k.toUpperCase(); } }
    if (d.id === 'haughtsworth' && !E.phase2) { if (grade === 'PERFECT' && !o.counter) dismount = true; else if (!o.ult) { mult *= .5; note = 'MOUNTED: half damage'; } }
    const dmg = _hit.call(this, grade, mult, o);
    if (note && dmg) this.float(E, note, '#c8e0ff', 13, -40);
    if (dismount && dmg && E.hp > E.maxHp / 2) { E.hp = Math.round(E.maxHp / 2); this.float(E, 'OFF HIS HIGH HORSE!', COL.gold2, 22, -46); Banner.show('DISMOUNTED!', 'A PERFECT strike knocks Lord Haughtsworth to the ground', COL.gold2, 2); }
    if (grade === 'PERFECT' && dmg) this.assistK = Math.min(100, (this.assistK || 0) + 12);
    if (grade === 'PERFECT' && dmg && Prog.perks().c) this.addBrk(4 * Prog.perks().c);
    return dmg;
  };
}
{ const _ap = C2.afterPlayer;
  C2.afterPlayer = function () {
    const E = this.E;
    if (!this.over && this.def.id === 'grinwell' && E.phase2 && !E.phase3 && E.hp > 0 && E.hp <= E.maxHp * .22) { this.phaseThree(); return; }
    return _ap.call(this);
  };
}
C2.phaseThree = function () {
  const E = this.E, d = this.def; this.phase = 'phase'; E.phase3 = true; Cam.tx = EX - 30; Cam.ty = 165; Cam.tz = 1.3; Tweens.to(Post, { letter: 1 }, .4);
  this.at(.5, () => { Post.doFlash(.8, '#ffd0f0'); SFX.play('boom'); SFX.play('boom'); Cam.shake(1); TimeFX.hit(.2); E.flash = .3; Particles.burst(E.x, CGY - E.h * .7, 60, { c: '#ffb0e0', type: 'spark', smin: 60, smax: 240, lmin: .4, lmax: 1 }); });
  this.at(1.2, () => Dialog.start(BOSS_TEXT.grinwell.phase3.map(([n, t]) => n === '' ? D('', 'narrator', t) : D(n, 'monster', t)), () => {
    E.hp = Math.min(E.maxHp, E.hp + Math.round(E.maxHp * .15)); E.atk *= 1.12; Music.setLayer('boss2p', 1, .5); Banner.show('PHASE THREE', 'The Smile Slips', COL.red, 2.2); Tweens.to(Post, { letter: 0 }, .5); Cam.tz = 1; Cam.tx = 320; Cam.ty = 180; this.at(1.2, () => this.enemyTurn());
  }, { onLine: L => { E.talking = !!L.n && L.n !== S.name; } }));
};
// ---------- companion assist (free action, once per turn, bar fills over turns + PERFECTs) ----------
C2.assist = function () {
  const id = Party.active(); if (!id || this.phase !== 'player' || this.assistUsed || this.assistK < 100) { SFX.play('error'); return; }
  this.assistUsed = true; this.assistK = 0; this.phase = 'action'; this.itemMenu = false; S.assists = (S.assists || 0) + 1; Ach.unlock('assist'); const E = this.E, P = this.P, C = COMPANIONS[id];
  Banner.show(C.move.toUpperCase(), C.name, C.col, 1.4); this.compAtk = this.ct;
  this.at(.5, () => {
    if (id === 'lucien') { const dmg = Math.round(E.maxHp * (this.boss ? .07 : .12)); E.hp = Math.max(0, E.hp - dmg); E.flash = .1; this.addSt('E', 'weak', 2); this.float(E, '-' + dmg + ' WITHERED', '#d0a0ff', 22); SFX.play('laugh', { v: .5 }); Particles.burst(E.x, CGY - E.h / 2, 30, { c: '#b060ff', type: 'smoke', size: 3, smin: 10, smax: 60, glow: 1 }); }
    else if (id === 'honk') { SFX.play('honk'); SFX.play('honk', { v: .6 }); Cam.shake(.4); if (chance(.7)) { E.st.stagger = 1; this.float(E, 'STAGGERED BY GOOSE', '#e0c050', 18, -20); } this.addSt('E', 'bleed', 3); const dmg = Math.round(E.maxHp * .05); E.hp = Math.max(0, E.hp - dmg); this.float(E, '-' + dmg, '#ffffff', 20); Particles.burst(E.x, CGY - E.h / 2, 18, { c: '#f4f0e6', type: 'star', smin: 40, smax: 140, size: 2 }); }
    else { const h = heal(Math.round(Stats.maxHP() * .22)); ['poison', 'bleed', 'burn', 'weak'].forEach(k => delete P.st[k]); this.addSt('P', 'blessed', 3); this.float(P, '+' + h + ' SMALL MERCY', COL.green, 20); SFX.play('heal'); Particles.burst(P.x, CGY - 40, 24, { c: '#fff0a0', type: 'star', smin: 10, smax: 60, g: -40, size: 2 }); }
  });
  this.at(1.2, () => { if (E.hp <= 0) { this.win(); return; } this.phase = 'player'; this.say('Your turn continues.'); });
};
{ const _card = C2.card; C2.card = function (k) { if (k === 'assist') return this.assist(); return _card.call(this, k); }; }
{ const _dp = C2.drawP;
  C2.drawP = function () {
    const id = Party.active(); if (id && !this.raid) { const k = this.compAtk !== undefined ? clamp((this.ct - this.compAtk) / .9, 0, 1) : 1, dash = k < 1 ? Math.sin(k * Math.PI) * 60 : 0; drawCompanion(id, this.P.x - 58 + dash, CGY - 2, { s: 1.45, t: T, walk: this.phase === 'intro' && this.P.m ? this.ct * 10 : undefined, atk: k < 1 ? Math.sin(k * Math.PI) : 0, expr: k < 1 ? 'angry' : undefined }); }
    return _dp.call(this);
  };
}
{ const _de = C2.drawE;
  C2.drawE = function () {
    if (this.def.cursed && this.E.pose !== 'dead') { const x = this.E.x + this.E.kb, h = this.E.h; ctx.globalAlpha = .22 + Math.sin(T * 4) * .08; pEll('#8a30c0', x, CGY - h / 2, h * .42 + 6, h * .58 + 6); ctx.globalAlpha = 1; if (chance(DT * 10)) Particles.spawn({ x: x + rnd(-h * .3, h * .3), y: CGY - rnd(0, h), vx: 0, vy: -rnd(10, 30), life: 1, c: '#c070ff', size: 1, glow: 1 }); }
    return _de.call(this);
  };
}
{ const _ui = C2.ui;
  C2.ui = function () {
    _ui.call(this); if (this.titleCard || this.phase === 'intro' || this.over) return;
    const id = Party.active();
    if (id && !this.raid) { const C = COMPANIONS[id], k = (this.assistK || 0) / 100, ready = k >= 1 && !this.assistUsed && this.phase === 'player' && !Overlays.stack.length;
      UI.panel(14, 122, 300, 58); UI.text(`ASSIST · ${C.name}`, 28, 144, { size: 13, col: C.col, maxW: 180 }); UI.bar(28, 154, 160, 9, k, ready ? `hsl(${(T * 160) % 360},70%,65%)` : C.col);
      if (UI.btn(this.assistUsed ? 'USED' : C.move, 196, 132, 108, 40, { size: 11, accent: ready, disabled: !ready, key: '6', id: 'assistbtn', sub: ready ? '[6]' : '' })) this.assist(); }
    if (this.def.id === 'grudge' && this.used) { const m = this.used.attack === this.used.skill ? null : this.used.attack > this.used.skill ? 'ATTACK' : 'SKILL'; if (m && Math.max(this.used.attack, this.used.skill) >= 2) UI.pill('THE GRUDGE REMEMBERS: ' + m, 894, 164, '#a0d8ff', { size: 12 }); }
    if (this.def.id === 'haughtsworth' && !this.E.phase2) UI.pill('MOUNTED · land a PERFECT to dismount', 894, 164, COL.gold2, { size: 12 });
    if (this.def.id === 'ledger') UI.pill(`Next invoice: turn ${Math.ceil(Math.max(1, this.turn + 1) / 3) * 3}`, 894, 164, COL.gold2, { size: 12 });
    if (this.silence) UI.pill('SILENCE', 600, 100, COL.blue, { size: 12 });
    if (this.def.cursed) UI.pill('CURSED ELITE · +45% HP', 894, 164, COL.purple, { size: 12 });
  };
}
// ---------- rewards / progression ----------
{ const _rw = C2.rewards;
  C2.rewards = function () {
    const a = this.area, l = this.lvl, d = this.def, side = this.side, lv0 = S.level;
    let saved = null; if (side) saved = { c: S.clears[a][l], u: S.unlocked };
    if (S.level >= LEVEL_CAP) S.xp = 0;
    _rw.call(this);
    const lines = this.rw.lines;
    if (side) { S.clears[a][l] = saved.c; S.unlocked = saved.u; const first = !S.side[side]; S.side[side] = 1;
      if (d.cursed) { Prog.kill(d.id, true); Ach.unlock('cursed'); if (chance(.75)) { const tid = Prog.rollTrinket(1); Prog.giveTrinket(tid); lines.push([`Trinket: ${TRINKETS[tid].name}`, RARITY[TRINKETS[tid].rar][1]]); } }
      if (SIDE_SHARD[d.id] !== undefined && !S.shards.includes(d.id)) { S.shards.push(d.id); lines.push([`◇ SIGH SHARD ${S.shards.length}/5`, '#c8e8ff']); Banner.show('SIGH SHARD', `A sigh that was never let out. ${S.shards.length}/5`, '#c8e8ff', 2.6); Ach.unlock('shard1'); if (S.shards.length >= 5) Ach.unlock('shard5'); Prog.lore(25 + Object.keys(SIDE_SHARD).indexOf(d.id)); if (d.id === 'brendan') Ach.unlock('brendan'); }
      if (first && !d.cursed && chance(.6)) { const tid = Prog.rollTrinket(0); Prog.giveTrinket(tid); lines.push([`Trinket: ${TRINKETS[tid].name}`, RARITY[TRINKETS[tid].rar][1]]); }
    }
    if (!this.raid && !d.cursed) Prog.kill(d.id, false);
    if (a >= 5 && !side && !this.raid) { const idx = (a - 5) * 5 + l; if (Prog.lore(idx)) lines.push([`❧ Lore page found (${S.lore.length}/${LORE_PAGES.length})`, COL.purple]); }
    if (d.id === 'lucien') { S.act2Open = true; Ach.unlock('act1'); }
    if ({ ledger: 1, brackish: 1, grudge: 1, haughtsworth: 1, grinwell: 1 }[d.id]) Ach.unlock({ haughtsworth: 'haughty' }[d.id] || d.id);
    if (S.level > lv0) { S.pp = (S.pp || 0) + (S.level - lv0); lines.push([`+${S.level - lv0} perk point${S.level - lv0 > 1 ? 's' : ''} (train at Port Mopeway)`, COL.green]); Ach.checkLevel(); }
    if (S.level >= LEVEL_CAP) { S.xp = 0; if (!lines.some(x => x[0].startsWith('LEVEL CAP'))) lines.push([`LEVEL CAP ${LEVEL_CAP} — XP converted to coins`, COL.dim]); }
    Save.save(true);
  };
}
{ const _lv = C2.leave;
  C2.leave = function () {
    if (!this.raid && this.area >= 5) {
      if (this.def.id === 'grinwell') { Scene.go('act2end', {}, { out: 1.4, in: 1, hold: .4, col: '#fff' }); return; }
      const node = this.args.node !== undefined ? this.args.node : Map2.nodeOf(this.area, this.lvl);
      Scene.go('overworld2', { node, reveal: this.rw && this.rw.reveal !== null ? this.rw.reveal : undefined }, { type: 'fade', out: .6, in: .6 }); return;
    }
    return _lv.call(this);
  };
}
// ---------- death styles for the new rigs ----------
Object.assign(DEATH_STYLES, {
  arch_jelly(D) { D.col = BLOOD.purple || BLOOD.ecto; DEATH_STYLES.slime_rat(D); },
  arch_balloon(D) { const B = D.body; B.pu = D.b.cx; D.tween(.4, (k, r) => { B.sx = 1 + k * .3 + Math.sin(r * 50) * .05; B.sy = 1 + k * .3; }, 0, Ease.inQ); D.at(.42, () => { D.sfx('boom', { v: .5 }); Cam.shake(.4); B.alpha = 0; for (let i = 0; i < 60; i++) Particles.spawn({ x: D.X0 + rnd(-14, 14), y: CGY - D.h * .6 + rnd(-10, 10), vx: rnd(-160, 160), vy: -rnd(40, 220), life: rnd(.8, 1.6), c: pick(['#f05a8a', '#f0d040', '#5af0c0', '#8a5af0', '#ffffff']), type: 'drop', g: 260, ground: CGY + rnd(0, 14), size: 2 }); }); },
  arch_clam(D) { D.col = BLOOD.ecto || BLOOD.green; DEATH_STYLES.arch_human(D); },
  arch_yeti(D) { D.col = BLOOD.ecto || BLOOD.red; D.sfx('shatter'); D.cutGrid(4, 4, .2, false, p => { p.vx = rnd(-140, 200); p.vy = -rnd(80, 260); p.vr = rnd(-10, 10); p.bleed = .2; }); for (let i = 0; i < 40; i++) Particles.spawn({ x: D.X0 + rnd(-20, 20), y: CGY - rnd(0, D.h), vx: rnd(-80, 80), vy: -rnd(20, 120), life: rnd(.6, 1.4), c: '#e8f8ff', type: 'star', size: 2 }); },
  grinwell(D) { const B = D.body; B.pu = D.b.cx; D.sfx('ehurt'); D.tween(.6, k => { B.sy = 1 - k * .12; B.tint = '#ffd0f0'; B.tintA = k * .4; }); D.at(1, () => { D.sfx('shatter'); D.disintegrate({ dir: 'up', dur: 1.6, mode: 'rise', tint: '#ffe0f0', step: 2 }); for (let i = 0; i < 40; i++) Particles.spawn({ x: D.X0 + rnd(-14, 14), y: CGY - rnd(0, D.h), vx: rnd(-10, 10), vy: -rnd(20, 70), life: rnd(1, 2), c: '#ffd0f0', type: 'star', size: 2, glow: 1 }); }); }
});
