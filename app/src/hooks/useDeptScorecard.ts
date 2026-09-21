import { useCallback, useEffect, useState } from "react";
import { useStore } from "../store/store";
import { api, ApiError, type DeptScorecard } from "../lib/api";

export function useDeptScorecard(month: string | undefined) {
  const token = useStore((s) => s.token);
  const [data, setData] = useState<DeptScorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api.deptScorecard.get(token, month));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load the department scorecard.");
    } finally {
      setLoading(false);
    }
  }, [token, month]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    availableMonths: data?.availableMonths ?? [],
    rows: data?.rows ?? [],
    loading,
    error,
    refetch,
  };
}
