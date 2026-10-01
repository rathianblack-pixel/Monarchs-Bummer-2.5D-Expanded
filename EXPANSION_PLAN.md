# Expansion Plan — "The Bummer Below" (Act II)

Goal from the brief: about 3× the game length, a playable Act II, a visual upgrade pass, and
side systems. Priority order: **a complete, playable Act II first**, then lighter side systems,
with honest notes on what got cut.

## 1. Roster audit (Act I, before the expansion)

| Area | Lv1 | Lv2 | Lv3 | Lv4 | Boss | Rig (arch) notes |
|---|---|---|---|---|---|---|
| 0 Mild Inconvenience | Slime Rat (rat) | Angry Goose (goose) | Drunk Peasant (human) | Rabid Raccoon (quad) | Sir Barnaby (human) | reads well; peasant and Barnaby share a body |
| 1 Forest | Goblin Poacher (human) | Zombie Wolf (quad) | Bullying Sprite (sprite) | Cursed Timberwolf (quad) | Gloomfang (quad) | 3 of 5 are quads, so the silhouettes repeat |
| 2 Graveyard | Skeleton Archer (human) | Moldy Mummy (human) | Necromancer Apprentice (human) | Grave Wraith (wraith) | Lich King Timmy (human) | 4 of 5 are humans (weakest area for readability) |
| 3 Dungeon | Rune Mimic (mimic) | Pressure Plate Gremlin (gremlin) | Misdirection Sprite (sprite) | Doom Gauntlet (gauntlet) | Minotaur with Anxiety (human) | the most varied area |
| 4 Castle | Dread Knight (human) | Gargoyle (gargoyle) | Dark Sorcerer (human) | Throne Warden (human) | Monarch Lucien (human) | 4 humans; told apart by armour colour |

NPCs: Mira, Lost Bard, Tax Collector, Prophetic Frog, Retired Hero, Nervous Herald, and the Goose-Rights Activist, plus the village shop, smith, and cathedral staff.

**Findings:** 12 of the 25 Act I enemies use the `human` rig and 3 use `quad`. In silhouette, the graveyard
and castle mostly look like "a person holding something". For Act II, every region therefore gets at least
**three non-human rigs**. The new rigs are crab, gull/harpy, jelly, angler, clam, eel, penguin, yeti,
sheep, horse, rider, balloon, and whale. All of them share the `MAT` 5-step material ramps, so shading stays consistent.

## 2. Act II roster (new)

| Area | Field effect | Lv1 | Lv2 | Lv3 | Lv4 | Boss (mechanic) |
|---|---|---|---|---|---|---|
| 5 Brinebottom Shores | TIDAL PULL | Sulking Crab | Seagull of Entitlement | Deckhand | Jellyfish of Regret | Captain Ledger (an invoice every 3rd turn) |
| 6 Sunken City of Glub | PRESSURE | Lanternfish Lurker | Clam Bureaucrat | Drowned Choirboy | Eel of Unfinished Business | Queen Brackish (phase 2 is SILENCE: music and ambience cut out) |
| 7 The Cold Shoulder | FROSTBITE | Passive-Aggressive Penguin | Snow Wolf | Frost-Bitten Hermit | Abominable Mannors | The Grudge (immune to the move you used most) |
| 8 The High Horse | UPDRAFT | Cloud Sheep | Condescending Harpy | Sky Butler | Stallion of Superiority | Lord Haughtsworth (half damage while mounted; a PERFECT hit dismounts him) |
| 9 Grinhaven | TOXIC POSITIVITY | Balloon Animal | Upbeat Mime | Mandatory Fun Clown | Big Balloon Bertha | **Saint Grinwell**, 3 phases (phase 3 at 22% HP) |

The side nodes are: Brendan the rival, Grandmother Kelp, Frostbeard, Weathervane Vance, and Chuckles. Each one guards a **Sigh Shard**.
There are also "A" side nodes with **cursed elites** (+45% HP, purple aura, better loot).

## 3. Systems: what was built and what was scoped down

| Brief item | Status |
|---|---|
| WORLDS / Act system, SAIL between acts | ✅ `world/worlds.js`, `Scenes.sail` |
| Post-credits hook (Lucien in a bathrobe) | ✅ `Scenes.knock`; the credits get an "A KNOCK AT THE DOOR…" button |
| Act II 2.5D map with branching side nodes | ✅ `overworld/map_act2.js`: 26 main + 10 side nodes, fog reveal, HD + LOW |
| Port Mopeway hub | ✅ `village/port.js`: party, bounty board, shop, training dummy (perks), fishing, boat |
| Companions + assist bar | ✅ Lucien, Sir Honkington, and Sister Pell; the assist charges every turn and is a free action (ASSIST card) |
| 3 endings + Crown + whale "Comfort" breathing minigame | ✅ `scenes/act2_story.js` |
| Boss mechanics + Grinwell 3-phase | ✅ `combat/act2.js` |
| Level cap 40 | ✅ |
| Skill trees | ⚠️ Simplified: 3 branches × 5 ranks per class (`PERKS`), 1 point per level |
| Gear / rarity | ⚠️ Simplified: one **trinket** slot, 8 trinkets across 4 rarities, plus a mystery crate in the shop |
| Crafting | ❌ cut |
| Cursed elites | ✅ |
| Bounties | ⚠️ 12 bounties (the brief suggested more quests) |
| Fishing (20 fish) | ✅ timing minigame at Marnie's pier, with 20 fish across 4 tiers |
| Grudges card game | ❌ cut |
| Crypt dungeon | ❌ cut |
| Rival Brendan | ⚠️ one side-node fight, not a recurring arc |
| 30 lore pages | ✅ dropped by Act II fights, readable from the Port HUD (❧) |
| NG+ remix + Demon Lord's Mom superboss | ❌ cut. The existing NG+ works and resets Act II progress |
| Challenge modes | ❌ cut |
| ~30 achievements | ✅ 30 (★ in the Port HUD) |
| Save versioning + migration | ✅ `state/migrate.js`, `SAVE_V = 3`. v2 saves pad to 10 areas, open Act II if Lucien was beaten, and refund perk points |
| New music per region | ✅ c5–c9 / b5–b9 plus map2, port, whale, and grin_end (new calliope and wobble instruments) |
| New A3PAL kinds / every new scene HD + LOW | ✅ sea, deep, snow, sky, and candy arenas. Map, port, sail, and combat are true 2.5D on HIGH. Knock, endings, and comfort are 2D cinematics, like the original ending scenes, with extra effects on MEDIUM+ |
| Section 1.5 visual upgrade: Model Sheet + silhouette toggle + MAT | ✅ `?gallery`, `characters/materials.js` |
| Section 1.5: redesign the Act I humans and wolves | ❌ not done. Act I sprites are unchanged; the before/after shots match |

## 4. Length estimate
Act I has 25 fights plus the village. Act II adds 25 main fights, 10 side fights (5 rivals + 5 cursed elites),
the ending choice, bounties, fishing, lore, and perks. Counting only the critical path, that is about 2× the
original length. With all side content it is roughly 2.5–3×.
