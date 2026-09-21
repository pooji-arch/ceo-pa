import { useCallback } from "react";
import { api, ApiError } from "../lib/api";
import { useResource } from "./useResource";
import { useToast } from "../components/ui/Toast";
import type { KaizenApproval, KaizenIdea, KaizenStatus } from "../store/types";

export function useKaizenIdeas() {
  const { data, loading, error, refetch, setData, token } = useResource(api.kaizen.list);
  const toast = useToast();

  const replaceOne = useCallback((updated: KaizenIdea) => {
    setData((prev) => prev?.map((k) => (k.id === updated.id ? updated : k)) ?? prev);
  }, [setData]);

  const createKaizen = useCallback(
    async (input: { dept: string; title: string; champion: string; date: string; status?: KaizenStatus }) => {
      if (!token) return;
      try {
        const idea = await api.kaizen.create(token, input);
        setData((prev) => (prev ? [idea, ...prev] : [idea]));
        toast("Kaizen idea created");
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not create Kaizen idea.");
      }
    },
    [token, setData, toast]
  );

  const updateKaizenStatus = useCallback(
    async (id: string, status: KaizenStatus) => {
      if (!token) return;
      try {
        replaceOne(await api.kaizen.updateStatus(token, id, status));
        toast(`Kaizen idea ${id} set to ${status}`);
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not update status.");
      }
    },
    [token, replaceOne, toast]
  );

  const updateKaizenApproval = useCallback(
    async (id: string, approval: KaizenApproval) => {
      if (!token) return;
      try {
        replaceOne(await api.kaizen.updateApproval(token, id, approval));
        toast(`Kaizen idea ${id} approval set to ${approval}`);
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not update approval.");
      }
    },
    [token, replaceOne, toast]
  );

  const updateKaizenProgress = useCallback(
    async (id: string, progress: number) => {
      if (!token) return;
      try {
        replaceOne(await api.kaizen.updateProgress(token, id, progress));
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not update progress.");
      }
    },
    [token, replaceOne, toast]
  );

  const updateKaizenDetails = useCallback(
    async (id: string, patch: Partial<Omit<KaizenIdea, "id" | "dept" | "deptCode" | "date" | "title" | "status" | "approval" | "progress" | "contributors">>) => {
      if (!token) return;
      try {
        replaceOne(await api.kaizen.updateDetails(token, id, patch));
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not save changes.");
      }
    },
    [token, replaceOne, toast]
  );

  const addExecutedBy = useCallback(
    async (id: string, name: string) => {
      if (!token) return;
      try {
        replaceOne(await api.kaizen.addExecutedBy(token, id, name));
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not add name.");
      }
    },
    [token, replaceOne, toast]
  );

  const removeExecutedBy = useCallback(
    async (id: string, name: string) => {
      if (!token) return;
      try {
        replaceOne(await api.kaizen.removeExecutedBy(token, id, name));
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not remove name.");
      }
    },
    [token, replaceOne, toast]
  );

  return {
    kaizenIdeas: data ?? [],
    loading,
    error,
    refetch,
    createKaizen,
    updateKaizenStatus,
    updateKaizenApproval,
    updateKaizenProgress,
    updateKaizenDetails,
    addExecutedBy,
    removeExecutedBy,
  };
}
