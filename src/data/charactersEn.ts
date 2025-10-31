import rolesData from './roles.json';
import { normalizeCharacterId } from './characterIdMapping';

// 从 roles.json 创建英文角色字典
const _charactersEn: Record<string, any> = {};

rolesData.forEach((role: any) => {
  // 获取中文格式的ID用于图片URL（所有图片都使用中文ID格式，即带下划线的格式）
  const imageId = normalizeCharacterId(role.id, 'zh-CN');

  _charactersEn[role.id] = {
    id: role.id,
    name: role.name || role.id,
    edition: role.edition || 'custom',
    team: role.team,
    ability: role.ability || '',
    firstNight: role.firstNight || 0,
    otherNight: role.otherNight || 0,
    firstNightReminder: role.firstNightReminder || '',
    otherNightReminder: role.otherNightReminder || '',
    reminders: role.reminders || [],
    remindersGlobal: role.remindersGlobal || [],
    setup: role.setup || false,
    // 优先使用 roles.json 中定义的 image，否则使用中文ID格式生成默认图片链接
    // 所有图片都使用中文ID规范（带下划线），如 fortune_teller.png, no_dashii.png
    image: role.image || `https://oss.gstonegames.com/data_file/clocktower/web/icons/${imageId}.png`,
  };
});

// 导入传奇角色
import { getFabledCharacters } from './fabled';

// 将传奇角色整合到角色字典中
const fabledCharacters = getFabledCharacters('en');
const fabledDict = fabledCharacters.reduce((acc, char) => {
  acc[char.id] = char;
  return acc;
}, {} as any);
const custom_characters_en = {
  "pagan": {
    "name": "Pagan",
    "ability": "If the Heretic is in play, all other good Townsfolk become Pagans and learn who the evil players are and their roles. [+Heretic or -1 Outsider]",
    "image": "https://www.bloodstar.xyz/p/Airell_clocktower/Assets_of_Lei_Gallery/pagan_assets_of_lei_gallery.png",
    "id": "pagan",
    "team": "townsfolk",
    "author": "Zets",
    "firstNight": 200,
    "otherNight": 0,
    "firstNightReminder": "If both the Pagan and Heretic are in play, wake all good Townsfolk and inform them they have all become Pagans.",
    "otherNightReminder": "",
    "reminders": [],
    "setup": true
  },
  "martyr": {
    "name": "Martyr Girl",
    "author": "飞跃疯人院",
    "ability": "If a Minion dies by execution, you die tonight. Then, all evil players are drunk until dusk tomorrow.",
    "image": "https://www.bloodstar.xyz/p/humlet/FRY7-9/78_fry79.png",
    "id": "martyr",
    "team": "townsfolk",
    "firstNight": 0,
    "otherNight": 0,
    "otherNightReminder": "If a Minion died by execution today, and the Martyr Girl can die tonight due to their ability, place the 'Martyr' and 'Dead' reminders by the Martyr Girl, indicating all evil players are drunk until dusk tomorrow.",
    "reminders": [
      "Martyr",
      "Dead"
    ]
  },
  "snowman": {
    "author": "飞跃疯人院",
    "name": "Snowman",
    "ability": "Once per game, the Demon may publicly guess you are the Snowman. If correct, you are executed instead of them if they are executed today. If no one is executed during the day, your team loses.",
    "image": "https://www.bloodstar.xyz/p/humlet/FRY7-9/_fry79.png",
    "id": "snowman",
    "team": "outsider",
    "firstNight": 0,
    "otherNight": 0,
    "reminders": [
      "Guessed",
      "Guessed Correctly"
    ]
  },
  "wandering_singer": {
    "author": "飞跃疯人院",
    "name": "Wandering Singer",
    "ability": "Each day, you may publicly choose any number of alive players: the Townsfolk among them are drunk until you choose again. Tonight, you learn how many players are drunk because of you.",
    "image": "https://www.bloodstar.xyz/p/humlet/FRY7-9/4_fry79.png",
    "id": "wandering_singer",
    "team": "townsfolk",
    "firstNight": 0,
    "otherNight": 0,
    "otherNightReminder": "If the Wandering Singer made a public choice during the day, wake them and tell them the number of players currently drunk due to them.",
    "reminders": [
      "Drunk"
    ]
  },
  "newspaper_boy": {
    "author": "飞跃疯人院",
    "name": "Newspaper Boy",
    "ability": "Each day, you may privately ask the Storyteller for a piece of 'news'. If you publicly announce this 'news', tonight you learn if it was correct.",
    "image": "https://www.bloodstar.xyz/p/humlet/FRY7-9/58_fry79.png",
    "id": "newspaper_boy",
    "team": "townsfolk",
    "firstNight": 0,
    "otherNight": 0,
    "otherNightReminder": "Learn if correct or not",
    "reminders": [
      "True News",
      "False News"
    ]
  },
  "genius": {
    "id": "genius",
    "name": "Genius",
    "ability": "Each night, you may choose a good player: you gain their ability until you choose again. You are drunk on either odd or even nights.",
    "team": "townsfolk",
    "image": "https://botc.letshare.fun/imgs/icons/townsfolk/genius.png",
    "author": "摸鱼学徒",
    "firstNight": 3,
    "otherNight": 2,
    "firstNightReminder": "",
    "otherNightReminder": "",
    "reminders": [
      "Gained Ability",
      "Drunk"
    ],
    "setup": false
  },
  "nun": {
    "id": "nun",
    "name": "Nun",
    "ability": "Good Townsfolk players cannot be drunk, poisoned, or learn false information.",
    "team": "townsfolk",
    "image": "https://botc.letshare.fun/imgs/icons/townsfolk/nun.png",
    "author": "摸鱼学徒",
    "firstNight": 0,
    "otherNight": 0,
    "firstNightReminder": "",
    "otherNightReminder": "",
    "reminders": [
      "Not Drunk",
      "Not Poisoned",
      "No False Info"
    ],
    "setup": false
  },
  "meishuguanzhang": {
    "id": "meishuguanzhang",
    "name": "Museum Curator",
    "ability": "Each night*, you must choose a player: if they agree, you learn their sanity status, but their sanity status might change.",
    "team": "traveler",
    "image": "/imgs/icons/血染德扑/insanity.png",
    "author": "Soup1618",
    "firstNight": 1,
    "otherNight": 1,
    "firstNightReminder": "",
    "otherNightReminder": "",
    "reminders": [
      "Insane",
      "Sane"
    ],
    "setup": false
  },
  "trade_dealer": {
    "id": "trade_dealer",
    "name": "Trade Dealer",
    "ability": "Each night, you learn what will happen tomorrow when the phone rings and is answered. The person who answers also knows. What happens might break the rules.",
    "team": "traveler",
    "image": "https://botc.letshare.fun/imgs/icons/血染德扑/经销商.png",
    "firstNight": 1,
    "otherNight": 1,
    "author": "Luis",
    "reminders": [
      "Phone Call"
    ],
    "setup": false
  },
  "disappointed": {
    "id": "disappointed",
    "edition": "custom",
    "image": "https://youke1.picui.cn/s1/2025/10/11/68e95986b417e.png",
    "name": "Disappointed",
    "ability": "You think you are a Minion, but you are not.",
    "author": "Moll",
    "team": "outsider",
    "firstNight": 5,
    "otherNight": 5,
    "setup": false,
    "firstNightReminder": "",
    "otherNightReminder": "",
    "reminders": [
      "Is Disappointed"
    ]
  },
  "jiutoushe": {
    "id": "jiutoushe",
    "name": "Hydra",
    "ability": "When a player on your team dies, a player on your team might be resurrected.",
    "team": "traveler",
    "author": "Hazel",
    "image": "https://botc.letshare.fun/imgs/icons/血染德扑/九头蛇.png",
    "firstNight": 0,
    "otherNight": 0,
    "firstNightReminder": "",
    "otherNightReminder": "",
    "reminders": [],
    "setup": false
  },
  "drugster": {
    "id": "drugster",
    "name": "Drugster",
    "ability": "You think you are a good player in play, but you are not. The player who has this role knows the Drugster is in play. If one of you 'madly' proves the Drugster is in play, you both might die.",
    "team": "traveler",
    "author": "Mar Hepto",
    "image": "https://botc.letshare.fun/imgs/icons/血染德扑/瘾君子.png",
    "firstNight": 0,
    "otherNight": 63,
    "firstNightReminder": "",
    "otherNightReminder": "",
    "reminders": [
      "Is Drugster"
    ],
    "setup": true
  },
  "wanou": {
    "id": "wanou",
    "name": "Doll",
    "author": "飞跃疯人院",
    "ability": "You think you are a good character, but you are not. If you are killed by the Demon, the Demon must choose a player: they become the Doll. [The Doll sits next to the Demon]",
    "image": "https://www.bloodstar.xyz/p/humlet/FRY7-9/65_fry79.png",
    "team": "minion",
    "firstNight": 0,
    "otherNight": 0,
    "otherNightReminder": "If the Demon killed the Doll, remind the Demon to choose a new Doll.",
    "remindersGlobal": [
      "New Doll",
      "Original Doll"
    ],
    "setup": 1
  },
  "qimo": {
    "id": "qimo",
    "name": "Contract Demon",
    "ability": "Each night*, you may choose two alive players to form a death pact. If one of them dies for any reason, the other dies too. [+1 Outsider]",
    "team": "demon",
    "image": "https://botc.letshare.fun/imgs/icons/血染德扑/契魔.png",
    "firstNight": 0,
    "otherNight": 41,
    "author": "摸鱼学徒",
    "firstNightReminder": "",
    "otherNightReminder": "Wake the Contract Demon. They choose two players. Mark them with 'Linked'. At the start of the day, publicly announce these two players are linked.",
    "reminders": [
      "Linked"
    ],
    "setup": false
  },
  "risen": {
    "id": "risen",
    "name": "Risen",
    "ability": "All players start dead. Executed players are resurrected. If all players of a team are alive, that team wins.",
    "team": "demon",
    "image": "https://botc.letshare.fun/imgs/icons/demon/the_risen.png",
    "firstNight": 0,
    "otherNight": 41.5,
    "author": "摸鱼学徒",
    "firstNightReminder": "",
    "reminders": [
      "Linked"
    ],
    "setup": false
  },
  "virilus": {
    "id": "virilus",
    "name": "Virilus",
    "ability": "Each night, you must choose a player: they are infected by you. If an infected player nominates, they die, and the nominated player becomes infected. At the end of the fourth day, the evil team wins.",
    "team": "demon",
    "image": "https://botc.letshare.fun/imgs/icons/demon/virilus.png",
    "firstNight": 0,
    "otherNight": 42.1,
    "author": "Lei.",
    "firstNightReminder": "",
    "reminders": [
      "Linked"
    ],
    "setup": false
  },
  "kaixinhou": {
    "name": "Happy Monkey",
    "ability": "If there are evil players alive, you can not die. All players know you are the Happy Monkey. You can publicly choose a player to play roshambo with you each day. If you win, they die.",
    "image": "https://free.picui.cn/free/2025/09/21/68d0091d5b270.png",
    "id": "kaixinhou",
    "team": "demon",
    "author": "祥东&小赤",
    "firstNight": 128001,
    "otherNight": 0,
    "firstNightReminder": "Tell all players he is the Happy Monkey.",
    "otherNightReminder": "",
    "reminders": [
      "Not Dead",
      "Dead",
      "First Time",
      "Second Time",
      "Third Time"
    ],
    "remindersGlobal": [],
    "setup": false
  },
  "day_dreamer": {
    "name": "Day Dreamer",
    "ability": `Your ability is if…, then…. At your first day, visit the Storyteller and tell them "then". The Storyteller will tell you the "if" of your ability.`,
    "image": "https://www.bloodstar.xyz/p/Drus/5GMXJ/_5gmxj.png",
    "author": "阿源",
    "id": "day_dreamer",
    "team": "townsfolk",
    "firstNight": 0,
    "otherNight": 0,
    "reminders": [
      "Drunk"
    ]
  },
  "lost_dreamer": {
    "name": "Lost Dreamer",
    "ability": `Your ability is if…, then…. At your first day, visit the Storyteller and tell them "if". The Storyteller will tell you the "then" of your ability.`,
    "image": "https://www.bloodstar.xyz/p/Drus/5GMXJ/1_5gmxj.png",
    "id": "lost_dreamer",
    "author": "阿源",
    "team": "outsider",
    "firstNight": 0,
    "otherNight": 0,
    "reminders": [
      "Drunk"
    ]
  },
  "gold_dreamer": {
    "name": "Gold Dreamer",
    "ability": `Your "if" is easier. Your ability is if…, then…. At your first day, visit the Storyteller and tell them "then". The Storyteller will tell you the "if" of your ability.`,
    "image": "https://www.bloodstar.xyz/p/Drus/5GMXJ/2_5gmxj.png",
    "id": "gold_dreamer",
    "team": "minion",
    "author": "阿源",
    "firstNight": 0,
    "otherNight": 0,
    "reminders": [
      "Poisoned"
    ]
  },
  "kill_dreamer": {
    "name": "Kill Dreamer",
    "ability": `Each night*, choose a player: they die. Your ability is if…, then…. At your first day, visit the Storyteller and tell them "then". The Storyteller will tell you the "if" of your ability.`,
    "image": "https://www.bloodstar.xyz/p/Drus/5GMXJ/3_5gmxj.png",
    "id": "kill_dreamer",
    "author": "阿源",
    "team": "demon",
    "firstNight": 0,
    "otherNight": 0,
    "reminders": [
      "Poisoned",
      "Dead"
    ]
  },
  "yuan": {
    "name": "Yuan",
    "ability": `Each night*, you must choose a player: they die. If you publicly declare "I'm framed!" (except the last day), after you are executed, privately choose a player who voted for you. He will become the evil Yuan, but only one successful conversion can be made per game. [-1 Outsider]`,
    "image": "https://oss.gstonegames.com/data_file/clocktower/role_icon/custom/d_8539280695861_536321d6.jpg",
    "id": "yuan",
    "author": "驯鹿&痴愚",
    "team": "demon",
    "firstNight": 0,
    "otherNight": 100,
    "firstNightReminder": "",
    "otherNightReminder": "",
    "reminders": [
      "Dead",
      "Framed"
    ],
    "remindersGlobal": [],
    "setup": 1
  },
  "apocalypse": {
    "name": "Apocalypse Caller",
    "ability": "Once per game, at the start of the day, if there are four or fewer players alive, you may privately visit the Storyteller to view the Book of Apocalypse for twenty seconds.",
    "image": "https://i.postimg.cc/VNYbv7sL/tianqi.png",
    "id": "apocalypse",
    "team": "townsfolk",
    "firstNight": 0,
    "otherNight": 0,
    "firstNightReminder": "",
    "otherNightReminder": "",
    "reminders": [],
    "remindersGlobal": [],
    "setup": 0
  },
  "nailong": {
    "name": "Nailong",
    "ability": `You can go crazy about "I'm Nailong". If you do this, and another player goes crazy about "I'm Nailong", he may become Nailong until the next dawn.`,
    "image": "https://i.postimg.cc/SNd02vMs/nailong.webp",
    "id": "nailong",
    "team": "traveler",
    "author": "星火乐",
    "firstNight": 0,
    "otherNight": 0,
    "firstNightReminder": "",
    "otherNightReminder": "",
    "reminders": [
      "I'm Nailong",
      "I'm not Nailong"
    ],
    "setup": false
  }
}
export const CHARACTERS_EN: any = { ..._charactersEn, ...custom_characters_en, ...fabledDict };

