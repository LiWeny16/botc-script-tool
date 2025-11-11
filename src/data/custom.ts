import type { Character } from '../types';

export const getCustomCharacters = (language: string): Character[] => {
  const isEnglish = language === 'en';

  return [
    {
      id: 'pagan',
      name: isEnglish ? 'Pagan' : '异教徒',
      ability: isEnglish 
        ? "If the Heretic is in play, all other good Townsfolk become Pagans and learn who the evil players are and their roles. [+Heretic or -1 Outsider]"
        : "如果异端分子在场，所有其他善良镇民变为异教徒，并且得知邪恶玩家是谁及他们的角色。[+异端分子或-1外来者]",
      team: 'townsfolk',
      image: 'https://botc.letshare.fun/imgs/icons/townsfolk/pagan.png',
      author: 'Zets',
      firstNight: 200,
      otherNight: 0,
      firstNightReminder: isEnglish
        ? "If both the Pagan and Heretic are in play, wake all good Townsfolk and inform them they have all become Pagans."
        : "如果异教徒和异端分子都在场，唤醒所有善良的镇民，并告知他们都成为了异教徒。",
      otherNightReminder: '',
      reminders: [],
      setup: true,
    },
    {
      id: 'martyr',
      name: isEnglish ? 'Martyr Girl' : '殉教少女',
      ability: isEnglish
        ? "If a Minion dies by execution, you die tonight. Then, all evil players are drunk until dusk tomorrow."
        : "如果爪牙死于处决，当晚你会死亡，随后所有邪恶角色醉酒直到明天黄昏。",
      team: 'townsfolk',
      image: 'https://botc.letshare.fun/imgs/icons/townsfolk/martyr.png',
      author: '飞跃疯人院',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: isEnglish
        ? "If a Minion died by execution today, and the Martyr Girl can die tonight due to their ability, place the 'Martyr' and 'Dead' reminders by the Martyr Girl, indicating all evil players are drunk until dusk tomorrow."
        : '如果当天一名爪牙死于处决，且当晚殉教少女能够因为自身能力死亡，将"殉教"与"死亡"提示标记放置在殉教少女旁，代表所有邪恶角色醉酒直到明天黄昏。',
      reminders: isEnglish ? ['Martyr', 'Dead'] : ['殉教', '死亡'],
      setup: false,
    },
    {
      id: 'snowman',
      name: isEnglish ? 'Snowman' : '雪人',
      ability: isEnglish
        ? "Once per game, the Demon may publicly guess you are the Snowman. If correct, you are executed instead of them if they are executed today. If no one is executed during the day, your team loses."
        : "每局游戏限一次，恶魔可以公开猜测你是雪人，如果猜中，当天他被处决时你会代替他被处决。如果白天没人被处决，你的阵营落败。",
      team: 'outsider',
      image: 'https://botc.letshare.fun/imgs/icons/outsider/snowman.png',
      author: '飞跃疯人院',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Guessed', 'Guessed Correctly'] : ['已被猜测', '被猜中'],
      setup: false,
    },
    {
      id: 'wandering_singer',
      name: isEnglish ? 'Wandering Singer' : '游歌者',
      ability: isEnglish
        ? "Each day, you may publicly choose any number of alive players: the Townsfolk among them are drunk until you choose again. Tonight, you learn how many players are drunk because of you."
        : "每个白天，你可以公开选择任意名存活玩家：其中的镇民会醉酒直到你再次选择。当晚你会得知正因你醉酒的人数。",
      team: 'townsfolk',
      image: 'https://botc.letshare.fun/imgs/icons/townsfolk/wandering_singer.png',
      author: '飞跃疯人院',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: isEnglish
        ? "If the Wandering Singer made a public choice during the day, wake them and tell them the number of players currently drunk due to them."
        : "如果游歌者在白天公开选择了，唤醒并告知他此刻场上因他醉酒的人数。",
      reminders: isEnglish ? ['Drunk'] : ['醉酒'],
      setup: false,
    },
    {
      id: 'newspaper_boy',
      name: isEnglish ? 'Newspaper Boy' : '送报童',
      ability: isEnglish
        ? "Each day, you may privately ask the Storyteller for a piece of 'news'. If you publicly announce this 'news', tonight you learn if it was correct."
        : '每个白天，你可以私下询问说书人以得知一条"新闻"，如果你公开宣读了该"新闻"，当天晚上你会得知它是否正确。',
      team: 'townsfolk',
      image: 'https://botc.letshare.fun/imgs/icons/townsfolk/newspaper_boy.png',
      author: '飞跃疯人院',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: isEnglish ? 'Learn if correct or not' : '得知正确与否',
      reminders: isEnglish ? ['True News', 'False News'] : ['真新闻', '假新闻'],
      setup: false,
    },
    {
      id: 'genius',
      name: isEnglish ? 'Genius' : '天才',
      ability: isEnglish
        ? "Each night, you may choose a good player: you gain their ability until you choose again. You are drunk on either odd or even nights."
        : "每个夜晚，你可以选择一个善良角色：你获得该角色的能力，直到你下次选择。你每个奇数或偶数夜晚醉酒。",
      team: 'townsfolk',
      image: 'https://botc.letshare.fun/imgs/icons/townsfolk/genius.png',
      author: '摸鱼学徒',
      firstNight: 3,
      otherNight: 2,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Gained Ability', 'Drunk'] : ['获得能力', '醉酒'],
      setup: false,
    },
    {
      id: 'nun',
      name: isEnglish ? 'Nun' : '修女',
      ability: isEnglish
        ? "Good Townsfolk players cannot be drunk, poisoned, or learn false information."
        : "善良的镇民玩家不会醉酒、中毒或得知错误信息。",
      team: 'townsfolk',
      image: 'https://botc.letshare.fun/imgs/icons/townsfolk/nun.png',
      author: '摸鱼学徒',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Not Drunk', 'Not Poisoned', 'No False Info'] : ['不会醉酒', '不会中毒', '不会得知错误信息'],
      setup: false,
    },
    {
      id: 'meishuguanzhang',
      name: isEnglish ? 'Museum Curator' : '美术馆长',
      ability: isEnglish
        ? "Each night*, you must choose a player: if they agree, you learn their sanity status, but their sanity status might change."
        : "每个夜晚*，你要选择一名玩家：如果他同意，你得知他的精神状态，但他的精神状态可能发生改变。",
      team: 'traveler',
      image: 'https://botc.letshare.fun/imgs/icons/traveler/meishuguanzhang.png',
      author: 'Soup1618',
      firstNight: 1,
      otherNight: 1,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Insane', 'Sane'] : ['精神状态不佳', '精神状态良好'],
      setup: false,
    },
    {
      id: 'trade_dealer',
      name: isEnglish ? 'Trade Dealer' : '经销商',
      ability: isEnglish
        ? "Each night, you learn what will happen tomorrow when the phone rings and is answered. The person who answers also knows. What happens might break the rules."
        : "每个夜晚，你会得知明天当电话铃响后接听电话后会发生什么，接听电话的人也会知道会发生什么，发生的事情可能会打破规则。",
      team: 'traveler',
      image: 'https://botc.letshare.fun/imgs/icons/traveler/trade_dealer.png',
      author: 'Luis',
      firstNight: 1,
      otherNight: 1,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Phone Call'] : ['电话来了'],
      setup: false,
    },
    {
      id: 'disappointed',
      name: isEnglish ? 'Disappointed' : '失望',
      ability: isEnglish
        ? "You think you are a Minion, but you are not."
        : "你以为你是一个爪牙，但其实你不是。",
      team: 'outsider',
      image: 'https://botc.letshare.fun/imgs/icons/outsider/disappointed.png',
      author: 'Moll',
      firstNight: 5,
      otherNight: 5,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Is Disappointed'] : ['是失望'],
      setup: false,
    },
    {
      id: 'jiutoushe',
      name: isEnglish ? 'Hydra' : '九头蛇',
      ability: isEnglish
        ? "When a player on your team dies, a player on your team might be resurrected."
        : "当与你同阵营的一名玩家死亡时，可能有一名同阵营玩家复活。",
      team: 'traveler',
      image: 'https://botc.letshare.fun/imgs/icons/traveler/jiutoushe.png',
      author: 'Hazel',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: [],
      setup: false,
    },
    {
      id: 'drugster',
      name: isEnglish ? 'Drugster' : '瘾君子',
      ability: isEnglish
        ? "You think you are a good player in play, but you are not. The player who has this role knows the Drugster is in play. If one of you 'madly' proves the Drugster is in play, you both might die."
        : '你以为你是一个在场的善良玩家，但其实你不是。该角色的玩家会知道瘾君子在场。如果你们之中其中一人"疯狂"证明瘾君子在场，你们可能都会死亡。',
      team: 'traveler',
      image: 'https://botc.letshare.fun/imgs/icons/traveler/drugster.png',
      author: 'Mar Hepto',
      firstNight: 0,
      otherNight: 63,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Is Drugster'] : ['是瘾君子'],
      setup: true,
    },
    {
      id: 'wanou',
      name: isEnglish ? 'Doll' : '玩偶',
      ability: isEnglish
        ? "You think you are a good character, but you are not. If you are killed by the Demon, the Demon must choose a player: they become the Doll. [The Doll sits next to the Demon]"
        : "你以为你是一个善良角色，但其实你不是。如果你被恶魔杀死，恶魔要选择一名玩家：他变成玩偶。[玩偶会与恶魔邻座]",
      team: 'minion',
      image: 'https://botc.letshare.fun/imgs/icons/minion/wanou.png',
      author: '飞跃疯人院',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: isEnglish
        ? "If the Demon killed the Doll, remind the Demon to choose a new Doll."
        : "如果恶魔杀死了玩偶，提醒恶魔选择一名新的玩偶。",
      remindersGlobal: isEnglish ? ['New Doll', 'Original Doll'] : ['新玩偶', '初始玩偶'],
      setup: true,
    },
    {
      id: 'qimo',
      name: isEnglish ? 'Contract Demon' : '契魔',
      ability: isEnglish
        ? "Each night*, you may choose two alive players to form a death pact. If one of them dies for any reason, the other dies too. [+1 Outsider]"
        : "每个夜晚*，你可以选择两名存活玩家签订死亡契约。如果他们中的一人因任何原因死亡，另一人也会随之一同死亡。[+1外来者]",
      team: 'demon',
      image: 'https://botc.letshare.fun/imgs/icons/demon/qimo.png',
      author: '摸鱼学徒',
      firstNight: 0,
      otherNight: 41,
      firstNightReminder: '',
      otherNightReminder: isEnglish
        ? "Wake the Contract Demon. They choose two players. Mark them with 'Linked'. At the start of the day, publicly announce these two players are linked."
        : '唤醒契魔，让他选择两名玩家。用"链接"标记他们。白天开始时，公开宣布这两名玩家被链接。',
      reminders: isEnglish ? ['Linked'] : ['链接'],
      setup: false,
    },
    {
      id: 'risen',
      name: isEnglish ? 'Risen' : '魂归者',
      ability: isEnglish
        ? "All players start dead. Executed players are resurrected. If all players of a team are alive, that team wins."
        : "所有玩家初始都已死亡。被处决的玩家会复活。如果某个阵营的所有玩家都存活，该阵营获胜。",
      team: 'demon',
      image: 'https://botc.letshare.fun/imgs/icons/demon/risen.png',
      author: '摸鱼学徒',
      firstNight: 0,
      otherNight: 41.5,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Linked'] : ['链接'],
      setup: false,
    },
    {
      id: 'virilus',
      name: isEnglish ? 'Virilus' : '活体病毒',
      ability: isEnglish
        ? "Each night, you must choose a player: they are infected by you. If an infected player nominates, they die, and the nominated player becomes infected. At the end of the fourth day, the evil team wins."
        : "每个夜晚，你要选择一名玩家：他被你感染。如果被感染的玩家发起提名，他死亡并感染被提名的玩家。在第四个白天结束时，邪恶阵营获胜。",
      team: 'demon',
      image: 'https://botc.letshare.fun/imgs/icons/demon/virilus.png',
      author: 'Lei.',
      firstNight: 0,
      otherNight: 42.1,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Linked'] : ['链接'],
      setup: false,
    },
    {
      id: 'kaixinhou',
      name: isEnglish ? 'Happy Monkey' : '开心猴',
      ability: isEnglish
        ? "If there are evil players alive, you can not die. All players know you are the Happy Monkey. You can publicly choose a player to play roshambo with you each day. If you win, they die."
        : "如果场上有爪牙存活，你不会死亡，所有玩家知道你是开心猴。每个白天限3次，你可以在提名开始前公开选择一名玩家与他猜拳，如果你获胜，他死亡。",
      team: 'demon',
      image: 'https://botc.letshare.fun/imgs/icons/demon/kaixinhou.png',
      author: '祥东&小赤',
      firstNight: 128001,
      otherNight: 0,
      firstNightReminder: isEnglish
        ? "Tell all players he is the Happy Monkey."
        : "告诉所有人他是开心猴。",
      otherNightReminder: '',
      reminders: isEnglish ? ['Not Dead', 'Dead', 'First Time', 'Second Time', 'Third Time'] : ['不会死亡', '死亡', '第一次', '第二次', '第三次'],
      remindersGlobal: [],
      setup: false,
    },
    {
      id: 'day_dreamer',
      name: isEnglish ? 'Day Dreamer' : '白日梦想家',
      ability: isEnglish
        ? `Your ability is if…, then…. At your first day, visit the Storyteller and tell them "then". The Storyteller will tell you the "if" of your ability.`
        : '你的能力是如果…，那么…。在你的首个白天拜访并告知说书人"那么"，说书人会告知你能力的"如果"。',
      team: 'townsfolk',
      image: 'https://botc.letshare.fun/imgs/icons/townsfolk/day_dreamer.png',
      author: '阿源',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Drunk'] : ['醉酒'],
      setup: false,
    },
    {
      id: 'lost_dreamer',
      name: isEnglish ? 'Lost Dreamer' : '失去梦想家',
      ability: isEnglish
        ? `Your ability is if…, then…. At your first day, visit the Storyteller and tell them "if". The Storyteller will tell you the "then" of your ability.`
        : '你的能力是如果…，那么…。在你的首个白天拜访并告知说书人"如果"，说书人会告知你能力的"那么"。',
      team: 'outsider',
      image: 'https://botc.letshare.fun/imgs/icons/outsider/lost_dreamer.png',
      author: '阿源',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Drunk'] : ['醉酒'],
      setup: false,
    },
    {
      id: 'gold_dreamer',
      name: isEnglish ? 'Gold Dreamer' : '氪金梦想家',
      ability: isEnglish
        ? `Your "if" is easier. Your ability is if…, then…. At your first day, visit the Storyteller and tell them "then". The Storyteller will tell you the "if" of your ability.`
        : '你的"如果"会更加容易。 你的能力是如果…，那么…。在你的首个白天拜访并告知说书人"那么"，说书人会告知你能力的"如果"。',
      team: 'minion',
      image: 'https://botc.letshare.fun/imgs/icons/minion/gold_dreamer.png',
      author: '阿源',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Poisoned'] : ['中毒'],
      setup: false,
    },
    {
      id: 'kill_dreamer',
      name: isEnglish ? 'Kill Dreamer' : '扼杀梦想家',
      ability: isEnglish
        ? `Each night*, choose a player: they die. Your ability is if…, then…. At your first day, visit the Storyteller and tell them "then". The Storyteller will tell you the "if" of your ability.`
        : '每个夜晚*，选择一名玩家：他死亡。 你的能力是如果…，那么…。在你的首个白天拜访并告知说书人"那么"，说书人会告知你能力的"如果"。',
      team: 'demon',
      image: 'https://botc.letshare.fun/imgs/icons/demon/kill_dreamer.png',
      author: '阿源',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Poisoned', 'Dead'] : ['中毒', '死亡'],
      setup: false,
    },
    {
      id: 'yuan',
      name: isEnglish ? 'Yuan' : '冤',
      ability: isEnglish
        ? `Each night*, you must choose a player: they die. If you publicly declare "I'm framed!" (except the last day), after you are executed, privately choose a player who voted for you. He will become the evil Yuan, but only one successful conversion can be made per game. [-1 Outsider]`
        : "每个夜晚*，你要选择一名玩家:他死亡。如果你在被提名后公开声明我冤呐（最后一天除外），在你死于处决后私下选择一名给你投票的玩家，他会变成邪恶的冤，但每局游戏仅能成功转化一次。[-1外来者]",
      team: 'demon',
      image: 'https://botc.letshare.fun/imgs/icons/demon/yuan.png',
      author: '驯鹿&痴愚',
      firstNight: 0,
      otherNight: 100,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ['Dead', 'Framed'] : ['死亡', '冤呐'],
      remindersGlobal: [],
      setup: true,
    },
    {
      id: 'apocalypse',
      name: isEnglish ? 'Apocalypse Caller' : '天启召唤者',
      ability: isEnglish
        ? "Once per game, at the start of the day, if there are four or fewer players alive, you may privately visit the Storyteller to view the Book of Apocalypse for twenty seconds."
        : "每局游戏限一次，在白天时，如果只有四名或更少的玩家存活，你可以私下拜访说书人以查看魔典二十秒。",
      team: 'townsfolk',
      image: 'https://botc.letshare.fun/imgs/icons/townsfolk/apocalypse.png',
      author: '',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: [],
      remindersGlobal: [],
      setup: false,
    },
    {
      id: 'nailong',
      name: isEnglish ? 'Nailong' : '奶龙',
      ability: isEnglish
        ? `You can go crazy about "I'm Nailong". If you do this, and another player goes crazy about "I'm Nailong", he may become Nailong until the next dawn.`
        : '你可以对"你是奶龙"疯狂，如果你这样做，且有其他玩家对"自己是奶龙"疯狂，他有可能变成奶龙直至下个黎明',
      team: 'traveler',
      image: 'https://botc.letshare.fun/imgs/icons/traveler/nailong.png',
      author: '星火乐',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: isEnglish ? ["I'm Nailong", "I'm not Nailong"] : ['我是奶龙', '我才是奶龙'],
      setup: false,
    },
    {
      id: 'pumpkin',
      name: isEnglish ? 'Pumpkin' : '南瓜',
      ability: isEnglish
        ? `Players who are "spooky" might survive execution be safe from the Demon.`
        : '足够"吓人"的玩家可能不会死于处决且恶魔的负面能力对他无效。',
      team: 'townsfolk',
      image: 'https://botc.letshare.fun/imgs/icons/townsfolk/pumpkin.png',
      author: isEnglish ? 'Halloween Only🎃' : '万圣节特别角色',
      firstNight: 0,
      otherNight: 0,
      firstNightReminder: '',
      otherNightReminder: '',
      reminders: [],
      setup: false,
    },
  ];
};

