'use strict';
/* =========================================================
   COMBAT — offense minigames, attacks, defense, ultimates
   ========================================================= */
Object.assign(Scenes.combat, {
  startOffense(kind) {
    this.phase = 'mg'; this.itemMenu = false; const cls = S.cls, skill = kind === 'skill';
    const mg = { kind, cls, t: 0, res: [], need: cls === 'bow' && skill ? 3 : 1 };
    if (cls === 'sword') { mg.dur = skill ? .8 : 1.1; this.pose(this.P, 'windup'); SFX.play('charge', { v: .4 }); }
    if (cls === 'bow') { mg.per = skill ? .55 : .75; mg.zone = .5; this.pose(this.P, 'draw'); SFX.play('bowdraw'); }
    if (cls === 'fire') { mg.fill = 0; mg.holding = false; mg.started = false; this.pose(this.P, 'cast'); }
    if (cls === 'water') { const n = skill ? 4 : 3; mg.beats = []; for (let i = 0; i < n; i++) mg.beats.push({ t: .9 + i * .42, g: null }); this.pose(this.P, 'cast'); }
    if (cls === 'light') { mg.cyc = .9; this.pose(this.P, 'raise'); }
    this.mg = mg; this.say(skill ? CLASSES[cls].skill + ' — ' + CLASSES[cls].skillDesc : { sword: 'Strike when the ring meets the circle.', bow: 'Release when the marker is in the gold.', fire: 'Hold, then release in the gold.', water: 'Tap with each wave.', light: 'Tap when the pulse meets the halo.' }[cls]);
  },
  updateMG(dt) {
    const mg = this.mg; if (!mg) return; mg.t += dt; const press = Input.hit(' ', 'Enter') || Input.mouse.clicked, grade = (d, p, gd) => d <= p ? 'PERFECT' : d <= gd ? 'GOOD' : 'MISS';
    if (press) { Input.consume(' ', 'Enter'); Input.mouse.clicked = false; }
    const finish = () => { const res = mg.res; this.mg = null; if (this.buff.foresight) { this.buff.foresight = false; res[0] = 'PERFECT'; Toast.add('Foresight: the frog was right', COL.purple, '◇'); } res.forEach(r => this.flashGrade(r)); this.execOffense(mg.kind, res); };
    if (mg.cls === 'sword') { const r = 110 * (1 - mg.t / mg.dur); mg.r = r; if (press) { mg.res.push(grade(Math.abs(r - 26), 5, 14)); finish(); } else if (r < 8) { mg.res.push('MISS'); finish(); } }
    else if (mg.cls === 'bow') { mg.pos = (1 - Math.cos(Math.PI * mg.t / mg.per)) / 2; if (press) { const g1 = grade(Math.abs(mg.pos - mg.zone), .045, .13); mg.res.push(g1); SFX.play(g1 === 'MISS' ? 'miss' : 'flick'); mg.zone = rnd(.28, .72); mg.hitAt = mg.t; if (mg.res.length >= mg.need) finish(); } else if (mg.t > 3.5) { while (mg.res.length < mg.need) mg.res.push('MISS'); finish(); } }
    else if (mg.cls === 'fire') { const hold = Input.held(' ', 'Enter') || Input.mouse.down; if (hold) { mg.started = true; mg.holding = true; mg.fill += dt / 1.0; if (Math.floor(mg.fill * 12) !== Math.floor((mg.fill - dt) * 12)) SFX.play('flick', { v: .3 }); if (mg.fill > 1.08) { mg.res.push('MISS'); this.float(this.P, 'FIZZLE', '#a0a0a0', 18); finish(); } } else if (mg.holding) { const f = mg.fill; mg.res.push(f >= .8 && f <= .93 ? 'PERFECT' : f >= .6 ? 'GOOD' : 'MISS'); finish(); } else if (mg.t > 3.5) { mg.res.push('MISS'); finish(); } }
    else if (mg.cls === 'water') { if (press) { let best = null, bd = .25; for (const b of mg.beats) if (!b.g && Math.abs(mg.t - b.t) < bd) { bd = Math.abs(mg.t - b.t); best = b; } if (best) { best.g = grade(bd, .06, .14); SFX.play('splash', { v: .5 }); } else SFX.play('miss', { v: .4 }); } for (const b of mg.beats) if (!b.g && mg.t > b.t + .2) b.g = 'MISS'; if (mg.beats.every(b => b.g)) { const sc = mg.beats.reduce((a, b) => a + (b.g === 'PERFECT' ? 2 : b.g === 'GOOD' ? 1 : 0), 0) / mg.beats.length; mg.res.push(sc >= 1.6 ? 'PERFECT' : sc >= .8 ? 'GOOD' : 'MISS'); finish(); } }
    else if (mg.cls === 'light') { mg.r = 90 * Math.abs(Math.sin(Math.PI * mg.t / mg.cyc)); if (press) { mg.res.push(grade(Math.abs(mg.r - 60), 3.5, 10)); finish(); } else if (mg.t > mg.cyc * 2) { mg.res.push('MISS'); finish(); } }
  },
  flashGrade(r) { const [sx, sy] = [this.E.x, CGY - this.E.h - 16]; FloatText.add(sx, sy, r === 'MISS' ? 'MISTIMED' : r + '!', GRADE_COL[r], r === 'PERFECT' ? 30 : 22, { pop: 1.4, life: .9 }); if (r === 'PERFECT') { SFX.play('perfect'); this.addBrk(15); if (!CLASSES[S.cls].mana) this.mana = Math.min(Stats.maxMana(), this.mana + 2); } else if (r === 'GOOD') this.addBrk(6); },
  addBrk(n) { this.brk = clamp(this.brk + n, 0, 100); if (this.brk >= 100 && !this.brkReady) { this.brkReady = true; SFX.play('breakready'); Music.sting('breakready'); Toast.add('BREAK READY — press 5', COL.gold2, '★'); } },
  execOffense(kind, res) {
    this.phase = 'action'; const cls = S.cls, skill = kind === 'skill', P = this.P, E = this.E;
    const mult = skill ? { sword: 1.6, bow: .62, fire: 1.55, water: 1.35, light: 1.25 }[cls] : 1;
    let end = .8;
    if (cls === 'sword') { this.pose(P, 'windup'); this.mv(P, E.x - 34 - E.h * .12, .16, 0, Ease.inQ); SFX.play('whoosh'); this.at(.16, () => { this.pose(P, 'strike'); SFX.play('swing'); this.hitE(res[0], mult, { skill }); }); this.at(.42, () => this.mv(P, PX, .3, 8, Ease.outQ)); this.at(.72, () => this.pose(P, 'idle')); end = .9; }
    else if (cls === 'bow') { this.pose(P, 'draw'); res.forEach((r, i) => this.at(.2 + i * .2, () => { SFX.play('bowrel'); this.pose(P, 'release'); this.shoot('arrow', P.x + 16, CGY - 42, E.x, CGY - E.h * .55, .18, 4, () => this.hitE(r, mult, { skill })); if (i < res.length - 1) this.at(.08, () => this.pose(P, 'draw')); })); end = .2 + res.length * .2 + .45; this.at(end - .1, () => this.pose(P, 'idle')); }
    else if (cls === 'fire') { this.pose(P, 'cast'); SFX.play('firecast'); this.at(.2, () => this.shoot('fireball', P.x + 18, CGY - 46, E.x, CGY - E.h * .5, .35, 22, () => this.hitE(res[0], mult, { skill }), skill ? 2 : 1)); end = 1; this.at(.8, () => this.pose(P, 'idle')); }
    else if (cls === 'water') { this.pose(P, 'cast'); SFX.play('watercast'); this.at(.2, () => this.shoot('wave', P.x + 20, CGY, E.x, CGY, .45, 0, () => this.hitE(res[0], mult, { skill }), skill ? 2 : 1)); end = 1.1; this.at(.9, () => this.pose(P, 'idle')); }
    else if (cls === 'light') { this.pose(P, 'raise'); SFX.play('lightcast'); this.at(.3, () => this.shoot('beam', E.x, 0, E.x, CGY, .2, 0, () => this.hitE(res[0], mult, { skill }), skill ? 2 : 1)); end = 1.1; this.at(.9, () => this.pose(P, 'idle')); }
    this.at(end, () => this.afterPlayer());
  },
  shoot(type, x0, y0, x1, y1, dur, arc, onHit, size = 1, o = {}) { this.proj.push(Object.assign({ type, x0, y0, x1, y1, t0: this.ct, dur, arc, onHit, size, x: x0, y: y0 }, o)); },
  hitE(grade, mult, o = {}) {
    const E = this.E, cls = S.cls; if (this.over) return 0;
    let acc = Stats.acc() + (this.buff.blessing ? .1 : 0) - (this.field === 0 ? .05 : 0) - (grade === 'MISS' ? .35 : 0);
    let hit = grade === 'PERFECT' || o.counter || o.ult || chance(acc);
    if (E.dodge && !o.ult && !o.counter) { if (grade === 'PERFECT') this.float(E, 'READ IT!', '#f0d890', 16, -22); else if (grade === 'MISS' || chance(.5)) hit = false; }
    if (!hit) {
      this.pose(E, 'dodge'); this.mv(E, EX + 26, .12, 6); this.at(.25, () => this.mv(E, EX, .25)); SFX.play('miss'); this.float(E, 'MISS', '#c0c0c0', 22);
      if (this.field === 1 && chance(.4)) { this.at(.2, () => { this.addSt('P', 'bleed', 2); Toast.add('TANGLED ROOTS: a root snags you', COL.red, '♣'); }); }
      return 0;
    }
    const gm = { PERFECT: 1.5, GOOD: 1, MISS: .6 }[grade] || 1;
    let dmg = (Stats.atk() + (this.buff.inspired ? 2 : 0)) * mult * gm - E.df * .5;
    if (E.soakHits > 0) { dmg *= 1.25; E.soakHits--; }
    if (this.P.st.weak) dmg *= .7;
    let shielded = false; if (E.shield > 0 && !o.ult) { dmg *= .4; E.shield--; shielded = true; }
    dmg = Math.max(1, Math.round(dmg * rnd(.92, 1.08))); E.hp = Math.max(0, E.hp - dmg);
    // statuses
    const pb = grade === 'PERFECT' ? .25 : 0;
    if (!o.counter && !o.ult) {
      if (cls === 'sword') { if (chance((o.skill ? .6 : .25) + pb)) this.addSt('E', 'bleed', 3); if (chance((o.skill ? .4 : .1) + pb * .8)) { E.st.stagger = 1; this.float(E, 'STAGGER', '#e0c050', 16, -30); } }
      if (cls === 'bow' && chance((o.skill ? .45 : .2) + pb)) this.addSt('E', 'bleed', 3);
      if (cls === 'fire' && chance((o.skill ? .9 : .35) + pb)) this.addSt('E', 'burn', 3);
      if (cls === 'water' && chance((o.skill ? 1 : .4) + pb)) this.addSt('E', 'soak', 2);
      if (cls === 'light') { const h = Math.round(dmg * (o.skill ? .35 : .15)); if (h > 0) this.at(.15, () => { const hh = heal(h); if (hh) { this.float(this.P, '+' + hh, COL.green, 18); SFX.play('heal', { v: .5 }); } }); if (o.skill) this.addSt('P', 'blessed', 3); }
    }
    // feedback
    const big = dmg / E.maxHp; E.flash = .09; this.pose(E, 'hurt'); E.kb = 6 + mult * 4 + (grade === 'PERFECT' ? 6 : 0);
    TimeFX.hit(.045 + (grade === 'PERFECT' ? .05 : 0) + Math.min(.12, big * .4)); Cam.shake(.18 + big * 1.2 + (grade === 'PERFECT' ? .15 : 0)); Cam.recoil(-3, 0); if (grade === 'PERFECT') Cam.punchZoom(.04);
    const hx = E.x - 6, hy = CGY - E.h * .5, pc = { sword: '#ffffff', bow: '#e0d0b0', fire: '#ff8030', water: '#80c8ff', light: '#fff0a0' }[cls];
    Particles.burst(hx, hy, 10 + Math.round(big * 40), { c: pc, c2: STYLE[this.def.style] ? STYLE[this.def.style].col : '#fff', type: 'spark', smin: 60, smax: 200, lmin: .15, lmax: .4, ang: 0, spread: 1.2 });
    Particles.spawn({ x: hx, y: hy, life: .25, c: pc, type: 'ring', size: 3 });
    if (cls === 'fire') Particles.burst(hx, hy, 12, { c: '#ffb040', c2: '#401008', type: 'smoke', size: 4, smin: 10, smax: 50, lmin: .4, lmax: .8 });
    if (cls === 'water') Particles.burst(hx, CGY - 4, 20, { c: '#a0d8ff', type: 'drop', g: 300, smin: 40, smax: 120, ang: -Math.PI / 2, spread: 1, ground: CGY + 4 });
    SFX.play({ sword: 'slash', bow: 'arrowhit', fire: 'firehit', water: 'waterhit', light: 'lighthit' }[cls]); SFX.play('ehurt', { v: .6 }); if (chance(.35)) SFX.play(this.def.voice, { v: .5 }); if (shielded) { SFX.play('block'); this.float(E, 'SHIELD', '#6aa8e0', 14, -26); }
    FloatText.add(hx + rnd(-6, 6), hy - 10, String(dmg), grade === 'PERFECT' ? '#f0d890' : '#ffffff', 22 + Math.min(20, big * 60), { pop: grade === 'PERFECT' ? 1.6 : 1.2 });
    return dmg;
  },
  float(ent, text, col, size = 18, dy = 0) { FloatText.add(ent.x + rnd(-4, 4), CGY - (ent === this.E ? this.E.h : 70) - 8 + dy, text, col, size); },
  // ---------- enemy attack with active defense ----------
  enemyAttack(o) {
    const E = this.E, P = this.P, st = STYLE[this.def.style] || STYLE.lunge; let kind = st.k;
    if (kind === 'royal') kind = chance(.5) || o.big ? 'dash' : 'ranged';
    this.pose(E, 'windup'); SFX.play(st.wv || this.def.voice, { v: .8 }); if (o.big) { SFX.play('charge'); Cam.tz = 1.08; }
    this.say(o.big ? `${E.name} unleashes the BIG BUMMER!` : this.intentLine);
    const wind = o.wind * (E.phase2 ? .9 : 1);
    const travel = kind === 'arc' ? .3 : kind === 'ranged' ? .35 : (st.dd || .16) + (st.back ? .1 : 0);
    let t = wind;
    for (let h = 0; h < o.hits; h++) {
      const hitStart = t, resolve = t + travel, impact = resolve - .06;
      const impactAbs = this.ct + impact; this.at(Math.max(0, impact - .75), () => { this.cue = { t0: this.ct, impact: impactAbs, pressed: null, early: false }; });
      this.at(hitStart, () => {
        this.pose(E, 'strike');
        if (kind === 'dash') { if (st.back) { this.mv(E, E.x + 20, .1); this.at(.1, () => this.mv(E, P.x + 30 + E.h * .15, travel - .1, 0, Ease.inQ)); } else this.mv(E, P.x + 30 + E.h * .15, travel, st.glide ? 0 : 3, Ease.inQ); SFX.play('whoosh', { v: .6 }); }
        else if (kind === 'arc') { this.mv(E, P.x + 30 + E.h * .15, travel, st.arc, Ease.lin); SFX.play('whoosh', { v: .5 }); }
        else { SFX.play(st.cast || 'whoosh'); this.shoot(this.def.style === 'royal' ? 'flame' : st.proj, E.x - 14, CGY - E.h * .6, P.x + 6, CGY - 36, travel, st.proj === 'rock' || st.proj === 'orb' ? 26 : 0, null, o.big ? 2 : 1, { enemy: true }); }
      });
      this.at(resolve, () => this.resolveDefense(o, st, h));
      if (kind !== 'ranged') this.at(resolve + .12, () => this.mv(E, h < o.hits - 1 ? E.x + 40 : EX, h < o.hits - 1 ? .15 : .35, h < o.hits - 1 ? 6 : 10, Ease.outQ));
      if (h < o.hits - 1) { this.at(resolve + .2, () => this.pose(E, 'windup')); t = resolve + .32; } else t = resolve;
    }
    this.at(t + .5, () => { if (this.over) return; Cam.tz = 1; this.pose(E, 'idle'); this.pose(P, P.guard ? 'guard' : 'idle'); if (o.after) o.after(); this.endEnemyTurn(o.after ? .7 : .3); });
  },
  resolveDefense(o, st, h) {
    if (this.over) return; const P = this.P, E = this.E, cue = this.cue; this.cue = null; const cls = S.cls;
    if (E.smoked) { E.smoked = false; this.float(P, 'LOST IN SMOKE', '#c8c8d0', 18); SFX.play('miss'); return; }
    const d = cue && cue.pressed !== null && !cue.early ? cue.pressed - cue.impact : 99, guard = P.guard;
    let res = Math.abs(d) <= (guard ? .1 : .07) ? 'PERFECT' : d >= (guard ? -.3 : -.22) && d <= .06 ? 'BLOCK' : 'FAILED';
    if (P.evade && res !== 'PERFECT' && chance(.55)) res = 'EVADED';
    let base = Math.max(1, E.atk * 1.15 * o.mult - Stats.def() * .6); if (E.st.weak) base *= .7; if (E.st.soak) base *= .75; if (E.enrage) base *= 1.25; if (this.def.trait === 'BERSERK' && E.hp < E.maxHp / 2) base *= 1.3;
    const f = res === 'FAILED' ? (guard ? .6 : 1) : res === 'BLOCK' ? (guard ? .3 : .5) : 0; const dmg = f ? Math.max(1, Math.round(base * f * rnd(.92, 1.08))) : 0;
    const cx = P.x + 10, cy = CGY - 36;
    if (res === 'PERFECT') {
      this.addBrk(12); SFX.play('perfect'); TimeFX.hit(.08); Cam.punchZoom(.05);
      if (cls === 'sword') { SFX.play('parry'); this.float(P, 'PARRY!', '#f0d890', 26); Particles.burst(cx + 8, cy, 24, { c: '#fff4c0', type: 'spark', smin: 80, smax: 240, lmin: .1, lmax: .35 }); this.pose(P, 'strike'); this.at(.12, () => { const c = this.hitE('GOOD', guard ? 1 : .6, { counter: true }); this.float(this.E, 'COUNTER', '#f0d890', 16, -28); if (this.E.hp <= 0) { this.q = []; this.at(.3, () => this.win()); } }); }
      else if (cls === 'bow') { SFX.play('dodge'); this.float(P, 'DODGE!', '#bfe0ff', 26); this.mv(P, PX - 30, .12, 14); this.at(.3, () => this.mv(P, PX, .25)); if (guard) this.at(.2, () => this.shoot('arrow', P.x + 16, CGY - 42, this.E.x, CGY - this.E.h * .55, .15, 2, () => { this.hitE('GOOD', .5, { counter: true }); if (this.E.hp <= 0) { this.q = []; this.at(.3, () => this.win()); } })); }
      else { SFX.play('shield'); this.float(P, 'BARRIER!', '#bfe0ff', 26); P.barrier = .5; if (cls === 'fire') this.addSt('E', 'burn', 2); if (cls === 'water') this.addSt('E', 'soak', 2); if (cls === 'light') { const hh = heal(4); if (hh) this.float(P, '+' + hh, COL.green, 16, -20); } }
      return;
    }
    if (res === 'EVADED') { SFX.play('dodge'); this.float(P, 'EVADED', '#bfe0ff', 22); this.mv(P, PX - 22, .1, 10); this.at(.3, () => this.mv(P, PX, .25)); return; }
    S.hp = Math.max(0, S.hp - dmg); P.flash = .1; this.pose(P, 'hurt'); P.kb = -(6 + dmg / Stats.maxHP() * 40);
    const k = dmg / Stats.maxHP(); TimeFX.hit(.05 + Math.min(.14, k * .5)); Cam.shake(.25 + k * 2 + (st.big ? .2 : 0)); Cam.recoil(4, 0); if (k > .15) Post.doFlash(.25, '#a01020');
    SFX.play(st.hit || 'punch'); SFX.play(res === 'BLOCK' ? 'block' : 'hurt');
    Particles.burst(cx, cy, res === 'BLOCK' ? 12 : 18, { c: res === 'BLOCK' ? '#e0e0f0' : '#e04040', type: 'spark', smin: 50, smax: 180, lmin: .15, lmax: .4, ang: Math.PI, spread: 1.1 });
    if (st.multi) for (let i = 0; i < st.multi; i++) this.at(i * .05, () => Particles.spawn({ x: cx + rnd(-8, 8), y: cy + rnd(-10, 10), vx: -160, vy: 120, life: .15, c: '#ffffff', type: 'streak' }));
    FloatText.add(cx, cy - 20, (res === 'BLOCK' ? 'BLOCK  -' : '-') + dmg, res === 'BLOCK' ? '#bfd0e0' : '#ff6a5a', 22 + Math.min(18, k * 60), { pop: 1.3 });
    this.addBrk(k * 70);
    if (o.status && (res === 'FAILED' || chance(.4))) this.addSt('P', o.status, o.status === 'weak' ? 2 : 3);
    if (S.hp <= 0) { this.q = []; this.at(.1, () => this.lose()); }
  },
  // ---------- BREAK ultimate ----------
  ultimate() {
    this.phase = 'ult'; this.itemMenu = false; this.brk = 0; this.brkReady = false; const cls = S.cls, P = this.P, E = this.E;
    this.ult = { t0: this.ct, name: CLASSES[cls].ult }; SFX.play('ultimate'); Audio.duckMusic(.35, 3); Tweens.to(Post, { letter: 1 }, .3); Tweens.to(this, { dark: .75 }, .4); Cam.tx = PX + 20; Cam.ty = 170; Cam.tz = 1.35; TimeFX.slowmo(.4, .5); this.pose(P, cls === 'sword' ? 'windup' : cls === 'bow' ? 'draw' : 'raise');
    for (let i = 0; i < 40; i++) this.at(i * .02, () => Particles.spawn({ x: P.x + rnd(-30, 30), y: CGY - rnd(0, 80), vx: 0, vy: -rnd(20, 60), life: .7, c: { sword: '#fff4c0', bow: '#e0ffd0', fire: '#b060ff', water: '#80d0ff', light: '#fff0a0' }[cls], type: 'star', size: 2, glow: 1 }));
    this.at(.8, () => { Cam.tx = 320; Cam.ty = 180; Cam.tz = 1.1; });
    const fin = (n) => { const d = this.hitE('PERFECT', 4.2 / n, { ult: true }); return d; };
    if (cls === 'sword') { this.at(.9, () => { this.mv(P, E.x + 40, .15, 0, Ease.inQ); SFX.play('whoosh'); }); for (let i = 0; i < 5; i++) this.at(1.05 + i * .14, () => { SFX.play('slash'); this.pose(P, 'strike'); Particles.spawn({ x: E.x, y: CGY - E.h / 2, life: .2, c: '#fff', type: 'ring', size: 5 }); for (let k = 0; k < 6; k++) Particles.spawn({ x: E.x + rnd(-30, 30), y: CGY - E.h / 2 + rnd(-30, 30), vx: rnd(-300, 300), vy: rnd(-200, 200), life: .2, c: '#fff4c0', type: 'streak' }); fin(5); }); this.at(1.9, () => { this.mv(P, PX, .3, 10); this.addSt('E', 'bleed', 3); E.st.stagger = 1; }); }
    if (cls === 'bow') for (let i = 0; i < 14; i++) this.at(.9 + i * .07, () => { SFX.play('bowrel', { v: .5 }); this.shoot('arrow', E.x + rnd(-70, 20), -10, E.x + rnd(-18, 18), CGY - rnd(0, E.h), .2, 0, () => { if (i % 2 === 0) fin(7); if (i === 13) this.addSt('E', 'bleed', 3); }); });
    if (cls === 'fire') { this.at(.9, () => SFX.play('firecast')); for (let i = 0; i < 4; i++) this.at(1.1 + i * .2, () => { SFX.play('boom'); Cam.shake(.6); fin(4); for (let k = 0; k < 20; k++) Particles.spawn({ x: E.x + rnd(-24, 24), y: CGY, vx: rnd(-20, 20), vy: -rnd(80, 220), life: rnd(.5, 1), c: '#d080ff', c2: '#301040', size: rndi(2, 4), glow: 1 }); }); this.at(1.9, () => this.addSt('E', 'burn', 3)); }
    if (cls === 'water') { this.at(.9, () => { SFX.play('watercast'); this.shoot('wave', -40, CGY, 700, CGY, 1, 0, null, 4); }); for (let i = 0; i < 3; i++) this.at(1.35 + i * .15, () => { SFX.play('splash'); fin(3); }); this.at(1.9, () => this.addSt('E', 'soak', 3)); }
    if (cls === 'light') { this.at(.9, () => this.shoot('beam', E.x, 0, E.x, CGY, 1, 0, null, 4)); for (let i = 0; i < 3; i++) this.at(1.2 + i * .2, () => { SFX.play('lighthit'); fin(3); }); this.at(1.9, () => { this.addSt('P', 'blessed', 3); const hh = heal(Math.round(Stats.maxHP() * .3)); this.float(P, '+' + hh, COL.green, 24); }); }
    this.at(2.2, () => { Post.doFlash(.9, '#fff'); Cam.shake(1); TimeFX.hit(.2); SFX.play('boom'); });
    this.at(2.7, () => { Tweens.to(Post, { letter: 0 }, .4); Tweens.to(this, { dark: 0 }, .4); Cam.tz = 1; this.ult = null; this.pose(P, 'idle'); this.afterPlayer(); });
  }
});
