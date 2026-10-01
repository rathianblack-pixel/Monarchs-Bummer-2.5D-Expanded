'use strict';
/* =========================================================
   TRAVELLERS — Part 4 (Octopath structure)
   · Travellers journal (TRAVEL button): who you've met, their chapters,
     who leads in battle, secondary job, town reputation
   · Path Actions on townsfolk (INQUIRE / STEAL / CHALLENGE / PROVOKE)
   · Path side quests (hooked into the existing Quests system)
   Content lives in data/travellers.js; battle-side rules in combat/boost.js.
   ========================================================= */
Object.assign(QUEST_DEFS, PATH_QUESTS);
const Travel = {
  st() { if (!S.trav) S.trav = { lead: 'hero', ch: {}, rep: { village: 3, port: 3 }, pa: {}, stolen: {}, job: null, seen: {}, barkSeen: {} }; const t = S.trav; t.rep = t.rep || { village: 3, port: 3 }; t.pa = t.pa || {}; t.stolen = t.stolen || {}; t.ch = t.ch || {}; t.seen = t.seen || {}; t.barkSeen = t.barkSeen || {}; return t; },
  has(id) { if (!S) return false; if (id === 'hero') return true; if (id === 'brendan') return (S.shards || []).includes('brendan'); return (S.party || []).includes(id); },
  list() { return Object.keys(TRAVELLERS).filter(id => this.has(id)); },
  lead() { const l = this.st().lead; return l && this.has(l) ? l : 'hero'; },
  name(id) { const n = TRAVELLERS[id].name; return typeof n === 'function' ? n() : n; },
  clsOf(id) { return id === 'hero' ? (this.homeCls || S.cls) : TRAVELLERS[id].cls; },
  jobOpen() { return S && (S.level >= 5 || !!S.bosses.barnaby); },
  job() { const j = this.st().job; return this.jobOpen() && j && CLASSES[j] && j !== S.cls ? j : null; },
  // the look a traveller is drawn with (used by battle + portraits)
  look(id, o) {
    if (id === 'brendan') return BRENDAN_LOOK(o);
    if (COMP_LOOK[id]) { const c = CLASSES[TRAVELLERS[id].cls]; return COMP_LOOK[id](Object.assign({ element: c.element }, o)); }
    return null;
  },
  fig(id, x, y, o) { if (id === 'hero') drawChar(x, y, playerLook(Object.assign({ weapon: CLASSES[this.clsOf('hero')].weapon }, o))); else if (id === 'honk' || id === 'pell' || id === 'lucien') drawCompanion(id, x, y, o); else drawChar(x, y, this.look(id, o)); },
  portrait(id, x, y, sc, o = {}) { // draw a pixel figure onto the UI canvas (g) via a tiny offscreen canvas
    const pc = this.pc || (this.pc = mkCanvas(64, 76)); const [c, cx] = pc; cx.clearRect(0, 0, 64, 76); const p = useCtx(cx);
    try { this.fig(id, 32, 72, Object.assign({ s: 1, t: T, face: 1 }, o)); } catch (e) { console.error(e); } useCtx(p);
    const sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(c, x - 32 * sc, y - 72 * sc, 64 * sc, 76 * sc); g.imageSmoothingEnabled = sm;
  },
  // ---------- reputation ----------
  rep(town) { return this.st().rep[town] === undefined ? 3 : this.st().rep[town]; },
  hurtRep(town) { const t = this.st(); t.rep[town] = Math.max(0, this.rep(town) - 1); SFX.play('error'); Toast.add(`Reputation in ${town === 'port' ? 'Port Mopeway' : 'Placenta Creek'} fell (${t.rep[town]}/3)`, COL.red, '▼'); },
  amends(town) { if (S.coins < 50) { SFX.play('error'); Toast.add('Making amends costs 50 coins', COL.red); return; } addCoins(-50); this.st().rep[town] = 3; SFX.play('coin'); Toast.add('You buy a round, apologise, and mean it. Reputation restored.', COL.green, '♥'); Save.save(true); },
  // ---------- path actions ----------
  done(key, act) { return !!this.st().pa[key + ':' + act]; },
  inquireOdds(npc) { return clamp(.92 - npc.lvl * .09 + S.level * .012, .2, .92); },
  options(key) { // [{act, who, label, sub, ok, run}]
    const N = PATH_NPCS[key], out = [], town = N.town, rep0 = this.rep(town) <= 0;
    const add = (act, who, sub, ok) => out.push({ act, who, label: `${PATH_ACTIONS[act].name} · ${who === 'hero' ? 'You' : this.name(who).replace('Sir ', '')}`, sub: rep0 ? 'reputation ruined' : sub, ok: ok && !rep0 });
    const inq = this.done(key, 'inquire');
    add('inquire', 'hero', inq ? 'already learned' : `${Math.round(this.inquireOdds(N) * 100)}% · fail costs reputation`, true);
    if (this.has('pell')) { const req = N.lvl * 3; add('inquire', 'pell', inq ? 'already learned' : S.level >= req ? 'always works' : `needs Lv ${req}`, S.level >= req); }
    if (this.has('honk')) { const left = N.steal.filter(([it]) => !this.st().stolen[key + ':' + it]); add('steal', 'honk', left.length ? left.map(([it, c]) => `${ITEMS[it].name} ${Math.round(c * 100)}%`).join(' · ') : 'pockets empty', left.length > 0); }
    if (this.has('brendan')) { const c = N.challenge; add('challenge', 'brendan', this.done(key, 'challenge') ? 'already settled' : c.refuse ? 'they may decline' : `duel · Lv ${c.lvl + 1} foe`, !this.done(key, 'challenge')); }
    if (this.has('lucien')) { const c = N.provoke; add('provoke', 'lucien', this.done(key, 'provoke') ? 'already settled' : `champion · Lv ${c.lvl + 1}`, !this.done(key, 'provoke')); }
    return out;
  },
  menu(key, voice, talk, done) { // overlay: TALK + path actions
    const N = PATH_NPCS[key]; let mode = 'main', k = 0; SFX.play('page');
    const close = () => { Overlays.pop(ov); if (done) done(); };
    const ov = Overlays.push({ name: 'pathmenu', update: dt => { k = Math.min(1, k + dt * 5); }, draw: () => {
      const opts = this.options(key), rows = mode === 'steal' ? N.steal.length + 1 : opts.length + 1, w = 560, h = 116 + rows * 50, x = 640 - w / 2, y = 700 - h - 10 + (1 - Ease.outQ(k)) * 40;
      g.globalAlpha = k; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, 1280, 720);
      UI.panel(x, y, w, h, { bg: 'rgba(18,13,24,.95)' });
      UI.text(N.name, x + 26, y + 38, { size: 20, col: COL.gold2 }); UI.text(`Lv ${N.lvl} · ${N.town === 'port' ? 'Port Mopeway' : 'Placenta Creek'}`, x + w - 26, y + 38, { size: 13, col: COL.dim, align: 'right', bold: false });
      const rp = this.rep(N.town); UI.text('Reputation', x + 26, y + 64, { size: 12, col: COL.dim, bold: false }); for (let i = 0; i < 3; i++) { g.fillStyle = i < rp ? '#f0a0b0' : 'rgba(255,255,255,.15)'; g.fillRect(x + 110 + i * 18, y + 54, 12, 12); }
      let yy = y + 82;
      if (mode === 'main') {
        if (UI.btn('TALK', x + 26, yy, w - 52, 40, { accent: true, key: ['1'], id: 'pm_talk', sub: 'chat as normal' })) { Overlays.pop(ov); talk(); return; } yy += 50;
        opts.forEach((o, i) => {
          const col = PATH_ACTIONS[o.act].col;
          if (UI.btn(o.label, x + 26, yy, w - 52, 40, { disabled: !o.ok, key: [String(i + 2)], id: 'pm' + i, sub: o.sub, size: 14 })) { if (o.act === 'steal') { mode = 'steal'; SFX.play('page'); } else { Overlays.pop(ov); this.run(key, o, voice, done); } }
          g.fillStyle = col; g.fillRect(x + 26, yy + 4, 4, 32); yy += 50;
        });
      } else {
        N.steal.forEach(([it, c], i) => { const got = this.st().stolen[key + ':' + it]; if (UI.btn(`${ITEMS[it].name}${got ? ' (taken)' : ''}`, x + 26, yy, w - 52, 40, { disabled: !!got, id: 'ps' + i, key: [String(i + 1)], sub: `${Math.round(c * 100)}% chance · Sir Honkington`, size: 14 })) { Overlays.pop(ov); this.steal(key, it, c, voice, done); } yy += 50; });
      }
      if (UI.btn(mode === 'main' ? 'Leave' : 'Back', x + w / 2 - 70, y + h - 50, 140, 36, { key: 'Escape', id: 'pm_close' })) { if (mode === 'main') close(); else mode = 'main'; }
      g.globalAlpha = 1; } });
    return ov;
  },
  run(key, o, voice, done) {
    const N = PATH_NPCS[key], t = this.st(), fin = () => { Save.save(true); if (done) done(); };
    if (o.act === 'inquire') {
      const I = N.inquire, first = !this.done(key, 'inquire');
      if (!first) { Dialog.start([D(N.name, voice, I.t)], fin); return; }
      const ok = o.who === 'pell' || chance(this.inquireOdds(N));
      const lead = o.who === 'pell' ? D('Sister Pell', 'priest', pick(['Go on. I won\'t tell anyone. Except God, who already knows.', 'You look like you\'re carrying something heavy. Is it a secret? Hand it here.', 'Confession is free on Tuesdays. It\'s always Tuesday for you.'])) : D(S.name, 'player', pick(['So… heard anything interesting lately?', 'I\'m not prying. I\'m asking with my face.', 'Any rumours? I collect them. Like stamps, but worse.']));
      if (!ok) { Dialog.start([lead, D(N.name, voice, pick(['Why do you want to know? Who sent you?', 'That\'s a nosy question for a Tuesday.', 'I don\'t talk to heroes. They always want something.'])), D('', 'narrator', '', { t: 'They clam up. Word gets around.', fx: () => this.hurtRep(N.town) })], fin); return; }
      t.pa[key + ':inquire'] = 1; SFX.play('quest');
      const L = [lead, D(N.name, voice, I.t)];
      const gifts = []; if (I.item) gifts.push(I.item); if (I.item2) gifts.push(I.item2);
      if (gifts.length || I.coins) L.push(D('', 'narrator', '', { t: `Learned a secret.${gifts.length ? ' Received: ' + gifts.map(i => ITEMS[i].name).join(', ') + '.' : ''}${I.coins ? ' +' + I.coins + ' coins.' : ''}`, fx: () => { gifts.forEach(i => addItem(i)); if (I.coins) addCoins(I.coins); } }));
      if (I.quest && !S.quests[I.quest]) L.push(D('', 'narrator', '', { t: `New side quest: ${PATH_QUESTS[I.quest].name}.`, fx: () => Quests.start(I.quest) }));
      Dialog.start(L, fin); return;
    }
    if (o.act === 'challenge' || o.act === 'provoke') {
      const C = N[o.act], who = o.who;
      if (C.refuse) { t.pa[key + ':' + o.act] = 1; Dialog.start([D('Brendan', 'guard', `${N.name}! I challenge you to an honourable duel!`), D('', 'narrator', C.refuse, C.item ? { fx: () => { addItem(C.item); Toast.add('Received: ' + ITEMS[C.item].name, COL.gold2, '+'); } } : {})], fin); return; }
      const open = o.act === 'challenge' ? D('Brendan', 'guard', pick([`${N.name}. You. Me. Now. For the scrapbook.`, 'I challenge you! Mostly so someone sees the cape in action.'])) : D('Lucien', 'lucien', pick(['I\'m going to say something unkind. For therapy reasons.', 'Watch this. My counsellor says I should "use my words".']));
      Dialog.start([open, D('', 'narrator', C.line)], () => this.fight({ lead: who, kind: o.act, key, foe: C.foe, area: C.area, lvl: C.lvl, name: C.name, look: C.look, story: [`${PATH_ACTIONS[o.act].name} · ${N.name.toUpperCase()}`, C.line + (o.act === 'challenge' ? ' Brendan fights alone.' : ' Lucien fights alone.')], alone: true }));
    }
  },
  steal(key, it, c, voice, done) {
    const N = PATH_NPCS[key], t = this.st(); SFX.play('honk', { v: .5 });
    if (chance(c)) { t.stolen[key + ':' + it] = 1; addItem(it); SFX.play('purchase'); Dialog.start([D('', 'narrator', `Sir Honkington waddles past ${N.name}, very casually. When he waddles back, there is a ${ITEMS[it].name} in his beak.`), D(N.name, voice, pick(['Hm? Lovely goose.', 'Is that goose… smirking?', 'What a polite bird.']))], () => { Save.save(true); if (done) done(); }); }
    else Dialog.start([D('', 'narrator', `Sir Honkington goes for the ${ITEMS[it].name}. ${N.name} catches him by the neck.`), D(N.name, voice, pick(['Is this YOUR goose?', 'Hey! HEY! That goose is a thief!', 'Not again with the goose.'])), D('', 'narrator', '', { t: 'Word gets around.', fx: () => this.hurtRep(N.town) })], () => { Save.save(true); if (done) done(); });
  },
  // ---------- battles ----------
  ret() { if (Scene.name === 'port') return { scene: 'port', args: {} }; if (Scene.name === 'village') return { scene: 'village', args: { from: 'load' } }; if (Scene.name === 'overworld2') return { scene: 'overworld2', args: { node: S.map2Node } }; return { scene: 'overworld', args: { node: S.mapNode } }; },
  fight(o) {
    const base = ENEMY[o.foe]; if (!base) return; const def = Object.assign({}, base, o.name ? { name: o.name } : {}); if (o.look) def.look = Object.assign({}, base.look || {}, o.look);
    if (Scene.name === 'village' && Scene.cur && Scene.cur.P) { S.pos = Math.round(Scene.cur.P.x); S.posY = Math.round(Scene.cur.P.y); }
    Save.save(true);
    Scene.go('combat', { area: o.area, lvl: o.lvl, def, story: o.story, trav: { lead: o.lead, kind: o.kind, key: o.key, ch: o.ch, alone: !!o.alone }, ret: this.ret() }, { type: 'iris', out: .5, in: .5 });
  },
  chapter(id) {
    const n = this.st().ch[id] || 0, C = CHAPTERS[id][n]; if (!C) return; const [title, req, text, foe, area, lvl] = C;
    if (S.level < req) { SFX.play('error'); Toast.add(`${title} needs level ${req}`, COL.red); return; }
    this.fight({ lead: id, kind: 'chapter', ch: n, foe, area, lvl, story: [title.split(' · ')[1].toUpperCase(), text] });
  },
  // ---------- quests ----------
  questFor(key) { const N = PATH_NPCS[key]; if (!N) return null; for (const q in PATH_QUESTS) if (PATH_QUESTS[q].giver === N.name && S.quests[q] && S.quests[q].state === 'ready') return q; return null; },
  onWin(d, lines) { if (!d) return; for (const q in PATH_QUESTS) { const Q = PATH_QUESTS[q], s = S.quests[q]; if (s && s.state === 'active' && Q.foe === d.id) { Quests.progress(q); lines.push([`${Q.name} ${S.quests[q].n}/${Q.goal}`, COL.gold2]); } } }
};
{ const _qc = Quests.complete; Quests.complete = function (id) {
  const Q = PATH_QUESTS[id]; if (!Q) return _qc.call(this, id);
  const q = S.quests[id]; if (!q || q.state === 'done') return false; q.state = 'done'; SFX.play('quest'); Music.sting('quest');
  const r = Q.reward; addCoins(r.coins || 0); if (r.item) addItem(r.item, r.n || 1);
  Banner.show('QUEST COMPLETE', `${Q.name} — +${r.coins} coins${r.item ? ', ' + (r.n > 1 ? r.n + '× ' : '') + ITEMS[r.item].name : ''}`, COL.gold2, 3.2); Save.save(true); return true; };
}
// key of a villager in PATH_NPCS (only the gate guard is Hobb)
function pathKey(v) { if (!v) return null; if (v.kind === 'guard') return v.post ? 'guard' : null; return PATH_NPCS[v.kind] ? v.kind : null; }
/* ---------- village + port hooks ---------- */
{ const V = Scenes.village, _in = V.interact;
  V.interact = function (tgt) {
    if (!tgt || tgt.type !== 'npc' || Dialog.open || Overlays.stack.length) return _in.call(this, tgt);
    const v = tgt.v, key = pathKey(v); if (!key) return _in.call(this, tgt);
    const N = PATH_NPCS[key], q = Travel.questFor(key);
    v.state = 'TALK_P'; v.t = 99; v.dir = this.P.x < v.x ? -1 : 1; this.pdir = -v.dir;
    if (q) { Dialog.start([D(N.name, v.voice, pick(['You did it! I can\'t believe it. Well, I can a bit.', 'Is it done? It\'s done! Bless your nosy heart.', 'Word travels fast. Thank you, truly.'])), D('', 'narrator', '', { t: `Quest complete: ${PATH_QUESTS[q].name}`, fx: () => Quests.complete(q) })], () => { v.state = 'IDLE'; v.t = 1.5; }); return; }
    Travel.menu(key, v.voice, () => _in.call(this, tgt), () => { if (v.state === 'TALK_P') { v.state = 'IDLE'; v.t = 1.5; } });
  };
}
{ const PT = Scenes.port, _use = PT.use;
  PT.use = function (id) {
    const key = { shop: 'bev', fisher: 'marnie' }[id];
    if (!key || Overlays.stack.length || Dialog.open) return _use.call(this, id);
    const q = Travel.questFor(key); if (q) { Dialog.start([D(PATH_NPCS[key].name, 'old', 'Gerald says thank you. Gerald is the crab. The other crabs, not so much.'), D('', 'narrator', '', { t: `Quest complete: ${PATH_QUESTS[q].name}`, fx: () => Quests.complete(q) })]); return; }
    Travel.menu(key, key === 'bev' ? 'merchant' : 'old', () => _use.call(this, id));
  };
}
/* ---------- Travellers journal ---------- */
function openTravellers(sel) {
  SFX.play('page'); const t = Travel.st(); let cur = sel || Travel.lead(), tab = 'story';
  const ov = Overlays.push({ name: 'travellers', draw() {
    const P0 = a2Panel('TRAVELLERS', 1060, 620), ids = Object.keys(TRAVELLERS);
    // left column: the five travellers
    ids.forEach((id, i) => { const have = Travel.has(id), x = P0.x + 24, y = P0.y + 70 + i * 104, on = cur === id, T0 = TRAVELLERS[id];
      UI.panel(x, y, 250, 96, { bg: on ? 'rgba(80,60,30,.92)' : 'rgba(40,28,40,.9)' });
      if (have) Travel.portrait(id, x + 44, y + 90, 1.15, { t: T + i, walk: on ? T * 8 : undefined }); else UI.text('?', x + 44, y + 62, { size: 34, col: COL.dim, align: 'center' });
      UI.text(have ? Travel.name(id) : '???', x + 88, y + 34, { size: 15, col: have ? T0.col : COL.dim, maxW: 150 });
      UI.text(have ? PATH_ACTIONS[T0.path].name : 'not met yet', x + 88, y + 54, { size: 12, col: have ? PATH_ACTIONS[T0.path].col : COL.dim, bold: false });
      if (have) UI.text(id === 'hero' ? CLASSES[Travel.clsOf('hero')].name : CLASSES[T0.cls].name + ' fighter', x + 88, y + 72, { size: 11, col: COL.dim, bold: false });
      if (Travel.lead() === id) UI.pill('LEAD', x + 186, y + 8, COL.gold2, { size: 10 });
      if (have && Input.mouse.clicked && UI.inRect(x, y, 250, 96)) { Input.mouse.clicked = false; cur = id; SFX.play('click'); } });
    // right side
    const x = P0.x + 296, y = P0.y + 70, w = P0.w - 320, T0 = TRAVELLERS[cur];
    UI.text(Travel.name(cur), x, y + 22, { size: 24, col: T0.col }); UI.text(T0.title, x, y + 46, { size: 13, col: COL.dim, italic: true, bold: false });
    UI.para(T0.blurb, x, y + 74, w - 10, { size: 14, col: COL.cream, lh: 19 });
    UI.text(`Path Action: ${PATH_ACTIONS[T0.path].name} — ${T0.pathNote}`, x, y + 128, { size: 13, col: PATH_ACTIONS[T0.path].col });
    ['story', 'job', 'town'].forEach((k, i) => { if (UI.btn({ story: 'CHAPTERS', job: 'JOBS', town: 'REPUTATION' }[k], x + i * 150, y + 144, 140, 32, { accent: tab === k, id: 'tt' + k, size: 13 })) tab = k; });
    let yy = y + 196;
    if (tab === 'story') {
      if (cur === 'hero') HERO_CHAPTERS.forEach(([b, title], i) => { const dn = !!S.bosses[b], nx = !dn && (i === 0 || S.bosses[HERO_CHAPTERS[i - 1][0]]); UI.text((dn ? '✔ ' : nx ? '▶ ' : '· ') + title, x, yy + i * 26, { size: 14, col: dn ? COL.green : nx ? COL.gold2 : COL.dim, bold: nx }); if (nx) UI.text('on the map', x + w - 30, yy + i * 26, { size: 12, col: COL.dim, align: 'right', bold: false }); });
      else CHAPTERS[cur].forEach((C, i) => { const n = t.ch[cur] || 0, dn = i < n, nx = i === n, ok = nx && S.level >= C[1], yy2 = yy + i * 92;
        UI.panel(x, yy2, w - 20, 84, { bg: nx ? 'rgba(60,44,30,.9)' : 'rgba(30,22,32,.9)' });
        UI.text((dn ? '✔ ' : '') + C[0], x + 16, yy2 + 26, { size: 15, col: dn ? COL.green : nx ? COL.gold2 : COL.dim, maxW: w - 220 });
        UI.para(nx || dn ? C[2] : 'Locked until the previous chapter is done.', x + 16, yy2 + 46, w - 230, { size: 11, col: COL.cream, lh: 14 });
        if (nx && UI.btn(ok ? 'BEGIN' : `Lv ${C[1]}`, x + w - 180, yy2 + 22, 150, 40, { accent: ok, disabled: !ok, id: 'chb' + i, sub: ok ? `${Travel.name(cur).replace('Sir ', '')} leads` : 'level too low' })) { Overlays.pop(ov); Travel.chapter(cur); } });
      if (UI.btn(Travel.lead() === cur ? 'LEADING BATTLES' : 'SET AS BATTLE LEAD', x, P0.y + P0.h - 64, 240, 40, { accent: Travel.lead() === cur, id: 'tlead', sub: 'fights your normal battles' })) { t.lead = cur; SFX.play('confirm'); Toast.add(`${Travel.name(cur)} now leads in battle`, T0.col, '★'); Save.save(true); }
    } else if (tab === 'job') {
      if (!Travel.jobOpen()) UI.para('Secondary jobs unlock at level 5 or after the first boss. A job adds a sixth battle card (a strike in that job\'s style, 3 mana) and a small passive bonus.', x, yy, w - 20, { size: 14, col: COL.dim, lh: 19 });
      else { UI.para('Pick a secondary job. It adds a JOB card (a strike in that style for 3 mana — handy for hitting a weakness your class can\'t) and a passive bonus.', x, yy, w - 20, { size: 13, col: COL.cream, lh: 18 });
        Object.keys(CLASSES).forEach((k, i) => { const on = t.job === k, xx = x + (i % 3) * 228, y2 = yy + 54 + Math.floor(i / 3) * 104; UI.panel(xx, y2, 216, 94, { bg: on ? 'rgba(80,60,30,.92)' : 'rgba(40,28,40,.9)' }); drawIcon(k, xx + 34, y2 + 40, 40); UI.text(CLASSES[k].name, xx + 66, y2 + 30, { size: 16, col: on ? COL.gold2 : COL.cream }); UI.text(JOB_PASSIVE[k][0], xx + 66, y2 + 50, { size: 11, col: COL.dim, bold: false, maxW: 140 });
          if (UI.btn(on ? 'EQUIPPED' : 'EQUIP', xx + 66, y2 + 58, 130, 28, { accent: on, size: 12, id: 'job' + k })) { t.job = on ? null : k; SFX.play('confirm'); Save.save(true); } });
        UI.text('(A job matching the current leader\'s own class does nothing.)', x, yy + 280, { size: 11, col: COL.dim, bold: false }); }
    } else {
      [['village', 'Placenta Creek'], ['port', 'Port Mopeway']].forEach(([k, n], i) => { const r = Travel.rep(k), y2 = yy + i * 80; UI.panel(x, y2, w - 20, 70, { bg: 'rgba(40,28,40,.9)' }); UI.text(n, x + 18, y2 + 30, { size: 16, col: COL.cream }); for (let j = 0; j < 3; j++) { g.fillStyle = j < r ? '#f0a0b0' : 'rgba(255,255,255,.15)'; g.fillRect(x + 18 + j * 22, y2 + 42, 16, 14); }
        UI.text(r ? (r < 3 ? 'People are a little wary of you.' : 'Townsfolk will hear you out.') : 'Nobody will talk to you about anything.', x + 100, y2 + 54, { size: 12, col: r ? COL.dim : COL.red, bold: false });
        if (r < 3 && UI.btn('MAKE AMENDS · 50c', x + w - 230, y2 + 15, 190, 40, { id: 'am' + k })) Travel.amends(k); });
      UI.para('Failed Inquiries and caught thefts cost reputation. At zero, nobody in that town will let you use path actions until you make amends.', x, yy + 180, w - 20, { size: 13, col: COL.dim, lh: 18 });
    }
    if (UI.btn('Close', P0.x + P0.w - 150, P0.y + P0.h - 60, 120, 38, { key: 'Escape', id: 'tclose' })) Overlays.pop(ov); } });
}
const JOB_PASSIVE = { sword: ['+1 attack', s => s], bow: ['+4% accuracy'], fire: ['+1 attack'], water: ['+3 max HP'], light: ['+5 max HP'] };
{ const _a = Stats.atk, _h = Stats.maxHP, _c = Stats.acc;
  Stats.atk = function () { const j = S && S.trav && Travel.job(); return _a.apply(this, arguments) + (j === 'sword' || j === 'fire' ? 1 : 0); };
  Stats.maxHP = function () { const j = S && S.trav && Travel.job(); return _h.apply(this, arguments) + (j === 'water' ? 3 : j === 'light' ? 5 : 0); };
  Stats.acc = function () { const j = S && S.trav && Travel.job(); return _c.apply(this, arguments) + (j === 'bow' ? .04 : 0); };
}
// TRAVEL button on the hubs and both maps
{ const hd = HUD.draw;
  HUD.draw = function (o = {}) {
    if (o.buttons && ['village', 'port', 'overworld', 'overworld2'].includes(Scene.name) && !o.buttons.some(b => b[0] === 'TRAVEL'))
      o.buttons = o.buttons.concat([['TRAVEL', () => openTravellers(), 'Travellers, chapters & jobs', 70]]);
    return hd.call(this, o);
  };
}
// assist companion steps aside when they are the one leading (or the traveller fights alone)
{ const _pa = Party.active;
  Party.active = function () { const id = _pa.call(this); if (!id || Scene.name !== 'combat') return id; const C = Scenes.combat; if (C.trav && C.trav.alone) return null; if (C.tl && C.tl.lead === id) return null; return id; };
}
