import { useEffect, useMemo, useState } from "react";
import { Patient, getPatientsSummary } from "../classes/catalogData";
import { catalogCache, PatientQuery } from "../store/catalogCache";

type PatientsResult = {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

type CountResult = {
  total: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useCatalogPatients(query: PatientQuery): PatientsResult {
  const queryKey = useMemo(() => catalogCache.keyForQuery(query), [query]);
  const initial = useMemo(() => catalogCache.getPatientsFromCache(query) || [], [queryKey]);
  const [patients, setPatients] = useState<Patient[]>(initial);
  const [loading, setLoading] = useState<boolean>(!catalogCache.hasPatients(query));
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async (showLoading: boolean = true) => {
    setError(null);
    if (showLoading) setLoading(true);
    try {
      const data = await catalogCache.fetchPatients(query);
      setPatients(data.map(p => ({ ...p, summary: getPatientsSummary(p) })));
    } catch (err) {
      console.error(err);
      setError("Failed to load patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const cached = catalogCache.getPatientsFromCache(query);
    if (cached) {
      setPatients(cached);
      setLoading(false);
    }

    fetchPatients(!cached).catch((err) => {
      if (!cancelled) {
        console.error(err);
        setError("Failed to load patients.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  return {
    patients,
    loading,
    error,
    refresh: fetchPatients,
  };
}

export function useCatalogCount(code?: string): CountResult {
  const key = useMemo(() => code || "__all__", [code]);
  const initial = useMemo(() => catalogCache.getCountFromCache(code) || 0, [key]);
  const [total, setTotal] = useState<number>(initial);
  const [loading, setLoading] = useState<boolean>(!catalogCache.hasCount(code));
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async (showLoading: boolean = true) => {
    setError(null);
    if (showLoading) setLoading(true);
    try {
      const data = await catalogCache.fetchCount(code);
      setTotal(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load catalog size.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const cached = catalogCache.getCountFromCache(code);
    if (cached !== null) {
      setTotal(cached);
      setLoading(false);
    }

    fetchCount(!cached).catch((err) => {
      if (!cancelled) {
        console.error(err);
        setError("Failed to load catalog size.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    total,
    loading,
    error,
    refresh: fetchCount,
  };
}
