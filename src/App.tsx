import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { observer } from 'mobx-react-lite';
import type { Script, Character } from './types';
import InputPanel from './components/InputPanel';
import CharacterSection from './components/CharacterSection';
import NightOrder from './components/NightOrder';
import SpecialRulesSection from './components/SpecialRulesSection';
import ShareDialog from './components/ShareDialog';
import CharacterEditDialog from './components/CharacterEditDialog';
import FloatingAddButton from './components/FloatingAddButton';
import CharacterLibraryCard from './components/CharacterLibraryCard';
import CharacterImage from './components/CharacterImage';
import { generateScript } from './utils/scriptGenerator';
import { THEME_COLORS, THEME_FONTS } from './theme/colors';
import { useTranslation } from './utils/i18n';
import { SEOManager } from './components/SEOManager';
import { scriptStore } from './stores/ScriptStore';
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

const App = observer(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useTranslation();
  const [shareDialogOpen, setShareDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [libraryCardOpen, setLibraryCardOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const scriptRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 从 MobX store 获取状态
  const { script, originalJson, customTitle, customAuthor } = scriptStore;

  // 初始化加载数据
  useEffect(() => {
    const initializeApp = async () => {
      // 检测URL中的json参数，如果存在则跳转到preview页面
      const jsonParam = searchParams.get('json');
      if (jsonParam) {
        navigate(`/repo/preview?json=${encodeURIComponent(jsonParam)}`);
        return;
      }

      // 如果没有存储的数据，加载默认示例
      if (!scriptStore.hasStoredData) {
        try {
          const defaultJson = await scriptStore.loadDefaultExample();
          handleGenerate(defaultJson);
        } catch (error) {
          console.error('加载默认示例失败:', error);
        }
      } else {
        // 如果有存储的数据，重新生成剧本（适应语言变化）
        if (originalJson) {
          const generatedScript = generateScript(originalJson, language);
          if (customTitle) generatedScript.title = customTitle;
          if (customAuthor) generatedScript.author = customAuthor;
          scriptStore.setScript(generatedScript);
        }
      }
      
      setIsInitialized(true);
    };

    initializeApp();
  }, [searchParams, navigate]);

  const handleGenerate = (json: string, title?: string, author?: string) => {
    const generatedScript = generateScript(json, language);

    // 覆写标题和作者
    if (title) generatedScript.title = title;
    if (author) generatedScript.author = author;

    // 更新 store
    scriptStore.updateScript({
      script: generatedScript,
      originalJson: json,
      customTitle: title || '',
      customAuthor: author || '',
    });
  };

  // 监听语言变化，重新生成剧本
  useEffect(() => {
    if (originalJson && isInitialized) {
      const generatedScript = generateScript(originalJson, language);
      
      // 恢复自定义标题和作者
      if (customTitle) generatedScript.title = customTitle;
      if (customAuthor) generatedScript.author = customAuthor;
      
      scriptStore.setScript(generatedScript);
    }
  }, [language, originalJson, customTitle, customAuthor, isInitialized]);

  // 更新角色顺序并同步到JSON
  const handleReorderCharacters = (team: string, newOrder: string[]) => {
    scriptStore.reorderCharacters(team, newOrder);
  };

  // 更新角色信息并同步到JSON
  const handleUpdateCharacter = (characterId: string, updates: Partial<Character>) => {
    scriptStore.updateCharacter(characterId, updates);
  };

  // 处理编辑角色
  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setEditDialogOpen(true);
  };

  // 关闭编辑对话框
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingCharacter(null);
  };

  // 处理添加角色到剧本
  const handleAddCharacter = (character: Character) => {
    scriptStore.addCharacter(character);
    // 不再自动关闭角色库
  };

  // 处理从剧本中删除角色
  const handleRemoveCharacter = (character: Character) => {
    scriptStore.removeCharacter(character);
  };

  // 将Script同步回JSON
  const syncScriptToJson = (updatedScript: Script) => {
    try {
      const parsedJson = JSON.parse(originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      // 创建新的JSON数组
      const newJsonArray: any[] = [];

      // 添加元数据
      const metaItem = jsonArray.find((item: any) => item.id === '_meta');
      if (metaItem) {
        newJsonArray.push(metaItem);
      }

      // 按照script中的顺序添加角色，并更新角色信息
      Object.keys(updatedScript.characters).forEach(team => {
        updatedScript.characters[team].forEach(character => {
          const originalItem = jsonArray.find((item: any) => item.id === character.id);
          if (originalItem) {
            // 合并原始数据和更新后的数据
            const updatedItem = {
              ...originalItem,
              name: character.name,
              ability: character.ability,
              team: character.team,
            };
            newJsonArray.push(updatedItem);
          } else {
            // 如果是新添加的角色，创建新的JSON项
            const newItem = {
              id: character.id,
              name: character.name,
              ability: character.ability,
              team: character.team,
              image: character.image,
              firstNight: character.firstNight || 0,
              otherNight: character.otherNight || 0,
              firstNightReminder: character.firstNightReminder || '',
              otherNightReminder: character.otherNightReminder || '',
              reminders: character.reminders || [],
              setup: character.setup || false,
            };
            newJsonArray.push(newItem);
          }
        });
      });

      // 添加相克规则和特殊规则
      jsonArray.forEach((item: any) => {
        if (item.team === 'a jinxed' || item.team === 'special_rule') {
          newJsonArray.push(item);
        }
      });

      const jsonString = JSON.stringify(newJsonArray, null, 2);
      scriptStore.setOriginalJson(jsonString);
    } catch (error) {
      console.error('同步JSON失败:', error);
    }
  };

  // 导出JSON文件
  const handleExportJson = () => {
    if (!originalJson) return;

    try {
      // 直接下载原始JSON文件
      const blob = new Blob([originalJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${script?.title || '剧本'}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出JSON失败:', error);
      alert(t('input.exportJsonFailed'));
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
      alert(t('input.exportImageFailed'));
    }
  };

  // 清空所有数据
  const handleClear = () => {
    scriptStore.clear();
  };

  return (
    <ThemeProvider theme={theme}>
      <SEOManager />
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
            onShare={() => setShareDialogOpen(true)}
            onClear={handleClear}
            hasScript={script !== null}
            currentJson={originalJson}
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
                  <CharacterImage
                    src="/imgs/images/flower3.png"
                    alt="装饰花纹"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                      opacity: 0.25,
                      pointerEvents: 'none',
                    }}
                  />
                  <CharacterImage
                    src="/imgs/images/flower4.png"
                    alt="装饰花纹"
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
                  <Box sx={{ textAlign: 'center', mb: 0, position: 'relative', zIndex: 1, px: { xs: 1, sm: 2 } }}>
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
                        {t('script.author')}：{script.author}
                        <br />
                        {script.playerCount ? `${t('script.playerCount')}：${script.playerCount}` : t('script.playerCount')}
                        </Typography>
                      </Box>
                    )}

                    {/* 标题 */}
                    {script.titleImage ? (
                      <CharacterImage
                        src={script.titleImage}
                        alt={script.title}
                        sx={{
                          maxWidth: { xs: '70%', sm: '50%', md: '40%' },
                          maxHeight: { xs: '80px', sm: '90px', md: '100px' },
                          objectFit: 'contain',
                          mb: { xs: 0.5, sm: 0.5 },
                        }}
                      />
                    ) : (
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
                    )}

                    {/* 移动端：标题下方作者信息 */}
                    {isMobile && script.author && (
                      <Typography
                        sx={{
                          color: THEME_COLORS.paper.secondary,
                          fontSize: '0.75rem',
                          mt: 0.5,
                        }}
                      >
                        {t('script.author2')}：{script.author}
                        {script.playerCount && ` · ${t('script.playerCount')}：${script.playerCount}`}
                      </Typography>
                    )}
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
                          onReorder={handleReorderCharacters}
                          onUpdateCharacter={handleUpdateCharacter}
                          onEditCharacter={handleEditCharacter}
                          onDeleteCharacter={handleRemoveCharacter}
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
                          onReorder={handleReorderCharacters}
                          onUpdateCharacter={handleUpdateCharacter}
                          onEditCharacter={handleEditCharacter}
                          onDeleteCharacter={handleRemoveCharacter}
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
                    <NightOrder title={t('night.other')} actions={script?.othernight || []} />
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
                {t('app.emptyState')}
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>

      {/* 分享对话框 */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        script={script}
        originalJson={originalJson}
      />

      {/* 角色编辑对话框 */}
      <CharacterEditDialog
        open={editDialogOpen}
        character={editingCharacter}
        onClose={handleCloseEditDialog}
        onSave={handleUpdateCharacter}
      />

      {/* 角色库悬浮卡片 */}
      <CharacterLibraryCard
        open={libraryCardOpen}
        onClose={() => setLibraryCardOpen(false)}
        onAddCharacter={handleAddCharacter}
        onRemoveCharacter={handleRemoveCharacter}
        selectedCharacters={script?.all || []}
      />

      {/* 悬浮添加按钮 */}
      <FloatingAddButton
        onClick={() => setLibraryCardOpen(!libraryCardOpen)}
        show={!!script} // 只要有剧本就显示
      />
    </ThemeProvider>
  );
});

export default App;
