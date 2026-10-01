# The Demon Lord's Bummer

Open `index.html` in a browser (double-click works; no server needed).

## Controls
- Walk: tap/click anywhere in the village (hold to steer). The village is a free-roaming 3/4 top-down map.
- Interact / enter doors: tap a person or door (you walk there and interact)
- Dialogue, combat cards, menus: tap/click
- Timing (attack & defence) and fire charge: **Space** or tap/hold

## Phones & tablets
The game runs in mobile browsers (tap controls, landscape, touch-sized buttons) and can be installed as an app. See **`MOBILE_AND_APP.md`** for home-screen install (PWA) and App Store / Google Play builds (Capacitor).

## Act II — The Bummer Below
Beat Monarch Lucien and watch the credits. Someone knocks: press **A KNOCK AT THE DOOR…** (or use **SAIL** on the village/overworld HUD).
- **Port Mopeway** is the Act II hub. Tap Lucien/Pell/Honk to pick the companion who assists in fights, the board for bounties, the shop, the training dummy for perks, Marnie for fishing, and the boat to sail home.
- **Companion assist:** the bar fills each turn. When it's full, tap the ASSIST card. It's a free action.
- **Side nodes** (small pins off the main road) hold rivals that guard a **Sigh Shard**, and cursed elites. Collect all 5 shards before Saint Grinwell to unlock the True ending.
- **Model Sheet:** open `index.html?gallery` to see every model, with SILHOUETTE / WALK / GFX toggles.
- Saves are versioned (`SAVE_V = 3`). Older saves migrate automatically.
- See `EXPANSION_PLAN.md` for the roster audit and scope, and `CHANGELOG.md` for the changes.

## v4 — the "Octopath pass"
- **TRAVEL** (HUD button): your Travellers journal. It covers chapters for each companion, who leads in battle, your secondary **JOB**, and town **reputation**.
- **Path Actions:** tap a townsperson to get TALK plus whatever your travellers can do: **Inquire** (you or Pell), **Steal** (Honk), **Challenge** (Brendan) and **Provoke** (Lucien). Bev's shop and Marnie's pier at the port work the same way.
- **Break & Boost:** foes have a shield count and hidden weaknesses. Break the shield with weakness hits (or PERFECT timing) and the foe loses a turn and takes ×1.5 damage. Bank **BP** each turn and spend up to 3 with **BOOST / [B]** before you attack.
- **Living village:** lunch and evening crowds at the plaza, shop hours, sparrows, flags, lanterns, snow, footprints, mist, and chatter that changes after every boss.
- **Labs:** `index.html?animlab` (animation key frames), `?gallery` (Model Sheet), `?deathlab` (finishers).
- **Flags** (set in the console or in `audio/settings.js`): `Settings.anim`, `Settings.postFX`, `Settings.motes`, `Settings.weaponDeaths`, `Settings.hd` (set any of them to `false` to turn it off).

### What v4 is not
All characters and scenery are still **procedurally drawn in code**. v4 borrows HD-2D tricks: 2× sprite captures, per-pixel lights, soft shadows, reflections, depth of field, bloom, shafts, shimmer and motes. It also adds hand-keyed animation timing. But it is **not** hand-painted Octopath Traveler sprite art and won't look like it side by side. For that, commission a pixel artist for character sheets (8-direction walk, idle, attack, hurt at ~48–64 px) and tilesets. The renderer can already take image sprites via `HD.art` billboards.

## Code layout (`js/`)
Plain scripts sharing globals, loaded in the order listed in `js/_order.txt` (same order as the `<script>` tags).

| Folder | Files | What's inside |
|---|---|---|
| `core/` | config, math, canvas, input, tween | constants, helpers/RNG, canvases, keyboard+mouse, tweens/timelines |
| `audio/` | settings, engine, music, sfx, ambience | Web Audio synth: music sequencer, sound effects, ambience beds |
| `render/` | pixel, particles, camera, lighting, world_time_weather, post, style, topdown | pixel-art primitives, particles, camera, light map, day/night + weather, vignette/letterbox; **hd**: the 2.5D (HD-2D) WebGL renderer — perspective camera, sprites as billboards on a 3D ground plane, light map, haze, cloud shadows, tilt-shift depth of field, bloom; **style**: sprite rim-light/shading/coloured outlines + whole-frame colour grade; **topdown**: 3/4 top-down art kit (palettes, ground, trees, buildings, props) |
| `ui/` | pixelfont, toolkit, overlays, dialog | bitmap pixel font (all UI text), text/panel/button helpers, toasts/banners/overlay stack, dialogue box |
| `characters/` | people, player, monsters | procedural character + monster renderers |
| `data/` | content | classes, enemies, areas, stories, items, quests, dialogue |
| `state/` | save, hud | save data, stats, quests, HUD, settings/help/codex screens |
| `scenes/` | manager, icons, title, intro, creation, ending | scene manager + menu/cinematic scenes |
| `village/` | village, interiors | 3/4 top-down village hub, cathedral/smith/merchant/home |
| `overworld/` | map, map3d, road | world map (2D path) + **map3d**: the 2.5D diorama overworld (painted terrain, forests, mountains, hedge maze, fortress, pins, clouds), road encounters |
| `combat/` | background, arena3d, core, actions, deaths, end, draw | top-down arena backdrops + foreground framing, **arena3d**: 2.5D combat dioramas with horizons/sky/animated props, turn flow & AI, minigames/attacks/defence, **per-monster gore death animations**, rewards/defeat, rendering & combat UI |
| **Act II** | `characters/materials.js`, `characters/monsters_act2.js`, `data/content_act2.js`, `state/migrate.js`, `systems/progression.js`, `systems/companions.js`, `world/worlds.js`, `overworld/map_act2.js`, `village/port.js`, `combat/arena3d_act2.js`, `combat/act2.js`, `audio/music_act2.js`, `scenes/act2_story.js`, `scenes/gallery.js` | MAT colour ramps; new creature rigs; Act II areas, enemies, stories, lore, bounties, fish, achievements; save v3 + migration; perks/trinkets/achievements UI; companions + party; act system; Act II map; Port Mopeway; Act II arenas; boss mechanics/assist/cursed elites (wraps `Scenes.combat`); Act II music; knock/sail/endings/whale minigame; Model Sheet |
| **v4** | `render/motes.js`, `characters/anim.js`, `scenes/animlab.js`, `data/travellers.js`, `systems/travellers.js`, `combat/boost.js`, `world/life.js` | dust motes + post-FX presets, animation layer v2, animation lab, traveller/path-action content, journal + path actions + jobs, Break & Boost + traveller leads, schedules/ambient life/snow/chatter |
| | `main.js` | the frame loop |

To add a file: put it in `js/`, add its path to `js/_order.txt` **and** a `<script>` tag in `index.html` (order matters: a file can only use things from files loaded before it at load time).

### Death animations
`js/combat/deaths.js` — each monster has its own entry in `DEATH_STYLES` (keyed by enemy id). The monster is snapshotted at the killing blow; styles cut it into physics pieces, melt it, crumble it into pixels or shatter it, and spray blood that splats and pools on the ground. Tweak or add a style there.

**Weapon finishers** (`js/combat/deaths_weapon.js`): every enemy, bosses included, has **3 death animations per weapon class** (5 × 3 = 15):
SWORD Clean Cut / Beheading / Flurry · BOW Pinned / Headshot / Arrow Rain · FIRE Ash Heap / Combustion / Meltdown · WATER Drowning Orb / Riptide / Flash-Freeze · LIGHT Ascension / Judgement / Purge.
Each finisher adapts to the monster's blood colour and body family (flesh, beast, blob, spirit, undead, construct), and bosses get a slow-mo "boss cut". The same enemy + weapon never plays the same variant twice in a row. Lucien and Saint Grinwell survive their fights for the story, so they take the weapon's hit and then play their own exit. Preview every combination at `index.html?deathlab` (pick an enemy, weapon and variant, or press AUTO).
Set `Settings.weaponDeaths = false` to bring back the original one-per-monster deaths.

## Testing
`node tools/shot.js plan.json outDir` (Playwright + Chromium) loads the game headless, runs each plan step (`{name, gfx, setup, scene, args, wait, eval, query}`), saves a screenshot, and prints any console errors. v4 before/after comparison sheets (HIGH and LOW) and a feature sheet are in `shots/v4/`.

## Performance
Settings → **Battle HUD**: MINIMAL (default: a slim command list, a nameplate over the enemy, and a HUD that slides away during attacks; round thumb buttons on touch devices) or CLASSIC (the v4.0 cards and boxes). Settings → **Battle camera**: CLOSE (default) or WIDE.

Settings → **Graphics**: AUTO (default) / HIGH / MEDIUM / LOW.
- HIGH: **2.5D** village, overworld and combat (full res, depth of field + bloom), 2× lit sprites with soft shadows and reflections, light shafts + heat shimmer, dust motes, colour grade, full particles.
- MEDIUM: 2.5D at lower internal resolution without depth of field/bloom/shafts/shimmer, fewer motes, shading only on the hero and combatants, fewer particles.
- LOW: the classic flat 2D renderer, no sprite shading or colour grade, half particles.
Interiors, the road, title and cutscenes are always 2D.
- HIGH is adaptive: if it can't hold ~50 fps, it trims light shafts, sprite resolution and then 3D render resolution, one step at a time (the label shows `HIGH -1/-2/-3`). It never drops to MEDIUM. Use `Settings.adaptiveHigh = false` to turn this off.
- AUTO starts on HIGH, trims the same way, and only then steps down if the frame rate stays below ~42 fps.
