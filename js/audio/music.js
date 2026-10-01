'use strict';
/* =========================================================
   MUSIC ENGINE — data-driven layered sequencer
   ========================================================= */
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], hminor: [0, 2, 3, 5, 7, 8, 11], phryg: [0, 1, 3, 5, 7, 8, 10], mixo: [0, 2, 4, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11] };
function degMidi(d, scale, root) { const s = SCALES[scale], o = Math.floor(d / 7), i = ((d % 7) + 7) % 7; return root + o * 12 + s[i]; }
function parseSeq(str) { return str.replace(/\|/g, ' ').trim().split(/\s+/); }
const Music = {
  cur: null, pending: null, layerVol: {}, stepT: 0, step: 0,
  play(name, fade = 1.2) {
    if (this.curName === name && this.cur) return;
    this.curName = name; this.pending = { name, fade };
    if (Audio.ctx) this._start();
  },
  stop(fade = .6) { this.curName = null; this.pending = null; if (this.cur && Audio.ctx) { const t = Audio.ctx.currentTime; this.cur.out.gain.cancelScheduledValues(t); this.cur.out.gain.setTargetAtTime(0.0001, t, fade / 3); const old = this.cur; setTimeout(() => { try { old.out.disconnect(); } catch (e) { } }, fade * 1000 + 800); } this.cur = null; },
  onUnlock() { if (this.pending) this._start(); },
  _start() {
    const { name, fade } = this.pending; this.pending = null; const def = TRACKS[name]; if (!def) return;
    const c = Audio.ctx, t = c.currentTime;
    if (this.cur) { const old = this.cur; old.out.gain.cancelScheduledValues(t); old.out.gain.setTargetAtTime(0.0001, t, fade / 3); setTimeout(() => { try { old.out.disconnect(); } catch (e) { } }, fade * 1000 + 1500); }
    const out = AN.gain(0.0001); out.connect(Audio.musicBus); out.gain.setTargetAtTime(def.vol || 1, t, fade / 3);
    const layers = {};
    for (const k in def.layers) {
      const L = def.layers[k], lg = AN.gain(L.on === false ? 0 : 1); lg.connect(out);
      if (L.verb !== 0) { const sg = AN.gain(L.verb || .35); lg.connect(sg); sg.connect(Audio.verbIn); }
      layers[k] = { def: L, g: lg, on: L.on !== false, seq: L.notes ? parseSeq(L.notes) : null, arp: L.arp || null, pat: L.pat ? Object.fromEntries(Object.entries(L.pat).map(([a, b]) => [a, b.replace(/\s|\|/g, '')])) : null };
    }
    this.cur = { def, out, layers, name, spb: def.spb || 8 };
    this.step = 0; this.stepT = t + .08;
    for (const k in this.layerVol) if (layers[k]) this.setLayer(k, this.layerVol[k], .01);
  },
  setLayer(k, v, time = 1.5) { this.layerVol[k] = v; if (!this.cur || !this.cur.layers[k] || !Audio.ctx) return; const L = this.cur.layers[k]; L.on = v > .01; L.g.gain.setTargetAtTime(v, Audio.ctx.currentTime, time / 3); },
  resetLayers() { this.layerVol = {}; },
  update() {
    if (!Audio.ctx || !this.cur) return; const c = Audio.ctx, cur = this.cur, def = cur.def;
    const stepDur = 60 / def.bpm / (cur.spb / 4) * (def.swing ? 1 : 1);
    if (this.stepT < c.currentTime - .5) this.stepT = c.currentTime + .05;
    while (this.stepT < c.currentTime + .18) {
      const s = this.step, spb = cur.spb, bar = Math.floor(s / spb), inBar = s % spb;
      const chords = def.chords || [0], chord = chords[bar % chords.length];
      let st = this.stepT; if (def.swing && inBar % 2 === 1) st += stepDur * def.swing;
      for (const k in cur.layers) {
        const L = cur.layers[k], D = L.def; if (!L.on) continue;
        const inst = INST[D.inst]; const vel = (D.vol || .5) * (0.9 + Math.random() * .15);
        const root = def.root + (D.oct || 0) * 12;
        if (L.seq) {
          const idx = s % L.seq.length, tok = L.seq[idx]; if (tok === '.' || tok === '_') continue;
          let len = 1; while (L.seq[(idx + len) % L.seq.length] === '_' && len < 16) len++;
          const toks = tok.split(',');
          for (let tk of toks) { let d; if (tk[0] === 'r') d = chord + (parseInt(tk.slice(1)) || 0); else d = parseInt(tk); if (isNaN(d)) continue; inst(st, mtof(degMidi(d, def.scale, root)), stepDur * len * (D.leg || .95), vel, L.g); }
        } else if (L.arp) {
          const every = D.every || 1; if (inBar % every) continue; const a = L.arp[(Math.floor(s / every)) % L.arp.length]; if (a === null) continue;
          inst(st, mtof(degMidi(chord + a, def.scale, root)), stepDur * every * (D.leg || 1), vel, L.g);
        } else if (D.chord) {
          if (inBar !== 0 && !(D.chord === 2 && inBar === spb / 2)) continue; const len = D.chord === 2 ? spb / 2 : spb;
          (D.voicing || [0, 2, 4]).forEach(v2 => inst(st, mtof(degMidi(chord + v2, def.scale, root)), stepDur * len, vel * .7, L.g));
        } else if (L.pat) {
          for (const dk in L.pat) { const p = L.pat[dk], ch = p[s % p.length]; if (ch === 'x' || ch === 'X' || ch === 'o') { const fn = { k: 'kick', f: 'frame', h: 'hand', b: 'brush', s: 'snare', t: 'timp', a: 'anvil', z: 'shaker', e: 'heart' }[dk]; INST[fn](st, dk === 't' ? mtof(degMidi(chord, def.scale, def.root - 24)) : 0, stepDur, vel * (ch === 'X' ? 1.3 : ch === 'o' ? .55 : 1), L.g); } }
        }
      }
      this.step++; this.stepT += stepDur;
    }
  },
  sting(kind) {
    if (!Audio.ctx) return; const t = Audio.ctx.currentTime + .02, o = AN.gain(1); o.connect(Audio.musicBus); const sg = AN.gain(.4); o.connect(sg); sg.connect(Audio.verbIn);
    const R = 62, sc = 'major';
    const seqs = {
      victory: [[0, 0, .14, 'brass'], [2, .14, .14, 'brass'], [4, .28, .14, 'brass'], [7, .42, .6, 'brass'], [4, .42, .6, 'strings'], [0, .42, .8, 'strings']],
      level: [[4, 0, .1, 'celesta'], [7, .1, .1, 'celesta'], [9, .2, .1, 'celesta'], [11, .3, .5, 'celesta'], [7, .3, .6, 'harp'], [14, .45, .7, 'bell']],
      upgrade: [[0, 0, .1, 'bell'], [4, .08, .1, 'bell'], [7, .16, .5, 'bell'], [4, .16, .6, 'harp']],
      quest: [[4, 0, .12, 'celesta'], [7, .12, .4, 'celesta']],
      lullaby: [[4, 0, .4, 'musicbox'], [2, .4, .4, 'musicbox'], [3, .8, .4, 'musicbox'], [1, 1.2, .4, 'musicbox'], [0, 1.6, 1, 'musicbox']],
      breakready: [[0, 0, .15, 'bell'], [4, .1, .15, 'bell'], [9, .2, .5, 'bell']],
      discover: [[2, 0, .1, 'harp'], [4, .09, .1, 'harp'], [6, .18, .1, 'harp'], [9, .27, .5, 'harp']],
      raid: [[0, 0, .5, 'brass'], [-1, .5, .5, 'brass'], [0, 1, .9, 'brass']],
      boss: [[0, 0, .6, 'brass'], [1, .3, .6, 'brass'], [0, .6, 1.2, 'choir']],
      death: [[0, 0, 1.2, 'organ'], [-2, .6, 1.5, 'organ']]
    };
    const s2 = kind === 'raid' || kind === 'boss' || kind === 'death' ? 'phryg' : sc;
    (seqs[kind] || []).forEach(([d, at, dur, inst]) => INST[inst](t + at, mtof(degMidi(d, s2, R)), dur, .5, o));
    setTimeout(() => { try { o.disconnect(); } catch (e) { } }, 4000);
  }
};
/* ---------------- TRACK DATA (all original compositions) ---------------- */
const VILLAGE_MEL = '4 _ 2 _ 3 4 5 _ | 4 _ 2 _ 0 _ . . | 1 _ 2 3 4 _ 3 2 | 1 _ _ _ -1 _ . . | 4 _ 2 _ 3 4 5 _ | 7 _ 6 5 4 _ 5 6 | 5 _ 4 2 3 _ 1 _ | 0 _ _ _ . . . .';
const LUCIEN_MEL = '0 _ _ 1 0 _ -1 _ | -2 _ _ _ . . . . | 0 _ 3 _ 2 _ 1 0 | 1 _ _ _ . . . . | 3 _ _ 4 3 _ 1 _ | 0 _ _ _ -1 _ . . | -2 _ 0 _ 1 _ 0 -1 | 0 _ _ _ . . . .';
const TRACKS = {
  title: { bpm: 70, root: 50, scale: 'hminor', chords: [0, 5, 3, 4], layers: {
    low: { inst: 'strings', chord: 1, oct: -1, vol: .5, voicing: [0, 4, 7] },
    pluck: { inst: 'guitar', notes: '0 . 2 . 3 _ 2 0 | -1 _ _ . -3 . . . | 0 . 2 . 3 _ 5 4 | 3 _ 2 _ _ . . .', oct: 1, vol: .45 },
    choir: { inst: 'choir', chord: 1, oct: 0, vol: .3, voicing: [0, 4] },
    bell: { inst: 'bell', notes: '7 . . . . . . . | . . . . . . . . | . . . . 9 . . . | . . . . . . . .', oct: 1, vol: .12 },
    drum: { inst: 'frame', pat: { f: 'x.......|........|x.....o.|........' }, vol: .45 } } },
  intro: { bpm: 56, root: 48, scale: 'phryg', chords: [0, 0, 1, 0, 5, 5, 1, 0], layers: {
    organ: { inst: 'organ', chord: 1, oct: -1, vol: .45, voicing: [0, 4, 7] },
    mel: { inst: 'organ', notes: LUCIEN_MEL, oct: 1, vol: .3 },
    choir: { inst: 'choir', chord: 1, vol: .35, voicing: [0, 2, 4] },
    heart: { inst: 'heart', pat: { e: 'x.......' }, vol: .6 } } },
  creation: { bpm: 108, root: 55, scale: 'major', chords: [0, 3, 4, 0, 5, 3, 1, 4], layers: {
    lute: { inst: 'lute', arp: [0, 2, 4, 7, 4, 2, 4, 2], oct: 0, vol: .3 },
    flute: { inst: 'flute', notes: '0 2 4 _ 5 4 2 _ | 3 _ 1 _ -1 _ . . | 0 2 4 _ 7 _ 6 5 | 4 _ _ _ . . . . | 5 _ 4 2 0 _ 2 3 | 3 _ 5 _ 4 _ 2 _ | 1 _ 2 _ 3 _ 1 _ | 4 _ _ _ . . . .', oct: 1, vol: .35 },
    bass: { inst: 'bass', notes: 'r . . . r4 . . .', oct: -2, vol: .45 },
    perc: { inst: 'hand', pat: { h: 'x..x..x.', z: '..x...x.' }, vol: .35 } } },
  village_day: { bpm: 100, root: 62, scale: 'major', chords: [0, 0, 4, 4, 0, 3, 4, 0], swing: .12, layers: {
    mel: { inst: 'flute', notes: VILLAGE_MEL, oct: 0, vol: .32 },
    lute: { inst: 'lute', arp: [0, 4, 7, 4, 2, 4, 7, 4], oct: -1, vol: .22 },
    bass: { inst: 'bass', notes: 'r . . . r4 . r . ', oct: -2, vol: .4 },
    perc: { inst: 'hand', pat: { h: 'x...x.x.', z: '..x...x.' }, vol: .28 } } },
  village_night: { bpm: 74, root: 62, scale: 'major', chords: [0, 0, 4, 4, 5, 3, 4, 0], layers: {
    mel: { inst: 'clarinet', notes: VILLAGE_MEL, oct: -1, vol: .28 },
    harp: { inst: 'harp', arp: [0, 4, 7, null, 9, null, 7, null], oct: -1, vol: .22 },
    pad: { inst: 'strings', chord: 1, oct: -1, vol: .22 } } },
  home: { bpm: 68, root: 62, scale: 'major', chords: [0, 0, 4, 4, 0, 3, 4, 0], layers: {
    box: { inst: 'musicbox', notes: VILLAGE_MEL, oct: 0, vol: .3 },
    harp: { inst: 'harp', arp: [0, null, 4, null, 7, null, 4, null], oct: -1, vol: .2 } } },
  cathedral: { bpm: 54, root: 53, scale: 'major', chords: [0, 3, 5, 4], layers: {
    organ: { inst: 'organ', chord: 1, oct: -1, vol: .35, voicing: [0, 2, 4, 7] },
    choir: { inst: 'choir', notes: '4 _ _ _ 3 _ 2 _ | 1 _ _ _ _ _ . . | 2 _ _ _ 3 _ 4 _ | 0 _ _ _ _ _ . .', oct: 0, vol: .3 },
    bell: { inst: 'bell', notes: '0 . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . .', oct: 0, vol: .1 } } },
  smith: { bpm: 104, root: 57, scale: 'dorian', chords: [0, 0, 6, 3], layers: {
    bass: { inst: 'bass', notes: '0 . 0 4 . 0 . 3', oct: -2, vol: .5 },
    reed: { inst: 'bassoon', notes: '0 _ 2 3 4 _ 3 2 | 3 _ 1 _ 0 _ . . | 6 _ 4 _ 5 4 3 1 | 2 _ _ _ . . . .', oct: 0, vol: .35 },
    anvil: { inst: 'anvil', pat: { a: 'x...x.o.', f: 'x.....x.' }, vol: .35 } } },
  merchant: { bpm: 118, root: 58, scale: 'major', chords: [0, 1, 4, 0], layers: {
    clar: { inst: 'clarinet', notes: '0 . 4 . 3 2 1 . | 2 . 5 . 4 3 2 . | 3 4 5 . 1 . 4 . | 2 . 1 . 0 . . .', oct: 0, vol: .32 },
    pizz: { inst: 'pizz', arp: [0, 4, 2, 4], every: 2, oct: 0, vol: .3 },
    bsn: { inst: 'bassoon', notes: 'r . . r4 . . r . ', oct: -2, vol: .38 },
    perc: { inst: 'shaker', pat: { z: '..x...x.', h: 'x.......' }, vol: .3 } } },
  overworld: { bpm: 112, root: 50, scale: 'mixo', chords: [0, 6, 3, 0, 0, 6, 4, 4], layers: {
    mel: { inst: 'flute', notes: '0 _ 4 _ 5 _ 6 7 | 6 _ 4 _ _ _ . . | 3 _ 4 5 6 _ 5 4 | 3 _ 2 _ 1 _ . . | 0 _ 4 _ 5 _ 6 7 | 9 _ 8 _ 7 _ 6 _ | 5 _ 4 _ 3 _ 2 _ | 4 _ _ _ . . . .', oct: 1, vol: .3 },
    horn: { inst: 'brass', chord: 1, oct: -1, vol: .22, voicing: [0, 4] },
    str: { inst: 'strings', arp: [0, 4, 7, 4], every: 2, oct: 0, vol: .2 },
    bass: { inst: 'bass', notes: 'r . r . r . r4 .', oct: -2, vol: .42 },
    drum: { inst: 'frame', pat: { f: 'x...x...', h: '..x..xx.' }, vol: .35 } } },
  // combat — region themes
  c0: { bpm: 126, root: 52, scale: 'dorian', chords: [0, 0, 6, 3], layers: {
    mel: { inst: 'pluck', notes: '0 . 2 3 4 . 3 2 | 3 . 4 . 2 . . . | 6 . 5 4 3 . 4 5 | 4 . 2 . 0 . . .', oct: 1, vol: .35 },
    har: { inst: 'guitar', arp: [0, 4, 2, 4], every: 2, vol: .22 },
    bass: { inst: 'bass', notes: 'r . r . r r . .', oct: -2, vol: .45 },
    perc: { inst: 'hand', pat: { k: 'x...x...', h: '..x..xx.', z: 'x.x.x.x.' }, vol: .4 },
    pulse: { inst: 'pizz', notes: 'r r r r r r r r', oct: 0, vol: .25, on: false },
    low: { inst: 'heart', pat: { e: 'x.......' }, vol: .5, on: false },
    boss2: { inst: 'brass', chord: 2, oct: -1, vol: .25, voicing: [0, 4], on: false } } },
  c1: { bpm: 120, root: 57, scale: 'minor', chords: [0, 5, 6, 4], layers: {
    mel: { inst: 'flute', notes: '4 _ 3 4 7 _ 6 4 | 3 _ 2 _ 0 _ . . | 4 _ 5 6 7 _ 9 7 | 6 _ 4 _ 2 _ . .', oct: 1, vol: .3 },
    har: { inst: 'clarinet', arp: [0, 2, 4, 2], every: 2, oct: -1, vol: .22 },
    bass: { inst: 'bass', notes: 'r . . r r . r .', oct: -2, vol: .45 },
    perc: { inst: 'frame', pat: { f: 'x..x..x.', h: '.xx..x.x', b: 'x.x.x.x.' }, vol: .42 },
    pulse: { inst: 'marimba', notes: 'r r r r r r r r', oct: 0, vol: .25, on: false },
    low: { inst: 'heart', pat: { e: 'x.......' }, vol: .5, on: false },
    boss2: { inst: 'timp', pat: { t: 'x...x.x.' }, vol: .5, on: false } } },
  c2: { bpm: 112, root: 50, scale: 'hminor', chords: [0, 3, 4, 0, 5, 3, 4, 4], layers: {
    hc: { inst: 'harpsichord', arp: [0, 2, 4, 7, 4, 2, 4, 2], oct: 0, vol: .32 },
    mel: { inst: 'celesta', notes: '4 . . 5 4 . 2 . | 3 . . . 0 . . . | 4 . . 5 7 . 6 . | 4 . . . . . . .', oct: 0, vol: .3 },
    pad: { inst: 'choir', chord: 1, vol: .25 },
    bass: { inst: 'bass', notes: 'r . . . r4 . . .', oct: -2, vol: .45 },
    perc: { inst: 'frame', pat: { f: 'x.......', s: '....x...', b: '..x...x.' }, vol: .38 },
    pulse: { inst: 'pizz', notes: 'r . r . r . r .', oct: -1, vol: .28, on: false },
    low: { inst: 'heart', pat: { e: 'x.......' }, vol: .5, on: false },
    boss2: { inst: 'organ', chord: 1, oct: -1, vol: .3, on: false } } },
  c3: { bpm: 132, root: 55, scale: 'lydian', spb: 7, chords: [0, 1, 0, 4], layers: {
    mar: { inst: 'marimba', notes: '0 4 3 . 6 4 . | 3 5 4 . 1 . . | 0 4 3 . 7 6 4 | 3 . 1 . 0 . .', oct: 1, vol: .35 },
    clar: { inst: 'clarinet', notes: '4 _ _ 3 _ 1 _ | 2 _ _ _ . . . | 4 _ _ 6 _ 5 _ | 4 _ _ _ . . .', oct: 0, vol: .25 },
    bass: { inst: 'bass', notes: 'r . . r4 . r .', oct: -2, vol: .45 },
    perc: { inst: 'hand', pat: { k: 'x..x...', h: '.x..xx.', z: 'xxxxxxx' }, vol: .38 },
    pulse: { inst: 'pizz', notes: 'r r r r r r r', oct: 0, vol: .25, on: false },
    low: { inst: 'heart', pat: { e: 'x......' }, vol: .5, on: false },
    boss2: { inst: 'brass', chord: 1, oct: -1, vol: .22, voicing: [0, 3], on: false } } },
  c4: { bpm: 132, root: 48, scale: 'minor', chords: [0, 5, 3, 4], layers: {
    brass: { inst: 'brass', notes: '0 _ _ 2 3 _ 2 0 | -1 _ _ _ -3 _ . . | 0 _ _ 2 3 _ 5 4 | 3 _ 2 _ -1 _ . .', oct: 0, vol: .36 },
    str: { inst: 'strings', arp: [0, 0, 4, 0, 2, 0, 4, 0], oct: -1, vol: .26, leg: .5 },
    bass: { inst: 'bass', notes: 'r r . r r . r .', oct: -2, vol: .45 },
    perc: { inst: 'snare', pat: { k: 'x..x..x.', s: '....x...', t: 'x.......' }, vol: .4 },
    pulse: { inst: 'pizz', notes: 'r r r r r r r r', oct: 1, vol: .22, on: false },
    low: { inst: 'heart', pat: { e: 'x.......' }, vol: .5, on: false },
    boss2: { inst: 'choir', chord: 1, vol: .3, on: false } } },
  lucien_boss: { bpm: 128, root: 48, scale: 'phryg', chords: [0, 0, 1, 0, 5, 5, 1, 0], layers: {
    mel: { inst: 'brass', notes: LUCIEN_MEL.replace(/_/g, '_'), oct: 0, vol: .38 },
    org: { inst: 'organ', chord: 1, oct: -1, vol: .3, voicing: [0, 4, 7] },
    str: { inst: 'strings', arp: [0, 1, 0, 4, 0, 1, 0, 3], oct: 0, vol: .25, leg: .5 },
    bass: { inst: 'bass', notes: 'r r . r r . r r', oct: -2, vol: .45 },
    perc: { inst: 'snare', pat: { k: 'x..x..x.', t: 'x.......' }, vol: .42 },
    pulse: { inst: 'pizz', notes: 'r r r r r r r r', oct: 1, vol: .2, on: false },
    low: { inst: 'heart', pat: { e: 'x.......' }, vol: .5, on: false },
    boss2: { inst: 'choir', chord: 1, vol: .4, voicing: [0, 2, 4], on: false },
    boss2p: { inst: 'snare', pat: { s: '..x.x..x', h: 'xxxxxxxx' }, vol: .35, on: false } } },
  ending: { bpm: 72, root: 55, scale: 'major', chords: [0, 0, 4, 4, 0, 3, 4, 0], layers: {
    mel: { inst: 'flute', notes: VILLAGE_MEL, oct: 1, vol: .3 },
    harp: { inst: 'harp', arp: [0, 4, 7, 9, 7, 4, 2, 4], oct: -1, vol: .22 },
    str: { inst: 'strings', chord: 1, oct: -1, vol: .25 } } },
  credits: { bpm: 104, root: 55, scale: 'major', chords: [0, 0, 4, 4, 0, 3, 4, 0], swing: .1, layers: {
    mel: { inst: 'flute', notes: VILLAGE_MEL, oct: 1, vol: .3 },
    brass: { inst: 'brass', chord: 1, oct: -1, vol: .18, voicing: [0, 4] },
    lute: { inst: 'lute', arp: [0, 4, 7, 4, 2, 4, 7, 4], oct: -1, vol: .22 },
    bass: { inst: 'bass', notes: 'r . . . r4 . r .', oct: -2, vol: .4 },
    perc: { inst: 'frame', pat: { f: 'x...x...', h: '..x...xx', z: 'x.x.x.x.' }, vol: .32 } } },
  road: { bpm: 90, root: 57, scale: 'dorian', chords: [0, 3, 0, 6], layers: {
    guit: { inst: 'guitar', arp: [0, 4, 7, 4], every: 2, oct: -1, vol: .28 },
    mel: { inst: 'clarinet', notes: '4 _ 3 _ 2 _ 0 _ | 1 _ _ _ . . . . | 2 _ 3 _ 4 _ 6 _ | 4 _ _ _ . . . .', oct: 0, vol: .25 },
    perc: { inst: 'brush', pat: { b: 'x.x.x.x.' }, vol: .3 } } }
};
// boss themes derive from regional motifs
['c0', 'c1', 'c2', 'c3', 'c4'].forEach((k, i) => { const b = JSON.parse(JSON.stringify(TRACKS[k])); b.bpm += 10; b.layers.bossdrum = { inst: 'timp', pat: { t: 'x.....x.', k: 'x...x...' }, vol: .45 }; if (b.spb === 7) b.layers.bossdrum.pat = { t: 'x......', k: 'x..x...' }; TRACKS['b' + i] = b; });
