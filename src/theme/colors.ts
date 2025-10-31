// 血染钟楼剧本生成器 - 统一颜色配置

// 主题颜色
export const THEME_COLORS = {
  // 善良阵营 - 蓝色系
  good: '#0078ba',

  // 邪恶阵营 - 红色系
  evil: '#a32222ff',

  // 传奇角色 - 金色系
  fabled: '#d4af37',

  // 洛克角色 - 翡翠绿色
  loric: '#359026',

  // 未知团队 - 翠墨绿色
  unknown: '#2d5c4f',

  // 其他颜色
  purple: '#b463aaff',  // 旅行者等特殊标记
  gray: '#999',       // 分割线等

  // 背景色
  paper: {
    primary: '#2c2416',
    secondary: '#3d3226',
  },

  // 夜晚顺序栏背景
  nightOrder: {
    background: '#1a1d20',
  },

  // 文字颜色
  text: {
    primary: '#000000',     // 主要文字 - 黑色
    secondary: '#000000',   // 次要文字 - 深灰
    tertiary: '#000000',    // 三级文字 - 灰色
  },
} as const;

// 全局字体样式配置
export const THEME_FONTS = {
  // 主要字体系列
  fontFamily: '"Source Han Serif", "Source Han Serif SC", "Noto Serif CJK SC", "思源宋体", "Microsoft YaHei", "PingFang SC", serif',
  // fontFamily: `'Noto Serif SC', serif`,
// 备用字体系列（用于特殊场景）
fallbackFontFamily: '"Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif',
} as const ;

// 团队颜色映射
export const TEAM_COLORS: Record<string, string> = {
  townsfolk: THEME_COLORS.good,    // 镇民 - 蓝色
  outsider: THEME_COLORS.good,     // 外来者 - 蓝色
  minion: THEME_COLORS.evil,       // 爪牙 - 红色
  demon: THEME_COLORS.evil,        // 恶魔 - 红色
  traveler: THEME_COLORS.purple,   // 旅行者 - 紫色
  fabled: THEME_COLORS.fabled,     // 传奇角色 - 金色
  loric: THEME_COLORS.loric,       // 洛克角色 - 翡翠绿色
};

// 团队名称映射
export const TEAM_NAMES: Record<string, string> = {
  townsfolk: '镇民',
  outsider: '外来者',
  minion: '爪牙',
  demon: '恶魔',
  traveler: '旅行者',
  fabled: '传奇角色',
  loric: '洛克角色',
};

// 获取团队颜色（如果未定义则返回翠墨绿色）
export function getTeamColor(team: string, customColor?: string): string {
  // 优先使用自定义颜色
  if (customColor) {
    return customColor;
  }
  // 其次使用预定义颜色
  if (TEAM_COLORS[team]) {
    return TEAM_COLORS[team];
  }
  // 未知团队使用翠墨绿色
  return THEME_COLORS.unknown;
}

// 获取团队名称（如果未定义则返回格式化的team名称）
export function getTeamName(team: string): string {
  if (TEAM_NAMES[team]) {
    return TEAM_NAMES[team];
  }
  // 自动格式化团队名称
  return team.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

