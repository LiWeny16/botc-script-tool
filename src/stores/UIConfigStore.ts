import { makeAutoObservable } from 'mobx';
import { fontStorage } from '../utils/fontStorage';
import { towerImageStorage } from '../utils/towerImageStorage';

// Custom font interface

// Tower image interface
export interface TowerImage {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  isDefault: boolean;
}

export const DEFAULT_TOWERS: TowerImage[] = [
  { id: 'back_tower', url: '/imgs/images/background/back_tower.png', x: 0, y: 0, scale: 1.0, opacity: 0.4, isDefault: true },
  { id: 'back_tower2', url: '/imgs/images/background/back_tower2.png', x: 36, y: 0, scale: 1.0, opacity: 0.8, isDefault: true },
];

export interface CustomFont {
  id: string;
  name: string;
  fontFamily: string;  // CSS font-family name
  dataUrl: string;     // base64-encoded font file
}

export interface UIConfig {
  // Night Order background
  nightOrderBackground: 'purple' | 'yellow' | 'green' | 'pink';
  nightOrderBackgroundMode: 'official' | 'custom';
  customNightOrderBackground: string; // base64

  // Main background
  mainBackground: 'classic' | 'v2' | 'pink';
  mainBackgroundMode: 'official' | 'custom';
  customMainBackground: string; // base64

  // Theme (overrides individual settings)
  theme: 'none' | 'sakura';

  // Corner flower decoration
  cornerFlower: 'default' | 'cherry-blossom';

  // Two-page mode
  enableTwoPageMode: boolean;

  // Storyteller night order sheet
  enableStorytellerNightOrderSheet: boolean;
  storytellerNightSheet: {
  iconSize: number,
  textSize: number,
  spacing: number,
  groupGap: number,
  reminderFontSize: number,
  titleContentSpacing: number,
}

  // Title area height
  titleHeightMd: number;

  // Night order top spacing
  nightOrderTopSpacingAuto: boolean;  // AUTO centering
  nightOrderTopSpacing: number;       // manual px (used when AUTO is off)

  // Title font size
  titleFontSize: {
    xs: string;
    sm: string;
    md: string;
  };

  // Font settings
  fonts: {
    // Script title font
    scriptTitle: string;
    // Team divider font
    teamDivider: string;
    // Character card title (character name) font
    characterName: string;
    // Character ability font
    characterAbility: string;
    // Jinx text font
    jinxText: string;
    // Page 1 special rule title font
    stateRuleTitle: string;
    // Page 1 special rule content font
    stateRuleContent: string;
    // Page 2 special rule title font
    specialRuleTitle: string;
    // Page 2 special rule content font
    specialRuleContent: string;
  };

  // Page 1 special rule font size
  specialRuleTitleFontSize: string;
  specialRuleContentFontSize: string;

  // Custom font list
  customFonts: CustomFont[];

  // Tower images
  towerImages: TowerImage[];

  // Character card configuration
  characterCard: {
    // Card configuration
    cardPaddingX: number; // Horizontal padding
    cardPaddingY: number; // Vertical padding
    cardBorderRadius: number;
    cardGap: number;

    // Character avatar configuration
    avatarWidthMd: number;
    avatarHeightMd: number;
    avatarBorderRadius: number;

    // Fabled character icon configuration
    fabledIconWidthMd: number;
    fabledIconHeightMd: number;
    fabledIconBorderRadius: number;

    // Text area configuration
    textAreaGap: number;

    // Character name configuration
    nameFontSizeMd: string;
    nameFontWeight: string;
    nameLineHeight: number;

    // Character description configuration
    descriptionFontSizeMd: string;
    descriptionLineHeight: number;

    // Jinx rule configuration
    jinxGap: number;
    jinxPadding: number;
    jinxBorderRadius: number;
    jinxIconGap: number;

    // Jinx rule icon
    jinxIconWidthMd: number;
    jinxIconHeightMd: number;
    jinxIconBorderRadius: number;

    // Jinx text
    jinxTextFontSizeMd: string;
    jinxTextLineHeight: number;

    // Icon-only jinx position (when hideDuplicateJinx is on)
    iconOnlyJinxPosition: 'below-description' | 'next-to-name';
  };

}

const DEFAULT_UI_CONFIG: UIConfig = {
  nightOrderBackground: 'green',
  nightOrderBackgroundMode: 'official',
  customNightOrderBackground: '',




  mainBackground: 'classic',
  mainBackgroundMode: 'official',
  customMainBackground: '',

  theme: 'none',
  cornerFlower: 'default',
  enableTwoPageMode: false,
  enableStorytellerNightOrderSheet: true,
  storytellerNightSheet: {
    iconSize: 1.6,
    textSize: 1.02,
    groupGap: 1,
    spacing: 1,
    reminderFontSize: 1,
    titleContentSpacing: 18,
  },

  titleHeightMd: 100,

  nightOrderTopSpacingAuto: true,
  nightOrderTopSpacing: 20,   // vh, default 20vh

  titleFontSize: {
    xs: '1.2rem',
    sm: '1.6rem',
    md: '4.5rem',
  },

  // Font settings - default to existing fonts
  fonts: {
    scriptTitle: 'jicao, Dumbledor, serif',
    teamDivider: 'jicao, Dumbledor, serif',
    characterName: 'jicao, Dumbledor, serif',
    characterAbility: '"Source Han Serif", "Source Han Serif SC", "Noto Serif CJK SC", "思源宋体", "Microsoft YaHei", "PingFang SC", serif',
    jinxText: 'jicao, Dumbledor, serif',
    stateRuleTitle: 'jicao, Dumbledor, serif',
    stateRuleContent: 'jicao, Dumbledor, serif',
    specialRuleTitle: 'jicao, Dumbledor, serif',
    specialRuleContent: 'jicao, Dumbledor, serif',
  },

  // Page 1 special rule font size
  specialRuleTitleFontSize: '1rem',
  specialRuleContentFontSize: '0.85rem',

  // Custom font list
  customFonts: [],

  towerImages: [...DEFAULT_TOWERS],

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

    iconOnlyJinxPosition: 'next-to-name',
  },
};

const STORAGE_KEY = 'botc-ui-config';

class UIConfigStore {
  config: UIConfig = DEFAULT_UI_CONFIG;

  constructor() {
    makeAutoObservable(this);
    this.loadConfig();
    this.loadCustomFontsFromIndexedDB(); // Load custom fonts from IndexedDB
    this.loadTowerImagesFromIndexedDB(); // Load tower images from IndexedDB
  }

  // Load config from localStorage
  loadConfig() {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        // Do not load customFonts from localStorage, use IndexedDB instead
        const { customFonts, towerImages, ...restConfig } = parsed;
        this.config = {
          ...DEFAULT_UI_CONFIG,
          ...restConfig,
          storytellerNightSheet: {
            ...DEFAULT_UI_CONFIG.storytellerNightSheet,
            ...(restConfig.storytellerNightSheet || {}),
          },
        };

        // If localStorage has old font data, migrate to IndexedDB
        if (customFonts && Array.isArray(customFonts) && customFonts.length > 0) {
          this.migrateFontsToIndexedDB(customFonts);
        }
      }
    } catch (error) {
      console.error('Failed to load UI config from localStorage:', error);
    }
  }

  // Migrate old font data to IndexedDB
  private async migrateFontsToIndexedDB(fonts: CustomFont[]) {
    console.log(`Migrating ${fonts.length} fonts from localStorage to IndexedDB...`);
    try {
      for (const font of fonts) {
        await fontStorage.saveFont({
          ...font,
          createdAt: Date.now(),
        });
      }

      // Update in-memory config
      this.config.customFonts = fonts;

      // Re-save config (excluding customFonts)
      this.saveConfig();

      console.log('Font migration completed successfully');
    } catch (error) {
      console.error('Failed to migrate fonts:', error);
    }
  }

  // Save config to localStorage
  saveConfig() {
    try {
      // Save config without customFonts (they are stored in IndexedDB)
      const { customFonts, towerImages, ...configToSave } = this.config;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
    } catch (error) {
      console.error('Failed to save UI config to localStorage:', error);
    }
  }

  // Update config
  updateConfig(updates: Partial<UIConfig>) {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  // Update character card config
  updateCharacterCardConfig(updates: Partial<UIConfig['characterCard']>) {
    this.config.characterCard = { ...this.config.characterCard, ...updates };
    this.saveConfig();
  }

  // Update font config
  updateFontConfig(updates: Partial<UIConfig['fonts']>) {
    this.config.fonts = { ...this.config.fonts, ...updates };
    this.saveConfig();
  }
  updateStorytellerNightSheetConfig(updates: Partial<UIConfig['storytellerNightSheet']>) {
    this.config.storytellerNightSheet = {
      ...this.config.storytellerNightSheet,
      ...updates,
    };
    this.saveConfig();
  }

  setSpecialRuleTitleFontSize(value: number, options: { persist?: boolean } = {}) {
    const { persist = true } = options;
    const size = `${Number(value.toFixed(2))}rem`;
    this.config.specialRuleTitleFontSize = size;
    if (persist) {
      this.saveConfig();
    }
  }

  setSpecialRuleContentFontSize(value: number, options: { persist?: boolean } = {}) {
    const { persist = true } = options;
    const size = `${Number(value.toFixed(2))}rem`;
    this.config.specialRuleContentFontSize = size;
    if (persist) {
      this.saveConfig();
    }
  }

  // Add custom font
  async addCustomFont(font: CustomFont) {
    // Save to IndexedDB
    try {
      await fontStorage.saveFont({
        ...font,
        createdAt: Date.now(),
      });

      // Update in-memory config
      this.config.customFonts = [...this.config.customFonts, font];

      // Load font to page
      this.loadSingleFont(font);

      console.log('Font saved to IndexedDB successfully:', font.name);
    } catch (error) {
      console.error('Failed to save font to IndexedDB:', error);
      throw error;
    }
  }

  // Remove custom font
  async removeCustomFont(fontId: string) {
    // Delete from IndexedDB
    try {
      await fontStorage.deleteFont(fontId);

      // Update in-memory config
      this.config.customFonts = this.config.customFonts.filter(f => f.id !== fontId);

      // Remove loaded font style
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

  // Load all custom fonts from IndexedDB
  async loadCustomFontsFromIndexedDB() {
    try {
      const fonts = await fontStorage.getAllFonts();

      // Convert to CustomFont format
      this.config.customFonts = fonts.map(font => ({
        id: font.id,
        name: font.name,
        fontFamily: font.fontFamily,
        dataUrl: font.dataUrl,
      }));

      // Load all fonts to page
      this.loadCustomFonts();

      console.log(`Loaded ${fonts.length} custom fonts from IndexedDB`);
    } catch (error) {
      console.error('Failed to load fonts from IndexedDB:', error);
      // If IndexedDB loading fails, continue with empty array
      this.config.customFonts = [];
    }
  }

  // Load single font to page
  loadSingleFont(font: CustomFont) {
    const styleId = `custom-font-${font.id}`;
    // Skip if already loaded
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

  // Load all custom fonts to page
  loadCustomFonts() {
    this.config.customFonts.forEach(font => {
      this.loadSingleFont(font);
    });
  }

  // Reset to defaults
  async resetToDefault() {
    // 1. Reset config
    this.config = { ...DEFAULT_UI_CONFIG };

    // 2. Clean up all custom fonts (from IndexedDB)
    try {
      const fontIds = this.config.customFonts.map(f => f.id);
      for (const fontId of fontIds) {
        await fontStorage.deleteFont(fontId);

        // Remove loaded font style
        const styleId = `custom-font-${fontId}`;
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
          existingStyle.remove();
        }
      }
      console.log('All custom fonts cleaned from IndexedDB');
    } catch (error) {
      console.error('Failed to clean up custom fonts:', error);
    }

    // 3. Clear custom font list
    this.config.customFonts = [];

    // 4. Clean up all tower images from IndexedDB
    try {
      await towerImageStorage.clearAllImages();
      console.log('All tower images cleaned from IndexedDB');
    } catch (error) {
      console.error('Failed to clean up tower images:', error);
    }

    // 5. Delete localStorage config instead of saving defaults
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Deleted localStorage key:', STORAGE_KEY);
    } catch (error) {
      console.error('Failed to delete UI config:', error);
    }
  }

  // Getters
  
  // Load tower images from IndexedDB
  async loadTowerImagesFromIndexedDB() {
    try {
      const images = await towerImageStorage.getAllImages();
      if (images.length > 0) {
        this.config.towerImages = images.map(img => ({
          id: img.id,
          url: img.url,
          x: img.x,
          y: img.y,
          scale: img.scale,
          opacity: img.opacity,
          isDefault: img.isDefault,
        }));
      }
      console.log('Loaded', images.length, 'tower images from IndexedDB');
    } catch (error) {
      console.error('Failed to load tower images from IndexedDB:', error);
      // Keep defaults if loading fails
    }
  }

  // Add tower image
  async addTowerImage(image: TowerImage) {
    try {
      await towerImageStorage.saveImage({
        ...image,
        createdAt: Date.now(),
      });
      this.config.towerImages = [...this.config.towerImages, image];
      console.log('Tower image saved to IndexedDB:', image.id);
    } catch (error) {
      console.error('Failed to save tower image:', error);
      throw error;
    }
  }

  // Remove tower image
  async removeTowerImage(id: string) {
    try {
      await towerImageStorage.deleteImage(id);
      this.config.towerImages = this.config.towerImages.filter(img => img.id !== id);
      console.log('Tower image removed:', id);
    } catch (error) {
      console.error('Failed to remove tower image:', error);
      throw error;
    }
  }

  // Update tower image
  async updateTowerImage(id: string, updates: Partial<TowerImage>) {
    const index = this.config.towerImages.findIndex(img => img.id === id);
    if (index === -1) {
      console.warn('Tower image not found:', id);
      return;
    }
    const updated = { ...this.config.towerImages[index], ...updates };
    this.config.towerImages[index] = updated;
    // Persist url-bearing images to IndexedDB
    if (updated.url) {
      try {
        await towerImageStorage.saveImage({
          ...updated,
          createdAt: Date.now(),
        });
      } catch (error) {
        console.error('Failed to update tower image in IndexedDB:', error);
      }
    }
    console.log('Tower image updated:', id);
  }

  // Reset tower images to defaults
  async resetTowerImages() {
    try {
      await towerImageStorage.clearAllImages();
      this.config.towerImages = [...DEFAULT_TOWERS];
      // Re-save defaults to IndexedDB
      for (const img of DEFAULT_TOWERS) {
        await towerImageStorage.saveImage({
          ...img,
          createdAt: Date.now(),
        });
      }
      console.log('Tower images reset to defaults');
    } catch (error) {
      console.error('Failed to reset tower images:', error);
      this.config.towerImages = [...DEFAULT_TOWERS];
    }
  }

  // Getter for active tower images
  get activeTowerImages() {
    return this.config.towerImages;
  }


  get nightOrderBackgroundUrl() {
    // Theme override
    if (this.config.theme === 'sakura') {
      return '/imgs/images/night_order/order_back_pink.jpg';
    }
    // If custom mode with custom background, use custom background
    if (this.config.nightOrderBackgroundMode === 'custom' && this.config.customNightOrderBackground) {
      return this.config.customNightOrderBackground;
    }
    
    // Otherwise use official background
    switch (this.config.nightOrderBackground) {
      case 'purple':
        return '/imgs/images/night_order/order_back_purple.jpg';
      case 'yellow':
        return '/imgs/images/night_order/order_back_yellow2.jpg';
      case 'green':
        return '/imgs/images/night_order/order_back_green.jpg';
      case 'pink':
        return '/imgs/images/night_order/order_back_pink.jpg';
      default:
        return '/imgs/images/night_order/order_back_green.jpg';
    }
  }

  get mainBackgroundUrl() {
    // Theme override
    if (this.config.theme === 'sakura') {
      return '/imgs/images/background/back_pink.jpg';
    }
    // If custom mode with custom background, use custom background
    if (this.config.mainBackgroundMode === 'custom' && this.config.customMainBackground) {
      return this.config.customMainBackground;
    }

    // Otherwise use official background
    switch (this.config.mainBackground) {
      case 'v2':
        return '/imgs/images/background/back_v2.jpg';
      case 'pink':
        return '/imgs/images/background/back_pink.jpg';
      case 'classic':
      default:
        return '/imgs/images/background/back_classic.jpg';
    }
  }

  get cornerFlowers(): { bl: string; br: string; tr: string; tl: string } | null {
    // Theme override
    if (this.config.theme === 'sakura') {
      return {
        bl: '/imgs/images/sources/flowers/cherry-blossom3.png',
        br: '/imgs/images/sources/flowers/cherry-blossom3.png',
        tr: '/imgs/images/sources/flowers/cherry-blossom2.png',
        tl: '/imgs/images/sources/flowers/cherry-blossom3.png',
      };
    }
    switch (this.config.cornerFlower) {
      case 'cherry-blossom':
        return {
          bl: '/imgs/images/sources/flowers/cherry-blossom3.png',
          br: '/imgs/images/sources/flowers/cherry-blossom3.png',
          tr: '/imgs/images/sources/flowers/cherry-blossom2.png',
          tl: '/imgs/images/sources/flowers/cherry-blossom3.png',
        };
      case 'default':
      default:
        return null;
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

  // Font config getters
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

  get specialRuleTitleFontSize() {
    return this.config.specialRuleTitleFontSize;
  }

  get specialRuleContentFontSize() {
    return this.config.specialRuleContentFontSize;
  }

  // Get all available fonts (built-in + custom)
  get availableFonts() {
    const builtInFonts = [
      { value: 'jicao, Dumbledor, serif', label: 'Jicao + Dumbledor (Default)' },
      { value: '"Source Han Serif", "Source Han Serif SC", "Noto Serif CJK SC", "思源宋体", "Microsoft YaHei", "PingFang SC", serif', label: '思源宋体 (Source Han Serif)' },
      { value: '"Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif', label: 'System Default' },
      { value: 'sans-serif', label: 'Sans-serif' },
      { value: 'monospace', label: 'Monospace' },
    ];

    const customFontOptions = this.config.customFonts.map(font => ({
      value: font.fontFamily,
      label: `${font.name} (Custom)`,
    }));

    return [...builtInFonts, ...customFontOptions];
  }
}

// Create singleton
export const uiConfigStore = new UIConfigStore();
