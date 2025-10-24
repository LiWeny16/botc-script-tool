import { makeAutoObservable } from 'mobx';

export interface UIConfig {
  // Night Order 背景
  nightOrderBackground: 'purple' | 'yellow';
  
  // 双页面模式
  enableTwoPageMode: boolean;
  
  // 标题区域高度
  titleHeightMd: number;
  
  // CharacterCard 配置
  characterCard: {
    // 卡片配置
    cardPadding: number;
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
  
  characterCard: {
    cardPadding: 0.5,
    cardBorderRadius: 1,
    cardGap: 1,
    
    avatarWidthMd: 79,
    avatarHeightMd: 79,
    avatarBorderRadius: 1,
    
    fabledIconWidthMd: 60,
    fabledIconHeightMd: 60,
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
    jinxIconBorderRadius: 0.5,
    
    jinxTextFontSizeMd: '0.8rem',
    jinxTextLineHeight: 1.4,
  },
};

const STORAGE_KEY = 'botc-ui-config';

class UIConfigStore {
  config: UIConfig = DEFAULT_UI_CONFIG;

  constructor() {
    makeAutoObservable(this);
    this.loadConfig();
  }

  // 从 localStorage 加载配置
  loadConfig() {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        this.config = { ...DEFAULT_UI_CONFIG, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load UI config from localStorage:', error);
    }
  }

  // 保存配置到 localStorage
  saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
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

  // 恢复默认设置
  resetToDefault() {
    this.config = { ...DEFAULT_UI_CONFIG };
    this.saveConfig();
  }

  // Getters
  get nightOrderBackgroundUrl() {
    return this.config.nightOrderBackground === 'purple'
      ? '/imgs/images/night_order/order_back_purple.png'
      : '/imgs/images/night_order/order_back_yellow2.jpg';
  }

  get titleHeight() {
    return this.config.titleHeightMd;
  }
}

// 创建单例
export const uiConfigStore = new UIConfigStore();
