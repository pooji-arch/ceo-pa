import { Navigate } from "react-router-dom";
import { Card, CardHead } from "../components/ui/Card";
import { ErrorBanner, LoadingRow } from "../components/ui/AsyncState";
import { useStore } from "../store/store";
import { useAuditLog } from "../hooks/useAuditLog";

const ROLES = [
  { role: "CEO", access: "View relevant information, dashboards, approvals, decisions and key activities. Approves/rejects/postpones appointments." },
  { role: "CEO's PA", access: "Full operational access across the application, including full Kaizen access and user management." },
  { role: "GM / AGM", access: "Named in the source tracker as approvers/owners on some items — no separate login in this build." },
  { role: "Task Owner", access: "Named as the owner on Tasks & Follow-ups — no separate login in this build." },
  { role: "Kaizen Champion", access: "Named as the champion on Kaizen ideas — no separate login in this build." },
];

export default function Admin() {
  const role = useStore((s) => s.role);
  const { auditLog, loading, error, refetch } = useAuditLog();

  if (role !== "PA") return <Navigate to="/app/dashboard" replace />;

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-[14px] font-bold text-ink-900 font-display">User Roles &amp; Permissions</h3>
      <Card>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Role</th><th>Access</th></tr></thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.role} className="row-hover"><td className="font-bold whitespace-nowrap">{r.role}</td><td>{r.access}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <Card>
        <CardHead title="Audit Log" hint={`${auditLog.length} entries`} />
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="tbl">
            <thead><tr><th>Timestamp</th><th>User</th><th>Action</th></tr></thead>
            <tbody>
              {loading ? <LoadingRow colSpan={3} /> : auditLog.map((a) => (
                <tr key={a.id} className="row-hover"><td className="whitespace-nowrap">{a.ts}</td><td>{a.user}</td><td>{a.action}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
