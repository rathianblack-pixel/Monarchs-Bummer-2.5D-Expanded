'use strict';
/* =========================================================
   HUD — village / interiors / overworld
   ========================================================= */
const HUD = {
  vis: 1,
  draw(o = {}) {
    const hot = Input.mouse.y < 80 || Input.mouse.y > 660 || o.force; this.vis += ((hot ? 1 : .55) - this.vis) * Math.min(1, DT * 4);
    g.globalAlpha = this.vis;
    // clock
    const cw = 230; g.fillStyle = 'rgba(16,12,20,.78)'; g.fillRect(640 - cw / 2, 10, cw, 44); g.strokeStyle = 'rgba(201,164,90,.55)'; g.strokeRect(640 - cw / 2 + .5, 10.5, cw - 1, 43);
    const nk = World.nightK(); UI.text(nk > .5 ? '★' : '☀', 640 - cw / 2 + 20, 40, { size: 20, col: nk > .5 ? '#bcc8f0' : '#f0d060', align: 'center' });
    UI.text(World.clockStr(), 648, 32, { align: 'center', size: 17 }); UI.text(`${World.phaseName()} · Day ${S.day} · ${S.weather[0] + S.weather.slice(1).toLowerCase()}`, 652, 48, { align: 'center', size: 11, col: COL.dim, bold: false, maxW: cw - 50 });
    if (S.ng) UI.pill('NG+' + (S.ng > 1 ? S.ng : ''), 640 + cw / 2 + 8, 22, COL.purple);
    // quest tracker (box grows with the number of quests and always contains the HP bar)
    const qs = Quests.tracker(), qh = 34 + qs.length * 36 + 22;
    g.fillStyle = 'rgba(16,12,20,.72)'; g.fillRect(12, 10, 310, qh); g.strokeStyle = 'rgba(201,164,90,.4)'; g.strokeRect(12.5, 10.5, 309, qh - 1);
    UI.text('QUESTS', 24, 30, { size: 13, col: COL.gold2 }); UI.text(`${S.name} · Lv ${S.level} · ${S.coins}c`, 310, 30, { size: 12, col: COL.dim, align: 'right', bold: false, maxW: 200 });
    qs.forEach((q, i) => { const yy = 40 + i * 36; UI.text((q.state === 'ready' ? '✔ ' : '◆ ') + q.name, 24, yy + 12, { size: 13, col: q.state === 'ready' ? COL.green : COL.cream, maxW: 284 }); UI.text(q.state === 'ready' ? 'Return to ' + q.giver : `${q.desc} (${q.n}/${q.goal})`, 36, yy + 28, { size: 11, col: COL.dim, bold: false, maxW: 272 }); });
    // HP bar compact
    const hk = S.hp / Stats.maxHP(), hy = 10 + qh - 18; UI.bar(24, hy, 200, 7, hk, hk < .3 ? COL.red : COL.green); UI.text(`HP ${Math.ceil(S.hp)}/${Stats.maxHP()}`, 234, hy + 8, { size: 11, col: COL.dim, bold: false, maxW: 80 });
    g.globalAlpha = 1;
    // right controls
    let x = 1268; const btns = o.buttons || [];
    const all = [...btns, ['?', () => openHelp(), 'Help'], ['SAVE', () => Save.save(), 'Save game', 56], ['⚙', () => openSettings(), 'Settings']];
    for (let i = all.length - 1; i >= 0; i--) { const [lab, fn, tip, w] = all[i]; const bw = w || 40; x -= bw + 6; g.globalAlpha = Math.max(.55, this.vis); if (UI.btn(lab, x, 12, bw, 36, { size: lab.length > 2 ? 14 : 18, id: 'hud' + tip })) fn(); if (UI.inRect(x, 12, bw, 36)) UI.text(tip, x + bw / 2, 64, { align: 'center', size: 12, col: COL.dim }); g.globalAlpha = 1; }
    // audio toggle
    if (UI.btn(Audio.muted ? '🔇' : '🔊', 1224, 670, 44, 36, { size: 16, id: 'hudmute' })) Audio.toggleMute();
  }
};
/* ---------------- SETTINGS / HELP / CODEX OVERLAYS ---------------- */
function openSettings() {
  if (Overlays.has('settings')) return; SFX.play('page');
  const ov = Overlays.push({ name: 'settings', a: 0, update(dt) { this.a = Math.min(1, this.a + dt * 6);  }, draw() {
    g.globalAlpha = this.a * .6; g.fillStyle = '#000'; g.fillRect(0, 0, 1280, 720); g.globalAlpha = this.a; const x = 390, y = 130 + (1 - this.a) * 20; UI.panel(x, y, 500, 460, { title: 'SETTINGS' });
    Settings.master = UI.slider('Master', x + 40, y + 80, 420, Settings.master); Settings.music = UI.slider('Music', x + 40, y + 120, 420, Settings.music); Settings.amb = UI.slider('Ambience', x + 40, y + 160, 420, Settings.amb); Settings.sfx = UI.slider('Sound FX', x + 40, y + 200, 420, Settings.sfx);
    Settings.text = UI.slider('Text speed', x + 40, y + 240, 420, Settings.text / 2, { fmt: v => (v * 2).toFixed(1) + '×' }) * 2; Settings.text = Math.max(.3, Settings.text);
    Settings.shake = UI.slider('Screen shake', x + 40, y + 280, 420, Settings.shake);
    UI.text('Flashes', x + 40, y + 322, { size: 15 }); if (UI.btn(Settings.flashes ? 'ON' : 'REDUCED', x + 190, y + 302, 120, 30, { size: 14 })) Settings.flashes = !Settings.flashes;
    UI.text('Graphics', x + 40, y + 362, { size: 15 }); if (UI.btn(Gfx.label(), x + 190, y + 342, 200, 30, { size: 14, id: 'gfxq' })) Gfx.cycle();
    Audio.applyVolumes();
    if (UI.btn('Done', x + 170, y + 390, 160, 40, { accent: true })) close();
    g.globalAlpha = 1;
  } });
  function close() { saveSettings(); Overlays.pop(ov); SFX.play('page'); }
}
function openHelp() {
  if (Overlays.has('help')) return; SFX.play('page');
  const ov = Overlays.push({ name: 'help', a: 0, update(dt) { this.a = Math.min(1, this.a + dt * 6);  }, draw() {
    g.globalAlpha = this.a * .6; g.fillStyle = '#000'; g.fillRect(0, 0, 1280, 720); g.globalAlpha = this.a; const x = 290, y = 90; UI.panel(x, y, 700, 540, { title: 'HOW TO PLAY' });
    const rows = [['Walk', 'Tap / click the ground'], ['Enter / talk', 'Tap a door or a person'], ['Dialogue', 'Tap or press SPACE'], ['Choices & cards', 'Tap them'], ['Timing (attack & defence)', 'SPACE or tap at the right moment'], ['Fire charge', 'Hold SPACE / finger, release in the zone'], ['Menus', 'Use the on-screen buttons'],
      ['', ''], ['Combat', 'Pick a card. Make a bad decision. Timed hits are stronger;'], ['', 'tap at impact when attacked to Block or Perfect-parry.'], ['Break', 'Fills from perfect timing and damage taken.'], ['', 'When full, unleash your class ultimate.'], ['Intent', 'The top banner shows what the enemy plans next.'], ['Saving', 'Autosaves after battles, quests and rest. SAVE saves manually.']];
    rows.forEach(([a, b], i) => { UI.text(a, x + 50, y + 84 + i * 28, { size: 15, col: COL.gold2, maxW: 210 }); UI.text(b, x + 270, y + 84 + i * 28, { size: 14, col: COL.cream, bold: false, maxW: 400 }); });
    if (UI.btn('Got it', x + 270, y + 480, 160, 38, { accent: true })) Overlays.pop(ov); g.globalAlpha = 1;
  } });
}
const [codexC, codexX] = mkCanvas(160, 110);
function openCodex() {
  SFX.play('page'); const ids = ENEMIES.concat(typeof SIDE_ENEMIES !== 'undefined' ? SIDE_ENEMIES : []).map(e => e.id); let sel = ids.find(i => S.codex[i]) || ids[0], page = 0;
  const ov = Overlays.push({ name: 'codex', a: 0, update(dt) { this.a = Math.min(1, this.a + dt * 5);  }, draw() {
    g.globalAlpha = this.a * .7; g.fillStyle = '#000'; g.fillRect(0, 0, 1280, 720); g.globalAlpha = this.a;
    const x = 140, y = 70 + (1 - this.a) * 30, w = 1000, h = 580;
    g.fillStyle = '#3a2418'; g.fillRect(x - 14, y - 12, w + 28, h + 24); g.fillStyle = '#5a3a24'; g.fillRect(x - 8, y - 6, w + 16, h + 12);
    UI.parchment(x, y, w / 2 - 4, h); UI.parchment(x + w / 2 + 4, y, w / 2 - 4, h); g.fillStyle = 'rgba(60,30,10,.35)'; g.fillRect(x + w / 2 - 8, y, 16, h);
    UI.text('BESTIARY OF BAD DECISIONS', x + w / 4, y + 44, { align: 'center', size: 20, col: '#4a2a14', shadow: false });
    const e = ENEMY[sel], known = S.codex[sel];
    // left page — live render
    useCtx(codexX); codexX.setTransform(1, 0, 0, 1, 0, 0); codexX.clearRect(0, 0, 160, 110);
    if (known) { const sc = e.scale || 1; const tmp = Object.assign({}, e, { scale: Math.min(1.4, 1.4 / Math.max(1, sc * .8)) }); drawMonster(tmp, 80, 100, { t: T, face: -1 }); }
    else { PAINT = '#6a4a2a'; const tmp = Object.assign({}, e, { scale: Math.min(1.4, 1.4 / Math.max(1, (e.scale || 1) * .8)) }); drawMonster(tmp, 80, 100, { t: 0, face: -1 }); PAINT = null; }
    useCtx(wctx); g.imageSmoothingEnabled = false; g.drawImage(codexC, x + 50, y + 70, 390, 268);
    UI.text(known ? e.name : '???', x + w / 4, y + 370, { align: 'center', size: 24, col: '#3a1a0a', shadow: false });
    UI.text(known ? `${AREAS[e.area].name} · ${e.boss ? 'BOSS' : 'Level ' + e.lvl} · ${e.trait}` : AREAS[e.area].name, x + w / 4, y + 394, { align: 'center', size: 13, col: '#6a4a2a', shadow: false, bold: false });
    UI.para(known ? e.codex : 'Not yet encountered. Probably unpleasant.', x + 40, y + 430, w / 2 - 90, { size: 15, col: '#3a2414', shadow: false, lh: 21, italic: true });
    if (known) UI.text(`Defeated: ${known.kills}`, x + 40, y + h - 30, { size: 14, col: '#6a2a14', shadow: false });
    // right page — list
    const px = x + w / 2 + 30, pages = Math.ceil(ids.length / 26); page = clamp(page, 0, pages - 1); ids.slice(page * 26, page * 26 + 26).forEach((id, i) => { const col = i < 13 ? 0 : 1, row = i % 13; const bx = px + col * 225, by = y + 40 + row * 38; const k = S.codex[id]; g.globalAlpha = this.a;
      if (UI.btn(k ? ENEMY[id].name : '— ??? —', bx, by, 215, 32, { style: 'ghost', align: 'left', size: 14, col: id === sel ? '#8a2a14' : k ? '#3a2414' : '#8a7a5a', sound: 'page', id: 'cx' + id })) sel = id;
      if (id === sel) { g.fillStyle = 'rgba(138,42,20,.15)'; g.fillRect(bx, by, 215, 32); } });
    if (pages > 1) { if (UI.btn('◀', x + w / 2 + 30, y + h - 50, 44, 34, { disabled: page <= 0, sound: 'page' })) page--; UI.text(`Page ${page + 1}/${pages}`, x + w / 2 + 130, y + h - 27, { align: 'center', size: 13, col: '#6a4a2a', shadow: false }); if (UI.btn('▶', x + w / 2 + 186, y + h - 50, 44, 34, { disabled: page >= pages - 1, sound: 'page' })) page++; }
    if (UI.btn('Close', x + w - 150, y + h - 50, 120, 34)) { Overlays.pop(ov); }
    const n = Object.keys(S.codex).length; UI.text(`${n} / ${ids.length} discovered`, x + w - 180, y + h - 24, { size: 13, col: '#6a4a2a', shadow: false, align: 'right', bold: false });
    g.globalAlpha = 1;
  } });
}
