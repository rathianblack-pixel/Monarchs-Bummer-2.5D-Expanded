'use strict';
/* =========================================================
   AUDIO ENGINE
   ========================================================= */
const Audio = {
  ctx: null, muted: false,
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.ratio.value = 4; this.comp.connect(c.destination);
    this.master = c.createGain(); this.master.connect(this.comp);
    this.musicBus = c.createGain(); this.ambBus = c.createGain(); this.sfxBus = c.createGain();
    this.duck = c.createGain(); this.duck.connect(this.master);
    this.musicBus.connect(this.duck); this.ambBus.connect(this.master); this.sfxBus.connect(this.master);
    // reverb
    const len = c.sampleRate * 2.6, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
    this.verb = c.createConvolver(); this.verb.buffer = ir; this.verbIn = c.createGain(); this.verbIn.gain.value = .5; this.verbIn.connect(this.verb); this.verb.connect(this.master);
    // noise
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; this.noiseBuf = nb;
    const bb = c.createBuffer(1, c.sampleRate * 4, c.sampleRate), bd = bb.getChannelData(0); let last = 0;
    for (let i = 0; i < bd.length; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; bd[i] = last * 3.5; } this.brownBuf = bb;
    this.applyVolumes();
    Music.onUnlock(); Amb.onUnlock();
  },
  applyVolumes() {
    if (!this.ctx) return; const t = this.ctx.currentTime, m = this.muted ? 0 : Settings.master;
    this.master.gain.setTargetAtTime(m, t, .05); this.musicBus.gain.setTargetAtTime(Settings.music * .8, t, .05);
    this.ambBus.gain.setTargetAtTime(Settings.amb * .9, t, .05); this.sfxBus.gain.setTargetAtTime(Settings.sfx, t, .05);
  },
  duckMusic(amount, dur) { if (!this.ctx) return; const t = this.ctx.currentTime; this.duck.gain.cancelScheduledValues(t); this.duck.gain.setTargetAtTime(amount, t, .03); this.duck.gain.setTargetAtTime(1, t + dur, .25); },
  toggleMute() { this.muted = !this.muted; this.applyVolumes(); }
};
const AN = {
  osc(type, f, t) { const o = Audio.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); return o; },
  gain(v = 0) { const g = Audio.ctx.createGain(); g.gain.value = v; return g; },
  filt(type, f, q = 1) { const b = Audio.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; },
  noise(t, dur, brown) { const s = Audio.ctx.createBufferSource(); s.buffer = brown ? Audio.brownBuf : Audio.noiseBuf; s.loop = true; s.start(t, Math.random() * 1.5); s.stop(t + dur + .05); return s; },
  env(gn, t, a, peak, d, end = .0001) { const p = gn.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + a); p.exponentialRampToValueAtTime(end, t + a + d); },
  chain(...n) { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; }
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
/* ---------------- INSTRUMENTS ---------------- */
const INST = {
  pluck(t, f, dur, v, out, o = {}) {
    const a = AN.osc(o.type || 'triangle', f, t), b = AN.osc('sawtooth', f * 1.004, t), bg = AN.gain(.28), lp = AN.filt('lowpass', o.bright || 3200, 2), g = AN.gain(), dec = o.decay || .7;
    lp.frequency.setValueAtTime(o.bright || 3200, t); lp.frequency.exponentialRampToValueAtTime(Math.max(200, f * 1.3), t + dec * .5);
    a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(out); AN.env(g, t, .004, v, dec);
    a.start(t); b.start(t); a.stop(t + dec + .1); b.stop(t + dec + .1);
  },
  lute(t, f, d, v, out) { INST.pluck(t, f, d, v * .9, out, { bright: 2600, decay: .9 }); },
  guitar(t, f, d, v, out) { INST.pluck(t, f, d, v, out, { bright: 1800, decay: 1.2 }); },
  pizz(t, f, d, v, out) { INST.pluck(t, f, d, v, out, { bright: 1400, decay: .28 }); },
  harp(t, f, d, v, out) { const a = AN.osc('sine', f, t), b = AN.osc('triangle', f * 2, t), bg = AN.gain(.18), g = AN.gain(); a.connect(g); b.connect(bg); bg.connect(g); g.connect(out); AN.env(g, t, .003, v, 1.6); a.start(t); b.start(t); a.stop(t + 1.8); b.stop(t + 1.8); },
  musicbox(t, f, d, v, out) { const a = AN.osc('sine', f * 2, t), b = AN.osc('sine', f * 8.02, t), bg = AN.gain(.08), g = AN.gain(); a.connect(g); b.connect(bg); bg.connect(g); g.connect(out); AN.env(g, t, .002, v * .8, 1.1); a.start(t); b.start(t); a.stop(t + 1.2); b.stop(t + 1.2); },
  bell(t, f, d, v, out) { [[1, 1, 2.2], [2.76, .5, 1.2], [5.4, .25, .6], [8.9, .12, .3]].forEach(([r, a2, dc]) => { const o = AN.osc('sine', f * r, t), g = AN.gain(); o.connect(g); g.connect(out); AN.env(g, t, .002, v * a2, dc); o.start(t); o.stop(t + dc + .1); }); },
  celesta(t, f, d, v, out) { INST.bell(t, f * 2, d, v * .5, out); },
  marimba(t, f, d, v, out) { const a = AN.osc('sine', f, t), b = AN.osc('sine', f * 4, t), bg = AN.gain(.2), g = AN.gain(); a.connect(g); b.connect(bg); bg.connect(g); g.connect(out); AN.env(g, t, .002, v, .45); a.start(t); b.start(t); a.stop(t + .5); b.stop(t + .5); },
  flute(t, f, d, v, out) {
    const a = AN.osc('sine', f, t), tr = AN.osc('triangle', f, t), tg = AN.gain(.25), lfo = AN.osc('sine', 5.2, t), lg = AN.gain(f * .006), g = AN.gain();
    lfo.connect(lg); lg.connect(a.frequency); lg.connect(tr.frequency); a.connect(g); tr.connect(tg); tg.connect(g); g.connect(out);
    const n = AN.noise(t, d), nf = AN.filt('bandpass', f * 2, 3), ng = AN.gain(); n.connect(nf); nf.connect(ng); ng.connect(out); AN.env(ng, t, .03, v * .12, .15);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .07); g.gain.setValueAtTime(v * .85, t + Math.max(.08, d - .05)); g.gain.exponentialRampToValueAtTime(.0001, t + d + .18);
    [a, tr, lfo].forEach(o => { o.start(t); o.stop(t + d + .25); });
  },
  reed(t, f, d, v, out, cut = 1400, type = 'square') {
    const a = AN.osc(type, f, t), lp = AN.filt('lowpass', cut, 1.5), g = AN.gain(), lfo = AN.osc('sine', 4.6, t), lg = AN.gain(f * .004);
    lfo.connect(lg); lg.connect(a.frequency); a.connect(lp); lp.connect(g); g.connect(out);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .04); g.gain.setValueAtTime(v * .8, t + Math.max(.05, d - .04)); g.gain.exponentialRampToValueAtTime(.0001, t + d + .1);
    a.start(t); lfo.start(t); a.stop(t + d + .15); lfo.stop(t + d + .15);
  },
  clarinet(t, f, d, v, out) { INST.reed(t, f, d, v * .55, out, 1500, 'square'); },
  bassoon(t, f, d, v, out) { INST.reed(t, f, d, v * .6, out, 700, 'sawtooth'); },
  brass(t, f, d, v, out) {
    const a = AN.osc('sawtooth', f, t), b = AN.osc('sawtooth', f * 1.006, t), lp = AN.filt('lowpass', 400, 2), g = AN.gain();
    lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(2200, t + .08); lp.frequency.exponentialRampToValueAtTime(900, t + d);
    a.connect(lp); b.connect(lp); lp.connect(g); g.connect(out);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v * .45, t + .05); g.gain.setValueAtTime(v * .38, t + Math.max(.06, d - .05)); g.gain.exponentialRampToValueAtTime(.0001, t + d + .2);
    a.start(t); b.start(t); a.stop(t + d + .25); b.stop(t + d + .25);
  },
  harpsichord(t, f, d, v, out) { const a = AN.osc('sawtooth', f, t), b = AN.osc('square', f * 2, t), bg = AN.gain(.15), hp = AN.filt('highpass', 500), g = AN.gain(); a.connect(hp); b.connect(bg); bg.connect(hp); hp.connect(g); g.connect(out); AN.env(g, t, .002, v * .4, .6); a.start(t); b.start(t); a.stop(t + .7); b.stop(t + .7); },
  bass(t, f, d, v, out) { const a = AN.osc('triangle', f, t), s = AN.osc('sine', f / 2, t), sg = AN.gain(.5), lp = AN.filt('lowpass', 900), g = AN.gain(); a.connect(lp); s.connect(sg); sg.connect(lp); lp.connect(g); g.connect(out); AN.env(g, t, .006, v, Math.max(.25, d * 1.1)); a.start(t); s.start(t); a.stop(t + d + .4); s.stop(t + d + .4); },
  pad(t, f, d, v, out, o = {}) {
    const g = AN.gain(), lp = AN.filt(o.band ? 'bandpass' : 'lowpass', o.cut || 1100, o.band ? 1.2 : .7); lp.connect(g); g.connect(out);
    const os = [-7, 0, 6].map(c => { const x = AN.osc(o.type || 'sawtooth', f, t); x.detune.value = c; x.connect(lp); return x; });
    let x2; if (o.band) { const lp2 = AN.filt('bandpass', o.band2 || 2400, 2); os.forEach(x => x.connect(lp2)); x2 = AN.gain(.4); lp2.connect(x2); x2.connect(g); }
    const at = o.attack || .5; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v * .22, t + at); g.gain.setValueAtTime(v * .2, t + Math.max(at, d)); g.gain.linearRampToValueAtTime(.0001, t + d + (o.rel || .8));
    os.forEach(x => { x.start(t); x.stop(t + d + (o.rel || .8) + .1); });
  },
  strings(t, f, d, v, out) { INST.pad(t, f, d, v, out, { cut: 1300, attack: .35 }); },
  choir(t, f, d, v, out) { INST.pad(t, f, d, v * 1.1, out, { band: true, cut: 650, band2: 1100, attack: .6, rel: 1.2 }); },
  organ(t, f, d, v, out) {
    const g = AN.gain(); g.connect(out);
    [[1, .5], [2, .3], [3, .12], [4, .1], [.5, .25]].forEach(([r, a]) => { const o = AN.osc('sine', f * r, t), og = AN.gain(a); o.connect(og); og.connect(g); o.start(t); o.stop(t + d + .6); });
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v * .35, t + .12); g.gain.setValueAtTime(v * .33, t + d); g.gain.linearRampToValueAtTime(.0001, t + d + .5);
  },
  // percussion (f ignored)
  kick(t, f, d, v, out) { const o = AN.osc('sine', 140, t), g = AN.gain(); o.frequency.exponentialRampToValueAtTime(42, t + .12); o.connect(g); g.connect(out); AN.env(g, t, .002, v, .32); o.start(t); o.stop(t + .4); },
  frame(t, f, d, v, out) { const o = AN.osc('sine', 105, t), g = AN.gain(); o.frequency.exponentialRampToValueAtTime(68, t + .2); o.connect(g); g.connect(out); AN.env(g, t, .003, v * .8, .35); o.start(t); o.stop(t + .45); const n = AN.noise(t, .1), lp = AN.filt('lowpass', 500), ng = AN.gain(); n.connect(lp); lp.connect(ng); ng.connect(out); AN.env(ng, t, .002, v * .4, .08); },
  hand(t, f, d, v, out) { const o = AN.osc('sine', 280, t), g = AN.gain(); o.frequency.exponentialRampToValueAtTime(170, t + .07); o.connect(g); g.connect(out); AN.env(g, t, .001, v * .6, .12); o.start(t); o.stop(t + .2); const n = AN.noise(t, .05), bp = AN.filt('bandpass', 2200, 1.5), ng = AN.gain(); n.connect(bp); bp.connect(ng); ng.connect(out); AN.env(ng, t, .001, v * .3, .03); },
  brush(t, f, d, v, out) { const n = AN.noise(t, .15), hp = AN.filt('highpass', 5000), g = AN.gain(); n.connect(hp); hp.connect(g); g.connect(out); AN.env(g, t, .01, v * .25, .09); },
  shaker(t, f, d, v, out) { const n = AN.noise(t, .08), hp = AN.filt('bandpass', 7000, 1), g = AN.gain(); n.connect(hp); hp.connect(g); g.connect(out); AN.env(g, t, .005, v * .22, .05); },
  snare(t, f, d, v, out) { const n = AN.noise(t, .25), bp = AN.filt('bandpass', 1900, .8), g = AN.gain(); n.connect(bp); bp.connect(g); g.connect(out); AN.env(g, t, .002, v * .55, .16); const o = AN.osc('triangle', 190, t), og = AN.gain(); o.connect(og); og.connect(out); AN.env(og, t, .001, v * .4, .07); o.start(t); o.stop(t + .12); },
  timp(t, f, d, v, out) { const o = AN.osc('sine', f || 73, t), g = AN.gain(); o.frequency.exponentialRampToValueAtTime((f || 73) * .92, t + .8); o.connect(g); g.connect(out); AN.env(g, t, .004, v, 1.2); o.start(t); o.stop(t + 1.3); const n = AN.noise(t, .1), lp = AN.filt('lowpass', 300), ng = AN.gain(); n.connect(lp); lp.connect(ng); ng.connect(out); AN.env(ng, t, .002, v * .5, .1); },
  anvil(t, f, d, v, out) { [[1, 1, .9], [2.41, .6, .5], [3.93, .4, .35], [5.6, .25, .2]].forEach(([r, a, dc]) => { const o = AN.osc('sine', 1180 * r, t), g = AN.gain(); o.connect(g); g.connect(out); AN.env(g, t, .001, v * a * .35, dc); o.start(t); o.stop(t + dc + .1); }); const n = AN.noise(t, .05), hp = AN.filt('highpass', 3000), g2 = AN.gain(); n.connect(hp); hp.connect(g2); g2.connect(out); AN.env(g2, t, .001, v * .3, .03); },
  heart(t, f, d, v, out) { INST.kick(t, 0, 0, v * .8, out); INST.kick(t + .16, 0, 0, v * .5, out); }
};
