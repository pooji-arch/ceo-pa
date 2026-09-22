import { useCallback } from "react";
import { api, ApiError } from "../lib/api";
import { useResource } from "./useResource";
import { useToast } from "../components/ui/Toast";
import type { ApprovalStatus, Priority } from "../store/types";

export function useAppointments() {
  const { data, loading, error, refetch, setData, token } = useResource(api.appointments.list);
  const toast = useToast();

  const createAppointment = useCallback(
    async (input: { requester: string; dept: string; purpose: string; date: string; time: string; priority: Priority; approval?: ApprovalStatus; visitors?: string[]; force?: boolean }) => {
      if (!token) return;
      try {
        const appt = await api.appointments.create(token, input);
        setData((prev) => (prev ? [appt, ...prev] : [appt]));
        toast("Appointment request created");
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not create appointment.");
      }
    },
    [token, setData, toast]
  );

  const actOnAppointment = useCallback(
    async (id: string, status: "Approved" | "Rejected" | "Postponed", reason?: string) => {
      if (!token) return;
      try {
        const updated = await api.appointments.act(token, id, status, reason);
        setData((prev) => prev?.map((a) => (a.id === id ? updated : a)) ?? prev);
        toast(`Appointment ${id} marked ${status}`);
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not update appointment.");
      }
    },
    [token, setData, toast]
  );

  const rescheduleAppointment = useCallback(
    async (id: string, date: string, time: string) => {
      if (!token) return;
      try {
        const updated = await api.appointments.reschedule(token, id, date, time);
        setData((prev) => prev?.map((a) => (a.id === id ? updated : a)) ?? prev);
        toast(`Appointment ${id} rescheduled`);
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not reschedule appointment.");
      }
    },
    [token, setData, toast]
  );

  return {
    appointments: data ?? [],
    loading,
    error,
    refetch,
    createAppointment,
    actOnAppointment,
    rescheduleAppointment,
  };
}

export function useVisitorHistory() {
  const { data, loading, error, refetch, setData, token } = useResource(api.visitorHistory.list);
  const toast = useToast();

  const logUnplannedVisitor = useCallback(
    async (input: { name: string; purpose: string; decision: string; remarks: string }) => {
      if (!token) return;
      try {
        const { visitorHistoryEntry } = await api.unplannedVisitors.create(token, input);
        setData((prev) => (prev ? [visitorHistoryEntry, ...prev] : [visitorHistoryEntry]));
        toast("Unplanned visitor recorded: " + input.name);
      } catch (err) {
        toast(err instanceof ApiError ? err.message : "Could not record unplanned visitor.");
      }
    },
    [token, setData, toast]
  );

  return { visitorHistory: data ?? [], loading, error, refetch, logUnplannedVisitor };
}
