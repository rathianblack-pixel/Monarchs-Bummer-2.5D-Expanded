'use strict';
/* =========================================================
   TRAVELLERS — content (Part 4: Octopath structure)
   Five playable travellers, each with their own chapters and a Path Action
   they can use on townsfolk. Path actions come in Octopath-style pairs:
     INQUIRE — You (chance-based, failure costs reputation) / Sister Pell (level-gated, always works)
     STEAL   — Sir Honkington (chance per item)
     CHALLENGE — Brendan (a duel, Brendan fights)
     PROVOKE — Lucien (insult them until their champion fights Lucien)
   ========================================================= */
const PATH_ACTIONS = {
  inquire: { name: 'INQUIRE', verb: 'Inquire', col: '#80c8ff', desc: 'Learn a secret. Unlocks side quests, hints and the odd gift.' },
  steal: { name: 'STEAL', verb: 'Steal', col: '#f0d060', desc: 'Lift one item. Each item can only be stolen once.' },
  challenge: { name: 'CHALLENGE', verb: 'Challenge', col: '#ff9a7a', desc: 'A duel. Win for their prize. The traveller fights alone.' },
  provoke: { name: 'PROVOKE', verb: 'Provoke', col: '#c890ff', desc: 'Goad them until their champion attacks. The traveller fights alone.' }
};
// cls = the class the traveller fights with when they lead (Break weaknesses use it too)
const TRAVELLERS = {
  hero: { name: () => S.name, title: 'The Reluctant Hero of Placenta Creek', path: 'inquire', pathNote: 'chance-based · a failure costs reputation', cls: null, col: '#f0d890',
    blurb: 'Asked to find a reliquary. Ended up deposing a Demon Lord. Still owes the blacksmith for a sword.' },
  pell: { name: 'Sister Pell', title: 'Nun of Lowered Expectations', path: 'inquire', pathNote: 'level-gated · never fails', cls: 'light', col: '#fff0a0', blurb: 'Hears confessions professionally and gossip recreationally. Believes in you, mostly.' },
  honk: { name: 'Sir Honkington', title: 'A Goose, Knighted by Mistake', path: 'steal', pathNote: 'chance per item', cls: 'water', col: '#f0e8d8', blurb: 'Was knighted during a ceremony he interrupted. Has kept the sword-shaped stick ever since.' },
  lucien: { name: 'Lucien', title: 'Monarch of Scorn (Retired)', path: 'provoke', pathNote: 'Lucien fights the champion', cls: 'fire', col: '#b060ff', blurb: 'Former Demon Lord. Now in a bathrobe and in therapy, with only one of them going well.' },
  brendan: { name: 'Brendan', title: 'Your Rival (Self-Appointed)', path: 'challenge', pathNote: 'Brendan duels them', cls: 'sword', col: '#6a8af0', blurb: 'Also from Placenta Creek. Also a hero. Got there second every time and has a cape about it.' }
};
const BRENDAN_LOOK = o => Object.assign({ face: 1, seed: 12, skin: '#f0c8a0', hair: '#e8c040', hairStyle: 'short', top: '#e8e8f0', sleeve: '#4a6ae0', pants: '#3a3a5a', boots: '#5a3a2a', armor: { plate: true, top: '#c8c8d8', tabard: '#4a6ae0', gold: true }, cape: '#4a6ae0', weapon: 'sword', expr: 'smug', body: 'sturdy' }, o);
// chapters: [title, level req, story text, foe id, arena area, difficulty 0-4, reward]
const CHAPTERS = {
  pell: [
    ['Chapter 1 · Confession Overflow', 8, 'A drowned choirboy keeps turning up at the wrong funerals and singing the wrong hymn. Pell has been sent to have "a gentle word". She has brought a very large hymnal.', 'choirboy', 6, 2, { coins: 60, item: 'tonic' }],
    ['Chapter 2 · The Apprentice\'s Excuse', 14, 'A necromancer apprentice claims the dead "asked to be raised". Pell would like to hear that from the dead directly.', 'necro', 2, 3, { coins: 90, item: 'high' }],
    ['Chapter 3 · The Wraith Who Would Not Confess', 20, 'A grave wraith has haunted the same pew for ninety years. It has never once said sorry. Today, Pell has cleared her schedule.', 'wraith', 2, 4, { coins: 150, item: 'high', blessHP: 6 }]
  ],
  honk: [
    ['Chapter 1 · The Other Goose', 8, 'There is another goose in Placenta Creek. It is louder. It is angrier. Sir Honkington has decided this town is not big enough for two.', 'goose', 0, 2, { coins: 50, item: 'drumstick' }],
    ['Chapter 2 · Seagull Diplomacy', 14, 'A seagull of entitlement has stolen Sir Honkington\'s bread. Negotiations have failed. Negotiations were one honk long.', 'gull', 5, 2, { coins: 90, item: 'mid' }],
    ['Chapter 3 · Talons and Tantrums', 20, 'A condescending harpy called Sir Honkington "a duck". There is no coming back from that.', 'harpy', 8, 3, { coins: 150, item: 'high' }]
  ],
  lucien: [
    ['Chapter 1 · Severance Package', 8, 'A Dread Knight from Lucien\'s old guard wants back pay. Lucien is, technically, unemployed. He will pay in fire.', 'dknight', 4, 1, { coins: 70, item: 'tonic' }],
    ['Chapter 2 · The Apprentice Who Stayed', 14, 'One dark sorcerer never left the fortress. He has been "holding the fort". Lucien would like the fort back, and his slippers.', 'sorcerer', 4, 3, { coins: 110, item: 'high' }],
    ['Chapter 3 · An Uncomfortable Throne', 20, 'The Throne Warden still guards an empty throne. Lucien has come to tell it, kindly, that the job is over. Then less kindly.', 'warden', 4, 4, { coins: 160, item: 'high', blessHP: 6 }]
  ],
  brendan: [
    ['Chapter 1 · Second Place at the Turnip Fair', 8, 'Twelve years ago a drunk peasant beat Brendan at turnip-tossing. Brendan has trained every day since. The peasant has been drinking every day since. It will be close.', 'peasant', 0, 3, { coins: 60, item: 'mid' }],
    ['Chapter 2 · A Cape in a Blizzard', 14, 'Brendan wants a dramatic duel in the snow, for the cape. The Abominable Manners yeti wants to be left alone. Only one of them gets their way.', 'yeti', 7, 4, { coins: 120, item: 'high' }],
    ['Chapter 3 · Rematch on the High Horse', 20, 'The Weathervane Knight beat Brendan once, so the scrapbook has a gap. Today he fills it.', 'vane', 8, 3, { coins: 170, item: 'high', blessHP: 6 }]
  ]
};
// the hero's chapters are the main story
const HERO_CHAPTERS = [['barnaby', 'Chapter 1 · The Missing Reliquary'], ['gloomfang', 'Chapter 2 · The Chained Hound'], ['timmy', 'Chapter 3 · Past Bedtime'], ['minotaur', 'Chapter 4 · The Centre, Probably'], ['lucien', 'Chapter 5 · The Demon Lord\'s Bummer'],
  ['ledger', 'Chapter 6 · An Itemised Invoice'], ['brackish', 'Chapter 7 · Queen of the Shallows'], ['grudge', 'Chapter 8 · The Cold Shoulder'], ['haughtsworth', 'Chapter 9 · Off the High Horse'], ['grinwell', 'Chapter 10 · Saint Grinwell']];
/* ---------- townsfolk path-action tables ----------
   lvl: their level (Pell's Inquire needs Lv >= lvl*3; Your Inquire odds fall as lvl rises)
   inquire: { t: secret, quest: path quest id, item: gift, coins }
   steal: [[item, chance]]   challenge / provoke: { foe, area, lvl, name?, look?, win: { coins, item }, line } (or { refuse: text }) */
const PATH_NPCS = {
  farmer: { name: 'Farmer Gil', town: 'village', lvl: 2,
    inquire: { t: 'Gil admits the scarecrow in the east field "moves when it rains". He has started leaving it an umbrella.', item: 'tonic' },
    steal: [['drumstick', .65], ['tonic', .3]],
    challenge: { foe: 'peasant', area: 0, lvl: 2, name: 'Farmer Gil', look: { hat: 'straw', hatC: '#d8b860', top: '#6a8a3a' }, win: { coins: 30, item: 'mid' }, line: 'Gil rolls up his sleeves. "Best of one. Loser weeds the other\'s field."' },
    provoke: { foe: 'slime_rat', area: 0, lvl: 0, win: { coins: 20, item: 'antidote' }, line: 'Lucien calls Gil\'s turnips "aggressively average". A sack splits. Slime rats pour out, offended on his behalf.' } },
  old: { name: 'Old Ned', town: 'village', lvl: 1,
    inquire: { t: 'Ned leans in. "The slime rats dragged my biscuit tin onto the creek road. My late wife\'s buttons are in it. Three of the little thieves, I counted."', quest: 'pq_tin' },
    steal: [['antidote', .75], ['high', .12]],
    challenge: { refuse: 'Ned looks at Brendan for a long time. "I am ninety-one, son." He gives Brendan a boiled sweet instead. Brendan accepts it as a draw.', item: 'drumstick' },
    provoke: { foe: 'goose', area: 0, lvl: 1, win: { coins: 25, item: 'mid' }, line: 'Lucien mocks Ned\'s walking stick. Ned\'s goose does not take it well.' } },
  child: { name: 'Pip', town: 'village', lvl: 1,
    inquire: { t: 'Pip whispers: "The cat is a spy. It reports to the crows." This is, alarmingly, consistent with the evidence.', item: 'smoke' },
    steal: [['smoke', .55]],
    challenge: { refuse: '"Mum says I\'m not allowed to duel people with capes." Brendan feels this is fair.' },
    provoke: { foe: 'raccoon', area: 0, lvl: 3, win: { coins: 30, item: 'mid' }, line: 'Lucien tells Pip that his "pet" is just a raccoon. The raccoon, hearing this, chooses violence.' } },
  gossipA: { name: 'Mags', town: 'village', lvl: 3,
    inquire: { t: 'Mags, delighted to be asked: "Someone stole the harvest pie off my sill. Raccoons. Two of them. I know their faces." She describes the faces.', quest: 'pq_pie' },
    steal: [['mid', .45], ['tonic', .3]],
    challenge: { refuse: 'Mags declines the duel and instead tells everyone Brendan asked her out. Brendan\'s reputation will recover.' },
    provoke: { foe: 'peasant', area: 0, lvl: 2, name: 'Mags\'s Husband', win: { coins: 30, item: 'drumstick' }, line: 'Lucien questions Mags\'s pie recipe. Her husband rises from the bench, slightly drunk, defending her honour.' } },
  gossipB: { name: 'Dot', town: 'village', lvl: 3,
    inquire: { t: 'Dot says the blacksmith is secretly writing poetry. "About anvils. Mostly anvils." She will deny she told you.', coins: 15 },
    steal: [['tonic', .5], ['antidote', .5]],
    challenge: { refuse: 'Dot laughs so hard she has to sit down. Brendan waits. Brendan is still waiting.' },
    provoke: { foe: 'slime_rat', area: 0, lvl: 1, win: { coins: 22, item: 'tonic' }, line: 'Lucien says Dot\'s gossip is "two days stale". She throws her basket. It contained a slime rat.' } },
  guard: { name: 'Gate Guard Hobb', town: 'village', lvl: 5,
    inquire: { t: 'Hobb sighs. "Wolves at night, from the fortress road. If someone thinned them out I could sleep. I haven\'t slept since the Tuesday incident."', quest: 'pq_patrol' },
    steal: [['smoke', .4], ['high', .14]],
    challenge: { foe: 'peasant', area: 0, lvl: 4, name: 'Gate Guard Hobb', look: { hat: 'helm', hatC: '#8a8a96', top: '#6a6a7a', weapon: 'sword' }, win: { coins: 45, item: 'high' }, line: 'Hobb draws a regulation sword. "By the book. Chapter four: duels. Chapter five: paperwork."' },
    provoke: { foe: 'goblin', area: 1, lvl: 1, win: { coins: 40, item: 'smoke' }, line: 'Lucien calls Hobb\'s helmet "a bucket with ambitions". Hobb whistles. A goblin he owes money to steps out of the hedge.' } },
  baker: { name: 'Baker Bun', town: 'village', lvl: 2,
    inquire: { t: 'Bun says the festival bread rises better when someone sings to it. He has been singing to it. The bread has been rising out of pity.', item: 'drumstick' },
    steal: [['drumstick', .8], ['mid', .3]],
    challenge: { refuse: 'Bun offers to duel with baguettes. Brendan accepts. Nobody wins. Everyone eats.', item: 'drumstick' },
    provoke: { foe: 'slime_rat', area: 0, lvl: 1, win: { coins: 18, item: 'drumstick' }, line: 'Lucien calls the bread "doughy". Bun does not hear him. The rats in the flour sacks do.' } },
  fisher: { name: 'Fisher Wren', town: 'village', lvl: 4,
    inquire: { t: 'Wren grumbles that goblin poachers net the river at dawn. "Two of them. Smell like old cheese and bad decisions."', quest: 'pq_poach' },
    steal: [['tonic', .5], ['mid', .35]],
    challenge: { foe: 'goblin', area: 1, lvl: 1, name: 'Fisher Wren', look: { hat: 'cap', hatC: '#3a6a8a' }, win: { coins: 35, item: 'tonic' }, line: 'Wren sets down her rod. "Fine. But if I win, you gut the fish."' },
    provoke: { foe: 'zwolf', area: 1, lvl: 2, win: { coins: 40, item: 'mid' }, line: 'Lucien critiques Wren\'s knots. A zombie wolf, attracted by the shouting, joins in.' } },
  bev: { name: 'Bev', town: 'port', lvl: 8,
    inquire: { t: 'Bev, polishing a mug: "There\'s a crate of tonics nobody claimed. Customs thinks it\'s cursed. Customs is a crab. Take two."', item: 'tonic', item2: 'tonic' },
    steal: [['high', .22], ['mid', .5], ['tonic', .6]],
    challenge: { refuse: 'Bev takes one look at Brendan\'s cape and says "No." It is the most final no Brendan has ever heard.' },
    provoke: { foe: 'deckhand', area: 5, lvl: 3, win: { coins: 70, item: 'high' }, line: 'Lucien asks if the ale is "meant to taste of rope". Bev\'s bouncer, a barnacled deckhand, asks him to repeat that.' } },
  marnie: { name: 'Old Marnie', town: 'port', lvl: 8,
    inquire: { t: 'Marnie, without looking up: "Two crabs cut my good net. Sulking crabs. You\'ll know them, they sulk."', quest: 'pq_net' },
    steal: [['tonic', .6], ['antidote', .6]],
    challenge: { foe: 'crab', area: 5, lvl: 1, name: 'Marnie\'s Crab', win: { coins: 50, item: 'mid' }, line: 'Marnie does not duel. Her crab, Gerald, does. Gerald has been waiting for this.' },
    provoke: { foe: 'gull', area: 5, lvl: 2, win: { coins: 55, item: 'tonic' }, line: 'Lucien calls Marnie\'s pier "a plank with delusions". A seagull, deeply invested in the pier, swoops.' } }
};
// side quests unlocked by path actions (tracked by Quests like the originals)
const PATH_QUESTS = {
  pq_tin: { name: 'Ned\'s Biscuit Tin', giver: 'Old Ned', desc: 'Defeat 3 Slime Rats on the creek road.', goal: 3, foe: 'slime_rat', reward: { coins: 40, item: 'tonic' } },
  pq_pie: { name: 'The Harvest Pie Heist', giver: 'Mags', desc: 'Defeat 2 Rabid Raccoons.', goal: 2, foe: 'raccoon', reward: { coins: 45, item: 'drumstick', n: 2 } },
  pq_patrol: { name: 'Night Patrol', giver: 'Gate Guard Hobb', desc: 'Defeat 3 Zombie Wolves on the forest road.', goal: 3, foe: 'zwolf', reward: { coins: 70, item: 'smoke', n: 2 } },
  pq_poach: { name: 'Poachers on the Creek', giver: 'Fisher Wren', desc: 'Defeat 2 Goblin Poachers.', goal: 2, foe: 'goblin', reward: { coins: 55, item: 'mid' } },
  pq_net: { name: 'Marnie\'s Good Net', giver: 'Old Marnie', desc: 'Defeat 2 Sulking Crabs.', goal: 2, foe: 'crab', reward: { coins: 80, item: 'high' } }
};
// ---------- town chatter: changes after each boss (latest boss beaten wins) ----------
const BARK_STAGES = ['start', 'barnaby', 'gloomfang', 'timmy', 'minotaur', 'lucien', 'ledger', 'brackish', 'grudge', 'haughtsworth', 'grinwell'];
const BARKS = {
  start: ['Someone stole the reliquary. From a church. Who does that?', 'The toll bridge orc wants three coins now. THREE.', 'Lovely weather for minor grievances.', 'My cousin saw a goose with a knife.', 'Are you the hero? You look… available.', 'The priest has been pacing since Tuesday.'],
  barnaby: ['You beat Sir Barnaby! The toll is FREE now!', 'They\'re throwing a festival. For you. Mostly for the free bridge.', 'Barnaby sent a sorry card. It was very well written.', 'The reliquary is back and the finger points up. Good omen.', 'The baker made you a bun shaped like your face. It\'s… close.'],
  gloomfang: ['The howling stopped. I can finally hear my husband snore.', 'Wolf pelts are in fashion now. Thanks, I suppose.', 'The fortress hound is gone? Then what\'s that howling — oh, that\'s Ned.', 'My dog won\'t look at you. Professional respect.', 'Guards say the raids come from the forest road now.'],
  timmy: ['The dead are back in their graves. Grounded.', 'Timmy\'s parents sent you a fruit basket. Mostly dirt.', 'Bedtime is sacred again. Thank you.', 'The bell rang by itself. The priest blames rope.', 'I\'m not afraid of the graveyard any more. A bit.'],
  minotaur: ['The maze is solved! Do you remember the way out? Asking for a surveyor.', 'A bull with anxiety. We\'ve all been there.', 'The Minotaur writes to the priest now. Pen pals.', 'The hedges grew back overnight. Out of spite, I think.'],
  lucien: ['THE DEMON LORD! You actually did it!', 'Is it true he cried? Pip says he cried.', 'The sky\'s less purple. I liked the purple, honestly.', 'Statue committee wants to know your good side.', 'I\'d buy you a drink but the tavern\'s still celebrating.'],
  ledger: ['Captain Ledger\'s invoice arrived. Itemised. Three pages.', 'Sailors say the shore is safe to sulk on again.', 'The crabs have stopped sulking. Mostly.'],
  brackish: ['Queen Brackish surfaced to say thanks. Then she sank again.', 'The sunken city has an open day now.', 'My fish tastes less of regret lately.'],
  grudge: ['The Cold Shoulder warmed up a bit.', 'The Grudge let go. Of what, nobody\'s sure.', 'A penguin apologised to me. Passive-aggressively.'],
  haughtsworth: ['Lord Haughtsworth is off his high horse. Literally. It ran off.', 'The skies are humble again.', 'The harpies are being polite. It\'s unsettling.'],
  grinwell: ['It\'s okay not to be okay! Saint Grinwell says so now.', 'Smiles are optional in Grinhaven. Everybody\'s so relaxed.', 'The whale sang last night. Everyone cried. Good crying.']
};
// a few lines per NPC kind for the first chat after a boss (keyed by kind)
const BARK_KIND = {
  farmer: { barnaby: 'Free bridge means I can sell turnips over the river. They\'re thrilled. Well. I am.', gloomfang: 'No more wolves in the fields. The turnips are sleeping better.', lucien: 'Demon Lord\'s gone and the turnips are still weird. So it wasn\'t him.' },
  guard: { gloomfang: 'Raids still come at night. Stay sharp after dark.', timmy: 'Grave duty\'s quieter now. I almost miss the moaning.', lucien: 'I\'d salute but I\'m on the clock. That was the salute.' },
  old: { barnaby: 'In my day we paid the orc in eggs. You kids and your heroics.', lucien: 'I met the old Demon Lord once. Lucien\'s dad. Terrible handshake.' },
  child: { barnaby: 'Can I hold your sword? I won\'t swing it. I\'ll swing it a bit.', timmy: 'Timmy was only nine hundred years old! That\'s not even old!', lucien: 'Did you really beat the Demon Lord? Prove it. Do a flip.' }
};
