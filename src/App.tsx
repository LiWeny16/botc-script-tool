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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Print as PrintIcon,
  CheckCircleOutline as CheckIcon,
  InfoOutlined as InfoIcon,
  Image as ImageIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import type { Script, Character } from './types';
import InputPanel from './components/InputPanel';
import ShareDialog from './components/ShareDialog';
import CharacterEditDialog from './components/CharacterEditDialog';
import FloatingAddButton from './components/FloatingAddButton';
import CharacterLibraryCard from './components/CharacterLibraryCard';
import TitleEditDialog from './components/TitleEditDialog';
import SecondPageTitleEditDialog from './components/SecondPageTitleEditDialog';
import SpecialRuleEditDialog from './components/SpecialRuleEditDialog';
import AddCustomRuleDialog from './components/AddCustomRuleDialog';
import CustomJinxDialog from './components/CustomJinxDialog';
import ScriptRenderer from './components/ScriptRenderer';
import { generateScript } from './utils/scriptGenerator';
import { THEME_COLORS, THEME_FONTS } from './theme/colors';
import { useTranslation } from './utils/i18n';
import { SEOManager } from './components/SEOManager';
import { scriptStore } from './stores/ScriptStore';
import { configStore } from './stores/ConfigStore';
import { getSpecialRuleTemplate } from './data/specialRules';
import { CHARACTERS } from './data/characters';
import { CHARACTERS_EN } from './data/charactersEn';
import { normalizeCharacterId } from './data/characterIdMapping';
import UISettingsDrawer from './components/UISettingsDrawer';
import AboutDialog from './components/AboutDialog';
import {
  GlobalStyles,
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
    },

    // 6. 确保底部头像和文字框在打印时可见
    '#main_script .MuiBox-root': {
      visibility: 'visible !important',
    },

    // 7. 隐藏标题悬浮时的编辑按钮
    '.MuiIconButton-root': {
      display: 'none !important',
    },

    // 8. 隐藏第二页添加组件按钮
    '.second-page-add-component': {
      display: 'none !important',
    },

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
  const [replacingCharacter, setReplacingCharacter] = useState<Character | null>(null);
  const [libraryPosition, setLibraryPosition] = useState<{ x: number; y: number } | undefined>(undefined);
  const [uiSettingsOpen, setUiSettingsOpen] = useState<boolean>(false);
  const [titleEditDialogOpen, setTitleEditDialogOpen] = useState<boolean>(false);
  const [secondPageTitleEditDialogOpen, setSecondPageTitleEditDialogOpen] = useState<boolean>(false);
  const [specialRuleEditDialogOpen, setSpecialRuleEditDialogOpen] = useState<boolean>(false);
  const [editingSpecialRule, setEditingSpecialRule] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [addCustomRuleDialogOpen, setAddCustomRuleDialogOpen] = useState<boolean>(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState<boolean>(false);
  const [jsonParseError, setJsonParseError] = useState<string>(''); // 添加 JSON 解析错误状态
  const [customJinxDialogOpen, setCustomJinxDialogOpen] = useState<boolean>(false);
  const [printDialogOpen, setPrintDialogOpen] = useState<boolean>(false); // 添加打印对话框状态
  const [exportJsonDialogOpen, setExportJsonDialogOpen] = useState<boolean>(false); // 导出JSON选项对话框
  const [exportImageDialogOpen, setExportImageDialogOpen] = useState<boolean>(false); // 导出图片提示对话框
  const [unlockModeDialogOpen, setUnlockModeDialogOpen] = useState<boolean>(false); // 解锁模式对话框
  const [pendingEditCharacter, setPendingEditCharacter] = useState<Character | null>(null); // 待编辑的角色

  // 从 MobX store 获取状态
  const { script, originalJson, normalizedJson, customTitle, customAuthor } = scriptStore;

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
          try {
            const generatedScript = generateScript(originalJson, language);
            if (customTitle) generatedScript.title = customTitle;
            if (customAuthor) generatedScript.author = customAuthor;
            scriptStore.setScript(generatedScript); // setScript 会自动生成 normalizedJson
          } catch (error) {
            console.error('重新生成剧本失败:', error);
            // 如果存储的JSON有问题，清除它
            scriptStore.clear();
          }
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
              ? `已保存到本地存储`
              : `Saved to local storage`;
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

  // 处理JSON输入变化 - 只保存到 store，不自动解析
  const handleJsonChange = (json: string) => {
    // 只更新 originalJson，保存输入框内容，不触发自动生成
    scriptStore.setOriginalJson(json);

    // 清除之前的错误提示（因为用户可能正在编辑中）
    setJsonParseError('');
  };

  const handleGenerate = (json: string, title?: string, author?: string) => {
    try {
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

      // 清除错误提示
      setJsonParseError('');
    } catch (error) {
      // 生成失败时显示错误
      const errorMessage = error instanceof Error ? error.message : t('input.errorParse');
      setJsonParseError(`${t('input.errorParse')}: ${errorMessage}`);
    }
  };

  // 监听语言变化，重新生成剧本
  useEffect(() => {
    if (originalJson && isInitialized) {
      try {
        const generatedScript = generateScript(originalJson, language);

        // 恢复自定义标题和作者
        if (customTitle) generatedScript.title = customTitle;
        if (customAuthor) generatedScript.author = customAuthor;

        scriptStore.setScript(generatedScript); // setScript 会自动生成 normalizedJson
      } catch (error) {
        console.error('语言切换时重新生成剧本失败:', error);
        // 设置错误提示
        const errorMessage = error instanceof Error ? error.message : t('input.errorParse');
        setJsonParseError(`${t('input.errorParse')}: ${errorMessage}`);
      }
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
    // 检查是否处于只以id解析模式
    if (configStore.config.officialIdParseMode) {
      // 保存待编辑的角色，显示解锁提示对话框
      setPendingEditCharacter(character);
      setUnlockModeDialogOpen(true);
      return;
    }

    setEditingCharacter(character);
    setEditDialogOpen(true);
  };

  // 处理解锁模式并继续编辑
  const handleUnlockAndEdit = () => {
    // 解锁只以id解析模式
    configStore.setOfficialIdParseMode(false);
    setUnlockModeDialogOpen(false);

    // 继续编辑操作
    if (pendingEditCharacter) {
      setEditingCharacter(pendingEditCharacter);
      setEditDialogOpen(true);
      setPendingEditCharacter(null);

      // 显示解锁成功提示
      alertUseMui(`${t('dialog.unlockSuccess')}`, 2500, { kind: 'success' });
    }
  };

  // 关闭编辑对话框
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingCharacter(null);
  };

  // 处理添加角色到剧本
  const handleAddCharacter = (character: Character) => {
    // 如果是替换模式
    if (replacingCharacter) {
      // 使用 replaceCharacter 方法替换，保持原位置
      const success = scriptStore.replaceCharacter(replacingCharacter, character);
      if (success) {
        // 清除替换状态并关闭角色库
        setReplacingCharacter(null);
        setLibraryCardOpen(false);
      }
    } else {
      // 正常添加模式
      scriptStore.addCharacter(character);
      // 不再自动关闭角色库
    }
  };

  // 处理从剧本中删除角色
  const handleRemoveCharacter = (character: Character) => {
    scriptStore.removeCharacter(character);
  };

  // 处理更换角色
  const handleReplaceCharacter = (character: Character, position: { x: number; y: number }) => {
    setReplacingCharacter(character);
    setLibraryPosition(position);
    setLibraryCardOpen(true);
  };

  // 处理第一页标题编辑
  const handleTitleEdit = () => {
    setTitleEditDialogOpen(true);
  };

  // 处理第二页标题编辑
  const handleSecondPageTitleEdit = () => {
    setSecondPageTitleEditDialogOpen(true);
  };

  // 处理第一页标题保存
  const handleTitleSave = (data: {
    title: string;
    titleImage?: string;
    titleImageSize?: number;
    useTitleImage: boolean;
    author: string;
    playerCount?: string;
  }) => {
    scriptStore.updateTitleInfo({
      title: data.title,
      titleImage: data.titleImage,
      titleImageSize: data.titleImageSize,
      useTitleImage: data.useTitleImage,
      author: data.author,
      playerCount: data.playerCount,
    });
  };

  // 处理第二页标题保存
  const handleSecondPageTitleSave = (data: {
    title: string;
    titleImage?: string;
    fontSize?: number;
    imageSize?: number;
    useImage: boolean;
  }) => {
    scriptStore.updateTitleInfo({
      secondPageTitleText: data.title,
      secondPageTitleImage: data.titleImage,
      secondPageTitleFontSize: data.fontSize,
      secondPageTitleImageSize: data.imageSize,
      useSecondPageTitleImage: data.useImage,
    });
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
  const handleAddNewRule = (ruleType: 'special_rule' | 'custom_jinx', templateId?: string) => {
    if (ruleType === 'custom_jinx') {
      // 打开自定义相克对话框
      setAddCustomRuleDialogOpen(false);
      setCustomJinxDialogOpen(true);
      return;
    }

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



  // 导出JSON文件 - 显示选项对话框
  const handleExportJson = () => {
    if (!originalJson) return;
    setExportJsonDialogOpen(true);
  };

  // 导出选项1：当前语言的完整JSON（使用 normalizedJson）
  const handleExportCurrentLanguageJson = () => {
    if (!normalizedJson) return;

    try {
      // 使用 normalizedJson 作为基础，它已经包含了所有补全后的字段
      const parsedJson = JSON.parse(normalizedJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      // 当前语言的角色字典
      const currentDict = language === 'en' ? CHARACTERS_EN : CHARACTERS;

      // 辅助函数：根据name或id在角色库中查找
      const findCharacterInDict = (item: any): Character | null => {
        const itemObj = typeof item === 'string' ? { id: item } : item;

        // 1. 通过name查找
        if (itemObj.name && typeof itemObj.name === 'string') {
          for (const char of Object.values(currentDict)) {
            if ((char as Character).name === itemObj.name) {
              return char as Character;
            }
          }
        }

        // 2. 通过id查找（直接匹配）
        if (currentDict[itemObj.id]) {
          return currentDict[itemObj.id] as Character;
        }

        // 3. 通过标准化ID查找
        const normalizedId = normalizeCharacterId(itemObj.id, language);
        if (currentDict[normalizedId]) {
          return currentDict[normalizedId] as Character;
        }

        return null;
      };

      const newJsonArray: any[] = [];

      jsonArray.forEach((item: any) => {
        const itemObj = typeof item === 'string' ? { id: item } : item;

        // 保留 _meta、jinxed、special_rule
        if (itemObj.id === '_meta' || itemObj.team === 'a jinxed' || itemObj.team === 'special_rule') {
          newJsonArray.push(item);
        } else {
          // 尝试在当前语言的角色库中查找
          const foundChar = findCharacterInDict(item);

          if (foundChar) {
            // 找到了，使用当前语言的完整信息
            const fullCharJson: any = {
              id: foundChar.id,
              name: foundChar.name,
              ability: foundChar.ability,
              team: foundChar.team,
              image: foundChar.image,
            };

            // 添加可选字段
            if (foundChar.firstNight) fullCharJson.firstNight = foundChar.firstNight;
            if (foundChar.otherNight) fullCharJson.otherNight = foundChar.otherNight;
            if (foundChar.firstNightReminder) fullCharJson.firstNightReminder = foundChar.firstNightReminder;
            if (foundChar.otherNightReminder) fullCharJson.otherNightReminder = foundChar.otherNightReminder;
            if (foundChar.reminders && foundChar.reminders.length > 0) fullCharJson.reminders = foundChar.reminders;
            if (foundChar.remindersGlobal && foundChar.remindersGlobal.length > 0) fullCharJson.remindersGlobal = foundChar.remindersGlobal;
            if (foundChar.setup) fullCharJson.setup = foundChar.setup;

            newJsonArray.push(fullCharJson);
            console.log(`导出当前语言完整信息: ${foundChar.name}`);
          } else {
            // 找不到，保留原始JSON
            newJsonArray.push(item);
            console.warn(`无法在${language}库中找到，保留原始JSON:`, itemObj.id);
          }
        }
      });

      const jsonString = JSON.stringify(newJsonArray, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const langSuffix = language === 'zh-CN' ? t('export.chineseLang') : t('export.englishLang');
      const scriptName = script?.title || t('export.defaultScriptName');
      link.download = `${scriptName}-${langSuffix}${t('export.currentLangSuffix')}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setExportJsonDialogOpen(false);
    } catch (error) {
      console.error('导出当前语言JSON失败:', error);
      alert(t('input.exportJsonFailed'));
    }
  };

  // 导出选项2：原始JSON（不做任何处理）
  const handleExportOriginalJson = () => {
    if (!originalJson) return;

    try {
      const blob = new Blob([originalJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const scriptName = script?.title || t('export.defaultScriptName');
      link.download = `${scriptName}-${t('export.originalSuffix')}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setExportJsonDialogOpen(false);
    } catch (error) {
      console.error('导出原始JSON失败:', error);
      alert(t('input.exportJsonFailed'));
    }
  };

  // 导出选项3：仅官方ID（双语模式，找不到的保留完整JSON）（使用 normalizedJson）
  const handleExportIdOnlyJson = () => {
    if (!normalizedJson) return;

    try {
      // 使用 normalizedJson 作为基础，它已经包含了所有补全后的字段
      const parsedJson = JSON.parse(normalizedJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      // 辅助函数：在中英文库中查找官方ID
      const findOfficialIdByNameOrId = (item: any): { found: boolean; id?: string } => {
        const itemObj = typeof item === 'string' ? { id: item } : item;

        // 1. 通过name在中文库查找
        if (itemObj.name && typeof itemObj.name === 'string') {
          for (const [id, char] of Object.entries(CHARACTERS)) {
            if ((char as Character).name === itemObj.name) {
              return { found: true, id };
            }
          }

          // 2. 通过name在英文库查找
          for (const [id, char] of Object.entries(CHARACTERS_EN)) {
            if ((char as Character).name === itemObj.name) {
              return { found: true, id };
            }
          }
        }

        // 3. 通过id直接匹配
        if (CHARACTERS[itemObj.id]) {
          return { found: true, id: itemObj.id };
        }

        if (CHARACTERS_EN[itemObj.id]) {
          return { found: true, id: itemObj.id };
        }

        // 4. 通过标准化ID查找
        const normalizedId = normalizeCharacterId(itemObj.id, 'en');
        if (CHARACTERS[normalizedId] || CHARACTERS_EN[normalizedId]) {
          return { found: true, id: normalizedId };
        }

        return { found: false };
      };

      // 转换为仅ID格式
      const idOnlyArray: any[] = [];

      jsonArray.forEach((item: any) => {
        const itemObj = typeof item === 'string' ? { id: item } : item;

        // 保留 _meta、jinxed、special_rule 的完整信息
        if (itemObj.id === '_meta' || itemObj.team === 'a jinxed' || itemObj.team === 'special_rule') {
          idOnlyArray.push(item);
        } else {
          // 尝试查找官方ID
          const result = findOfficialIdByNameOrId(item);

          if (result.found && result.id) {
            // 找到了官方ID，导出ID字符串
            idOnlyArray.push(result.id);
            console.log(`✓ 找到官方ID: ${result.id}${itemObj.name ? ` (${itemObj.name})` : ''}`);
          } else {
            // 找不到官方ID，保留完整JSON
            idOnlyArray.push(item);
            console.warn(`⚠ 无法找到官方ID，保留完整JSON:`, itemObj.id, itemObj.name || '');
          }
        }
      });

      const jsonString = JSON.stringify(idOnlyArray, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const scriptName = script?.title || t('export.defaultScriptName');
      link.download = `${scriptName}-${t('export.idOnlySuffix')}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setExportJsonDialogOpen(false);
    } catch (error) {
      console.error('导出仅ID JSON失败:', error);
      alert(t('input.exportJsonFailed'));
    }
  };

  const handleExportPDF = () => {
    // 显示打印设置对话框
    setPrintDialogOpen(true);
  };

  const handleExportImage = () => {
    // 显示导出图片提示对话框
    setExportImageDialogOpen(true);
  };

  const handleConfirmPrint = () => {
    // 关闭对话框并触发打印
    setPrintDialogOpen(false);
    // 触发浏览器打印功能，用户可以选择保存为PDF
    window.print();
  };

  // 清空所有数据，但保留默认JSON框架
  const handleClear = () => {
    // 创建一个默认的JSON框架
    const defaultJson = JSON.stringify([
      {
        "id": "_meta",
        "author": "",
        "name": "Custom Your Script!"
      }
    ], null, 2);

    // 解析默认JSON，生成空剧本（这样加号按钮才能添加角色）
    try {
      const generatedScript = generateScript(defaultJson, language);
      scriptStore.updateScript({
        script: generatedScript,
        originalJson: defaultJson,
        customTitle: '',
        customAuthor: '',
      });
    } catch (error) {
      console.error('生成默认空剧本失败:', error);
      // 如果生成失败，至少保存JSON
      scriptStore.setOriginalJson(defaultJson);
      scriptStore.setScript(null);
      scriptStore.setCustomTitle('');
      scriptStore.setCustomAuthor('');
    }
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
            onExportPDF={handleExportPDF}
            onExportImage={handleExportImage}
            onExportJson={handleExportJson}
            onShare={() => setShareDialogOpen(true)}
            onClear={handleClear}
            onOpenUISettings={() => setUiSettingsOpen(true)}
            onAddCustomRule={handleAddCustomRule}
            onOpenAboutDialog={() => setAboutDialogOpen(true)}
            onJsonChange={handleJsonChange}
            hasScript={script !== null}
            currentJson={originalJson}
            jsonParseError={jsonParseError}
          />

          {/* 剧本展示区域 - 使用 ScriptRenderer 组件 */}
          {script && (
            <ScriptRenderer
              script={script}
              theme={theme}
              readOnly={false}
              onReorderCharacters={handleReorderCharacters}
              onUpdateCharacter={handleUpdateCharacter}
              onEditCharacter={handleEditCharacter}
              onDeleteCharacter={handleRemoveCharacter}
              onReplaceCharacter={handleReplaceCharacter}
              onTitleEdit={handleTitleEdit}
              onSecondPageTitleEdit={handleSecondPageTitleEdit}
              onSpecialRuleEdit={handleSpecialRuleEdit}
              onSpecialRuleDelete={(rule) => scriptStore.removeSpecialRule(rule)}
              onNightOrderReorder={handleNightOrderReorder}
            />
          )
          }

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
        normalizedJson={normalizedJson}
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
        onClose={() => {
          setLibraryCardOpen(false);
          setReplacingCharacter(null);
          setLibraryPosition(undefined);
        }}
        onAddCharacter={handleAddCharacter}
        onRemoveCharacter={handleRemoveCharacter}
        selectedCharacters={script?.all || []}
        initialTeam={replacingCharacter?.team}
        position={libraryPosition}
      />

      {/* 悬浮添加按钮 */}
      <FloatingAddButton
        onClick={() => setLibraryCardOpen(!libraryCardOpen)}
        show={!!script || !!originalJson} // 有剧本或有JSON输入时显示
      />

      {/* UI设置抽屉 */}
      <UISettingsDrawer
        open={uiSettingsOpen}
        onClose={() => setUiSettingsOpen(false)}
      />

      {/* 第一页标题编辑对话框 */}
      <TitleEditDialog
        open={titleEditDialogOpen}
        title={script?.title || ''}
        titleImage={script?.titleImage}
        titleImageSize={script?.titleImageSize}
        useTitleImage={script?.useTitleImage}
        author={script?.author || ''}
        playerCount={script?.playerCount || ''}
        onClose={() => setTitleEditDialogOpen(false)}
        onSave={handleTitleSave}
      />

      {/* 第二页标题编辑对话框 */}
      <SecondPageTitleEditDialog
        open={secondPageTitleEditDialogOpen}
        title={script?.secondPageTitleText || script?.title || ''}
        titleImage={script?.secondPageTitleImage}
        fontSize={script?.secondPageTitleFontSize}
        imageSize={script?.secondPageTitleImageSize}
        useImage={script?.useSecondPageTitleImage}
        defaultImageUrl={script?.titleImage}
        onClose={() => setSecondPageTitleEditDialogOpen(false)}
        onSave={handleSecondPageTitleSave}
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

      {/* 关于&致谢对话框 */}
      <AboutDialog
        open={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
      />

      {/* 自定义相克关系对话框 */}
      <CustomJinxDialog
        open={customJinxDialogOpen}
        onClose={() => setCustomJinxDialogOpen(false)}
        onSave={(characterA, characterB, description) => {
          scriptStore.addCustomJinx(characterA, characterB, description);
          setCustomJinxDialogOpen(false);
        }}
        characters={script?.all || []}
      />

      {/* 导出JSON选项对话框 */}
      <Dialog
        open={exportJsonDialogOpen}
        onClose={() => setExportJsonDialogOpen(false)}
        disableScrollLock={true}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pb: 2,
            pt: 3,
            px: 3,
          }}
        >
          <InfoIcon sx={{ fontSize: 32, color: '#1976d2' }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
            {t('dialog.exportJsonTitle')}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          <Typography variant="body2" sx={{ color: '#666', mb: 3, lineHeight: 1.7 }}>
            {t('dialog.exportJsonMessage')}
          </Typography>
          
          {/* 选项1: 原始JSON */}
          <Box
            sx={{
              mb: 2,
              p: 2.5,
              borderRadius: 2,
              border: '2px solid #fff3e0',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#ff9800',
                backgroundColor: '#fff3e0',
              }
            }}
            onClick={handleExportOriginalJson}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ff9800', mb: 1 }}>
              {t('dialog.exportOriginalJson')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
              {t('dialog.exportOriginalJsonDesc')}
            </Typography>
          </Box>
          <Box
            sx={{
              mb: 2,
              p: 2.5,
              borderRadius: 2,
              border: '2px solid #e3f2fd',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#1976d2',
                backgroundColor: '#e3f2fd',
              }
            }}
            onClick={handleExportCurrentLanguageJson}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
              {t('dialog.exportCurrentLangJson')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
              {t('dialog.exportCurrentLangJsonDesc')}
            </Typography>
          </Box>



          {/* 选项3: 仅官方ID */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '2px solid #e8f5e9',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#4caf50',
                backgroundColor: '#e8f5e9',
              }
            }}
            onClick={handleExportIdOnlyJson}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
              {t('dialog.exportIdOnly')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
              {t('dialog.exportIdOnlyDesc')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, backgroundColor: '#fafafa' }}>
          <Button
            onClick={() => setExportJsonDialogOpen(false)}
            sx={{
              px: 3,
              py: 1,
              fontWeight: 500,
              color: '#757575',
              '&:hover': {
                backgroundColor: '#eeeeee',
              }
            }}
          >
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 导出图片提示对话框 */}
      <Dialog
        open={exportImageDialogOpen}
        onClose={() => setExportImageDialogOpen(false)}
        disableScrollLock={true}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pb: 2,
            pt: 3,
            px: 3,
          }}
        >
          <ImageIcon sx={{ fontSize: 32, color: '#ff9800' }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
            {t('dialog.exportImageTitle')}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          <Typography variant="body1" sx={{ color: '#333', mb: 3, lineHeight: 1.8, fontSize: '1rem' }}>
            {t('dialog.exportImageMessage')}
          </Typography>

          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '2px solid #fff3e0',
              backgroundColor: '#fffbf5',
              mb: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6 }}>
              💡 {t('dialog.exportImageTip')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, backgroundColor: '#fafafa', gap: 1 }}>
          <Button
            onClick={() => setExportImageDialogOpen(false)}
            sx={{
              px: 3,
              py: 1,
              fontWeight: 500,
              color: '#757575',
              '&:hover': {
                backgroundColor: '#eeeeee',
              }
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            endIcon={<OpenInNewIcon />}
            onClick={() => {
              const url = language === 'zh-CN'
                ? 'https://www.ilovepdf.com/zh-cn/pdf_to_jpg'
                : 'https://www.ilovepdf.com/pdf_to_jpg';
              window.open(url, '_blank');
              setExportImageDialogOpen(false);
            }}
            sx={{
              px: 3,
              py: 1,
              fontWeight: 600,
              backgroundColor: '#ff9800',
              '&:hover': {
                backgroundColor: '#f57c00',
              }
            }}
          >
            {t('dialog.gotoILovePDF')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 打印设置对话框 */}
      <Dialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        disableScrollLock={true}
        aria-labelledby="print-dialog-title"
        aria-describedby="print-dialog-description"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle
          id="print-dialog-title"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pb: 2,
            pt: 3,
            px: 3,
          }}
        >
          <PrintIcon sx={{ fontSize: 32, color: '#1976d2' }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
            {t('dialog.printTitle')}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          {/* 提示信息 */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              p: 2.5,
              mb: 3,
              backgroundColor: '#f0f7ff',
              borderRadius: 2,
              border: '1px solid #d0e7ff',
            }}
          >
            <InfoIcon sx={{ color: '#1976d2', flexShrink: 0, mt: 0.2, fontSize: 22 }} />
            <Typography variant="body2" sx={{ color: '#1565c0', lineHeight: 1.7, fontSize: '0.9rem' }}>
              {t('dialog.printMessage')}
            </Typography>
          </Box>

          {/* 推荐设置列表 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* 浏览器推荐 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
              <CheckIcon sx={{ color: '#2e7d32', fontSize: 22, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.9rem' }}>
                {t('dialog.printBrowser')}
              </Typography>
            </Box>

            {/* 设备提示 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
              <CheckIcon sx={{ color: '#2e7d32', fontSize: 22, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.9rem' }}>
                {t('dialog.printDevice')}
              </Typography>
            </Box>

            {/* 分割线 */}
            <Box sx={{ my: 1.5, borderTop: '1px solid #e0e0e0' }} />

            {/* 高级设置标题 */}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#424242',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                mb: 1.5,
              }}
            >
              {language === 'zh-CN' ? '推荐配置' : 'Recommended Settings'}
            </Typography>

            {/* 设置项 */}
            <Box sx={{
              backgroundColor: '#fafafa',
              borderRadius: 2,
              p: 2.5,
              border: '1px solid #e0e0e0',
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* 纸张大小 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      minWidth: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#757575',
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.9rem' }}>
                    {t('dialog.printPaper')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      minWidth: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#757575',
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.9rem' }}>
                    {t('dialog.printScale')}
                  </Typography>
                </Box>

                {/* 页边距 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      minWidth: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#757575',
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.9rem' }}>
                    {t('dialog.printMargin')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5, backgroundColor: '#fafafa' }}>
          <Button
            onClick={() => setPrintDialogOpen(false)}
            sx={{
              px: 3,
              py: 1,
              fontWeight: 500,
              color: '#757575',
              '&:hover': {
                backgroundColor: '#eeeeee',
              }
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmPrint}
            variant="contained"
            autoFocus
            startIcon={<PrintIcon />}
            sx={{
              px: 3.5,
              py: 1,
              fontWeight: 600,
              backgroundColor: '#1976d2',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                backgroundColor: '#1565c0',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
              }
            }}
          >
            {t('dialog.printConfirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 解锁只以id解析模式确认对话框 */}
      <Dialog
        open={unlockModeDialogOpen}
        onClose={() => {
          setUnlockModeDialogOpen(false);
          setPendingEditCharacter(null);
        }}
        disableScrollLock={true}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pb: 2,
            pt: 3,
            px: 3,
          }}
        >
          <InfoIcon sx={{ fontSize: 32, color: '#ff9800' }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
            {t('dialog.unlockModeTitle')}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              p: 2.5,
              backgroundColor: '#fff8e1',
              borderRadius: 2,
              border: '1px solid #ffe0b2',
            }}
          >
            <Typography variant="body2" sx={{ color: '#e65100', lineHeight: 1.7, fontSize: '0.95rem' }}>
              {t('dialog.unlockModeMessage')}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#757575', mt: 2, fontSize: '0.9rem' }}>
            {t('dialog.unlockModeNote')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5, backgroundColor: '#fafafa' }}>
          <Button
            onClick={() => {
              setUnlockModeDialogOpen(false);
              setPendingEditCharacter(null);
            }}
            sx={{
              px: 3,
              py: 1,
              fontWeight: 500,
              color: '#757575',
              '&:hover': {
                backgroundColor: '#eeeeee',
              }
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleUnlockAndEdit}
            variant="contained"
            autoFocus
            sx={{
              px: 3.5,
              py: 1,
              fontWeight: 600,
              backgroundColor: '#ff9800',
              boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
              '&:hover': {
                backgroundColor: '#f57c00',
                boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)',
              }
            }}
          >
            {t('dialog.unlockAndEdit')}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider >
  );
});

export default App;
