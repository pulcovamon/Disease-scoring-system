import { getMethod } from "../classes/api";
import { Patient } from "../classes/catalogData";

type PatientQuery = { limit?: number; skip?: number; code?: string; id?: string | number };

type CacheEntry<T> = { data: T; timestamp: number };

const DEFAULT_KEY = "__all__";

function normalizeQuery(query?: PatientQuery): PatientQuery {
  if (!query) return {};
  const normalized: PatientQuery = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      normalized[key as keyof PatientQuery] = value as any;
    }
  });
  return normalized;
}

function buildKey(query?: PatientQuery): string {
  const normalized = normalizeQuery(query);
  const entries = Object.entries(normalized).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return DEFAULT_KEY;
  return entries.map(([k, v]) => `${k}:${v}`).join("|");
}

class CatalogCache {
  private patientsCache = new Map<string, CacheEntry<Patient[]>>();
  private countCache = new Map<string, CacheEntry<number>>();

  public getPatientsFromCache(query?: PatientQuery): Patient[] | null {
    const key = buildKey(query);
    const cached = this.patientsCache.get(key);
    return cached ? cached.data : null;
  }

  public hasPatients(query?: PatientQuery): boolean {
    const key = buildKey(query);
    return this.patientsCache.has(key);
  }

  private buildPatientsRequest(query?: PatientQuery) {
    const normalized = normalizeQuery(query);
    const { id, ...rest } = normalized;
    const url = id !== undefined ? `/catalog/lung-cancer/${id}` : "/catalog/lung-cancer";
    return { url, params: rest };
  }

  public async fetchPatients(query?: PatientQuery): Promise<Patient[]> {
    const key = buildKey(query);
    const { url, params } = this.buildPatientsRequest(query);
    const response = await getMethod<Patient[] | Patient>(url, params);
    const normalized = Array.isArray(response) ? response : [response];
    this.patientsCache.set(key, { data: normalized, timestamp: Date.now() });
    return normalized;
  }

  public getCountFromCache(code?: string): number | null {
    const key = code || DEFAULT_KEY;
    const cached = this.countCache.get(key);
    return cached ? cached.data : null;
  }

  public hasCount(code?: string): boolean {
    const key = code || DEFAULT_KEY;
    return this.countCache.has(key);
  }

  public async fetchCount(code?: string): Promise<number> {
    const key = code || DEFAULT_KEY;
    const response = await getMethod<number>("/catalog/size", code ? { code } : {});
    this.countCache.set(key, { data: response, timestamp: Date.now() });
    return response;
  }

  public keyForQuery(query?: PatientQuery): string {
    return buildKey(query);
  }
}

export const catalogCache = new CatalogCache();

export type { PatientQuery };
