import { useMemo, useState } from "react";
import { Plus, UserPlus, Info, CalendarX2 } from "lucide-react";
import { Card, CardHead } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Pill, PriorityTag } from "../components/ui/Pill";
import { ErrorBanner, LoadingRow } from "../components/ui/AsyncState";
import { fmtDate } from "../lib/utils";
import { useStore } from "../store/store";
import { useAppointments, useVisitorHistory } from "../hooks/useAppointments";
import { AppointmentModal, UnplannedVisitorModal } from "../components/modals/SchedulingModals";
import { ReasonModal } from "../components/modals/ReasonModal";
import { Modal } from "../components/ui/Modal";
import { TextField, FieldRow } from "../components/ui/Field";
import type { ApprovalStatus } from "../store/types";

function RescheduleModal({
  id,
  appointments,
  onReschedule,
  onClose,
}: {
  id: string | null;
  appointments: ReturnType<typeof useAppointments>["appointments"];
  onReschedule: (id: string, date: string, time: string) => void;
  onClose: () => void;
}) {
  const appt = appointments.find((a) => a.id === id);
  const [date, setDate] = useState(appt?.date ?? "");
  const [time, setTime] = useState(appt?.time ?? "");

  if (!appt) return null;

  return (
    <Modal
      open={!!id}
      onClose={onClose}
      title={`Reschedule — ${appt.requester}`}
      width={400}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              onReschedule(appt.id, date, time);
              onClose();
            }}
          >
            Confirm
          </Button>
        </>
      }
    >
      <FieldRow>
        <TextField label="New Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField label="New Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </FieldRow>
    </Modal>
  );
}

export default function Appointments() {
  const role = useStore((s) => s.role);
  const isPA = role === "PA";
  const isCEO = role === "CEO";
  const { appointments, loading, error, refetch, createAppointment, actOnAppointment, rescheduleAppointment } = useAppointments();
  const { visitorHistory, logUnplannedVisitor } = useVisitorHistory();

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [unplannedOpen, setUnplannedOpen] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [reasonTarget, setReasonTarget] = useState<{ id: string; status: ApprovalStatus } | null>(null);

  const rows = useMemo(
    () =>
      appointments.filter(
        (a) =>
          (!statusFilter || a.approval === statusFilter) &&
          (!dateFilter || a.date === dateFilter) &&
          (!search || (a.requester + a.purpose + a.dept).toLowerCase().includes(search.toLowerCase()))
      ),
    [appointments, statusFilter, dateFilter, search]
  );

  const handleAction = (id: string, status: ApprovalStatus) => {
    if (status === "Rejected" || status === "Postponed") {
      setReasonTarget({ id, status });
      return;
    }
    if (status === "Approved") actOnAppointment(id, "Approved");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <select className="glass-input px-3 py-2 text-[12.5px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {["Pending", "Approved", "Rejected", "Postponed"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <input
          className="glass-input px-3 py-2 text-[12.5px] flex-1 min-w-[200px]"
          placeholder="Search requester, purpose, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="glass-input px-3 py-2 text-[12.5px]"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        {dateFilter && (
          <Button variant="ghost" size="sm" icon={<CalendarX2 size={13} />} onClick={() => setDateFilter("")}>
            Clear
          </Button>
        )}
        <div className="flex-1" />
        {isPA && (
          <>
            <Button variant="outline" size="sm" icon={<UserPlus size={14} />} onClick={() => setUnplannedOpen(true)}>
              Log Unplanned Visitor
            </Button>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setApptModalOpen(true)}>
              New Appointment Request
            </Button>
          </>
        )}
      </div>

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <Card>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Requester</th><th>Dept</th><th>Purpose</th><th className="whitespace-nowrap">Date / Time</th>
                <th>Priority</th><th>Approval</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow colSpan={7} /> : rows.length ? rows.map((a) => (
                <tr key={a.id} className="row-hover">
                  <td>
                    <div className="font-semibold">{a.requester}</div>
                    {a.visitors.length > 0 && (
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--muted-strong)" }}>
                        +{a.visitors.length} visitor{a.visitors.length === 1 ? "" : "s"}: {a.visitors.join(", ")}
                      </div>
                    )}
                  </td>
                  <td><span className="tag-dept">{a.dept}</span></td>
                  <td>{a.purpose}</td>
                  <td className="whitespace-nowrap">{fmtDate(a.date)}, {a.time}</td>
                  <td><PriorityTag priority={a.priority} /></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Pill status={a.approval} />
                      {a.reason && <span title={a.reason}><Info size={13} className="text-ink-300 cursor-help shrink-0" /></span>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex gap-1.5">
                      {isCEO && (
                        a.approval === "Pending" ? (
                          <>
                            <Button size="sm" variant="primary" onClick={() => handleAction(a.id, "Approved")}>Approve</Button>
                            <Button size="sm" variant="danger" onClick={() => handleAction(a.id, "Rejected")}>Reject</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleAction(a.id, "Postponed")}>Postpone</Button>
                        )
                      )}
                      {isPA && (
                        <Button size="sm" variant="outline" onClick={() => setRescheduleId(a.id)}>Reschedule</Button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={7} className="tbl-empty">No matching appointments.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="Visitor History" />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Visitor</th><th>Date</th><th>Purpose</th><th>Outcome</th></tr></thead>
            <tbody>
              {visitorHistory.map((v, i) => (
                <tr key={i} className="row-hover"><td>{v.name}</td><td>{fmtDate(v.date)}</td><td>{v.purpose}</td><td>{v.outcome}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AppointmentModal open={apptModalOpen} onClose={() => setApptModalOpen(false)} onCreate={createAppointment} appointments={appointments} />
      <UnplannedVisitorModal open={unplannedOpen} onClose={() => setUnplannedOpen(false)} onLog={logUnplannedVisitor} />
      <RescheduleModal id={rescheduleId} appointments={appointments} onReschedule={rescheduleAppointment} onClose={() => setRescheduleId(null)} />
      <ReasonModal
        open={!!reasonTarget}
        onClose={() => setReasonTarget(null)}
        title={`Reason for marking ${reasonTarget?.status ?? ""}`}
        reasonLabel="Reason (required by edge-case handling rules)"
        onSubmit={(reason) => {
          if (!reasonTarget) return;
          const status = reasonTarget.status;
          if (status === "Rejected" || status === "Postponed") {
            actOnAppointment(reasonTarget.id, status, reason || "(no reason given)");
          }
        }}
      />
    </div>
  );
}
