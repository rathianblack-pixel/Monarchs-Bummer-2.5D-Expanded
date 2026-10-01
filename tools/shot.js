// Headless screenshot + console-error harness.
// usage: node tools/shot.js <plan.json> [outDir]
// plan: [{ name, device:'iPhone 13 landscape' (Playwright device name, optional), taps:[[x,y,waitMs]] (touch taps in CSS px), eval2:'expr to print', gfx:'high'|'medium'|'low', setup:"js run in page before scene", scene, args, wait:ms, eval:"js run after wait" }]
'use strict';
const path = require('path'), fs = require('fs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/vercel/sandbox/node_modules/playwright'); }
(async () => {
  const plan = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), out = process.argv[3] || path.join(__dirname, '..', 'shots');
  fs.mkdirSync(out, { recursive: true });
  const exe = fs.existsSync('/usr/local/bin/chromium') ? '/usr/local/bin/chromium' : undefined;
  const browser = await pw.chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  let errors = 0;
  for (const s of plan) {
    const ctxOpts = s.device ? pw.devices[s.device] : { viewport: { width: 1280, height: 720 } }; const bctx = await browser.newContext(ctxOpts); const page = await bctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    await page.goto(url + (s.query || ''));
    await page.waitForTimeout(400);
    const res = await page.evaluate(`(() => { try {
      Settings.gfx = ${JSON.stringify(s.gfx || 'high')}; Gfx.apply(); Gfx.tick = () => {};
      if (!S) { S = newSave({ name: 'Tess', cls: ${JSON.stringify(s.cls || 'sword')} }); S.hp = Stats.maxHP(); S.introSeen = true; }
      ${s.setup || ''}
      ${s.scene ? `Scene.set(${JSON.stringify(s.scene)}, ${JSON.stringify(s.args || {})});` : ''}
      return 'ok'; } catch (e) { return 'ERR ' + e.message + ' ' + e.stack; } })()`);
    if (res !== 'ok') errs.push('setup: ' + res);
    await page.waitForTimeout(s.wait || 1500);
    if (s.eval) { const r = await page.evaluate(`(() => { try { ${s.eval} ; return 'ok'; } catch (e) { return 'ERR ' + e.message; } })()`); if (r !== 'ok') errs.push('eval: ' + r); await page.waitForTimeout(s.wait2 || 600); }
    if (s.ms) { const r = await page.evaluate(`(() => { const t0 = performance.now(); let n = 0; return new Promise(res => { const f = () => { n++; if (n < 60) requestAnimationFrame(f); else res(((performance.now() - t0) / n).toFixed(2)); }; requestAnimationFrame(f); }); })()`); console.log('  frame ms', s.name, r); }
    if (s.taps) for (const [x, y, ms] of s.taps) { await page.touchscreen.tap(x, y); await page.waitForTimeout(ms || 800); }
    if (s.eval2) { const r = await page.evaluate(`(() => { try { return String(${s.eval2}); } catch (e) { return 'ERR ' + e.message; } })()`); console.log('    eval2:', r); }
    await page.screenshot({ path: path.join(out, s.name + '.png') });
    const bad = errs.filter(e => !/AudioContext|autoplay/i.test(e));
    console.log((bad.length ? 'ERR ' : 'ok  ') + s.name + (bad.length ? '\n    ' + bad.slice(0, 6).join('\n    ') : ''));
    errors += bad.length; await page.close(); await bctx.close();
  }
  await browser.close(); console.log('total errors:', errors); process.exit(errors ? 1 : 0);
})();
