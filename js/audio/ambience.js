'use strict';
/* =========================================================
   AMBIENCE ENGINE — layered beds + randomized events
   ========================================================= */
const Amb = {
  beds: {}, profile: null, pendingName: null, timers: {}, weather: { rain: 0, wind: 0 },
  onUnlock() { if (this.pendingName) this.set(this.pendingName, true); },
  mkBed(kind) {
    const c = Audio.ctx, out = AN.gain(0.0001); out.connect(Audio.ambBus); const t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = kind === 'rain' || kind === 'river' ? Audio.noiseBuf : Audio.brownBuf; src.loop = true; src.start(t, Math.random());
    let f;
    if (kind === 'wind') { f = AN.filt('bandpass', 400, .6); }
    else if (kind === 'river') { f = AN.filt('bandpass', 900, .5); }
    else if (kind === 'rain') { f = AN.filt('highpass', 1200, .5); }
    else if (kind === 'room') { f = AN.filt('lowpass', 180, .7); }
    else if (kind === 'fire') { f = AN.filt('bandpass', 1400, .9); }
    else if (kind === 'drone') { f = AN.filt('lowpass', 300, 1); const o = AN.osc('sine', 55, t), o2 = AN.osc('sine', 82.4, t), og = AN.gain(.08); o.connect(og); o2.connect(og); og.connect(out); o.start(t); o2.start(t); this._extra = this._extra || []; }
    else if (kind === 'spectral') { f = AN.filt('bandpass', 700, 8); const o = AN.osc('sine', 220, t), l = AN.osc('sine', .2, t), lg = AN.gain(8), og = AN.gain(.03); l.connect(lg); lg.connect(o.frequency); o.connect(og); og.connect(out); o.start(t); l.start(t); }
    else f = AN.filt('lowpass', 600);
    src.connect(f); f.connect(out);
    return { out, src, f, kind, level: 0 };
  },
  set(name, force) {
    this.pendingName = name; if (!Audio.ctx) return; if (this.profileName === name && !force) return;
    this.profileName = name; this.profile = AMBIENCE[name] || { beds: {}, events: [] };
    const want = Object.assign({}, this.profile.beds);
    for (const k in this.beds) if (!(k in want) && k !== 'rain') this.bedLevel(k, 0, 1.2);
    for (const k in want) { if (!this.beds[k]) this.beds[k] = this.mkBed(k); this.bedLevel(k, want[k], 1.2); }
    this.timers = {}; (this.profile.events || []).forEach((e, i) => this.timers[i] = rnd(1, 60 / e[1]));
    this.applyWeather();
  },
  bedLevel(k, v, time = 1) { const b = this.beds[k]; if (!b) return; b.level = v; b.out.gain.setTargetAtTime(Math.max(.0001, v), Audio.ctx.currentTime, time / 3); },
  applyWeather() {
    if (!Audio.ctx || !this.profile) return; const outdoor = this.profile.outdoor;
    const rain = outdoor === 'snow' ? 0 : outdoor ? this.weather.rain : this.weather.rain * .25; // snowy places: rain falls as (silent) snow
    if (!this.beds.rain) this.beds.rain = this.mkBed('rain'); this.bedLevel('rain', rain * .35, 2);
    if (this.profile.beds.wind !== undefined || outdoor) { if (!this.beds.wind) this.beds.wind = this.mkBed('wind'); this.bedLevel('wind', ((this.profile.beds.wind || 0) + (outdoor ? this.weather.wind * .25 : 0)), 2); }
  },
  update(dt) {
    if (!Audio.ctx || !this.profile) return; const t = Audio.ctx.currentTime;
    if (this.beds.wind) this.beds.wind.f.frequency.setTargetAtTime(300 + noise1(T * .15) * 180 + 150, t, .3);
    if (this.beds.fire) this.beds.fire.f.frequency.setTargetAtTime(1200 + Math.random() * 900, t, .02);
    const night = World && World.isNight && World.isNight();
    (this.profile.events || []).forEach((e, i) => {
      this.timers[i] -= dt; if (this.timers[i] > 0) return; this.timers[i] = rnd(.5, 1.5) * 60 / e[1];
      const [name, , cond] = e; if (cond === 'day' && night) return; if (cond === 'night' && !night) return; if (cond === 'dry' && this.weather.rain > .3) return;
      const fn = AMB_EV[name]; if (fn) try { fn(t, rnd(.5, 1)); } catch (err) { }
    });
  }
};
const AMB_EV = (() => {
  const B = () => Audio.ambBus, N = (t, d, ty, f, q, v, a, br) => SFX._n(t, d, ty, f, q, v, a || .002, B(), br), O = (t, ty, f0, f1, d, v, a) => SFX._o(t, ty, f0, f1, d, v, B(), a);
  return {
    bird(t, v) { const n = rndi(2, 5), b = rnd(2400, 3800); for (let i = 0; i < n; i++) O(t + i * rnd(.07, .14), 'sine', b * rnd(.9, 1.1), b * rnd(1.1, 1.5), rnd(.04, .09), .04 * v); },
    chicken(t, v) { SFX.lib.cluck(t, v * .6, rnd(.9, 1.1)); },
    crow(t, v) { for (let i = 0; i < rndi(1, 3); i++) { const o = AN.osc('sawtooth', rnd(420, 520), t + i * .3), bp = AN.filt('bandpass', 1300, 4), g = AN.gain(); o.frequency.linearRampToValueAtTime(330, t + i * .3 + .2); o.connect(bp); bp.connect(g); g.connect(B()); AN.env(g, t + i * .3, .01, .07 * v, .22); o.start(t + i * .3); o.stop(t + i * .3 + .3); } },
    bell(t, v) { SFX._verb(t, d => INST.bell(t, 174, 3, .18 * v, d)); },
    hammer(t, v) { for (let i = 0; i < 3; i++) INST.anvil(t + i * .45, 0, 0, .12 * v, B()); },
    cricket(t, v) { for (let i = 0; i < rndi(3, 8); i++) O(t + i * .06, 'sine', 4200 + rnd(-200, 200), 4300, .03, .02 * v); },
    owl(t, v) { O(t, 'sine', 420, 380, .3, .06 * v, .08); O(t + .45, 'sine', 400, 360, .5, .06 * v, .1); },
    howl(t, v) { SFX._verb(t, () => { const o = AN.osc('sawtooth', 300, t), lp = AN.filt('lowpass', 900, 3), g = AN.gain(); o.frequency.linearRampToValueAtTime(520, t + .6); o.frequency.linearRampToValueAtTime(380, t + 2); o.connect(lp); lp.connect(g); g.connect(B()); AN.env(g, t, .4, .04 * v, 1.6); o.start(t); o.stop(t + 2.2); }); },
    whisper(t, v) { const f = N(t, 1.2, 'bandpass', rnd(800, 2000), 6, .05 * v, .3); f.frequency.linearRampToValueAtTime(rnd(1000, 3000), t + 1.2); },
    creak(t, v) { const o = AN.osc('sawtooth', rnd(60, 90), t), bp = AN.filt('bandpass', 400, 6), g = AN.gain(); o.frequency.linearRampToValueAtTime(rnd(90, 140), t + .6); o.connect(bp); bp.connect(g); g.connect(B()); AN.env(g, t, .2, .05 * v, .5); o.start(t); o.stop(t + .9); },
    chains(t, v) { for (let i = 0; i < rndi(3, 6); i++) N(t + i * rnd(.05, .12), .06, 'bandpass', rnd(2000, 4000), 8, .08 * v); },
    thunder(t, v) { if (Math.random() < .5) SFX.lib.thunder(t, v * .6, 1); },
    leaves(t, v) { N(t, rnd(.5, 1.2), 'highpass', 3000, .5, .04 * v, .3); },
    frog(t, v) { for (let i = 0; i < 2; i++) O(t + i * .18, 'square', 180, 140, .08, .025 * v); },
    chatter(t, v) { const lp = AN.filt('lowpass', 900), g = AN.gain(.25); lp.connect(g); g.connect(B()); for (let i = 0; i < rndi(4, 9); i++) { const tt = t + i * .09, o = AN.osc('triangle', rnd(160, 320), tt), gg = AN.gain(); o.connect(gg); gg.connect(lp); AN.env(gg, tt, .005, .08 * v, .05); o.start(tt); o.stop(tt + .08); } },
    footsteps(t, v) { for (let i = 0; i < 4; i++) N(t + i * .38, .05, 'lowpass', 600, 1, .06 * v); },
    tonal(t, v) { SFX._verb(t, d => { const g = AN.gain(.25); g.connect(B()); INST.bell(t, pick([392, 440, 523, 587]), 2, .08 * v, g); }); },
    rune(t, v) { SFX._verb(t, () => { [330, 415, 494].forEach(f => O(t, 'sine', f, f * 1.01, 1.4, .02 * v, .5)); }); },
    stone(t, v) { N(t, .8, 'lowpass', 200, 2, .15 * v, .2, true); },
    splash(t, v) { O(t, 'sine', 800, 1600, .04, .03 * v); },
    torch(t, v) { N(t, .1, 'bandpass', 900, 1, .06 * v); },
    choirdrone(t, v) { SFX._verb(t, () => { const g = AN.gain(.3); g.connect(B()); INST.choir(t, 130.8, 3, .12 * v, g); }); },
    meow(t, v) { SFX.lib.meow(t, v * .5, 1); },
    goose(t, v) { SFX.lib.honk(t, v * .3, 1); },
    fireplace(t, v) { for (let i = 0; i < 4; i++) N(t + rnd(0, .5), .02, 'bandpass', rnd(1500, 3000), 3, .06 * v); },
    wood(t, v) { N(t, .05, 'bandpass', 700, 3, .05 * v); }
  };
})();
const AMBIENCE = {
  title: { beds: { wind: .25, drone: .15 }, events: [['thunder', 3], ['crow', 1.5], ['howl', .6]], outdoor: false },
  intro: { beds: { room: .35, wind: .1 }, events: [['thunder', 4], ['chains', 2], ['torch', 6]] },
  creation: { beds: { room: .15 }, events: [['fireplace', 4]] },
  village: { beds: { wind: .12, river: .06 }, events: [['bird', 6, 'day'], ['chicken', 3, 'day'], ['chatter', 2, 'day'], ['hammer', 2, 'day'], ['bell', .4], ['crow', 1], ['cricket', 8, 'night'], ['owl', 1.5, 'night'], ['leaves', 3], ['footsteps', 1], ['meow', .5], ['wood', 1.5]], outdoor: true },
  house: { beds: { room: .2, fire: .06 }, events: [['fireplace', 10], ['creak', 1], ['wood', 1]] },
  cathedral: { beds: { room: .3 }, events: [['bell', .6], ['creak', 1], ['whisper', .5], ['footsteps', .6]] },
  smith: { beds: { room: .2, fire: .1 }, events: [['chains', 1.5], ['fireplace', 8]] },
  merchant: { beds: { room: .2 }, events: [['wood', 2], ['meow', .6], ['chatter', 1.5], ['bird', 1.5, 'day']] },
  overworld: { beds: { wind: .22 }, events: [['bird', 3, 'day'], ['crow', 1], ['howl', .5, 'night'], ['cricket', 4, 'night'], ['thunder', .5]], outdoor: true },
  a0: { beds: { wind: .12, river: .05 }, events: [['bird', 4, 'day'], ['chicken', 1], ['cricket', 5, 'night'], ['frog', 2]], outdoor: true },
  a1: { beds: { wind: .18 }, events: [['leaves', 5], ['bird', 3, 'day'], ['creak', 2], ['howl', 1], ['owl', 2], ['tonal', 1], ['cricket', 6, 'night']], outdoor: true },
  a2: { beds: { wind: .2, spectral: .15 }, events: [['whisper', 3], ['crow', 3], ['creak', 1.5], ['bell', .8], ['stone', 1]], outdoor: true },
  a3: { beds: { wind: .12 }, events: [['leaves', 5], ['stone', 2], ['rune', 2], ['footsteps', 1.5]], outdoor: true },
  a4: { beds: { room: .3, wind: .12, drone: .12 }, events: [['chains', 3], ['torch', 6], ['creak', 2], ['thunder', 3], ['choirdrone', 1]] },
  road: { beds: { wind: .18 }, events: [['bird', 3, 'day'], ['leaves', 3], ['cricket', 5, 'night'], ['crow', 1]], outdoor: true },
  silent: { beds: {}, events: [] },
  ending: { beds: { room: .2, wind: .08 }, events: [['torch', 3]] }
};
