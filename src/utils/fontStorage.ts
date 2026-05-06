/**
 * Font storage utility - Store custom fonts using IndexedDB
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
   * Initialize database
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

        // Create object store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('fontFamily', 'fontFamily', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Save font
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
   * Get all fonts
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
   * Get font by ID
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
   * Delete font
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
   * Clear all fonts
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
   * Get total storage size (estimated)
   */
  async getStorageSize(): Promise<number> {
    const fonts = await this.getAllFonts();
    return fonts.reduce((total, font) => {
      // base64 string length roughly equals actual file size
      return total + (font.dataUrl?.length || 0);
    }, 0);
  }
}

// Create singleton
export const fontStorage = new FontStorage();
