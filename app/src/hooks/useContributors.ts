import { useCallback } from "react";
import { useStore } from "../store/store";
import { api, ApiError } from "../lib/api";
import { useResource } from "./useResource";
import { useToast } from "../components/ui/Toast";
import type { Contributor } from "../store/types";

// Matches the frontend's updateContributor rule: upserts by name so scoring
// someone for the first time doesn't need a separate "add contributor" step.
// KaizenIdea.contributors already arrives inline via useKaizenIdeas() (the
// backend includes them), so this just performs the write; callers patch
// their own local idea list with the returned row.
export function useUpsertContributor() {
  const token = useStore((s) => s.token);
  const toast = useToast();
  return useCallback(
    async (kaizenIdeaId: string, name: string, patch: Partial<Omit<Contributor, "name">>) => {
      if (!token) return null;
      try {
        return await api.contributors.upsert(token, kaizenIdeaId, name, patch);
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not save score.");
        return null;
      }
    },
    [token, toast]
  );
}

export function useLeaderboard() {
  const { data, loading, error, refetch } = useResource(api.leaderboard.list);
  return { leaderboard: data ?? [], loading, error, refetch };
}
