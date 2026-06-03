// 角色别名表 — 中英文昵称/简称/口语变体 → 官方英文ID
// 用于 Agent 搜索工具和 UI 快捷搜索的模糊匹配
// 维护规则：别名用全小写（英文）或原始中文，不要包含特殊字符

export interface AliasEntry {
  /** 英文别名（简称、昵称、缩写、常见笔误）— 全小写 */
  en: string[];
  /** 中文别名（口语变体、简称、常见错别字） */
  cn: string[];
}

export const CHARACTER_ALIASES: Record<string, AliasEntry> = {
  // ── 镇民 ──
  'washerwoman': {
    en: ['washer', 'ww'],
    cn: ['洗衣妇', '洗衣女'],
  },
  'investigator': {
    en: ['invest', 'inv'],
    cn: ['侦查员', '侦探'],
  },
  'chef': {
    en: [],
    cn: ['大厨'],
  },
  'empath': {
    en: ['emp'],
    cn: ['共情者', '读心者'],
  },
  'fortuneteller': {
    en: ['fortune teller', 'ft'],
    cn: ['占卜者', '占卜'],
  },
  'undertaker': {
    en: ['ut'],
    cn: ['送葬者', '殡葬师'],
  },
  'monk': {
    en: [],
    cn: ['僧侣', '和尚'],
  },
  'ravenkeeper': {
    en: ['raven keeper', 'rk'],
    cn: ['鸦语者', '渡鸦看守'],
  },
  'virgin': {
    en: [],
    cn: ['处女', '圣洁者'],
  },
  'slayer': {
    en: [],
    cn: ['杀手', '刺客'],
  },
  'soldier': {
    en: [],
    cn: ['士兵', '军人'],
  },
  'mayor': {
    en: [],
    cn: ['市长', '镇长'],
  },
  'grandmother': {
    en: ['grandma', 'gm'],
    cn: ['奶奶', '外婆', '祖母'],
  },
  'sailor': {
    en: [],
    cn: ['水手', '船员'],
  },
  'chambermaid': {
    en: ['chamber maid', 'cm'],
    cn: ['侍女', '女仆'],
  },
  'exorcist': {
    en: ['exo'],
    cn: ['驱魔师', '驱魔人'],
  },
  'innkeeper': {
    en: ['inn keeper', 'ik'],
    cn: ['酒店老板', '客栈老板', '旅店老板'],
  },
  'gambler': {
    en: [],
    cn: ['赌徒', '赌鬼'],
  },
  'gossip': {
    en: [],
    cn: ['谣言者', '八卦者', '传言者'],
  },
  'courtier': {
    en: [],
    cn: ['朝臣', '弄臣'],
  },
  'professor': {
    en: ['prof'],
    cn: ['教授'],
  },
  'minstrel': {
    en: [],
    cn: ['吟游诗人', '乐师'],
  },
  'tealady': {
    en: ['tea lady', 'tl'],
    cn: ['茶女', '茶会女主人'],
  },
  'pacifist': {
    en: [],
    cn: ['和平主义者', '和平派'],
  },
  'fool': {
    en: [],
    cn: ['傻瓜', '愚人'],
  },
  'clockmaker': {
    en: ['clock maker', 'cm'],
    cn: ['钟表匠', '钟匠'],
  },
  'dreamer': {
    en: [],
    cn: ['梦境师', '梦者'],
  },
  'snakecharmer': {
    en: ['snake charmer', 'sc'],
    cn: ['弄蛇人', '耍蛇人', '蛇术师'],
  },
  'mathematician': {
    en: ['math', 'maths'],
    cn: ['数学家', '算学家'],
  },
  'flowergirl': {
    en: ['flower girl', 'fg'],
    cn: ['卖花女', '花童', '花女'],
  },
  'towncrier': {
    en: ['town crier', 'tc'],
    cn: ['传令官', '公告员'],
  },
  'oracle': {
    en: [],
    cn: ['预言家', '先知', '神谕者'],
  },
  'savant': {
    en: [],
    cn: ['博学者', '学者'],
  },
  'seamstress': {
    en: [],
    cn: ['裁缝', '女裁缝'],
  },
  'philosopher': {
    en: ['philo'],
    cn: ['哲学家'],
  },
  'artist': {
    en: [],
    cn: ['艺术家', '画家'],
  },
  'juggler': {
    en: [],
    cn: ['杂耍师', '魔术师'],
  },
  'sage': {
    en: [],
    cn: ['贤者', '智者'],
  },
  'noble': {
    en: [],
    cn: ['贵族'],
  },
  'bountyhunter': {
    en: ['bounty hunter', 'bh'],
    cn: ['赏金猎人', '猎金者'],
  },
  'pixie': {
    en: [],
    cn: ['小精灵', '皮克西'],
  },
  'general': {
    en: ['gen'],
    cn: ['将军'],
  },
  'preacher': {
    en: [],
    cn: ['传教士', '牧师'],
  },
  'king': {
    en: [],
    cn: ['国王'],
  },
  'balloonist': {
    en: [],
    cn: ['气球师', '热气球手'],
  },
  'cultleader': {
    en: ['cult leader', 'cl'],
    cn: ['教主', '邪教头子', '异教首领'],
  },
  'lycanthrope': {
    en: ['wolf', 'werewolf', 'lycan'],
    cn: ['狼人'],
  },
  'amnesiac': {
    en: ['amne', 'am'],
    cn: ['失忆者', '遗忘者'],
  },
  'nightwatchman': {
    en: ['night watchman', 'nwm', 'nw'],
    cn: ['更夫', '守夜人'],
  },
  'engineer': {
    en: ['eng'],
    cn: ['工程师'],
  },
  'fisherman': {
    en: ['fisher'],
    cn: ['渔夫', '渔民', '钓鱼佬'],
  },
  'huntsman': {
    en: ['hunter', 'hunt'],
    cn: ['猎手', '巡林人'],
  },
  'alchemist': {
    en: ['alc'],
    cn: ['炼金术士', '炼药师'],
  },
  'farmer': {
    en: [],
    cn: ['农夫', '农民', '农场主'],
  },
  'magician': {
    en: ['mage'],
    cn: ['魔术师', '魔法师'],
  },
  'choirboy': {
    en: ['choir boy', 'cb'],
    cn: ['唱诗班男孩', '歌童'],
  },
  'poppygrower': {
    en: ['poppy grower', 'pg'],
    cn: ['罂粟种植者', '种花人'],
  },
  'atheist': {
    en: [],
    cn: ['无神论者'],
  },
  'cannibal': {
    en: [],
    cn: ['食人族', '吃人魔'],
  },
  'acrobat': {
    en: [],
    cn: ['杂技演员', '小丑'],
  },
  'alsaahir': {
    en: [],
    cn: ['预言师'],
  },
  'banshee': {
    en: [],
    cn: ['报丧女妖'],
  },
  'highpriestess': {
    en: ['high priestess', 'hp'],
    cn: ['大祭司', '高阶祭司'],
  },
  'knight': {
    en: [],
    cn: ['骑士', '武士'],
  },
  'shugenja': {
    en: ['shug'],
    cn: ['修验者', '僧兵'],
  },
  'villageidiot': {
    en: ['village idiot', 'vi'],
    cn: ['村中愚人', '村里的傻子'],
  },
  'steward': {
    en: [],
    cn: ['管家'],
  },
  'yinyangshi': {
    en: ['yin yang', 'yinyang', 'yys'],
    cn: ['阴阳', '风水师'],
  },
  'qintianjian': {
    en: ['qtj'],
    cn: ['钦天监', '观星者'],
  },
  'xizi': {
    en: ['actor'],
    cn: ['戏子', '演员'],
  },
  'princess': {
    en: [],
    cn: ['公主'],
  },
  'dianxiaoer': {
    en: ['waiter'],
    cn: ['店小二', '小二', '跑堂'],
  },
  'xionghaizi': {
    en: ['rascal'],
    cn: ['熊孩子', '顽童'],
  },
  'langzhong': {
    en: ['herb doctor', 'doctor'],
    cn: ['郎中', '草药医生'],
  },
  'dagengren': {
    en: ['firewatcher', 'fire watcher'],
    cn: ['打更人'],
  },
  'jinyiwei': {
    en: ['brocadier'],
    cn: ['锦衣卫'],
  },
  'heshang': {
    en: ['monk2'],
    cn: ['和尚', '僧人'],
  },
  'geling': {
    en: ['diva'],
    cn: ['歌伶', '歌女'],
  },
  'bianlianshi': {
    en: ['face changer', 'facechanger'],
    cn: ['变脸师', '变脸'],
  },
  'banxian': {
    en: [],
    cn: ['半仙', '算命先生'],
  },
  'wudaozhe': {
    en: ['enlightened one', 'enlightened'],
    cn: ['悟道者', '得道者'],
  },
  'bingbi': {
    en: ['brush holder', 'brushholder'],
    cn: ['秉笔', '执笔人'],
  },
  'chongfei': {
    en: ['favored consort', 'consort'],
    cn: ['宠妃', '妃子'],
  },
  'daoke': {
    en: ['swordman', 'swordsman'],
    cn: ['刀客', '剑客'],
  },
  'daoshi': {
    en: [],
    cn: ['道士'],
  },
  'fangshi': {
    en: [],
    cn: ['方士', '炼金方士'],
  },
  'fengshuishi': {
    en: ['fengshui master', 'fengshui'],
    cn: ['风水师', '风水先生'],
  },
  'limao': {
    en: [],
    cn: ['狸猫', '狸猫妖'],
  },
  'qianke': {
    en: ['broker'],
    cn: ['掮客', '中间人'],
  },
  'ranfangfangzhu': {
    en: ['dyer'],
    cn: ['染坊坊主', '染匠'],
  },
  'shiguan': {
    en: ['historian'],
    cn: ['史官', '史家'],
  },
  'tixingguan': {
    en: ['magistrate'],
    cn: ['提刑官', '判官'],
  },
  'xuncha': {
    en: ['patrolman', 'patrol'],
    cn: ['巡察', '巡逻'],
  },
  'yanshi': {
    en: ['puppeteer'],
    cn: ['偃师', '傀儡师'],
  },
  'yishi': {
    en: ['messenger'],
    cn: ['驿使', '信使'],
  },
  'yinluren': {
    en: ['guide'],
    cn: ['引路人', '向导'],
  },
  'yongjiang': {
    en: ['artisan'],
    cn: ['俑匠', '工匠'],
  },
  'zhen': {
    en: [],
    cn: ['阵', '阵法'],
  },
  'zhifu': {
    en: ['prefect'],
    cn: ['知府', '地方官'],
  },

  // ── 外来者 ──
  'butler': {
    en: [],
    cn: ['管家', '侍者'],
  },
  'drunk': {
    en: [],
    cn: ['酒鬼', '醉汉'],
  },
  'recluse': {
    en: [],
    cn: ['隐士', '隐居者'],
  },
  'saint': {
    en: [],
    cn: ['圣人', '圣徒'],
  },
  'tinker': {
    en: [],
    cn: ['修补匠', '小炉匠'],
  },
  'moonchild': {
    en: ['moon child', 'mc'],
    cn: ['月亮之子', '月童'],
  },
  'goon': {
    en: [],
    cn: ['打手', '恶棍'],
  },
  'lunatic': {
    en: ['luna'],
    cn: ['疯子', '精神病'],
  },
  'mutant': {
    en: [],
    cn: ['异类', '变种人'],
  },
  'sweetheart': {
    en: ['sweet heart', 'sh'],
    cn: ['甜心', '心上人'],
  },
  'barber': {
    en: [],
    cn: ['理发师'],
  },
  'klutz': {
    en: [],
    cn: ['笨手笨脚', '莽撞人'],
  },
  'snitch': {
    en: [],
    cn: ['告密者', '小报告'],
  },
  'puzzlemaster': {
    en: ['puzzle master', 'pm'],
    cn: ['解谜大师', '谜题师'],
  },
  'heretic': {
    en: [],
    cn: ['异教徒', '异端'],
  },
  'damsel': {
    en: [],
    cn: ['少女', '闺秀'],
  },
  'golem': {
    en: [],
    cn: ['魔像', '人偶'],
  },
  'politician': {
    en: ['pol', 'politic'],
    cn: ['政客', '政治家'],
  },
  'ogre': {
    en: [],
    cn: ['食人魔'],
  },
  'hatter': {
    en: [],
    cn: ['疯帽匠', '帽匠'],
  },
  'plaguedoctor': {
    en: ['plague doctor', 'pd'],
    cn: ['瘟疫医生', '鸟嘴医生'],
  },
  'zealot': {
    en: [],
    cn: ['狂热者', '偏执狂'],
  },
  'hermit': {
    en: [],
    cn: ['隐修者', '修行者'],
  },
  'shaxing': {
    en: ['mr misfortune'],
    cn: ['煞星', '灾星'],
  },
  'nichen': {
    en: ['turncoat'],
    cn: ['逆臣', '叛徒'],
  },
  'shusheng': {
    en: ['pedant'],
    cn: ['书生', '学究'],
  },
  'shijie': {
    en: ['envoy'],
    cn: ['使节', '使者'],
  },
  'jiubao': {
    en: ['bartender'],
    cn: ['酒保', '调酒师'],
  },
  'rulianshi': {
    en: ['mortician'],
    cn: ['入殓师', '殡仪师'],
  },
  'shutong': {
    en: ['bookboy', 'book boy'],
    cn: ['书童', '童子'],
  },

  // ── 爪牙 ──
  'poisoner': {
    en: ['poison'],
    cn: ['投毒者', '下毒者'],
  },
  'spy': {
    en: [],
    cn: ['间谍', '密探'],
  },
  'scarletwoman': {
    en: ['scarlet woman', 'sw'],
    cn: ['红唇女郎', '红衣女', '娼妓'],
  },
  'baron': {
    en: [],
    cn: ['男爵'],
  },
  'godfather': {
    en: ['god father', 'gf'],
    cn: ['教父'],
  },
  'devilsadvocate': {
    en: ["devil's advocate", 'devils advocate', 'da'],
    cn: ['恶魔拥护者', '魔鬼代言人'],
  },
  'assassin': {
    en: ['ass', 'sin'],
    cn: ['刺客', '暗杀者'],
  },
  'mastermind': {
    en: ['mm'],
    cn: ['策划者', '幕后黑手', '主谋'],
  },
  'eviltwin': {
    en: ['evil twin', 'et'],
    cn: ['邪恶双子', '邪双'],
  },
  'witch': {
    en: [],
    cn: ['女巫'],
  },
  'cerenovus': {
    en: ['cere', 'cera'],
    cn: ['大脑怪', '洗脑者'],
  },
  'pithag': {
    en: ['pit hag', 'ph'],
    cn: ['熬药的', '药婆', '坩埚巫婆'],
  },
  'widow': {
    en: [],
    cn: ['寡妇'],
  },
  'fearmonger': {
    en: ['fear monger', 'fm'],
    cn: ['散播恐惧者', '恐慌制造者'],
  },
  'psychopath': {
    en: ['psycho'],
    cn: ['疯子', '精神病患者'],
  },
  'goblin': {
    en: [],
    cn: ['地精', '小妖精'],
  },
  'mezepheles': {
    en: ['mez'],
    cn: ['恶魔使者', '魅魔'],
  },
  'marionette': {
    en: ['mario', 'puppet'],
    cn: ['提线木偶', '木偶'],
  },
  'boomdandy': {
    en: ['boom dandy', 'boom'],
    cn: ['炸弹人', '自爆狂'],
  },
  'boffin': {
    en: [],
    cn: ['科学家', '博士'],
  },
  'harpy': {
    en: [],
    cn: ['鸟身女妖', '鹰身女妖'],
  },
  'organgrinder': {
    en: ['organ grinder', 'og'],
    cn: ['磨刀人', '风琴手'],
  },
  'summoner': {
    en: [],
    cn: ['召唤师', '召唤者'],
  },
  'vizier': {
    en: [],
    cn: ['宰相', '维齐尔'],
  },
  'wizard': {
    en: [],
    cn: ['巫师', '术士', '魔法师'],
  },
  'xaan': {
    en: ['xan'],
    cn: ['无名小妖', '无名怪'],
  },
  'wraith': {
    en: [],
    cn: ['幽灵', '亡魂'],
  },
  'humeiniang': {
    en: ['hu meiniang'],
    cn: ['狐媚娘', '狐狸精'],
  },
  'yangguren': {
    en: ['bug keeper'],
    cn: ['养蛊人', '蛊师'],
  },
  'jinweijun': {
    en: ['imperialist'],
    cn: ['禁卫军', '禁军'],
  },
  'ganshiren': {
    en: ['corpse walker', 'corpsewalker'],
    cn: ['赶尸人', '赶尸'],
  },

  // ── 恶魔 ──
  'imp': {
    en: [],
    cn: ['小恶魔', '恶魔崽子'],
  },
  'fanggu': {
    en: ['fang gu', 'fg'],
    cn: ['方古', '跳跳'],
  },
  'vigormortis': {
    en: ['vigor', 'vm'],
    cn: ['活力死', '不死恶魔'],
  },
  'nodashii': {
    en: ['no dashii', 'nd'],
    cn: ['无达西', '无'],
  },
  'vortox': {
    en: ['vor'],
    cn: ['涡流', '反转恶魔'],
  },
  'zombuul': {
    en: ['zombie', 'zomb'],
    cn: ['僵尸', '不死者'],
  },
  'pukka': {
    en: [],
    cn: ['普卡'],
  },
  'shabaloth': {
    en: ['shab', 'shabba'],
    cn: ['沙巴罗斯', '吞噬者'],
  },
  'po': {
    en: [],
    cn: ['魄'],
  },
  'lilmonsta': {
    en: ['little monsta', 'lil monsta', "lil' monsta", 'baby demon', 'baby', 'lm'],
    cn: ['小小怪物', '小怪物', '宝宝'],
  },
  'lleech': {
    en: ['leech'],
    cn: ['水蛭', '蚂蟥'],
  },
  'alhadikhia': {
    en: ['al hadikhia', 'al-hadikhia', 'al'],
    cn: ['阿拉迪基亚', '复活恶魔'],
  },
  'legion': {
    en: [],
    cn: ['军团', '群魔'],
  },
  'leviathan': {
    en: ['levi', 'leviath'],
    cn: ['利维坦', '海怪'],
  },
  'riot': {
    en: [],
    cn: ['暴动', '暴乱'],
  },
  'kazali': {
    en: [],
    cn: ['卡扎利', '变形者'],
  },
  'lordoftyphon': {
    en: ['lord of typhon', 'lot', 'typhon'],
    cn: ['提丰之主', '提丰'],
  },
  'ojo': {
    en: [],
    cn: ['奥霍', '选人恶魔'],
  },
  'yaggababble': {
    en: ['yagga', 'yag'],
    cn: ['牙嘎巴布', '多嘴恶魔'],
  },

  // ── 旅行者 ──
  'bureaucrat': {
    en: ['bureau', 'bureaucracy'],
    cn: ['官僚', '官员'],
  },
  'thief': {
    en: [],
    cn: ['小偷', '贼'],
  },
  'gunslinger': {
    en: ['gun slinger', 'gs'],
    cn: ['枪手', '快枪手'],
  },
  'scapegoat': {
    en: ['scape goat', 'sg'],
    cn: ['替罪羊', '背锅侠'],
  },
  'beggar': {
    en: [],
    cn: ['乞丐', '叫花子'],
  },
  'apprentice': {
    en: ['app'],
    cn: ['学徒', '见习生'],
  },
  'matron': {
    en: [],
    cn: ['女舍监', '监护者'],
  },
  'judge': {
    en: [],
    cn: ['法官', '审判官'],
  },
  'bishop': {
    en: [],
    cn: ['主教'],
  },
  'voudon': {
    en: ['voodoo'],
    cn: ['巫毒', '巫毒教'],
  },
  'barista': {
    en: [],
    cn: ['咖啡师', '咖啡店员'],
  },
  'harlot': {
    en: [],
    cn: ['妓女', '花魁'],
  },
  'butcher': {
    en: [],
    cn: ['屠夫', '卖肉的'],
  },
  'bonecollector': {
    en: ['bone collector', 'bc'],
    cn: ['收尸人', '捡骨者'],
  },
  'deviant': {
    en: [],
    cn: ['异类', '异常者'],
  },
  'gangster': {
    en: ['gang', 'gangsta'],
    cn: ['黑帮', '黑社会', '老大'],
  },
  'gnome': {
    en: [],
    cn: ['地精'],
  },
  'cacklejack': {
    en: ['cackle jack', 'cj'],
    cn: ['笑面杀手', '杰克'],
  },
  'jiaohuazi': {
    en: ['pauper'],
    cn: ['叫花子', '乞丐2'],
  },
};

/** 搜索所有别名，返回匹配的官方英文 ID 列表 */
export function searchAliases(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return [];

  const results: string[] = [];

  for (const [id, entry] of Object.entries(CHARACTER_ALIASES)) {
    // 搜中文别名
    if (entry.cn.some(a => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))) {
      results.push(id);
      continue;
    }
    // 搜英文别名
    if (entry.en.some(a => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))) {
      results.push(id);
      continue;
    }
    // 也检查官方 ID 本身
    if (id.includes(q) || q.includes(id)) {
      results.push(id);
    }
  }

  return results;
}
