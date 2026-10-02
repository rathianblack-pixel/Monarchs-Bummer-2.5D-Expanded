'use strict';
/* =========================================================
   TIME + WEATHER SYSTEM
   ========================================================= */
const TOD_KEYS = [[0, [62, 72, 132]], [4.5, [70, 76, 138]], [6, [205, 150, 160]], [7.5, [255, 228, 205]], [12, [255, 252, 244]], [16, [255, 238, 212]], [18, [250, 176, 132]], [19.5, [150, 110, 170]], [21, [72, 80, 142]], [24, [62, 72, 132]]];
const SKY_KEYS = [[0, '#0b1030', '#1d2350'], [4.5, '#141a44', '#3a3464'], [6, '#4a5a9a', '#f2a07a'], [7.5, '#6cb2e0', '#f6dcb0'], [12, '#5aa8e6', '#bfe4f4'], [16, '#62a2d8', '#f4e0b4'], [18, '#6a6aa8', '#f59a64'], [19.5, '#3a3470', '#b0607a'], [21, '#121a44', '#2c2c5c'], [24, '#0b1030', '#1d2350']];
const World = {
  rain: 0, wind: 0, fog: 0, lightning: 0, nextBolt: 5,
  get time() { return S ? S.time : 12; },
  isNight() { const t = this.time; return t >= 20.5 || t < 5.5; },
  nightK() { const t = this.time; if (t >= 21 || t < 4.5) return 1; if (t >= 18.5) return inv(18.5, 21, t); if (t < 6.5) return 1 - inv(4.5, 6.5, t); return 0; },
  ambient(k = 1) { const t = this.time; let i = 0; while (i < TOD_KEYS.length - 1 && TOD_KEYS[i + 1][0] <= t) i++; const a = TOD_KEYS[i], b = TOD_KEYS[Math.min(i + 1, TOD_KEYS.length - 1)]; let c = mixA(a[1], b[1], b[0] === a[0] ? 0 : (t - a[0]) / (b[0] - a[0])); const wet = this.rain * .18 + this.fog * .08; c = mixA(c, [150, 160, 180], wet); if (this.lightning > 0) c = mixA(c, [255, 255, 255], this.lightning * (Settings.flashes ? .8 : .25)); return mixA([255, 255, 255], c, k); },
  sky() { const t = this.time; let i = 0; while (i < SKY_KEYS.length - 1 && SKY_KEYS[i + 1][0] <= t) i++; const a = SKY_KEYS[i], b = SKY_KEYS[Math.min(i + 1, SKY_KEYS.length - 1)]; const k = b[0] === a[0] ? 0 : (t - a[0]) / (b[0] - a[0]); let top = mix(a[1], b[1], k), bot = mix(a[2], b[2], k); return [top, bot]; },
  clockStr() { const h = Math.floor(this.time), m = Math.floor((this.time - h) * 60); const hh = h % 12 === 0 ? 12 : h % 12; return `${hh}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; },
  phaseName() { const t = this.time; return t < 5 ? 'Night' : t < 8 ? 'Dawn' : t < 11.5 ? 'Morning' : t < 14 ? 'Noon' : t < 17.5 ? 'Afternoon' : t < 20.5 ? 'Evening' : 'Night'; },
  update(dt, running) {
    if (!S) return;
    if (running) { const prev = S.time; S.time += dt / CONFIG.HOUR_SECONDS; if (S.time >= 24) { S.time -= 24; S.day = (S.day || 1) + 1; }
      S.weatherT = (S.weatherT || 3) - dt / CONFIG.HOUR_SECONDS; if (S.weatherT <= 0) { S.weatherT = rnd(2.5, 6); S.weather = pick(['CLEAR', 'CLEAR', 'CLEAR', 'FOG', 'RAIN', 'RAIN', 'WIND']); if (S.weather === 'FOG' && !(S.time < 10 || S.time > 18)) S.weather = 'CLEAR'; } }
    const w = S.weather; const tr = w === 'RAIN' ? 1 : 0, tw = w === 'WIND' ? 1 : w === 'RAIN' ? .45 : .12, tf = w === 'FOG' ? 1 : 0;
    this.rain += (tr - this.rain) * dt * .25; this.wind += (tw - this.wind) * dt * .3; this.fog += (tf - this.fog) * dt * .25;
    Amb.weather.rain = this.rain; Amb.weather.wind = this.wind;
    this._aw = (this._aw || 0) + dt; if (this._aw > 2) { this._aw = 0; Amb.applyWeather(); }
    this.lightning = Math.max(0, this.lightning - dt * 4);
  },
  bolt() { this.lightning = 1; Later.add(.06, () => this.lightning = .3); Later.add(.14, () => this.lightning = .8); SFX.play('thunder', { v: .8 }); },
  windSway(x, amp = 1) { return (Math.sin(T * (1.4 + this.wind * 1.6) + x * .07) * (1 + this.wind * 2) + noise1(T * .7 + x * .01) * this.wind * 2) * amp; },
  forceWeather(w) { S.weather = w; }
};
/* rain & fog overlay in low-res screen space */
const Weather = {
  drops: [], splashes: [],
  init() { for (let i = 0; i < 160; i++) this.drops.push({ x: rnd(CONFIG.LW), y: rnd(CONFIG.LH), s: rnd(.6, 1.4), l: rnd(4, 9) }); },
  draw(groundY = 330, amt = World.rain, indoor = false) {
    const c = HD.live ? HD.scrx : wctx; c.setTransform(1, 0, 0, 1, 0, 0);
    if (amt > .02) {
      const n = Math.floor(this.drops.length * amt), wind = World.wind * 1.5 + .6; c.globalAlpha = indoor ? .25 : .55;
      for (let i = 0; i < n; i++) {
        const d = this.drops[i]; d.y += (260 + 120 * d.s) * DT; d.x += wind * 60 * DT * d.s; const gy = typeof groundY === 'function' ? groundY(d.x) : groundY; if (d.y > gy + rnd(-6, 14)) { if (!indoor && this.splashes.length < 40 && chance(.5)) this.splashes.push({ x: d.x, y: d.y, t: 0 }); d.y = rnd(-20, 0); d.x = rnd(-40, CONFIG.LW); }
        if (d.x > CONFIG.LW) d.x -= CONFIG.LW + 40;
        c.fillStyle = d.s > 1.1 ? '#cfe0f8' : '#9fb4d8'; const l = d.l * d.s; for (let k = 0; k < l; k += 1) c.fillRect(Math.round(d.x + wind * k * .25), Math.round(d.y + k), 1, 1);
      }
      c.globalAlpha = .7; c.fillStyle = '#d8e6ff';
      for (let i = this.splashes.length - 1; i >= 0; i--) { const s = this.splashes[i]; s.t += DT; const k = s.t / .2; if (k > 1) { this.splashes.splice(i, 1); continue; } c.fillRect(Math.round(s.x - 2 * k - 1), Math.round(s.y - 2 * k), 1, 1); c.fillRect(Math.round(s.x + 2 * k + 1), Math.round(s.y - 2 * k), 1, 1); c.fillRect(Math.round(s.x), Math.round(s.y - 3 * k), 1, 1); }
      c.globalAlpha = 1;
    }
  },
  fog(amt = World.fog, col = '#c8d4e0', camX = 0) {
    if (amt < .02) return; const c = HD.live ? HD.scrx : wctx; c.setTransform(1, 0, 0, 1, 0, 0);
    for (let L = 0; L < 3; L++) {
      const sp = [6, 12, 22][L], y = [210, 260, 300][L], h = [80, 70, 60][L], off = (T * sp + camX * (.2 + L * .3)) % 400;
      c.globalAlpha = amt * [.18, .22, .28][L];
      for (let i = -1; i < 3; i++) { const x = i * 400 - off; const gr = c.createRadialGradient(x + 200, y, 10, x + 200, y, 220); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(x, y - h, 400, h * 2); }
    }
    c.globalAlpha = 1;
  }
};
Weather.init();
/* one entry point for every OUTDOOR scene: rain scaled by how sheltered the place is (1 = open sky, 0 = roofed/underwater) plus snow.
   snowFromRain: cold places turn falling rain into snow. Interiors never call this - their windows show the weather instead. */
function outdoorWeather(groundY, shelter = 1, o = {}) {
  const snow = typeof World.snow === 'number' ? World.snow : 0, rain = World.rain * shelter;
  if (shelter <= 0) return;
  if (o.snowFromRain) { const k = Math.max(snow, World.rain) * shelter; if (k > .02) Weather.draw(groundY, 0, false, k); return; }
  if (rain > .02 || snow > .02) Weather.draw(groundY, rain, false, snow * shelter);
}
