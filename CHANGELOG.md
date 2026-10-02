# Changelog

## v4.4 — Weather everywhere, scarier monsters
**Weather**
- **Interiors:** no more rain falling inside rooms. The house window still shows the rain outside, and indoor rain sounds stay muffled.
- **Battles follow the world weather:** rain (and snow) used to appear only in Placenta Creek (area 1) and during raids. Every open-sky arena now gets it, scaled by how sheltered it is: Grave Mistake and Brinebottom Shores 100%, Questionable Decisions 85%, Mild Inconvenience 55% (under the canopy), Grinhaven 100%. Rain clouds also dim the arena's light shafts.
- **Stays dry:** Dread Fortress (indoors), Sunken City of Glub (underwater), The High Horse (above the clouds).
- **The Cold Shoulder:** rain falls as snow there, and the rain sound is muted.
- **Snow was missing almost everywhere:** snowfall was only drawn when it was also raining. The overworld maps, the road, Port Mopeway and battles now show snow on their own. All outdoor scenes go through one helper, `outdoorWeather()`.
- **Sailing cutscene:** now shows rain and snow too.

**Monsters** (`js/characters/monsters_fx.js`)
Every non-humanoid creature gets an extra detail pass on top of its existing rig, so all poses and animations are unchanged:
- **Act I:** spines and hackles, fangs and snarls, glowing slit eyes, claws, scars, fur texture.
- **Per creature:** the rat oozes pustules, the raccoon foams, the zombie wolf has stitches and flies, the timberwolf grows branch antlers, Gloomfang gets horns, the wraith shows a skull and ribs, and the mimic walks on spider legs with an eye in its lock and a tongue.
- **Act II:** the crab, gull, harpy, jellyfish, angler, clam, eels, penguin, yetis, sheep, horses and balloons get the same treatment, keeping their joke accessories.
- **The Bummer (the whale)** is left as-is on purpose.
- **Toggle:** set `Settings.monsterDetail = false` to bring back the old look.

## v4.3.1 — Night performance, part 2
Night still ran slower than day, mostly on the GPU: after dark the village goes from 3 lights to 43, and the per-pixel sprite shader filled all 8 light slots for every sprite pixel.
- **Per-pixel lights at night:** full HIGH now uses the 4 strongest on-screen lights after dark (`CONFIG.NIGHT_PIXEL_LIGHTS`); day keeps 8. Off-screen and very faint lights are never picked. The light map still contains every light, so the glow looks the same.
- **Shader:** lights that can't reach a pixel are skipped early instead of being fully computed.
- **Fireflies:** their 26 lights now only add glow to the light map. They no longer compete for per-pixel slots or affect shadows.
- **Light map:** image smoothing and alpha are set once per frame instead of once per light; invisible lights are skipped.
- **Dusk/dawn hitches:** when cached buildings change version as night falls, at most 2 are re-captured per frame (`CONFIG.RECAPTURES_PER_FRAME`), so the rebuild is spread over a few frames instead of landing in one.
- **Adaptive HIGH:** after trimming (e.g. during a heavy night), it now steps back up after 12 s of smooth play, at most 3 times per session.

## v4.3 — HD humanoids
The HD renderer from v4.2 now draws every humanoid: villagers, shopkeepers, companions (Lucien, Pell), and human enemies and bosses in both acts. Settings → Hero sprite was renamed **Character sprites** and switches all of them at once.
- **Supported looks:** every hair style (short, long, bun, curly, spiky, bald, hood) and every hat (crowns including the burning one, helmet, cap, straw hat, top hat, feathered hat, wizard hat, head scarf, dark hood). Every head type except the bull (skull, orc, goblin, mummy, knight helm with visor and plume), plus beards, moustaches, glasses, sweat and red noses. Also robes with swinging hems, aprons, stoles, crosses, fur collars, capes, tabards, mail and plate, torn clothes, sitting poses, books and shields, and every weapon in the game.
- **Colours:** they now stay true for very dark and very light outfits. Black robes and black hair stay black, with cool highlights instead of turning brown.
- **Shading:** human enemies skip the old generic sprite shading pass, so they aren't shaded twice.
- **Exception:** the Minotaur's bull head still uses the classic renderer.
- **Speed:** the frame cache now holds 320 poses, enough for a full village. Figures with moving parts (flames, long hair, plumes, capes) update at 12 fps.

## v4.2 — HD hero sprite
The player character has a new renderer (`js/characters/hero_hd.js`). The old one is still in Settings → Hero sprite → CLASSIC.
- **Shaded like a 3D figure:** each frame, the hero is built from rounded shapes (head, hair, torso, limbs, boots, gear), lit from the upper left with a rim light on the far side, and drawn at one pixel per world pixel (two on HIGH, to match its sharper sprites).
- **Better colour:** each material uses 6 shades that turn cooler in shadow and warmer in light. Only metal, glass, hair and leather get highlights. There is light dithering, dark lines where parts overlap, and an outline tinted by the part it surrounds.
- **More detail:** a stitched patch tunic with a folded-down hood (tier 0), a leather jerkin with a strap and bracer (1), mail with a tabard (2), plate with pauldrons (3), and gilded plate with a cape (4). The Bow class wears a quiver, the Sword class an empty scabbard, and spellcasters a scarf and sash in their element's colour. Bows, swords and staffs have a new look for every weapon tier, with an animated flame, water orb or light orb on the staff.
- **Same animation as before:** poses, the 8-key walk, breathing, blinks, expressions, the cape physics, hit flashes, skin tones, hair colours and body types all carry over. The hero is drawn this way everywhere: battles, the village, interiors, the map, the road, cutscenes, character creation, the gallery and the anim lab.
- **Cost:** frames are cached by pose, so an idle hero is nearly free. A new pose takes about 1–1.5 ms to draw (classic: about 0.3 ms).
- NPCs, companions and enemies still use the old renderer.

## v4.1.1 — Night performance
Night had about 15× more lights than day (43 vs 3 in the village), and two things got more expensive with every light:
- **Light map:** every light used to build a brand-new radial gradient every frame (43 at night). Light blobs are now pre-rendered once per colour and reused, lights outside the visible area are skipped, and the light texture is updated in place. Same look; 0 gradients per frame instead of 43. The 2D/LOW renderer got the same fix, including its glow pass.
- **Per-pixel sprite lighting** uses the 8 strongest lights on full HIGH, and 4 on MEDIUM or once adaptive HIGH has trimmed (it was always 8).

## v4.1 — Minimal battle HUD
The battle screen now gets out of the way so you can see the fighters and the backdrop. The old layout is still in Settings → Battle HUD → CLASSIC.
- **Commands:** with mouse and keyboard, they're a slim list at the bottom-left with small icons. Only the hovered command shows its one-line description. On touch devices, they're a row of round thumb buttons at the bottom-right, with a big ATTACK button. Touch mode switches on automatically; `Settings.hudTouch = true/false` forces it.
- **Enemy nameplate floats above the enemy:** name, thin HP bar, intent tag, shield count, weakness slots, and up to 3 trait/status words. It replaces the three boxes in the top-right.
- **The separate Break bar is gone.** Your Break meter is a thin gold line under the BREAK command (a ring on touch). The Assist command works the same way in Act 2.
- **Player info is one thin strip:** name, class/level, HP, Focus, statuses, BP pips and BOOST.
- **No boxes:** the area name and turn number are a small tag in the top-left. Settings and sound are two faint words in the corner. The battle message and speech bubbles are plain text on a soft fade. The items menu is a soft list.
- **The HUD slides away** whenever it isn't your turn: attacks, timing minigames, the enemy's move, Break ultimates and menus. It slides back in when you can act.
- **Toasts** (Codex entry, quest updates…) no longer have boxes, anywhere in the game. They're also hidden while a menu is open.
- **Battle camera:** new Settings → Battle camera, CLOSE (default) or WIDE. CLOSE zooms in a little and centres between the two fighters. HIGH/MEDIUM only.
- New file: `js/combat/hud_min.js`.
- Fix: at the start of a fight, the shield badge could appear screen-sized and shrink slowly. Its "pop" animation used a timestamp left over from the previous fight. It's now reset every fight and ignored if it's from the future.
- Intent tags over the enemy are shortened ("STATUS" instead of "STATUS · Poison") so they don't overlap the HP bar.

## v4.0.1 — HIGH performance fix
v4's HIGH setting was under-optimised: it did about 3× the per-frame CPU work of v3.1's HIGH.
- **Sprite shading only processes the figure.** The CPU light/outline pass read back and shaded each character's whole scratch buffer, which is mostly empty and 4× bigger since 2× sprites arrived. It now tracks what was drawn and only touches that area, about 16× fewer pixels.
- **No double-lighting on background figures.** On HIGH, villagers, the festival crowd and other minor figures skip the CPU shading pass. The GPU lit-sprite shader already gives them light, rim and outline. The hero, party and combatants keep both.
- **Adaptive HIGH.** If HIGH can't hold ~50 fps, it trims one step at a time instead of stuttering: 1) no light shafts and a 1120×630 3D render, 2) 1× character captures, 3) a 960×540 3D render. It never drops you to MEDIUM. Re-pick HIGH in Settings to reset it. Turn it off with `Settings.adaptiveHigh = false`. The Graphics label shows `HIGH -1/-2/-3` when it has trimmed.
- Dynamic textures are re-uploaded in place (`texSubImage2D`) instead of being reallocated every frame.
- Measured on the same machine, village HIGH: per-frame draw work went from 34.7 ms to 17.8 ms (sprite shading 14.5 ms → 1.2 ms). Combat HIGH: 9.8 ms → 7.5 ms. Visuals are unchanged apart from slightly softer rim light on background villagers.

## v4.0 — "Octopath pass" (HD-2D look, hand-keyed animation, Break & Boost, Travellers, a living world)
**Honest note:** all art is still drawn in code. It's styled after HD-2D, but it isn't hand-painted Octopath-quality pixel art. Commissioned sprite sheets would be the next big jump (see README → "What v4 is not").

**Part 1 — HD-2D rendering** (`render/hd.js`, `render/pixel.js`, `render/style.js`, new `render/motes.js`)
- Characters and small props are captured at 2× internal resolution (pixel primitives snap to ½ px), then lit per pixel by the 8 strongest nearby point lights, with soft cast shadows stretched away from the light.
- **Reflections fixed:** mirrored sprites used to be camera-leaning cards seen almost edge-on, so reflections vanished. They're now upright mirrored cards with a depth fade and a water tint. Also fixed: a capture cache bug that hid the bridge's south railing.
- **Post FX (HIGH only):** heat shimmer (forge, Midnight Flame field, fire spells, fireballs) and light shafts (radial march through the blur buffer plus soft god-ray bands that follow the time of day).
- **Dust motes / pollen / embers** in the village, port, both overworlds and every combat arena, with per-area presets (HIGH + MEDIUM).
- Flags: `Settings.postFX = false`, `Settings.motes = false`.

**Part 2 — Animation v2** (new `characters/anim.js`, new `scenes/animlab.js`)
- 8-key walk cycle (contact / down / passing / up), 4-frame breathing idle, 3-frame (sometimes double) blinks, head follow-through.
- Combat anticipation, strike and follow-through poses with squash and stretch.
- Secondary motion: capes, long hair, scarf ends and robe hems are small Verlet chains with inertia, gravity and wind.
- `index.html?animlab` (or Model Sheet → FRAMES) shows every key frame, plus live cape/hair/robe actors and WIND and ANIM v2/LEGACY toggles. `Settings.anim = false` restores the old sine animation.

**Part 3 — Break & Boost combat** (new `combat/boost.js`, small edit in `combat/draw.js`)
- Every foe has a **shield count** (2–7) and hidden **weaknesses** (class types). Weaknesses show as **?** until you hit them, and they're remembered per enemy.
- A weakness hit chips 1 shield (more if boosted). A **PERFECT** on any hit chips 1, so timing still matters. At 0 the foe is **BROKEN**: it loses its next turn, takes ×1.5 damage, and any charged BIG BUMMER is cancelled. Shields refill after that.
- **Boost Points:** you start with 1 BP and gain +1 per turn (but not on a turn you boosted), up to 5. Spend up to 3 on Attack, Skill, Job or Break for ×(1 + 0.6 per BP) damage and extra shield chips. Use the BOOST button or **[B]**.
- **Secondary job:** unlocks at Lv 5 or after the first boss. It adds a 6th card, JOB, which is a strike in that class's style and minigame (×1.2, 3 mana), plus a small passive bonus.
- HUD: a shield/weakness strip under the intent box, a shield badge over the foe, a BREAK splash, and BP pips next to the Break meter.

**Part 4 — Travellers & Path Actions** (new `data/travellers.js`, new `systems/travellers.js`)
- **TRAVEL** button (village, port, both maps) opens the journal. You, Sister Pell, Sir Honkington, Lucien and Brendan (after his rival fight) each have a page.
- **Chapters:** each companion has 3 chapters (Lv 8 / 14 / 20) with their own story card and rewards. The hero's chapters are the main story.
- **Battle lead:** any traveller can lead normal battles. They fight with their own class and look (Honk fights as a goose), and the assist steps aside if it's the same person.
- **Path Actions** on 10 townsfolk (8 in Placenta Creek, Bev and Marnie at the port): **Inquire** (you: chance-based, and a failure costs reputation; Pell: level-gated and always works), **Steal** (Honk: chance per item, each item once), **Challenge** (Brendan duels them alone), **Provoke** (Lucien fights their champion alone).
- 5 new side quests unlocked by Inquire, tracked in the normal quest log.
- **Reputation** per town (3 hearts). At 0, nobody in that town will let you use path actions until you make amends (50 coins).
- Traveller and path battles never touch area clears, bosses, map reveals or Sigh Shards. Losing one sends you back to town with no fee.

**Part 5 — A living world** (new `world/life.js`, 4 one-line hooks in `village/village.js`)
- **Schedules:** townsfolk gather and chat at the plaza at lunch (11:30–13:30) and in the evening (17:30–20:20). The merchant is open 7 AM–8 PM and the smith 6 AM–7 PM. Closed shops have a sign and a locked-door message.
- **Ambient life:** a sparrow flock that scatters when you walk close, flags in the wind (gate, plaza, cathedral), a plaza lantern string that lights up at dusk, a festival crowd with confetti after Barnaby, a second cat on the cathedral steps, and merchant chimney smoke.
- **Weather:** new **SNOW** (falling flakes, ground cover that builds up and melts, footprints), ground mist in fog, and road puddles that reflect when it rains (HIGH).
- **Chatter:** speech-bubble barks that change after every boss, plus one-time first-chat lines per villager after big events. Bev, Marnie, Lucien and Pell chatter at the port.

**Other**
- Service worker cache bumped to `bummer-v4`. All new files are registered in `js/_order.txt`, `index.html` and `sw.js`.
- Saves stay compatible: v4 data lives in `S.trav` and is created the first time it's needed (no migration step).
- Tested headless at HIGH and LOW: village (day/lunch/night/rain/snow/fog), port, both overworlds, combat (normal, boss, raid, Act II, break/boost, job card, traveller leads, chapter win), journal, path menus, gallery, animlab, title and interiors, with **0 console errors**. All 825 death combinations in `?deathlab` were re-run with 0 errors.

## v3.1 — Finishers ×3 and mobile
- **15 weapon finishers:** every enemy (Act I, Act II, side bosses and bosses) now has 3 deaths per weapon class. They adapt to blood colour and body family, bosses get slow-mo boss cuts, and the same variant doesn't repeat back to back. Added the `?deathlab` previewer. All 825 enemy × weapon × variant combinations were run headless with 0 errors.
- **Mobile/tablet:** touch-sized hit-boxes, TAP wording, full-screen + landscape lock, portrait card, viewport/safe-area fit, audio pause in the background, save on close, and phones start on MEDIUM graphics.
- **Installable PWA:** `manifest.webmanifest`, `sw.js` (offline cache), `icons/`. App-store guide in `MOBILE_AND_APP.md`.
- `tools/shot.js`: `device`, `taps`, `eval2` options for phone/tablet emulation tests.

## v3.0 — Act II: "The Bummer Below"
- **New act:** 5 regions (areas 5–9), 25 new enemies, 5 bosses with unique mechanics, and Saint Grinwell (3 phases).
- **Act II overworld:** a 2.5D coastline map with 26 main nodes, 10 branching side nodes (rivals + cursed elites), and a fog reveal.
- **Port Mopeway hub:** party select, bounty board, shop with a trinket crate, perk dummy, fishing pier, and a boat home.
- **Companions:** Lucien (in a bathrobe), Sir Honkington (a goose), and Sister Pell. Each has an assist move with its own charge bar.
- **Story:** a post-credits knock, a sailing transition, and 3 endings (Grin / Bummer / True). The True ending means collecting 5 Sigh Shards, forging the Crown of Small Sorrows, and calming the Bummer whale in the breathing minigame.
- **Progression:** level cap 40, perk trees (3×5 per class), trinkets with rarity, 12 bounties, 30 lore pages, 30 achievements, and 20 fish.
- **Visuals:** 13 new creature rigs on shared `MAT` material ramps, 5 new 2.5D arena palettes with animated props, and a Model Sheet (`index.html?gallery`) with silhouette and LOW/HIGH toggles.
- **Audio:** procedural music for every new region and boss, new instruments, ambience beds, and SFX (gull, splash, whale, knock…).
- **Saves:** versioned (v3) with automatic migration from v2 saves.
- **Tools:** `tools/shot.js` headless screenshot + console-error harness.
- **Weapon finishers:** death animations now depend on the killing weapon (sword slice, bow pin, fire ash, water burst, light smite). Bosses keep their unique deaths, with the weapon's effect layered on top.
- Fixes: the codex now pages (26 per page); "Continue" returns you to your last hub; per-pixel readbacks in snow art were batched.
