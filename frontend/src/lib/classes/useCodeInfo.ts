import { useEffect, useState } from "react";
import { CodeInfo } from "../classes/data";
import { codeCache } from "../classes/codeCache";
import { getMethod } from "../classes/api";

export function useCodeInfo(code: string) {
  const [info, setInfo] = useState<CodeInfo | null | undefined>(() => codeCache.get(code));
  const [loading, setLoading] = useState(info === undefined); // undefined = ještě nevíme
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isActive = true;

    if (info === undefined) {
      setLoading(true);
      codeCache
        .fetchOrGet(code, () => getMethod<CodeInfo>(`/code/${code}`))
        .then((data) => {
          if (!isActive) return;
          setInfo(data);
          setLoading(false);
        })
        .catch((err) => {
          if (!isActive) return;
          setError(err);
          setLoading(false);
        });
    }

    return () => {
      isActive = false;
    };
  }, [code]);

  return { info, loading, error };
}
