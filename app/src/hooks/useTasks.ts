import { useCallback } from "react";
import { api, ApiError } from "../lib/api";
import { useResource } from "./useResource";
import { useToast } from "../components/ui/Toast";
import type { Priority, TaskStatus } from "../store/types";

export function useTasks() {
  const { data, loading, error, refetch, setData, token } = useResource(api.tasks.list);
  const toast = useToast();

  const createTask = useCallback(
    async (input: { title: string; description?: string; owner: string; dept: string; priority: Priority; due: string; followup: string; remarks?: string; outcome?: string; attachment?: string }) => {
      if (!token) return;
      try {
        const task = await api.tasks.create(token, input);
        setData((prev) => (prev ? [task, ...prev] : [task]));
        toast("Task created");
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not create task.");
      }
    },
    [token, setData, toast]
  );

  const updateTaskStatus = useCallback(
    async (id: string, status: TaskStatus, opts?: { reason?: string; revisedFollowup?: string }) => {
      if (!token) return;
      try {
        const task = await api.tasks.updateStatus(token, id, status, opts);
        setData((prev) => prev?.map((t) => (t.id === id ? task : t)) ?? prev);
        toast(`Task ${id} updated to ${status}`);
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not update task.");
      }
    },
    [token, setData, toast]
  );

  return { tasks: data ?? [], loading, error, refetch, createTask, updateTaskStatus };
}
