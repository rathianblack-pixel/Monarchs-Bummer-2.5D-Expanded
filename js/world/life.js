'use strict';
/* =========================================================
   LIFE — Part 5 (a living world)
   · Daily schedules: lunch and evening gatherings at the plaza; shops keep hours
   · Ambient life: sparrow flock that scatters, flags in the wind, plaza lantern
     string, festival crowd after Barnaby, a second cat, merchant chimney smoke
   · Weather: SNOW (snowfall, ground cover, footprints), ground mist in fog,
     rain puddles that reflect (HIGH)
   · Chatter: townsfolk bark lines that change after every boss; first-chat lines
   Hooks in village.js: Life.villageDecal / villageProps / villageLights / rainMask
   ========================================================= */
const SHOP_HOURS = { merchant: [7, 20], smith: [6, 19] };
const PLAZA = [468, 424, 610, 470];
const Life = {
  snow: 0, snowAcc: 0, prints: [], birds: null, barkT: 3, pbark: null, pbarkT: 6,
  phase() { const t = World.time; return t < 6 ? 'night' : t < 8 ? 'dawn' : t >= 11.5 && t < 13.5 ? 'lunch' : t >= 17.5 && t < 20.3 ? 'evening' : t >= 20.3 ? 'night' : 'work'; },
  shopOpen(id) { const h = SHOP_HOURS[id]; if (!h) return true; const t = World.time; return t >= h[0] && t < h[1]; },
  stage() { let s = 'start'; for (const b of BARK_STAGES) if (b !== 'start' && S.bosses[b]) s = b; return s; },
  hourStr(h) { return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`; },
  // ---------- village: ground decals (snow cover, footprints, mist) ----------
  villageDecal(c, t, vx0, vy0, vx1, vy1, hd) {
    const sa = this.snowAcc;
    if (sa > .02) {
      const cs = Gfx.level > 0 ? 8 : 12;
      for (let y = Math.floor(vy0 / cs) * cs; y < vy1; y += cs) { const rx0 = RIVER.x0(y) - 2, rx1 = RIVER.x1(y) + 2, br = y > RIVER.bridgeY0 - 4 && y < RIVER.bridgeY1;
        for (let x = Math.floor(vx0 / cs) * cs; x < vx1; x += cs) { if (!br && x + cs > rx0 && x < rx1) continue; const n = hash(x * 7 + y * 131) * .5 + .5, k = clamp(sa * 1.7 - n * .45, 0, 1); if (k <= 0) continue; c.globalAlpha = k * .86; c.fillStyle = n > .78 ? '#ffffff' : n > .35 ? '#eef3fc' : '#d8e2f2'; c.fillRect(x, y, cs, cs); } }
      c.globalAlpha = 1;
    }
    if (this.prints.length) { for (const p of this.prints) { const a = clamp(1 - (T - p.t) / 40, 0, 1) * Math.min(1, sa * 2); if (a <= 0) continue; c.globalAlpha = a * .8; c.fillStyle = '#9aa8c4'; c.fillRect(Math.round(p.x + (p.s ? 1 : -3)), Math.round(p.y + (p.s ? 1 : -1)), 2, 2); c.fillStyle = '#c0cce0'; c.fillRect(Math.round(p.x + (p.s ? 1 : -3)), Math.round(p.y + (p.s ? 3 : 1)), 2, 1); } c.globalAlpha = 1; }
    if (World.fog > .05) { for (let i = 0; i < 9; i++) { const R = RNG(4400 + i), x = ((R() * 1800 + T * (4 + R() * 6)) % 1800) - 180, y = 120 + R() * 600; if (x < vx0 - 160 || x > vx1 + 160 || y < vy0 - 60 || y > vy1 + 60) continue; const gr = c.createRadialGradient(x, y, 4, x, y, 150); gr.addColorStop(0, 'rgba(220,228,240,.5)'); gr.addColorStop(1, 'rgba(220,228,240,0)'); c.globalAlpha = World.fog * .55; c.fillStyle = gr; c.save(); c.translate(x, y); c.scale(1, .32); c.translate(-x, -y); c.fillRect(x - 150, y - 150, 300, 300); c.restore(); } c.globalAlpha = 1; }
  },
  // rain turns the road's puddles into reflective water (HIGH)
  rainMask() {
    return HD.waterMask('village_rain', [0, 0, VW, VH], (() => { const pd = []; for (let i = 0; i < 26; i++) { const r = RNG(i + 700), x = r() * VW, y = 100 + r() * (VH - 120); if (vSurface(x, y) === 'grass') continue; pd.push([x, y, r.r(6, 14) + 3, r.r(2, 4) + 2]); }
      return (x, y) => (x > RIVER.x0(y) + 3 && x < RIVER.x1(y) - 3 && !(y > RIVER.bridgeY0 - 2 && y < RIVER.bridgeY1 + 2)) || pd.some(p => ((x - p[0]) / p[2]) ** 2 + ((y - p[1]) / p[3]) ** 2 < 1); })(), [.22, .36, .5]);
  },
  // ---------- village: depth-sorted props ----------
  villageProps(add, t, hd, V) {
    const nk = World.nightK(), wind = World.wind;
    // flags
    const flag = (x, y, h, c1, c2, seed) => add(y, () => { P('#4a3424', x, y - h, 2, h); P('#c8a040', x, y - h - 2, 2, 2); for (let i = 0; i < 16; i++) { const wv = Math.sin(T * (5 + wind * 4) - i * .55 + seed) * (1 + wind * 2.4) * (i / 16), yy = Math.round(y - h + 1 + wv); P(i % 4 < 2 ? c1 : shade(c1, -.12), x + 2 + i, yy, 1, 9 - Math.floor(i / 8)); if (i > 2 && i < 13) P(c2, x + 2 + i, yy + 3, 1, 2); } }, null, 0, [x - 4, y - h - 10, 26, h + 12], HI_SMALL);
    flag(PALI - 34, 440, 52, '#7a3a9a', '#f0d860', 0); flag(560, 412, 40, '#c84a3a', '#f8e8c8', 2); flag(B.cath.x + 30, B.cath.y + 6, 46, '#e8e0d0', '#c8a040', 4);
    // plaza lantern string (lit at dusk)
    add(404, () => { const x0 = 470, y0 = 360, x1 = 612, y1 = 350; let px = x0, py = y0; for (let i = 1; i <= 24; i++) { const k = i / 24, x = lerp(x0, x1, k), y = lerp(y0, y1, k) + Math.sin(k * Math.PI) * 9 + Math.sin(T * 1.5 + k * 3) * wind; pLine('#3a2a20', px, py, x, y, 1); px = x; py = y; }
      for (let i = 1; i < 7; i++) { const k = i / 7, x = lerp(x0, x1, k), y = lerp(y0, y1, k) + Math.sin(k * Math.PI) * 9 + Math.sin(T * 1.5 + k * 3) * wind, fl = .75 + Math.sin(T * 9 + i * 2.1) * .15 + noise1(T * 3 + i) * .1, col = ['#f0b040', '#e86050', '#60b0e0'][i % 3];
        P(OLC, x - 2, y, 4, 5); P(nk > .2 ? shade(col, .3 * fl) : col, x - 1, y + 1, 2, 3); if (nk > .2) { ctx.globalAlpha = nk * .35 * fl; pEll(col, x, y + 3, 5, 4); ctx.globalAlpha = 1; } } }, null, 0, [462, 336, 160, 40], HI_SMALL);
    // closed signs
    for (const id of ['merchant', 'smith']) if (!this.shopOpen(id)) { const d = DOORS.find(q => q.id === id); add(d.y + 1, () => { P(OLC, d.x - 9, d.y - 22, 18, 9); P('#a07040', d.x - 8, d.y - 21, 16, 7); P('#d04030', d.x - 6, d.y - 19, 12, 1); P('#d04030', d.x - 6, d.y - 16, 12, 1); P('#3a2a20', d.x - 1, d.y - 26, 2, 4); }, null, 0, [d.x - 12, d.y - 30, 24, 20], HI_SMALL); }
    // sparrows
    for (const b of this.birds || []) add(b.y, () => { const fl = b.z > 0 && Math.sin(T * 40 + b.p) > 0, y = b.y - b.z; if (b.z < 1) { ctx.globalAlpha = .25; P('#1a1020', b.x - 1, b.y, 3, 1); ctx.globalAlpha = 1; } const pk = b.st === 'peck' && Math.sin(T * 8 + b.p) > .5 ? 1 : 0; P(OLC, b.x - 2, y - 3, 5, 3); P('#8a6a4a', b.x - 1, y - 3, 3, 2); P('#6a4a30', b.x + b.d * 2, y - 4 + pk, 2, 2); P('#e0b060', b.x + b.d * 3, y - 3 + pk, 1, 1); if (fl) { P('#7a5a3a', b.x - 2, y - 6, 2, 3); P('#7a5a3a', b.x + 1, y - 6, 2, 3); } }, null, 0, [b.x - 6, b.y - b.z - 10, 12, 12], HI_SMALL);
    // second cat on the cathedral steps
    { const x = 1080, y = 262, sl = World.isNight() || World.rain > .5; if (!sl || nk > .2) add(y, () => { const tail = Math.sin(T * 2.2) * 2; P(OLC, x - 6, y - 7, 12, 7); P('#e8a050', x - 5, y - 6, 10, 5); P('#c88030', x - 3, y - 6, 2, 5); P(OLC, x + 3, y - 11, 6, 5); P('#e8a050', x + 4, y - 10, 4, 3); P('#e8a050', x + 4, y - 12, 1, 2); P('#e8a050', x + 7, y - 12, 1, 2); P(nk > .5 ? '#d0ff60' : '#2a2a1a', x + 5, y - 9, 1, 1); P('#e8a050', x - 8, y - 3 + Math.round(tail * .5), 3, 1); P('#e8a050', x - 9, y - 4 + Math.round(tail), 1, 2); }, null, 0, [x - 12, y - 16, 24, 18], HI_SMALL); }
    // festival crowd after Barnaby (daytime, dry)
    if (S.bosses.barnaby && World.time > 9 && World.time < 18 && World.rain < .4) {
      [[486, 470, 31], [520, 476, 32], [556, 472, 33], [596, 466, 34], [624, 476, 35]].forEach(([x, y, sd], i) => add(y, () => { const ch = Math.sin(T * 3 + i * 1.7) > .55; drawChar(x, y, { seed: sd, s: 1, t: T + i, face: x < 556 ? 1 : -1, skin: SKIN_TONES[i % 5], hair: HAIR_COLS[(i * 3) % HAIR_COLS.length], hairStyle: i % 2 ? 'long' : 'short', top: ['#a85050', '#5080a8', '#80a050', '#a88040', '#8060a8'][i], pants: '#4a3a30', boots: '#3a2a20', armF: ch ? 2.8 : .3, expr: ch ? 'happy' : undefined, body: i % 3 ? 'sturdy' : 'round' }); }, null, 0, [x - 38, y - 66, 76, 74], HI_CHAR));
      if (chance(DT * 2)) Particles.spawn({ x: rnd(470, 640), y: 380, vx: rnd(-10, 10), vy: rnd(-30, -10), g: 30, life: rnd(1.5, 2.5), c: pick(['#f05a8a', '#f0d040', '#5af0c0', '#8a5af0', '#ffffff']), type: 'leaf', rot: rnd(6), vr: rnd(-4, 4), ground: rnd(430, 480) });
    }
  },
  villageLights(L2, nk) { if (nk < .2) return; for (let i = 1; i < 7; i++) { const k = i / 7, x = lerp(470, 612, k), y = lerp(360, 350, k) + Math.sin(k * Math.PI) * 9; L2(x, y + 3, 22, ['#f0b040', '#e86050', '#60b0e0'][i % 3], nk * .55, .15); } },
  // ---------- village: update ----------
  villageUpdate(V, dt) {
    const p = V.P, ph = this.phase(), gather = (ph === 'lunch' || ph === 'evening') && World.rain < .5;
    if (!this.birds) this.birds = Array.from({ length: 7 }, (_, i) => ({ hx: 700 + i * 9 + rnd(-4, 4), hy: 474 + rnd(0, 14), x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, d: 1, st: 'peck', t: rnd(1, 3), p: rnd(10), away: 0 })).map(b => Object.assign(b, { x: b.hx, y: b.hy }));
    // sparrows
    let scare = false; for (const b of this.birds) if (!b.away && Math.hypot(b.x - p.x, (b.y - p.y) * 1.3) < 48) scare = true;
    if (scare) { SFX.play('flick', { v: .4 }); for (const b of this.birds) if (!b.away) { const dx = b.x - p.x || 1; b.away = rnd(7, 11); b.vx = Math.sign(dx) * rnd(70, 120); b.vy = rnd(-30, -10); b.vz = rnd(60, 90); b.d = Math.sign(dx); } }
    for (const b of this.birds) {
      if (b.away) { b.away -= dt; if (b.away > 3) { b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vz += 10 * dt; } else { const k = clamp(1 - b.away / 3, 0, 1); b.x = lerp(b.x, b.hx, k * .08); b.y = lerp(b.y, b.hy, k * .08); b.z = Math.max(0, lerp(b.z, 0, k * .08)); if (b.away <= 0) { b.away = 0; b.z = 0; b.x = b.hx; b.y = b.hy; } } continue; }
      b.t -= dt; if (b.t <= 0) { b.t = rnd(.5, 2.4); b.st = chance(.6) ? 'peck' : 'hop'; if (b.st === 'hop') { b.d = chance(.5) ? 1 : -1; b.hx = clamp(b.hx + b.d * rnd(3, 8), 660, 820); b.z = 2; } }
      b.x += (b.hx - b.x) * Math.min(1, dt * 6); b.z = Math.max(0, b.z - dt * 12);
    }
    // schedules: lunch + evening at the plaza
    for (const v of V.vill) { if (v.guard || v.rod || v.state === 'TALK_P') continue;
      if (gather) { if (!v._area0) { v._area0 = v.area; v.area = PLAZA; if (v.state === 'IDLE' || v.state === 'WORK') v.t = 0; } if (v.state === 'IDLE' && v.vis) { const o = V.vill.find(x => x !== v && x.vis && !x.guard && Math.hypot(x.x - v.x, x.y - v.y) < 36 && x.state !== 'TALK_P'); if (o && chance(dt * .6)) { v.state = 'TALK'; v.t = rnd(3, 6); v.dir = o.x < v.x ? -1 : 1; v.bub = 1; } } }
      else if (v._area0) { v.area = v._area0; v._area0 = null; } }
    // snow footprints
    if (this.snowAcc > .2 && V.moving) { const l = this.prints[this.prints.length - 1]; if (!l || Math.hypot(l.x - p.x, l.y - p.y) > 7) { this.prints.push({ x: p.x, y: p.y, t: T, s: l ? !l.s : 0 }); if (this.prints.length > 140) this.prints.shift(); } }
    // merchant chimney
    if (!World.isNight() && chance(dt * 3)) Particles.spawn({ x: B.merchant.x + 40 + rnd(-2, 2), y: B.merchant.y - B.merchant.wallH - B.merchant.roofH + 4, vx: 5 + World.wind * 25, vy: -12, life: rnd(2, 3.2), c: '#d8d0d0', type: 'smoke', size: 3, drag: .99 });
    // chatter
    this.barkT -= dt; if (this.barkT <= 0) { this.barkT = rnd(5, 9); const near = V.vill.filter(v => v.vis && !v.barkT && v.state !== 'TALK_P' && Math.hypot(v.x - p.x, v.y - p.y) < 230); if (near.length && !Dialog.open) { const v = pick(near); v.bark = pick(BARKS[this.stage()] || BARKS.start); v.barkT = 4.2; } }
    for (const v of V.vill) if (v.barkT) v.barkT = Math.max(0, v.barkT - dt);
  },
  bubble(text, sx, sy, a) {
    const lines = UI.wrap(text, 210, 12, false), w = Math.min(230, Math.max(...lines.map(l => UI.measure(l, 12, false))) + 20), h = lines.length * 15 + 12, x = clamp(sx - w / 2, 8, 1272 - w), y = sy - h - 12;
    g.globalAlpha = a * .92; g.fillStyle = '#f6ecd4'; g.fillRect(x, y, w, h); g.strokeStyle = '#4a3424'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2); g.beginPath(); g.moveTo(sx - 6, y + h); g.lineTo(sx, y + h + 9); g.lineTo(sx + 6, y + h); g.fill();
    g.globalAlpha = a; lines.forEach((l, i) => UI.text(l, x + w / 2, y + 18 + i * 15, { align: 'center', size: 12, bold: false, col: '#3a2818', shadow: false })); g.globalAlpha = 1;
  },
  villageUI(V) { if (Dialog.open || Overlays.stack.length) return; for (const v of V.vill) if (v.barkT > 0 && v.vis && v.bark) { const [sx, sy] = Cam.toScreen(v.x, v.y); this.bubble(v.bark, sx * 2, sy * 2 - 72, clamp(Math.min((4.2 - v.barkT) * 4, v.barkT * 2), 0, 1)); } }
};
/* ---------- weather: snow ---------- */
{ const _wu = World.update;
  World.update = function (dt, running) {
    const w0 = S && S.weatherT; _wu.call(this, dt, running); if (!S) return;
    if (running && S.weatherT > w0 + .5 && S.weather !== 'FOG' && chance(.16)) S.weather = 'SNOW';
    const ts = S.weather === 'SNOW' ? 1 : 0; Life.snow += (ts - Life.snow) * dt * .25; World.snow = Life.snow;
    Life.snowAcc += ((Life.snow > .4 ? 1 : 0) - Life.snowAcc) * dt * (Life.snow > .4 ? .05 : .03);
  };
}
{ const flakes = Array.from({ length: 150 }, () => ({ x: rnd(CONFIG.LW), y: rnd(CONFIG.LH), s: rnd(.5, 1.5), p: rnd(10) }));
  const _wd = Weather.draw;
  Weather.draw = function (groundY, amt, indoor) {
    _wd.apply(this, arguments); const k = Life.snow; if (k < .02 || indoor) return;
    const c = HD.live ? HD.scrx : wctx; c.setTransform(1, 0, 0, 1, 0, 0); const n = Math.floor(flakes.length * k);
    for (let i = 0; i < n; i++) { const f = flakes[i]; f.y += (16 + 22 * f.s) * DT; f.x += (Math.sin(T * 1.2 + f.p) * 10 + World.wind * 30) * DT * f.s; if (f.y > CONFIG.LH + 2) { f.y = -4; f.x = rnd(-20, CONFIG.LW); } if (f.x > CONFIG.LW + 4) f.x -= CONFIG.LW + 8; if (f.x < -6) f.x += CONFIG.LW + 8;
      c.globalAlpha = .55 + f.s * .3; c.fillStyle = '#ffffff'; const sz = f.s > 1.2 ? 2 : 1; c.fillRect(Math.round(f.x), Math.round(f.y), sz, sz); }
    c.globalAlpha = 1;
  };
}
/* ---------- village hooks ---------- */
{ const V = Scenes.village;
  const _ul = V.updateLife; V.updateLife = function (dt) { _ul.call(this, dt); try { Life.villageUpdate(this, dt); } catch (e) { console.error(e); Life.villageUpdate = () => {}; } };
  const _ui = V.ui; V.ui = function () { Life.villageUI(this); return _ui.apply(this, arguments); };
  const _en = V.enter; V.enter = function (a) { Life.birds = null; Life.prints = []; return _en.call(this, a); };
  const _in = V.interact;
  V.interact = function (tgt) {
    if (tgt && tgt.type === 'door' && SHOP_HOURS[tgt.d.id] && !Life.shopOpen(tgt.d.id) && !Dialog.open) { const h = SHOP_HOURS[tgt.d.id]; SFX.play('door', { v: .4 }); Dialog.start([D('', 'narrator', `Locked. A sign on the door: "${tgt.d.id === 'smith' ? 'FORGE' : 'SHOP'} OPEN ${Life.hourStr(h[0])} – ${Life.hourStr(h[1])}." It is ${World.clockStr()}.`)]); return; }
    if (tgt && tgt.type === 'npc' && !Dialog.open && !Overlays.stack.length) { const v = tgt.v, st = Life.stage(), line = BARK_KIND[v.kind] && BARK_KIND[v.kind][st], seen = Travel.st().barkSeen, k = v.kind + ':' + st;
      if (line && !seen[k]) { seen[k] = 1; v.state = 'TALK_P'; v.t = 99; v.dir = this.P.x < v.x ? -1 : 1; this.pdir = -v.dir; Dialog.start([D(PATH_NPCS[v.kind] ? PATH_NPCS[v.kind].name : 'Villager', v.voice, line)], () => { v.state = 'IDLE'; v.t = 1; _in.call(this, tgt); }); return; } }
    return _in.call(this, tgt);
  };
}
/* ---------- port chatter ---------- */
{ const PT = Scenes.port, _ui = PT.ui;
  PT.ui = function () {
    const r = _ui.apply(this, arguments);
    Life.pbarkT -= DT; if (Life.pbarkT <= 0) { Life.pbarkT = rnd(6, 10); const who = pick([[440, 196], [566, 180], [196, 286], [246, 298]]); Life.pbark = { x: who[0], y: who[1], t: 4.2, s: pick((BARKS[Life.stage()] || BARKS.start).concat(['Mind the crabs. They\'re sulking again.', 'Tide\'s coming in. It always does that.', 'Port Mopeway: come for the fish, stay because the boat left.'])) }; }
    const b = Life.pbark; if (b && b.t > 0 && !Dialog.open && !Overlays.stack.length) { b.t -= DT; const [sx, sy] = Cam.toScreen(b.x, b.y); Life.bubble(b.s, sx * 2, sy * 2 - 64, clamp(Math.min((4.2 - b.t) * 4, b.t * 2), 0, 1)); }
    return r;
  };
}
