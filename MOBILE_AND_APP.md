# Playing on phones and tablets, and turning the game into an app

The game is plain HTML + JavaScript drawn on one `<canvas>`, so it already runs in mobile browsers.
`js/core/mobile.js` adds the touch layer:

| What | How |
|---|---|
| Touch controls | Every action is already a tap. Timing prompts ("press SPACE") read **TAP**, and holding your finger down = holding Space. |
| Bigger hit-boxes | Every button gets ~7 px of extra touch padding. |
| Landscape | On the first tap the game asks for full-screen + landscape lock (Android/Chrome). In portrait you get a "Turn your device sideways" card (with *Play anyway*). |
| Screen fit | Uses the visual viewport (iOS toolbars), safe-area insets (notches), and refits on rotation. |
| No accidental zoom/scroll | Pinch, double-tap zoom, long-press menus and page bounce are blocked. |
| Performance | Phones start on MEDIUM graphics; AUTO drops to LOW if the frame rate stays under ~42 fps. You can still pick a level in Settings → Graphics. |
| Battery / background | Audio pauses when the app goes to the background, and the game saves when the page is closed. |
| Offline + installable | `manifest.webmanifest`, `sw.js` and the `icons/` folder make it a **PWA** (Progressive Web App). |

Tested in emulation on iPhone 13 (landscape and portrait), iPad Pro 11 and Pixel 7: taps register, the menus work,
and the portrait card shows. Still try it on a real device: headless emulation can't judge feel or frame rate.

---

## Option A — Web app on the home screen (free, easiest; recommended first)
The PWA parts only work over **http/https**. Opening `index.html` as a file works in the browser, but you can't install it from there.

1. Put the `game/` folder online. Any static host works:
   - **itch.io**: zip the *contents* of `game/` (so `index.html` is at the root), create a project → Kind: HTML →
     upload → tick "This file will be played in the browser" → set the viewport to 1280×720 and enable
     "Mobile friendly" + "Fullscreen button". itch.io gives you a link players can open on any phone.
   - **GitHub Pages**: push the folder to a repo → Settings → Pages → deploy from branch.
   - **Netlify Drop**: drag the folder onto app.netlify.com/drop.
2. On the phone, open the link:
   - **iPhone/iPad (Safari):** Share button → **Add to Home Screen**.
   - **Android (Chrome):** ⋮ menu → **Install app** / **Add to Home screen**.
3. It now launches full-screen from its own icon and works offline (the service worker caches every file).
   Saves live in the browser's local storage on that device.

**When you update the game:** bump `VERSION` in `sw.js` (e.g. `bummer-v3.2`) so installed copies download the new files.
If you add new JS files, add them to `js/_order.txt`, `index.html` **and** the `FILES` list in `sw.js`.

## Option B — A real App Store / Google Play app (Capacitor)
Capacitor wraps the same web files in a native app shell. You don't need to rewrite anything.

You need: Node.js (18 or newer). For Android: Android Studio, plus a Google Play developer account (US$25, one-time).
For iOS: a **Mac** with Xcode, plus an Apple Developer account (US$99/year).

```bash
mkdir bummer-app && cd bummer-app
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Demon Lord's Bummer" com.yourname.bummer --web-dir=www
# copy the game in (index.html must end up at www/index.html)
cp -r ../game www
npx cap add android
npx cap add ios            # macOS only
npx cap sync
npx cap open android       # opens Android Studio → Run ▶ on a phone, or Build → Generate Signed Bundle for Play
npx cap open ios           # opens Xcode → pick your team → Run ▶, or Product → Archive for the App Store
```

Then:
- **Lock landscape.** Android: in `android/app/src/main/AndroidManifest.xml`, add `android:screenOrientation="sensorLandscape"` to the `<activity>`.
  iOS: in Xcode → target → General → Device Orientation, tick only Landscape Left/Right.
- **Hide the status bar / go full-screen:** `npm i @capacitor/status-bar`, then call `StatusBar.hide()`. Or add to `index.html`:
  `<script>window.Capacitor && Capacitor.Plugins.StatusBar && Capacitor.Plugins.StatusBar.hide()</script>`
- **Icons and splash screens:** `npm i -D @capacitor/assets`, put a 1024×1024 `icon.png` in `assets/`, then run `npx capacitor-assets generate`.
- **After every game change:** copy the files into `www/` again, then run `npx cap sync`.
- The service worker isn't needed inside Capacitor (the files are already on the device). It's skipped automatically
  unless the page is served over http(s).

Alternatives to Capacitor: **Cordova** (older, same idea), **Tauri Mobile**, or uploading the itch.io build to their
desktop/mobile app. For desktop (Windows/Mac/Linux) builds, **Electron** or **Tauri** wrap the same files.

## Store checklist
- A privacy policy URL. The game collects nothing; saves stay on the device.
- Screenshots in landscape: use `node tools/shot.js` with a `device` entry (e.g. `"device": "iPad Pro 11 landscape"`).
- Age rating: the game has cartoon gore (the weapon death animations), so answer the "violence" questions honestly.
- Test on a low-end Android phone: if it stutters, set the default to LOW in `js/core/mobile.js` (`Gfx.level = 0`).


## v4 notes (performance and touch)
- **Updating an installed copy:** `sw.js` is now `VERSION = 'bummer-v4.1.1'`, so phones that installed v3.x fetch the new files on their next online launch. Bump it again with every release.
- **Phones start on MEDIUM.** The heaviest v4 effects (light shafts, heat shimmer, depth of field, bloom) are HIGH-only. MEDIUM keeps the 2.5D view, lit sprites and a reduced dust-mote count. LOW is the flat 2D renderer: it still gets snow cover, footprints, mist, the festival crowd and all the gameplay, but no motes, shafts or reflections.
- **Battle HUD on touch:** the minimal HUD automatically switches to round thumb buttons at the bottom-right, with bigger text and a larger player strip. `Settings.hudTouch = false` keeps the mouse list.
- HIGH trims itself if the phone can't keep up (v4.0.1). iPhone 12-class phones should still use AUTO or MEDIUM for battery and heat.
- If an older phone stutters on HIGH, turn off single effects instead of dropping a whole level: `Settings.postFX = false`, `Settings.motes = false`, or `Settings.anim = false` (legacy animation, a little cheaper).
- **Touch:** BOOST is a normal button next to the Break meter (tap to cycle ×1 → ×2 → ×3 → off). The JOB card sits in the card row. Path-action menus and the TRAVEL journal use full-size buttons.
- Snow cover is drawn in 8 px cells at HIGH/MEDIUM and 12 px cells at LOW to keep fill-rate down.
