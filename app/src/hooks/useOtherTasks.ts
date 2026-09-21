import { useCallback } from "react";
import { api, ApiError } from "../lib/api";
import { useResource } from "./useResource";
import { useToast } from "../components/ui/Toast";

export function useOtherTasks() {
  const { data, loading, error, refetch, setData, token } = useResource(api.otherTasks.list);
  const toast = useToast();

  const createOtherTask = useCallback(
    async (input: { title: string; owner: string; due: string }) => {
      if (!token) return;
      try {
        const task = await api.otherTasks.create(token, input);
        setData((prev) => (prev ? [task, ...prev] : [task]));
        toast("Task added");
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not add task.");
      }
    },
    [token, setData, toast]
  );

  return { otherTasks: data ?? [], loading, error, refetch, createOtherTask };
}
