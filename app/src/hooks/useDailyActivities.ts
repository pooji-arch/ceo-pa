import { useCallback } from "react";
import { api, ApiError } from "../lib/api";
import { useResource } from "./useResource";
import { useToast } from "../components/ui/Toast";
import type { DailyActivity } from "../store/types";

export function useDailyActivities() {
  const { data, loading, error, refetch, setData, token } = useResource(api.dailyActivities.list);
  const toast = useToast();

  const createDailyActivity = useCallback(
    async (input: { type: DailyActivity["type"]; desc: string; outcome: string }) => {
      if (!token) return;
      try {
        const activity = await api.dailyActivities.create(token, input);
        setData((prev) => (prev ? [activity, ...prev] : [activity]));
        toast("Activity logged");
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not log activity.");
      }
    },
    [token, setData, toast]
  );

  return { dailyActivities: data ?? [], loading, error, refetch, createDailyActivity };
}
