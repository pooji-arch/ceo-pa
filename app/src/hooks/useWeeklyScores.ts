import { useCallback } from "react";
import { api, ApiError } from "../lib/api";
import { useResource } from "./useResource";
import { useToast } from "../components/ui/Toast";

export function useWeeklyScores() {
  const { data, loading, error, refetch, setData, token } = useResource(api.weeklyScores.list);
  const toast = useToast();

  // Matches the frontend's updateWeeklyScoreDay rule: patches just the one
  // day within the one week, leaving everything else untouched.
  const updateDay = useCallback(
    async (weekId: string, date: string, updates: { hours?: number; notes?: string }) => {
      if (!token) return;
      try {
        const day = await api.weeklyScores.updateDay(token, weekId, date, updates);
        setData((prev) =>
          prev?.map((w) => (w.id === weekId ? { ...w, days: w.days.map((d) => (d.date === date ? day : d)) } : w)) ?? prev
        );
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not save hours.");
      }
    },
    [token, setData, toast]
  );

  const addNextMonth = useCallback(async () => {
    if (!token) return;
    try {
      const newWeeks = await api.weeklyScores.nextMonth(token);
      setData((prev) => (prev ? [...prev, ...newWeeks] : newWeeks));
      toast(`Opened weekly scoring for ${newWeeks[0]?.monthLabel ?? "next month"}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not open next month.");
    }
  }, [token, setData, toast]);

  return { weeklyScores: data ?? [], loading, error, refetch, updateDay, addNextMonth };
}
