'use strict';
/* =========================================================
   CONTENT DATA
   ========================================================= */
const AREAS = [
  { id: 0, name: 'Placenta Creek', field: 'MUDDY ROAD', fieldDesc: '−5% accuracy', pal: { a: '#6a9a4a', b: '#3a5a3a', sky1: '#6cb2e0', sky2: '#f6dcb0' }, amb: 'a0' },
  { id: 1, name: 'Mild Inconvenience', field: 'TANGLED ROOTS', fieldDesc: 'Misses may cause Bleeding', pal: { a: '#3a6a4a', b: '#2a3a3a' }, amb: 'a1' },
  { id: 2, name: 'Grave Mistake', field: 'RESTLESS SOIL', fieldDesc: 'Undead restore 2 HP per turn', pal: { a: '#5a7a6a', b: '#2a3a40' }, amb: 'a2' },
  { id: 3, name: 'Questionable Decisions', field: 'SHIFTING WALLS', fieldDesc: 'Random buff every third turn', pal: { a: '#4a7a4a', b: '#2a4a4a' }, amb: 'a3' },
  { id: 4, name: 'Dread Fortress', field: 'MIDNIGHT FLAME', fieldDesc: '1 burn damage every turn', pal: { a: '#3a2a3a', b: '#1a1020' }, amb: 'a4' }
];
const MATS = { slime: ['Slime Glob', 2], feather: ['Goose Feather', 2], pelt: ['Wolf Pelt', 4], bone: ['Bone Shard', 4], ecto: ['Ectoplasm', 5], rune: ['Rune Chip', 6], scrap: ['Map Scrap', 3], iron: ['Dark Iron', 8], tooth: ['Raccoon Tooth', 3] };
const ITEMS = {
  drumstick: { name: 'Drumstick', price: 6, desc: '+14 HP. Still warm, somehow.', heal: 14 },
  mid: { name: 'Mid Potion', price: 16, desc: '+35 HP. Tastes of mid-range decisions.', heal: 35 },
  high: { name: 'High Potion', price: 25, desc: 'Full heal. The label just says "YES."', heal: 9999 },
  antidote: { name: 'Antidote', price: 6, desc: 'Cures Poison, Bleeding, Burning and Weakened.', cure: true },
  tonic: { name: 'Mana Tonic', price: 12, desc: 'Restores 8 Mana / Focus. Fizzes judgmentally.', mana: 8 },
  smoke: { name: 'Smoke Bomb', price: 14, desc: 'Flee a normal fight, or make the enemy miss its next attack.', smoke: true }
};
const ENEMIES = [
  // AREA 0 — Placenta Creek
  { id: 'slime_rat', name: 'Slime Rat', area: 0, lvl: 1, arch: 'rat', look: { body: '#7a8a6a' }, trait: 'AGGRESSIVE', style: 'jump', voice: 'squeak', drop: ['slime', .9], codex: 'A rat that fell into something and decided to make it everyone\'s problem. Leaves a trail you will be asked to explain.' },
  { id: 'goose', name: 'Angry Goose', area: 0, lvl: 2, arch: 'goose', look: {}, trait: 'AGGRESSIVE', style: 'lunge', voice: 'honk', drop: ['feather', 1], codex: 'Not evil. Worse: principled. Has never lost an argument, mostly because it does not know what one is.' },
  { id: 'peasant', name: 'Drunk Peasant', area: 0, lvl: 3, arch: 'human', look: { skin: '#e8b090', hair: '#7a5a3a', hairStyle: 'short', top: '#7a6a3a', pants: '#4a4030', boots: '#3a2a20', belt: '#5a3a1a', redNose: true, weapon: 'bottle', expr: 'tired', body: 'round' }, trait: 'BERSERK', style: 'swing', voice: 'growl', drop: ['scrap', .2], codex: 'Local man. Claims to be "between jobs." The job he is between is standing and sitting.' },
  { id: 'raccoon', name: 'Rabid Raccoon', area: 0, lvl: 4, arch: 'quad', look: { variant: 'raccoon', body: '#7a7a84' }, trait: 'TRICKSTER', style: 'scratch', voice: 'squeak', drop: ['tooth', .8], codex: 'Hands like a pickpocket, temperament like a tax audit. Foams at the mouth, but mostly for emphasis.' },
  { id: 'barnaby', name: 'Sir Barnaby', area: 0, lvl: 5, boss: true, title: 'Orc Knight of the Toll Bridge', arch: 'human', scale: 1.55, look: { head: 'orc', skin: '#7a9a4a', hairStyle: 'none', hat: 'helmet', armor: { top: '#9a7050', plate: true, tabard: '#6a3a2a', pants: '#4a3a2a', boots: '#6a5040', belt: '#3a2414' }, weapon: 'club', shield: true, shieldC: '#7a5a3a', expr: 'annoyed', body: 'round' }, look2: { expr: 'angry', shieldC: '#5a3a2a' }, trait: 'DEFENSIVE', style: 'bash', voice: 'growl', drop: ['iron', 1], codex: 'An orc knight who discovered bureaucracy and never recovered. Charges a toll to cross a bridge he did not build over a creek he cannot spell.' },
  // AREA 1 — Mild Inconvenience
  { id: 'goblin', name: 'Goblin Poacher', area: 1, lvl: 1, arch: 'human', scale: .85, look: { head: 'goblin', skin: '#8aaa4a', hood: true, hoodC: '#4a5a2a', top: '#5a4a2a', pants: '#3a3020', boots: '#2a2018', belt: '#6a4a2a', weapon: 'knife', expr: 'smug' }, trait: 'TRICKSTER', style: 'stab', voice: 'laugh', drop: ['pelt', .5], codex: 'Hunts things out of season, in season, and on at least one occasion, in a shop. Refers to snares as "ground hugs."' },
  { id: 'zwolf', name: 'Zombie Wolf', area: 1, lvl: 2, arch: 'quad', look: { variant: 'zombie', body: '#6a7a6a' }, trait: 'AGGRESSIVE', style: 'leap', voice: 'growl', undead: true, drop: ['pelt', .9], codex: 'Died once and took it personally. Still fetches, but only grudges.' },
  { id: 'bsprite', name: 'Bullying Sprite', area: 1, lvl: 3, arch: 'sprite', look: { body: '#6ac070', skin: '#c8f0b0', hair: '#40a060' }, trait: 'TRICKSTER', style: 'flick', voice: 'laugh', drop: ['ecto', .3], codex: 'Tiny, glittering, and cruel in a way that feels rehearsed. Her insults rhyme, which somehow makes them hurt more.' },
  { id: 'twolf', name: 'Cursed Timberwolf', area: 1, lvl: 4, arch: 'quad', look: { variant: 'timber', body: '#7a5a3a' }, trait: 'BERSERK', style: 'leap', voice: 'growl', drop: ['pelt', 1], codex: 'Half wolf, half oak, fully upset. Sheds bark in spring. Sheds pride never.' },
  { id: 'gloomfang', name: 'Gloomfang', area: 1, lvl: 5, boss: true, title: 'The Chained Hound of the Fortress', arch: 'quad', scale: 1.8, look: { variant: 'gloom', body: '#3a3048', eye: '#e080ff' }, trait: 'AGGRESSIVE', style: 'leap', voice: 'growl', drop: ['pelt', 1], codex: 'Lucien\'s escaped kennel wolf. The chains were royal issue. The purple flames were, apparently, "a phase."' },
  // AREA 2 — Grave Mistake
  { id: 'skarcher', name: 'Skeleton Archer', area: 2, lvl: 1, arch: 'human', look: { head: 'skull', hairStyle: 'none', top: '#5a5048', pants: '#4a4038', boots: '#3a3028', belt: '#4a3020', weapon: 'ebow', skin: '#e8e2cc', body: 'lanky' }, trait: 'TRICKSTER', style: 'arrow', voice: 'rattle', undead: true, drop: ['bone', 1], codex: 'No eyes, no muscles, no excuses. Scores bullseyes out of spite for the living.' },
  { id: 'mummy', name: 'Moldy Mummy', area: 2, lvl: 2, arch: 'human', look: { head: 'mummy', hairStyle: 'none', top: '#c8b890', pants: '#b0a078', boots: '#8a7a5a', belt: '#8a7a5a', skin: '#c8b890', weapon: 'none', body: 'round' }, trait: 'DEFENSIVE', style: 'slap', voice: 'moan', undead: true, drop: ['bone', .6], codex: 'Wrapped for eternity by an embalmer who ran out of good linen halfway. The mold has opinions.' },
  { id: 'necro', name: 'Necromancer Apprentice', area: 2, lvl: 3, arch: 'human', look: { hat: 'hoodDark', hatC: '#3a2a4a', robe: '#3a2a4a', top: '#3a2a4a', sleeve: '#3a2a4a', weapon: 'skullstaff', hairStyle: 'none', body: 'lanky' }, trait: 'PROTECTOR', style: 'spell', voice: 'laugh', drop: ['ecto', .9], codex: 'Enrolled in a correspondence course in the dark arts. The correspondence is mostly overdue notices.' },
  { id: 'wraith', name: 'Grave Wraith', area: 2, lvl: 4, arch: 'wraith', look: { body: '#3a5a5a', eye: '#90ffd0' }, trait: 'AGGRESSIVE', style: 'sweep', voice: 'wail', undead: true, drop: ['ecto', 1], codex: 'A mourner who never left the funeral. Now employed, unpaid, as night security.' },
  { id: 'timmy', name: 'Lich King Timmy', area: 2, lvl: 5, boss: true, title: 'Sovereign of Bedtime', arch: 'human', scale: 1.15, throne: true, look: { head: 'skull', hat: 'crown', robe: '#4a6a9a', top: '#4a6a9a', sleeve: '#4a6a9a', weapon: 'orb', orbC: '#80e0ff', child: true, hairStyle: 'none', eyeGlow: '#80e0ff' }, look2: { eyeGlow: '#ff80ff', orbC: '#ff80ff' }, trait: 'PROTECTOR', style: 'spell', voice: 'child', undead: true, drop: ['ecto', 1], codex: 'Nine and a half. Undead since his birthday. His phylactery is a lunchbox. Nobody has told him "no" in centuries, and it shows.' },
  // AREA 3 — Questionable Decisions
  { id: 'mimic', name: 'Rune Mimic', area: 3, lvl: 1, arch: 'mimic', look: {}, trait: 'AGGRESSIVE', style: 'snap', voice: 'chomp', drop: ['rune', 1], codex: 'A chest that learned to lie. Labels itself "DEFINITELY TREASURE." It is, technically, full of teeth, which are valuable to someone.' },
  { id: 'gremlin', name: 'Pressure Plate Gremlin', area: 3, lvl: 2, arch: 'gremlin', look: { body: '#8a6aa8' }, trait: 'TRICKSTER', style: 'throw', voice: 'laugh', drop: ['scrap', 1], codex: 'Moves the traps. Resets the traps. Complains about the traps. Union member.' },
  { id: 'msprite', name: 'Misdirection Sprite', area: 3, lvl: 3, arch: 'sprite', look: { variant: 'misdirect', body: '#c8a040', skin: '#f8e0a0', hair: '#a06020', wing: '#fff0b0' }, trait: 'TRICKSTER', style: 'flick', voice: 'laugh', drop: ['scrap', 1], codex: 'Carries three signs. All are wrong. Two are wrong in helpful ways.' },
  { id: 'gauntlet', name: 'Doom Gauntlet', area: 3, lvl: 4, arch: 'gauntlet', look: { body: '#6a6a7a', glow: '#a050ff' }, trait: 'BERSERK', style: 'punch', voice: 'clank', drop: ['iron', .8], codex: 'The left hand of a giant who has never noticed it is missing. Punches with the confidence of an only child.' },
  { id: 'minotaur', name: 'Minotaur with Anxiety', area: 3, lvl: 5, boss: true, title: 'Keeper of the Center, Probably', arch: 'human', scale: 1.7, look: { head: 'bull', skin: '#8a5a3a', top: '#8a5a3a', sleeve: '#8a5a3a', pants: '#5a3a22', boots: '#3a2418', belt: '#c8a040', weapon: 'axe', sweat: true, body: 'round', expr: 'surprise' }, look2: { eyeGlow: '#ff4030', expr: 'angry', sweat: true }, trait: 'BERSERK', style: 'charge', voice: 'growl', drop: ['rune', 1], codex: 'Huge. Horned. Terrified of being perceived. Has read four books on confidence and only finished the titles.' },
  // AREA 4 — Dread Fortress
  { id: 'dknight', name: 'Dread Knight', area: 4, lvl: 1, arch: 'human', look: { head: 'helm', plume: '#a01828', visor: '#ff3020', armor: { top: '#3a3a48', plate: true, tabard: '#6a1020', pants: '#2a2a34', boots: '#4a4a58', belt: '#2a1a1a' }, weapon: 'darksword', hairStyle: 'none' }, trait: 'AGGRESSIVE', style: 'charge', voice: 'clank', drop: ['iron', 1], codex: 'Swore an oath of eternal darkness. Reads the fine print now. It mentions dental.' },
  { id: 'gargoyle', name: 'Gargoyle', area: 4, lvl: 2, arch: 'gargoyle', look: { body: '#7a7a86' }, trait: 'DEFENSIVE', style: 'dive', voice: 'growl', drop: ['rune', .7], codex: 'Decorative for six hundred years. Took up violence as a hobby. Still decorative.' },
  { id: 'sorcerer', name: 'Dark Sorcerer', area: 4, lvl: 3, arch: 'human', look: { hat: 'wizard', hatC: '#2a1a3a', hatTrim: '#a02040', robe: '#2a1a3a', top: '#2a1a3a', sleeve: '#2a1a3a', skin: '#c8b0c8', beard: '#b0a0b8', hairStyle: 'none', weapon: 'orb', orbC: '#ff4080', expr: 'smug', body: 'lanky' }, trait: 'TRICKSTER', style: 'spell', voice: 'laugh', drop: ['ecto', 1], codex: 'Court magician. Mostly does the lighting for Lucien\'s entrances. Resentful about it.' },
  { id: 'warden', name: 'Throne Warden', area: 4, lvl: 4, arch: 'human', scale: 1.45, look: { head: 'helm', visor: '#ffb030', armor: { top: '#4a4050', plate: true, tabard: '#8a6a20', gold: true, pants: '#2a2230', boots: '#5a5060', belt: '#8a6a20' }, weapon: 'halberd', hairStyle: 'none' }, trait: 'PROTECTOR', style: 'swing', voice: 'clank', drop: ['iron', 1], codex: 'Guards the last door. Has been asked "is this the throne room?" nine thousand times. Answers only with the halberd now.' },
  { id: 'lucien', name: 'Monarch Lucien', area: 4, lvl: 5, boss: true, title: 'Sovereign of Scorn · Master of the Midnight Flame', arch: 'human', scale: 1.3, look: { hairStyle: 'longdark', hair: '#141018', hat: 'crown', skin: '#ecd6c8', eye: '#8a2030', armor: { top: '#2a2434', plate: true, tabard: '#4a1428', gold: true, pants: '#1a1622', boots: '#3a3444', belt: '#8a6a20', cape: '#1a1020' }, cape: '#1a1020', fur: '#d8d0c8', weapon: 'darksword', expr: 'smug', body: 'lanky' }, look2: { hat: 'crownfire', swordGlow: '#e0a030', expr: 'angry' }, trait: 'AGGRESSIVE', style: 'royal', voice: 'lucien', drop: ['iron', 1], codex: 'The Demon Lord. Elegant, bored, and far too well-rested. Has a herald, a mantel, and a sketch of your trousers.' }
];
const ENEMY = Object.fromEntries(ENEMIES.map(e => [e.id, e]));
const RAID_ENEMIES = [{ id: 'raid_wolf', base: 'zwolf', name: 'Raiding Wolf' }, { id: 'raid_skel', base: 'skarcher', name: 'Raiding Skeleton' }];
const STORIES = [
  ['MISSING SUPPER', 'Sacks of food have been disappearing from Placenta Creek. The first trail ends in slime, bite marks, and one villager insisting this is "probably taxes."'],
  ['A GOOSE OF INTEREST', 'The trail passes the mill pond, where a goose stands over a pile of stolen bread. It is not eating it. It is guarding it. That is somehow worse.'],
  ['LAST ROUND AT THE CROSSROADS', 'A drunk peasant claims he saw the food carts go east "with an orc and a very official hat." He also claims the moon owes him money, so: noted.'],
  ['THE TOLL NOTICE', 'Nailed beside a raccoon den: "BRIDGE TOLL — ONE SACK OF FOOD, OR ONE HOLY RELIQUARY. — MANAGEMENT." The raccoon appears to be middle management.'],
  ['THE BRIDGE AT THE END OF PATIENCE', 'Sir Barnaby, orc knight and self-appointed toll authority, has the cathedral\'s missing reliquary. He is using it as a paperweight. For the toll receipts.'],
  ['TRAPS IN THE UNDERGROWTH', 'The forest road is lined with snares. A goblin poacher is re-baiting them with, suspiciously, Placenta Creek cheese.'],
  ['THE WOLF THAT FORGOT TO STAY DEAD', 'Something howls at noon, which is rude. A wolf, very dead, very upright, and very unwilling to discuss it.'],
  ['A SMALL VOICE, A LARGE ATTITUDE', 'A sprite blocks the path and insults your boots. Between insults she mentions that "the big chained wolf" escaped from the Fortress kennels.'],
  ['BARK WORSE THAN BITE', 'A timberwolf with bark growing through its fur. The trees lean away from the deep woods, as if they would rather not be involved.'],
  ['GLOOMFANG', 'In the hollow at the forest\'s heart, a wolf the size of a cottage drags broken royal chains. The tag reads: PROPERTY OF LUCIEN. DO NOT FEED AFTER MIDNIGHT. It has been fed.'],
  ['NOT ENOUGH SKELETONS, YET', 'Arrows from the cemetery wall. The skeleton archer is very accurate for someone without eyes.'],
  ['PRESERVED, NOT FRESH', 'A mummy shuffles between headstones, leaving a smell best described as "basement."'],
  ['HOMEWORK', 'An apprentice necromancer practises resurrections from a list. The list is in crayon. It is signed "KING TIMMY (AGE 9 AND A HALF)."'],
  ['THE MOURNING SHIFT', 'A grave wraith patrols the mausoleum, whispering the same thing over and over. Leaning closer: "It is past his bedtime."'],
  ['LICH KING TIMMY', 'On a throne of ice sits a child lich in a crown three sizes too large. He was given a phylactery for his birthday and nobody said no.'],
  ['THE CHEST THAT WANTED TO BE OPENED', 'The maze entrance holds a chest labelled "DEFINITELY TREASURE." The label is in the chest\'s own handwriting.'],
  ['STEP LIGHTLY', 'Every third stone is a pressure plate. A gremlin keeps moving them around. He calls it "job security."'],
  ['THIS WAY (PROBABLY)', 'A sprite carrying signposts points cheerfully in every direction. The signs agree on only one thing: the Minotaur is "having a day."'],
  ['A HAND IN THE MATTER', 'A floating gauntlet guards the inner hedge. Its knuckles are engraved D-O-O-M. You choose not to wonder about the other hand.'],
  ['MINOTAUR WITH ANXIETY', 'At the heart of the maze waits a colossal minotaur holding an axe, a list of breathing exercises, and your gaze for slightly too long. He apologises.'],
  ['THE WELCOME COMMITTEE', 'The fortress gate opens by itself. A Dread Knight waits inside with a clipboard and a sword, in that order of priority.'],
  ['ARCHITECTURAL CRITICISM', 'A gargoyle detaches from the battlements. Stone creatures, unlike real critics, do eventually fall down.'],
  ['THE HERALD\'S NOTES', 'A dark sorcerer rehearses spells from a scroll. The back of it is the herald\'s draft introduction. It is eleven pages long.'],
  ['THE LAST DOOR', 'The Throne Warden stands before the final doors. On the wall behind him: a mantel, a skull-shaped gap, and a tape measure.'],
  ['MONARCH LUCIEN', 'The throne room. The storm. The man. "You made it," says Lucien. "The herald owes me a coin."']
];
const INTENT_LINES = {
  HEAVY: ['is winding up something personal.', 'is putting their whole back into this.', 'inhales like it has a grievance.', 'plants its feet. This will be loud.'],
  FAST: ['is twitching toward you.', 'looks quick and unpleasant.', 'is about to be in your face.', 'has decided speed is a personality.'],
  DODGE: ['is getting slippery.', 'is watching your feet.', 'prepares to be elsewhere.', 'looks hard to pin down.'],
  CHARGE: ['Next turn: BIG BUMMER.', 'is gathering something enormous.', 'is charging. Consider your options.', 'hums ominously. Next turn will hurt.'],
  STATUS: ['has something nasty on its claws.', 'wants to ruin your afternoon specifically.', 'is being subtle about it, which is worse.', 'has an ailment to share.'],
  SHIELD: ['raises a guard. Hit harder or wait.', 'braces for impact.', 'is hiding behind something sturdy.'],
  HEAL: ['is patching itself up.', 'is tending its wounds.', 'looks like it is about to feel better.'],
  REST: ['is catching its breath.', 'is regrouping.']
};
const INTENT_ICON = { HEAVY: '⚔', FAST: '»', DODGE: '≈', CHARGE: '◆', STATUS: '☠', SHIELD: '◆', HEAL: '+', REST: '…' };
const BOSS_TEXT = {
  barnaby: {
    intro: [
      ['Sir Barnaby', 'Halt. This is a toll bridge.'], ['You', 'It\'s a plank over a creek.'], ['Sir Barnaby', 'It is a toll plank over a toll creek. Please have your toll ready.'],
      ['Sir Barnaby', 'The toll is one sack of food, or one holy reliquary. I accept exact change only.'], ['You', 'You have the cathedral\'s reliquary.'],
      ['Sir Barnaby', 'I have A reliquary. It is holding down the receipts. The wind here is very aggressive.'], ['Sir Barnaby', 'Before you ask, yes, I am a knight. I knighted myself. The paperwork was extensive.'],
      ['Sir Barnaby', 'I have a shield, a club, and a laminated sign. You have trousers. I have seen the sketch, by the way.'], ['You', 'Why has everyone seen the sketch?'],
      ['Sir Barnaby', 'Lucien had copies made. For morale.'],
      { n: 'Sir Barnaby', t: 'So. Toll, or combat?', c: [{ t: 'Combat.', r: [['Sir Barnaby', 'Combat it is. Please note the bridge is not insured.']] }, { t: 'Can I get a receipt?', r: [['Sir Barnaby', 'Of course. It will be written on your defeat.'], ['Sir Barnaby', '...That sounded better in my head.']] }, { t: 'I\'ll pay in bruises.', r: [['Sir Barnaby', 'We do not accept bruises. We issue them.']] }] }
    ],
    quips: ['Sir Barnaby: "Toll violation, section four."', 'Sir Barnaby: "My shield has seen worse. Mostly weather."', 'Sir Barnaby: "Stop hitting the bridge authority."', 'Sir Barnaby: "I am writing you a fine. In my head."', 'Sir Barnaby: "Management will hear about this. I am management."'],
    phase: [['Sir Barnaby', 'That is it. I am closing the bridge. PERMANENTLY.'], ['Sir Barnaby', 'You have exceeded your crossing allowance. Shields up. Diplomacy down.']],
    defeat: [['Sir Barnaby', 'Fine. Fine! Take the reliquary. Take the receipts.'], ['Sir Barnaby', 'The bridge is free now. Anarchy. I hope you are happy.'], ['You', 'Reasonably.']]
  },
  gloomfang: {
    intro: [
      ['', 'The hollow smells of wet fur, old smoke, and purple, somehow.'], ['Gloomfang', 'GRRRRRRRRRR.'], ['You', 'Good wolf? Big good wolf?'], ['Gloomfang', 'GRRRRRRRRRRRRRR.'],
      ['', 'Its collar tag glints: PROPERTY OF LUCIEN. IF FOUND, DO NOT RETURN. HE KNOWS WHAT HE DID.'], ['You', 'He... knows what he did?'],
      ['', 'The chains rattle. A purple flame rolls along its spine like a very bad idea.'], ['Gloomfang', '...Awoo.'], ['You', 'That was almost friendly.'], ['Gloomfang', 'AWOOOOOOOOO.'],
      { n: '', t: 'Gloomfang lowers its head.', c: [{ t: 'Sit!', r: [['', 'Gloomfang does not sit. Gloomfang is, if anything, standing harder.']] }, { t: 'Offer a drumstick.', r: [['', 'It eats the drumstick, the idea of the drumstick, and some of your confidence.']] }, { t: 'Draw your weapon.', r: [['', 'Gloomfang respects this. Gloomfang will also eat you.']] }] }
    ],
    quips: ['Gloomfang growls like a cellar door.', 'Gloomfang shakes its chains dramatically.', 'Gloomfang sniffs you. It does not like what it smells.', 'Gloomfang\'s purple flames flicker with interest.'],
    phase: [['', 'The chains SNAP. The purple fire roars up its back like a second, angrier wolf.'], ['', 'Gloomfang howls. Every chain link breaks at once. Somewhere, a kennel master resigns.']],
    defeat: [['', 'Gloomfang lies down, flames guttering, and puts its huge head on its paws.'], ['', 'It looks, for a moment, like a very tired dog who was never walked.'], ['You', 'Go on. Find a nice farm. A big one.']]
  },
  timmy: {
    intro: [
      ['Lich King Timmy', 'WHO DARES ENTER MY KINGDOM AFTER DARK?'], ['You', 'It\'s the afternoon.'], ['Lich King Timmy', 'IT IS ALWAYS DARK IN MY KINGDOM. I DECIDED.'],
      ['Lich King Timmy', 'I am Timmy. King Timmy. Lich King Timmy. You may call me "Your Frostiness."'], ['You', 'Timmy, do your parents know you\'re a lich?'],
      ['Lich King Timmy', 'They\'re in the crypt. I raised them. They said "not now, Timmy," which is basically yes.'], ['Lich King Timmy', 'I have a phylactery. It is a lunchbox. It has a dragon on it. You cannot touch it.'],
      ['Lich King Timmy', 'And I have an army. Well. Four skeletons and a mummy who smells.'], ['You', 'The whole village can smell him.'], ['Lich King Timmy', 'HE HAS A CONDITION.'],
      ['Lich King Timmy', 'Mister Lucien says if I keep the graveyard scary he\'ll let me stay up forever.'],
      { n: 'Lich King Timmy', t: 'So are you going to fight me or are you going to tell me to go to bed?', c: [{ t: 'Fight.', r: [['Lich King Timmy', 'YESSS. Finally someone takes me seriously.']] }, { t: 'Go to bed, Timmy.', r: [['Lich King Timmy', 'YOU ARE NOT MY MUM.'], ['Lich King Timmy', 'SHE IS IN THE CRYPT.']] }, { t: 'Nice crown.', r: [['Lich King Timmy', 'Thank you. It is my dad\'s. It is also cursed. It is also mine now.']] }] }
    ],
    quips: ['Timmy: "That didn\'t count. I wasn\'t ready."', 'Timmy: "I\'m telling Mister Lucien."', 'Timmy: "ICE BLAST! That\'s its official name."', 'Timmy: "You\'re not even scary. You\'re just tall."', 'Timmy: "I\'m NOT tired."'],
    phase: [['Lich King Timmy', 'FINE. I\'M NOT USING THE CHAIR ANYMORE. CHAIRS ARE FOR BABIES.'], ['Lich King Timmy', 'You broke my throne. That was a PRESENT.']],
    defeat: [['Lich King Timmy', '...Okay. Okay, I\'m a little tired.'], ['Lich King Timmy', 'Can the skeletons still come to my birthday?'], ['You', 'Ask the priest. He\'s very understanding. Mostly.']]
  },
  minotaur: {
    intro: [
      ['Minotaur', 'Oh. Oh no. Oh, you\'re here. Hi. Sorry. Hello.'], ['You', 'You\'re the Minotaur?'], ['Minotaur', 'That\'s what they call me. My name is Gerald, but it doesn\'t feel very menacing.'],
      ['Minotaur', 'I\'m supposed to guard the center of the maze. This is the center. So I guess I\'m... doing it.'], ['Minotaur', 'Sorry about the pressure plates. And the gremlin. And the chest. I asked for a smaller chest.'],
      ['You', 'Are you alright?'], ['Minotaur', 'Nobody ever asks that. I\'m... I\'m going to be honest, I have a lot going on.'],
      ['Minotaur', 'Lucien says I have "big axe energy." I don\'t know what that means. I just carry it. It\'s heavy.'], ['Minotaur', 'I did my breathing exercises this morning. In for four. Hold for four. Charge for four.'],
      ['You', 'That last one isn\'t breathing.'], ['Minotaur', 'IT IS IN MY VERSION.'],
      { n: 'Minotaur', t: 'I\'m really sorry about what\'s about to happen. Are you ready? You don\'t have to be.', c: [{ t: 'I\'m ready.', r: [['Minotaur', 'Okay. Okay. Big axe energy. Big axe energy.']] }, { t: 'We don\'t have to fight.', r: [['Minotaur', 'We do, though. It\'s in my contract. Page one. It\'s the only page.']] }, { t: 'Breathe, Gerald.', r: [['Minotaur', 'In for four... hold... okay. Thank you. I\'m still going to charge you.']] }] }
    ],
    quips: ['Minotaur: "Sorry! Sorry. That one was on purpose, but sorry."', 'Minotaur: "Is my stance weird? Everyone looks at my stance."', 'Minotaur: "In for four... hold for four..."', 'Minotaur: "You\'re doing great, by the way."', 'Minotaur: "Please don\'t tell anyone I apologised."'],
    phase: [['Minotaur', 'Why am I LIKE this? WHY CAN\'T I JUST BE NORMAL?!'], ['Minotaur', 'I\'m not angry at you! I\'m angry at ME! ...Which is somehow worse for you!']],
    defeat: [['Minotaur', 'Oh. Oh, I lost. That\'s... actually kind of a relief?'], ['Minotaur', 'Lucien\'s throne is past the fortress gate. Please be careful. He\'s very rude about stances.'], ['You', 'Take care of yourself, Gerald.']]
  },
  lucien: {
    intro: [
      ['Lucien', 'You made it. The herald owes me a coin.'], ['Lucien', 'I did say I might listen. So. What is it you intend to save?'], ['You', 'Placenta Creek.'],
      ['Lucien', 'Placenta Creek.'], ['Lucien', 'I have been sovereign of scorn for three hundred years and I have never had to say those words aloud.'],
      ['Lucien', 'Do you know what it is to rule? It is paperwork, mostly. And a very hard chair.'], ['Lucien', 'The guards were right about the trousers, by the way. Remarkable detail. Unremarkable trousers.'],
      ['You', 'Everyone has seen that sketch.'], ['Lucien', 'I had it framed. Next to the mantel. The mantel, you will notice, still has a gap.'],
      ['Lucien', 'The herald has measured you twice from the doorway. He is very excited. Please do not make him feel useful.'],
      ['Lucien', 'I am Lucien. Sovereign of Scorn. Master of the Midnight Flame. And you are... late.'],
      { n: 'Lucien', t: 'Shall we?', c: [{ t: 'Let\'s end this.', r: [['Lucien', 'Everyone says that. Very few say it well.']] }, { t: 'Nice chair.', r: [['Lucien', 'It is not. Thank you for noticing, though. Nobody notices.']] }, { t: 'Shorten your title.', r: [['Lucien', 'Win, and I will consider it. Lose, and the herald reads the long version at your funeral.']] }] }
    ],
    quips: ['Lucien: "Your stance is adequate. That is not a compliment."', 'Lucien: "The herald is taking notes. Try to be quotable."', 'Lucien: "The mantel is right there. I\'m just saying."', 'Lucien: "Those trousers, up close. Remarkable."', 'Lucien: "Is this the saving? It seems loud."', 'Lucien: "I have killed better heroes. Politer ones, too."'],
    phase: [['Lucien', 'Enough. Herald — dim the torches. I want this part to look expensive.'], ['Lucien', 'You have made me stand up. Do you know how long it has been since I had to stand up?']],
    defeat: [['Lucien', '...Hm.'], ['Lucien', 'Well. That was a great deal more effort than I had planned for a Tuesday.']]
  }
};
const MINI_BOSS_PHASE = ['{n} staggers, then steadies with renewed fury.', '{n} is not done yet.'];
/* ---------------- NPC TALK POOLS ---------------- */
// each exchange: array of [speaker, text] ; speaker 'P' = player. cond: fn(S) -> bool
const TALK = {
  priest: [
    { l: [['Priest', 'Wipe your boots. That floor survived two kings and one extremely wet goose.'], ['P', 'The goose was wet?'], ['Priest', 'The goose was baptised. Against its will. We do not talk about it.']] },
    { l: [['Priest', 'The reliquary was stolen from this very altar. It held the finger bone of Saint Elbert.'], ['P', 'Just the finger?'], ['Priest', 'He was a generous man. He is in many churches.']], c: s => !s.bosses.barnaby },
    { l: [['Priest', 'Pray, rest, or pay. The Lord accepts all three, the roof only accepts one.']] },
    { l: [['Priest', 'I revive the fallen here. It is not glamorous. People come back confused and hungry.'], ['P', 'And you?'], ['Priest', 'I come back to the same people every week. Also confused. Also hungry.']] },
    { l: [['Priest', 'Do not touch the candles. They are older than your grandparents and twice as judgmental.']] },
    { l: [['Priest', 'Have you been blessed? You look unblessed. It is in the shoulders.'], ['P', 'My shoulders are fine.'], ['Priest', 'That is what the unblessed always say.']] },
    { l: [['Priest', 'The reliquary is home. Saint Elbert\'s finger is pointing at the ceiling again. We think that is a good sign.'], ['P', 'You think?'], ['Priest', 'Faith is mostly guessing with conviction.']], c: s => s.bosses.barnaby },
    { l: [['Priest', 'The dead in Grave Mistake are restless. I blame a lack of structure. And the child.'], ['P', 'The child?'], ['Priest', 'There is always a child.']], c: s => s.bosses.gloomfang && !s.bosses.timmy },
    { l: [['Priest', 'Timmy\'s parents are back at the crypt, grounded, both of them. I have never seen a family so relieved to be buried.']], c: s => s.bosses.timmy },
    { l: [['Priest', 'The bell rang by itself last night. Either a miracle, or the rope is rotting. I have ordered a new rope, as a precaution against miracles.']], c: s => s.bosses.timmy }
  ],
  smith: [
    { l: [['Blacksmith', 'If the edge is dull, put it on the bench. If it speaks, tell me before I touch it.']] },
    { l: [['Blacksmith', 'Bring me wolf pelts. Four. I need them for the bellows, and for a coat I will deny owning.']], c: s => !s.quests.pelts || s.quests.pelts.state === 'active' },
    { l: [['Blacksmith', 'That hammer? Forty years. The handle\'s been replaced six times and the head twice.'], ['P', 'So it\'s a new hammer.'], ['Blacksmith', 'It is the same hammer. Get out of my forge with your philosophy.']] },
    { l: [['Blacksmith', 'Armor is just a promise. I make the promise thick.']] },
    { l: [['Blacksmith', 'You swing like someone who learned from a painting.'], ['P', 'I learned from a book.'], ['Blacksmith', 'Worse. At least a painting has the right pose.']] },
    { l: [['Blacksmith', 'Don\'t lean on the anvil. It\'s been leaned on enough. It\'s tired.']] },
    { l: [['Blacksmith', 'Heard you took the bridge back from that orc. He came in once for a shield repair. Tried to charge me a toll to leave.']], c: s => s.bosses.barnaby },
    { l: [['Blacksmith', 'That wolf-pelt coat? Warm. Unrelated question: have you seen my coat? No? Good. Neither have I.']], c: s => s.quests.pelts && s.quests.pelts.state === 'done' },
    { l: [['Blacksmith', 'Fortress steel. Dark iron. Brings a chill to the forge. I like it. Makes me feel like I\'m in a ballad.']], c: s => s.bosses.minotaur }
  ],
  merchant: [
    { l: [['Merchant', 'The shop is open. That crate is not. We\'re both happier this way.']] },
    { l: [['Merchant', 'That goose. That GOOSE. It has cost me three baskets and a hat. Defeat it for me. Three times. It needs to learn.'], ['P', 'Three times?'], ['Merchant', 'Once is a lesson. Twice is a pattern. Three times is a policy.']], c: s => !s.quests.goose || s.quests.goose.state === 'active' },
    { l: [['Merchant', 'Every potion is freshly brewed. By someone. At some point.']] },
    { l: [['Merchant', 'Drumsticks are six coins. I don\'t make the prices. I make the drumsticks, and then the prices.']] },
    { l: [['Merchant', 'My cat is the manager. If she sits on it, it\'s not for sale.'], ['P', 'She\'s sitting on the till.'], ['Merchant', 'And so today, nothing is for sale. No. Kidding. Mostly.']] },
    { l: [['Merchant', 'I stock garlic for vampires, onions for werewolves, and turnips for people with no imagination.']] },
    { l: [['Merchant', 'Smoke bombs are for tactical retreats. Or for leaving a conversation. I use one every family dinner.']] },
    { l: [['Merchant', 'With the goose resolved, sales are up two percent. I have hired nobody. I celebrated alone.']], c: s => s.quests.goose && s.quests.goose.state === 'done' },
    { l: [['Merchant', 'Festival banners are up! I sold eleven. Well, I sold one, eleven times, to the same man. It kept blowing away.']], c: s => s.bosses.barnaby }
  ],
  home: [
    { l: [['P', 'I left looking heroic. I returned needing soup.']] },
    { l: [['P', 'The fire\'s still going. Either I\'m good at fires or someone keeps breaking in to be nice to me.']] },
    { l: [['P', 'Home. The chair creaks in a way I\'ve decided is supportive.']] },
    { l: [['P', 'I should hang something heroic above the fireplace. Something other than wet socks.']] },
    { l: [['P', 'The mannequin wears my armor better than I do. Smug little thing.']] },
    { l: [['P', 'Somewhere out there, Lucien has a mantel with a gap on it. I\'d prefer it stay empty.']] }
  ]
};
// Villagers
const VILLAGER_TALK = {
  farmer: [
    ['Farmer', 'The turnips are doing well. Too well. One of them looked at me.'], ['Farmer', 'Rain\'s good for the crops. Bad for my mood. It all evens out in the soup.'],
    ['Farmer', 'Something\'s been nicking the grain sacks. Something slimy. I\'ve blamed my brother in the meantime.'], ['Farmer', 'You fight monsters? I fight weeds. Mine grow back. Yours probably do too.'],
    ['Farmer', 'I named the scarecrow Gordon. Gordon has been more help than my son.'], ['Farmer', 'Food\'s stopped going missing since that orc got sorted. I\'ve had to start blaming the weather again.', s => s.bosses.barnaby],
    ['Farmer', 'Wolf pelts on the fence now. The chickens are either comforted or terrified. Hard to tell with chickens.', s => s.bosses.gloomfang]
  ],
  old: [
    ['Old Woman', 'In my day the Demon Lord kept to his side of the mountains. Manners, that was.'], ['Old Woman', 'I\'ve outlived three husbands and a goat. The goat was the most attentive.'],
    ['Old Woman', 'You\'re not eating enough. I can tell. Your sword arm looks hungry.'], ['Old Woman', 'Don\'t go near the graveyard after dark, dear. Or do. I\'m not your mother. Your mother would say don\'t.'],
    ['Old Woman', 'My knees can predict the weather. Today they predict complaints.'], ['Old Woman', 'That graveyard\'s quiet again. I do miss the moaning. It was company.', s => s.bosses.timmy],
    ['Old Woman', 'They say you\'re going to the Fortress. Take a scarf. Evil is drafty.', s => s.bosses.minotaur]
  ],
  child: [
    ['Child', 'Are you a hero? You look like a hero who\'s tired.'], ['Child', 'I found a frog. I named it Sir Frog. It has not been knighted officially.'],
    ['Child', 'My mum says don\'t talk to strangers. You\'re not strange. You\'re just a bit muddy.'], ['Child', 'When I grow up I\'m going to be a goose.'],
    ['Child', 'Do skeletons have to go to bed? I bet they don\'t. Lucky.'], ['Child', 'Did you really beat a lich? Was he my age? Can he come over?', s => s.bosses.timmy],
    ['Child', 'I\'m going to draw the Demon Lord. But only his trousers, like the guards did.', s => s.bosses.minotaur]
  ],
  gossipA: [
    ['Gossip', 'Did you hear? The miller\'s son was seen holding hands with a scarecrow. Allegedly.'], ['Gossip', 'The priest bought new candles. Scented. Very suspicious.'],
    ['Gossip', 'They say the blacksmith cries when he forges a really good sword. I say he\'s just near the smoke.'], ['Gossip', 'That merchant\'s cat has more savings than I do.'],
    ['Gossip', 'You! You\'re the one who beat the orc! Was he handsome? For an orc?', s => s.bosses.barnaby], ['Gossip', 'The herald came through the gate yesterday, asked for directions, and apologised to a fence.', s => s.bosses.timmy]
  ],
  gossipB: [
    ['Gossip', 'Mm-hm. Mm-hm. Oh, I KNOW.'], ['Gossip', 'Don\'t look now. No, not now. Now. Okay, too late.'], ['Gossip', 'I only repeat things I\'ve heard twice. That makes them facts.'],
    ['Gossip', 'The festival is lovely. Nobody\'s stolen the banner yet. The night is young.', s => s.bosses.barnaby], ['Gossip', 'Wolf pelts are in fashion now. I\'ve had mine since the incident.', s => s.bosses.gloomfang]
  ],
  guard: [
    ['Guard', 'Gate\'s open. Mind the road. The road doesn\'t mind you.'], ['Guard', 'Nothing to report. Except the crow. The crow\'s always reporting.'], ['Guard', 'I\'ve been guarding this gate for eleven years. Never once has it tried anything.'],
    ['Guard', 'If you see a skull on the post, that was there before. It\'s the village skull. We call him Kevin.'], ['Guard', 'The night shift is quieter. Fewer geese.'],
    ['Guard', 'Raids from the wood lately. Wolves at night. Keep your weapon near your bed.', s => s.bosses.gloomfang], ['Guard', 'The maze\'s cleared, they say. Only the Fortress left. I\'ve started polishing my helmet. For morale.', s => s.bosses.minotaur],
    ['Guard', 'Word is the Fortress gate opens itself for anyone who beat the Minotaur. Seems like poor security.', s => s.bosses.minotaur]
  ]
};
const PRIEST_REVIVE = [
  ['Priest', 'You were dead ten minutes ago.'], ['P', 'How long was I...'], ['Priest', 'Ten minutes. I just said. Try to keep up, you\'ve had a big day.'],
  ['Priest', 'I have taken a small donation from your purse for the resurrection. It is a very small miracle and a very reasonable fee.']
];
const PRIEST_REVIVE_ALT = [
  [['Priest', 'Back again. I\'m starting a punch card for you.'], ['Priest', 'The donation has been collected. Go gently. Or at least less violently.']],
  [['Priest', 'You were dead ten minutes ago. Now you are merely embarrassing.'], ['Priest', 'Your purse is lighter. The Lord\'s roof is less leaky. Everyone wins, slightly.']],
  [['Priest', 'Welcome back to the living. Please remove your boots from the altar.'], ['Priest', 'I have taken the usual fee. Death is free; returning costs extra.']]
];
/* ---------------- ROAD VISITORS ---------------- */
const VISITORS = {
  mira: { name: 'Mira', voice: 'mira', look: { skin: '#e8b48a', hair: '#8a2a1a', hairStyle: 'long', top: '#4a7a5a', pants: '#4a3a2a', boots: '#3a2a20', belt: '#8a5a2a', cape: '#6a4a3a', weapon: 'staff', element: 'light', body: 'lanky', seed: 5 },
    intro: s => s.visitors.mira ? [['Mira', s.visitors.mira.last === 'help' ? 'Oh! My favourite muddy stranger. I\'ve got herbs to gather and a road full of teeth again.' : 'You again. I remember you. I remember everyone\'s price, too.'], ['Mira', 'Could you watch the path while I pick these? It takes a minute. The plants are shy.']] : [['Mira', 'Oh, hello. I\'m Mira. Herbalist. Occasionally lost, never unprepared.'], ['Mira', 'These moonleaves only grow by the roadside, where anything can walk up and bite you. Could you stand guard while I gather some?']],
    help: [['Mira', 'Thank you. Here, take a few. They\'re good in a potion. Or a very bitter salad.']], pay: [['Mira', 'Payment? For standing? ...Fine. You\'re at least standing very well.']], leave: [['Mira', 'Oh. Right. I\'ll just... be bitten, then.']],
    reward: { help: { item: 'mid', rep: 1 }, pay: { coins: 8 }, leave: {} } },
  bard: { name: 'Lost Bard', voice: 'bard', look: { skin: '#f0c49a', hair: '#c8903a', hairStyle: 'curly', hat: 'feather', top: '#8a3a5a', pants: '#3a2a4a', boots: '#4a2a20', belt: '#c8a040', weapon: 'lute', seed: 6 },
    intro: s => s.visitors.bard ? [['Lost Bard', 'You! You\'re in my ballad now. Verse six. Well — verse six is mostly about a goose, but you\'re in the chorus.'], ['Lost Bard', 'I\'m lost again. Do you know the way to anywhere with an audience?']] : [['Lost Bard', 'Hark! A traveller! Tell me, friend, which way to the tavern where the ballads pay?'], ['Lost Bard', 'I have been walking in circles. Poetically. I wrote a song about it. It\'s also in circles.']],
    help: [['Lost Bard', 'Placenta Creek! What a name. What a rhyme scheme. Nothing rhymes with it. PERFECT.'], ['Lost Bard', 'Here — a song for the road. It\'s about you. Mostly your trousers, I\'m afraid. Word gets around.']], pay: [['Lost Bard', 'A tip, for directions? The world is upside down. Here. My last coins. I\'ll write a sad song about it.']], leave: [['Lost Bard', 'Onward, then! I shall be lost with dignity!']],
    reward: { help: { buff: 'inspired', rep: 1 }, pay: { coins: 5 }, leave: {} } },
  taxman: { name: 'Tax Collector', voice: 'herald', look: { skin: '#e8c4a0', hair: '#5a5a5a', hairStyle: 'short', hat: 'tophat', top: '#2a2a3a', pants: '#2a2a2a', boots: '#1a1a1a', belt: '#1a1a1a', weapon: 'ledger', glasses: true, body: 'lanky', seed: 7 },
    intro: s => s.visitors.taxman ? [['Tax Collector', 'Ah. You. The one who ' + (s.visitors.taxman.last === 'help' ? 'helped count the elms. Your work was exemplary. Suspiciously so.' : s.visitors.taxman.last === 'pay' ? 'charged ME a fee. That is in the file. It has its own folder.' : 'walked past my audit. The trees remember.')], ['Tax Collector', 'I\'m auditing the oaks this time. They\'ve been underreporting acorns.']] : [['Tax Collector', 'Good day. Crown Revenue Office. I am auditing these trees.'], ['P', 'The trees.'], ['Tax Collector', 'Every tree on crown land owes a timber levy. Most of them have been very evasive. Could you help me count the rings on this stump?']],
    help: [['Tax Collector', 'Eighty-one rings. Eighty-one years of unpaid levy. Thank you. Here is a small civic rebate.']], pay: [['Tax Collector', 'You wish to be... paid? By the Revenue Office? ...I will allow it. I will also be writing it down.']], leave: [['Tax Collector', 'Noted. Non-cooperation. Your file grows, citizen.']],
    reward: { help: { coins: 12, rep: 1 }, pay: { coins: 6, rep: -1 }, leave: {} } },
  frog: { name: 'Prophetic Frog', voice: 'frog', frog: true,
    intro: s => s.visitors.frog ? [['Prophetic Frog', 'Ribbit. I foresaw your return. I also foresaw lunch. Only one of those came true, so far.'], ['Prophetic Frog', 'Would you like another prophecy? The fly is the fee.']] : [['Prophetic Frog', 'Ribbit. Traveller. I see your future.'], ['P', 'You\'re a frog.'], ['Prophetic Frog', 'And you are a person who is about to be told their future by a frog. Nobody chooses their role. Catch me a fly and I will prophesy.']],
    help: [['Prophetic Frog', 'Mm. Crunchy. Your prophecy: you will strike true, very soon, at least once. Ribbit.']], pay: [['Prophetic Frog', 'Pay you? I have one coin. I found it in a pond. It is prophetic, probably. Take it.']], leave: [['Prophetic Frog', 'I foresaw this too. That\'s the worst part of the job.']],
    reward: { help: { buff: 'foresight', rep: 1 }, pay: { coins: 1 }, leave: {} } },
  hero: { name: 'Retired Hero', voice: 'smith', look: { skin: '#e0b08a', hair: '#d8d0c0', hairStyle: 'short', beard: '#d8d0c0', tier: 2, top: '#7a8290', weapon: 'sword', wTier: 3, body: 'round', seed: 8 },
    intro: s => s.visitors.hero ? [['Retired Hero', 'Ha! The kid with the trousers! Still alive, I see. Good. Better than I did at your age. I was a statue for a while.'], ['Retired Hero', 'My back\'s gone again. Help an old legend up?']] : [['Retired Hero', 'Ah — sorry, don\'t mind me. Just resting. On the ground. Heroically.'], ['Retired Hero', 'Slew a dragon once, you know. Now my back slays me. Could you help me up?']],
    help: [['Retired Hero', 'Ooh. There we go. Here — a trick from the old days. Strike when they breathe in. Works on everything except geese.']], pay: [['Retired Hero', 'Ha! A mercenary! Good. Heroes who work for free end up like me. Here.']], leave: [['Retired Hero', 'No, no, it\'s fine. The ground and I are old friends.']],
    reward: { help: { buff: 'veteran', rep: 1 }, pay: { coins: 10 }, leave: {} } },
  herald: { name: 'Nervous Herald', voice: 'herald', look: { skin: '#f0d0b0', hair: '#3a2a4a', hairStyle: 'short', hat: 'cap', hatC: '#4a1428', top: '#4a1428', pants: '#2a1a2a', boots: '#1a1418', belt: '#c8a040', weapon: 'ledger', body: 'lanky', seed: 9 },
    intro: s => s.visitors.herald ? [['Nervous Herald', 'Oh no. Oh, it\'s you. Please don\'t tell him you saw me. He thinks I\'m buying ink.'], ['Nervous Herald', 'I\'ve rewritten the introduction again. It\'s down to nine pages. Could you... listen to a bit?']] : [['Nervous Herald', 'Ah! A traveller! Hello. I am — I am the herald of His Dreadful Majesty, Lucien, Sovereign of Scorn, Master of the Midnight Flame, Keeper of the—'], ['P', 'I know who he is.'], ['Nervous Herald', 'Oh thank goodness. Could you tell me if my introduction is too long? He says it\'s too long. It\'s only eleven pages.']],
    help: [['Nervous Herald', 'Too long. Yes. Yes, that\'s what he said. You\'re both very cruel and very correct. Here — something for your trouble. Please don\'t tell him.']], pay: [['Nervous Herald', 'You want paying for criticism? That\'s... that\'s what he does. Oh no. Oh no, you\'re management material.']], leave: [['Nervous Herald', 'Right. Yes. Nobody wants to hear it. That\'s fine. That\'s the job.']],
    reward: { help: { item: 'tonic', rep: 1 }, pay: { coins: 9 }, leave: {} } },
  activist: { name: 'Goose-Rights Activist', voice: 'gossip', look: { skin: '#e8b48a', hair: '#6a3a2a', hairStyle: 'bun', top: '#6a8a3a', pants: '#4a4a3a', boots: '#3a2a20', belt: '#8a5a2a', weapon: 'sign', body: 'sturdy', seed: 10 },
    intro: s => s.visitors.activist ? [['Goose-Rights Activist', (s.stats.geese || 0) > 0 ? 'I have heard reports. Of goose-related violence. ' + (s.stats.geese) + ' incidents. I am keeping count.' : 'You again. I have been told you are gentle with waterfowl. I am cautiously supportive.'], ['Goose-Rights Activist', 'Will you sign the petition? It\'s for goose crossings. With little signs.']] : [['Goose-Rights Activist', 'Excuse me! Do you have a moment for the geese?'], ['P', 'I... have fought a goose.'], ['Goose-Rights Activist', 'EVERYONE has fought a goose. That is the PROBLEM. Sign my petition for humane goose relations.']],
    help: [['Goose-Rights Activist', 'Thank you! Take this. It\'s a feather. Donated. Consensually.']], pay: [['Goose-Rights Activist', 'You want MONEY to sign? ...Fine. The geese have a fund. It\'s mostly bread.']], leave: [['Goose-Rights Activist', 'The geese will remember this. They remember everything.']],
    reward: { help: { mat: 'feather', rep: 1 }, pay: { coins: 4 }, leave: {} } }
};
const BUFFS = { inspired: ['Inspired', '+2 damage next fight'], foresight: ['Foresight', 'First attack next fight is PERFECT'], veteran: ['Veteran\'s Tip', '+15 Break at start of next fight'], blessing: ['Blessing', '+10% accuracy next fight'] };
/* ---------------- QUESTS ---------------- */
const QUEST_DEFS = {
  reliquary: { name: 'The Missing Reliquary', giver: 'Priest', desc: 'Find the cathedral\'s stolen reliquary.', goal: 1 },
  pelts: { name: 'Pelts for the Forge', giver: 'Blacksmith', desc: 'Bring the blacksmith 4 Wolf Pelts.', goal: 4 },
  goose: { name: 'The Goose Problem', giver: 'Merchant', desc: 'Defeat the Angry Goose 3 times.', goal: 3 },
  parish: { name: 'Unquiet Parishioners', giver: 'Priest', desc: 'Lay 6 undead to rest in Grave Mistake.', goal: 6 },
  survey: { name: 'The Surveyor\'s Folly', giver: 'Gate Guard', desc: 'Collect 3 Map Scraps from the maze.', goal: 3 }
};
const CREDITS = [
  ['THE DEMON LORD\'S BUMMER', ''], ['A Placenta Creek Production', ''], ['Starring', 'You, and your trousers'], ['Monarch Lucien', 'as himself, reluctantly'], ['The Herald', 'Title Shortening Consultant'],
  ['Sir Barnaby', 'Bridge Authority (Retired)'], ['Gloomfang', 'A Good Boy, Eventually'], ['Lich King Timmy', 'Now in bed by eight'], ['Gerald the Minotaur', 'Breathing exercises by Gerald'],
  ['The Priest', 'Resurrections, at a reasonable fee'], ['The Blacksmith', 'Hammer (the same one)'], ['The Merchant', 'and the Manager (cat)'], ['The Angry Goose', 'Undefeated in spirit'],
  ['Mira, the Bard, the Frog', 'and everyone on the road'], ['Kevin', 'The Village Skull'], ['No geese were harmed', 'without their consent'], ['Thank you for playing', '']
];
