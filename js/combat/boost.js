'use strict';
/* =========================================================
   COMBAT — Octopath-style BREAK & BOOST, traveller leads, JOB card
   · Every foe has a SHIELD count and hidden WEAKNESSES (class types).
     Hitting a weakness chips a shield (a PERFECT on anything chips one too).
     At 0 the foe is BROKEN: it loses its next turn, takes ×1.5 damage,
     and any charged BIG BUMMER is cancelled. It recovers after that.
   · BOOST POINTS: start 1, +1 per turn (not on a turn you boosted), max 5.
     Spend up to 3 on an attack/skill/job/break: ×(1 + .6 per BP) damage
     and extra shield chips. [B] or the BOOST button.
   · Travellers other than the hero fight with their own class and look.
   · Traveller/path battles never touch area clears, bosses or shards.
   ========================================================= */
const B_ALL = ['sword', 'bow', 'fire', 'water', 'light'];
function weakOf(d) {
  if (d.weak) return d.weak; const w = new Set(), a = d.arch || '', id = d.id || '';
  if (d.undead) { w.add('light'); w.add('fire'); }
  if (['goose', 'gull', 'sprite', 'balloon', 'wraith'].includes(a) || /gull|harpy|sprite|balloon|haught/.test(id)) w.add('bow');
  if (['rat', 'quad', 'sheep', 'penguin', 'yeti'].includes(a) || /yeti|penguin|frost|grudge|wolf/.test(id)) w.add('fire');
  if (['human', 'rider', 'horse', 'mimic'].includes(a)) w.add('sword');
  if (['crab', 'clam', 'eel', 'jelly', 'angler', 'whale'].includes(a)) w.add(/crab|clam/.test(id) ? 'sword' : 'light');
  if (['gargoyle', 'gauntlet', 'gremlin'].includes(a) || d.area === 4 || /lucien|gloomfang|sorcerer|gremlin/.test(id)) w.add('water');
  let h = 7; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const want = d.boss ? 3 : 2; let guard = 0; while (w.size < want && guard++ < 20) { w.add(B_ALL[h % 5]); h = (h >>> 2) + 11; }
  return [...w].slice(0, want);
}
{ const C = Scenes.combat;
  const _enter = C.enter;
  C.enter = function (a) {
    a = a || {}; this.trav = a.trav || null; this.retTo = a.ret || null;
    // traveller lead: chapter/path fights use their traveller; normal fights use the chosen battle lead
    const lead = this.trav ? this.trav.lead : (!a.raid && S && S.trav ? Travel.lead() : 'hero');
    this.tl = null; Travel.homeCls = null; Travel.lookFn = null;
    if (lead && lead !== 'hero' && TRAVELLERS[lead]) { this.tl = { lead, cls: S.cls, lv: S.level }; Travel.homeCls = S.cls; S.cls = TRAVELLERS[lead].cls; if (lead !== 'honk') Travel.lookFn = o => Travel.look(lead, Object.assign({}, o, lead === 'brendan' ? { weapon: 'sword' } : {})); }
    _enter.call(this, a);
    const E = this.E, d = this.def; this.weak = weakOf(d);
    E.shMax = clamp(2 + (this.lvl >= 3 ? 1 : 0) + (this.boss ? 2 : 0) + (this.area >= 5 ? 1 : 0) + (d.cursed ? 1 : 0), 2, 7); if (this.raid) E.shMax = 3;
    E.sh = E.shMax; E.broken = false; this.shPop = null; E.brkSkip = 0; this.bp = 1; this.boostSel = 0; this.boostNow = 0; this.boostedLast = false; this.jobSwap = null; this.jobMul = 1; this.brkFx = 0;
    const tr = Travel.st(); this.seen = tr.seen[d.id] || (tr.seen[d.id] = []);
  };
  const _exit = C.exit;
  C.exit = function () { this.restoreJob(); this.restoreLead(); return _exit.call(this); };
  C.restoreLead = function () { if (!this.tl) return; S.cls = this.tl.cls; Travel.homeCls = null; Travel.lookFn = null; if (S.level > this.tl.lv) S.hp = Stats.maxHP(); S.hp = Math.min(S.hp, Stats.maxHP()); this.tl = null; };
  C.restoreJob = function () { if (!this.jobSwap) return; S.cls = this.jobSwap.cls; this.jobSwap = null; this.jobMul = 1; this.mana = Math.min(this.mana, Stats.maxMana()); };
  // ---------- BP ----------
  const _spt = C.startPlayerTurn;
  C.startPlayerTurn = function () { this.restoreJob(); if (!this.over) { if (this.turn > 0 && !this.boostedLast) this.bp = Math.min(5, this.bp + 1); this.boostedLast = false; this.boostSel = 0; } return _spt.call(this); };
  C.canJob = function () { return !!this.job() && this.mana >= 3; };
  C.job = function () { const j = Travel.job(); return j && j !== S.cls ? j : null; };
  C.jobDef = function () { const j = this.job(); if (!j) return null; return ['job', 'JOB · ' + CLASSES[j].name.toUpperCase(), j, `A ${CLASSES[j].name.toLowerCase()} strike ×1.2 (3 ${Stats.manaName()})`]; };
  const _card = C.card;
  C.card = function (k) {
    if (this.phase !== 'player') return _card.call(this, k);
    const sel = this.boostSel, off = k === 'attack' || k === 'skill' || k === 'break' || k === 'job';
    if (k === 'job') { const j = this.job(); if (!j || this.mana < 3) { SFX.play('error'); this.say(`Not enough ${Stats.manaName()} for the job strike.`); return; } this.mana -= 3; this.jobSwap = { cls: S.cls }; this.jobMul = 1.2; S.cls = j; this.startOffense('attack'); this.say(`JOB · ${CLASSES[j].name}: ` + this.log); }
    else _card.call(this, k);
    if (this.phase !== 'player' && off && sel > 0) { this.boostNow = sel; this.bp -= sel; this.boostedLast = true; this.float(this.P, `BOOST ×${sel}`, '#ffd070', 22, -20); SFX.play('ultimate', { v: .35 }); Particles.burst(this.P.x, CGY - 40, 16 + sel * 8, { c: '#ffd070', type: 'star', smin: 30, smax: 120, g: -40, size: 2, glow: 1 }); }
    if (this.phase !== 'player') this.boostSel = 0;
  };
  C.cycleBoost = function () { if (this.phase !== 'player') return; const mx = Math.min(3, this.bp); this.boostSel = this.boostSel >= mx ? 0 : this.boostSel + 1; SFX.play(this.boostSel ? 'charge' : 'click', { v: .4 }); };
  // ---------- shields / weakness ----------
  const _hit = C.hitE;
  C.hitE = function (grade, mult, o = {}) {
    const E = this.E; let m = mult * (this.jobMul || 1); if (this.boostNow && !o.counter) m *= 1 + .6 * this.boostNow; if (E.broken) m *= 1.5;
    const hp0 = E.hp, dmg = _hit.call(this, grade, m, o);
    if (dmg > 0 && hp0 > 0) this.chipShield(grade, o);
    return dmg;
  };
  C.chipShield = function (grade, o) {
    const E = this.E; if (E.broken || this.over) return; const cls = S.cls, w = this.weak.includes(cls);
    if (w && !this.seen.includes(cls)) { this.seen.push(cls); this.float(E, 'WEAKNESS: ' + CLASSES[cls].name.toUpperCase(), '#ffe080', 15, -48); }
    let n = 0; if (w) n = 1 + (this.boostNow >= 1 ? 1 : 0) + (this.boostNow >= 3 ? 1 : 0); else if (grade === 'PERFECT' && !o.counter) n = 1; if (o.ult) n = Math.max(n, 2);
    if (!n) return; E.sh = Math.max(0, E.sh - n); this.shPop = { t: this.ct, n };
    if (E.sh <= 0) this.doBreak();
  };
  C.doBreak = function () {
    const E = this.E; E.broken = true; E.brkSkip = 1; E.sh = 0; this.brkFx = this.ct; if (E.unleash) { E.unleash = false; this.chooseIntent(); }
    for (const c of this.weak) if (!this.seen.includes(c)) this.seen.push(c);
    SFX.play('heavy'); SFX.play('block', { v: .8 }); Cam.shake(.55); TimeFX.hit(.12); Cam.punchZoom(.05); Post.doFlash(.25, '#ffffff');
    FloatText.add(E.x, CGY - E.h - 34, 'BREAK!', '#ffe080', 40, { pop: 1.8, life: 1.3 }); this.addBrk(10);
    for (let i = 0; i < 26; i++) Particles.spawn({ x: E.x + rnd(-14, 14), y: CGY - E.h * .5 + rnd(-14, 14), vx: rnd(-200, 200), vy: rnd(-220, 40), life: rnd(.4, .9), c: pick(['#e8f0ff', '#a0c0e8', '#ffffff']), type: 'spark', g: 400, size: 2 });
    this.say(`${E.name} is BROKEN! It loses its next turn and takes extra damage.`);
  };
  const _et = C.enemyTurn;
  C.enemyTurn = function () {
    this.restoreJob(); this.boostNow = 0; const E = this.E; if (this.over) return;
    if (E.broken && E.brkSkip > 0) { E.brkSkip--; this.phase = 'enemy';
      this.at(.15, () => { if (E.hp <= 0) { E.hp = 0; this.win(); return; } this.float(E, 'BROKEN', '#a0c0e8', 20); this.say(`${E.name} is reeling and can't act.`); SFX.play('miss'); this.pose(E, 'hurt'); });
      this.at(1, () => { if (!this.over) { this.pose(E, 'idle'); this.startPlayerTurn(); } }); return; }
    if (E.broken) { E.broken = false; E.sh = E.shMax; this.float(E, 'SHIELD RESTORED', '#a0c0e8', 15, -40); SFX.play('shield', { v: .6 }); }
    return _et.call(this);
  };
  const _ap = C.afterPlayer; C.afterPlayer = function () { this.restoreJob(); this.boostNow = 0; return _ap.call(this); };
  const _win = C.win; C.win = function () { this.restoreJob(); return _win.call(this); };
  // keyboard
  const _up = C.update; C.update = function (dt) { if (this.phase === 'player' && !Overlays.stack.length && !this.mg && Input.hit('b')) { Input.consume('b'); this.cycleBoost(); } return _up.call(this, dt); };
  // ---------- drawing ----------
  const _dp = C.drawP;
  C.drawP = function () {
    if (!this.tl || this.tl.lead !== 'honk') return _dp.call(this);
    const P = this.P, pt = this.ct - P.poseT, atk = { strike: 1, cast: .6, raise: .8, release: .7, windup: .3 }[P.pose] || 0;
    const id = Party.active(); if (id && !this.raid) drawCompanion(id, P.x - 58, CGY - 2, { s: 1.45, t: T });
    if (P.flash > 0) PAINT = '#ffffff';
    ctx.save(); if (P.pose === 'dead') { ctx.translate(P.x, CGY); ctx.rotate(-Math.min(1.5, pt * 3)); ctx.translate(-P.x, -CGY); }
    drawCompanion('honk', P.x + P.kb, CGY + P.jy, { s: 1.7, t: T, walk: P.m && this.phase === 'intro' ? this.ct * 10 : undefined, atk: atk * Math.min(1, pt * 5), talking: P.pose === 'victory' });
    ctx.restore(); PAINT = null;
  };
  const _ui = C.ui;
  C.ui = function () {
    const nm = S.name; if (this.tl) S.name = Travel.name(this.tl.lead);
    try { _ui.call(this); } finally { S.name = nm; }
    if (this.titleCard || this.phase === 'intro' || this.over) return;
    const E = this.E;
    // shield + weakness strip
    UI.panel(876, 194, 390, 40, { bg: 'rgba(16,12,20,.88)' });
    const bx = 900, by = 214; g.fillStyle = E.broken ? '#5a6a8a' : '#c8d8f0'; g.beginPath(); g.moveTo(bx - 12, by - 12); g.lineTo(bx + 12, by - 12); g.lineTo(bx + 12, by + 2); g.lineTo(bx, by + 13); g.lineTo(bx - 12, by + 2); g.closePath(); g.fill(); g.strokeStyle = '#1a1a2a'; g.lineWidth = 2; g.stroke();
    const pop = this.shPop && this.ct >= this.shPop.t && this.ct - this.shPop.t < .3 ? 1 + (1 - (this.ct - this.shPop.t) / .3) * .5 : 1;
    UI.text(E.broken ? '✕' : String(E.sh), bx, by + 6, { align: 'center', size: Math.round(16 * pop), col: '#1a1a2a', shadow: false });
    UI.text(E.broken ? 'BROKEN' : 'WEAK', 922, by + 5, { size: 12, col: E.broken ? '#a0c0e8' : COL.dim });
    this.weak.forEach((c, i) => { const x = 990 + i * 34; g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x - 14, by - 14, 28, 28); if (this.seen.includes(c)) drawIcon(c, x, by, 24); else UI.text('?', x, by + 7, { align: 'center', size: 18, col: COL.dim }); });
    if (E.broken) UI.text('×1.5 DAMAGE · NEXT TURN LOST', 1252, by + 5, { size: 11, col: '#a0c0e8', align: 'right' });
    // above the foe: small shield badge
    if (E.pose !== 'dead') { const [sx, sy] = this.sc(E.x, CGY - E.h - 6); g.globalAlpha = .9; g.fillStyle = E.broken ? 'rgba(90,106,138,.9)' : 'rgba(200,216,240,.92)'; g.fillRect(sx - 15, sy - 40, 30, 22); g.strokeStyle = '#1a1a2a'; g.strokeRect(sx - 14.5, sy - 39.5, 29, 21); UI.text(E.broken ? 'BRK' : String(E.sh), sx, sy - 23, { align: 'center', size: E.broken ? 11 : 15, col: '#1a1a2a', shadow: false }); g.globalAlpha = 1; }
    if (this.brkFx && this.ct - this.brkFx < 1.2) { const k = (this.ct - this.brkFx) / 1.2; g.globalAlpha = 1 - k; UI.text('B R E A K', 640, 300 - k * 20, { align: 'center', size: 54, col: '#e8f0ff', stroke: 4 }); g.globalAlpha = 1; }
    // BP widget (beside the Break meter)
    g.fillStyle = 'rgba(12,8,16,.8)'; g.fillRect(848, 500, 260, 38);
    UI.text('BP', 862, 524, { size: 13, col: '#ffd070' });
    for (let i = 0; i < 5; i++) { const x = 892 + i * 18, on = i < this.bp, sel = i < this.boostSel; g.fillStyle = sel ? `hsl(${40 + Math.sin(T * 8) * 10},100%,70%)` : on ? '#d8a040' : 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(x, 519, sel ? 7 : 6, 0, TAU); g.fill(); }
    const ready = this.phase === 'player' && !Overlays.stack.length;
    if (UI.btn(this.boostSel ? `BOOST ×${this.boostSel}` : 'BOOST', 990, 503, 110, 32, { size: 12, accent: this.boostSel > 0, disabled: !ready || this.bp < 1, id: 'boostbtn', sub: '[B]' })) this.cycleBoost();
  };
  // ---------- rewards / exits for traveller & path battles ----------
  const _rw = C.rewards;
  C.rewards = function () {
    const tv = this.trav, a = this.area, l = this.lvl, d = this.def; let snap = null;
    if (tv) snap = { c: S.clears[a][l], u: S.unlocked, b: Object.assign({}, S.bosses), sh: (S.shards || []).slice(), side: Object.assign({}, S.side || {}) };
    _rw.call(this);
    const lines = this.rw.lines;
    if (tv) { for (let i = lines.length - 1; i >= 0; i--) if (/FIRST CLEAR/.test(lines[i][0])) lines.splice(i, 1); S.clears[a][l] = snap.c; S.unlocked = snap.u; S.bosses = snap.b; S.shards = snap.sh; S.side = snap.side; this.rw.reveal = null;
      const t = Travel.st();
      if (tv.kind === 'chapter') { const C0 = CHAPTERS[tv.lead][tv.ch], r = C0 && C0[6]; if (C0 && (t.ch[tv.lead] || 0) === tv.ch) { t.ch[tv.lead] = tv.ch + 1; lines.push([`✔ ${C0[0]}`, COL.green]); if (r) { if (r.coins) { addCoins(r.coins); lines.push([`+${r.coins} chapter coins`, COL.gold2]); } if (r.item) { addItem(r.item); lines.push([`+1 ${ITEMS[r.item].name}`, COL.cream]); } if (r.blessHP) { S.blessHP = (S.blessHP || 0) + r.blessHP; lines.push([`+${r.blessHP} max HP (${Travel.name(tv.lead)}'s resolve)`, COL.green]); } } } }
      else { t.pa[tv.key + ':' + tv.kind] = 1; const N = PATH_NPCS[tv.key], wn = N && N[tv.kind] && N[tv.kind].win; if (wn) { if (wn.coins) { addCoins(wn.coins); lines.push([`+${wn.coins} coins (${N.name})`, COL.gold2]); } if (wn.item) { addItem(wn.item); lines.push([`+1 ${ITEMS[wn.item].name}`, COL.cream]); } } }
    }
    if (!this.raid) Travel.onWin(d, lines);
    Save.save(true);
  };
  const _lv = C.leave;
  C.leave = function () { if (this.trav && this.retTo) { this.restoreLead(); Save.save(true); Scene.go(this.retTo.scene, this.retTo.args, { type: 'fade', out: .6, in: .6 }); return; } return _lv.call(this); };
  const _lose = C.lose;
  C.lose = function () {
    if (!this.trav || !this.retTo) return _lose.call(this);
    if (this.over) return; this.over = true; this.q = []; this.cue = null; this.mg = null; this.phase = 'lose';
    this.pose(this.P, 'dead'); Music.stop(.3); SFX.play('death'); TimeFX.slowmo(.8, .4); this.say(`${this.tl ? Travel.name(this.tl.lead) : S.name} retreats. No harm done, except to pride.`);
    Later.add(2.4, () => { this.restoreLead(); S.hp = Math.max(1, Math.ceil(Stats.maxHP() / 2)); Save.save(true); Scene.go(this.retTo.scene, this.retTo.args, { type: 'fade', out: .6, in: .6 }); });
  };
}
// traveller looks while one leads a battle
{ const _pl = playerLook; playerLook = function (extra) { if (Travel.lookFn && Scene.name === 'combat') return Travel.lookFn(extra || {}); return _pl(extra); }; }
// saving mid-battle keeps the hero's own class
{ const _sv = Save.save; Save.save = function (q) { const C = Scenes.combat; if (S && (C.tl || C.jobSwap)) { const cur = S.cls; S.cls = C.jobSwap ? C.jobSwap.cls : S.cls; if (C.tl) S.cls = C.tl.cls; try { return _sv.call(this, q); } finally { S.cls = cur; } } return _sv.call(this, q); }; }
