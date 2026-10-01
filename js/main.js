'use strict';
/* =========================================================
   MAIN LOOP
   ========================================================= */
let T = 0, DT = 0, SDT = 0, _last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const rawDT = Math.max(0, (now - _last) / 1000); DT = Math.min(.05, rawDT); _last = now; T += DT; if (rawDT < .25) Gfx.tick(rawDT);
  try {
    UI.active = Overlays.stack.length ? Overlays.top().id : 'scene';
    SDT = DT * TimeFX.scale(DT);
    Scene.update(DT);
    // read the current scene AFTER the transition manager may have swapped it,
    // so the outgoing scene never runs an extra update (it used to drag the camera away)
    const cur = Scene.cur;
    if (cur && cur.update) cur.update(DT);
    Overlays.update(DT); Tweens.update(DT); Later.update(DT);
    Particles.update(SDT); FloatText.update(DT); Cam.update(DT); Post.update(DT); Toast.update(DT); Banner.update(DT);
    World.update(DT, !!(cur && cur.timeRuns) && !Overlays.stack.length && !Scene.transitioning);
    Music.update(); Amb.update(DT);
    // draw
    useCtx(wctx); wctx.setTransform(1, 0, 0, 1, 0, 0); wctx.globalAlpha = 1; wctx.globalCompositeOperation = 'source-over';
    const c2 = Scene.cur; HD.live = !!(c2 && c2.hd && !Scene.transitioningOut && HD.wanted() && HD.init());
    if (HD.live) {
      if (c2.draw) c2.draw(); useCtx(wctx);
      const out = HD.on ? HD.render() : null; HD.on = false;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false;
      if (out) g.drawImage(out, 0, 0, CONFIG.W, CONFIG.H); g.drawImage(HD.scr, 0, 0, CONFIG.W, CONFIG.H);
    } else {
      if (c2 && c2.draw) c2.draw();
      wctx.setTransform(1, 0, 0, 1, 0, 0); wctx.globalAlpha = 1; wctx.globalCompositeOperation = 'source-over'; const graded = Grade.process(wc, CONFIG.LW, CONFIG.LH);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; g.drawImage(graded, 0, 0, CONFIG.W, CONFIG.H);
    }
    Post.draw();
    UI.layer = 'scene'; if (c2 && c2.ui) c2.ui();
    FloatText.draw(); Post.drawFlash(); Overlays.draw(); Toast.draw(); Banner.draw(); Scene.draw(); Post.drawFade();
  } catch (e) { console.error(e); }
  UI.endFrame(); Input.endFrame();
}
Gfx.apply();
Scene.set('title');
requestAnimationFrame(frame);
