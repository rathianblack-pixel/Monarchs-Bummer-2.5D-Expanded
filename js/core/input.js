'use strict';
/* =========================================================
   INPUT
   ========================================================= */
const Input = {
  down: {}, pressed: {}, released: {}, mouse: { x: 0, y: 0, down: false, clicked: false, released: false, rclick: false, lx: 0, ly: 0 },
  typed: [], anyPressed: false,
  hit(...keys) { return keys.some(k => this.pressed[k]); },
  held(...keys) { return keys.some(k => this.down[k]); },
  consume(...keys) { keys.forEach(k => this.pressed[k] = false); },
  endFrame() { this.pressed = {}; this.released = {}; this.mouse.clicked = false; this.mouse.released = false; this.typed = []; this.anyPressed = false; }
};
// Key names: letters/digits come from e.code so Shift/CapsLock/keyboard layout can never
// make keydown and keyup disagree (which used to leave a key "stuck" held).
function keyName(e) {
  const c = e.code || '';
  if (c.startsWith('Key')) return c.slice(3).toLowerCase();
  if (c.startsWith('Digit')) return c.slice(5);
  if (c.startsWith('Numpad') && /\d$/.test(c)) return c.slice(6);
  if (c === 'Space') return ' ';
  if (c === 'NumpadEnter') return 'Enter';
  return e.key.length === 1 ? e.key.toLowerCase() : e.key;
}
Input.releaseAll = function () { for (const k in this.down) if (this.down[k]) { this.down[k] = false; this.released[k] = true; } this.mouse.down = false; };
// CONTROLS: the only keyboard key the game uses is SPACE. Everything else is tap / click.
// (Letters are still collected as text only on the character-creation screen, for typing a name.)
addEventListener('keydown', e => {
  const k = keyName(e);
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Backspace'].includes(k) && Scene.name !== 'creation') e.preventDefault();
  if (k === ' ') e.preventDefault();
  Audio.unlock();
  if (Scene.name === 'creation' && (e.key.length === 1 || e.key === 'Backspace')) { Input.typed.push(e.key); if (k === ' ') return; }
  if (k !== ' ') return;
  if (!Input.down[k]) Input.pressed[k] = true;
  Input.down[k] = true; Input.anyPressed = true;
});
addEventListener('keyup', e => { if (keyName(e) === ' ') { Input.down[' '] = false; Input.released[' '] = true; } });
// losing focus (alt-tab, clicking outside, switching tabs) never delivers keyup events
addEventListener('blur', () => Input.releaseAll());
document.addEventListener('visibilitychange', () => { if (document.hidden) Input.releaseAll(); });
function mousePos(e) { const r = cv.getBoundingClientRect(); Input.mouse.x = (e.clientX - r.left) / r.width * CONFIG.W; Input.mouse.y = (e.clientY - r.top) / r.height * CONFIG.H; Input.mouse.lx = Input.mouse.x / 2; Input.mouse.ly = Input.mouse.y / 2; }
cv.addEventListener('pointermove', mousePos);
cv.addEventListener('pointerdown', e => { e.preventDefault(); mousePos(e); if (e.button === 0) { Input.mouse.down = true; Input.mouse.clicked = true; Input.mouse.touch = e.pointerType === 'touch'; } Input.anyPressed = true; Audio.unlock(); try { cv.setPointerCapture(e.pointerId); } catch (err) { } });
addEventListener('pointerup', e => { if (e.button === 0) { if (e.target === cv) mousePos(e); Input.mouse.down = false; Input.mouse.released = true; } });
addEventListener('pointercancel', () => { Input.mouse.down = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
