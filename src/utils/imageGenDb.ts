import type { GenerationMode } from './imageGenApi';
import type { FlowNode, FlowEdge } from '../stores/imageGenCanvasTypes';

const DB_NAME = 'botc-imagegen-db';
const DB_VERSION = 1;

export const STORES = {
  history: 'history',
  gallery: 'gallery',
  projects: 'projects',
} as const;

export interface CanvasSnapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
  prompt: string;
  selectedModel: string;
  generationMode: GenerationMode;
  selectedSize: string;
}

export interface HistoryRecord {
  id: string;
  projectId: string;
  index: number;
  label: string;
  snapshot: CanvasSnapshot;
  timestamp: number;
}

export interface GalleryRecord {
  id: string;
  dataUrl: string;
  promptSnippet?: string;
  model?: string;
  size?: string;
  createdAt: number;
}

export interface ProjectRecord {
  id: string;
  name: string;
  snapshot: CanvasSnapshot;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.history)) {
          const h = db.createObjectStore(STORES.history, { keyPath: 'id' });
          h.createIndex('projectId', 'projectId', { unique: false });
          h.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.gallery)) {
          const g = db.createObjectStore(STORES.gallery, { keyPath: 'id' });
          g.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.projects)) {
          const p = db.createObjectStore(STORES.projects, { keyPath: 'id' });
          p.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (os: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const os = transaction.objectStore(store);
        const req = fn(os);
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function addHistoryRecord(record: HistoryRecord): Promise<void> {
  await tx(STORES.history, 'readwrite', os => os.put(record));
}

export async function listHistoryByProject(projectId: string, limit = 80): Promise<HistoryRecord[]> {
  const all = await tx<HistoryRecord[]>(STORES.history, 'readonly', os => os.getAll());
  return all
    .filter(r => r.projectId === projectId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export async function trimHistory(projectId: string, keep = 50): Promise<void> {
  const rows = await listHistoryByProject(projectId, 200);
  const toDelete = rows.slice(keep);
  if (toDelete.length === 0) return;
  await openDb().then(db => {
    const transaction = db.transaction(STORES.history, 'readwrite');
    const os = transaction.objectStore(STORES.history);
    for (const row of toDelete) os.delete(row.id);
  });
}

export async function addGalleryItem(item: GalleryRecord): Promise<void> {
  await tx(STORES.gallery, 'readwrite', os => os.put(item));
}

export async function listGalleryItems(limit = 60): Promise<GalleryRecord[]> {
  const all = await tx<GalleryRecord[]>(STORES.gallery, 'readonly', os => os.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await tx(STORES.gallery, 'readwrite', os => os.delete(id));
}

export async function saveProject(project: ProjectRecord): Promise<void> {
  await tx(STORES.projects, 'readwrite', os => os.put(project));
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const all = await tx<ProjectRecord[]>(STORES.projects, 'readonly', os => os.getAll());
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  return tx<ProjectRecord | undefined>(STORES.projects, 'readonly', os => os.get(id));
}

export async function deleteProject(id: string): Promise<void> {
  await tx(STORES.projects, 'readwrite', os => os.delete(id));
}
