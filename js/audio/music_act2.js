'use strict';
/* =========================================================
   ACT II MUSIC + AMBIENCE + SFX (all procedural)
   Region themes c5–c9 (+ boss variants b5–b9), Act II map, Port Mopeway,
   the detuned Grinhaven calliope, the Bummer's lullaby, endings.
   ========================================================= */
// a fairground calliope that is very slightly, deliberately out of tune
INST.calliope = (t, f, d, v, out) => { INST.reed(t, f * 1.013, d, v * .6, out, 2200, 'square'); INST.organ(t, f * .992, d, v * .5, out); };
INST.wobble = (t, f, d, v, out) => { INST.musicbox(t, f * (1 + Math.sin(t * 3) * .012), d, v, out); };
Object.assign(TRACKS, {
  map2: { bpm: 96, root: 50, scale: 'dorian', chords: [0, 3, 5, 4, 0, 3, 6, 4], swing: .12, layers: {
    mel: { inst: 'clarinet', notes: '4 _ 3 2 0 _ . . | 2 _ 3 4 5 _ 4 _ | 7 _ 6 5 4 _ 2 _ | 3 _ 2 _ 0 _ . .', oct: 1, vol: .28 },
    acc: { inst: 'guitar', arp: [0, 2, 4, 2], every: 2, oct: 0, vol: .2 },
    bass: { inst: 'bass', notes: 'r . . r r . . .', oct: -2, vol: .4 },
    drum: { inst: 'brush', pat: { b: 'x.x.x.x.', h: '...x...x' }, vol: .28 } } },
  port: { bpm: 84, root: 55, scale: 'mixo', chords: [0, 4, 3, 0, 5, 4, 1, 4], swing: .18, layers: {
    mel: { inst: 'reed', notes: '0 _ 2 4 5 _ 4 2 | 4 _ _ _ 2 _ . . | 5 _ 6 7 9 _ 7 5 | 4 _ 2 _ 0 _ . .', oct: 0, vol: .22 },
    acc: { inst: 'lute', chord: 2, oct: -1, vol: .2 },
    bass: { inst: 'bass', notes: 'r . r4 . r . r4 .', oct: -2, vol: .38 },
    drum: { inst: 'hand', pat: { h: 'x..x..x.', z: '..x...x.' }, vol: .25 } } },
  c5: { bpm: 132, root: 55, scale: 'mixo', chords: [0, 3, 4, 0, 5, 3, 4, 4], swing: .1, layers: {
    mel: { inst: 'flute', notes: '0 2 4 _ 5 4 2 _ | 4 5 7 _ 5 _ 4 _ | 2 4 5 _ 4 2 0 _ | 1 _ 2 _ 0 _ . .', oct: 1, vol: .3 },
    har: { inst: 'guitar', arp: [0, 4, 2, 4], every: 2, vol: .22 },
    bass: { inst: 'bass', notes: 'r . r r . r r .', oct: -2, vol: .45 },
    perc: { inst: 'hand', pat: { k: 'x..x..x.', h: '.x.x.x.x', z: 'xxxxxxxx' }, vol: .38 },
    pulse: { inst: 'marimba', notes: 'r r r r r r r r', oct: 0, vol: .25, on: false }, low: { inst: 'heart', pat: { e: 'x.......' }, vol: .5, on: false },
    boss2: { inst: 'brass', chord: 2, oct: -1, vol: .25, voicing: [0, 4], on: false } } },
  c6: { bpm: 104, root: 50, scale: 'phryg', chords: [0, 1, 0, 6, 0, 1, 5, 6], layers: {
    mel: { inst: 'celesta', notes: '4 . . 5 4 . 1 . | 0 . . . . . . . | 4 . 5 . 7 . 5 . | 4 . 1 . 0 . . .', oct: 1, vol: .26 },
    pad: { inst: 'pad', chord: 1, oct: -1, vol: .22 }, bell: { inst: 'bell', arp: [0, null, 4, null, 7, null, 4, null], every: 1, oct: 1, vol: .1 },
    bass: { inst: 'bass', notes: 'r . . . r . . .', oct: -2, vol: .42 },
    perc: { inst: 'frame', pat: { f: 'x.......', h: '....x...' }, vol: .3 },
    pulse: { inst: 'harp', notes: 'r r r r r r r r', oct: 0, vol: .22, on: false }, low: { inst: 'heart', pat: { e: 'x.......' }, vol: .5, on: false },
    boss2: { inst: 'choir', chord: 1, oct: -1, vol: .25, on: false } } },
  c7: { bpm: 118, root: 57, scale: 'hminor', chords: [0, 5, 3, 4, 0, 5, 6, 4], layers: {
    mel: { inst: 'strings', notes: '0 _ 2 3 4 _ 3 2 | 3 _ 4 _ 6 _ 4 _ | 7 _ 6 4 3 _ 2 3 | 4 _ 2 _ 0 _ _ _', oct: 1, vol: .26 },
    har: { inst: 'pizz', arp: [0, 2, 4, 2], every: 1, vol: .18 }, glock: { inst: 'bell', notes: '. . 7 . . . 9 . | . . 7 . . . 4 .', oct: 1, vol: .08 },
    bass: { inst: 'bass', notes: 'r . r . r . r r', oct: -2, vol: .42 },
    perc: { inst: 'snare', pat: { s: '....x...', k: 'x...x.x.', z: 'x.x.x.x.' }, vol: .34 },
    pulse: { inst: 'pizz', notes: 'r r r r r r r r', oct: 0, vol: .25, on: false }, low: { inst: 'heart', pat: { e: 'x.......' }, vol: .5, on: false },
    boss2: { inst: 'brass', chord: 2, oct: -1, vol: .25, voicing: [0, 4], on: false } } },
  c8: { bpm: 124, root: 53, scale: 'lydian', chords: [0, 1, 4, 0, 5, 1, 4, 4], layers: {
    mel: { inst: 'harpsichord', notes: '0 2 4 6 7 _ 6 4 | 7 _ 9 _ 7 _ 6 _ | 4 6 7 9 11 _ 9 7 | 6 _ 4 _ 2 _ . .', oct: 1, vol: .24 },
    har: { inst: 'strings', chord: 2, oct: 0, vol: .18 }, horn: { inst: 'brass', notes: '0 _ _ _ . . . . | 4 _ _ _ . . . .', oct: 0, vol: .14 },
    bass: { inst: 'bass', notes: 'r . r . r . r .', oct: -2, vol: .42 },
    perc: { inst: 'snare', pat: { k: 'x...x...', s: '..x...x.', z: 'xxxxxxxx' }, vol: .32 },
    pulse: { inst: 'harpsichord', notes: 'r r r r r r r r', oct: 0, vol: .2, on: false }, low: { inst: 'heart', pat: { e: 'x.......' }, vol: .5, on: false },
    boss2: { inst: 'brass', chord: 2, oct: -1, vol: .25, voicing: [0, 4], on: false } } },
  c9: { bpm: 138, root: 60, scale: 'major', chords: [0, 4, 5, 3, 0, 4, 1, 4], layers: { // Grinhaven: relentlessly cheerful, slightly out of tune
    mel: { inst: 'calliope', notes: '0 2 4 0 4 _ 2 _ | 4 5 7 4 7 _ 5 _ | 7 9 7 5 4 2 0 _ | 2 _ 4 _ 0 _ . .', oct: 1, vol: .26 },
    oom: { inst: 'calliope', arp: [0, 4, 2, 4], every: 2, oct: -1, vol: .16 }, box: { inst: 'wobble', notes: '. 7 . 4 . 7 . 4', oct: 1, vol: .08 },
    bass: { inst: 'bass', notes: 'r . r4 . r . r4 .', oct: -2, vol: .42 },
    perc: { inst: 'snare', pat: { k: 'x...x...', s: '..x...x.', z: 'x.x.x.x.' }, vol: .3 },
    pulse: { inst: 'calliope', notes: 'r r r r r r r r', oct: 0, vol: .14, on: false }, low: { inst: 'heart', pat: { e: 'x.......' }, vol: .5, on: false },
    boss2: { inst: 'organ', chord: 2, oct: -1, vol: .22, on: false } } },
  whale: { bpm: 56, root: 48, scale: 'major', chords: [0, 5, 3, 4], layers: {
    pad: { inst: 'pad', chord: 1, oct: -1, vol: .3 }, choir: { inst: 'choir', notes: '4 _ _ _ 2 _ _ _ | 0 _ _ _ 1 _ _ _', oct: 0, vol: .16 },
    harp: { inst: 'harp', arp: [0, 2, 4, 7, 4, 2], every: 1, oct: 0, vol: .14 }, bass: { inst: 'bass', notes: 'r _ _ _ . . . .', oct: -2, vol: .3 } } },
  grin_end: { bpm: 150, root: 60, scale: 'major', chords: [0, 4, 0, 4], layers: { mel: { inst: 'calliope', notes: '0 0 4 4 7 7 4 _', oct: 1, vol: .24 }, box: { inst: 'wobble', notes: '7 . 4 . 0 . 4 .', oct: 1, vol: .1 }, drum: { inst: 'snare', pat: { k: 'x.x.x.x.' }, vol: .25 } } }
});
['c5', 'c6', 'c7', 'c8', 'c9'].forEach((k, i) => { const b = JSON.parse(JSON.stringify(TRACKS[k])); b.bpm += 10; b.layers.bossdrum = { inst: 'timp', pat: { t: 'x.....x.', k: 'x...x...' }, vol: .45 }; b.layers.boss2p = { inst: 'choir', chord: 1, oct: 0, vol: .2, on: false }; TRACKS['b' + (i + 5)] = b; });
Object.assign(AMBIENCE, {
  a5: { beds: { wind: .16, river: .12 }, events: [['wave', 5], ['gull', 3], ['creak', 1]], outdoor: true },
  a6: { beds: { drone: .14, river: .05, spectral: .08 }, events: [['bubble', 8], ['whalecall', .6], ['stone', 1]] },
  a7: { beds: { wind: .32 }, events: [['icecrack', 2], ['howl', 1], ['gust', 2]], outdoor: 'snow' },
  a8: { beds: { wind: .26 }, events: [['gust', 3], ['bell', .6], ['bird', 2, 'day']], outdoor: true },
  a9: { beds: { wind: .08, room: .05 }, events: [['applause', 1.2], ['pop', 2], ['chatter', 2]], outdoor: true },
  map2: { beds: { wind: .2, river: .1 }, events: [['wave', 3], ['gull', 2], ['whalecall', .4]], outdoor: true },
  port: { beds: { wind: .14, river: .16 }, events: [['wave', 5], ['gull', 3], ['creak', 2], ['bell', .4]], outdoor: true },
  deep: { beds: { drone: .2, river: .06 }, events: [['bubble', 6], ['whalecall', 1.4]] }
});
(() => {
  const B = () => Audio.ambBus, N = (t, d, ty, f, q, v, a, br) => SFX._n(t, d, ty, f, q, v, a || .002, B(), br), O = (t, ty, f0, f1, d, v, a) => SFX._o(t, ty, f0, f1, d, v, B(), a);
  Object.assign(AMB_EV, {
    wave(t, v) { N(t, 2.4, 'lowpass', 600, .7, .1 * v, .9, true); N(t + .8, 1.6, 'bandpass', 2400, .8, .03 * v, .4); },
    gull(t, v) { for (let i = 0; i < rndi(2, 4); i++) O(t + i * .22, 'triangle', rnd(1300, 1600), rnd(700, 900), .18, .05 * v); },
    bubble(t, v) { for (let i = 0; i < rndi(2, 6); i++) O(t + i * rnd(.05, .14), 'sine', rnd(300, 600), rnd(900, 1500), .06, .04 * v); },
    whalecall(t, v) { O(t, 'sine', 180, 120, 2.4, .05 * v, .6); O(t + .3, 'sine', 270, 210, 2, .025 * v, .5); },
    icecrack(t, v) { N(t, .08, 'highpass', 3000, 1, .08 * v); N(t + .05, .3, 'bandpass', 900, 3, .05 * v); },
    gust(t, v) { N(t, 1.8, 'bandpass', 700, .6, .08 * v, .6); },
    applause(t, v) { for (let i = 0; i < 30; i++) N(t + i * rnd(.02, .06), .03, 'bandpass', rnd(1500, 3000), 2, .02 * v); },
    pop(t, v) { O(t, 'sine', 900, 200, .06, .06 * v); }
  });
  Object.assign(SFX.lib, {
    gull(t, v) { AMB_EV.gull.call(null, t, v * 2); }, splash(t, v) { SFX._n(t, .5, 'lowpass', 1400, 1, .25 * v, .005, null, true); },
    pop(t, v) { SFX._o(t, 'sine', 1200, 200, .08, .3 * v); SFX._n(t, .05, 'highpass', 2000, 1, .2 * v); },
    whale(t, v) { SFX._o(t, 'sine', 160, 110, 2.6, .25 * v, null, .5); SFX._o(t + .2, 'sine', 240, 190, 2.2, .12 * v, null, .5); },
    breathe(t, v) { SFX._n(t, 1.2, 'bandpass', 900, .7, .12 * v, .4); }, reel(t, v) { for (let i = 0; i < 8; i++) SFX._n(t + i * .03, .02, 'highpass', 4000, 1, .1 * v); },
    knock(t, v) { for (let i = 0; i < 3; i++) { SFX._n(t + i * .22, .08, 'lowpass', 500, 2, .5 * v, .001, null, true); SFX._o(t + i * .22, 'sine', 140, 90, .1, .3 * v); } }
  });
})();
