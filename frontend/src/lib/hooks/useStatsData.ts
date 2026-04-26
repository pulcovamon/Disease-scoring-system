import { useEffect, useState } from "react";
import { getMethod } from "../classes/api";

export function useModelsCount(): { count: number; loading: boolean } {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMethod<any[]>("/model", { include_default: true, include_public: true })
      .then((data) => setCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setCount(0))
      .finally(() => setLoading(false));
  }, []);

  return { count, loading };
}

export function useUsersCount(): { count: number; loading: boolean } {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMethod<{ count: number }>("/auth/users/count")
      .then((data) => setCount(data?.count ?? 0))
      .catch(() => setCount(0))
      .finally(() => setLoading(false));
  }, []);

  return { count, loading };
}
