import { useCallback, useEffect, useState } from "react";
import { useStore } from "../store/store";
import { ApiError } from "../lib/api";

/** Generic authenticated GET-and-cache: fetches once the auth token is
 * available, re-fetches if the token changes (e.g. after logout/login), and
 * exposes setData so mutation helpers can update the cached list in place
 * instead of always re-fetching the whole collection. */
export function useResource<T>(fetcher: (token: string) => Promise<T>) {
  const token = useStore((s) => s.token);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
    // fetcher is a stable module-level function per call site (e.g. api.tasks.list) — only token should retrigger the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch, setData, token };
}
