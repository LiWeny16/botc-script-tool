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
  IconButton,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
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
import { DecorativeFrame } from './components/DecorativeFrame';
import JinxSection from './components/JinxSection';
import StateRulesSection from './components/StateRulesSection';
import TitleEditDialog from './components/TitleEditDialog';
import SpecialRuleEditDialog from './components/SpecialRuleEditDialog';
import AddCustomRuleDialog from './components/AddCustomRuleDialog';
import { generateScript } from './utils/scriptGenerator';
import { THEME_COLORS, THEME_FONTS } from './theme/colors';
import { useTranslation } from './utils/i18n';
import { SEOManager } from './components/SEOManager';
import { scriptStore } from './stores/ScriptStore';
import { configStore } from './stores/ConfigStore';
import { getSpecialRuleTemplate } from './data/specialRules';
import { uiConfigStore } from './stores/UIConfigStore';
import UISettingsDrawer from './components/UISettingsDrawer';
import {
  GlobalStyles, // 👈 增加这个
} from '@mui/material';
import { initGlobalShortcuts, cleanupGlobalShortcuts, registerSaveCallback, unregisterSaveCallback, showSaveAlert, alertUseMui } from './utils/event';
import { OverlayScrollbars } from 'overlayscrollbars';

// 把它放在 App 组件上面，或者 theme 定义的下面
const printStyles = {
  '@media print': {
    // 1. 定义打印页面，去除浏览器默认边距
    '@page': {
      size: 'A4 portrait', // 推荐 A4 纵向
      margin: 0,           // 页面边距设为0，我们在容器内部控制
    },

    // 2. 隐藏页面上所有元素
    'body *': {
      visibility: 'hidden !important',
    },

    // 3. 仅显示你要打印的剧本核心区，以及它的所有子元素
    '#script-preview, #script-preview *, #main_script, #main_script *, #script-preview-2, #script-preview-2 *': {
      visibility: 'visible !important',
    },

    // 3.5. 移除Container的padding和margin
    '.MuiContainer-root': {
      padding: '0 !important',
      margin: '0 !important',
      maxWidth: '100% !important',
    },

    // 4. ⭐ 核心：设置第一页容器高度和布局
    '#script-preview': {
      // --- A. 定位和尺寸 ---
      position: 'relative !important',
      left: '0 !important',
      top: '0 !important',
      width: '100vw !important',  // 100% 打印视口宽度
      height: '100vh !important', // 100% 打印视口高度
      margin: '0 !important',
      padding: '0 !important',

      // --- B. 强制不溢出 ---
      overflow: 'hidden !important', // 关键！裁剪任何超出一页的内容

      // --- C. 分页 ---
      // 注意：只有当第二页存在时才强制分页
      pageBreakInside: 'avoid !important',
    },
    
    // 4.1 当存在第二页时，第一页强制分页
    '#script-preview:has(~ #script-preview-2)': {
      pageBreakAfter: 'always !important',
    },

    // 5. ⭐ 第二页容器
    '#script-preview-2': {
      position: 'relative !important',
      left: '0 !important',
      top: '0 !important',
      width: '100vw !important',
      height: '100vh !important',
      margin: '0 !important',
      padding: '0 !important',
      overflow: 'hidden !important',
      pageBreakBefore: 'always !important', // 第二页前强制分页
      pageBreakInside: 'avoid !important',
      marginTop: '0 !important', // 确保打印时没有上边距
    }
  },
};
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
  const [uiSettingsOpen, setUiSettingsOpen] = useState<boolean>(false);
  const [titleEditDialogOpen, setTitleEditDialogOpen] = useState<boolean>(false);
  const [specialRuleEditDialogOpen, setSpecialRuleEditDialogOpen] = useState<boolean>(false);
  const [editingSpecialRule, setEditingSpecialRule] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [titleHovered, setTitleHovered] = useState<boolean>(false);
  const [addCustomRuleDialogOpen, setAddCustomRuleDialogOpen] = useState<boolean>(false);
  const [jsonParseError, setJsonParseError] = useState<string>(''); // 添加 JSON 解析错误状态
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

  // 初始化全局快捷键（只初始化一次）
  useEffect(() => {
    // 初始化快捷键监听
    initGlobalShortcuts();

    // 清理函数
    return () => {
      unregisterSaveCallback();
      cleanupGlobalShortcuts();
    };
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 注册保存回调（当语言变化时更新）
  useEffect(() => {
    const handleSave = () => {
      // 直接保存 scriptStore 中的 originalJson
      const jsonToSave = scriptStore.originalJson;

      if (jsonToSave) {
        try {
          // 验证JSON格式
          JSON.parse(jsonToSave);

          // scriptStore.setOriginalJson 已经在 handleJsonChange 中调用了
          // 这里只需要显示保存成功的提示
          const stored = localStorage.getItem('botc-script-data');
          if (stored) {
            const message = language === 'zh-CN'
              ? `✓ 已保存到本地存储 (${new Date().toLocaleTimeString()})`
              : `✓ Saved to local storage (${new Date().toLocaleTimeString()})`;
            showSaveAlert(message, 2500);
          }
        } catch (error) {
          console.error('JSON格式错误:', error);
          const message = language === 'zh-CN' ? '✗ JSON格式错误，无法保存' : '✗ Invalid JSON format';
          alertUseMui(message, 2500, { kind: 'error' });
        }
      } else {
        console.log('没有可保存的JSON数据');
        const message = language === 'zh-CN' ? '⚠ 没有可保存的JSON' : '⚠ No JSON to save';
        alertUseMui(message, 2000, { kind: 'warning' });
      }
    };

    registerSaveCallback(handleSave);

    // 当语言变化时，需要重新注册回调
    return () => {
      unregisterSaveCallback();
    };
  }, [language]); // 只依赖 language

  // 处理JSON输入变化 - 实时同步到 scriptStore
  const handleJsonChange = (json: string) => {
    // 总是先更新 originalJson，保证输入框内容被保存
    scriptStore.setOriginalJson(json);

    try {
      // 尝试解析JSON，如果格式正确则自动生成剧本
      JSON.parse(json);

      // 清除之前的错误提示
      setJsonParseError('');

      // 自动生成剧本
      const generatedScript = generateScript(json, language);

      // 恢复自定义标题和作者
      if (customTitle) generatedScript.title = customTitle;
      if (customAuthor) generatedScript.author = customAuthor;

      // 更新剧本（不再调用 updateScript，避免重复保存）
      scriptStore.setScript(generatedScript);
    } catch (error) {
      // JSON 格式不正确时，显示错误提示但不阻止用户继续编辑
      const errorMessage = error instanceof Error ? error.message : t('input.errorParse');
      setJsonParseError(`${t('input.errorParse')}: ${errorMessage}`);
      console.log('JSON格式暂时不正确，等待用户继续编辑:', errorMessage);
    }
  };

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

  // 处理标题编辑
  const handleTitleEdit = () => {
    setTitleEditDialogOpen(true);
  };

  // 处理标题保存
  const handleTitleSave = (data: {
    title: string;
    titleImage?: string;
    subtitle?: string;
    author: string;
    playerCount?: string;
  }) => {
    scriptStore.updateTitleInfo(data);
  };

  // 处理特殊规则编辑
  const handleSpecialRuleEdit = (rule: any) => {
    setEditingSpecialRule(rule);
    setSpecialRuleEditDialogOpen(true);
  };

  // 处理特殊规则保存
  const handleSpecialRuleSave = (rule: any) => {
    scriptStore.updateSpecialRule(rule);
  };

  // 处理添加自定义规则
  const handleAddCustomRule = () => {
    setAddCustomRuleDialogOpen(true);
  };

  // 处理夜晚行动顺序重排
  const handleNightOrderReorder = (nightType: 'first' | 'other', oldIndex: number, newIndex: number) => {
    // 如果开启了官方ID解析模式，禁止重排
    if (configStore.config.officialIdParseMode) {
      console.log('官方ID解析模式已开启，禁止修改夜间行动顺序');
      return;
    }
    
    if (!script) return;

    const actions = nightType === 'first' ? [...script.firstnight] : [...script.othernight];

    // 移除前三个固定图标（Dusk, Mi, Di 或 Dusk）
    const fixedCount = nightType === 'first' ? 3 : 1;
    if (oldIndex < fixedCount || newIndex < fixedCount) return;

    // 获取被拖动的角色
    const draggedAction = actions[oldIndex];

    // 获取固定图标中最大的 index 值，确保所有角色都在其之后
    const minAllowedIndex = Math.max(...actions.slice(0, fixedCount).map(a => a.index));

    // 计算新的顺序值
    let newOrderValue: number;

    if (newIndex === fixedCount) {
      // 拖到固定图标之后的第一个位置
      const nextAction = actions[fixedCount];
      if (nextAction) {
        // 确保新值在固定图标之后，且在下一个角色之前
        const baseValue = Math.max(minAllowedIndex + 0.1, nextAction.index - 0.5);
        newOrderValue = Math.max(minAllowedIndex + 0.1, baseValue);
      } else {
        newOrderValue = minAllowedIndex + 0.5;
      }
    } else if (newIndex === actions.length - 1) {
      // 拖到最后面
      const prevAction = actions[actions.length - 2];
      newOrderValue = prevAction ? Math.max(prevAction.index + 0.5, minAllowedIndex + 0.5) : minAllowedIndex + 0.5;
    } else {
      // 拖到中间
      const prevAction = actions[newIndex - 1];
      const nextAction = actions[newIndex + (oldIndex < newIndex ? 1 : 0)];

      if (prevAction && nextAction) {
        // 计算中间值
        newOrderValue = (prevAction.index + nextAction.index) / 2;

        // 如果两个值相同或太接近，使用 +0.5 的策略
        if (Math.abs(newOrderValue - prevAction.index) < 0.01) {
          newOrderValue = prevAction.index + 0.5;
        }

        // 确保不小于最小允许值
        newOrderValue = Math.max(newOrderValue, minAllowedIndex + 0.1);
      } else if (prevAction) {
        newOrderValue = Math.max(prevAction.index + 0.5, minAllowedIndex + 0.5);
      } else if (nextAction) {
        newOrderValue = Math.max(nextAction.index - 0.5, minAllowedIndex + 0.5);
      } else {
        newOrderValue = minAllowedIndex + 0.5;
      }
    }

    // 最终确保新值不小于最小允许值
    newOrderValue = Math.max(newOrderValue, minAllowedIndex + 0.1);

    // 更新角色的夜晚顺序
    const characterImage = draggedAction.image;
    const character = script.all.find(c => c.image === characterImage);

    if (character) {
      const updates: Partial<Character> = {};
      if (nightType === 'first') {
        updates.firstNight = newOrderValue;
      } else {
        updates.otherNight = newOrderValue;
      }

      // 更新角色并同步到 JSON
      handleUpdateCharacter(character.id, updates);
    }
  };

  // 处理添加新规则
  const handleAddNewRule = (ruleType: 'special_rule', templateId?: string) => {
    if (ruleType === 'special_rule') {
      let newRule: any;

      if (templateId) {
        // 使用模板创建规则
        const template = getSpecialRuleTemplate(templateId);

        if (!template) {
          console.error('未找到特殊规则模板:', templateId);
          return;
        }

        newRule = {
          id: `custom_rule_${Date.now()}`,
          title: {
            'zh-CN': template.title['zh-CN'],
            'en': template.title['en'],
          },
          team: "special_rule",
          content: {
            'zh-CN': template.content['zh-CN'],
            'en': template.content['en'],
          },
          sourceType: 'special_rule' as const,
          sourceIndex: 0,
        };
      } else {
        // 创建空白规则
        newRule = {
          id: `custom_rule_${Date.now()}`,
          title: {
            'zh-CN': '新规则',
            'en': 'New Rule',
          },
          team: "special_rule",
          content: {
            'zh-CN': '请输入规则内容...',
            'en': 'Enter rule content...',
          },
          sourceType: 'special_rule' as const,
          sourceIndex: 0,
        };
      }

      // 添加到 script
      if (script) {
        const updatedScript = { ...script };
        updatedScript.specialRules = [...updatedScript.specialRules, newRule];
        if (updatedScript.secondPageRules) {
          updatedScript.secondPageRules = [...updatedScript.secondPageRules, newRule];
        }
        scriptStore.setScript(updatedScript);

        // 同步到 JSON
        try {
          const parsedJson = JSON.parse(originalJson);
          const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];
          jsonArray.push({
            id: newRule.id,
            team: 'special_rule',
            title: newRule.title,
            content: newRule.content,
          });
          const jsonString = JSON.stringify(jsonArray, null, 2);
          scriptStore.setOriginalJson(jsonString);
        } catch (error) {
          console.error('同步新规则到JSON失败:', error);
        }
      }
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

  const handleExportPDF = () => {
    // 触发浏览器打印功能，用户可以选择保存为PDF
    window.print();
  };

  // 清空所有数据
  const handleClear = () => {
    scriptStore.clear();
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={printStyles} /> {/* 👈 在这里添加 */}
      <SEOManager />
      <CssBaseline />
      <Box
        sx={{
          height: "100svh",
          backgroundColor: 'background.default',
        }}
      >
        <Container maxWidth="xl">
          {/* 输入面板 */}
          <InputPanel
            onGenerate={handleGenerate}
            onExportImage={handleExportPDF}
            onExportJson={handleExportJson}
            onShare={() => setShareDialogOpen(true)}
            onClear={handleClear}
            onOpenUISettings={() => setUiSettingsOpen(true)}
            onAddCustomRule={handleAddCustomRule}
            onJsonChange={handleJsonChange}
            hasScript={script !== null}
            currentJson={originalJson}
            jsonParseError={jsonParseError}
          />

          {/* 剧本展示区域 */}
          {script && (
            <Box
              id="script-preview"
              ref={scriptRef}
              sx={{
                display: "flex",
                width: "100%",
              }}
            >

              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  justifyContent: "center",
                  position: 'relative',

                }}>

                <CharacterImage
                  src="/imgs/images/flower3_2.png"
                  alt="左下角装饰花纹"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                    opacity: 1,
                    pointerEvents: 'none',
                    zIndex: 2,
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
                    opacity: 1,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />

                <CharacterImage
                  src="/imgs/images/flower7.png"
                  alt="右上角装饰花纹"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: -5,
                    maxWidth: { xs: '35%', sm: '20%', md: '20%' },
                    opacity: 1,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />

                <CharacterImage
                  src="/imgs/images/flower4_2.png"
                  alt="左上角装饰花纹"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: "rotate(180deg)",
                    maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                    opacity: 1,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />


                {/* 左侧 - 首个夜晚 */}
                {!isMobile && (
                  <Box sx={{
                    padding: 1.5,
                    flexShrink: 0,
                    position: 'relative',
                    backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: "center",
                    pt: '33.33%',
                    boxShadow: 'none',
                    '& > *': {
                      position: 'relative',
                      zIndex: 3,
                    }
                  }}>
                    <NightOrder
                      title={t('night.first')}
                      actions={script.firstnight}
                      disabled={configStore.config.officialIdParseMode}
                      onReorder={(oldIndex, newIndex) => handleNightOrderReorder('first', oldIndex, newIndex)}
                    />
                  </Box>
                )}

                {/* 中间 - 主要内容区域 */}
                <Paper
                  id="main_script"
                  elevation={0}
                  sx={{
                    pt: 2,
                    flex: 1,
                    backgroundImage: 'url(/imgs/images/main_back.jpg)',
                    backgroundSize: '100% 100%',          // 保持比例，铺满容器（可能略裁剪）
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: 0,
                    position: 'relative',
                    boxShadow: 'none',
                  }}
                >

                  {/* 标题区域 - 父容器带默认 px，内部使用绝对定位实现左/中/右布局 */}
                  <Box sx={{
                    textAlign: 'center',
                    mb: 0,
                    position: 'relative',
                    zIndex: 1,
                    px: { xs: 2, sm: 3, md: 4 }, // 默认左右内边距
                  }}>
                    {/* 标题与特殊规则父层：固定高度 */}
                    <Box
                      sx={{
                        position: 'relative',
                        height: uiConfigStore.titleHeight,
                        width: '100%',
                        display: 'block',
                        // 背景图案层
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundImage: "url(/imgs/images/pattern.png)",
                          backgroundSize: "48%",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          opacity: 0.6,
                          zIndex: 0,
                        },
                      }}
                    >
                      {/* 标题 - 绝对定位：当存在特殊规则时在1/3位置，否则居中 */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: script?.specialRules && script.specialRules.length > 0 ? '33.33%' : '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 1,
                          maxWidth: script?.specialRules && script.specialRules.length > 0 ? { xs: '28%', sm: '30%', md: '32%' } : { xs: '90%', sm: '80%', md: '70%' },
                          width: script?.specialRules && script.specialRules.length > 0 ? 'auto' : '100%',
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        {script.titleImage ? (
                          <Box
                            onMouseEnter={() => setTitleHovered(true)}
                            onMouseLeave={() => setTitleHovered(false)}
                            onDoubleClick={handleTitleEdit}
                            sx={{
                              position: 'relative',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              userSelect: 'none',
                              width: '100%',
                            }}
                          >
                            <CharacterImage
                              src={script.titleImage}
                              alt={script.title}
                              sx={{
                                maxWidth: '100%',
                                maxHeight: { xs: '120px', sm: '140px', md: '160px' },
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain',
                              }}
                            />
                            {titleHovered && (
                              <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', gap: 1 }}>
                                <IconButton onClick={(e) => { e.stopPropagation(); handleTitleEdit(); }} sx={{ backgroundColor: 'rgba(255,255,255,0.9)', '&:hover': { backgroundColor: 'rgba(255,255,255,1)' } }} size="small">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                        ) : (
                          <Box onMouseEnter={() => setTitleHovered(true)} onMouseLeave={() => setTitleHovered(false)} onDoubleClick={handleTitleEdit} sx={{ position: 'relative', cursor: 'pointer', display: 'flex', padding: { xs: 1, sm: 1.5, md: 2 }, borderRadius: 2, userSelect: 'none', width: '100%', justifyContent: 'center' }}>
                            <Typography
                              variant="h3"
                              component="div"
                              sx={{
                                fontFamily: uiConfigStore.scriptTitleFont,
                                fontWeight: 'bold',
                                fontSize: {
                                  xs: uiConfigStore.titleFontSizeXs,
                                  sm: uiConfigStore.titleFontSizeSm,
                                  md: uiConfigStore.titleFontSizeMd
                                },
                                lineHeight: 1.38,
                                m: 0,
                                whiteSpace: 'pre-wrap',
                                textAlign: 'center',
                                wordBreak: 'break-word',
                                // 文字镂空效果 - 透过文字看到背景图
                                background: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                // 添加描边效果增强可读性（可选）
                                // textShadow: '0 0 1px rgba(0,0,0,0.3)',
                                // 或者使用 -webkit-text-stroke 添加轮廓
                                // WebkitTextStroke: '0.5px rgba(0,0,0,0.2)',
                              }}
                            >
                              {script.title.split(/\\n|<br\s*\/?>/).map((line, index, array) => (<span key={index}>{line}{index < array.length - 1 && <br />}</span>))}
                            </Typography>
                            {titleHovered && (
                              <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', gap: 1 }}>
                                <IconButton onClick={(e) => { e.stopPropagation(); handleTitleEdit(); }} sx={{ backgroundColor: 'rgba(255,255,255,0.9)', '&:hover': { backgroundColor: 'rgba(255,255,255,1)' } }} size="small">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>

                      {/* 特殊规则 - 在2/3位置绝对定位（固定宽高，自动换行） */}
                      {script?.specialRules && script.specialRules.length > 0 && (
                        <Box sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '66.67%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 1,
                          overflow: 'hidden',
                        }}>
                          <SpecialRulesSection rules={script.specialRules} onDelete={(rule) => scriptStore.removeSpecialRule(rule)} onEdit={handleSpecialRuleEdit} />
                        </Box>
                      )}
                    </Box>

                    {/* 标题下方作者与支持人数（统一移动端/桌面端） */}
                    {(script?.author || script?.playerCount) && (
                      <Typography
                        sx={{
                          color: THEME_COLORS.paper.secondary,
                          fontSize: { xs: '0.75rem', sm: '0.95rem' },
                          mt: 0.5,
                        }}
                      >
                        {script.author ? `${t('script.author2')}：${script.author}` : ''}
                        {script.author && script.playerCount ? ' · ' : ''}
                        {script.playerCount ? `${t('script.playerCount')}：${script.playerCount}` : ''}
                      </Typography>
                    )}
                  </Box>


                  {/* 角色区域 */}
                  <Box sx={{
                    width: "100%",
                  }}>
                    <Box sx={{ px: 3, }}>
                      {/* 按固定顺序显示标准团队 */}
                      {['townsfolk', 'outsider', 'minion', 'demon'].map(team => (
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

                      {/* 在非双页面模式下显示传奇和旅行者 */}
                      {!uiConfigStore.config.enableTwoPageMode && ['fabled', 'traveler'].map(team => (
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

                      {/* 显示所有未知团队（非双页面模式） */}
                      {!uiConfigStore.config.enableTwoPageMode && Object.keys(script.characters)
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
                  </Box>

                  {/* 移动端夜晚行动顺序 */}
                  {isMobile && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1.5, position: 'relative', zIndex: 1, px: { xs: 1, sm: 2, md: 3 } }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <NightOrder
                          title={t('night.first')}
                          actions={script.firstnight}
                          isMobile={true}
                          disabled={configStore.config.officialIdParseMode}
                          onReorder={(oldIndex, newIndex) => handleNightOrderReorder('first', oldIndex, newIndex)}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <NightOrder
                          title={t('night.other')}
                          actions={script.othernight}
                          isMobile={true}
                          disabled={configStore.config.officialIdParseMode}
                          onReorder={(oldIndex, newIndex) => handleNightOrderReorder('other', oldIndex, newIndex)}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* 特殊说明卡片 */}
                  {/* <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <SpecialRulesSection rules={script.specialRules} />
                  </Box> */}
                  <CharacterImage
                    component="img"
                    src={"/imgs/images/back_tower.png"}
                    alt={"2323"}
                    sx={{
                      position: "absolute",
                      left: "0%",
                      bottom: "0",
                      display: "flex",
                      width: "20%",
                      zIndex: 0,
                      opacity: 0.4,
                      // width: 128,
                      // height: 128,
                    }}
                  />
                  <CharacterImage
                    component="img"
                    src={"/imgs/images/back_tower2.png"}
                    alt={"2323"}
                    sx={{
                      position: "absolute",
                      left: "36%",
                      bottom: "0%",
                      display: "flex",
                      width: "50%",
                      zIndex: 0,
                      opacity: 0.8,
                      // width: 128,
                      // height: 128,
                    }}
                  />
                  {/* 底部装饰框 */}
                  {/* <DecorativeFrame
                    text="*代表非首个夜晚"
                    width={{ xs: "90%", sm: "80%", md: "20%" }}
                    height={100}
                    containerPt={uiConfigStore.decorativeFrameSpacing.pt}
                    containerPb={uiConfigStore.decorativeFrameSpacing.pb}
                    borderColor="rgba(255, 255, 255, 0.3)"
                    cornerColor="#d4af37"
                    textColor="#000000"
                    fontSize={{ xs: '0.72rem', sm: '0.78rem', md: '1.2rem' }}
                    particleColors={['#d4af37', '#2d5c4f', '#b21e1d']}
                    showParticles={true}
                    showCorners={true}
                    decorativeSymbol="✦"
                  /> */}
                  <Box sx={{ height: "20vh" }}>

                  </Box>
                </Paper>

                {/* 右侧 - 其他夜晚 */}
                {!isMobile && (
                  <Box sx={{
                    padding: 1.5,
                    flexShrink: 0,
                    position: 'relative',
                    backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: "center",
                    pt: '33.33%',
                    boxShadow: 'none',
                    '& > *': {
                      position: 'relative',
                      zIndex: 3,
                    }
                  }}>
                    <NightOrder
                      title={t('night.other')}
                      actions={script?.othernight || []}
                      disabled={configStore.config.officialIdParseMode}
                      onReorder={(oldIndex, newIndex) => handleNightOrderReorder('other', oldIndex, newIndex)}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          )
          }

          {/* 第二页 - 双页面模式下显示相克规则、传奇、旅行者 */}
          {script && uiConfigStore.config.enableTwoPageMode && (
            <Box
              id="script-preview-2"
              sx={{
                display: "flex",
                width: "100%",
                mt: 4, // 屏幕上与第一页分隔
                '@media print': {
                  mt: 0, // 打印时取消间距
                }
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  minHeight: '100vh', // 确保容器也有足够高度
                  justifyContent: "center",
                  position: 'relative',
                  '@media print': {
                    height: '100vh !important',
                    minHeight: '100vh !important',
                  }
                }}>

                {/* 装饰花纹 - 复用第一页的装饰 */}
                <CharacterImage
                  src="/imgs/images/flower3_2.png"
                  alt="左下角装饰花纹"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                    opacity: 1,
                    pointerEvents: 'none',
                    zIndex: 2,
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
                    opacity: 1,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
                <CharacterImage
                  src="/imgs/images/flower7.png"
                  alt="右上角装饰花纹"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: -5,
                    maxWidth: { xs: '35%', sm: '20%', md: '20%' },
                    opacity: 1,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
                <CharacterImage
                  src="/imgs/images/flower4_2.png"
                  alt="左上角装饰花纹"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: "rotate(180deg)",
                    maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                    opacity: 1,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />

                {/* 左侧占位 */}
                {!isMobile && (
                  <Box sx={{
                    padding: 1.5,
                    flexShrink: 0,
                    position: 'relative',
                    backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                    width: '200px',
                    boxShadow: 'none',
                  }}>
                  </Box>
                )}

                {/* 中间 - 第二页内容区域 */}
                <Paper
                  elevation={0}
                  sx={{
                    pt: 2,
                    flex: 1,
                    backgroundImage: 'url(/imgs/images/main_back.jpg)',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: 0,
                    position: 'relative',
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh', // 确保第二页也是100vh高度
                    '@media print': {
                      height: '100vh !important',
                      minHeight: '100vh !important',
                    }
                  }}
                >
                  {/* 中间撕纸效果装饰 */}
                  <CharacterImage
                    component="img"
                    src={"/imgs/images/back_4.png"}
                    alt="Decorative torn paper"
                    sx={{
                      position: "relotive",
                      top: "0%",
                      width: "30%",
                      height: "auto",
                      zIndex: 1,
                      pointerEvents: 'none',
                      opacity: 0.95,
                    }}
                  />

                  {/* 第二页角色区域 */}
                  <Box sx={{
                    width: "100%",
                    px: 3,
                    position: 'relative',
                    zIndex: 2,
                  }}>
                    {/* 显示传奇和旅行者 */}
                    {['fabled', 'traveler'].map(team => (
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

                    {/* 显示所有未知团队（相克规则等） */}
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

                    {/* 相克规则专区 */}
                    <JinxSection script={script} />

                    {/* 第二页的特殊规则（state）*/}
                    {script.secondPageRules && script.secondPageRules.length > 0 && (
                      <StateRulesSection
                        rules={script.secondPageRules}
                        onDelete={(rule) => scriptStore.removeSpecialRule(rule)}
                        onEdit={handleSpecialRuleEdit}
                      />
                    )}

                    {/* <Box sx={{ height: "20vh" }}></Box> */}
                    <CharacterImage
                      component="img"
                      src={"/imgs/images/back_tower.png"}
                      alt={"2323"}
                      sx={{
                        position: "absolute",
                        left: "0%",
                        bottom: "0",
                        display: "flex",
                        width: "20%",
                        zIndex: 0,
                        opacity: 0.4,
                        // width: 128,
                        // height: 128,
                      }}
                    />
                    <CharacterImage
                      component="img"
                      src={"/imgs/images/back_tower2.png"}
                      alt={"2323"}
                      sx={{
                        position: "absolute",
                        left: "36%",
                        bottom: "0%",
                        display: "flex",
                        width: "50%",
                        zIndex: 0,
                        opacity: 0.8,
                        // width: 128,
                        // height: 128,
                      }}
                    />
                  </Box>


                </Paper>

                {/* 右侧占位 */}
                {!isMobile && (
                  <Box sx={{
                    padding: 1.5,
                    flexShrink: 0,
                    position: 'relative',
                    backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                    width: '200px',
                    boxShadow: 'none',
                  }}>
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
        </Container >
      </Box >

      {/* 分享对话框 */}
      < ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        script={script}
        originalJson={originalJson}
      />

      {/* 角色编辑对话框 */}
      < CharacterEditDialog
        open={editDialogOpen}
        character={editingCharacter}
        onClose={handleCloseEditDialog}
        onSave={handleUpdateCharacter}
      />

      {/* 角色库悬浮卡片 */}
      < CharacterLibraryCard
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

      {/* UI设置抽屉 */}
      <UISettingsDrawer
        open={uiSettingsOpen}
        onClose={() => setUiSettingsOpen(false)}
      />

      {/* 标题编辑对话框 */}
      <TitleEditDialog
        open={titleEditDialogOpen}
        title={script?.title || ''}
        titleImage={script?.titleImage}
        subtitle={script?.subtitle}
        author={script?.author || ''}
        playerCount={script?.playerCount || ''}
        onClose={() => setTitleEditDialogOpen(false)}
        onSave={handleTitleSave}
      />

      {/* 特殊规则编辑对话框 */}
      <SpecialRuleEditDialog
        open={specialRuleEditDialogOpen}
        rule={editingSpecialRule}
        onClose={() => setSpecialRuleEditDialogOpen(false)}
        onSave={handleSpecialRuleSave}
      />

      {/* 添加自定义规则对话框 */}
      <AddCustomRuleDialog
        open={addCustomRuleDialogOpen}
        onClose={() => setAddCustomRuleDialogOpen(false)}
        onAddRule={handleAddNewRule}
      />
    </ThemeProvider >
  );
});

export default App;
