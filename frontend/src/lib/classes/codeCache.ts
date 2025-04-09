import { CodeInfo } from "../classes/data";

const LOCAL_STORAGE_KEY = "codeCache";

let memoryCache: Record<string, CodeInfo | null> = {};
let pending: Record<string, Promise<CodeInfo | null> | undefined> = {};

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      memoryCache = JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Failed to load code cache from localStorage", e);
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(memoryCache));
  } catch (e) {
    console.warn("Failed to save code cache to localStorage", e);
  }
}

export const codeCache = {
  init() {
    loadFromStorage();
  },

  get(code: string): CodeInfo | null | undefined {
    return memoryCache[code];
  },

  async fetchOrGet(
    code: string,
    fetcher: () => Promise<CodeInfo>
  ): Promise<CodeInfo | null> {
    if (code in memoryCache) return memoryCache[code];

    if (pending[code]) return pending[code]!;

    const promise = fetcher()
      .then((data) => {
        memoryCache[code] = data;
        saveToStorage();
        delete pending[code];
        return data;
      })
      .catch((err) => {
        console.warn(`Failed to fetch code ${code}`, err);
        memoryCache[code] = null;
        saveToStorage();
        delete pending[code];
        return null;
      });

    pending[code] = promise;
    return promise;
  },
};
