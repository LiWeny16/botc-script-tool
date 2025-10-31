import type { Character } from '../types';

export const getLoricCharacters = (language: string): Character[] => {
    const isEnglish = language === 'en';

    return [
        {
            id: 'gardener_loric',
            name: isEnglish ? 'Gardener' : '园丁',
            ability: isEnglish ? "The Storyteller assigns 1 or more players' characters." : "由说书人来为一名或更多玩家派发角色。",
            team: 'loric',
            image: '/imgs/icons/Loric/gardener.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: [],
            setup: false,
        },
        {
            id: 'tor_loric',
            name: isEnglish ? 'Tor' : '黄昏',
            ability: isEnglish ? "Players don't know their character or alignment. They learn them after they die." : "玩家不知道他们的角色或阵营。他们会在死后得知。",
            team: 'loric',
            image: '/imgs/icons/Loric/tor.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: [],
            setup: false,
        },
        {
            id: 'stormcatcher_loric',
            name: isEnglish ? 'Storm Catcher' : '暴风捕手',
            ability: isEnglish ? "Name a good character. If in play, they can only die by execution, but evil players learn which player it is." : "游戏开始时，你要宣布一个善良角色。如果该角色在场，他只能死于处决，但所有邪恶玩家会在首个夜晚得知他是哪一名玩家。",
            team: 'loric',
            image: '/imgs/icons/Loric/stormcatcher.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: isEnglish ? ['Protected'] : ['保护'],
            setup: false,
        },
        {
            id: 'bigwig_loric',
            name: isEnglish ? 'Big Wig' : '大假发',
            ability: isEnglish ? "Each nominee chooses a player: until voting, only they may speak & they are mad the nominee is good or they might die." : "每名被提名者选择一名玩家：直到投票前，只有他们可以发言，并且他们要疯狂地认为被提名者是善良的，否则他们可能会死亡。",
            team: 'loric',
            image: '/imgs/icons/Loric/bigwig.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: isEnglish ? ['Nominee', 'Speaker'] : ['被提名者', '发言人'],
            setup: false,
        },
        {
            id: 'bootlegger_loric',
            name: isEnglish ? 'Bootlegger' : '私货商人',
            ability: isEnglish ? "This script has homebrew characters or rules." : "这个剧本包含有自制角色或自制规则。",
            team: 'loric',
            image: '/imgs/icons/Loric/bootlegger.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: [],
            setup: false,
        },
    ];
};

