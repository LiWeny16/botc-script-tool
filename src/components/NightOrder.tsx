import { Box, Typography, Paper } from '@mui/material';
import type { NightAction } from '../types';
import { THEME_COLORS } from '../theme/colors';
import CharacterImage from './CharacterImage';

interface NightOrderProps {
  title: string;
  actions: NightAction[];
  isMobile?: boolean;
}

export default function NightOrder({ title, actions, isMobile = false }: NightOrderProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 0, md: 0 },
        backgroundColor: isMobile ? THEME_COLORS.nightOrder.background : 'transparent',
        color: isMobile ? '#fefefe' : '#fefefe',
        borderRadius: 1.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'none',
      }}
    >
      {/* 标题 */}
      <Typography
        variant="h4"
        sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.3rem' },
          mb: isMobile ? 1 : 1.5,
          mt: 0.5,
          color: isMobile ? '#fefefe' : 'inherit',
        }}
      >
        {isMobile ? (
          // 移动端横向显示
          title
        ) : (
          // 桌面端竖向显示
          title.split('').map((char, index) => (
            <Box
              key={index}
              component="span"
              sx={{
                display: 'block',
                lineHeight: char === '晚' ? 1.3 : 1,
                mt: char === '晚' ? 0.3 : 0,
              }}
            >
              {char}
            </Box>
          ))
        )}
      </Typography>

      {/* 行动图标列表 */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: 0.5,
          overflowY: isMobile ? 'visible' : 'auto',
          px: 0.3,
          justifyContent: isMobile ? 'center' : 'flex-start',
          '&::-webkit-scrollbar': {
            width: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 1.5,
          },
        }}
      >
        {actions.map((action, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CharacterImage
              src={action.image}
              alt={`Action ${index}`}
              sx={{
                width: { xs: 35, sm: 38, md: 42 },
                height: { xs: 35, sm: 38, md: 42 },
                borderRadius: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                p: 0.2,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                },
              }}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
