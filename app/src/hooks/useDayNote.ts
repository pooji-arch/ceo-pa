import { useCallback, useEffect, useState } from "react";
import { useStore } from "../store/store";
import { api, ApiError } from "../lib/api";
import { useResource } from "./useResource";
import type { DayNote } from "../store/types";

/** All saved notes, keyed by date — feeds the Weekly Schedule calendar grid,
 * which renders planned/actual pills across every visible day at once. */
export function useDayNotesList() {
  const { data, loading, error, refetch } = useResource(api.dayNotes.list);
  const byDate: Record<string, DayNote> = {};
  (data ?? []).forEach((n) => { byDate[n.date] = n; });
  return { dayNotes: byDate, loading, error, refetch };
}

/** Per-date fetch (not a list) — mirrors the mock store's dayNotes[date]
 * lookup, but backed by GET /day-notes/:date, which itself already falls
 * back to an empty note shape server-side when nothing has been saved yet. */
export function useDayNote(date: string | null) {
  const token = useStore((s) => s.token);
  const [note, setNote] = useState<DayNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token || !date) return;
    setLoading(true);
    setError(null);
    try {
      setNote(await api.dayNotes.get(token, date));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load this day's note.");
    } finally {
      setLoading(false);
    }
  }, [token, date]);

  useEffect(() => {
    if (date) refetch();
    else setNote(null);
  }, [date, refetch]);

  const setPlanned = useCallback(
    async (planned: string) => {
      if (!token || !date) return;
      try {
        setNote(await api.dayNotes.setPlanned(token, date, planned));
      } catch {
        // silent — the textarea already reflects the user's typed value locally
      }
    },
    [token, date]
  );

  const addActual = useCallback(
    async (text: string) => {
      if (!token || !date) return;
      try {
        setNote(await api.dayNotes.addActual(token, date, text));
      } catch {
        // no-op — caller keeps its input; user can retry
      }
    },
    [token, date]
  );

  const removeActual = useCallback(
    async (index: number) => {
      if (!token || !date) return;
      try {
        setNote(await api.dayNotes.removeActual(token, date, index));
      } catch {
        // no-op
      }
    },
    [token, date]
  );

  return { note, loading, error, refetch, setPlanned, addActual, removeActual };
}
