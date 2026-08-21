
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'mira_ai_cache';
const STORE_NAME = 'kv';
const VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

export const persistence = {
  async set(key: string, value: any) {
    try {
      const db = await getDB();
      await db.put(STORE_NAME, value, key);
    } catch (err) {
      console.error('MIRA Iron Persistence Error (set):', err);
    }
  },

  async get(key: string) {
    try {
      const db = await getDB();
      return await db.get(STORE_NAME, key);
    } catch (err) {
      console.error('MIRA Iron Persistence Error (get):', err);
      return null;
    }
  },

  async delete(key: string) {
    try {
      const db = await getDB();
      await db.delete(STORE_NAME, key);
    } catch (err) {
      console.error('MIRA Iron Persistence Error (delete):', err);
    }
  },

  async clear() {
    try {
      const db = await getDB();
      await db.clear(STORE_NAME);
    } catch (err) {
      console.error('MIRA Iron Persistence Error (clear):', err);
    }
  }
};

/**
 * 🛡️ Helper resiliente para localStorage (proteção Safari modo anônimo e quota excedida)
 */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`MIRA safeStorage: Failed to set key "${key}":`, e);
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`MIRA safeStorage: Failed to remove key "${key}":`, e);
    }
  }
};
