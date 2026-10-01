# Changelog

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
