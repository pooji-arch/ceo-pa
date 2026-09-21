import { useCallback } from "react";
import { api, ApiError } from "../lib/api";
import { useResource } from "./useResource";
import { useToast } from "../components/ui/Toast";
import type { DietStatus } from "../store/types";

export function useDietQueries() {
  const { data, loading, error, refetch, setData, token } = useResource(api.dietQueries.list);
  const toast = useToast();

  const createDietQuery = useCallback(
    async (input: { query: string; requester: string; responsible: string; followup: string; remarks?: string; resolution?: string }) => {
      if (!token) return;
      try {
        const q = await api.dietQueries.create(token, input);
        setData((prev) => (prev ? [q, ...prev] : [q]));
        toast("Diet query logged");
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not log diet query.");
      }
    },
    [token, setData, toast]
  );

  const updateDietStatus = useCallback(
    async (id: string, status: DietStatus, resolution?: string) => {
      if (!token) return;
      try {
        const q = await api.dietQueries.updateStatus(token, id, status, resolution);
        setData((prev) => prev?.map((d) => (d.id === id ? q : d)) ?? prev);
        toast(`Diet query ${id} set to ${status}`);
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not update diet query.");
      }
    },
    [token, setData, toast]
  );

  return { dietQueries: data ?? [], loading, error, refetch, createDietQuery, updateDietStatus };
}
