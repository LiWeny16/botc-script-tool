// Blood on the Clocktower Script Generator - Unified color configuration

// Theme colors
export const THEME_COLORS = {
  // Good team - Blue series
  good: '#0078ba',

  // Evil team - Red series
  evil: '#a32222ff',

  // Fabled - Gold
  fabled: '#d4af37',

  // Loric - Emerald green
  loric: '#359026',

  // Unknown team - Dark green
  unknown: '#2d5c4f',

  // Other colors
  purple: '#b463aaff',  // Traveler and other special markers
  gray: '#999',       // Dividers, etc.

  // Background colors
  paper: {
    primary: '#2c2416',
    secondary: '#3d3226',
  },

  // Night order bar background
  nightOrder: {
    background: '#1a1d20',
  },

  // Text colors
  text: {
    primary: '#000000',     // Primary text - Black
    secondary: '#000000',   // Secondary text - Dark gray
    tertiary: '#000000',    // Tertiary text - Gray
  },
} as const;

// Global font style configuration
export const THEME_FONTS = {
  // Primary font family
  fontFamily: '"Source Han Serif", "Source Han Serif SC", "Noto Serif CJK SC", "思源宋体", "Microsoft YaHei", "PingFang SC", serif',
  // fontFamily: `'Noto Serif SC', serif`,
// Fallback font family (for special scenarios)
fallbackFontFamily: '"Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif',
} as const ;

// Team color mapping
export const TEAM_COLORS: Record<string, string> = {
  townsfolk: THEME_COLORS.good,    // Townsfolk - Blue
  outsider: THEME_COLORS.good,     // Outsider - Blue
  minion: THEME_COLORS.evil,       // Minion - Red
  demon: THEME_COLORS.evil,        // Demon - Red
  traveler: THEME_COLORS.purple,   // Traveler - Purple
  fabled: THEME_COLORS.fabled,     // Fabled - Gold
  loric: THEME_COLORS.loric,       // Loric - Emerald green
};

// Team name mapping
export const TEAM_NAMES: Record<string, string> = {
  townsfolk: 'Townsfolk',
  outsider: 'Outsider',
  minion: 'Minion',
  demon: 'Demon',
  traveler: 'Traveler',
  fabled: 'Fabled',
  loric: 'Loric',
};

// Get team color (returns dark green if undefined)
export function getTeamColor(team: string, customColor?: string): string {
  // Prefer custom color
  if (customColor) {
    return customColor;
  }
  // Fall back to predefined color
  if (TEAM_COLORS[team]) {
    return TEAM_COLORS[team];
  }
  // Unknown team uses dark green
  return THEME_COLORS.unknown;
}

// Get team name (returns formatted team name if undefined)
export function getTeamName(team: string): string {
  if (TEAM_NAMES[team]) {
    return TEAM_NAMES[team];
  }
  // Auto-format team name
  return team.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

