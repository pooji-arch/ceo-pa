import { useCallback } from "react";
import { api } from "../lib/api";
import { useResource } from "./useResource";

export function useNotifications() {
  const { data, loading, error, refetch, setData, token } = useResource(api.notifications.list);

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        const updated = await api.notifications.markRead(token, id);
        setData((prev) => prev?.map((n) => (n.id === id ? updated : n)) ?? prev);
      } catch {
        // silent — a failed mark-read just leaves the item showing unread
      }
    },
    [token, setData]
  );

  return { notifications: data ?? [], loading, error, refetch, markRead };
}
