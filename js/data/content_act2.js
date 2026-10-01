'use strict';
/* =========================================================
   CONTENT — ACT II: "The Bummer Below"
   Five new regions (areas 5–9), 25 main foes + 10 side-node foes,
   stories, boss scripts, materials, lore pages, companions.
   Appended to the Act I tables so ENEMIES[area * 5 + lvl] keeps working.
   ========================================================= */
AREAS.push(
  { id: 5, name: 'Brinebottom Shores', field: 'TIDAL PULL', fieldDesc: 'Every 2nd turn the tide turns: both sides Soaked, +2 Focus', pal: { a: '#d8c088', b: '#3a7a9a' }, amb: 'a5', world: 2 },
  { id: 6, name: 'Sunken City of Glub', field: 'PRESSURE', fieldDesc: 'Enemy hits grow 6% stronger each turn (max +36%)', pal: { a: '#2a5a6a', b: '#0a1a2a' }, amb: 'a6', world: 2 },
  { id: 7, name: 'The Cold Shoulder', field: 'FROSTBITE', fieldDesc: '1 chill damage per turn; every 4th turn the foe freezes', pal: { a: '#d8e8f0', b: '#6a88a8' }, amb: 'a7', world: 2 },
  { id: 8, name: 'The High Horse', field: 'UPDRAFT', fieldDesc: '30% chance a gust weakens each enemy attack', pal: { a: '#e8e0f8', b: '#8a90c8' }, amb: 'a8', world: 2 },
  { id: 9, name: 'Grinhaven', field: 'TOXIC POSITIVITY', fieldDesc: 'Forced smiles sting (−1 HP) unless you are below half HP', pal: { a: '#f8b8d8', b: '#8a4a8a' }, amb: 'a9', world: 2 }
);
Object.assign(MATS, { shell: ['Sulk Shell', 6], brine: ['Brine Pearl', 9], scale: ['Glub Scale', 8], frost: ['Grudge Ice', 9], plume: ['Haughty Plume', 10], confetti: ['Cursed Confetti', 11], shard: ['Sigh Shard', 0], cursed: ['Cursed Ember', 14] });
const ENEMIES_ACT2 = [
  // ---- 5 · Brinebottom Shores ----
  { id: 'crab', name: 'Sulking Crab', area: 5, lvl: 1, arch: 'crab', look: { body: '#d0583a' }, trait: 'DEFENSIVE', style: 'snap', voice: 'chomp', drop: ['shell', .5], codex: 'Walks sideways out of every conversation. Holds a grudge in each claw, and one in reserve.' },
  { id: 'gull', name: 'Seagull of Entitlement', area: 5, lvl: 2, arch: 'gull', look: {}, trait: 'AGGRESSIVE', style: 'dive', voice: 'honk', drop: ['shell', .3], codex: 'Believes every chip on the beach was promised to it in writing. Has never written anything.' },
  { id: 'deckhand', name: 'Barnacled Deckhand', area: 5, lvl: 3, arch: 'human', look: { skin: '#b8c8a8', hair: '#2a3a3a', hairStyle: 'short', hat: 'cap', hatC: '#2a4a6a', top: '#d8d8c8', sleeve: '#3a5a8a', pants: '#3a3a4a', boots: '#2a2a30', belt: '#5a3a1a', weapon: 'knife', beard: '#2a3a3a', expr: 'tired', body: 'lanky' }, trait: 'TRICKSTER', style: 'stab', voice: 'growl', drop: ['brine', .2], codex: 'Fell asleep on watch in the year of the big storm. Woke up covered in barnacles and a strong sense of grievance.' },
  { id: 'jelly', name: 'Jellyfish of Regret', area: 5, lvl: 4, arch: 'jelly', look: { body: '#c890e8' }, trait: 'TRICKSTER', style: 'sweep', voice: 'squeak', drop: ['brine', .6], codex: 'Translucent. You can see right through it, which is how it likes to see itself. Stings mostly emotionally.' },
  { id: 'ledger', name: 'Captain Ledger', area: 5, lvl: 5, boss: true, title: 'Pirate Accountant of the Brinebottom', arch: 'human', scale: 1.5, look: { skin: '#e0b090', hair: '#1a1418', hairStyle: 'long', hat: 'tophat', top: '#2a1a2a', sleeve: '#6a1a2a', pants: '#2a2a3a', boots: '#1a1418', belt: '#c8a040', cape: '#4a1020', weapon: 'ledger', glasses: true, beard: '#1a1418', expr: 'smug', body: 'round' }, look2: { expr: 'angry', weapon: 'sword' }, trait: 'DEFENSIVE', style: 'swing', voice: 'growl', drop: ['brine', 1], codex: 'Plunders exclusively by invoice. Has a parrot named Overdue. Sends you a bill for the privilege of losing.' },
  // ---- 6 · Sunken City of Glub ----
  { id: 'angler', name: 'Lanternfish Lurker', area: 6, lvl: 1, arch: 'angler', look: { body: '#3a4a6a' }, trait: 'TRICKSTER', style: 'leap', voice: 'chomp', drop: ['scale', .5], codex: 'Dangles a little light and says "it gets better." It does not. It eats you.' },
  { id: 'clam', name: 'Clam Bureaucrat', area: 6, lvl: 2, arch: 'clam', look: {}, trait: 'DEFENSIVE', style: 'snap', voice: 'chomp', drop: ['brine', .4], codex: 'Shuts up completely when asked a direct question. Has kept the city running for nine hundred years by never opening.' },
  { id: 'choirboy', name: 'Drowned Choirboy', area: 6, lvl: 3, arch: 'human', undead: true, float: true, look: { skin: '#9ac0c8', hair: '#c8d0b8', hairStyle: 'curly', robe: '#e8f0f0', top: '#e8f0f0', sleeve: '#e8f0f0', pants: '#5a7a8a', boots: '#3a5a6a', cross: true, book: true, weapon: 'none', child: true, eyeGlow: '#80ffe0', expr: 'tired' }, trait: 'PROTECTOR', style: 'flick', voice: 'whisper', drop: ['scale', .3], codex: 'Still holding the high note from the day the city sank. It has been a very long note.' },
  { id: 'eel', name: 'Eel of Unfinished Business', area: 6, lvl: 4, arch: 'eel', look: { body: '#4a6a3a' }, trait: 'BERSERK', style: 'lunge', voice: 'growl', drop: ['scale', .7], codex: 'Has seventeen half-written letters to people who wronged it. Electric about every single one.' },
  { id: 'brackish', name: 'Queen Brackish', area: 6, lvl: 5, boss: true, title: 'Drowned Monarch of the Silent Court', arch: 'human', scale: 1.5, float: true, look: { skin: '#8ab0b8', hair: '#2a6a6a', hairStyle: 'longdark', hat: 'crown', robe: '#1a4a5a', top: '#1a4a5a', sleeve: '#2a6a6a', pants: '#1a3a4a', boots: '#0a2a3a', cape: '#0a3040', stole: '#c8a040', weapon: 'spear', eye: '#2a6a6a', eyeGlow: '#a0ffe8', expr: 'annoyed', body: 'lanky' }, look2: { expr: 'angry', eyeGlow: '#ffffff' }, trait: 'PROTECTOR', style: 'spell', voice: 'whisper', drop: ['scale', 1], codex: 'Ordered the whole city to stop singing. Then the sea took her literally. She does not like music. She likes it less now.' },
  // ---- 7 · The Cold Shoulder ----
  { id: 'penguin', name: 'Passive-Aggressive Penguin', area: 7, lvl: 1, arch: 'penguin', look: {}, trait: 'TRICKSTER', style: 'slap', voice: 'honk', drop: ['frost', .3], codex: 'Says "no, it\'s fine" in a way that drops the temperature four degrees.' },
  { id: 'swolf', name: 'Snow Wolf', area: 7, lvl: 2, arch: 'quad', look: { variant: 'wolf', body: '#d8e0e8', eye: '#60c0ff' }, trait: 'AGGRESSIVE', style: 'leap', voice: 'growl', drop: ['pelt', .6], codex: 'Gloomfang\'s cousin from the cold side of the family. They do not speak. Literally; they are wolves.' },
  { id: 'hermit', name: 'Frost-Bitten Hermit', area: 7, lvl: 3, arch: 'human', look: { skin: '#d8c0c8', hair: '#e8e8f0', hairStyle: 'long', beard: '#e8e8f0', hood: true, hoodC: '#5a6a8a', top: '#5a6a8a', sleeve: '#4a5a7a', pants: '#3a4a5a', boots: '#2a2a3a', weapon: 'staff', expr: 'annoyed', body: 'lanky' }, trait: 'DEFENSIVE', style: 'spell', voice: 'growl', drop: ['frost', .4], codex: 'Moved up the mountain to be left alone. Is furious that you did.' },
  { id: 'yeti', name: 'Abominable Manners', area: 7, lvl: 4, arch: 'yeti', look: {}, trait: 'BERSERK', style: 'punch', voice: 'growl', drop: ['frost', .7], codex: 'A yeti raised by a strict aunt. Will tear you apart, but will say "pardon" while doing it.' },
  { id: 'grudge', name: 'The Grudge', area: 7, lvl: 5, boss: true, title: 'It Remembers What You Did', arch: 'yeti', scale: 1.7, look: { variant: 'grudge' }, look2: { variant: 'grudge', angry: true }, trait: 'BERSERK', style: 'bash', voice: 'growl', drop: ['frost', 1], codex: 'A glacier of resentment that learned to walk. Becomes immune to whatever you do most. Petty, but effective.' },
  // ---- 8 · The High Horse ----
  { id: 'sheep', name: 'Cloud Sheep', area: 8, lvl: 1, arch: 'sheep', look: {}, trait: 'DEFENSIVE', style: 'charge', voice: 'squeak', drop: ['plume', .3], codex: 'Mostly weather. Partly sheep. Entirely smug about being above it all.' },
  { id: 'harpy', name: 'Condescending Harpy', area: 8, lvl: 2, arch: 'gull', look: { variant: 'harpy' }, trait: 'AGGRESSIVE', style: 'dive', voice: 'honk', drop: ['plume', .5], codex: 'Will explain your own fight to you, slowly, while winning it.' },
  { id: 'butler', name: 'Sky Butler', area: 8, lvl: 3, arch: 'human', look: { skin: '#e8c8a8', hair: '#c8c8c8', hairStyle: 'short', hat: 'tophat', top: '#1a1a24', sleeve: '#1a1a24', pants: '#1a1a24', boots: '#0a0a10', belt: '#e8e8e8', armor: { tabard: '#e8e8f0' }, weapon: 'cane', mustache: true, expr: 'smug', body: 'lanky' }, trait: 'PROTECTOR', style: 'slap', voice: 'growl', drop: ['plume', .4], codex: 'Has served the Haughtsworths for six generations. Thinks your boots are "a choice."' },
  { id: 'stallion', name: 'Stallion of Superiority', area: 8, lvl: 4, arch: 'horse', look: { body: '#f0f0f8', mane: '#d8b8f0' }, trait: 'BERSERK', style: 'charge', voice: 'growl', drop: ['plume', .7], codex: 'Has never once got off itself.' },
  { id: 'haughtsworth', name: 'Lord Haughtsworth', area: 8, lvl: 5, boss: true, title: 'On a Very High Horse', arch: 'rider', scale: 1.5, look: { body: '#f0f0f8', mane: '#e8c050' }, trait: 'DEFENSIVE', style: 'charge', voice: 'growl', drop: ['plume', 1], codex: 'Never dismounts. Never apologises. Not sure those are separate rules.' },
  // ---- 9 · Grinhaven ----
  { id: 'balloon', name: 'Balloon Animal', area: 9, lvl: 1, arch: 'balloon', look: { body: '#f05a8a' }, trait: 'AGGRESSIVE', style: 'jump', voice: 'squeak', drop: ['confetti', .4], codex: 'Twisted into the shape of a dog, which it resents. It will not stop squeaking "yay."' },
  { id: 'mime', name: 'Upbeat Mime', area: 9, lvl: 2, arch: 'human', look: { skin: '#f8f8f8', hair: '#1a1a1a', hairStyle: 'short', hat: 'cap', hatC: '#1a1a1a', top: '#f8f8f8', sleeve: '#1a1a1a', pants: '#1a1a1a', boots: '#1a1a1a', weapon: 'none', expr: 'happy', body: 'lanky' }, trait: 'TRICKSTER', style: 'punch', voice: 'squeak', drop: ['confetti', .3], codex: 'Trapped in an invisible box. Says it is "a growth opportunity." Says it silently, which is worse.' },
  { id: 'clown', name: 'Mandatory Fun Clown', area: 9, lvl: 3, arch: 'human', look: { skin: '#f8e8e8', hair: '#f05a2a', hairStyle: 'curly', redNose: true, top: '#f0d040', sleeve: '#5a8af0', pants: '#e04060', boots: '#5a3a1a', belt: '#3a8a3a', weapon: 'hammer', expr: 'happy', body: 'round' }, trait: 'BERSERK', style: 'bash', voice: 'growl', drop: ['confetti', .5], codex: 'Attendance is not optional. Neither is laughter. Neither, technically, is the clown.' },
  { id: 'bertha', name: 'Big Balloon Bertha', area: 9, lvl: 4, arch: 'balloon', scale: 1.6, look: { body: '#8a5af0', bow: true }, trait: 'PROTECTOR', style: 'jump', voice: 'squeak', drop: ['confetti', .8], codex: 'The parade float that refused to deflate. Keeps everyone "up." Forever.' },
  { id: 'grinwell', name: 'Saint Grinwell', area: 9, lvl: 5, boss: true, title: 'The Patron Saint of Being Fine', arch: 'human', scale: 1.5, look: { skin: '#f8e0d0', hair: '#f0e0a0', hairStyle: 'curly', robe: '#f8f0e0', top: '#f8f0e0', sleeve: '#f0d8a0', pants: '#e8d8b8', boots: '#c8a060', stole: '#f0a0c0', cross: true, weapon: 'staff', expr: 'happy', body: 'lanky' }, look2: { expr: 'angry', eyeGlow: '#ff60c0', robe: '#e8c8d8' }, trait: 'PROTECTOR', style: 'spell', voice: 'lucien', drop: ['confetti', 1], codex: 'Smiles so hard the ground does too. Everything in Grinhaven is fine. Everything. Is. Fine.' }
];
// side-node foes (named bounties + Sigh Shard keepers) — not in the ENEMIES index
const SIDE_ENEMIES = [
  { id: 'brendan', name: 'Brendan, Your Rival', area: 5, lvl: 3, arch: 'human', look: { skin: '#f0c8a0', hair: '#e8c040', hairStyle: 'short', top: '#e8e8f0', sleeve: '#4a6ae0', pants: '#3a3a5a', boots: '#5a3a2a', armor: { plate: true, top: '#c8c8d8', tabard: '#4a6ae0', gold: true }, cape: '#4a6ae0', weapon: 'sword', expr: 'smug', body: 'sturdy' }, trait: 'AGGRESSIVE', style: 'swing', voice: 'growl', drop: ['brine', 1], codex: 'Also a hero. Also from Placenta Creek. Got there second every time and has decided this is your fault.' },
  { id: 'kelp', name: 'Grandmother Kelp', area: 6, lvl: 3, arch: 'eel', scale: 1.3, look: { body: '#6a8a3a', kelp: true }, trait: 'PROTECTOR', style: 'sweep', voice: 'whisper', drop: ['scale', 1], codex: 'Keeps a Sigh Shard under her fronds "for when you\'re old enough." You are never old enough.' },
  { id: 'frostbeard', name: 'Frostbeard the Unforgiving', area: 7, lvl: 3, arch: 'human', scale: 1.2, look: { skin: '#c8b0b8', hair: '#f0f8ff', hairStyle: 'long', beard: '#f0f8ff', hat: 'helmet', top: '#4a5a7a', armor: { plate: true, top: '#8a98b0', mail: true }, pants: '#3a4a5a', boots: '#2a3a4a', weapon: 'axe', expr: 'angry', body: 'sturdy' }, trait: 'BERSERK', style: 'bash', voice: 'growl', drop: ['frost', 1], codex: 'Has not forgiven anyone since the winter of the missing mittens. Guards a shard of a sigh he has never let out.' },
  { id: 'vane', name: 'The Weathervane Knight', area: 8, lvl: 3, arch: 'human', look: { skin: '#e0c0a0', hair: '#5a3a2a', hat: 'helmet', plume: '#e04040', armor: { plate: true, top: '#c0c8d0', tabard: '#e8b030', gold: true }, pants: '#5a5a6a', boots: '#3a3a4a', weapon: 'halberd', shield: true, shieldC: '#e8b030', expr: 'neutral', body: 'sturdy' }, trait: 'TRICKSTER', style: 'stab', voice: 'growl', drop: ['plume', 1], codex: 'Turns to face whoever spoke last. Loyal to the wind. The wind is not loyal back.' },
  { id: 'chuckles', name: 'Chuckles, Who Is Fine', area: 9, lvl: 3, arch: 'human', look: { skin: '#f8f0f0', hair: '#3ac0f0', hairStyle: 'curly', redNose: true, top: '#8a3af0', sleeve: '#f0f040', pants: '#3af0a0', boots: '#f04040', weapon: 'club', sweat: true, expr: 'happy', body: 'round' }, look2: { expr: 'hurt' }, trait: 'BERSERK', style: 'swing', voice: 'squeak', drop: ['confetti', 1], codex: 'He is fine. He is SO fine. Please stop asking. (Nobody asked.)' }
];
ENEMIES.push(...ENEMIES_ACT2);
for (const e of ENEMIES_ACT2.concat(SIDE_ENEMIES)) ENEMY[e.id] = e;
STORIES.push(
  ['LOW TIDE, LOWER SPIRITS', 'Port Mopeway\'s beach is crawling with crabs that will not make eye contact. One is blocking the only path inland, and it is sulking about it.'],
  ['CHIPS, AHOY', 'A seagull has claimed the entire coast as "its spot." It has a little flag. It stole the flag.'],
  ['ALL HANDS, NO MANNERS', 'A barnacled deckhand guards a wrecked ship that is technically still on duty. So is he. Neither is happy about it.'],
  ['THE SHALLOWS OF SELF-PITY', 'In the rock pools floats a jellyfish so full of regret it glows. Touching it is a mistake. That\'s rather the point.'],
  ['THE INVOICE AT THE END OF THE WORLD', 'Captain Ledger has anchored across the harbour mouth and is charging for the view. Every turn you spend near him is billable.'],
  ['DOWN WHERE IT\'S DARK', 'Below the waves, Glub. A drowned city where lights bob in the dark and promise things. Do not follow the lights. Follow the lights a bit.'],
  ['FORM 27B: OPENING', 'The city gate is guarded by a clam that will not open without the correct form. The form is inside the clam.'],
  ['ONE LAST HIGH NOTE', 'The cathedral choir still sings, very quietly, because the Queen forbade it. Their smallest member has opinions about you.'],
  ['UNFINISHED BUSINESS', 'An eel coils around the palace steps, crackling with seventeen grudges and one very petty letter.'],
  ['THE SILENT COURT', 'Queen Brackish banned music. When she gets serious, the world goes quiet. You\'ll have to watch, not listen.'],
  ['A FROSTY RECEPTION', 'The mountain path is iced over, and so is every penguin on it. They are fine. It\'s fine. They\'re just saying.'],
  ['COLD-BLOODED RELATIVES', 'Snow wolves pace the pass. They have Gloomfang\'s eyes and none of his tragic backstory.'],
  ['THE HERMIT\'S DOORSTEP', 'A hermit lives here to be left alone. You are here. He will be dealing with that personally.'],
  ['PLEASE AND THANK YOU', 'A yeti blocks the summit. It says "excuse me" before every swing. It does not wait for an answer.'],
  ['THE GRUDGE', 'At the top of the Cold Shoulder, something enormous remembers every hit it ever took. Vary your approach. It is counting.'],
  ['HEAD IN THE CLOUDS', 'Above the snow, the clouds have sheep. The sheep have attitudes. The attitudes have horns.'],
  ['BEAKS AND LECTURES', 'A harpy circles the cloud road, explaining the cloud road to you, incorrectly.'],
  ['AT YOUR DISSERVICE', 'The Haughtsworth butler has been told to "see you out." He intends to see you all the way out.'],
  ['STABLE GENIUS', 'The Haughtsworth stallion has been standing on its own reputation so long it has grown a pedestal.'],
  ['GET OFF YOUR HIGH HORSE', 'Lord Haughtsworth rides above the clouds and above criticism. He takes half damage mounted. Land a PERFECT hit to knock him off.'],
  ['WELCOME TO GRINHAVEN!', 'The gates of Grinhaven are bright pink and smiling. So is the balloon dog guarding them. It is smiling with too many teeth.'],
  ['SAY NOTHING, SMILE', 'A mime in an invisible box blocks the high street, beaming. It is not trapped, it insists. It is "centred."'],
  ['ATTENDANCE IS MANDATORY', 'The fun fair is open. You will be having fun. There is a clown with a hammer to make sure.'],
  ['THE PARADE THAT NEVER ENDS', 'Big Balloon Bertha floats over the square, keeping everyone\'s spirits up. Forcibly. With string.'],
  ['EVERYTHING IS FINE', 'Saint Grinwell waits in the Cathedral of Good Vibes. Behind the smile, something has not slept in a hundred years.']
);
const SIDE_STORIES = {
  brendan: ['BRENDAN', 'Your old rival from Placenta Creek has "also been on an adventure." He has a cape now. He wants you to notice the cape.'],
  kelp: ['GRANDMOTHER KELP', 'An ancient eel in a hat of seaweed is guarding a Sigh Shard. She says you\'re too young to be sad. You are covered in sadness. Prove it.'],
  frostbeard: ['THE UNFORGIVING', 'Frostbeard has not let out a sigh since the winter of the missing mittens. It has frozen inside him into a shard. He would like you to leave.'],
  vane: ['WHICHEVER WAY THE WIND BLOWS', 'The Weathervane Knight guards a Sigh Shard on the highest spire. Whoever spoke last, he agrees with. Speak last.'],
  chuckles: ['CHUCKLES IS FINE', 'Behind the fun fair, a clown is guarding a Sigh Shard and his feelings. One of them is about to crack.'],
  cursed: ['A CURSED ONE', 'Something here has been soaking in bad feelings for too long. It glows purple. It hits harder. It drops better things.']
};
Object.assign(BOSS_TEXT, {
  ledger: {
    intro: [['Captain Ledger', 'Ahoy. Please hold. Your adventure is important to us.'], ['You', 'Are you... a pirate?'], ['Captain Ledger', 'I am a pirate accountant. I plunder by invoice. It is far more civilised and the paperwork is murder.'],
      ['Lucien', 'He sent me a bill once. For "being in the sea near him."'], ['Captain Ledger', 'And you never paid it, Your Former Majesty. It has compounded. You now owe me a small island.'],
      { n: 'Captain Ledger', t: 'Every third turn I shall send you an invoice. Pay up, or I write it off against your health.', c: [{ t: 'I don\'t do invoices.', r: [['Captain Ledger', 'Nobody does. That is why I have a sword.']] }, { t: 'Can I pay in sighs?', r: [['Captain Ledger', 'Not yet. Ask me again in Grinhaven.']] }] }],
    quips: ['Captain Ledger: "That one is billable."', 'Captain Ledger: "Late fee!"', 'Captain Ledger: "Overdue, fetch my quill."', 'Captain Ledger: "Itemised, please."'],
    phase: [['Captain Ledger', 'Right. I am closing your account.'], ['Captain Ledger', 'Overdue! Bring me my REAL sword!']],
    defeat: [['Captain Ledger', 'I... I shall have to write myself off.'], ['Captain Ledger', 'Take the harbour. Take the map to Glub. Keep the receipt.'], ['Lucien', 'Can I stop owing you an island?'], ['Captain Ledger', '...You may owe me a peninsula.']]
  },
  brackish: {
    intro: [['', 'The throne room of Glub is silent. Not quiet. Silent. Even your footsteps are embarrassed.'], ['Queen Brackish', 'You. Are. LOUD.'], ['You', 'I haven\'t said anything.'], ['Queen Brackish', 'Your thoughts are humming. Stop it.'],
      ['Sister Pell', 'Your Majesty, they used to sing here. I read about it. The whole city sang.'], ['Queen Brackish', 'And then I said "please, just one minute of peace." And the sea said... "sure."'],
      { n: 'Queen Brackish', t: 'When I am truly angry, the music stops. You will have to watch for my blows. Will you leave?', c: [{ t: 'No.', r: [['Queen Brackish', 'Then be QUIET about it.']] }, { t: '(Hum quietly.)', r: [['Queen Brackish', '...That is the worst thing anyone has ever done to me.']] }] }],
    quips: ['Queen Brackish: "Shhh."', 'Queen Brackish: "Do you HAVE to breathe like that?"', 'Queen Brackish: "Silence is a kind of music. The best kind."', 'Queen Brackish: "..."'],
    phase: [['Queen Brackish', 'ENOUGH NOISE.'], ['', 'The music drains out of the world. Watch her. Only watch.']],
    defeat: [['Queen Brackish', '...Oh. Oh, I can hear the water again.'], ['Queen Brackish', 'Is that... humming? Someone in the choir is humming.'], ['Queen Brackish', 'Tell them they may sing. Quietly. At first.']]
  },
  grudge: {
    intro: [['', 'The summit is a frozen wave of ice. Then the ice opens one eye.'], ['The Grudge', 'I REMEMBER YOU.'], ['You', 'We\'ve never met.'], ['The Grudge', 'I REMEMBER YOU ANYWAY.'],
      ['Sir Honkington', 'HONK.'], ['The Grudge', 'AND I REMEMBER THE GOOSE. THE GOOSE KNOWS WHAT IT DID.'],
      { n: 'The Grudge', t: 'Hit me the same way twice and I will hold it against you. Forever.', c: [{ t: 'Then I\'ll mix it up.', r: [['The Grudge', 'I WILL REMEMBER THAT TOO.']] }, { t: 'Can\'t you just let it go?', r: [['The Grudge', 'THE COLD NEVER BOTHERED ME. YOU DO.']] }] }],
    quips: ['The Grudge: "NOTED."', 'The Grudge: "THAT GOES IN THE BOOK."', 'The Grudge: "I SAW THAT. I SEE EVERYTHING. FOREVER."', 'The Grudge: "SAME OLD TRICK."'],
    phase: [['The Grudge', 'I HAVE LET NOTHING GO. NOT ONE THING.'], ['', 'Hail swirls around it like a list of complaints.']],
    defeat: [['The Grudge', 'I... can\'t remember why I was angry.'], ['The Grudge', 'Is this what letting go is? It\'s cold. Colder than me.'], ['You', 'You\'ll get used to it.']]
  },
  haughtsworth: {
    intro: [['Lord Haughtsworth', 'Ah. A pedestrian.'], ['You', 'Get down from there.'], ['Lord Haughtsworth', 'Down? DOWN? A Haughtsworth has not been down since the family was founded. Up, in fact, was invented by my grandfather.'],
      ['Lucien', 'He wouldn\'t come to my coronation because the ceiling was "too low."'], ['Lord Haughtsworth', 'It was, Lucien. It was a basement.'],
      { n: 'Lord Haughtsworth', t: 'While I am mounted I take half the damage of a commoner. It is breeding.', c: [{ t: 'I\'ll knock you off.', r: [['Lord Haughtsworth', 'You would need a PERFECT strike. Commoners do not do perfect.']] }, { t: 'Nice horse.', r: [['Lord Haughtsworth', 'He is above compliments. As am I.']] }] }],
    quips: ['Lord Haughtsworth: "How quaint."', 'Lord Haughtsworth: "Mind the horse, it is worth more than your village."', 'Lord Haughtsworth: "Do you always attack like that? How brave."', 'Lord Haughtsworth: "Up here, the air is thinner. Like your chances."'],
    phase: [['', 'Lord Haughtsworth hits the clouds with a soft, undignified "flump."'], ['Lord Haughtsworth', 'I am... on the ground. I am ON. THE. GROUND.'], ['Lord Haughtsworth', 'It is so much lower than I was told.']],
    defeat: [['Lord Haughtsworth', 'Everything is so big from down here.'], ['Lord Haughtsworth', 'Is this what it is like for everyone? All the time?'], ['You', 'Pretty much.'], ['Lord Haughtsworth', 'How do you BEAR it?']]
  },
  grinwell: {
    intro: [['', 'The Cathedral of Good Vibes is pink, gold, and completely silent except for the smiling.'], ['Saint Grinwell', 'Welcome, friend! You look SAD. We can fix that!'],
      ['You', 'I\'m fine.'], ['Saint Grinwell', 'Exactly! Everyone is fine! I made everyone fine! It took a hundred years and I have not blinked since!'],
      ['Lucien', 'Grinwell. You took the Bummer.'], ['Saint Grinwell', 'Lucien! You look AWFUL. Wonderful! I took the Bummer and locked it in the deep, where sad things go. Now there\'s no sadness. Anywhere. Ever.'],
      ['Sister Pell', 'But people need to be sad sometimes. That\'s how they know what mattered.'], ['Saint Grinwell', 'No they don\'t! Smile!'],
      { n: 'Saint Grinwell', t: 'Will you smile for me?', c: [{ t: 'No.', r: [['Saint Grinwell', 'That\'s okay! I\'ll smile for both of us! FOREVER!']] }, { t: '(Smile, badly.)', r: [['Saint Grinwell', 'Almost! Let me help!']] }] }],
    quips: ['Saint Grinwell: "Positive vibes only!"', 'Saint Grinwell: "Turn that frown upside down! By force!"', 'Saint Grinwell: "Every hit is a learning experience!"', 'Saint Grinwell: "I\'m not crying, YOU\'RE crying!"', 'Saint Grinwell: "Good vibes! GOOD VIBES!"'],
    phase: [['Saint Grinwell', 'Okay! Okay! That\'s fine! Everything is still FINE!'], ['', 'The smile stretches wider than a face should allow.']],
    phase3: [['', 'The smile cracks right down the middle.'], ['Saint Grinwell', 'I can\'t... I can\'t stop smiling. I don\'t know how to stop.'], ['Saint Grinwell', 'Please. PLEASE. Make me stop.']],
    defeat: [['Saint Grinwell', '...Oh.'], ['Saint Grinwell', 'Oh, that\'s... that\'s a sigh. I forgot what that felt like.'], ['Saint Grinwell', 'It\'s awful. It\'s wonderful. Is it allowed?'], ['Lucien', 'It\'s allowed.']]
  }
});
// lore pages (30): 25 from Act II main fights + 5 from Sigh Shard keepers
const LORE_PAGES = [
  'The Bummer is not a curse. It is a whale. A very large, very gentle, very sad whale who used to carry the world\'s little sorrows so nobody had to carry them alone.',
  'Port Mopeway was founded by fishermen who were too glum to go home. They called it a port. It is mostly a pier and a feeling.',
  'Captain Ledger once invoiced the tide for being late. It paid, in driftwood. He accepted.',
  'Seagulls do not actually own anything. Please tell them. Nobody else will.',
  'The barnacles on the deckhand have formed a small union. They are demanding better barnacle conditions.',
  'Glub sank in a single afternoon, the day the Queen asked the sea for "one minute of peace." The sea is very literal.',
  'Clams are the only creatures in Glub who were not surprised when it sank. They saw it coming. They kept it to themselves.',
  'The drowned choir still sings in Glub, very quietly, about a quarter-tone below hearing. Fish find it soothing.',
  'Eels write letters they never send. The sea floor is covered in them. Most begin "Dear Whom It May Concern, How DARE you."',
  'Queen Brackish was not cruel. She was tired. There is a difference, but you need to be very close to see it.',
  'The Cold Shoulder is the coldest mountain in the world, not because of weather, but because everybody up there is ignoring each other.',
  'Penguins invented passive aggression during a long winter in which nobody wanted to be the first to say anything.',
  'Snow wolves and the Gloomfang line split over a disagreement about whether fire is a valid hobby.',
  'The hermit has written a book called "Leave Me Alone." It has a sequel. You are in it.',
  'The Grudge was once a snowflake that someone stepped on. It never let it go. It never let anything go. It grew.',
  'The High Horse is a real place, a ridge of cloud so high that everyone on it looks down on everyone else.',
  'Cloud sheep are shorn once a year. Their wool makes very soft, very condescending jumpers.',
  'Harpies can explain anything. Accuracy is not part of the service.',
  'The Haughtsworth butler once dusted a lightning bolt. It apologised.',
  'Lord Haughtsworth\'s horse is named Above Average. He is, technically.',
  'Grinhaven used to be called Grimhaven. Saint Grinwell changed one letter and then everything else.',
  'In Grinhaven it is illegal to sigh. The penalty is a hug that lasts until you mean it.',
  'The Mandatory Fun Clown has a family. They are also mandatory.',
  'Big Balloon Bertha was supposed to be in one parade. That was ninety years ago.',
  'Saint Grinwell was once a little boy who cried at a funeral and was told to "cheer up." He took it very, very seriously.',
  'Brendan has a scrapbook of everything you have done, with his own face drawn over yours.',
  'A Sigh Shard is a sigh that was never let out. Kept long enough, it turns to glass. Kept longer, it turns to something heavier.',
  'Frostbeard\'s mittens were found, eventually. In his pocket. He has not forgiven the pocket.',
  'Weathervanes are knights who gave up on having opinions. It is very restful. It is not very brave.',
  'Five Sigh Shards, set in a ring of old tin, make the Crown of Small Sorrows. It is not a crown for ruling. It is a crown for listening.'
];
const SIDE_SHARD = { kelp: 6, frostbeard: 7, vane: 8, chuckles: 9, brendan: 5 }; // Sigh Shard keepers per region
const COMPANIONS = {
  lucien: { name: 'Lucien', title: 'Former Demon Lord (in a bathrobe)', move: 'Withering Sigh', desc: 'Weakens the foe and deals a spiteful 12% of its max HP', col: '#b060ff' },
  honk: { name: 'Sir Honkington', title: 'A Goose of Some Standing', move: 'HONK OF JUDGEMENT', desc: '70% chance to Stagger, always Bleeds', col: '#f0e8d8' },
  pell: { name: 'Sister Pell', title: 'Cheerful Nun (Off-Duty)', move: 'Small Mercy', desc: 'Heals 22% HP, cures statuses, Blesses you', col: '#fff0a0' }
};
const PORT_TALK = {
  lucien: [['Lucien', 'I\'m not here to rule. I\'m here because my bathrobe was the only thing that survived the fortress collapsing.'], ['Lucien', 'Also because Grinwell stole the Bummer, and without it, I can\'t even be properly sad about losing. It\'s exhausting.'], ['Lucien', 'Shout if you need a withering sigh. I have hundreds. Thousands.']],
  honk: [['Sir Honkington', 'HONK.'], ['Sister Pell', 'He says he\'s a knight now. He was knighted by Sir Barnaby. Barnaby knighted himself, so it\'s all a bit circular.'], ['Sir Honkington', 'HONK HONK.'], ['Sister Pell', 'He says it still counts.']],
  pell: [['Sister Pell', 'Hello! I\'m Pell. I was sent from the cathedral to "keep an eye on the former Demon Lord."'], ['Sister Pell', 'He mostly just sighs and drinks tea. Honestly, it\'s quite nice.'], ['Sister Pell', 'If you get hurt, I can patch you up. I\'m not very good at the praying part, but I\'m great at bandages.']],
  board: [['', 'The bounty board is covered in posters. Most are for the same goose. Sir Honkington looks away innocently.']],
  fisher: [['Old Marnie', 'Fishing? Off the end of the pier. Wait for the bob, then hit it right in the middle. Twenty kinds of fish out there, most of \'em depressed.']],
  shop: [['Quartermaster Bev', 'Trinkets, charms, bits of sea-glass with opinions. Gear for heroes who are tired of their gear.']]
};
const BOUNTIES = [
  { id: 'b_crab', name: 'Crab Rangoon', desc: 'Defeat 4 Sulking Crabs', foe: 'crab', n: 4, coins: 120 },
  { id: 'b_gull', name: 'Chip Off the Old Gull', desc: 'Defeat 3 Seagulls of Entitlement', foe: 'gull', n: 3, coins: 140 },
  { id: 'b_ledger', name: 'Write-Off', desc: 'Defeat Captain Ledger', foe: 'ledger', n: 1, coins: 300 },
  { id: 'b_angler', name: 'Lights Out', desc: 'Defeat 3 Lanternfish Lurkers', foe: 'angler', n: 3, coins: 170 },
  { id: 'b_clam', name: 'Open Investigation', desc: 'Defeat 3 Clam Bureaucrats', foe: 'clam', n: 3, coins: 180 },
  { id: 'b_brendan', name: 'WANTED: BRENDAN', desc: 'Defeat Brendan, Your Rival', foe: 'brendan', n: 1, coins: 250 },
  { id: 'b_penguin', name: 'It\'s Fine', desc: 'Defeat 4 Passive-Aggressive Penguins', foe: 'penguin', n: 4, coins: 220 },
  { id: 'b_wolf', name: 'Cold Snap', desc: 'Defeat 3 Snow Wolves', foe: 'swolf', n: 3, coins: 230 },
  { id: 'b_sheep', name: 'Counting Sheep', desc: 'Defeat 5 Cloud Sheep', foe: 'sheep', n: 5, coins: 260 },
  { id: 'b_harpy', name: 'Unsolicited Advice', desc: 'Defeat 3 Condescending Harpies', foe: 'harpy', n: 3, coins: 270 },
  { id: 'b_clown', name: 'Send in the Clowns (Out)', desc: 'Defeat 3 Mandatory Fun Clowns', foe: 'clown', n: 3, coins: 320 },
  { id: 'b_cursed', name: 'Curse Breaker', desc: 'Defeat 5 Cursed foes', foe: '*cursed', n: 5, coins: 400 }
];
const TRINKETS = {
  seaglass: { name: 'Sad Sea-Glass', rar: 0, atk: 1, hp: 4, desc: '+1 ATK, +4 HP' }, barnacle: { name: 'Lucky Barnacle', rar: 0, def: 1, hp: 6, desc: '+1 DEF, +6 HP' },
  pearl: { name: 'Brine Pearl Pendant', rar: 1, atk: 2, hp: 8, desc: '+2 ATK, +8 HP' }, quill: { name: 'Ledger\'s Quill', rar: 1, atk: 3, desc: '+3 ATK' },
  scale: { name: 'Glub Scale Brooch', rar: 1, def: 2, hp: 10, desc: '+2 DEF, +10 HP' }, mitten: { name: 'The Missing Mitten', rar: 2, def: 3, hp: 14, desc: '+3 DEF, +14 HP' },
  plume: { name: 'Haughty Plume', rar: 2, atk: 4, hp: 6, desc: '+4 ATK, +6 HP' }, nose: { name: 'Honest Red Nose', rar: 3, atk: 5, def: 2, hp: 16, desc: '+5 ATK, +2 DEF, +16 HP' }
};
const RARITY = [['Common', '#c8c0b0'], ['Rare', '#6aa8e0'], ['Epic', '#b878f0'], ['Legendary', '#f0b040']];
const FISH = [
  ['Mopey Mackerel', 0, 4], ['Sulky Sprat', 0, 3], ['Gloomy Goby', 0, 4], ['Blue Tang (Literally)', 0, 6], ['Downcast Dab', 0, 5], ['Pouting Pout', 0, 5], ['Brooding Bream', 1, 9], ['Weeping Wrasse', 1, 10],
  ['Melancholy Monkfish', 1, 12], ['Sorry Sole', 1, 8], ['Low Tide Loach', 1, 9], ['Disheartened Herring', 1, 8], ['Lugubrious Lobster', 2, 18], ['Woeful Wahoo', 2, 20], ['Sighing Swordfish', 2, 24],
  ['Crestfallen Cod', 2, 16], ['Forlorn Flounder', 2, 17], ['Tearful Tuna', 3, 32], ['The Ennui Eel', 3, 36], ['Old Grumbly (Legend)', 3, 60]
];
const ACHIEVEMENTS = {
  act1: ['The Demon Lord\'s Bummer', 'Defeat Monarch Lucien'], knock: ['Who\'s There?', 'Answer the knock at the door'], sail: ['Seasick', 'Sail to Port Mopeway'],
  ledger: ['Paid in Full', 'Defeat Captain Ledger'], brackish: ['Shhh', 'Defeat Queen Brackish'], grudge: ['Let It Go', 'Defeat The Grudge'], haughty: ['Down to Earth', 'Knock Lord Haughtsworth off his horse'],
  grinwell: ['Not Fine', 'Defeat Saint Grinwell'], shard1: ['A Small Sorrow', 'Collect a Sigh Shard'], shard5: ['Five Sighs', 'Collect all 5 Sigh Shards'], crown: ['Crown of Small Sorrows', 'Forge the Crown'],
  true: ['Comfort', 'Reach the True Ending'], grin: ['Smile!', 'See the Grin Ending'], bummer: ['Bummed Out', 'See the Bummer Ending'], fish1: ['Gone Fishin\'', 'Catch a fish'], fish10: ['Angler of Ennui', 'Catch 10 different fish'],
  legend: ['Old Grumbly', 'Catch the legendary fish'], cursed: ['Curse Words', 'Defeat a Cursed foe'], bounty: ['Bounty Hunter', 'Claim a bounty'], bounty5: ['Professional', 'Claim 5 bounties'],
  lv20: ['Seasoned', 'Reach level 20'], lv30: ['Veteran of Gloom', 'Reach level 30'], lv40: ['Maximum Bummer', 'Reach level 40'], perk: ['Specialist', 'Spend 5 perk points'], perkmax: ['Mastery', 'Max out a perk branch'],
  lore10: ['Reader', 'Find 10 lore pages'], lore30: ['Archivist of Sorrows', 'Find all 30 lore pages'], assist: ['Teamwork', 'Use a companion assist'], brendan: ['Rivalry Settled', 'Defeat Brendan'], trinket: ['Shiny', 'Equip a Legendary trinket']
};
