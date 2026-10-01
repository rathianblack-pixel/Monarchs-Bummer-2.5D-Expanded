'use strict';
/* =========================================================
   CAMERA
   ========================================================= */
const Cam = {
  x: 320, y: 180, zoom: 1, tx: 320, ty: 180, tz: 1, follow: 6, trauma: 0, sx: 0, sy: 0, rx: 0, ry: 0, punch: 0, lock: false,
  reset(x, y, z = 1) { this.x = this.tx = x; this.y = this.ty = y; this.zoom = this.tz = z; this.trauma = 0; this.rx = this.ry = 0; this.punch = 0; },
  shake(a) { this.trauma = Math.min(1, this.trauma + a * Settings.shake); },
  recoil(dx, dy) { this.rx += dx * Settings.shake; this.ry += dy * Settings.shake; },
  punchZoom(a) { this.punch = Math.max(this.punch, a); },
  update(dt) {
    for (const k of ['x', 'y', 'zoom', 'tx', 'ty', 'tz', 'rx', 'ry', 'punch']) if (!isFinite(this[k])) this[k] = k === 'zoom' || k === 'tz' ? 1 : k === 'x' || k === 'tx' ? 320 : k === 'y' || k === 'ty' ? 180 : 0;
    if (!this.lock) { const k = 1 - Math.exp(-this.follow * dt); this.x += (this.tx - this.x) * k; this.y += (this.ty - this.y) * k; this.zoom += (this.tz - this.zoom) * (1 - Math.exp(-4 * dt)); }
    this.trauma = Math.max(0, this.trauma - dt * 1.6); const s = this.trauma * this.trauma * 7;
    this.sx = (noise1(T * 31) ) * s; this.sy = (noise1(T * 29 + 50)) * s;
    this.rx *= Math.pow(.001, dt); this.ry *= Math.pow(.001, dt); this.punch *= Math.pow(.0005, dt);
  },
  apply(c, par = 1, round = true) {
    const z = 1 + (this.zoom + this.punch - 1) * par;
    const cx = (this.x - this.rx) * par, cy = this.y * par;
    let ox = CONFIG.LW / 2 - cx * z + this.sx * par, oy = CONFIG.LH / 2 - (cy - this.ry * par) * z + this.sy * par;
    if (round) { ox = Math.round(ox); oy = Math.round(oy); }
    c.setTransform(z, 0, 0, z, ox, oy);
  },
  toScreen(x, y) { const z = this.zoom + this.punch; return [(x - (this.x - this.rx)) * z + CONFIG.LW / 2 + this.sx, (y - this.y + this.ry) * z + CONFIG.LH / 2 + this.sy]; }
};
