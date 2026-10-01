'use strict';
/* =========================================================
   COMBAT — WEAPON FINISHERS  (5 weapons × 3 variants = 15)
   The killing blow decides how a monster dies. Every enemy, bosses
   included, has 3 deaths per weapon class:
     SWORD  1 Clean Cut     2 Beheading      3 Flurry (diced)
     BOW    1 Pinned        2 Headshot       3 Arrow Rain
     FIRE   1 Ash Heap      2 Combustion     3 Meltdown
     WATER  1 Drowning Orb  2 Riptide        3 Flash-Freeze & Shatter
     LIGHT  1 Ascension     2 Judgement      3 Purge (blown to light)
   Each finisher adapts to the monster:
     · its own blood colour (read from its bespoke style in deaths.js)
     · its body family — flesh, beast, blob, spirit, undead, construct —
       which changes gib physics, sounds, bleeding and fading
     · bosses get a "boss cut": hit-stop, slow-mo, camera punch,
       a shockwave and roughly 1.6× the gore
   The variant rotates so the same enemy+weapon never repeats twice in a row.
   Lucien and Saint Grinwell survive their fights (the story needs them),
   so they play the weapon's hit, then their own exit.
   Preview everything at index.html?deathlab
   ========================================================= */
BLOOD.water = { c: '#3a90e0', d: '#1a4a8a', h: '#a8e0ff' };
BLOOD.ash = { c: '#4a4440', d: '#1a1614', h: '#8a8078' };
BLOOD.ice = { c: '#a8e0ff', d: '#4a8ac0', h: '#ffffff' };
BLOOD.holy = { c: '#ffe890', d: '#c8a040', h: '#ffffff' };
BLOOD.slag = { c: '#ff6020', d: '#3a1008', h: '#ffd040' };

const WEAPON_NAMES = {
  sword: ['Clean Cut', 'Beheading', 'Flurry'], bow: ['Pinned', 'Headshot', 'Arrow Rain'], fire: ['Ash Heap', 'Combustion', 'Meltdown'],
  water: ['Drowning Orb', 'Riptide', 'Flash-Freeze'], light: ['Ascension', 'Judgement', 'Purge']
};
const DEATH_SURVIVORS = { lucien: 1, grinwell: 1 };

/* ---------- monster profiling ---------- */
const _bloodCache = {};
function bloodOf(def) {
  if (def.id in _bloodCache) return _bloodCache[def.id];
  const look = (fn, depth) => {
    if (!fn || depth > 3) return BLOOD.red; const src = fn.toString(), m = src.match(/D\.col = (null|BLOOD\.(\w+))/);
    if (m) return m[1] === 'null' ? null : BLOOD[m[2]] || BLOOD.red;
    const d = src.match(/DEATH_STYLES\.(\w+)\(D\)/); return d ? look(DEATH_STYLES[d[1]], depth + 1) : BLOOD.red;
  };
  return (_bloodCache[def.id] = look(DEATH_STYLES[def.id] || DEATH_STYLES['arch_' + def.arch] || DEATH_STYLES.arch_human, 0));
}
const FAM_ARCH = {
  construct: ['gauntlet', 'mimic', 'gargoyle', 'gremlin'], spirit: ['sprite', 'wraith'], blob: ['jelly', 'balloon', 'clam'],
  beast: ['quad', 'rat', 'goose', 'gull', 'crab', 'penguin', 'sheep', 'horse', 'yeti', 'eel', 'angler', 'whale']
};
function deathFamily(def) {
  const b = bloodOf(def);
  for (const f in FAM_ARCH) if (FAM_ARCH[f].includes(def.arch)) return f;
  if (b === null || b === BLOOD.stone || b === BLOOD.oil) return 'construct';
  if (b === BLOOD.ecto) return 'spirit';
  if (def.undead || b === BLOOD.dust || b === BLOOD.rot) return 'undead';
  if (b === BLOOD.green && def.arch !== 'human') return 'blob';
  return 'flesh';
}
// physics/sound personality per family
const FAMILY = {
  flesh: { bleed: 1, bounce: .3, noisy: 'thud', g: 1, fade: 0, gore: 'gore' },
  beast: { bleed: 1.1, bounce: .3, noisy: 'thud', g: 1, fade: 0, gore: 'gore' },
  blob: { bleed: .6, bounce: .55, noisy: 'squelch', g: .9, fade: 0, gore: 'squelch' },
  spirit: { bleed: .3, bounce: .2, noisy: null, g: .25, fade: .7, gore: 'shatter' },
  undead: { bleed: .5, bounce: .25, noisy: 'clunk', g: 1, fade: 0, gore: 'crack' },
  construct: { bleed: 0, bounce: .45, noisy: 'clunk', g: 1.1, fade: 0, gore: 'crack' }
};
const _lastVariant = {};
function pickDeath(def, st) {
  const w = (st && st.killer) || (typeof S !== 'undefined' && S && S.cls), weapon = WEAPON_NAMES[w] ? w : 'sword';
  let v = st && st.variant !== undefined ? st.variant : -1;
  if (v < 0 || v > 2) { const k = def.id + ':' + weapon, last = _lastVariant[k]; do v = rndi(0, 2); while (v === last); }
  _lastVariant[def.id + ':' + weapon] = v; return { weapon, v };
}

/* ---------- shared beats ---------- */
function dPrep(D, def) {
  D.fam = deathFamily(def); D.F = FAMILY[D.fam]; D.boss = !!def.boss; D.big = D.boss ? 1.6 : 1; D.col = bloodOf(def);
  D.body.pu = D.b.cx; D.n = n => Math.round(n * D.big * (D.F.bleed ? .5 + D.F.bleed * .5 : .4));
}
function gib(D, p, o = {}) {
  if (!p) return p; const F = D.F;
  p.bounce = F.bounce; p.noisy = F.noisy; p.g = GORE_G * F.g * (o.g === undefined ? 1 : o.g); if (F.fade) { p.fade = F.fade; p.float = p.float || -20; }
  p.bleed = (o.bleed === undefined ? 1 : o.bleed) * F.bleed; p.bleedRate = 40 * F.bleed; p.splatHit = F.bleed > .4 && !!D.col;
  if (!D.col) p.wound = false; return p;
}
function goreSound(D) { D.sfx(D.F.gore); if (D.F.bleed) D.sfx('squelch', { v: .5 }); }
function bloodBurst(D, fu, fv, n, o = {}) { if (D.col && D.F.bleed) D.burst(fu, fv, D.n(n), o); else if (!D.F.bleed) { const [x, y] = D.bodyPt(D.U(fu), D.V(fv)); D.smoke(x, y, 6, D.fam === 'spirit' ? '#a0f0e0' : '#8a8a90'); for (let i = 0; i < 14; i++) Particles.spawn({ x, y, vx: rnd(-120, 120), vy: -rnd(30, 160), life: rnd(.4, .9), c: D.fam === 'spirit' ? '#d0fff0' : '#c0c0c8', type: 'spark', size: 1 }); } }
function pools(D, x, r, o = {}) { if (D.col && D.F.bleed > .4) D.pool(x, r * D.big, o); }
function hitStop(D, dur = .3, amt = 1.2) { const B = D.body; B.shake = amt; D.tween(dur, k => { B.shake = amt * (1 - k); }); if (D.boss) { TimeFX.hit && TimeFX.hit(.12); Cam.punchZoom(.06); } }
function bossClimax(D, at) {
  if (!D.boss) return;
  D.at(at, () => { TimeFX.slowmo(1.1, .3); Cam.punchZoom(.1); Cam.shake(.8); D.sfx('boom', { v: .6 });
    Particles.spawn({ x: D.X0, y: CGY, vx: 0, vy: 0, life: .8, c: '#ffffff', type: 'ring', size: 4, drag: 1 }); Particles.spawn({ x: D.X0, y: CGY, vx: 0, vy: 0, life: 1.1, c: '#ffe0a0', type: 'ring', size: 7, drag: 1 });
    D.smoke(D.X0, CGY, 12, '#8a7a68', { r: 30 }); });
}
function slashFx(D, cu, cv, a, t0 = 0, dur = .3, col = '#ffffff', w = 2) {
  const L = D.b.w * .9 + 34;
  D.fx.push({ draw: () => { const k = (D.t - t0) / dur; if (k < 0 || k >= 1) return; const [x, y] = D.bodyPt(cu, cv), ca = Math.cos(a), sa = Math.sin(a), e = Ease.outQ(Math.min(1, k * 2.2));
    ctx.globalAlpha = 1 - k; pLine(col, x - ca * L, y - sa * L, x - ca * L + ca * 2 * L * e, y - sa * L + sa * 2 * L * e, w); pLine('#c8e0ff', x - ca * L, y - sa * L + 1, x - ca * L + ca * 2 * L * e, y - sa * L + sa * 2 * L * e + 1, 1); ctx.globalAlpha = 1; } });
}
function arrowArt(x, y, a, len = 14, alpha = 1, glow) {
  ctx.globalAlpha = alpha; const ca = Math.cos(a), sa = Math.sin(a), tx = x - ca * len, ty = y - sa * len;
  if (glow) { ctx.globalAlpha = alpha * .4; pLine(glow, tx, ty, x, y, 3); ctx.globalAlpha = alpha; }
  pLine('#3a2414', tx, ty + 1, x, y + 1, 1); pLine('#8a5a30', tx, ty, x, y, 1);
  P('#e8e0d0', tx - ca * 2 - 1, ty - sa * 2 - 2, 2, 2); P('#c83a4a', tx - ca * 2, ty - sa * 2 + 1, 2, 1); P('#a0a0a8', x - 1, y - 1, 2, 2); ctx.globalAlpha = 1;
}
// arrows that fly in (from the hero, or from the sky) and stay stuck in the body
function arrowsFx(D) { if (D.arrows) return D.arrows; D.arrows = []; D.fx.push({ draw: () => { for (const ar of D.arrows) { if (D.t < ar.t) continue; const k = clamp((D.t - ar.t) / ar.fly, 0, 1), [x, y] = D.bodyPt(ar.u, ar.v);
  if (k < 1) arrowArt(x - Math.cos(ar.ang) * (1 - k) * 230, y - Math.sin(ar.ang) * (1 - k) * 230, ar.ang, ar.len, 1, ar.glow); else arrowArt(x + Math.cos(ar.ang + D.body.rot) * 3, y + Math.sin(ar.ang + D.body.rot) * 3, ar.ang + D.body.rot, ar.len - 2, 1, ar.glow); } } }); return D.arrows; }
function shootArrow(D, u, v, t, o = {}) {
  const ar = Object.assign({ u, v, t, ang: rnd(-.1, .18), fly: .1, len: 14 }, o); arrowsFx(D).push(ar);
  D.at(t, () => D.sfx('bowrel', { v: .45 }));
  D.at(t + ar.fly, () => { D.sfx('arrowhit'); if (D.F.bleed) D.sfx('squelch', { v: .3 }); else D.sfx('clunk', { v: .4 }); Cam.shake(.12 * D.big); const [x, y] = D.bodyPt(u, v); if (D.col && D.F.bleed) D.bleed(x, y, D.n(12), { ang: ar.ang, spread: .5, smin: 50, smax: 170 }); else bloodBurst(D, (u - D.b.x0) / D.b.w, (v - D.b.y0) / D.b.h, 6); o.onHit && o.onHit(); });
  return ar;
}
function flames(D, dur, rate, from) { const t0 = D.t; D.fx.push({ acc: 0, update(dt, t) { if (t - t0 > dur) return; this.acc += dt * rate * D.big; while (this.acc >= 1) { this.acc--; const [x, y] = from ? from() : [D.wx(D.b.x0 + rnd(0, D.b.w)) + D.body.ox, D.wy(D.b.y0 + D.b.h * rnd(.1, 1)) + D.body.oy];
  Particles.spawn({ x, y, vx: rnd(-8, 8), vy: -rnd(30, 70), life: rnd(.3, .7), c: pick(['#ff6020', '#ffb040', '#fff0a0', '#ff4010']), size: rnd(1, 2), drag: .96 }); if (chance(.22)) Particles.spawn({ x, y: y - 6, vx: rnd(-6, 6), vy: -rnd(10, 25), life: rnd(1, 1.8), c: '#2a2220', type: 'smoke', size: rnd(2, 4), drag: .95 }); } } }); }
function scorch(D, r, grow = 1.2) { D.decal({ type: 'scorch', x: D.X0, y: CGY + 4, r: 2 }); const sc = D.decals[D.decals.length - 1]; D.tween(grow, k => { sc.r = 2 + k * r * D.big; }); }
function waterSplash(D, x, y, n) { for (let i = 0; i < n; i++) { const a = rnd(-Math.PI, 0) + rnd(-.3, .3), sp = rnd(80, 260); D.drop(x + rnd(-8, 8), y + rnd(-10, 10), Math.cos(a) * sp, Math.sin(a) * sp, { col: BLOOD.water }); } for (let i = 0; i < 16; i++) Particles.spawn({ x: x + rnd(-10, 10), y: y + rnd(-10, 10), vx: rnd(-90, 90), vy: -rnd(30, 140), life: rnd(.5, 1), c: '#c8f0ff', type: 'drop', size: 1 }); }
function lightPillar(D, t0, dur, wMul = 1) { D.fx.push({ draw: () => { const k = (D.t - t0) / dur; if (k < 0 || k >= 1) return; const a = Math.sin(k * Math.PI), w = (D.b.w * .5 + 10) * (.4 + a * .6) * wMul, x = D.X0;
  ctx.globalAlpha = a * .35; P('#fff4c0', x - w, -20, w * 2, CGY + 26); ctx.globalAlpha = a * .7; P('#ffffff', x - w * .35, -20, w * .7, CGY + 26); ctx.globalAlpha = a * .6; pEll('#fff4c0', x, CGY + 4, w * 1.4, 5); ctx.globalAlpha = 1; } }); }
function sigil(D, delay) { const sg = { a: 0 }; D.tween(1, k => { sg.a = k; }, delay); D.decal({ type: 'draw', draw: () => { if (!sg.a) return; ctx.globalAlpha = sg.a * .7; ctx.strokeStyle = '#ffe890'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(D.X0, CGY + 5, 20 * D.big, 5 * D.big, 0, 0, TAU); ctx.stroke(); P('#ffe890', D.X0 - 1, CGY - 1, 2, 12); P('#ffe890', D.X0 - 6, CGY + 3, 12, 2); ctx.globalAlpha = 1; } }); }
function dMid(D) { return D.wy(D.b.cy); }

/* =========================================================
   THE 15 FINISHERS
   ========================================================= */
const WEAPON_DEATH = {
  sword: [
    // 1 CLEAN CUT — one diagonal slice, halves slide apart along the cut
    D => {
      const a = rnd(-.55, .35), cu = D.b.cx + rnd(-3, 3), cv = D.b.y0 + D.b.h * rnd(.4, .58);
      D.sfx('slash'); Cam.shake(.35); hitStop(D, .32); slashFx(D, cu, cv, a, 0, .34);
      D.at(.34, () => { goreSound(D); Cam.shake(.4);
        const [top, bot] = D.cutLine(cu, cv, a);
        if (gib(D, top, { bleed: 1.4 })) { top.vx = 40 + Math.cos(a) * 60; top.vy = -60 + Math.sin(a) * 40; top.vr = rnd(1.5, 3.5); }
        if (gib(D, bot, { bleed: 1.6 })) { bot.ground = D.Y0 + 1; bot.vx = 0; bot.vy = 0; if (D.col && D.F.bleed) D.spray({ from: () => [bot.x, bot.y - 6], ang: -Math.PI / 2 + .3, spread: .3, rate: 150 * D.big, dur: 1.3, pulse: 2.2, smin: 90, smax: 200, sound: 1 });
          D.at(1.1, () => { bot.vr = rnd(1.2, 2); bot.vx = 12; D.sfx(D.F.noisy || 'thud', { v: .7 }); }); }
        bloodBurst(D, .5, (cv - D.b.y0) / D.b.h, 50, { ang: Math.PI * .1, spread: .5, smin: 80, smax: 240 }); pools(D, D.X0 + 4, 26, { delay: .4 }); pools(D, D.X0 + 30, 10, { delay: .8 }); });
      bossClimax(D, .4);
    },
    // 2 BEHEADING — a flat cut through the neck, the head spins off, the body kneels then falls forward
    D => {
      const B = D.body, cv = D.b.y0 + D.b.h * (D.fam === 'beast' ? .4 : .3);
      D.sfx('whoosh'); hitStop(D, .2, .8); slashFx(D, D.b.cx, cv, rnd(-.08, .08), .05, .25, '#ffffff', 3);
      D.at(.22, () => { D.sfx('slash'); goreSound(D); Cam.shake(.45);
        const [head] = D.cutAbove(cv, false); D.erase(head);
        if (gib(D, head, { bleed: 1.2 })) { head.vx = rnd(35, 70); head.vy = -rnd(170, 220); head.vr = rnd(8, 14); }
        if (D.col && D.F.bleed) D.spray({ from: () => D.bodyPt(D.b.cx, cv + 2), ang: () => -Math.PI / 2 + B.rot, spread: .22, rate: 180 * D.big, dur: 1.6, pulse: 2.5, smin: 120, smax: 240, sound: 1 });
        else bloodBurst(D, .5, (cv - D.b.y0) / D.b.h, 20);
        D.tween(.5, k => { B.sy = 1 - k * .14; }, .3);
        D.tween(.6, k => { B.rot = -k * 1.5; B.ox = -k * 6; }, 1.1, Ease.inQ);
        D.at(1.7, () => { D.sfx(D.F.noisy || 'thud', { v: 1 }); Cam.shake(.4); D.smoke(D.X0 - 20, CGY, 6, '#8a7a68'); pools(D, D.X0 - 26, 30, { rate: 14 }); }); });
      bossClimax(D, .3);
    },
    // 3 FLURRY — four crossing slashes in a blink, then the monster falls apart in cubes
    D => {
      const B = D.body, cuts = [-.7, .6, -.1, 1.2];
      cuts.forEach((a, i) => { D.at(i * .09, () => { D.sfx('slash', { v: .6 }); Cam.shake(.15); }); slashFx(D, D.b.cx + rnd(-4, 4), D.b.cy + rnd(-6, 6), a, i * .09, .35, i % 2 ? '#e0f0ff' : '#ffffff'); });
      B.shake = 1.5; D.tween(.55, k => { B.shake = 1.5 * (1 - k); });
      D.at(.6, () => { goreSound(D); D.sfx('gore', { v: .8 }); Cam.shake(.5);
        D.cutGrid(D.boss ? 4 : 3, D.boss ? 5 : 4, .15, false, (p, k) => { gib(D, p, { bleed: .6 }); const dir = p.cu > D.b.cx ? 1 : -1; p.vx = dir * rnd(10, 70) + 30; p.vy = -rnd(20, 140); p.vr = rnd(-6, 6); });
        bloodBurst(D, .5, .5, 80, { smin: 60, smax: 260 }); pools(D, D.X0, 32, { rate: 26 }); });
      bossClimax(D, .65);
    }
  ],
  bow: [
    // 1 PINNED — volley, knocked flat on its back, final arrow pins it
    D => {
      const B = D.body; for (let i = 0; i < 4 + (D.boss ? 2 : 0); i++) shootArrow(D, D.b.x0 + D.b.w * rnd(.25, .7), D.b.y0 + D.b.h * rnd(.15, .7), i * .16, { onHit: () => { B.ox += 3; } });
      D.at(.85, () => { D.sfx('heavy'); Cam.shake(.4);
        D.tween(.55, k => { B.rot = k * 1.45; B.ox = 14 + k * 22; }, 0, Ease.inQ);
        D.at(.56, () => { D.sfx(D.F.noisy || 'thud', { v: 1 }); Cam.shake(.5); D.smoke(D.X0 + 30, CGY, 8, '#8a7a68'); pools(D, D.X0 + 28, 24, { rate: 10 }); hitStop(D, .3, .6); });
        D.at(1.2, () => { const pin = { t: D.t }; D.sfx('bowrel'); D.at(.12, () => { D.sfx('arrowhit'); goreSound(D); Cam.shake(.25); bloodBurst(D, .5, .5, 20, { ang: -Math.PI / 2, spread: .6, smin: 40, smax: 120 }); });
          D.fx.push({ draw: () => { const k = clamp((D.t - pin.t) / .12, 0, 1), [x, y] = D.bodyPt(D.b.cx, D.b.y0 + D.b.h * .45); arrowArt(x - (1 - k) * 120, y - (1 - k) * 140, 1.25, 16); } }); }); });
      bossClimax(D, 1.4);
    },
    // 2 HEADSHOT — one charged arrow through the head; flung backward in a somersault
    D => {
      const B = D.body, hv = D.b.y0 + D.b.h * .18; B.pv = D.b.cy; B.pu = D.b.cx;
      D.sfx('charge', { v: .4 });
      D.fx.push({ draw: () => { if (D.t > .5) return; const k = D.t / .5, [x, y] = D.bodyPt(D.b.cx, hv); ctx.globalAlpha = k * .7; ctx.strokeStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), Math.max(1, 10 * (1 - k) + 2), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; } });
      shootArrow(D, D.b.cx, hv, .45, { ang: 0, fly: .06, len: 18, glow: '#fff0b0', onHit: () => { TimeFX.hit && TimeFX.hit(.12); Cam.punchZoom(.06); bloodBurst(D, .7, .18, 40, { ang: 0, spread: .35, smin: 120, smax: 300 }); } });
      D.at(.53, () => { goreSound(D);
        // airborne flip: rises, spins backwards, lands far behind
        const st = { vx: 85, vy: -190, y: 0 }; D.fx.push({ update: (dt, t) => { if (st.done) return; st.vy += 560 * dt; st.y += st.vy * dt; B.ox += st.vx * dt; B.rot += 7.5 * dt; B.oy = Math.min(0, st.y) - (D.b.cy - DSY) * 0; if (st.y >= 0 && st.vy > 0) { st.done = true; B.oy = Math.max(0, (DSY - D.b.cy) - D.b.w * .5); B.rot = Math.PI / 2; D.sfx(D.F.noisy || 'thud', { v: 1 }); Cam.shake(.5); D.smoke(D.X0 + B.ox, CGY, 8, '#8a7a68'); pools(D, D.X0 + B.ox, 22, { rate: 12 }); } } });
        if (D.col && D.F.bleed) D.spray({ from: () => D.bodyPt(D.b.cx, hv), ang: () => Math.PI + B.rot, spread: .4, rate: 70 * D.big, dur: 1.2, smin: 40, smax: 110 }); });
      bossClimax(D, .55);
    },
    // 3 ARROW RAIN — the sky fills with arrows; riddled, it sinks to its knees and slumps over
    D => {
      const B = D.body, n = D.boss ? 16 : 11; D.sfx('bowrel'); D.sfx('whoosh', { v: .6 });
      for (let i = 0; i < n; i++) shootArrow(D, D.b.x0 + D.b.w * rnd(.1, .9), D.b.y0 + D.b.h * rnd(.05, .55), .35 + i * .06, { ang: Math.PI / 2 + rnd(-.25, .15), fly: .14, len: 13, onHit: () => { B.sy = Math.max(.75, B.sy - .015); } });
      // misses stick in the ground all around
      const ground = []; for (let i = 0; i < 12; i++) ground.push({ x: D.X0 + rnd(-50, 50), y: CGY + rnd(-2, 10), t: .3 + i * .07, a: Math.PI / 2 + rnd(-.3, .2) });
      D.decal({ type: 'draw', draw: () => { for (const q of ground) if (D.t > q.t + .14) arrowArt(q.x, q.y, q.a, 11); } });
      D.fx.push({ draw: () => { for (const q of ground) if (D.t > q.t && D.t < q.t + .14) { const k = (D.t - q.t) / .14; arrowArt(q.x - Math.cos(q.a) * (1 - k) * 220, q.y - Math.sin(q.a) * (1 - k) * 220, q.a, 11); } } });
      D.at(.4 + n * .06, () => { hitStop(D, .35, .8); goreSound(D); D.tween(.5, k => { B.sy = Math.min(B.sy, 1 - k * .22); B.ox = k * 3; }, .3); D.tween(.5, k => { B.rot = k * 1.4; }, 1, Ease.inQ);
        D.at(1.5, () => { D.sfx(D.F.noisy || 'thud', { v: 1 }); Cam.shake(.4); pools(D, D.X0 + 16, 30, { rate: 12 }); D.smoke(D.X0 + 20, CGY, 6, '#8a7a68'); }); });
      bossClimax(D, .4 + n * .06 + .1);
    }
  ],
  fire: [
    // 1 ASH HEAP — catches fire, chars black, crumbles into a smouldering pile
    D => {
      const B = D.body; D.col = D.col ? BLOOD.ash : null; D.sfx('firehit'); D.sfx('sizzle'); Cam.shake(.3);
      flames(D, 2.2, 90); B.tint = '#ff7020'; D.tween(.6, k => { B.tintA = .25 + k * .4; B.shake = 1 * (1 - k * .5); });
      D.at(.6, () => { B.tint = '#1a0a04'; B.tintA = 0; D.tween(.8, k => { B.tintA = k * .9; B.sy = 1 - k * .08; }); D.sfx('sizzle'); });
      scorch(D, 26, 1.4);
      D.at(1.5, () => { B.shake = 0; D.sfx('crack'); D.disintegrate({ dir: 'down', dur: 1.1 * D.big, mode: 'fall', tint: ['#2a2220', '#4a4440', '#1a1614', '#6a5a50', '#ff6020'], step: 2, heap: 1.2, spreadX: 6 }); });
      D.at(2.7, () => { for (let i = 0; i < 14; i++) Particles.spawn({ x: D.X0 + rnd(-14, 14), y: CGY - rnd(0, 6), vx: rnd(-6, 6), vy: -rnd(15, 40), life: rnd(1, 2.4), c: pick(['#ff8020', '#ffd040']), size: 1, drag: .98 }); D.smoke(D.X0, CGY - 4, 6, '#3a3430'); });
      bossClimax(D, 1.5);
    },
    // 2 COMBUSTION — swells red-hot, glowing cracks spread, then it explodes in burning chunks
    D => {
      const B = D.body; D.sfx('firecast'); flames(D, 1.1, 50);
      D.makeCracks(D.boss ? 9 : 6, '#ffd040'); B.tint = '#ff4010';
      D.tween(1, (k, r) => { D.cracks.k = k; B.tintA = k * .55; B.sx = 1 + k * .12 + Math.sin(r * 60) * .02 * k; B.sy = 1 + k * .1; B.shake = k * 1.5; }, 0, Ease.inQ);
      D.at(.4, () => D.sfx('sizzle')); D.at(.8, () => D.sfx('charge', { v: .5 }));
      D.at(1.05, () => { D.sfx('boom'); D.sfx('firehit'); goreSound(D); Cam.shake(.8); Post.doFlash && Post.doFlash(.3, '#ffb060'); B.shake = 0;
        D.cutGrid(3, 3, .35, true, p => { gib(D, p, { bleed: .4 }); p.tint = '#2a1008'; p.tintA = .6; p.vx = rnd(-140, 240); p.vy = -rnd(160, 340); p.vr = rnd(-12, 12); flames(D, 1.6, 12, () => [p.x, p.y]); });
        for (let i = 0; i < 40; i++) Particles.spawn({ x: D.X0 + rnd(-8, 8), y: dMid(D) + rnd(-8, 8), vx: rnd(-200, 200), vy: rnd(-220, 60), life: rnd(.3, .8), c: pick(['#ff6020', '#ffb040', '#fff0a0']), type: 'spark', size: 1, drag: .94 });
        D.smoke(D.X0, dMid(D), 14, '#2a2220', { r: 20 }); scorch(D, 34, .4); bloodBurst(D, .5, .5, 30); });
      bossClimax(D, 1.1);
    },
    // 3 MELTDOWN — flails as it burns, then slumps and melts into a bubbling puddle of slag
    D => {
      const B = D.body; B.pv = DSY; D.sfx('firehit'); D.sfx(D.def && D.def.voice || 'ehurt', { v: .6 }); flames(D, 3, 70); B.tint = '#ff6020';
      D.tween(1.1, (k, r) => { B.ox = Math.sin(r * 22) * 6; B.rot = Math.sin(r * 17) * .15; B.tintA = .3 + k * .3; }, 0, Ease.linear || (x => x));
      D.at(1.1, () => { D.sfx('sizzle'); B.tint = '#3a1008'; D.tween(1.4, k => { B.ox *= .9; B.rot *= .9; B.sy = 1 - k * .95; B.sx = 1 + k * .9; B.tintA = .6 + k * .3; }, 0, Ease.inQ);
        const slag = { r: 0 }; D.tween(1.4, k => { slag.r = k; }, .2);
        D.decal({ type: 'draw', draw: () => { if (!slag.r) return; const r = 26 * slag.r * D.big; pEll('#3a1008', D.X0, CGY + 4, r + 2, r * .3 + 1); pEll('#c03a08', D.X0, CGY + 4, r, r * .28); ctx.globalAlpha = .8; pEll('#ffb040', D.X0 - r * .2, CGY + 3, r * .4, r * .1 + .5); ctx.globalAlpha = 1;
          for (let i = 0; i < 4; i++) { const ph = (D.t * 1.3 + i * .27) % 1; if (ph < .5) pCirc('#ffd040', D.X0 + (i - 1.5) * r * .4, CGY + 3 - ph * 3, Math.max(.5, 1.5 - ph * 2)); } } }); });
      D.at(2.6, () => { B.on = false; D.smoke(D.X0, CGY, 10, '#2a2220', { r: 16 }); D.sfx('sizzle'); });
      bossClimax(D, 2.5);
    }
  ],
  water: [
    // 1 DROWNING ORB — trapped in a water orb, struggling, then it bursts into soggy chunks
    D => {
      const B = D.body, C0 = D.col; D.sfx('watercast'); const o = { r: 0 }; D.tween(.5, k => { o.r = k; });
      D.fx.push({ update: (dt, t) => { if (t < 1.3 && chance(dt * 14)) { const a = rnd(TAU); Particles.spawn({ x: D.X0 + Math.cos(a) * 10, y: dMid(D) + Math.sin(a) * 10, vx: 0, vy: -rnd(15, 35), life: rnd(.4, .8), c: '#c8f0ff', type: 'ring', size: .3, drag: .98 }); } },
        draw: () => { if (D.t >= 1.3 || o.r <= 0) return; const rx = (D.b.w * .62 + 10) * o.r, ry = (D.b.h * .62 + 8) * o.r, x = D.X0 + B.ox, y = dMid(D) + B.oy, w = Math.sin(D.t * 9) * 1.5;
          ctx.globalAlpha = .28; pEll('#3a90e0', x, y, rx + w, ry - w); ctx.globalAlpha = .5; ctx.strokeStyle = '#a8e0ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), Math.max(1, rx + w), Math.max(1, ry - w), 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = .8; P('#ffffff', x - rx * .5, y - ry * .6, 3, 2); ctx.globalAlpha = 1; } });
      D.tween(1.2, (k, r) => { B.oy = -k * 10; B.rot = Math.sin(r * 26) * .08 * (1 - r); B.tint = '#3a7ac0'; B.tintA = k * .45; B.sx = 1 + Math.sin(r * 30) * .03; }, .1);
      D.at(1.3, () => { D.sfx('waterhit'); goreSound(D); D.sfx('splat'); Cam.shake(.45); waterSplash(D, D.X0, dMid(D), Math.round(120 * D.big));
        D.cutGrid(3, 4, .3, false, p => { gib(D, p, { bleed: .5 }); p.vx = rnd(-120, 160); p.vy = -rnd(60, 200); p.vr = rnd(-8, 8); p.bounce = .1; p.tint = '#3a7ac0'; p.tintA = .35; });
        D.pool(D.X0, 34 * D.big, { rate: 40, col: BLOOD.water }); D.pool(D.X0 + 30, 14, { delay: .2, col: BLOOD.water });
        if (C0 && D.F.bleed) { D.pool(D.X0 - 6, 12, { delay: .5, col: C0 }); bloodBurst(D, .5, .5, 30, { smin: 60, smax: 160 }); } });
      bossClimax(D, 1.35);
    },
    // 2 RIPTIDE — a wave crashes in from the hero's side and tumbles the body away
    D => {
      const B = D.body; B.pv = D.b.cy; D.sfx('watercast'); const wv = { x: -160 };
      D.tween(1.1, k => { wv.x = -160 + k * 380; }, 0, Ease.inQ);
      D.fx.push({ draw: () => { if (D.t > 2.4) return; const x = D.X0 + wv.x, h = (40 + D.b.h * .5) * D.big, a = clamp(2.4 - D.t, 0, 1);
        ctx.globalAlpha = .75 * a; pPoly('#2a6ab0', [[x - 140, CGY + 12], [x - 20, CGY + 12 - h * .6], [x, CGY + 12 - h], [x + 14, CGY + 12 - h * .7], [x + 24, CGY + 12]]); ctx.globalAlpha = .9 * a; pPoly('#c8f0ff', [[x - 4, CGY + 12 - h], [x + 16, CGY + 12 - h * .85], [x + 8, CGY + 12 - h * .7]]);
        for (let i = 0; i < 6; i++) P('#e8f8ff', x - 20 - i * 18, CGY + 12 - h * .5 + Math.sin(D.t * 8 + i) * 4, 6, 1); ctx.globalAlpha = 1; } });
      D.at(.6, () => { D.sfx('splash'); D.sfx('waterhit'); Cam.shake(.5); goreSound(D); waterSplash(D, D.X0 - 10, dMid(D), 60); bloodBurst(D, .4, .5, 24, { ang: 0, spread: .6 });
        D.tween(1.6, (k, r) => { B.ox = k * 120; B.rot = r * 7; B.oy = -Math.sin(r * Math.PI) * 18; B.tint = '#3a7ac0'; B.tintA = r * .4; B.alpha = 1 - Math.max(0, r - .7) / .3; }, 0, Ease.outQ);
        D.fx.push({ update: (dt, t) => { if (t < 2.2 && chance(dt * 30)) Particles.spawn({ x: D.X0 + B.ox + rnd(-10, 10), y: CGY - rnd(0, 20), vx: rnd(-40, 40), vy: -rnd(20, 90), life: .6, c: '#c8f0ff', type: 'drop', size: 1 }); } });
        D.pool(D.X0 + 10, 40 * D.big, { rate: 30, col: BLOOD.water }); pools(D, D.X0 + 60, 12, { delay: .5 }); pools(D, D.X0 + 110, 10, { delay: .8 }); });
      bossClimax(D, .65);
    },
    // 3 FLASH-FREEZE — frost races over it, frozen solid, cracks, and shatters into ice shards
    D => {
      const B = D.body; D.sfx('watercast'); D.sfx('sizzle', { v: .5 }); B.tint = '#c8f0ff';
      D.tween(.7, k => { B.tintA = k * .75; }, 0, Ease.outQ);
      const crys = []; for (let i = 0; i < 10; i++) crys.push({ u: D.b.x0 + rnd(0, D.b.w), v: D.b.y0 + rnd(0, D.b.h), s: rnd(2, 5), t: rnd(0, .6) });
      D.fx.push({ draw: () => { if (!B.on) return; for (const c of crys) { if (D.t < c.t) continue; const [x, y] = D.bodyPt(c.u, c.v), s = c.s * Math.min(1, (D.t - c.t) * 4); pPoly('#ffffff', [[x, y - s], [x + s * .5, y], [x, y + s], [x - s * .5, y]]); } } });
      D.fx.push({ update: (dt, t) => { if (t < 1.3 && chance(dt * 10)) Particles.spawn({ x: D.X0 + rnd(-20, 20), y: dMid(D) + rnd(-20, 20), vx: 0, vy: 6, life: 1, c: '#ffffff', type: 'star', size: 1, drag: 1 }); } });
      D.at(.75, () => { D.sfx('crack'); D.makeCracks(D.boss ? 8 : 5, '#ffffff'); D.tween(.5, k => { D.cracks.k = k; }); hitStop(D, .5, .5); });
      D.at(1.35, () => { D.sfx('shatter'); D.sfx('crack'); Cam.shake(.6); D.col = D.col && D.F.bleed ? D.col : null;
        D.cutGrid(D.boss ? 5 : 4, D.boss ? 6 : 5, .35, true, p => { p.tint = '#c8f0ff'; p.tintA = .7; p.wound = false; p.vx = rnd(-160, 220); p.vy = -rnd(60, 240); p.vr = rnd(-14, 14); p.bounce = .45; p.noisy = 'clunk'; p.fade = .25; p.bleed = 0; });
        for (let i = 0; i < 30; i++) Particles.spawn({ x: D.X0 + rnd(-10, 10), y: dMid(D) + rnd(-14, 14), vx: rnd(-160, 160), vy: -rnd(30, 200), life: rnd(.4, 1), c: pick(['#ffffff', '#c8f0ff', '#8ac8f0']), type: 'spark', size: 1 });
        D.decal({ type: 'draw', draw: () => { ctx.globalAlpha = .5; pEll('#c8f0ff', D.X0, CGY + 5, 28 * D.big, 5); ctx.globalAlpha = 1; } }); pools(D, D.X0, 8, { delay: .6 }); });
      bossClimax(D, 1.4);
    }
  ],
  light: [
    // 1 ASCENSION — a pillar of light lifts it, bleaches it white, and it rises away as motes
    D => {
      const B = D.body; D.sfx('lightcast'); D.sfx('bell', { v: .5 }); Cam.shake(.2); lightPillar(D, 0, 2.6); Post.doFlash && Post.doFlash(.25);
      B.tint = '#ffffff'; D.tween(1.1, k => { B.tintA = k * .85; B.oy = -k * 16; }, .1, Ease.ioQ);
      D.at(.25, () => bloodBurst(D, .5, .5, 18, { ang: -Math.PI / 2, spread: .8, smin: 40, smax: 120 }));
      D.at(1.2, () => { D.sfx('lighthit'); D.disintegrate({ dir: 'down', dur: 1.2 * D.big, mode: 'rise', tint: ['#ffffff', '#fff4c0', '#ffe890', '#f0d070'], step: 2 }); });
      D.fx.push({ update: (dt, t) => { if (t > 1.2 && t < 2.6 && chance(dt * 30)) Particles.spawn({ x: D.X0 + rnd(-16, 16), y: dMid(D) + rnd(-20, 20), vx: rnd(-6, 6), vy: -rnd(20, 50), life: rnd(.6, 1.2), c: '#fff8d0', type: 'star', size: 2, drag: .98 }); } });
      sigil(D, 1.4); bossClimax(D, 1.2);
    },
    // 2 JUDGEMENT — lances of light fall from the sky and impale it; light pours out of the cracks; it bursts
    D => {
      const B = D.body, n = D.boss ? 5 : 3, lances = [];
      for (let i = 0; i < n; i++) { const u = D.b.x0 + D.b.w * (.25 + .5 * i / Math.max(1, n - 1)), t = .2 + i * .22; lances.push({ u, t });
        D.at(t + .12, () => { D.sfx('lighthit'); Cam.shake(.3); hitStop(D, .15, 1); B.oy += 2; bloodBurst(D, (u - D.b.x0) / D.b.w, .3, 14, { ang: -Math.PI / 2, spread: .7 }); }); }
      D.at(.1, () => D.sfx('lightcast'));
      D.fx.push({ draw: () => { for (const L of lances) { if (D.t < L.t || !B.on && D.t > 2) continue; const k = clamp((D.t - L.t) / .12, 0, 1), [x, y] = D.bodyPt(L.u, D.b.y0 + D.b.h * .6), top = -30, tipY = top + (y - top) * k;
        ctx.globalAlpha = .4; P('#fff4c0', x - 3, top, 6, tipY - top); ctx.globalAlpha = 1; P('#ffffff', x - 1, top, 2, tipY - top); pPoly('#ffffff', [[x - 3, tipY - 4], [x + 3, tipY - 4], [x, tipY + 4]]); } } });
      D.at(.25 + n * .22, () => { D.makeCracks(D.boss ? 9 : 6, '#fff4c0'); B.tint = '#ffe890'; D.tween(.6, k => { D.cracks.k = k; B.tintA = k * .6; B.shake = k * 1.2; }); D.sfx('charge', { v: .5 }); });
      D.at(.9 + n * .22, () => { D.sfx('boom', { v: .6 }); D.sfx('bell'); Post.doFlash && Post.doFlash(.4); Cam.shake(.6);
        D.cutGrid(3, 4, .3, true, p => { p.tint = '#ffffff'; p.tintA = .6; p.wound = false; p.vx = rnd(-120, 160); p.vy = -rnd(80, 220); p.vr = rnd(-8, 8); p.fade = .8; p.float = -40; p.bleed = 0; });
        for (let i = 0; i < 40; i++) Particles.spawn({ x: D.X0, y: dMid(D), vx: rnd(-180, 180), vy: rnd(-180, 80), life: rnd(.5, 1.1), c: pick(['#ffffff', '#fff4c0', '#ffe890']), type: 'star', size: 2, drag: .93 });
        pools(D, D.X0, 18, { delay: .3 }); sigil(D, .2); });
      bossClimax(D, .95 + n * .22);
    },
    // 3 PURGE — a halo of light expands from inside; it's burnt away from the edges and blown away as gold dust
    D => {
      const B = D.body; D.sfx('lightcast'); B.tint = '#ffffff';
      const ring = { r: 0 }; D.tween(1.1, k => { ring.r = k; }, .1);
      D.fx.push({ draw: () => { if (D.t > 2.6) return; const r = ring.r * (D.b.h * .7 + 20) * D.big, a = 1 - ring.r * .6; ctx.globalAlpha = a * .7; ctx.strokeStyle = '#fff4c0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(D.X0, dMid(D), Math.max(1, r), 0, TAU); ctx.stroke(); ctx.globalAlpha = a * .2; pCirc('#fff8d0', D.X0, dMid(D), r); ctx.globalAlpha = 1; } });
      D.tween(.9, (k, r) => { B.tintA = k * .7; B.shake = k * .8; B.sy = 1 + Math.sin(r * 30) * .02; });
      D.at(.4, () => { D.sfx(D.def && D.def.voice || 'ehurt', { v: .5 }); bloodBurst(D, .5, .4, 20, { ang: -Math.PI / 2, spread: 1 }); });
      D.at(1, () => { D.sfx('lighthit'); D.sfx('whoosh'); Post.doFlash && Post.doFlash(.2); B.shake = 0; D.disintegrate({ dir: 'up', dur: 1.3 * D.big, mode: 'blow', tint: ['#ffe890', '#f0d070', '#ffffff', '#c8a040'], step: 2 }); });
      D.decal({ type: 'draw', draw: () => { const a = clamp((D.t - 1) / 1, 0, 1); if (!a) return; ctx.globalAlpha = a * .55; pEll('#2a2010', D.X0, CGY + 5, 18 * D.big, 4 * D.big); ctx.strokeStyle = '#ffe890'; ctx.beginPath(); ctx.ellipse(D.X0, CGY + 5, 22 * D.big, 5 * D.big, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; } });
      bossClimax(D, 1.05);
    }
  ]
};

// survivors (story bosses): the weapon's hit lands, then their own exit plays
const WEAPON_HIT = {
  sword: (D, v) => { [[-.5], [0], [-.7, .6, 1.2]][v].forEach((a, i) => slashFx(D, D.b.cx, D.b.y0 + D.b.h * .45, a, i * .09, .35)); D.sfx('slash'); bloodBurst(D, .5, .45, 30, { ang: 0, spread: .6 }); },
  bow: (D, v) => { for (let i = 0; i < [3, 1, 6][v]; i++) shootArrow(D, D.b.x0 + D.b.w * rnd(.3, .7), D.b.y0 + D.b.h * (v === 1 ? .2 : rnd(.2, .6)), i * .12, v === 2 ? { ang: Math.PI / 2 + rnd(-.2, .2), fly: .14 } : {}); },
  fire: (D, v) => { flames(D, [1.6, 1, 2.2][v], 60); D.sfx('firehit'); scorch(D, 22); if (v === 1) Post.doFlash && Post.doFlash(.3, '#ffb060'); },
  water: (D, v) => { waterSplash(D, D.X0, dMid(D), 70); D.sfx('waterhit'); D.pool(D.X0, 26, { col: BLOOD.water }); if (v === 2) { D.body.tint = '#c8f0ff'; D.tween(.6, k => { D.body.tintA = (1 - k) * .6; }); } },
  light: (D, v) => { lightPillar(D, 0, 1.8, [1, .6, 1.4][v]); D.sfx('lightcast'); Post.doFlash && Post.doFlash(.2); if (v === 2) sigil(D, .3); }
};
DEATH_STYLES.grinwell_exit = D => { // Saint Grinwell: forced to his knees as the grin cracks off his face
  const B = D.body; B.pu = D.b.cx; D.sfx('ehurt'); D.makeCracks(5, '#ffd0f0');
  D.tween(.8, k => { B.sy = 1 - k * .2; B.ox = k * 6; D.cracks.k = k; B.tint = '#ffd0f0'; B.tintA = k * .3; });
  D.at(.9, () => { D.sfx('shatter', { v: .6 }); for (let i = 0; i < 24; i++) Particles.spawn({ x: D.X0 + rnd(-6, 6), y: D.wy(D.b.y0 + D.b.h * .15), vx: rnd(-80, 80), vy: -rnd(20, 120), life: rnd(.6, 1.2), c: pick(['#ffd0f0', '#ffffff', '#f0a0c0']), type: 'spark', size: 1 }); });
};

// called by the Death constructor: returns the style function to run
function weaponDeathStyle(def, st) {
  const base = DEATH_STYLES[def.id] || DEATH_STYLES['arch_' + def.arch] || DEATH_STYLES.arch_human;
  if (Settings.weaponDeaths === false && !(st && st.killer)) return base;
  const { weapon, v } = pickDeath(def, st);
  return D => {
    D.weapon = weapon; D.variant = v; D.deathName = WEAPON_NAMES[weapon][v]; D.def = def; dPrep(D, def);
    if (DEATH_SURVIVORS[def.id]) { (def.id === 'grinwell' ? DEATH_STYLES.grinwell_exit : base)(D); WEAPON_HIT[weapon](D, v); return; }
    WEAPON_DEATH[weapon][v](D);
    if (typeof Toast !== 'undefined' && Scene.name === 'combat' && Settings.deathNames !== false) Toast.add(`${WEAPON_NAMES[weapon][v].toUpperCase()}`, COL.red, '✖');
  };
}
