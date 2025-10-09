import { useState, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Paper,
  useMediaQuery,
} from '@mui/material';
import type { Script } from './types';
import InputPanel from './components/InputPanel';
import CharacterSection from './components/CharacterSection';
import NightOrder from './components/NightOrder';
import SpecialRulesSection from './components/SpecialRulesSection';
import { generateScript } from './utils/scriptGenerator';
import { THEME_COLORS, THEME_FONTS } from './theme/colors';
import html2canvas from 'html2canvas';

// 创建主题
const theme = createTheme({
  palette: {
    primary: {
      main: THEME_COLORS.good,
    },
    secondary: {
      main: THEME_COLORS.evil,
    },
    background: {
      default: '#f5f5f5',
    },
    text: {
      primary: THEME_COLORS.text.primary,
      secondary: THEME_COLORS.text.secondary,
    },
  },
  typography: {
    fontFamily: THEME_FONTS.fontFamily,
  },
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

function App() {
  const [script, setScript] = useState<Script | null>(null);
  const [originalJson, setOriginalJson] = useState<string>('');
  const scriptRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleGenerate = (json: string, title?: string, author?: string) => {
    const generatedScript = generateScript(json);

    // 覆写标题和作者
    if (title) generatedScript.title = title;
    if (author) generatedScript.author = author;

    setScript(generatedScript);
    setOriginalJson(json);
  };

  // 更新角色顺序
  const handleReorderCharacters = (team: 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'fabled' | 'traveler', newOrder: string[]) => {
    if (!script) return;

    const updatedScript = {
      ...script,
      characters: {
        ...script.characters,
        [team]: newOrder.map(id => script.characters[team].find(c => c.id === id)!),
      },
    };

    setScript(updatedScript);
  };

  // 导出更新后的JSON
  const handleExportJson = () => {
    if (!script) return;

    try {
      const parsedJson = JSON.parse(originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      // 创建新的JSON数组，保持原始顺序但根据script中的顺序重新排列
      const newJsonArray: any[] = [];

      // 添加元数据
      const metaItem = jsonArray.find((item: any) => item.id === '_meta');
      if (metaItem) {
        newJsonArray.push(metaItem);
      }

      // 按照script中的顺序添加角色
      ['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveler'].forEach(team => {
        const teamKey = team as 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'fabled' | 'traveler';
        script.characters[teamKey].forEach(character => {
          const originalItem = jsonArray.find((item: any) => item.id === character.id);
          if (originalItem) {
            newJsonArray.push(originalItem);
          }
        });
      });

      // 添加相克规则
      jsonArray.forEach((item: any) => {
        if (item.team === 'a jinxed') {
          newJsonArray.push(item);
        }
      });

      const jsonString = JSON.stringify(newJsonArray, null, 2);

      // 复制到剪贴板
      navigator.clipboard.writeText(jsonString).then(() => {
        alert('JSON已复制到剪贴板！');
      }).catch(() => {
        // 如果复制失败，显示在弹窗中
        const textarea = document.createElement('textarea');
        textarea.value = jsonString;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('JSON已复制到剪贴板！');
      });
    } catch (error) {
      console.error('导出JSON失败:', error);
      alert('导出JSON失败，请重试');
    }
  };

  const handleExportImage = async () => {
    if (!scriptRef.current) return;

    try {
      // 等待所有图片加载完成
      const images = scriptRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve(null);
            img.onerror = () => resolve(null);
            setTimeout(() => resolve(null), 5000);
          });
        })
      );

      const canvas = await html2canvas(scriptRef.current, {
        scale: 2, // 2倍分辨率，确保文字清晰
        backgroundColor: '#242424',
        logging: false,
        useCORS: true,
        allowTaint: true, // 允许跨域图片
        width: scriptRef.current.scrollWidth,
        height: scriptRef.current.scrollHeight,
        windowWidth: scriptRef.current.scrollWidth,
        windowHeight: scriptRef.current.scrollHeight,
        imageTimeout: 0, // 不设置超时
        removeContainer: true,
      });

      // 压缩导出，减小文件大小
      const link = document.createElement('a');
      link.download = `${script?.title || '剧本'}.png`;
      link.href = canvas.toDataURL('image/jpeg', 0.92); // 使用JPEG格式，92%质量压缩
      link.click();
    } catch (error) {
      console.error('导出图片失败:', error);
      alert('导出图片失败，请重试。如果问题持续，请刷新页面后重试。');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
          py: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Container maxWidth="xl">
          {/* 输入面板 */}
          <InputPanel
            onGenerate={handleGenerate}
            onExportImage={handleExportImage}
            onExportJson={handleExportJson}
            hasScript={script !== null}
          />

          {/* 剧本展示区域 */}
          {script && (
            <Box
              id="script-preview"
              ref={scriptRef}
              sx={{
                display: "flex",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "center",
                  gap: '2px',
                  alignItems: 'stretch'
                }}>

                {/* 左侧 - 首个夜晚 */}
                {!isMobile && (
                  <Box sx={{
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
                    }
                  }}>
                    <NightOrder title="首个夜晚" actions={script.firstnight} />
                  </Box>
                )}

                {/* 中间 - 主要内容区域 */}
                <Paper
                  elevation={0}
                  sx={{
                    pb: 2,
                    pt: 2,
                    flex: 1,
                    maxWidth: '1200px',
                    backgroundImage: 'url(/bg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'none',
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

                  {/* 标题区域 */}
                  <Box sx={{ textAlign: 'center', mb: 2, position: 'relative', zIndex: 1, px: { xs: 1, sm: 2 } }}>
                    {/* 桌面端：右上角作者信息（绝对定位） */}
                    {!isMobile && script.author && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
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
                          剧本作者：{script.author}
                          <br />
                          支持7-15人
                        </Typography>
                      </Box>
                    )}

                    {/* 标题 */}
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

                    {/* 移动端：标题下方作者信息 */}
                    {isMobile && script.author && (
                      <Typography
                        sx={{
                          color: THEME_COLORS.paper.secondary,
                          fontSize: '0.75rem',
                          mt: 0.5,
                        }}
                      >
                        作者：{script.author} · 支持7-15人
                      </Typography>
                    )}
                  </Box>


                  {/* 角色区域 */}
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <CharacterSection
                      team="townsfolk"
                      characters={script.characters.townsfolk}
                      script={script}
                      onReorder={handleReorderCharacters}
                    />
                    <CharacterSection
                      team="outsider"
                      characters={script.characters.outsider}
                      script={script}
                      onReorder={handleReorderCharacters}
                    />
                    <CharacterSection
                      team="minion"
                      characters={script.characters.minion}
                      script={script}
                      onReorder={handleReorderCharacters}
                    />
                    <CharacterSection
                      team="demon"
                      characters={script.characters.demon}
                      script={script}
                      onReorder={handleReorderCharacters}
                    />
                    <CharacterSection
                      team="fabled"
                      characters={script.characters.fabled}
                      script={script}
                      onReorder={handleReorderCharacters}
                    />
                    <CharacterSection
                      team="traveler"
                      characters={script.characters.traveler}
                      script={script}
                      onReorder={handleReorderCharacters}
                    />
                  </Box>

                  {/* 移动端夜晚行动顺序 */}
                  {isMobile && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1.5, position: 'relative', zIndex: 1, px: { xs: 1, sm: 2, md: 3 } }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <NightOrder title="首个夜晚" actions={script.firstnight} isMobile={true} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <NightOrder title="其他夜晚" actions={script.othernight} isMobile={true} />
                      </Box>
                    </Box>
                  )}

                  {/* 特殊说明卡片 */}
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <SpecialRulesSection rules={script.specialRules} />
                  </Box>

                  {/* 底部署名 */}
                  {/* <Typography
                    sx={{
                      textAlign: 'center',
                      color: THEME_COLORS.paper.secondary,
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                      opacity: 0.7,
                    }}
                  >
                    @bigonion 剧本工具制作
                  </Typography> */}
                </Paper>

                {/* 右侧 - 其他夜晚 */}
                {!isMobile && (
                  <Box sx={{
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
                    }
                  }}>
                    <NightOrder title="其他夜晚" actions={script?.othernight || []} />
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* 空状态提示 */}
          {!script && (
            <Paper
              sx={{
                p: { xs: 4, sm: 6, md: 8 },
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: '#666',
                  fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                }}
              >
                请在上方输入剧本 JSON 并点击"生成剧本"按钮
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
