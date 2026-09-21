import { useCallback, useEffect, useState } from "react";
import { useStore } from "../store/store";
import { api, ApiError } from "../lib/api";
import { useResource } from "./useResource";
import { useToast } from "../components/ui/Toast";
import type { Milestone } from "../store/types";

export function useMilestonesForIdea(kaizenIdeaId: string | undefined) {
  const token = useStore((s) => s.token);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const refetch = useCallback(async () => {
    if (!token || !kaizenIdeaId) return;
    setLoading(true);
    setError(null);
    try {
      setMilestones(await api.milestones.listForIdea(token, kaizenIdeaId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load milestones.");
    } finally {
      setLoading(false);
    }
  }, [token, kaizenIdeaId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addMilestone = useCallback(async () => {
    if (!token || !kaizenIdeaId) return;
    try {
      const milestone = await api.milestones.create(token, kaizenIdeaId);
      setMilestones((prev) => [...prev, milestone]);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not add milestone.");
    }
  }, [token, kaizenIdeaId, toast]);

  const updateMilestone = useCallback(
    async (id: string, patch: Partial<Omit<Milestone, "id" | "kaizenId">>) => {
      if (!token) return;
      try {
        const updated = await api.milestones.update(token, id, patch);
        setMilestones((prev) => prev.map((m) => (m.id === id ? updated : m)));
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not update milestone.");
      }
    },
    [token, toast]
  );

  return { milestones, loading, error, refetch, addMilestone, updateMilestone };
}

export function useAllMilestones() {
  const { data, loading, error, refetch } = useResource(api.milestones.listAll);
  return { milestones: data ?? [], loading, error, refetch };
}
