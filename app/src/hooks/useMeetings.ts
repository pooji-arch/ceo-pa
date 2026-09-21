import { useCallback } from "react";
import { api, ApiError } from "../lib/api";
import { useResource } from "./useResource";
import { useToast } from "../components/ui/Toast";

export function useMeetings() {
  const { data, loading, error, refetch, setData, token } = useResource(api.meetings.list);
  const toast = useToast();

  const createMeeting = useCallback(
    async (input: { purpose: string; participants: string; date: string; time: string; agenda?: string }) => {
      if (!token) return;
      try {
        const meeting = await api.meetings.create(token, input);
        setData((prev) => (prev ? [meeting, ...prev] : [meeting]));
        toast("Meeting scheduled: " + meeting.purpose);
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not schedule meeting.");
      }
    },
    [token, setData, toast]
  );

  return { meetings: data ?? [], loading, error, refetch, createMeeting };
}

export function useActionPoints() {
  const { data, loading, error, refetch, setData, token } = useResource(api.actionPoints.list);
  const toast = useToast();

  const createActionPoint = useCallback(
    async (input: { meetingId: string; point: string; owner: string; due: string }) => {
      if (!token) return;
      try {
        await api.actionPoints.create(token, input);
        toast("Action point added");
        refetch();
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not add action point.");
      }
    },
    [token, refetch, toast]
  );

  // Matches the frontend's convertActionPointToTask rule: creates a new Task
  // and leaves the action point itself untouched, so no local list update here.
  const convertActionPointToTask = useCallback(
    async (id: string, point: string) => {
      if (!token) return false;
      try {
        await api.actionPoints.convertToTask(token, id);
        toast("Converted to task: " + point);
        return true;
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not convert to task.");
        return false;
      }
    },
    [token, toast]
  );

  return { actionPoints: data ?? [], loading, error, refetch, createActionPoint, convertActionPointToTask, setData };
}
