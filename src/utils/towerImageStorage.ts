/**
 * Tower image storage utility - Store tower images using IndexedDB
 */

const DB_NAME = 'botc-tower-images-db';
const DB_VERSION = 1;
const STORE_NAME = 'tower-images';

export interface StoredTowerImage {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  isDefault: boolean;
  createdAt: number;
}

class TowerImageStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open TowerImage IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          objectStore.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
    });
  }

  async saveImage(image: StoredTowerImage): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.put(image);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error("Failed to save tower image:", request.error);
        reject(request.error);
      };
    });
  }

  async getAllImages(): Promise<StoredTowerImage[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error("Failed to get tower images:", request.error);
        reject(request.error);
      };
    });
  }

  async getImage(id: string): Promise<StoredTowerImage | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        console.error("Failed to get tower image:", request.error);
        reject(request.error);
      };
    });
  }

  async deleteImage(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error("Failed to delete tower image:", request.error);
        reject(request.error);
      };
    });
  }

  async clearAllImages(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error("Failed to clear tower images:", request.error);
        reject(request.error);
      };
    });
  }
}

export const towerImageStorage = new TowerImageStorage();
