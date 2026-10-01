'use strict';
/* =========================================================
   SFX ENGINE — layered synthesized effects
   ========================================================= */
const SFX = {
  out() { return Audio.sfxBus; },
  play(name, o = {}) { if (!Audio.ctx) return; const f = this.lib[name]; if (f) { try { f(Audio.ctx.currentTime + .005, o.v || 1, 1 + (Math.random() - .5) * .08 * (o.jit === undefined ? 1 : o.jit), o); } catch (e) { } } },
  _n(t, dur, type, f, q, v, a = .002, dest, brown) { const n = AN.noise(t, dur, brown), fl = AN.filt(type, f, q), g = AN.gain(); n.connect(fl); fl.connect(g); g.connect(dest || Audio.sfxBus); AN.env(g, t, a, v, dur); return fl; },
  _o(t, type, f0, f1, dur, v, dest, a = .002) { const o = AN.osc(type, f0, t), g = AN.gain(); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur); o.connect(g); g.connect(dest || Audio.sfxBus); AN.env(g, t, a, v, dur); o.start(t); o.stop(t + dur + .05); return o; },
  _verb(t, fn) { const g = AN.gain(1); g.connect(Audio.sfxBus); const s = AN.gain(.5); g.connect(s); s.connect(Audio.verbIn); fn(g); },
  lib: {}
};
(() => {
  const L = SFX.lib, N = (...a) => SFX._n(...a), O = (...a) => SFX._o(...a);
  L.hover = (t, v, p) => { N(t, .025, 'bandpass', 3200 * p, 3, .05 * v); };
  L.click = (t, v, p) => { N(t, .03, 'bandpass', 1800 * p, 2, .25 * v); O(t, 'triangle', 420 * p, 300 * p, .04, .12 * v); };
  L.confirm = (t, v, p) => { O(t, 'sine', 660 * p, 660 * p, .12, .15 * v); O(t + .06, 'sine', 990 * p, 990 * p, .2, .12 * v); N(t, .03, 'bandpass', 2000, 2, .15 * v); };
  L.error = (t, v, p) => { O(t, 'triangle', 160 * p, 120 * p, .1, .25 * v); N(t, .04, 'lowpass', 600, 1, .2 * v); };
  L.flick = (t, v, p) => { N(t, .06, 'bandpass', 2600 * p, 1.2, .22 * v, .01); };
  L.press = (t, v, p) => { N(t, .04, 'bandpass', 900 * p, 1.5, .3 * v); O(t, 'sine', 220 * p, 160, .05, .15 * v); };
  L.page = (t, v, p) => { N(t, .18, 'bandpass', 3000 * p, .8, .15 * v, .04); };
  L.door = (t, v, p) => { O(t, 'sawtooth', 90 * p, 70, .35, .08 * v, null, .05); N(t, .3, 'bandpass', 500 * p, 3, .2 * v, .04); N(t + .32, .08, 'lowpass', 300, 1, .5 * v); O(t + .32, 'sine', 90, 50, .15, .4 * v); };
  L.step = (t, v, p, o) => { const s = o.surf || 'dirt'; if (s === 'wood') { O(t, 'triangle', 180 * p, 120, .06, .18 * v); N(t, .04, 'bandpass', 900 * p, 2, .15 * v); } else if (s === 'stone') { N(t, .04, 'highpass', 2500 * p, 1, .12 * v); O(t, 'sine', 140 * p, 90, .03, .1 * v); } else if (s === 'grass') { N(t, .07, 'bandpass', 3500 * p, .7, .06 * v, .01); } else if (s === 'water') { N(t, .09, 'bandpass', 1400 * p, 1, .14 * v); O(t, 'sine', 600 * p, 1200 * p, .05, .05 * v); } else { N(t, .05, 'lowpass', 900 * p, 1, .14 * v); } };
  L.swing = (t, v, p) => { const f = N(t, .22, 'bandpass', 1200 * p, 1.2, .35 * v, .06); f.frequency.exponentialRampToValueAtTime(4000 * p, t + .2); };
  L.whoosh = (t, v, p) => { const f = N(t, .35, 'bandpass', 500 * p, .8, .3 * v, .12); f.frequency.exponentialRampToValueAtTime(2500 * p, t + .3); };
  L.slash = (t, v, p) => { N(t, .06, 'highpass', 4000, 1, .45 * v); const f = N(t, .12, 'bandpass', 3000 * p, 1, .35 * v); f.frequency.exponentialRampToValueAtTime(800, t + .12); O(t, 'sine', 120 * p, 50, .15, .6 * v); [2350, 3510].forEach(fr => O(t + .005, 'sine', fr * p, fr * p, .25, .05 * v)); N(t, .01, 'highpass', 6000, 1, .3 * v); };
  L.heavy = (t, v, p) => { O(t, 'sine', 90 * p, 35, .35, .9 * v); N(t, .25, 'lowpass', 700 * p, 1, .6 * v, .002, null, true); N(t, .08, 'bandpass', 1600, 1, .3 * v); };
  L.punch = (t, v, p) => { O(t, 'sine', 160 * p, 60, .15, .6 * v); N(t, .08, 'lowpass', 1200 * p, 1, .4 * v); };
  L.parry = (t, v, p) => { SFX._verb(t, d => { [1850, 2780, 4140, 5230].forEach((f, i) => O(t, 'sine', f * p, f * p * .995, .9 - i * .15, .14 * v, d)); N(t, .03, 'highpass', 5000, 1, .5 * v, .001, d); O(t, 'triangle', 320, 200, .1, .3 * v, d); }); };
  L.block = (t, v, p) => { O(t, 'square', 420 * p, 300, .06, .15 * v); N(t, .1, 'bandpass', 1500 * p, 2, .35 * v); O(t, 'sine', 140, 80, .1, .4 * v); };
  L.bowdraw = (t, v, p) => { O(t, 'sawtooth', 110 * p, 160 * p, .4, .04 * v, null, .2); N(t, .4, 'bandpass', 700, 4, .08 * v, .3); };
  L.bowrel = (t, v, p) => { O(t, 'triangle', 220 * p, 110, .12, .4 * v); N(t, .03, 'highpass', 3000, 1, .3 * v); const f = N(t + .01, .25, 'bandpass', 2200 * p, 2, .15 * v, .02); f.frequency.exponentialRampToValueAtTime(900, t + .25); };
  L.arrowhit = (t, v, p) => { N(t, .03, 'bandpass', 2500 * p, 2, .4 * v); O(t, 'triangle', 700 * p, 300, .08, .2 * v); O(t + .02, 'sine', 180, 120, .08, .3 * v); };
  L.firecast = (t, v, p) => { const f = N(t, .5, 'lowpass', 400 * p, 1, .4 * v, .15, null, true); f.frequency.exponentialRampToValueAtTime(2200, t + .45); O(t, 'sawtooth', 80 * p, 160 * p, .5, .06 * v, null, .2); };
  L.firehit = (t, v, p) => { N(t, .6, 'lowpass', 1800 * p, .8, .8 * v, .002, null, true); O(t, 'sine', 110 * p, 40, .4, .7 * v); N(t + .05, .5, 'bandpass', 3000, 1, .15 * v, .1); };
  L.watercast = (t, v, p) => { const f = N(t, .5, 'bandpass', 600 * p, 3, .3 * v, .1); f.frequency.exponentialRampToValueAtTime(1800, t + .45); for (let i = 0; i < 4; i++) O(t + i * .08, 'sine', (500 + i * 200) * p, (900 + i * 250) * p, .06, .06 * v); };
  L.waterhit = (t, v, p) => { N(t, .4, 'bandpass', 1100 * p, .7, .7 * v); for (let i = 0; i < 7; i++) O(t + .05 + Math.random() * .3, 'sine', rnd(700, 1600) * p, rnd(1600, 2600) * p, .04, .08 * v); O(t, 'sine', 140, 60, .2, .4 * v); };
  L.lightcast = (t, v, p) => { SFX._verb(t, d => { [1, 1.5, 2, 3].forEach((r, i) => O(t + i * .05, 'sine', 660 * r * p, 660 * r * p, .6, .08 * v, d, .05)); }); };
  L.lighthit = (t, v, p) => { SFX._verb(t, d => { [880, 1320, 1760, 2640].forEach((f, i) => O(t + i * .02, 'sine', f * p, f * p, .8, .12 * v, d)); N(t, .15, 'highpass', 4000, 1, .3 * v, .001, d); O(t, 'sine', 150, 70, .2, .4 * v, d); }); };
  L.hurt = (t, v, p) => { O(t, 'sine', 180 * p, 70, .2, .6 * v); N(t, .12, 'lowpass', 1200, 1, .45 * v); O(t, 'square', 300 * p, 200 * p, .08, .06 * v); };
  L.ehurt = (t, v, p) => { O(t, 'triangle', 240 * p, 120 * p, .15, .25 * v); };
  L.coin = (t, v, p) => { const f = rnd(1800, 2300) * p; O(t, 'square', f, f, .05, .05 * v); O(t + .05, 'sine', f * 1.34, f * 1.34, .25, .12 * v); O(t + .05, 'sine', f * 2.1, f * 2.1, .15, .05 * v); };
  L.purchase = (t, v, p) => { for (let i = 0; i < 4; i++) L.coin(t + i * .06, v * .8, p); O(t + .25, 'sine', 523, 523, .2, .1 * v); O(t + .32, 'sine', 784, 784, .3, .1 * v); };
  L.heal = (t, v, p) => { SFX._verb(t, d => { [523, 659, 784, 1047].forEach((f, i) => O(t + i * .07, 'sine', f * p, f * p, .5, .09 * v, d, .02)); }); };
  L.gulp = (t, v, p) => { for (let i = 0; i < 3; i++) O(t + i * .12, 'sine', 300 * p, 140 * p, .08, .3 * v); };
  L.status = (t, v, p, o) => { const k = o.k || 'burn'; if (k === 'burn') N(t, .4, 'lowpass', 900, 1, .3 * v, .05, null, true); else if (k === 'bleed') { O(t, 'sine', 700 * p, 400 * p, .15, .1 * v); N(t, .08, 'bandpass', 2400, 2, .2 * v); } else if (k === 'soak') L.waterhit(t, v * .4, p); else if (k === 'bless') L.heal(t, v * .6, p * 1.2); else if (k === 'stagger') { O(t, 'triangle', 500 * p, 250 * p, .3, .15 * v); O(t + .1, 'triangle', 500 * p, 250 * p, .3, .1 * v); } else { O(t, 'sawtooth', 200 * p, 140 * p, .3, .08 * v); N(t, .25, 'bandpass', 600, 2, .15 * v); } };
  L.levelup = (t, v) => { Music.sting('level'); };
  L.quest = (t, v, p) => { O(t, 'sine', 880 * p, 880 * p, .12, .1 * v); O(t + .1, 'sine', 1320 * p, 1320 * p, .35, .1 * v); N(t, .05, 'bandpass', 3000, 2, .1 * v); };
  L.breakready = () => Music.sting('breakready');
  L.bell = (t, v, p) => { SFX._verb(t, d => INST.bell(t, 196 * p, 3, .6 * v, d)); };
  L.thunder = (t, v, p) => { const d = rnd(.1, .5); N(t + d, 2.8, 'lowpass', 260 * p, .7, .9 * v, .08, Audio.ambBus, true); N(t + d, .4, 'lowpass', 1200, 1, .4 * v, .01, Audio.ambBus, true); };
  L.anvil = (t, v, p) => INST.anvil(t, 0, 0, .8 * v, Audio.sfxBus);
  L.perfect = (t, v, p) => { SFX._verb(t, d => { O(t, 'sine', 1568 * p, 1568 * p, .4, .12 * v, d); O(t + .04, 'sine', 2349 * p, 2349 * p, .5, .1 * v, d); }); };
  L.miss = (t, v, p) => { const f = N(t, .25, 'bandpass', 900 * p, 1, .2 * v, .04); f.frequency.exponentialRampToValueAtTime(300, t + .25); };
  L.dodge = (t, v, p) => { L.whoosh(t, v * .8, p * 1.3); N(t + .12, .05, 'lowpass', 800, 1, .2 * v); };
  L.splash = (t, v, p) => { N(t, .15, 'bandpass', 1500 * p, .8, .12 * v); };
  L.raid = (t, v, p) => { SFX._verb(t, d => { O(t, 'sawtooth', 110, 110, 1.1, .18 * v, d, .15); O(t + .02, 'sawtooth', 165, 160, 1.1, .12 * v, d, .15); }); };
  L.ultimate = (t, v, p) => { O(t, 'sine', 60, 30, 1.2, .7 * v); const f = N(t, 1, 'bandpass', 200, 2, .4 * v, .6, null, true); f.frequency.exponentialRampToValueAtTime(3000, t + 1); };
  L.boom = (t, v, p) => { O(t, 'sine', 70 * p, 25, .9, 1 * v); N(t, 1.2, 'lowpass', 900 * p, .7, .9 * v, .002, null, true); N(t, .2, 'highpass', 3000, 1, .3 * v); };
  L.charge = (t, v, p) => { O(t, 'sawtooth', 100 * p, 400 * p, .6, .06 * v, null, .3); };
  L.shield = (t, v, p) => { SFX._verb(t, d => { O(t, 'sine', 440 * p, 880 * p, .3, .1 * v, d); O(t, 'triangle', 660 * p, 1320 * p, .3, .06 * v, d); }); };
  L.death = (t, v, p) => { O(t, 'sine', 200 * p, 40, 1.2, .4 * v); N(t, 1, 'lowpass', 400, 1, .3 * v, .1, null, true); };
  L.edeath = (t, v, p) => { O(t, 'triangle', 300 * p, 60, .6, .3 * v); N(t, .5, 'bandpass', 800, 1, .25 * v, .05); };
  L.honk = (t, v, p) => { const o = AN.osc('sawtooth', 380 * p, t), bp = AN.filt('bandpass', 1100, 3), g = AN.gain(); o.frequency.setValueAtTime(380 * p, t); o.frequency.linearRampToValueAtTime(330 * p, t + .18); o.connect(bp); bp.connect(g); g.connect(Audio.sfxBus); AN.env(g, t, .01, .3 * v, .2); o.start(t); o.stop(t + .25); };
  L.meow = (t, v, p) => { const o = AN.osc('sawtooth', 600 * p, t), bp = AN.filt('bandpass', 1400, 4), g = AN.gain(); o.frequency.linearRampToValueAtTime(900 * p, t + .12); o.frequency.linearRampToValueAtTime(500 * p, t + .4); o.connect(bp); bp.connect(g); g.connect(Audio.sfxBus); AN.env(g, t, .05, .12 * v, .35); o.start(t); o.stop(t + .45); };
  L.cluck = (t, v, p) => { for (let i = 0; i < 3; i++) { const o = AN.osc('square', 700 * p, t + i * .09), bp = AN.filt('bandpass', 1300, 5), g = AN.gain(); o.frequency.exponentialRampToValueAtTime(420 * p, t + i * .09 + .05); o.connect(bp); bp.connect(g); g.connect(Audio.ambBus); AN.env(g, t + i * .09, .005, .1 * v, .05); o.start(t + i * .09); o.stop(t + i * .09 + .08); } };
  L.growl = (t, v, p) => { const o = AN.osc('sawtooth', 70 * p, t), lp = AN.filt('lowpass', 500, 4), g = AN.gain(), l = AN.osc('sine', 22, t), lg = AN.gain(20); l.connect(lg); lg.connect(o.frequency); o.connect(lp); lp.connect(g); g.connect(Audio.sfxBus); AN.env(g, t, .05, .35 * v, .5); o.start(t); l.start(t); o.stop(t + .6); l.stop(t + .6); };
  L.squeak = (t, v, p) => { O(t, 'sine', 1800 * p, 2600 * p, .08, .1 * v); O(t + .1, 'sine', 2000 * p, 2800 * p, .06, .08 * v); };
  L.rattle = (t, v, p) => { for (let i = 0; i < 6; i++) N(t + i * .035, .02, 'bandpass', rnd(1500, 3000), 4, .25 * v); };
  L.moan = (t, v, p) => { const o = AN.osc('sawtooth', 110 * p, t), bp = AN.filt('bandpass', 500, 3), g = AN.gain(); o.frequency.linearRampToValueAtTime(90 * p, t + .8); o.connect(bp); bp.connect(g); g.connect(Audio.sfxBus); AN.env(g, t, .2, .2 * v, .7); o.start(t); o.stop(t + 1); };
  L.wail = (t, v, p) => { SFX._verb(t, d => { const o = AN.osc('sine', 500 * p, t), g = AN.gain(), l = AN.osc('sine', 6, t), lg = AN.gain(25); l.connect(lg); lg.connect(o.frequency); o.frequency.linearRampToValueAtTime(800 * p, t + .4); o.frequency.linearRampToValueAtTime(300 * p, t + 1); o.connect(g); g.connect(d); AN.env(g, t, .2, .12 * v, .8); o.start(t); l.start(t); o.stop(t + 1.1); l.stop(t + 1.1); }); };
  L.laugh = (t, v, p) => { for (let i = 0; i < 4; i++) { const o = AN.osc('sawtooth', (140 - i * 8) * p, t + i * .12), bp = AN.filt('bandpass', 700, 3), g = AN.gain(); o.connect(bp); bp.connect(g); g.connect(Audio.sfxBus); AN.env(g, t + i * .12, .01, .2 * v, .09); o.start(t + i * .12); o.stop(t + i * .12 + .12); } };
  L.chomp = (t, v, p) => { O(t, 'square', 200 * p, 80, .07, .25 * v); N(t, .06, 'lowpass', 1500, 1, .4 * v); O(t + .08, 'square', 180 * p, 70, .06, .2 * v); };
  L.clank = (t, v, p) => { [700, 1130, 1790].forEach(f => O(t, 'square', f * p, f * p * .98, .2, .04 * v)); N(t, .08, 'bandpass', 2000, 2, .3 * v); };
  L.hammer = (t, v, p) => { INST.anvil(t, 0, 0, .5 * v, Audio.ambBus); };
})();
/* Voice blips — abstract vocal chirps per character */
const VOICES = {
  player: { f: 240, form: 1200, d: .05, type: 'triangle', j: .15 }, priest: { f: 150, form: 700, d: .07, type: 'sine', j: .08 },
  smith: { f: 95, form: 500, d: .06, type: 'sawtooth', j: .12 }, merchant: { f: 330, form: 1800, d: .035, type: 'square', j: .2 },
  lucien: { f: 90, form: 650, d: .09, type: 'sawtooth', j: .05 }, child: { f: 480, form: 2200, d: .03, type: 'triangle', j: .25 },
  old: { f: 260, form: 1400, d: .06, type: 'triangle', j: .18 }, guard: { f: 130, form: 900, d: .05, type: 'square', j: .1 },
  farmer: { f: 170, form: 900, d: .05, type: 'triangle', j: .15 }, gossip: { f: 300, form: 1600, d: .04, type: 'triangle', j: .2 },
  monster: { f: 110, form: 600, d: .06, type: 'sawtooth', j: .25 }, frog: { f: 200, form: 700, d: .08, type: 'square', j: .3 },
  herald: { f: 210, form: 1500, d: .035, type: 'triangle', j: .3 }, bard: { f: 280, form: 1300, d: .05, type: 'sine', j: .35 },
  mira: { f: 300, form: 1700, d: .05, type: 'sine', j: .15 }, narrator: { f: 180, form: 900, d: .06, type: 'sine', j: .05 }
};
function blip(voice) {
  if (!Audio.ctx) return; const V = VOICES[voice] || VOICES.player, t = Audio.ctx.currentTime, f = V.f * (1 + (Math.random() - .5) * V.j * 2);
  const o = AN.osc(V.type, f, t), bp = AN.filt('bandpass', V.form * (1 + (Math.random() - .5) * .3), 2.5), lp = AN.filt('lowpass', 3000), g = AN.gain();
  o.frequency.linearRampToValueAtTime(f * (Math.random() < .5 ? 1.08 : .94), t + V.d); o.connect(bp); bp.connect(lp); lp.connect(g); g.connect(Audio.sfxBus); AN.env(g, t, .006, .22, V.d);
  o.start(t); o.stop(t + V.d + .05);
}
