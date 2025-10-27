import { makeAutoObservable } from 'mobx';
import { fontStorage } from '../utils/fontStorage';

// 自定义字体接口
export interface CustomFont {
  id: string;
  name: string;
  fontFamily: string;  // CSS font-family 名称
  dataUrl: string;     // base64 编码的字体文件
}

export interface UIConfig {
  // Night Order 背景
  nightOrderBackground: 'purple' | 'yellow' | 'green';

  // 双页面模式
  enableTwoPageMode: boolean;

  // 标题区域高度
  titleHeightMd: number;

  // 标题字体大小
  titleFontSize: {
    xs: string;
    sm: string;
    md: string;
  };

  // 字体设置
  fonts: {
    // 剧本标题字体
    scriptTitle: string;
    // 阵营分割文字字体
    teamDivider: string;
    // 角色卡片标题（角色名称）字体
    characterName: string;
    // 角色技能描述字体
    characterAbility: string;
    // Jinx相克规则字体
    jinxText: string;
    // 第一页特殊规则标题字体
    stateRuleTitle: string;
    // 第一页特殊规则内容字体
    stateRuleContent: string;
    // 第二页特殊规则标题字体
    specialRuleTitle: string;
    // 第二页特殊规则内容字体
    specialRuleContent: string;
  };

  // 自定义字体列表
  customFonts: CustomFont[];

  // CharacterCard 配置
  characterCard: {
    // 卡片配置
    cardPaddingX: number; // 水平内边距
    cardPaddingY: number; // 竖直内边距
    cardBorderRadius: number;
    cardGap: number;

    // 角色头像配置
    avatarWidthMd: number;
    avatarHeightMd: number;
    avatarBorderRadius: number;

    // 传奇角色图标配置
    fabledIconWidthMd: number;
    fabledIconHeightMd: number;
    fabledIconBorderRadius: number;

    // 文本区域配置
    textAreaGap: number;

    // 角色名字配置
    nameFontSizeMd: string;
    nameFontWeight: string;
    nameLineHeight: number;

    // 角色描述配置
    descriptionFontSizeMd: string;
    descriptionLineHeight: number;

    // 相克规则配置
    jinxGap: number;
    jinxPadding: number;
    jinxBorderRadius: number;
    jinxIconGap: number;

    // 相克规则图标
    jinxIconWidthMd: number;
    jinxIconHeightMd: number;
    jinxIconBorderRadius: number;

    // 相克规则文字
    jinxTextFontSizeMd: string;
    jinxTextLineHeight: number;
  };
}

const DEFAULT_UI_CONFIG: UIConfig = {
  nightOrderBackground: 'purple',

  enableTwoPageMode: false,

  titleHeightMd: 180,

  titleFontSize: {
    xs: '1.2rem',
    sm: '1.6rem',
    md: '4.5rem',
  },

  // 字体设置 - 默认使用现有字体
  fonts: {
    scriptTitle: 'jicao, Dumbledor, serif',
    teamDivider: 'jicao, Dumbledor, serif',
    characterName: '"Source Han Serif", "Source Han Serif SC", "Noto Serif CJK SC", "思源宋体", "Microsoft YaHei", "PingFang SC", serif',
    characterAbility: '"Source Han Serif", "Source Han Serif SC", "Noto Serif CJK SC", "思源宋体", "Microsoft YaHei", "PingFang SC", serif',
    jinxText: 'jicao, Dumbledor, serif',
    stateRuleTitle: 'jicao, Dumbledor, serif',
    stateRuleContent: 'jicao, Dumbledor, serif',
    specialRuleTitle: 'jicao, Dumbledor, serif',
    specialRuleContent: 'jicao, Dumbledor, serif',
  },

  // 自定义字体列表
  customFonts: [],

  characterCard: {
    cardPaddingX: 0.5,
    cardPaddingY: 0.5,
    cardBorderRadius: 1,
    cardGap: 1,

    avatarWidthMd: 99,
    avatarHeightMd: 79,
    avatarBorderRadius: 1,

    fabledIconWidthMd: 74,
    fabledIconHeightMd: 74,
    fabledIconBorderRadius: 1,

    textAreaGap: 0.3,

    nameFontSizeMd: '1.2rem',
    nameFontWeight: 'bold',
    nameLineHeight: 1.2,

    descriptionFontSizeMd: '0.9rem',
    descriptionLineHeight: 1.5,

    jinxGap: 0.3,
    jinxPadding: 0.3,
    jinxBorderRadius: 0.5,
    jinxIconGap: 0.5,

    jinxIconWidthMd: 45,
    jinxIconHeightMd: 45,
    jinxIconBorderRadius: 1,

    jinxTextFontSizeMd: '0.77rem',
    jinxTextLineHeight: 1.4,
  },
};

const STORAGE_KEY = 'botc-ui-config';

class UIConfigStore {
  config: UIConfig = DEFAULT_UI_CONFIG;

  constructor() {
    makeAutoObservable(this);
    this.loadConfig();
    this.loadCustomFontsFromIndexedDB(); // 从 IndexedDB 加载自定义字体
  }

  // 从 localStorage 加载配置
  loadConfig() {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        // 不从 localStorage 加载 customFonts，改用 IndexedDB
        const { customFonts, ...restConfig } = parsed;
        this.config = { ...DEFAULT_UI_CONFIG, ...restConfig };

        // 如果 localStorage 中有旧的字体数据，迁移到 IndexedDB
        if (customFonts && Array.isArray(customFonts) && customFonts.length > 0) {
          this.migrateFontsToIndexedDB(customFonts);
        }
      }
    } catch (error) {
      console.error('Failed to load UI config from localStorage:', error);
    }
  }

  // 迁移旧的字体数据到 IndexedDB
  private async migrateFontsToIndexedDB(fonts: CustomFont[]) {
    console.log(`Migrating ${fonts.length} fonts from localStorage to IndexedDB...`);
    try {
      for (const font of fonts) {
        await fontStorage.saveFont({
          ...font,
          createdAt: Date.now(),
        });
      }

      // 更新内存中的配置
      this.config.customFonts = fonts;

      // 重新保存配置（不包含 customFonts）
      this.saveConfig();

      console.log('Font migration completed successfully');
    } catch (error) {
      console.error('Failed to migrate fonts:', error);
    }
  }

  // 保存配置到 localStorage
  saveConfig() {
    try {
      // 保存配置时不包含 customFonts（它们存在 IndexedDB 中）
      const { customFonts, ...configToSave } = this.config;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
    } catch (error) {
      console.error('Failed to save UI config to localStorage:', error);
    }
  }

  // 更新配置
  updateConfig(updates: Partial<UIConfig>) {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  // 更新角色卡片配置
  updateCharacterCardConfig(updates: Partial<UIConfig['characterCard']>) {
    this.config.characterCard = { ...this.config.characterCard, ...updates };
    this.saveConfig();
  }

  // 更新字体配置
  updateFontConfig(updates: Partial<UIConfig['fonts']>) {
    this.config.fonts = { ...this.config.fonts, ...updates };
    this.saveConfig();
  }

  // 添加自定义字体
  async addCustomFont(font: CustomFont) {
    // 保存到 IndexedDB
    try {
      await fontStorage.saveFont({
        ...font,
        createdAt: Date.now(),
      });

      // 更新内存中的配置
      this.config.customFonts = [...this.config.customFonts, font];

      // 加载字体到页面
      this.loadSingleFont(font);

      console.log('Font saved to IndexedDB successfully:', font.name);
    } catch (error) {
      console.error('Failed to save font to IndexedDB:', error);
      throw error;
    }
  }

  // 删除自定义字体
  async removeCustomFont(fontId: string) {
    // 从 IndexedDB 删除
    try {
      await fontStorage.deleteFont(fontId);

      // 更新内存中的配置
      this.config.customFonts = this.config.customFonts.filter(f => f.id !== fontId);

      // 移除已加载的字体样式
      const styleId = `custom-font-${fontId}`;
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }

      console.log('Font removed from IndexedDB successfully:', fontId);
    } catch (error) {
      console.error('Failed to remove font from IndexedDB:', error);
      throw error;
    }
  }

  // 从 IndexedDB 加载所有自定义字体
  async loadCustomFontsFromIndexedDB() {
    try {
      const fonts = await fontStorage.getAllFonts();

      // 转换为 CustomFont 格式
      this.config.customFonts = fonts.map(font => ({
        id: font.id,
        name: font.name,
        fontFamily: font.fontFamily,
        dataUrl: font.dataUrl,
      }));

      // 加载所有字体到页面
      this.loadCustomFonts();

      console.log(`Loaded ${fonts.length} custom fonts from IndexedDB`);
    } catch (error) {
      console.error('Failed to load fonts from IndexedDB:', error);
      // 如果 IndexedDB 加载失败，继续使用空数组
      this.config.customFonts = [];
    }
  }

  // 加载单个字体到页面
  loadSingleFont(font: CustomFont) {
    const styleId = `custom-font-${font.id}`;
    // 如果已经加载则跳过
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @font-face {
        font-family: '${font.fontFamily}';
        src: url('${font.dataUrl}');
      }
    `;
    document.head.appendChild(style);
  }

  // 加载所有自定义字体到页面
  loadCustomFonts() {
    this.config.customFonts.forEach(font => {
      this.loadSingleFont(font);
    });
  }

  // 恢复默认设置
  async resetToDefault() {
    // 1. 重置配置
    this.config = { ...DEFAULT_UI_CONFIG };

    // 2. 清理所有自定义字体（从 IndexedDB）
    try {
      const fontIds = this.config.customFonts.map(f => f.id);
      for (const fontId of fontIds) {
        await fontStorage.deleteFont(fontId);

        // 移除已加载的字体样式
        const styleId = `custom-font-${fontId}`;
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
          existingStyle.remove();
        }
      }
      console.log('所有自定义字体已从 IndexedDB 清理');
    } catch (error) {
      console.error('清理自定义字体失败:', error);
    }

    // 3. 清空自定义字体列表
    this.config.customFonts = [];

    // 4. 删除 localStorage 中的配置，而不是保存默认值
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('已删除 localStorage 键:', STORAGE_KEY);
    } catch (error) {
      console.error('删除 UI 配置失败:', error);
    }
  }

  // Getters
  get nightOrderBackgroundUrl() {
    switch (this.config.nightOrderBackground) {
      case 'purple':
        return '/imgs/images/night_order/order_back_purple.png';
      case 'yellow':
        return '/imgs/images/night_order/order_back_yellow2.jpg';
      case 'green':
        return '/imgs/images/night_order/order_back_green.jpg';
      default:
        return '/imgs/images/night_order/order_back_purple.png';
    }
  }

  get titleHeight() {
    return this.config.titleHeightMd;
  }

  get titleFontSizeXs() {
    return this.config.titleFontSize.xs;
  }

  get titleFontSizeSm() {
    return this.config.titleFontSize.sm;
  }

  get titleFontSizeMd() {
    return this.config.titleFontSize.md;
  }

  // 字体配置 getters
  get scriptTitleFont() {
    return this.config.fonts.scriptTitle;
  }

  get teamDividerFont() {
    return this.config.fonts.teamDivider;
  }

  get characterNameFont() {
    return this.config.fonts.characterName;
  }

  get characterAbilityFont() {
    return this.config.fonts.characterAbility;
  }

  get jinxTextFont() {
    return this.config.fonts.jinxText;
  }

  get stateRuleTitleFont() {
    return this.config.fonts.stateRuleTitle;
  }

  get stateRuleContentFont() {
    return this.config.fonts.stateRuleContent;
  }

  get specialRuleTitleFont() {
    return this.config.fonts.specialRuleTitle;
  }

  get specialRuleContentFont() {
    return this.config.fonts.specialRuleContent;
  }

  // 获取所有可用字体列表（内置 + 自定义）
  get availableFonts() {
    const builtInFonts = [
      { value: 'jicao, Dumbledor, serif', label: 'Jicao + Dumbledor (默认)' },
      { value: '"Source Han Serif", "Source Han Serif SC", "Noto Serif CJK SC", "思源宋体", "Microsoft YaHei", "PingFang SC", serif', label: '思源宋体 (Source Han Serif)' },
      { value: '"Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif', label: '系统默认 (System Default)' },
      { value: 'sans-serif', label: '无衬线字体 (Sans-serif)' },
      { value: 'monospace', label: '等宽字体 (Monospace)' },
    ];

    const customFontOptions = this.config.customFonts.map(font => ({
      value: font.fontFamily,
      label: `${font.name} (自定义)`,
    }));

    return [...builtInFonts, ...customFontOptions];
  }
}

// 创建单例
export const uiConfigStore = new UIConfigStore();
