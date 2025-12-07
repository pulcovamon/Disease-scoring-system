import { useEffect, useRef, useState } from "react";
import { CodeSearchResult, searchCodes } from "../services/codeSearch";

type UseCodeSearchOptions = {
  enabled?: boolean;
  debounceMs?: number;
  limit?: number;
};

export function useCodeSearch(query: string, options?: UseCodeSearchOptions) {
  const [results, setResults] = useState<CodeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = options?.enabled ?? true;
  const debounceMs = options?.debounceMs ?? 300;
  const limit = options?.limit ?? 15;

  const cacheRef = useRef<Map<string, CodeSearchResult[]>>(new Map());
  const requestIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!enabled) {
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const cached = cacheRef.current.get(trimmed);
    if (cached) {
      setResults(cached);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const currentId = ++requestIdRef.current;

    timeoutRef.current = setTimeout(() => {
      searchCodes(trimmed, limit)
        .then((data) => {
          if (requestIdRef.current !== currentId) return;
          cacheRef.current.set(trimmed, data);
          setResults(data);
        })
        .catch((err) => {
          if (requestIdRef.current !== currentId) return;
          console.error("Code search failed", err);
          setError("Failed to search codes.");
          setResults([]);
        })
        .finally(() => {
          if (requestIdRef.current === currentId) {
            setLoading(false);
          }
        });
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, enabled, debounceMs, limit]);

  return { results, loading, error, hasQuery: Boolean(query.trim()) };
}
