/**
 * 字体存储工具 - 使用 IndexedDB 存储自定义字体
 */

const DB_NAME = 'botc-fonts-db';
const DB_VERSION = 1;
const STORE_NAME = 'custom-fonts';

export interface StoredFont {
  id: string;
  name: string;
  fontFamily: string;
  dataUrl: string;
  createdAt: number;
}

class FontStorage {
  private db: IDBDatabase | null = null;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('fontFamily', 'fontFamily', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * 保存字体
   */
  async saveFont(font: StoredFont): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.put(font);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to save font:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 获取所有字体
   */
  async getAllFonts(): Promise<StoredFont[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Failed to get fonts:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 根据 ID 获取字体
   */
  async getFontById(id: string): Promise<StoredFont | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        console.error('Failed to get font:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 删除字体
   */
  async deleteFont(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to delete font:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 清空所有字体
   */
  async clearAllFonts(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to clear fonts:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 获取存储的总大小（估算）
   */
  async getStorageSize(): Promise<number> {
    const fonts = await this.getAllFonts();
    return fonts.reduce((total, font) => {
      // base64 字符串长度约等于实际文件大小
      return total + (font.dataUrl?.length || 0);
    }, 0);
  }
}

// 创建单例
export const fontStorage = new FontStorage();
