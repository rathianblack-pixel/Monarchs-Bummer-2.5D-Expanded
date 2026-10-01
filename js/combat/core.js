'use strict';
/* =========================================================
   COMBAT — core state, turn flow, AI
   ========================================================= */
const PX = 200, EX = 440;
const ST_INFO = { bleed: ['Bleeding', '#d8574a'], stagger: ['Stagger', '#e0c050'], burn: ['Burning', '#f08030'], soak: ['Soaked', '#6aa8e0'], blessed: ['Blessed', '#fff0a0'], weak: ['Weakened', '#a878d8'], poison: ['Poisoned', '#7fc46a'] };
const ENEMY_STATUS = { slime_rat: 'poison', goose: 'weak', peasant: 'weak', raccoon: 'bleed', barnaby: 'weak', goblin: 'bleed', zwolf: 'poison', bsprite: 'weak', twolf: 'bleed', gloomfang: 'burn', skarcher: 'bleed', mummy: 'poison', necro: 'weak', wraith: 'weak', timmy: 'poison', mimic: 'bleed', gremlin: 'burn', msprite: 'weak', gauntlet: 'bleed', minotaur: 'weak', dknight: 'bleed', gargoyle: 'weak', sorcerer: 'burn', warden: 'weak', lucien: 'burn' };
const STYLE = {
  jump: { k: 'arc', arc: 34, wv: 'squeak', hit: 'chomp', col: '#9aba6a' }, lunge: { k: 'dash', dd: .12, hit: 'punch', col: '#f0f0f0' }, swing: { k: 'dash', hit: 'heavy', col: '#e0c090' },
  scratch: { k: 'dash', hit: 'slash', col: '#e0e0e0', multi: 3 }, bash: { k: 'dash', dd: .22, hit: 'heavy', col: '#c8a060', big: 1 }, stab: { k: 'dash', dd: .1, hit: 'slash', col: '#e0e0e0' },
  leap: { k: 'arc', arc: 50, hit: 'chomp', col: '#b0a0a0' }, flick: { k: 'ranged', proj: 'spark', cast: 'lightcast', hit: 'lighthit', col: '#c0ffa0' }, arrow: { k: 'ranged', proj: 'arrow', cast: 'bowrel', hit: 'arrowhit', col: '#e0e0e0' },
  slap: { k: 'dash', dd: .24, hit: 'punch', col: '#c8b890' }, spell: { k: 'ranged', proj: 'orb', cast: 'firecast', hit: 'boom', col: '#a060ff' }, sweep: { k: 'dash', dd: .2, hit: 'slash', col: '#80ffd0', glide: 1 },
  snap: { k: 'arc', arc: 20, hit: 'chomp', col: '#e0c070' }, throw: { k: 'ranged', proj: 'rock', cast: 'whoosh', hit: 'punch', col: '#a09080' }, punch: { k: 'dash', dd: .1, hit: 'heavy', col: '#c0c0d0', big: 1 },
  charge: { k: 'dash', dd: .14, back: 1, hit: 'heavy', col: '#e0b080', big: 1 }, dive: { k: 'arc', arc: 80, hit: 'heavy', col: '#909098', big: 1 }, royal: { k: 'royal', proj: 'flame', cast: 'firecast', hit: 'firehit', col: '#b060ff', big: 1 }
};
const ARCH_H = { rat: 16, goose: 30, quad: 26, sprite: 34, wraith: 40, mimic: 22, gremlin: 24, gauntlet: 28, gargoyle: 34, human: 46 };
const GRADE_COL = { PERFECT: '#f0d890', GOOD: '#ffffff', MISS: '#a0a0a0' };
Scenes.combat = { hd: true,
  timeRuns: false,
  enter(a) {
    this.args = a; this.raid = !!a.raid; this.ct = 0; this.q = []; this.proj = []; this.over = false; this.mg = null; this.cue = null; this.itemMenu = false; this.bubble = null; this.titleCard = 0; this.dark = 0; this.bolt = 0; this.wallShift = 0; this.ult = null;
    let def, area, lvl;
    if (this.raid) { area = clamp(S.unlocked - 1, 0, 4); lvl = 2; const base = ENEMY[a.enemy] || ENEMY.zwolf; const rn = RAID_ENEMIES.find(r => r.base === base.id); def = Object.assign({}, base, { name: rn ? rn.name : 'Raider' }); }
    else { area = a.area; lvl = a.lvl; def = a.def || ENEMIES[area * 5 + lvl]; }
    this.area = area; this.lvl = lvl; this.def = def; this.field = this.raid ? -1 : area; this.boss = !!def.boss && !this.raid; this.mini = !this.raid && (lvl === 3 || !!a.mini);
    const ng = Stats.ngMul();
    const hp = Math.round((20 + area * 24 + (lvl + 1) * 6) * (this.boss ? 2.3 : 1) * ng * (this.raid ? 1.2 : 1));
    this.E = { def, name: def.name, x: 720, jy: 0, kb: 0, hp, maxHp: hp, ghost: hp, atk: (5 + area * 3 + (lvl + 1) * .9 + (this.boss ? 3 : 0)) * (1 + S.ng * .25), df: area * 1.4 + lvl * .4, st: {}, shield: 0, dodge: false, smoked: false, phase2: false, pose: 'idle', poseT: 0, flash: 0, alpha: 1, intent: null, last: null, enrage: 0, h: (ARCH_H[def.arch] || 40) * 1.7 * (def.scale || 1) };
    if (!S.hp || S.hp <= 0) S.hp = Math.ceil(Stats.maxHP() / 2); S.hp = Math.min(S.hp, Stats.maxHP());
    this.P = { x: PX - 140, jy: 0, kb: 0, st: {}, guard: false, evade: false, pose: 'idle', poseT: 0, flash: 0, rot: 0 };
    this.pGhost = S.hp; this.mana = CLASSES[S.cls].mana ? Stats.maxMana() : 4; this.brk = 0; this.brkReady = false; this.turn = 0;
    this.buff = {}; (S.buffs || []).forEach(b => this.buff[b] = true); S.buffs = [];
    if (this.buff.veteran) this.brk = 15; if (this.buff.inspired) Later.add(1.5, () => Toast.add('Inspired: +2 damage this fight', COL.gold2, '♪'));
    Codex.see(def.id);
    Music.resetLayers(); ['pulse', 'low', 'boss2', 'boss2p'].forEach(k => Music.layerVol[k] = 0);
    Music.play(this.raid ? 'c' + Math.min(area, 1) : this.boss ? (def.id === 'lucien' ? 'lucien_boss' : 'b' + area) : 'c' + area, .8);
    Amb.set(this.raid ? 'village' : AREAS[area].amb);
    Cam.reset(320, 180); Cam.follow = 5; this.layers = { low: 0, pulse: 0 };
    this.death = null; this.phase = 'intro'; this.log = ''; this.logT = 0;
    // entrance
    this.mv(this.P, PX, .9, 0, Ease.outQ);
    if (this.boss) { this.E.x = EX; this.E.jy = -260; this.E.alpha = 0; this.at(.6, () => { this.E.alpha = 1; this.mvY(this.E, 0, .45); }); this.at(1.05, () => { SFX.play('boom'); Cam.shake(.8); TimeFX.hit(.1); Particles.burst(EX, CGY, 30, { c: '#b8a080', type: 'smoke', size: 4, smin: 20, smax: 90, lmin: .6, lmax: 1.2 }); SFX.play(def.voice); }); this.at(1.6, () => this.bossIntro()); Post.letter = 0; Tweens.to(Post, { letter: 1 }, .6); }
    else { this.mv(this.E, EX, 1.1, 0, Ease.outQ); this.E.walkUntil = 1.1; this.at(.9, () => SFX.play(def.voice, { v: .7 })); this.at(1.3, () => this.raid ? this.startRaid() : this.storyCard()); }
  },
  exit() { Post.letter = 0; this.dark = 0; Cam.tz = 1; Music.resetLayers(); },
  // ---------- scheduler & motion ----------
  at(d, fn) { this.q.push({ t: this.ct + d, fn }); },
  mv(e, x1, dur, arc = 0, ease = Ease.ioQ) { e.m = { x0: e.x, x1, t0: this.ct, dur, arc, ease }; },
  mvY(e, y1, dur) { e.my = { y0: e.jy, y1, t0: this.ct, dur }; },
  pose(e, p) { e.pose = p; e.poseT = this.ct; },
  say(s) { this.log = s; this.logT = 0; },
  // ---------- intro ----------
  storyCard() {
    const st = (this.args && this.args.story) || STORIES[this.area * 5 + this.lvl], A = AREAS[this.area]; let k = 0;
    const ov = Overlays.push({ name: 'story', update: dt => { k = Math.min(1, k + dt * 3); }, draw: () => {
      const e = Ease.outBack(k), x = 340, w = 600, h = 330, y = 150 + (1 - e) * 60; g.globalAlpha = clamp(k * 1.5, 0, 1); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, 0, 1280, 720);
      UI.parchment(x, y, w, h); UI.text(`${A.name.toUpperCase()} · ${this.lvl === 4 ? 'BOSS' : 'LEVEL ' + (this.lvl + 1)}`, 640, y + 44, { align: 'center', size: 14, col: '#6a4a2a', shadow: false });
      UI.text(st[0], 640, y + 84, { align: 'center', size: 30, col: '#3a2010', shadow: false }); g.fillStyle = '#8a6a3a'; g.fillRect(540, y + 98, 200, 2);
      UI.para(st[1], x + 50, y + 134, w - 100, { size: 17, col: '#3a2818', shadow: false, lh: 25 });
      UI.text(`Field: ${A.field} — ${A.fieldDesc}`, 640, y + h - 76, { align: 'center', size: 14, col: '#2a4a6a', shadow: false });
      if (UI.btn('BEGIN', 560, y + h - 58, 160, 40, { accent: true, key: ['Enter', ' '], sound: 'confirm' })) { Overlays.pop(ov); this.begin(); }
      g.globalAlpha = 1; } });
    SFX.play('page');
  },
  startRaid() { Banner.show('RAID!', `${this.E.name} is in the village. Protect the turnips.`, COL.red, 2.2); this.at(1.8, () => this.begin()); },
  bossIntro() {
    const d = this.def, bt = BOSS_TEXT[d.id]; this.titleCard = .001; Music.sting('boss'); SFX.play('bell', { v: .6 }); Cam.tx = EX - 40; Cam.ty = 170; Cam.tz = 1.25;
    const conv = arr => arr.map(([n, t]) => n === 'You' ? D(S.name, 'player', t) : n === '' ? D('', 'narrator', t) : D(n, n === 'Lucien' ? 'lucien' : 'monster', t));
    this.at(2.8, () => {
      this.titleCard = 0; Cam.tz = 1.1; Cam.tx = 320; Cam.ty = 180;
      if (!bt) { this.endIntro(); return; }
      const lines = []; for (const L of bt.intro) { if (Array.isArray(L)) lines.push(...conv([L])); else lines.push({ n: L.n, v: L.n === 'Lucien' ? 'lucien' : 'monster', t: L.t, c: L.c.map(ch => ({ t: ch.t, f: () => Dialog.start(conv(ch.r), () => this.endIntro()) })) }); }
      Dialog.start(lines, () => this.endIntro(), { onLine: L => { this.E.talking = L.n === d.name || (L.n && d.name.includes(L.n)); } });
    });
  },
  endIntro() { this.E.talking = false; Tweens.to(Post, { letter: 0 }, .5); Cam.tz = 1; Cam.tx = 320; Cam.ty = 180; this.begin(); },
  begin() { this.turn = 0; this.chooseIntent(); this.startPlayerTurn(); },
  // ---------- statuses ----------
  addSt(side, k, n) {
    const tgt = side === 'P' ? this.P : this.E;
    if (side === 'P' && this.buff.purified && k !== 'blessed') { this.buff.purified = false; this.float(this.P, 'PURIFIED', '#bfe0ff', 18); SFX.play('shield'); return; }
    const fresh = !tgt.st[k]; tgt.st[k] = Math.max(tgt.st[k] || 0, n); if (k === 'soak' && side === 'E') this.E.soakHits = 2;
    if (fresh) { this.float(tgt, ST_INFO[k][0].toUpperCase(), ST_INFO[k][1], 16, -18); SFX.play('status', { v: .7 }); }
  },
  dot(side, k) { const atk = side === 'E' ? Stats.atk() : this.E.atk; return Math.max(1, Math.round(atk * ({ bleed: .2, burn: .26, poison: .2 }[k]) + (k === 'poison' ? 1 : 0))); },
  tickSt(side) {
    const tgt = side === 'P' ? this.P : this.E; let total = 0, i = 0;
    for (const k of ['bleed', 'burn', 'poison']) if (tgt.st[k]) { const d = this.dot(side, k); total += d; const kk = k; this.at(i * .35, () => { this.float(tgt, '-' + d, ST_INFO[kk][1], 20); SFX.play(kk === 'burn' ? 'firehit' : 'hurt', { v: .5 }); Particles.burst(tgt.x, CGY - 30, 8, { c: ST_INFO[kk][1], smin: 10, smax: 40, g: 60 }); tgt.flash = .08; }); i++; }
    if (side === 'P' && tgt.st.blessed) { const h = 3 + Math.floor(S.level / 2); this.at(i * .35, () => { heal(h); this.float(this.P, '+' + h, COL.green, 18); SFX.play('heal', { v: .5 }); }); i++; }
    for (const k in tgt.st) if (k !== 'stagger') { tgt.st[k]--; if (tgt.st[k] <= 0) delete tgt.st[k]; }
    if (side === 'E' && !tgt.st.soak) tgt.soakHits = 0;
    return { dmg: total, delay: i * .35 };
  },
  // ---------- player turn ----------
  startPlayerTurn() {
    if (this.over) return; this.turn++; this.P.guard = false; this.P.evade = false; this.pose(this.P, 'idle');
    const cls = CLASSES[S.cls]; this.mana = Math.min(Stats.maxMana(), this.mana + (cls.mana ? 2 : 1));
    const r = this.tickSt('P'); let delay = r.delay; S.hp -= r.dmg;
    if (this.field === 4) { this.at(delay, () => { S.hp -= 1; this.float(this.P, '-1 MIDNIGHT FLAME', '#b060ff', 14); Particles.burst(this.P.x, CGY - 10, 10, { c: '#b060ff', smin: 10, smax: 40, g: -60, glow: 1 }); }); delay += .35; }
    if (this.field === 3 && this.turn % 3 === 0) { this.at(delay, () => this.shiftWalls()); delay += .8; }
    this.at(delay + .05, () => {
      if (S.hp <= 0) { S.hp = 0; this.lose(); return; }
      this.phase = 'player'; this.say(this.intentLine || '');
    });
    if (delay > 0) this.phase = 'ticking';
  },
  shiftWalls() {
    SFX.play('rattle'); SFX.play('anvil', { v: .4 }); Cam.shake(.3); Tweens.to(this, { wallShift: 1 }, .4, Ease.ioQ, 0, () => Tweens.to(this, { wallShift: 0 }, .6, Ease.ioQ, .6));
    const opts = [() => { this.addSt('P', 'blessed', 3); Toast.add('SHIFTING WALLS: You are Blessed', COL.blue, '▦'); }, () => { this.mana = Math.min(Stats.maxMana(), this.mana + 3); Toast.add(`SHIFTING WALLS: +3 ${Stats.manaName()}`, COL.blue, '▦'); }, () => { this.E.shield = Math.max(this.E.shield, 1); Toast.add('SHIFTING WALLS: The foe is shielded', COL.red, '▦'); }, () => { this.E.enrage = 2; Toast.add('SHIFTING WALLS: The foe is enraged', COL.red, '▦'); }];
    pick(opts)();
  },
  canSkill() { return this.mana >= 4; },
  card(k) {
    if (this.phase !== 'player') return;
    if (k === 'attack') this.startOffense('attack');
    else if (k === 'skill') { if (!this.canSkill()) { SFX.play('error'); this.say(`Not enough ${Stats.manaName()}.`); return; } this.mana -= 4; this.startOffense('skill'); }
    else if (k === 'guard') { this.phase = 'action'; this.P.guard = true; this.P.evade = S.cls === 'bow'; this.mana = Math.min(Stats.maxMana(), this.mana + 3); this.pose(this.P, 'guard'); SFX.play(S.cls === 'bow' ? 'dodge' : 'shield'); this.float(this.P, S.cls === 'bow' ? 'EVADE STANCE' : 'GUARD', '#bfe0ff', 18); this.say(S.cls === 'bow' ? 'You get light on your feet. Time the dodge for a counter.' : 'You raise your guard. Time the block for a PERFECT.'); this.at(.6, () => this.enemyTurn()); }
    else if (k === 'items') { this.itemMenu = !this.itemMenu; SFX.play('page'); }
    else if (k === 'break') { if (this.brk < 100) { SFX.play('error'); this.say('The Break meter is not full yet.'); return; } this.ultimate(); }
  },
  useItem(id) {
    if (!S.inv[id]) { SFX.play('error'); return; } const it = ITEMS[id]; this.itemMenu = false;
    if (it.smoke && !this.boss && !this.raid) { S.inv[id]--; this.phase = 'action'; SFX.play('whoosh'); for (let i = 0; i < 30; i++) Particles.spawn({ x: this.P.x + rnd(-20, 20), y: CGY - rnd(0, 50), vx: rnd(-20, 20), vy: rnd(-20, 5), life: rnd(1, 2), c: '#c8c8d0', type: 'smoke', size: rndi(4, 8) }); this.mv(this.P, -60, .7, 0, Ease.inQ); this.over = true; Later.add(.8, () => { Save.save(true); Scene.go('overworld', { node: S.mapNode, from: 'flee' }, { out: .4, in: .5 }); }); return; }
    S.inv[id]--; this.phase = 'action'; this.pose(this.P, 'eat'); SFX.play(id === 'drumstick' ? 'chomp' : 'gulp');
    this.at(.35, () => {
      if (it.heal) { const h = heal(it.heal); this.float(this.P, '+' + h, COL.green, 24); SFX.play('heal'); Particles.burst(this.P.x, CGY - 40, 14, { c: '#a0ff90', type: 'star', smin: 10, smax: 50, g: -30, size: 2 }); }
      if (it.cure) { ['poison', 'bleed', 'burn', 'weak'].forEach(k => delete this.P.st[k]); this.float(this.P, 'CURED', COL.green, 20); SFX.play('heal'); }
      if (it.mana) { this.mana = Math.min(Stats.maxMana(), this.mana + it.mana); this.float(this.P, '+' + it.mana + ' ' + Stats.manaName(), COL.blue, 18); }
      if (it.smoke) { this.E.smoked = true; this.float(this.E, 'SMOKED', '#c8c8d0', 18); for (let i = 0; i < 24; i++) Particles.spawn({ x: this.E.x + rnd(-20, 20), y: CGY - rnd(0, 50), vx: rnd(-20, 20), vy: rnd(-20, 5), life: rnd(1, 2), c: '#c8c8d0', type: 'smoke', size: rndi(4, 8) }); }
      this.say(`You used ${it.name}.`);
    });
    this.at(.9, () => { this.pose(this.P, 'idle'); this.enemyTurn(); });
  },
  afterPlayer() {
    if (this.over) return;
    if (this.E.hp <= 0) { this.win(); return; }
    if (this.boss && !this.E.phase2 && this.E.hp <= this.E.maxHp / 2) { this.phaseTwo(); return; }
    if (this.mini && !this.E.phase2 && this.E.hp <= this.E.maxHp / 2) { this.E.phase2 = true; this.E.atk *= 1.1; Banner.show(this.E.name.toUpperCase(), pick(MINI_BOSS_PHASE).replace('{n}', this.E.name), COL.gold2, 2); SFX.play(this.def.voice); Cam.shake(.4); Music.setLayer('pulse', 1); this.at(1.4, () => this.enemyTurn()); return; }
    this.at(.35, () => this.enemyTurn());
  },
  phaseTwo() {
    this.phase = 'phase'; const d = this.def, bt = BOSS_TEXT[d.id]; Cam.tx = EX - 30; Cam.ty = 165; Cam.tz = 1.3; Tweens.to(Post, { letter: 1 }, .4); Audio.duckMusic(.3, 2);
    this.at(.6, () => { this.E.phase2 = true; this.E.flash = .2; Post.doFlash(.8, d.id === 'lucien' ? '#e0c0ff' : '#fff'); SFX.play('boom'); SFX.play(d.voice); Cam.shake(.9); TimeFX.hit(.15); Particles.burst(this.E.x, CGY - this.E.h / 2, 50, { c: d.id === 'lucien' ? '#b060ff' : '#f0a040', type: 'spark', smin: 60, smax: 220, lmin: .4, lmax: 1 }); if (d.id === 'lucien') this.bolt = 1; });
    this.at(1.2, () => {
      const lines = (bt ? bt.phase : [[d.name, 'Enough!']]).map(([n, t]) => n === 'You' ? D(S.name, 'player', t) : D(n, n === 'Lucien' ? 'lucien' : 'monster', t));
      Dialog.start(lines, () => {
        Music.setLayer('boss2', 1, .5); Music.setLayer('pulse', 1); if (d.id === 'lucien') Music.setLayer('boss2p', 1, .5); this.E.atk *= 1.15;
        Banner.show('PHASE TWO', d.title || '', COL.red, 2); Tweens.to(Post, { letter: 0 }, .5); Cam.tz = 1; Cam.tx = 320; Cam.ty = 180; this.at(1.2, () => this.enemyTurn());
      }, { onLine: L => { this.E.talking = !!L.n && L.n !== S.name; } });
    });
  },
  // ---------- enemy AI ----------
  chooseIntent() {
    const E = this.E, tr = this.def.trait; let k;
    if (E.unleash) { k = 'UNLEASH'; E.unleash = false; }
    else {
      const w = { AGGRESSIVE: { HEAVY: 3, FAST: 4, STATUS: 1, CHARGE: 1, DODGE: .5 }, TRICKSTER: { FAST: 3, DODGE: 3, STATUS: 3, HEAVY: 1, CHARGE: .5 }, DEFENSIVE: { HEAVY: 3, SHIELD: 2.5, FAST: 1, CHARGE: 1, STATUS: 1 }, BERSERK: { HEAVY: 4, CHARGE: 2, FAST: 2 }, PROTECTOR: { SHIELD: 2, HEAL: 2, STATUS: 2, HEAVY: 2, FAST: 1 } }[tr] || { HEAVY: 1, FAST: 1 };
      const ww = Object.assign({}, w); if (E.phase2) { ww.CHARGE = (ww.CHARGE || 0) + 1.5; ww.HEAVY = (ww.HEAVY || 0) + 1; }
      if (E.hp > E.maxHp * .6 || E.last === 'HEAL') delete ww.HEAL; if (E.shield) delete ww.SHIELD; if (E.last === 'CHARGE' || this.turn < 1) delete ww.CHARGE; if (E.last && ww[E.last] && E.last !== 'FAST') ww[E.last] *= .4;
      let sum = 0; for (const x in ww) sum += ww[x]; let r = rnd(sum); for (const x in ww) { r -= ww[x]; if (r <= 0) { k = x; break; } } k = k || 'HEAVY';
    }
    E.intent = k; E.last = k;
    const nm = E.name; if (k === 'UNLEASH') this.intentLine = `${nm} unleashes the BIG BUMMER next. Guard, and time it!`;
    else { const l = pick(INTENT_LINES[k]); this.intentLine = /^[A-Z]/.test(l) ? `${nm}: ${l}` : `${nm} ${l}`; }
  },
  intentLabel() { const k = this.E.intent; return { HEAVY: 'HEAVY', FAST: 'FAST ×2', DODGE: 'DODGE', CHARGE: 'CHARGE', UNLEASH: 'BIG BUMMER', STATUS: 'STATUS · ' + ST_INFO[ENEMY_STATUS[this.def.id] || 'poison'][0], SHIELD: 'SHIELD', HEAL: 'HEAL' }[k] || ''; },
  enemyTurn() {
    if (this.over) return; this.phase = 'enemy'; const E = this.E;
    const r = this.tickSt('E'); E.hp -= r.dmg; let delay = r.delay;
    if (this.field === 2 && this.def.undead && E.hp > 0) { this.at(delay, () => { const h = Math.min(2, E.maxHp - E.hp); if (h > 0) { E.hp += h; this.float(E, '+2 RESTLESS SOIL', '#80ffd0', 14); } }); delay += .35; }
    if (E.enrage) E.enrage--;
    this.at(delay + .05, () => {
      if (E.hp <= 0) { E.hp = 0; this.win(); return; }
      if (E.st.stagger) { delete E.st.stagger; this.float(E, 'STAGGERED', '#e0c050', 20); this.say(`${E.name} is staggered and loses the turn.`); SFX.play('miss'); this.chooseIntent(); this.at(.9, () => this.startPlayerTurn()); return; }
      if (this.boss && chance(.35) && BOSS_TEXT[this.def.id]) { const qq = pick(BOSS_TEXT[this.def.id].quips); this.bubble = { text: qq.replace(/^[^:]+:\s*/, '').replace(/^"|"$/g, ''), t: 0 }; }
      this.execIntent();
    });
  },
  endEnemyTurn(d = .5) { if (this.over) return; this.chooseIntent(); this.at(d, () => { this.pose(this.E, 'idle'); this.startPlayerTurn(); }); },
  execIntent() {
    const E = this.E, k = E.intent, stK = ENEMY_STATUS[this.def.id] || 'poison';
    E.dodge = false;
    if (k === 'HEAVY') this.enemyAttack({ mult: 1.5, wind: .85, hits: 1 });
    else if (k === 'FAST') this.enemyAttack({ mult: .62, wind: .42, hits: 2 });
    else if (k === 'STATUS') this.enemyAttack({ mult: .8, wind: .6, hits: 1, status: stK });
    else if (k === 'UNLEASH') this.enemyAttack({ mult: 2.2, wind: 1.05, hits: 1, big: true });
    else if (k === 'DODGE') { this.enemyAttack({ mult: .5, wind: .4, hits: 1, after: () => { E.dodge = true; this.float(E, 'EVASIVE', '#bfe0ff', 18); this.mv(E, EX + 30, .25, 10); this.at(.3, () => this.mv(E, EX, .3)); } }); }
    else if (k === 'CHARGE') { this.pose(E, 'charge'); SFX.play('charge'); this.say(`${E.name} is charging up. Next turn: BIG BUMMER.`); this.float(E, 'CHARGING', '#f0a040', 20); E.unleash = true; for (let i = 0; i < 30; i++) this.at(i * .03, () => Particles.spawn({ x: E.x + rnd(-40, 40), y: CGY - rnd(0, E.h + 20), vx: 0, vy: 0, life: .5, c: '#f0c060', type: 'star', size: 2, drag: .9 })); this.at(1.2, () => this.endEnemyTurn(.1)); }
    else if (k === 'SHIELD') { this.pose(E, 'guard'); E.shield = 2; SFX.play('shield'); this.float(E, 'SHIELDED', '#6aa8e0', 20); this.say(`${E.name} is shielded. The next two hits are reduced.`); this.at(.9, () => this.endEnemyTurn()); }
    else if (k === 'HEAL') { const h = Math.round(E.maxHp * .16); E.hp = Math.min(E.maxHp, E.hp + h); this.pose(E, 'charge'); SFX.play('heal'); this.float(E, '+' + h, COL.green, 22); Particles.burst(E.x, CGY - E.h / 2, 20, { c: '#a0ff90', type: 'star', g: -40, smin: 10, smax: 50, size: 2 }); this.say(`${E.name} patches itself up.`); this.at(1, () => this.endEnemyTurn()); }
  }
};
