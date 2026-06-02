import { alpha } from '@mui/material';

/** 圆角（用 px 字符串，避免 MUI 主题倍数放大） */
export const agentRadiusLg = '12px';
export const agentRadiusMd = '8px';
export const agentRadiusSm = '6px';

/** 面板浅灰底 */
export const agentBg = '#f5f5f5';
export const agentBgHeader = '#eeeeee';
export const agentBgElevated = '#ffffff';

export const agentPanelSurface = {
  bgcolor: agentBg,
  border: '1px solid',
  borderColor: '#e0e0e0',
  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
};

export const agentAccent = '#9c27b0';
export const agentAccentDark = '#7b1fa2';

export const agentGradient = 'linear-gradient(135deg, #ab47bc 0%, #8e24aa 45%, #6a1b9a 100%)';

export const agentCompactSelectSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: agentRadiusSm,
    bgcolor: agentBgElevated,
    fontSize: '0.8rem',
    '& fieldset': { borderColor: '#e0e0e0' },
    '&:hover fieldset': { borderColor: '#bdbdbd' },
    '&.Mui-focused fieldset': { borderColor: alpha(agentAccent, 0.5), borderWidth: 1 },
  },
  '& .MuiSelect-select': {
    py: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};
