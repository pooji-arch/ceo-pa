import { api } from "../lib/api";
import { useResource } from "./useResource";

export function useAuditLog() {
  const { data, loading, error, refetch } = useResource(api.auditLog.list);
  return { auditLog: data ?? [], loading, error, refetch };
}
