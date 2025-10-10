import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  useMediaQuery,
  createTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { observer } from 'mobx-react-lite';
import { getScriptJsonUrl, loadScriptJson } from '../data/scriptRepository';
import { generateScript } from '../utils/scriptGenerator';
import CharacterSection from '../components/CharacterSection';
import NightOrder from '../components/NightOrder';
import SpecialRulesSection from '../components/SpecialRulesSection';
import { THEME_COLORS } from '../theme/colors';
import { useTranslation } from '../utils/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import type { Script } from '../types';

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

const ScriptPreview = observer(() => {
  const { scriptName } = useParams<{ scriptName: string }>();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [script, setScript] = useState<Script | null>(null);
  const [error, setError] = useState<string>('');
  const [originalJson, setOriginalJson] = useState<string>('');
  const scriptRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const loadScript = async () => {
      if (!scriptName) {
        setError(t('error.noScriptName'));
        return;
      }

      const decodedName = decodeURIComponent(scriptName);

      // 从映射表中获取JSON URL
      const jsonUrl = getScriptJsonUrl(decodedName);

      if (!jsonUrl) {
        setError(`${t('error.scriptNotFound')}：${decodedName}`);
        return;
      }

      try {
        // 从URL加载JSON
        const jsonString = await loadScriptJson(jsonUrl);
        setOriginalJson(jsonString);
        const generatedScript = generateScript(jsonString, language);
        setScript(generatedScript);
      } catch (err) {
        setError(`${t('error.loadFailed')}：${err instanceof Error ? err.message : t('error.unknownError')}`);
      }
    };

    loadScript();
  }, [scriptName, t]);

  // 监听语言变化，重新生成剧本
  useEffect(() => {
    if (originalJson) {
      try {
        const generatedScript = generateScript(originalJson, language);
        setScript(generatedScript);
      } catch (err) {
        console.error('Failed to regenerate script:', err);
      }
    }
  }, [language, originalJson]);

  const handleExportJson = () => {
    if (!script) return;

    try {
      // 构建符合原始格式的JSON结构
      const exportData = [
        {
          id: '_meta',
          name: script.title,
          author: script.author || '',
        },
        // 导出所有team的角色
        ...Object.keys(script.characters).flatMap(team => 
          script.characters[team].map(char => ({ id: char.id }))
        ),
      ];

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${script.title || '剧本'}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出JSON失败:', error);
      alert(t('input.exportJsonFailed'));
    }
  };

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          py: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/repo')}
              variant="contained"
            >
              {t('repo.backToRepository')}
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (!script) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          py: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography>{t('common.loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: isMobile ? '#fefaf0' : 'background.default',
        pt: 0,
        // pb: { xs: 0, md: 4 },
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 0, md: 2 }, maxWidth: { xs: '100%', md: 'xl' } }}>
        {/* 剧本展示区域 */}
        <Box
          id="script-preview"
          ref={scriptRef}
          sx={{
            display: 'flex',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'center',
              gap: { xs: 0, md: '2px' },
              alignItems: 'stretch',
            }}
          >
            {/* 左侧 - 首个夜晚 */}
            {!isMobile && (
              <Box
                sx={{
                  padding: 1.5,
                  flexShrink: 0,
                  backgroundColor: THEME_COLORS.nightOrder.background,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-start',
                  pt: '33.33%',
                  overflow: 'hidden',
                  boxShadow: 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='6' seed='2' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0 0 0 0 0.15 0 0.25 0 0 0.35 0 0 0.45'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
                    opacity: 0.5,
                    pointerEvents: 'none',
                    backgroundSize: '150px 150px',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    background: `
                      radial-gradient(circle at 15% 25%, rgba(10, 12, 15, 0.9) 0%, transparent 3%),
                      radial-gradient(circle at 45% 15%, rgba(8, 10, 12, 0.85) 0%, transparent 4%),
                      radial-gradient(circle at 75% 35%, rgba(5, 8, 10, 0.95) 0%, transparent 2.5%),
                      radial-gradient(circle at 35% 55%, rgba(12, 15, 18, 0.8) 0%, transparent 3.5%),
                      radial-gradient(circle at 85% 65%, rgba(8, 10, 12, 0.9) 0%, transparent 3%),
                      radial-gradient(circle at 20% 75%, rgba(6, 8, 10, 0.85) 0%, transparent 4%),
                      radial-gradient(circle at 60% 85%, rgba(10, 12, 15, 0.95) 0%, transparent 2%),
                      radial-gradient(circle at 90% 20%, rgba(8, 10, 12, 0.75) 0%, transparent 3.5%),
                      radial-gradient(circle at 50% 45%, rgba(6, 8, 10, 0.9) 0%, transparent 3%),
                      radial-gradient(circle at 10% 90%, rgba(10, 12, 15, 0.85) 0%, transparent 4%)
                    `,
                    backgroundSize: '100% 100%',
                    pointerEvents: 'none',
                  },
                  '& > *': {
                    position: 'relative',
                    zIndex: 1,
                  },
                }}
              >
                <NightOrder title={t('night.first')} actions={script.firstnight} />
              </Box>
            )}

            {/* 中间 - 主要内容区域 */}
            <Paper
              elevation={0}
              sx={{
                pb: 2,
                pt: 2,
                flex: 1,
                maxWidth: { xs: '100%', md: '1200px' },
                backgroundImage: 'url(/bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: 0,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'none',
                border: 'none',
                minHeight: { xs: '100vh', md: 'auto' },
              }}
            >
              {/* 装饰性花纹 */}
              <Box
                component="img"
                src="https://clocktower-wiki.gstonegames.com/skins/pivot/assets/image/flower3.png"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                  opacity: 0.25,
                  pointerEvents: 'none',
                }}
              />
              <Box
                component="img"
                src="https://clocktower-wiki.gstonegames.com/skins/pivot/assets/image/flower4.png"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                  opacity: 0.25,
                  pointerEvents: 'none',
                }}
              />

              {/* 工具栏和标题区域 */}
              <Box sx={{ position: 'relative', zIndex: 1, px: { xs: 1, sm: 2 } }}>
                {/* 工具栏按钮 */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    mb: 2,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    pt: 1,
                  }}
                >
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/repo')}
                    variant="contained"
                    size="small"
                    sx={{
                      backgroundColor: THEME_COLORS.paper.secondary,
                      color: '#fefaf0',
                      fontSize: { xs: '0.75rem', sm: '0.85rem' },
                      py: { xs: 0.5, sm: 0.75 },
                      px: { xs: 1.5, sm: 2 },
                      '&:hover': {
                        backgroundColor: THEME_COLORS.paper.primary,
                      },
                    }}
                  >
                    {t('repo.backToRepository')}
                  </Button>
                  <Button
                    startIcon={<DownloadIcon />}
                    onClick={handleExportJson}
                    variant="contained"
                    size="small"
                    sx={{
                      backgroundColor: THEME_COLORS.good,
                      color: '#ffffff',
                      fontSize: { xs: '0.75rem', sm: '0.85rem' },
                      py: { xs: 0.5, sm: 0.75 },
                      px: { xs: 1.5, sm: 2 },
                      '&:hover': {
                        backgroundColor: THEME_COLORS.good,
                        opacity: 0.85,
                      },
                    }}
                  >
                    {t('repo.exportJson')}
                  </Button>
                  <LanguageSwitcher />
                </Box>

                {/* 标题 */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  {!isMobile && script.author && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 50,
                        right: { sm: 20, md: 30 },
                        textAlign: 'right',
                      }}
                    >
                      <Typography
                        sx={{
                          color: THEME_COLORS.paper.secondary,
                          fontSize: { sm: '0.85rem' },
                          mb: 0.3,
                        }}
                      >
                        {t('script.author')}：{script.author}
                        <br />
                        {t('script.playerCount')}
                      </Typography>
                    </Box>
                  )}

                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 'bold',
                      color: THEME_COLORS.paper.primary,
                      fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
                      mb: { xs: 0.5, sm: 0.5 },
                    }}
                  >
                    {script.title}
                  </Typography>

                  {isMobile && script.author && (
                    <Typography
                      sx={{
                        color: THEME_COLORS.paper.secondary,
                        fontSize: '0.75rem',
                        mt: 0.5,
                      }}
                    >
                      {t('script.author2')}：{script.author} · {t('script.playerCount')}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* 角色区域 */}
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                {/* 按固定顺序显示标准团队 */}
                {['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveler'].map(team => (
                  script.characters[team] && script.characters[team].length > 0 && (
                    <CharacterSection
                      key={team}
                      team={team}
                      characters={script.characters[team]}
                      script={script}
                      onReorder={() => { }}
                      disableDrag={true}
                    />
                  )
                ))}
                
                {/* 显示所有未知团队 */}
                {Object.keys(script.characters)
                  .filter(team => !['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveler'].includes(team))
                  .map(team => (
                    <CharacterSection
                      key={team}
                      team={team}
                      characters={script.characters[team]}
                      script={script}
                      onReorder={() => { }}
                      disableDrag={true}
                    />
                  ))
                }
              </Box>

              {/* 移动端夜晚行动顺序 */}
              {isMobile && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1.5, position: 'relative', zIndex: 1, px: { xs: 1, sm: 2, md: 3 } }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <NightOrder title={t('night.first')} actions={script.firstnight} isMobile={true} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <NightOrder title={t('night.other')} actions={script.othernight} isMobile={true} />
                  </Box>
                </Box>
              )}

              {/* 特殊说明卡片 */}
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <SpecialRulesSection rules={script.specialRules} />
              </Box>
            </Paper>

            {/* 右侧 - 其他夜晚 */}
            {!isMobile && (
              <Box
                sx={{
                  padding: 1.5,
                  flexShrink: 0,
                  backgroundColor: THEME_COLORS.nightOrder.background,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-start',
                  pt: '33.33%',
                  overflow: 'hidden',
                  boxShadow: 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='6' seed='2' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0 0 0 0 0.15 0 0.25 0 0 0.35 0 0 0.45'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
                    opacity: 0.5,
                    pointerEvents: 'none',
                    backgroundSize: '150px 150px',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    background: `
                      radial-gradient(circle at 15% 25%, rgba(10, 12, 15, 0.9) 0%, transparent 3%),
                      radial-gradient(circle at 45% 15%, rgba(8, 10, 12, 0.85) 0%, transparent 4%),
                      radial-gradient(circle at 75% 35%, rgba(5, 8, 10, 0.95) 0%, transparent 2.5%),
                      radial-gradient(circle at 35% 55%, rgba(12, 15, 18, 0.8) 0%, transparent 3.5%),
                      radial-gradient(circle at 85% 65%, rgba(8, 10, 12, 0.9) 0%, transparent 3%),
                      radial-gradient(circle at 20% 75%, rgba(6, 8, 10, 0.85) 0%, transparent 4%),
                      radial-gradient(circle at 60% 85%, rgba(10, 12, 15, 0.95) 0%, transparent 2%),
                      radial-gradient(circle at 90% 20%, rgba(8, 10, 12, 0.75) 0%, transparent 3.5%),
                      radial-gradient(circle at 50% 45%, rgba(6, 8, 10, 0.9) 0%, transparent 3%),
                      radial-gradient(circle at 10% 90%, rgba(10, 12, 15, 0.85) 0%, transparent 4%)
                    `,
                    backgroundSize: '100% 100%',
                    pointerEvents: 'none',
                  },
                  '& > *': {
                    position: 'relative',
                    zIndex: 1,
                  },
                }}
              >
                <NightOrder title={t('night.other')} actions={script.othernight} />
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
});

export default ScriptPreview;

