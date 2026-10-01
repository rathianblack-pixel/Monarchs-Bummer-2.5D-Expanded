'use strict';
/* =========================================================
   COMBAT — update loop, rendering, UI
   ========================================================= */
Object.assign(Scenes.combat, {
  update(dt) {
    const sdt = SDT; this.ct += sdt;
    if (this.death) this.death.update(sdt);
    if (this.q.length) { const now = this.ct, due = this.q.filter(e => e.t <= now); if (due.length) { const rest = this.q.filter(e => e.t > now); this.q = rest; due.sort((a, b) => a.t - b.t); for (const e of due) { if (this.q !== rest) break; e.fn(); } } }
    for (const e of [this.P, this.E]) {
      if (e.m) { const k = clamp((this.ct - e.m.t0) / e.m.dur, 0, 1); e.x = lerp(e.m.x0, e.m.x1, e.m.ease(k)); e.jy = -Math.sin(k * Math.PI) * e.m.arc; if (k >= 1) { e.m = null; e.jy = 0; } }
      else if (e.my) { const k = clamp((this.ct - e.my.t0) / e.my.dur, 0, 1); e.jy = lerp(e.my.y0, e.my.y1, Ease.inQ(k)); if (k >= 1) e.my = null; }
      e.kb *= Math.pow(.0005, sdt); e.flash = Math.max(0, e.flash - sdt); if (e.barrier) e.barrier = Math.max(0, e.barrier - sdt);
    }
    this.E.ghost += (this.E.hp - this.E.ghost) * Math.min(1, dt * 3); this.pGhost += (S.hp - this.pGhost) * Math.min(1, dt * 3);
    if (this.mg) this.updateMG(dt);
    if (this.cue && this.cue.pressed === null && (Input.hit(' ', 'Enter') || Input.mouse.clicked) && !Overlays.stack.length) {
      Input.consume(' ', 'Enter'); this.cue.pressed = this.ct; if (this.ct < this.cue.impact - .3) { this.cue.early = true; this.float(this.P, 'TOO EARLY', '#c0a0a0', 16); SFX.play('miss', { v: .5 }); } else { SFX.play('flick'); this.P.brace = .25; }
    }
    if (this.P.brace) this.P.brace = Math.max(0, this.P.brace - dt);
    for (let i = this.proj.length - 1; i >= 0; i--) {
      const p = this.proj[i], k = clamp((this.ct - p.t0) / p.dur, 0, 1); p.px = p.x; p.py = p.y; p.x = lerp(p.x0, p.x1, k); p.y = lerp(p.y0, p.y1, k) - Math.sin(k * Math.PI) * p.arc; p.k = k;
      if (p.type === 'fireball' && chance(.8)) Particles.spawn({ x: p.x, y: p.y, vx: rnd(-10, 10), vy: rnd(-20, 0), life: .3, c: '#ffb040', c2: '#601008', size: 1 + p.size, glow: 1 });
      if (p.type === 'flame' || p.type === 'orb') if (chance(.7)) Particles.spawn({ x: p.x, y: p.y, vx: rnd(-10, 10), vy: rnd(-10, 10), life: .3, c: '#c070ff', c2: '#301040', size: 1, glow: 1 });
      if (p.type === 'wave' && chance(.9)) Particles.spawn({ x: p.x + rnd(-6, 6), y: CGY - rnd(0, 10 * p.size), vx: rnd(-20, 30), vy: -rnd(20, 60), g: 200, life: .5, c: '#bfe8ff', type: 'drop', ground: CGY + 4 });
      if (k >= 1) { this.proj.splice(i, 1); if (p.onHit) p.onHit(); if (p.enemy) Particles.burst(p.x, p.y, 12, { c: STYLE[this.def.style] ? STYLE[this.def.style].col : '#fff', type: 'spark', smin: 40, smax: 140, lmin: .1, lmax: .3 }); }
    }
    if (this.bubble) { this.bubble.t += dt; if (this.bubble.t > 2.6) this.bubble = null; }
    if (this.titleCard) this.titleCard += dt; this.logT += dt; this.bolt = Math.max(0, this.bolt - dt * 2);
    if (this.area === 4 && !this.raid && chance(dt * .12)) { this.bolt = 1; SFX.play('thunder', { v: .4 }); }
    // adaptive music
    const low = S.hp / Stats.maxHP() < .3 && !this.over ? 1 : 0, pulse = this.E.hp / this.E.maxHp < .5 || this.turn > 6 ? 1 : 0;
    if (low !== this.layers.low) { this.layers.low = low; Music.setLayer('low', low); } if (pulse !== this.layers.pulse) { this.layers.pulse = pulse; Music.setLayer('pulse', pulse); }
    Cam.update && 0;
  },
  // ---------- rendering ----------
  drawP() {
    const P = this.P, pt = this.ct - P.poseT, cls = S.cls, o = playerLook({ s: 1.7, face: 1, t: T, low: S.hp / Stats.maxHP() < .3 });
    if (P.m && this.phase === 'intro') o.walk = this.ct * 10;
    const mgOn = !!this.mg;
    switch (P.pose) {
      case 'windup': { const k = Ease.outQ(clamp(pt / .16, 0, 1)); o.armF = lerp(1.2, 2.7, k) + (k >= 1 ? .08 : 0); o.crouch = 2 * k; o.lean = -1.4 * k; o.sq = 1 - .07 * k; o.expr = 'angry'; } if (mgOn) o.armF += Math.sin(T * 40) * .03; break;
      case 'strike': { const k = Ease.outQ(clamp(pt / .1, 0, 1)), f = clamp((pt - .1) / .28, 0, 1); o.armF = lerp(2.7, .2, k) + Math.sin(f * Math.PI) * -.15 + f * .3; o.lean = 2 + Math.sin(clamp(pt / .3, 0, 1) * Math.PI) * 1.2; o.sq = pt < .06 ? 1.07 : 1 - Math.sin(f * Math.PI) * .04; o.expr = 'angry'; break; }
      case 'draw': o.armF = 1.57; o.armB = 1.3; o.draw = mgOn ? 1 : clamp(pt / .2, 0, 1); o.nocked = true; o.expr = 'annoyed'; break;
      case 'release': { const f = clamp(pt / .3, 0, 1); o.armF = 1.57 + Math.sin(f * Math.PI) * .12; o.armB = 1.2 - (1 - f) * .3; o.draw = 0; o.lean = -1 - (1 - f) * 1.2; o.sq = 1 - (1 - f) * .04; break; }
      case 'cast': o.armF = 2.2 + (mgOn && this.mg.fill ? Math.sin(T * 50) * this.mg.fill * .06 : 0); o.lean = 1; o.expr = 'angry'; break;
      case 'raise': { const k = Ease.outQ(clamp(pt / .18, 0, 1)); o.armF = lerp(1.6, 3.0, k) + (1 - k) * 0 + Math.sin(clamp(pt / .4, 0, 1) * Math.PI) * .1; o.sq = 1 + Math.sin(k * Math.PI) * .05; o.expr = 'surprise'; break; }
      case 'guard': if (cls === 'bow') { o.crouch = 2; o.lean = -1; } else { o.armF = 1.9; o.crouch = 1; if (cls === 'sword') o.wAng = .1; } break;
      case 'hurt': if (pt < .35) { o.expr = 'hurt'; o.lean = -2; o.rot = -.08 * (1 - pt / .35); o.sq = pt < .08 ? .92 : 1 + Math.sin(clamp((pt - .08) / .27, 0, 1) * Math.PI) * .04; } break;
      case 'eat': o.armF = 2.7; o.expr = 'happy'; break;
      case 'dead': o.rot = -Math.min(1.5, pt * 3); o.expr = 'hurt'; o.armF = .6; break;
      case 'victory': { o.armF = 3.0; o.expr = 'happy'; const j = Math.sin(pt * 7); P.jy = pt < 1.2 ? -Math.abs(j) * 5 : 0; if (pt < 1.3 && Math.abs(j) < .25) o.sq = .93; else if (pt < 1.2) o.sq = 1.04; break; }
    }
    if (this.cue && P.pose === 'idle') { o.crouch = 1; o.expr = 'annoyed'; }
    if (P.brace > 0) { o.crouch = 2; o.armF = 1.8; }
    if (P.flash > 0) PAINT = '#ffffff'; drawChar(P.x + P.kb, CGY + P.jy, o); PAINT = null;
    if (P.pose === 'strike' && pt < .14 && cls === 'sword') { ctx.globalAlpha = 1 - pt / .14; for (let i = 0; i < 9; i++) { const a = -1.2 + i * .3; P2('#ffffff', P.x + 14 + Math.cos(a) * 26, CGY - 40 + Math.sin(a) * 26, 2, 2); } ctx.globalAlpha = 1; }
    if (P.barrier > 0 || (P.guard && cls !== 'bow' && cls !== 'sword')) { ctx.globalAlpha = P.barrier > 0 ? P.barrier * 1.4 : .3 + Math.sin(T * 4) * .08; ctx.strokeStyle = '#bfe0ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(Math.round(P.x + 4), CGY - 38, 26, 44, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    if ((P.pose === 'cast' || P.pose === 'raise') && chance(.5)) Particles.spawn({ x: P.x + 18 + rnd(-3, 3), y: CGY - (P.pose === 'raise' ? 72 : 60) + rnd(-3, 3), vx: rnd(-10, 10), vy: -rnd(5, 25), life: .5, c: { fire: '#ffa040', water: '#80d0ff', light: '#fff0a0' }[cls] || '#fff', size: 1, glow: 1 });
  },
  drawE() {
    const E = this.E, d = this.def, pt = this.ct - E.poseT, human = d.arch === 'human', st = { t: T, sMul: 1.7, face: -1, low: E.hp / E.maxHp < .3, phase2: E.phase2, flash: E.flash > 0, talking: E.talking || (this.bubble && this.bubble.t < 2) };
    if (E.pose === 'dead' && this.death) { this.death.drawBody(); return; }
    let x = E.x + E.kb, y = CGY + E.jy;
    if ((E.m && E.pose !== 'strike') || (this.phase === 'intro' && E.m)) st.walk = this.ct * 12;
    switch (E.pose) {
      case 'windup': st.crouch = 1; st.lean = -1; st.atk = .2; if (human) { st.armF = d.style === 'arrow' ? 1.57 : d.style === 'spell' ? 2.5 : 2.9; if (d.style === 'arrow') st.draw = clamp(pt / .4, 0, 1); } x += Math.sin(T * 50) * (pt > .3 ? .8 : 0); st.expr = 'angry'; break;
      case 'strike': st.atk = 1; st.lean = 2; if (human) { st.armF = d.style === 'arrow' ? 1.57 : lerp(2.9, .5, Ease.outQ(clamp(pt / .12, 0, 1))); st.draw = 0; } st.expr = 'angry'; break;
      case 'hurt': if (pt < .28) { st.rot = .12; st.expr = 'hurt'; } break;
      case 'dodge': st.lean = -2; break;
      case 'guard': st.crouch = 1; break;
      case 'charge': x += Math.sin(T * 60) * 1; st.crouch = 1; st.atk = .5; break;
      case 'dead': st.alpha = 1 - clamp((pt - .5) / .9, 0, 1); st.rot = Math.min(1.2, pt * 2); st.sq = 1 - Math.min(.25, pt * .4); st.expr = 'hurt'; break;
    }
    if (E.dodge && E.pose !== 'dead') { const a = Object.assign({}, st, { alpha: .25, flash: false }); drawMonster(d, x + 10, y, a); }
    if (E.unleash && E.pose !== 'dead') { ctx.globalAlpha = .25 + Math.sin(T * 10) * .15; pEll('#f04020', x, CGY - E.h / 2, E.h * .45, E.h * .6); ctx.globalAlpha = 1; }
    if (E.alpha === 0) return;
    drawMonster(d, x, y, st);
    if (E.shield > 0 && E.pose !== 'dead') { ctx.globalAlpha = .35 + Math.sin(T * 3) * .1; ctx.strokeStyle = '#8ac8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(Math.round(x), CGY - E.h / 2, E.h * .4 + 8, E.h * .55 + 6, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  },
  drawProj() {
    for (const p of this.proj) {
      const s = p.size;
      if (p.type === 'arrow') { const a = Math.atan2(p.y - (p.py || p.y0), p.x - (p.px || p.x0)), dx = Math.cos(a), dy = Math.sin(a); pLine('#6a4a2a', p.x - dx * 10, p.y - dy * 10, p.x, p.y, 1); P('#e0e0e8', p.x - 1, p.y - 1, 2, 2); P('#e04040', p.x - dx * 10 - 1, p.y - dy * 10 - 1, 2, 2); }
      else if (p.type === 'fireball') { pCirc('#8a2a08', p.x, p.y, 5 * s); pCirc('#f06020', p.x, p.y, 4 * s); pCirc('#ffd040', p.x, p.y, 2.4 * s); P('#fff4c0', p.x - 1, p.y - 1, 2, 2); }
      else if (p.type === 'orb') { pCirc('#3a1060', p.x, p.y, 5 * s); pCirc('#a060ff', p.x, p.y, 4 * s); pCirc('#e0c0ff', p.x - 1, p.y - 1, 1.5 * s); }
      else if (p.type === 'flame') { flame(p.x, p.y + 4, T, 1.4 * s, ['#6a20c0', '#b060ff', '#f0d0ff']); }
      else if (p.type === 'spark') { const r = 3 + Math.sin(T * 30) * 1.5; P('#e0ffc0', p.x - r, p.y, r * 2 + 1, 1); P('#e0ffc0', p.x, p.y - r, 1, r * 2 + 1); pCirc('#ffffff', p.x, p.y, 1.5); }
      else if (p.type === 'rock') { pEll('#3a3028', p.x, p.y, 5, 4); pEll('#8a7a68', p.x - 1, p.y - 1, 4, 3); P('#b0a090', p.x - 2, p.y - 2, 2, 1); }
      else if (p.type === 'wave') { const h = 12 * s; for (let i = 0; i < 24 * s; i++) { const xx = p.x - i, hh = h * Math.sin((i / (24 * s)) * Math.PI) * (1 - i / (40 * s)); P('#2a6aa8', xx, CGY - hh, 1, hh); P('#8ad0ff', xx, CGY - hh, 1, 2); } P('#ffffff', p.x - 6 * s, CGY - h, 3, 1); }
      else if (p.type === 'beam') { const w = 6 * s * (1 - Math.abs(p.k - .5)), a = .9; ctx.globalAlpha = a * .4; P('#fff8c0', p.x - w * 2, 0, w * 4, CGY); ctx.globalAlpha = a; P('#fff8d0', p.x - w / 2, 0, w, CGY); P('#ffffff', p.x - w / 4, 0, Math.max(1, w / 2), CGY); ctx.globalAlpha = 1; pEll('#fff8c0', p.x, CGY, w * 3, 3); }
    }
  },
  draw() {
    const c = ctx, t = T, hd = HD.live; let L = null;
    if (hd) {
      const pal = a3def(this.area, this.raid).pal;
      HD.begin({ pitch: 13, fov: 38, zs: 1, tx: Cam.x - Cam.rx + Cam.sx, ty: CGY, th: CGY - Cam.y + Cam.ry - Cam.sy, zoom: Cam.zoom + Cam.punch, yaw: Math.sin(T * .12) * 2.5 + (Cam.x - 320) * .02, planeY: CGY, maxBack: 1200,
        lightRect: [-700, CGY - 1200, 2040, 1460], fog: [900, 2600, .4], fogC: pal.fog, clear: pal.clear, dof: [.3, .2, .87, .95], bloom: [.66, .5], vig: .55,
        shafts: combatShafts(this.area, this.raid), motes: combatMotes(this.area, this.raid) });
      combatShimmer(this);
      drawArena3D(this.area, this.raid, t, { dark: this.dark, wallShift: this.wallShift, bolt: this.bolt }, false);
      L = HD.layer('plane', { ox: -160, oy: -80, w: 960, h: 440, q: HD.Q }); HD.planeL = L; Cam.apply(ctx, 1);
    } else {
      c.setTransform(1, 0, 0, 1, 0, 0); P('#000', 0, 0, 640, 360);
      c.setTransform(1, 0, 0, 1, 0, 0);
      drawCombatBG(this.area, this.raid, t, { wallShift: this.wallShift, bolt: this.bolt });
      if (this.dark > .01) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = this.dark; P('#08040e', 0, 0, 640, 360); c.globalAlpha = 1; }
      Cam.apply(c, 1);
    }
    const ca = Cam.x;
    if (this.death) this.death.drawGround();
    const eFront = this.E.pose === 'strike';
    if (!eFront) this.drawE(); this.drawP(); if (eFront) this.drawE();
    this.drawProj(); if (this.death) this.death.drawFront(); Particles.draw(false); if (!hd) drawCombatFG(this.area, this.raid, t);
    if (hd) combatLights3D(this.area, this.raid, t, { dark: this.dark, bolt: this.bolt }); else combatLights(this.area, this.raid, t, { dark: this.dark, bolt: this.bolt });
    Light.add(this.P.x, CGY - 40, 110, '#fff0e0', .45); Light.add(this.E.x, CGY - this.E.h / 2, 90 + this.E.h, '#fff0e0', .35);
    for (const p of this.proj) Light.add(p.x, p.y, p.type === 'beam' ? 120 : 50, { fireball: '#ff9030', orb: '#a060ff', flame: '#b060ff', beam: '#fff0a0', wave: '#80c0ff', spark: '#c0ffa0' }[p.type] || '#ffffff', .8, 0, .5);
    if (this.P.pose === 'cast' || this.P.pose === 'raise') Light.add(this.P.x + 18, CGY - 64, 60, { fire: '#ff9030', water: '#60b0ff', light: '#fff0a0' }[S.cls] || '#ffffff', .7, .2);
    Light.apply();
    if (hd) {
      Cam.apply(ctx, 1); Particles.draw(true);
      HD.plane(L.c, L.ox, L.oy, CGY, { w: L.w, h: L.h, q: L.q, plane: true, lit: true }); HD.shadow(this.P.x, CGY + 2, 15); if (this.E.pose !== 'dead') HD.shadow(this.E.x, CGY + 2, Math.min(40, 12 + this.E.h * .15)); HD.planeL = null;
      drawArena3D(this.area, this.raid, t, { dark: this.dark, wallShift: this.wallShift, bolt: this.bolt }, true);
      HD.screenLayer(); if (this.dark > .01) { ctx.globalAlpha = this.dark * .25; P('#08040e', 0, 0, 640, 360); ctx.globalAlpha = 1; }
      if ((this.area === 0 || this.raid) && World.rain > .05) Weather.draw(CGY + 60, World.rain * .7);
      return;
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    if ((this.area === 0 || this.raid) && World.rain > .05) Weather.draw(CGY + 60, World.rain * .7);
    if (this.area === 2 && !this.raid) Weather.fog(.8, '#b0b8d0', ca);
    if (this.area === 1 && !this.raid) Weather.fog(.3, '#a0c0a0', ca);
    Cam.apply(c, 1); Particles.draw(true); c.setTransform(1, 0, 0, 1, 0, 0);
  },
  // ---------- UI ----------
  sc(x, y) { const [a, b] = Cam.toScreen(x, y); return [a * 2, b * 2]; },
  ui() {
    const E = this.E, d = this.def, hpk = S.hp / Stats.maxHP();
    if (hpk < .3 && !this.over) { const a = .25 + Math.sin(T * 5) * .12; const gr = g.createRadialGradient(640, 360, 280, 640, 360, 760); gr.addColorStop(0, 'rgba(120,0,10,0)'); gr.addColorStop(1, `rgba(150,0,16,${a})`); g.fillStyle = gr; g.fillRect(0, 0, 1280, 720); }
    if (this.titleCard) { this.drawTitleCard(); return; }
    if (this.phase === 'intro') return;
    // player panel
    UI.panel(14, 12, 390, 104);
    UI.text(`${S.name}`, 32, 40, { size: 18, col: COL.gold2, maxW: 220 }); UI.text(`${CLASSES[S.cls].name} · Lv ${S.level}`, 386, 40, { size: 13, col: COL.dim, align: 'right', bold: false, maxW: 120 });
    UI.bar(32, 52, 354, 14, hpk, hpk < .3 ? COL.red : COL.green, { ghost: this.pGhost / Stats.maxHP() }); UI.text(`${Math.ceil(S.hp)} / ${Stats.maxHP()}`, 380, 64, { size: 12, align: 'right', shadow: false, col: '#fff' });
    UI.bar(32, 74, 220, 7, this.mana / Stats.maxMana(), COL.blue); UI.text(`${Stats.manaName()} ${this.mana}/${Stats.maxMana()}`, 262, 82, { size: 11, col: COL.dim, bold: false });
    let sx = 32; for (const k in this.P.st) sx += UI.pill(`${ST_INFO[k][0]} ${this.P.st[k]}`, sx, 88, ST_INFO[k][1], { size: 11 }) + 4; if (this.P.guard) UI.pill(S.cls === 'bow' ? 'EVADING' : 'GUARDING', sx, 88, '#bfe0ff', { size: 11 });
    // enemy panel
    UI.panel(876, 12, 390, 104);
    UI.text(E.name, 894, 40, { size: 18, col: this.boss ? '#ff9a8a' : COL.gold2, maxW: 270 }); UI.text(this.boss ? 'BOSS' : this.raid ? 'RAIDER' : `Lv ${this.lvl + 1}`, 1248, 40, { size: 12, col: COL.dim, align: 'right' });
    UI.bar(894, 52, 354, 14, E.hp / E.maxHp, this.boss ? '#c83a4a' : '#d8574a', { ghost: E.ghost / E.maxHp }); UI.text(`${Math.ceil(E.hp)} / ${E.maxHp}`, 1242, 64, { size: 12, align: 'right', shadow: false, col: '#fff' });
    let ex = 894; ex += UI.pill(d.trait, ex, 74, COL.purple, { size: 11 }) + 4; if (E.shield) ex += UI.pill('SHIELD ' + E.shield, ex, 74, COL.blue, { size: 11 }) + 4; if (E.dodge) ex += UI.pill('EVASIVE', ex, 74, '#bfe0ff', { size: 11 }) + 4; if (E.enrage) ex += UI.pill('ENRAGED', ex, 74, COL.red, { size: 11 }) + 4; for (const k in E.st) ex += UI.pill(`${ST_INFO[k][0]}${k === 'stagger' ? '' : ' ' + E.st[k]}`, ex, 74, ST_INFO[k][1], { size: 11 }) + 4;
    if (E.intent && !this.over && this.phase !== 'intro') { const ik = E.intent === 'UNLEASH' ? 'CHARGE' : E.intent, col = E.intent === 'UNLEASH' ? COL.red : E.intent === 'HEAL' || E.intent === 'SHIELD' ? COL.blue : COL.gold2; g.fillStyle = 'rgba(16,12,20,.85)'; g.fillRect(876, 122, 390, 34); g.strokeStyle = col; g.strokeRect(876.5, 122.5, 389, 33); UI.text(INTENT_ICON[ik] || '!', 898, 146, { size: 20, col, align: 'center' }); UI.text('INTENT: ' + this.intentLabel(), 916, 144, { size: 14, col, maxW: 336 }); const [hx, hy] = this.sc(E.x, CGY - E.h - 10); UI.text(INTENT_ICON[ik] || '!', hx, hy - 6 + Math.sin(T * 4) * 3, { size: 22, col, align: 'center', stroke: 3 }); }
    // field + controls
    if (this.field >= 0) { const s = `${AREAS[this.field].field} · ${AREAS[this.field].fieldDesc}`, w = UI.measure(s, 12) + 18; UI.pill(s, 640 - w / 2, 14, COL.blue); } else UI.pill('VILLAGE RAID', 590, 14, COL.red);
    UI.text(`Turn ${Math.max(1, this.turn)}`, 640, 56, { align: 'center', size: 13, col: COL.dim });
    if (UI.btn('⚙', 596, 66, 40, 30, { size: 15, id: 'cset', disabled: this.phase !== 'player' })) openSettings(); if (UI.btn(Audio.muted ? '🔇' : '🔊', 644, 66, 40, 30, { size: 14, id: 'cmute' })) Audio.toggleMute();
    // bubble
    if (this.bubble) { const [bx, by] = this.sc(E.x, CGY - E.h - 20), lines = UI.wrap(this.bubble.text, 260, 14, true), w = 280, h = lines.length * 18 + 16, a = clamp(Math.min(this.bubble.t * 4, (2.6 - this.bubble.t) * 3), 0, 1); g.globalAlpha = a; g.fillStyle = '#f3e6c8'; g.fillRect(bx - w / 2, by - h - 40, w, h); g.beginPath(); g.moveTo(bx - 8, by - 40); g.lineTo(bx + 4, by - 26); g.lineTo(bx + 10, by - 40); g.fill(); lines.forEach((l, i) => UI.text(l, bx, by - h - 40 + 22 + i * 18, { align: 'center', size: 14, col: COL.ink, shadow: false })); g.globalAlpha = 1; }
    // log line
    if (this.log && !this.over) { g.globalAlpha = clamp(this.logT * 4, 0, 1); const w = Math.min(900, UI.measure(this.log, 15, false) + 40); g.fillStyle = 'rgba(12,8,16,.75)'; g.fillRect(640 - w / 2, 470, w, 30); UI.text(this.log, 640, 491, { align: 'center', size: 15, bold: false, col: COL.cream, maxW: 870 }); g.globalAlpha = 1; }
    // break meter
    const bk = this.brk / 100; g.fillStyle = 'rgba(12,8,16,.8)'; g.fillRect(440, 508, 400, 22); UI.bar(508, 514, 322, 10, bk, bk >= 1 ? `hsl(${(T * 200) % 360},80%,65%)` : '#e0a040'); UI.text('BREAK', 452, 524, { size: 12, col: bk >= 1 ? COL.gold2 : COL.dim });
    this.drawCards(); if (this.itemMenu) this.drawItems();
    if (this.mg) this.drawMG(); if (this.cue) this.drawCue();
    if (this.ult) { const k = clamp((this.ct - this.ult.t0) / .4, 0, 1); g.globalAlpha = k * (this.ct - this.ult.t0 > 2.3 ? 0 : 1); UI.text(this.ult.name, 640 + (1 - Ease.outQ(k)) * 200, 200, { align: 'center', size: 44, col: COL.gold2, stroke: 4 }); UI.text('— BREAK —', 640, 236, { align: 'center', size: 16, col: COL.cream }); g.globalAlpha = 1; }
  },
  drawTitleCard() {
    const k = clamp(this.titleCard / .5, 0, 1), d = this.def, out = clamp((this.titleCard - 2.4) / .4, 0, 1), a = k * (1 - out);
    g.globalAlpha = a; g.fillStyle = 'rgba(10,4,8,.6)'; g.fillRect(0, 280, 1280, 160); g.fillStyle = COL.red; g.fillRect(0, 280, 1280 * Ease.outQ(k), 2); g.fillRect(1280 * (1 - Ease.outQ(k)), 438, 1280, 2);
    const name = d.name.toUpperCase().split('').join(' '); UI.text(name, 640 + (1 - Ease.outC(k)) * -80, 360, { align: 'center', size: 50, col: '#fff0e0', stroke: 4 });
    UI.text(d.title || '', 640 + (1 - Ease.outC(k)) * 80, 402, { align: 'center', size: 20, col: COL.gold2, italic: true }); g.globalAlpha = 1;
  },
  drawCards() {
    const on = this.phase === 'player' && !Overlays.stack.length; this.cardK = (this.cardK || 0) + ((on ? 1 : 0) - (this.cardK || 0)) * Math.min(1, DT * 10);
    const cls = CLASSES[S.cls], defs = [['attack', 'ATTACK', S.cls, 'Timed ' + (S.cls === 'sword' ? 'strike' : S.cls === 'bow' ? 'shot' : 'spell')], ['guard', cls.guard, S.cls === 'bow' ? 'evade' : 'guard', S.cls === 'bow' ? 'Dodge chance, counter' : 'Halve damage, +3 ' + Stats.manaName()], ['skill', cls.skill, 'skill_' + S.cls, `${cls.skillDesc} (4 ${Stats.manaName()})`], ['items', 'ITEMS', 'items', 'Potions & tricks'], ['break', 'BREAK', 'break', this.brk >= 100 ? cls.ult : `Fill the meter (${Math.floor(this.brk)}%)`]];
    if (this.jobDef) { const jd = this.jobDef(); if (jd) defs.splice(3, 0, jd); }
    const w = 164, h = 150, gap = 14, x0 = 640 - (defs.length * (w + gap) - gap) / 2, y = 560 + (1 - this.cardK) * 170;
    defs.forEach(([k, title, ic, sub], i) => {
      const x = x0 + i * (w + gap), dis = (k === 'skill' && !this.canSkill()) || (k === 'break' && this.brk < 100) || (k === 'job' && !this.canJob()), live = on && UI.interactive(), hov = live && UI.inRect(x, y - 10, w, h + 10), id = 'card' + k;
      const st = UI.hot[id] || (UI.hot[id] = { h: 0 }); st.h += ((hov ? 1 : 0) - st.h) * Math.min(1, DT * 14); st.seen = T; if (hov) { UI.hoverId = id; UI.cursor = 'pointer'; }
      const yy = y - st.h * 16 - (k === 'break' && !dis ? Math.sin(T * 6) * 3 : 0);
      g.save(); if (dis) g.globalAlpha = .55;
      g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x + 4, yy + 6, w, h);
      const gr = g.createLinearGradient(0, yy, 0, yy + h); gr.addColorStop(0, k === 'break' && !dis ? '#5a3a1a' : '#e8d4a8'); gr.addColorStop(1, k === 'break' && !dis ? '#2a1a10' : '#c8ae78'); g.fillStyle = gr; g.fillRect(x, yy, w, h);
      g.strokeStyle = hov ? '#fff4d0' : k === 'break' && !dis ? COL.gold2 : '#6a4a2a'; g.lineWidth = 2; g.strokeRect(x + 3, yy + 3, w - 6, h - 6);
      const dark = k === 'break' && !dis; drawIcon(ic, x + w / 2, yy + 52, 56);
      UI.text(title, x + w / 2, yy + 102, { align: 'center', size: title.length > 10 ? 14 : 16, col: dark ? COL.gold2 : '#3a2010', shadow: false, maxW: w - 16 });
      UI.wrap(sub, w - 16, 11).slice(0, 2).forEach((l, j) => UI.text(l, x + w / 2, yy + 120 + j * 13, { align: 'center', size: 11, bold: false, col: dark ? COL.cream : '#5a4028', shadow: false }));
      if (k === 'items') UI.text(String(Object.values(S.inv).reduce((a, b) => a + b, 0)), x + w - 14, yy + 22, { size: 13, col: '#6a4a2a', align: 'right', shadow: false });
      g.restore();
      if (hov && Input.mouse.clicked) { Input.mouse.clicked = false; SFX.play('click'); this.card(k); }
    });
  },
  drawItems() {
    const ids = Object.keys(ITEMS), x = 360, y = 210, w = 560, h = 104 + ids.length * 36; UI.panel(x, y, w, h, { title: 'ITEMS' });
    if (UI.btn('Close', x + w / 2 - 70, y + h - 48, 140, 34, { size: 14, id: 'itemclose' })) { this.itemMenu = false; SFX.play('page'); }
    ids.forEach((id, i) => { const it = ITEMS[id], n = S.inv[id] || 0, yy = y + 46 + i * 36; drawIcon(id, x + 40, yy + 15, 26); if (UI.btn(`${it.name}  ×${n}`, x + 60, yy, w - 80, 32, { align: 'left', size: 14, disabled: !n, right: it.smoke && !this.boss && !this.raid ? 'FLEE' : '', id: 'item' + id })) this.useItem(id); if (UI.inRect(x + 60, yy, w - 80, 32)) UI.text(it.desc, 640, y + h + 24, { align: 'center', size: 13, col: COL.dim, bold: false }); });
  },
  drawMG() {
    const mg = this.mg, [ex, ey] = this.sc(this.E.x, CGY - this.E.h * .5);
    const hint = (s) => UI.text(s, 640, 440, { align: 'center', size: 15, col: COL.gold2, stroke: 3 });
    if (mg.cls === 'sword') { g.lineWidth = 3; g.strokeStyle = 'rgba(240,216,144,.9)'; g.beginPath(); g.arc(ex, ey, 26, 0, TAU); g.stroke(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(ex, ey, 26 + 14, 0, TAU); g.stroke(); const near = Math.abs(mg.r - 26) < 5; g.lineWidth = near ? 5 : 3; g.strokeStyle = near ? '#fff4c0' : '#ffffff'; g.beginPath(); g.arc(ex, ey, Math.max(1, mg.r), 0, TAU); g.stroke(); hint('SPACE / CLICK when the rings meet'); }
    if (mg.cls === 'light') { g.lineWidth = 3; g.strokeStyle = 'rgba(255,240,160,.9)'; g.beginPath(); g.arc(ex, ey, 60, 0, TAU); g.stroke(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + T; g.fillStyle = '#fff0a0'; g.fillRect(ex + Math.cos(a) * 66 - 2, ey + Math.sin(a) * 66 - 2, 4, 4); } const near = Math.abs(mg.r - 60) < 3.5; g.globalAlpha = .25; g.fillStyle = '#fff8d0'; g.beginPath(); g.arc(ex, ey, mg.r, 0, TAU); g.fill(); g.globalAlpha = 1; g.lineWidth = near ? 5 : 2; g.strokeStyle = near ? '#ffffff' : '#fff8d0'; g.beginPath(); g.arc(ex, ey, Math.max(1, mg.r), 0, TAU); g.stroke(); hint('Tap when the pulse meets the halo (precise!)'); }
    if (mg.cls === 'bow') { const x = 440, y = 400, w = 400; g.fillStyle = 'rgba(12,8,16,.85)'; g.fillRect(x - 6, y - 6, w + 12, 32); g.fillStyle = '#5a4a3a'; g.fillRect(x, y, w, 20); g.fillStyle = COL.gold; g.fillRect(x + (mg.zone - .13) * w, y, .26 * w, 20); g.fillStyle = '#fff4c0'; g.fillRect(x + (mg.zone - .045) * w, y, .09 * w, 20); g.fillStyle = '#fff'; g.fillRect(x + mg.pos * w - 2, y - 8, 4, 36); for (let i = 0; i < mg.need; i++) { g.fillStyle = i < mg.res.length ? GRADE_COL[mg.res[i]] : '#3a3040'; g.fillRect(x + w / 2 - mg.need * 14 + i * 28, y + 34, 20, 6); } hint(mg.need > 1 ? `TRIPLE SHOT — ${mg.res.length}/3` : 'Release in the gold'); }
    if (mg.cls === 'fire') { const [px, py] = this.sc(this.P.x - 30, CGY - 90), h = 160, w = 22, x = px - w / 2, y = py; g.fillStyle = 'rgba(12,8,16,.85)'; g.fillRect(x - 5, y - 5, w + 10, h + 10); g.fillStyle = '#3a2020'; g.fillRect(x, y, w, h); g.fillStyle = COL.gold; g.fillRect(x, y + h * (1 - 1), w, h * .07); g.fillRect(x, y + h * (1 - .8), w, h * .2); g.fillStyle = '#fff4c0'; g.fillRect(x, y + h * (1 - .93), w, h * .13); const f = clamp(mg.fill, 0, 1.1); const gr = g.createLinearGradient(0, y + h, 0, y); gr.addColorStop(0, '#a02010'); gr.addColorStop(1, '#ffd040'); g.fillStyle = gr; g.fillRect(x + 5, y + h * (1 - Math.min(1, f)), w - 10, h * Math.min(1, f)); if (f > 1) { g.fillStyle = '#fff'; g.fillRect(x - 5, y - 8, w + 10, 4); } hint(mg.started ? 'Release in the gold!' : 'HOLD SPACE / MOUSE to charge'); }
    if (mg.cls === 'water') { const hx = 420, y = 400; g.strokeStyle = 'rgba(128,200,255,.5)'; g.lineWidth = 2; g.beginPath(); for (let x = hx; x < 1000; x += 6) g.lineTo(x, y + Math.sin(x * .03 - T * 4) * 8); g.stroke(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.beginPath(); g.arc(hx, y, 18, 0, TAU); g.stroke(); for (const b of mg.beats) { const dx = (b.t - mg.t) * 700; if (b.g) { if (mg.t - b.t < .4) UI.text(b.g === 'MISS' ? '×' : '✓', hx, y - 30, { align: 'center', size: 18, col: GRADE_COL[b.g] }); continue; } const bx = hx + dx; if (bx > 1010) continue; g.fillStyle = Math.abs(dx) < 40 ? '#ffffff' : '#80c8ff'; g.beginPath(); g.arc(bx, y + Math.sin(bx * .03 - T * 4) * 8, 12, 0, TAU); g.fill(); } hint('Tap as each wave reaches the ring'); }
  },
  drawCue() {
    const cue = this.cue, [px, py] = this.sc(this.P.x + 4, CGY - 38), rem = cue.impact - this.ct, r = 24 + Math.max(0, rem) / .75 * 70, win = Math.abs(rem) < (this.P.guard ? .1 : .07);
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(px, py, 24, 0, TAU); g.stroke();
    if (cue.pressed === null) { g.lineWidth = win ? 5 : 3; g.strokeStyle = win ? '#fff4c0' : rem > .25 ? 'rgba(255,120,100,.9)' : '#ffd080'; g.beginPath(); g.arc(px, py, r, 0, TAU); g.stroke(); UI.text('!', px, py - 90, { align: 'center', size: 30, col: '#ffd080', stroke: 4 }); if (S.stats.deaths + this.turn < 6) UI.text('SPACE / CLICK on impact', px, py + 110, { align: 'center', size: 14, col: COL.cream, stroke: 3 }); }
  }
});
function P2(c, x, y, w, h) { P(c, x, y, w, h); }
