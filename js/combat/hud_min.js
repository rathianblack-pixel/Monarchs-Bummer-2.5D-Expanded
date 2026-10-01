'use strict';
/* =========================================================
   MINIMAL BATTLE HUD (v4.1)
   Settings.hud = 'minimal' (default) | 'classic' (the v4.0 boxes + cards).
   Settings.combatCam = 'close' (default) | 'wide'.
   - Commands: a slim list at bottom-left (mouse) or a row of round thumb
     buttons at bottom-right (touch devices). The description shows only for the
     hovered command.
   - The enemy's name, HP, shields, weaknesses and intent float above the enemy.
   - The player's info is one thin strip. The Break meter is a line under BREAK.
   - Nothing has a box. While anything other than "your turn" is happening
     (attacks, timing minigames, the enemy's move), the HUD slides off screen.
   ========================================================= */
const HudMin = {
  on() { return Settings.hud !== 'classic'; },
  touch() { return Settings.hudTouch === true || (Settings.hudTouch !== false && typeof Mobile !== 'undefined' && Mobile.touch); },
  fade(x0, x1, y, h, a) { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(8,6,12,0)'); gr.addColorStop(.18, `rgba(8,6,12,${a})`); gr.addColorStop(.82, `rgba(8,6,12,${a})`); gr.addColorStop(1, 'rgba(8,6,12,0)'); g.fillStyle = gr; g.fillRect(x0, y, x1 - x0, h); },
  r(x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); },
  line(x, y, w, h, k, col, ghost) { this.r(x, y, w, h, 'rgba(0,0,0,.55)'); if (ghost !== undefined && ghost > k) this.r(x, y, w * clamp(ghost, 0, 1), h, 'rgba(240,224,192,.8)'); this.r(x, y, w * clamp(k, 0, 1), h, col); if (h >= 3) this.r(x, y, w * clamp(k, 0, 1), 1, 'rgba(255,255,255,.35)'); },
  pip(x, y, rad, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); }
};
const DIM = 'rgba(243,230,200,.55)', SOFT = 'rgba(243,230,200,.85)';

{ const C = Scenes.combat, _ui = C.ui;
  C.ui = function () { if (!HudMin.on()) return _ui.call(this); const nm = S.name; if (this.tl) S.name = Travel.name(this.tl.lead); try { this.uiMin(); } finally { S.name = nm; } };

  C.cmdDefs = function () {
    const cls = CLASSES[S.cls], mn = Stats.manaName();
    const d = [['attack', 'Attack', S.cls, '', 'Timed ' + (S.cls === 'sword' ? 'strike' : S.cls === 'bow' ? 'shot' : 'spell')],
      ['guard', cls.guard, S.cls === 'bow' ? 'evade' : 'guard', '', S.cls === 'bow' ? 'Dodge chance, then counter' : 'Halve damage, +3 ' + mn],
      ['skill', cls.skill, 'skill_' + S.cls, '4 ' + mn, cls.skillDesc],
      ['items', 'Items', 'items', String(Object.values(S.inv).reduce((a, b) => a + b, 0)), 'Potions & tricks'],
      ['break', 'Break', 'break', this.brk >= 100 ? 'READY' : Math.floor(this.brk) + '%', this.brk >= 100 ? cls.ult : 'Fills from perfect timing and damage taken']];
    if (this.jobDef) { const jd = this.jobDef(); if (jd) d.splice(3, 0, ['job', jd[1].replace(/^JOB · /, 'Job · '), jd[2], '3 ' + mn, jd[3]]); }
    const id = typeof Party !== 'undefined' && Party.active && Party.active();
    if (id && !this.raid && typeof COMPANIONS !== 'undefined') { const cp = COMPANIONS[id], k = (this.assistK || 0) / 100; d.push(['assist', 'Assist · ' + cp.name, null, this.assistUsed ? 'USED' : k >= 1 ? 'READY' : Math.floor(k * 100) + '%', cp.move, cp.col]); }
    return d;
  };
  C.cmdDisabled = function (k) { return (k === 'skill' && !this.canSkill()) || (k === 'break' && this.brk < 100) || (k === 'job' && !this.canJob()) || (k === 'assist' && (this.assistUsed || (this.assistK || 0) < 100)) || (k === 'items' && this.silence === 'items'); };

  C.uiMin = function () {
    const E = this.E, d = this.def, H = HudMin, hpk = S.hp / Stats.maxHP(), touch = H.touch();
    if (hpk < .3 && !this.over) { const a = .25 + Math.sin(T * 5) * .12; const gr = g.createRadialGradient(640, 360, 280, 640, 360, 760); gr.addColorStop(0, 'rgba(120,0,10,0)'); gr.addColorStop(1, `rgba(150,0,16,${a})`); g.fillStyle = gr; g.fillRect(0, 0, 1280, 720); }
    if (this.titleCard) { this.drawTitleCard(); return; }
    if (this.phase === 'intro') { this.hudK = 0; return; }
    // slide-away factor: 1 on your turn, 0 while anything is animating
    const want = this.phase === 'player' && !this.over && !this.ult && !Overlays.stack.length ? 1 : 0; this.hudK = (this.hudK || 0) + (want - (this.hudK || 0)) * Math.min(1, DT * (want ? 9 : 12));
    const K = this.hudK, eo = Ease.outQ(K), off = 1 - eo, live = K > .9 && want && !Overlays.stack.length && UI.interactive();
    // ---------- top-left tag: field + turn (fades after the first turns) ----------
    { const s1 = this.field >= 0 ? AREAS[this.field].field.toUpperCase() : 'VILLAGE RAID', s2 = (this.field >= 0 ? AREAS[this.field].fieldDesc.toUpperCase() + '  ·  ' : '') + 'TURN ' + Math.max(1, this.turn);
      const y = 30 - off * 40, w1 = UI.measure(s1, 13);
      UI.text(s1, 28, y, { size: 13, col: this.field >= 0 ? COL.gold2 : COL.red }); UI.text(s2, 28 + w1 + 12, y, { size: 13, col: DIM });
      const gr = g.createLinearGradient(28, 0, 200, 0); gr.addColorStop(0, 'rgba(240,216,144,.55)'); gr.addColorStop(1, 'rgba(240,216,144,0)'); g.fillStyle = gr; g.fillRect(28, y + 8, 172, 1);
      let ny = y + 26; const note = (s, col) => { UI.text(s, 28, ny, { size: 9, col: col || DIM }); ny += 14; };
      if (this.silence) note('SILENCE', COL.blue);
      if (d.id === 'grudge' && this.used) { const m = this.used.attack === this.used.skill ? null : this.used.attack > this.used.skill ? 'ATTACK' : 'SKILL'; if (m && Math.max(this.used.attack, this.used.skill) >= 2) note('THE GRUDGE REMEMBERS: ' + m, '#a0d8ff'); }
      if (d.id === 'haughtsworth' && !E.phase2) note('MOUNTED · LAND A PERFECT TO DISMOUNT', COL.gold2);
      if (d.id === 'ledger') note(`NEXT INVOICE: TURN ${Math.ceil(Math.max(1, this.turn + 1) / 3) * 3}`, COL.gold2);
      if (d.cursed) note('CURSED ELITE · +45% HP', COL.purple);
    }
    // corner: settings + sound (tiny, no boxes)
    { const y = 18 - off * 40; const b = (s, x, id, fn, dis) => { const hov = !dis && UI.interactive() && UI.inRect(x - 14, y - 4, 28, 26); if (hov) { UI.hoverId = id; UI.cursor = 'pointer'; } UI.text(s, x, y + 13, { size: 13, col: hov ? '#fff4d8' : DIM, align: 'center' }); if (hov && Input.mouse.clicked) { Input.mouse.clicked = false; SFX.play('click'); fn(); } };
      b('SET', 1246, 'cset', () => openSettings(), this.phase !== 'player'); b(Audio.muted ? 'MUTED' : 'SND', 1196, 'cmute', () => Audio.toggleMute()); }
    // ---------- enemy nameplate ----------
    if (E.pose !== 'dead' && !this.over) {
      const [ex, ey0] = this.sc(E.x, CGY - E.h - 6), cx = clamp(ex, 150, 1130), y = Math.max(78, ey0 - 30) - off * 14;
      g.globalAlpha = clamp(K, 0, 1);
      H.fade(cx - 118, cx + 118, y - 32, 56, .5);
      // intent
      if (E.intent) { const col = E.intent === 'UNLEASH' ? COL.red : E.intent === 'HEAL' || E.intent === 'SHIELD' ? COL.blue : '#ffcf70', lab = this.intentLabel().split(' · ')[0]; g.save(); g.translate(cx - 70, y - 19 + Math.sin(T * 4) * 1.5); g.rotate(Math.PI / 4); g.fillStyle = col; g.fillRect(-4, -4, 8, 8); g.restore(); UI.text(lab, cx - 70, y - 2, { size: 9, col, align: 'center', maxW: 60 }); }
      UI.text(E.name, cx - 48, y - 14, { size: 13, col: this.boss ? '#ff9a8a' : COL.cream, maxW: 130 }); UI.text(this.boss ? 'BOSS' : this.raid ? 'RAIDER' : 'LV ' + (this.lvl + 1), cx + 92, y - 14, { size: 9, col: DIM, align: 'right' });
      H.line(cx - 48, y - 7, 140, 3, E.hp / E.maxHp, this.boss ? '#c83a4a' : '#e0604c', E.ghost / E.maxHp);
      // shield badge + weaknesses
      const bx = cx - 40, by = y + 9, pop = this.shPop && this.ct >= this.shPop.t && this.ct - this.shPop.t < .3 ? 1 + (1 - (this.ct - this.shPop.t) / .3) * .4 : 1;
      if (E.sh !== undefined) { g.save(); g.translate(bx, by); g.scale(pop, pop); g.fillStyle = E.broken ? 'rgba(90,106,138,.95)' : 'rgba(200,216,240,.95)'; g.beginPath(); g.moveTo(-8, -8); g.lineTo(8, -8); g.lineTo(8, 2); g.lineTo(0, 9); g.lineTo(-8, 2); g.closePath(); g.fill(); g.restore(); UI.text(E.broken ? 'X' : String(E.sh), bx, by + 4, { size: 11, col: '#1a1a2a', align: 'center', shadow: false }); }
      let wx = bx + 26; (this.weak || []).forEach(c => { H.r(wx - 8, by - 8, 16, 16, 'rgba(10,8,16,.45)'); g.strokeStyle = 'rgba(240,216,144,.35)'; g.lineWidth = 1; g.strokeRect(wx - 7.5, by - 7.5, 15, 15); if (this.seen && this.seen.includes(c)) drawIcon(c, wx, by, 14); else UI.text('?', wx, by + 4, { size: 11, col: DIM, align: 'center' }); wx += 20; });
      // traits / statuses as tiny words
      const tags = []; if (E.broken) tags.push(['BROKEN ×1.5', '#a0c0e8']); else if (d.trait) tags.push([d.trait.toUpperCase(), '#c8a8f0']); if (E.shield) tags.push(['SHIELD ' + E.shield, COL.blue]); if (E.dodge) tags.push(['EVASIVE', '#bfe0ff']); if (E.enrage) tags.push(['ENRAGED', COL.red]); for (const k in E.st) tags.push([`${ST_INFO[k][0]}${k === 'stagger' ? '' : ' ' + E.st[k]}`.toUpperCase(), ST_INFO[k][1]]);
      let tx = wx + 2; for (const [s, col] of tags.slice(0, 3)) { UI.text(s, tx, by + 4, { size: 9, col }); tx += UI.measure(s, 9) + 8; }
      g.globalAlpha = 1;
      // speech bubble: plain text above the plate
      if (this.bubble) { const lines = UI.wrap(this.bubble.text, 300, 13, true), a = clamp(Math.min(this.bubble.t * 4, (2.6 - this.bubble.t) * 3), 0, 1), top = Math.max(16, y - 40 - lines.length * 17); g.globalAlpha = a; H.fade(cx - 190, cx + 190, top - 14, lines.length * 17 + 10, .55); lines.forEach((l, i) => UI.text(l, cx, top + i * 17, { align: 'center', size: 13, col: '#fff4d8' })); g.globalAlpha = 1; }
    }
    // ---------- caption (battle log) ----------
    if (this.log && !this.over) { const a = clamp(this.logT * 4, 0, 1); g.globalAlpha = a; const w = Math.min(900, UI.measure(this.log, 13) + 80); H.fade(640 - w / 2, 640 + w / 2, 132, 26, .42); UI.text(this.log, 640, 150, { align: 'center', size: 13, col: '#f3e6c8', maxW: 860, shadowCol: 'rgba(0,0,0,.85)' }); g.globalAlpha = 1; }
    // ---------- commands + player strip ----------
    if (touch) this.cmdTouch(K, off, live); else this.cmdList(K, off, live);
    if (this.itemMenu) this.itemsMin(touch);
    if (this.mg) this.drawMG(); if (this.cue) this.drawCue();
    if (this.brkFx && this.ct - this.brkFx < 1.2) { const k = (this.ct - this.brkFx) / 1.2; g.globalAlpha = 1 - k; UI.text('B R E A K', 640, 300 - k * 20, { align: 'center', size: 54, col: '#e8f0ff', stroke: 4 }); g.globalAlpha = 1; }
    if (this.ult) { const k = clamp((this.ct - this.ult.t0) / .4, 0, 1); g.globalAlpha = k * (this.ct - this.ult.t0 > 2.3 ? 0 : 1); UI.text(this.ult.name, 640 + (1 - Ease.outQ(k)) * 200, 200, { align: 'center', size: 44, col: COL.gold2, stroke: 4 }); UI.text('— BREAK —', 640, 236, { align: 'center', size: 16, col: COL.cream }); g.globalAlpha = 1; }
  };

  C.playerStrip = function (x, y, big, off) {
    const H = HudMin, hpk = S.hp / Stats.maxHP(), sz = big ? 18 : 13, ss = big ? 13 : 9; y += off * 90;
    UI.text(S.name.toUpperCase(), x, y, { size: sz, col: COL.gold2, maxW: 200 }); let tx = x + Math.min(200, UI.measure(S.name.toUpperCase(), sz)) + 10;
    UI.text(`${CLASSES[S.cls].name.toUpperCase()} · LV ${S.level}`, tx, y, { size: ss, col: DIM }); tx += UI.measure(`${CLASSES[S.cls].name.toUpperCase()} · LV ${S.level}`, ss) + 10;
    if (this.P.guard) { UI.text(S.cls === 'bow' ? 'EVADING' : 'GUARDING', tx, y, { size: ss, col: '#bfe0ff' }); tx += UI.measure('GUARDING', ss) + 8; }
    for (const k in this.P.st) { const s = `${ST_INFO[k][0]} ${this.P.st[k]}`.toUpperCase(); UI.text(s, tx, y, { size: ss, col: ST_INFO[k][1] }); tx += UI.measure(s, ss) + 8; }
    const hw = big ? 300 : 210, hh = big ? 7 : 4; H.line(x, y + 9, hw, hh, hpk, hpk < .3 ? COL.red : '#86cc70', this.pGhost / Stats.maxHP()); UI.text(`${Math.ceil(S.hp)}/${Stats.maxHP()}`, x + hw + 8, y + 9 + hh, { size: ss, col: hpk < .3 ? '#ff9a8a' : COL.cream });
    const mw = big ? 180 : 130, my = y + 9 + hh + (big ? 7 : 5); H.line(x, my, mw, big ? 4 : 2, this.mana / Stats.maxMana(), COL.blue); UI.text(`${Stats.manaName().toUpperCase()} ${this.mana}/${Stats.maxMana()}`, x + mw + 8, my + (big ? 5 : 4), { size: ss, col: 'rgba(160,200,240,.9)' });
    return y;
  };
  C.boostWidget = function (x, y, big, live) {
    const H = HudMin, r = big ? 7 : 4, sp = big ? 22 : 13, ready = live && this.bp >= 1;
    UI.text('BP', x - 6, y + (big ? 5 : 4), { size: big ? 13 : 9, col: '#ffd070', align: 'right' });
    for (let i = 0; i < 5; i++) { const sel = i < this.boostSel; H.pip(x + 4 + i * sp, y, sel ? r + 1 : r, sel ? `hsl(${40 + Math.sin(T * 8) * 10},100%,70%)` : i < this.bp ? '#d8a040' : 'rgba(255,255,255,.18)'); }
    const bx = x + 5 * sp + (big ? 16 : 6), lab = this.boostSel ? `BOOST ×${this.boostSel}` : 'BOOST', bw = UI.measure(lab, big ? 13 : 9) + 12, hov = ready && UI.inRect(bx - 6, y - (big ? 22 : 12), bw + (big ? 20 : 4), big ? 44 : 24);
    if (big) { g.fillStyle = hov ? 'rgba(40,30,30,.8)' : 'rgba(14,10,18,.6)'; g.beginPath(); g.arc(bx + bw / 2, y, 30, 0, TAU); g.fill(); g.strokeStyle = this.boostSel ? '#ffd070' : 'rgba(255,208,112,.5)'; g.lineWidth = 2; g.stroke(); }
    UI.text(lab, big ? bx + bw / 2 : bx, y + (big ? 5 : 4), { size: big ? 13 : 9, col: !ready ? 'rgba(243,230,200,.3)' : hov || this.boostSel ? '#ffd070' : DIM, align: big ? 'center' : 'left' });
    if (hov) { UI.hoverId = 'boostbtn'; UI.cursor = 'pointer'; if (Input.mouse.clicked) { Input.mouse.clicked = false; this.cycleBoost(); } }
  };

  // ----- mouse / keyboard: slim list, bottom-left -----
  C.cmdList = function (K, off, live) {
    const H = HudMin, defs = this.cmdDefs(), lh = 27, x0 = 52 - off * 340, y0 = 652 - defs.length * lh;
    if (K > .01) { g.globalAlpha = K; const vg = g.createRadialGradient(150, 720, 40, 150, 720, 540); vg.addColorStop(0, 'rgba(8,6,12,.78)'); vg.addColorStop(.55, 'rgba(8,6,12,.42)'); vg.addColorStop(1, 'rgba(8,6,12,0)'); g.fillStyle = vg; g.fillRect(0, 360, 720, 360); g.globalAlpha = 1; }
    if (this.cmdSel === undefined || !defs[this.cmdSel]) this.cmdSel = 0;
    defs.forEach(([k, t, ic, right, desc, col], i) => {
      const y = y0 + i * lh, dis = this.cmdDisabled(k), hov = live && UI.inRect(x0 - 24, y - 12, 276, lh - 1), id = 'cmd' + k;
      if (hov) { this.cmdSel = i; UI.hoverId = id; UI.cursor = 'pointer'; }
      const on = this.cmdSel === i && K > .5, rdy = (k === 'break' || k === 'assist') && !dis;
      g.globalAlpha = clamp(K * 1.4 - i * .06, 0, 1);
      if (on) { const gr = g.createLinearGradient(x0 - 22, 0, x0 + 250, 0); gr.addColorStop(0, 'rgba(240,216,144,.22)'); gr.addColorStop(1, 'rgba(240,216,144,0)'); g.fillStyle = gr; g.fillRect(x0 - 22, y - 11, 272, 24); H.r(x0 - 22, y - 11, 2, 24, COL.gold2); }
      const a0 = g.globalAlpha; if (dis) g.globalAlpha = a0 * .45;
      if (ic) drawIcon(ic, x0 + 9, y + 1, 18, g.globalAlpha); else { g.save(); g.translate(x0 + 9, y + 1); g.rotate(Math.PI / 4); g.fillStyle = col || COL.gold2; g.fillRect(-4, -4, 8, 8); g.restore(); }
      g.globalAlpha = a0 * (dis ? .45 : 1);
      UI.text(t.toUpperCase(), x0 + 26, y + 6, { size: 13, col: rdy ? `hsl(45,100%,${70 + Math.sin(T * 6) * 10}%)` : on ? '#fff4d8' : SOFT, maxW: 170 });
      if (right) UI.text(right, x0 + 236, y + 6, { size: 9, col: k === 'skill' || k === 'job' ? COL.blue : rdy ? '#ffd070' : DIM, align: 'right' });
      g.globalAlpha = a0;
      if (k === 'break') { H.r(x0 + 26, y + 10, 120, 2, 'rgba(255,255,255,.12)'); H.r(x0 + 26, y + 10, 120 * clamp(this.brk / 100, 0, 1), 2, this.brk >= 100 ? `hsl(${(T * 200) % 360},80%,65%)` : '#ffd070'); }
      if (k === 'assist') { H.r(x0 + 26, y + 10, 120, 2, 'rgba(255,255,255,.12)'); H.r(x0 + 26, y + 10, 120 * clamp((this.assistK || 0) / 100, 0, 1), 2, col || COL.gold2); }
      if (on && desc) UI.text(desc, x0 + 272, y + 6, { size: 9, col: 'rgba(243,230,200,.65)', maxW: 380 });
      g.globalAlpha = 1;
      if (hov && Input.mouse.clicked) { Input.mouse.clicked = false; if (dis) { SFX.play('error'); this.card(k); } else { SFX.play('click'); this.card(k); } }
    });
    const py = 686; this.playerStrip(30, py, false, off);
    g.globalAlpha = K; this.boostWidget(310, py + 11 + off * 90, false, live); g.globalAlpha = 1;
  };

  // ----- touch: round thumb buttons, bottom-right -----
  C.cmdTouch = function (K, off, live) {
    const H = HudMin, defs = this.cmdDefs();
    if (K > .01) { g.globalAlpha = K; const vr = g.createLinearGradient(0, 560, 0, 720); vr.addColorStop(0, 'rgba(8,6,12,0)'); vr.addColorStop(1, 'rgba(8,6,12,.7)'); g.fillStyle = vr; g.fillRect(0, 560, 1280, 160); g.globalAlpha = 1; }
    const n = defs.length, small = n > 5 ? 40 : 44, gap = small * 2 + 14;
    defs.forEach(([k, t, ic, right, desc, col], i) => {
      const big = i === 0, rad = big ? 58 : small, x = (big ? 1200 : 1200 - 58 - 10 - small - (i - 1) * gap) + off * 0, y = (big ? 640 : 656) + off * 200;
      const dis = this.cmdDisabled(k), hov = live && Math.hypot(Input.mouse.x - x, Input.mouse.y - y) < rad + 6, rdy = (k === 'break' || k === 'assist') && !dis;
      g.globalAlpha = K;
      g.fillStyle = hov ? 'rgba(40,30,34,.82)' : big ? 'rgba(30,22,30,.75)' : 'rgba(14,10,18,.6)'; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
      g.strokeStyle = rdy ? '#ffd070' : big ? COL.gold2 : 'rgba(240,216,144,.45)'; g.lineWidth = big ? 3 : 2; g.stroke();
      if (k === 'break' || k === 'assist') { const p = k === 'break' ? this.brk / 100 : (this.assistK || 0) / 100; g.strokeStyle = k === 'assist' ? (col || COL.gold2) : '#ffd070'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, rad - 5, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(p, 0, 1)); g.stroke(); }
      const a0 = K * (dis ? .45 : 1); if (ic) drawIcon(ic, x, y - (big ? 10 : 8), big ? 52 : 36, a0); else { g.globalAlpha = a0; g.save(); g.translate(x, y - 8); g.rotate(Math.PI / 4); g.fillStyle = col || COL.gold2; g.fillRect(-10, -10, 20, 20); g.restore(); }
      g.globalAlpha = a0; UI.text(t.replace(/^(Job|Assist) · /, '').toUpperCase(), x, y + (big ? 34 : 26), { size: big ? 16 : 13, col: big ? '#fff4d8' : SOFT, align: 'center', maxW: rad * 2 - 8 });
      g.globalAlpha = K; if (right) UI.text(right, x, y - rad - 8, { size: 13, col: k === 'skill' || k === 'job' ? COL.blue : rdy ? '#ffd070' : COL.cream, align: 'center' });
      g.globalAlpha = 1;
      if (hov && Input.mouse.clicked) { Input.mouse.clicked = false; SFX.play(dis ? 'error' : 'click'); this.card(k); }
    });
    const py = 664; this.playerStrip(30, py, true, off);
    g.globalAlpha = K; this.boostWidget(480, py + 14 + off * 90, true, live); g.globalAlpha = 1;
  };

  // ----- items: a soft list instead of a big panel -----
  C.itemsMin = function (touch) {
    const H = HudMin, ids = Object.keys(ITEMS), lh = touch ? 48 : 28, w = touch ? 520 : 420, x = touch ? 380 : 330, h = ids.length * lh + (touch ? 70 : 52), y = touch ? 620 - h : 646 - h;
    const gr = g.createLinearGradient(x - 40, 0, x + w + 40, 0); gr.addColorStop(0, 'rgba(8,6,12,0)'); gr.addColorStop(.1, 'rgba(8,6,12,.78)'); gr.addColorStop(.9, 'rgba(8,6,12,.78)'); gr.addColorStop(1, 'rgba(8,6,12,0)'); g.fillStyle = gr; g.fillRect(x - 40, y, w + 80, h);
    H.r(x, y + 26, 160, 1, 'rgba(240,216,144,.45)'); UI.text('ITEMS', x, y + 20, { size: touch ? 16 : 13, col: COL.gold2 });
    const cl = 'CLOSE', cw = UI.measure(cl, 13), chov = UI.interactive() && UI.inRect(x + w - cw - 10, y + 4, cw + 20, touch ? 40 : 24); UI.text(cl, x + w, y + 20, { size: 13, col: chov ? '#fff4d8' : DIM, align: 'right' }); if (chov) { UI.cursor = 'pointer'; UI.hoverId = 'itemclose'; if (Input.mouse.clicked) { Input.mouse.clicked = false; this.itemMenu = false; SFX.play('page'); } }
    let tip = null;
    ids.forEach((id, i) => { const it = ITEMS[id], n = S.inv[id] || 0, yy = y + (touch ? 56 : 44) + i * lh, hov = UI.interactive() && UI.inRect(x - 10, yy - lh / 2 - 2, w + 20, lh); if (hov) { tip = it.desc; UI.cursor = n ? 'pointer' : 'default'; UI.hoverId = 'item' + id; H.r(x - 10, yy - lh / 2 + 1, w + 20, lh - 2, 'rgba(240,216,144,.12)'); }
      const a = n ? 1 : .4; drawIcon(id, x + 10, yy, touch ? 30 : 20, a); g.globalAlpha = a;
      UI.text(it.name.toUpperCase(), x + (touch ? 36 : 28), yy + 5, { size: touch ? 16 : 13, col: hov ? '#fff4d8' : SOFT, maxW: w - 120 }); UI.text('×' + n, x + w, yy + 5, { size: touch ? 13 : 9, col: DIM, align: 'right' });
      if (it.smoke && !this.boss && !this.raid) UI.text('FLEE', x + w - 40, yy + 5, { size: 9, col: COL.blue, align: 'right' }); g.globalAlpha = 1;
      if (hov && Input.mouse.clicked) { Input.mouse.clicked = false; if (n) this.useItem(id); else SFX.play('error'); } });
    if (tip) UI.text(tip, x, y + h - 10, { size: 9, col: 'rgba(243,230,200,.65)', maxW: w });
  };

  // ----- battle camera: a little closer by default -----
  { const _d = C.draw; C.draw = function () { if (Settings.combatCam === 'wide' || !HD.live) return _d.call(this); const z = Cam.zoom, cx = Cam.x, m = (this.P.x + this.E.x) / 2; this.camK = (this.camK || 0) + (1 - (this.camK || 0)) * Math.min(1, DT * 3); Cam.zoom = z + .08 * this.camK; Cam.x = cx + (m - cx) * .85 * this.camK; try { return _d.call(this); } finally { Cam.zoom = z; Cam.x = cx; } }; }
}

/* ---------- toasts without boxes (follows the HUD setting everywhere) ---------- */
{ const _td = Toast.draw;
  Toast.draw = function () {
    if (!HudMin.on()) return _td.call(this);
    if (Overlays.stack.length) return; // never draw over menus / briefings (they keep ticking)
    this.list.forEach((o, i) => {
      const k = o.t < .25 ? Ease.outQ(o.t / .25) : o.t > o.life - .4 ? 1 - (o.t - (o.life - .4)) / .4 : 1, w = Math.min(900, UI.measure(o.text, 13) + 60), y = (Scene.name === 'combat' ? 192 : 92) + i * 26 - (1 - k) * 10;
      g.globalAlpha = clamp(k, 0, 1); HudMin.fade(640 - w / 2 - 30, 640 + w / 2 + 30, y - 15, 22, .45);
      const tw = UI.measure(o.text, 13), ix = 640 - tw / 2 - 12; g.save(); g.translate(ix, y - 4); g.rotate(Math.PI / 4); g.fillStyle = o.col; g.fillRect(-3, -3, 6, 6); g.restore();
      UI.text(o.text, 640 + 6, y, { size: 13, col: COL.cream, align: 'center', maxW: 880, shadowCol: 'rgba(0,0,0,.85)' }); g.globalAlpha = 1;
    });
  };
}
