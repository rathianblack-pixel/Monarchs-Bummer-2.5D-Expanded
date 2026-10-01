'use strict';
/* =========================================================
   MOBILE / TABLET SUPPORT
   · detects touch devices (phones, iPads, Android tablets)
   · full-screen + landscape lock on first tap (where the browser allows it)
   · "rotate your device" card in portrait
   · larger touch hit-boxes on every button
   · on-screen text says TAP instead of SPACE/Click
   · starts on MEDIUM graphics (AUTO still steps down to LOW if needed)
   · pauses audio when the app is in the background
   · stops page scrolling, pinch-zoom, double-tap zoom and long-press menus
   · registers the service worker (offline + "Add to Home Screen") when served over http(s)
   ========================================================= */
const Mobile = {
  touch: (matchMedia && matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 1 || 'ontouchstart' in window,
  standalone: (matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true,
  phone() { return this.touch && Math.min(screen.width, screen.height) < 600; },
  goFull() {
    if (this.standalone || document.fullscreenElement || Settings.noFullscreen) return;
    const el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen;
    try { const p = rq && rq.call(el, { navigationUI: 'hide' }); p && p.then && p.then(() => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { }); } catch (e) { }
  }
};
(function () {
  const html = document.documentElement; if (Mobile.touch) html.classList.add('touch'); if (Mobile.standalone) html.classList.add('standalone');
  // better fit: use the visual viewport (iOS toolbars) and refit on rotation
  const refit = () => { const vw = (window.visualViewport && visualViewport.width) || innerWidth, vh = (window.visualViewport && visualViewport.height) || innerHeight; const s = Math.min(vw / CONFIG.W, vh / CONFIG.H); cv.style.width = Math.floor(CONFIG.W * s) + 'px'; cv.style.height = Math.floor(CONFIG.H * s) + 'px'; };
  addEventListener('resize', refit); addEventListener('orientationchange', () => setTimeout(refit, 250)); if (window.visualViewport) visualViewport.addEventListener('resize', refit); refit();
  if (!Mobile.touch) return;
  // graphics: start one notch lower on touch devices (unless the player picked a level)
  if (!Settings.gfx || Settings.gfx === 'auto') Gfx.level = Mobile.phone() ? 1 : 2;
  // bigger hit boxes for fingers
  const inR = UI.inRect.bind(UI); UI.inRect = function (x, y, w, h) { const pad = Mobile.touch ? 7 : 0; return inR(x - pad, y - pad, w + pad * 2, h + pad * 2); };
  // TAP wording
  const tx = UI.text; UI.text = function (s, x, y, o) { if (typeof s === 'string' && /SPACE|Space|Click|click/.test(s)) s = s.replace(/ or press Space/g, '').replace(/Hold SPACE \/ mouse/g, 'Hold your finger down').replace(/Click \/ SPACE/g, 'Tap').replace(/SPACE \/ tap/gi, 'TAP').replace(/\bSPACE\b/g, 'TAP').replace(/\bClick\b/g, 'Tap').replace(/\bclick\b/g, 'tap'); if (Mobile.phone() && o && o.size && o.size < 12 && !o.noBoost) o = Object.assign({}, o, { size: 12 }); return tx.call(this, s, x, y, o); };
  // first touch: audio unlock (iOS needs touchend) + fullscreen/landscape
  let once = false; const first = () => { Audio.unlock(); if (!once) { once = true; Mobile.goFull(); } };
  addEventListener('touchend', first, { passive: true }); addEventListener('pointerup', first);
  // no scrolling / zooming / callouts
  document.addEventListener('touchmove', e => { if (e.touches.length > 1 || e.target === cv) e.preventDefault(); }, { passive: false });
  ['gesturestart', 'gesturechange', 'dblclick'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
})();
// pause sound in the background (phones kill tabs that keep audio running)
document.addEventListener('visibilitychange', () => { try { if (!Audio.ctx) return; if (document.hidden) Audio.ctx.suspend(); else Audio.ctx.resume(); } catch (e) { } });
// keep the save safe when the app is swiped away
addEventListener('pagehide', () => { try { if (S) Save.save(true); } catch (e) { } });
// portrait overlay
(function () {
  const r = document.getElementById('rotate'); if (!r) return;
  r.querySelector('button').addEventListener('click', () => { document.documentElement.classList.add('portrait-ok'); Mobile.goFull(); });
})();
// offline + installable (needs http/https — e.g. GitHub Pages, itch.io, Netlify; not file://)
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('sw', e)));
