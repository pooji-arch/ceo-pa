import { useMemo, useState } from "react";
import { Plus, UserPlus, Info, CalendarX2, CalendarDays, History, ArrowLeft, Pencil, CheckCircle2 } from "lucide-react";
import { Card, CardHead } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Pill, PriorityTag } from "../components/ui/Pill";
import { ErrorBanner, LoadingRow } from "../components/ui/AsyncState";
import { DateField, DatePicker } from "../components/ui/DatePicker";
import { fmtDate } from "../lib/utils";
import { canQuickTransition, canReschedule, HISTORY_STATUSES } from "../lib/appointmentStatus";
import { useStore } from "../store/store";
import { useAppointments, useVisitorHistory } from "../hooks/useAppointments";
import { AppointmentModal, UnplannedVisitorModal, EditAppointmentModal, DaySchedulePanel } from "../components/modals/SchedulingModals";
import { ReasonModal } from "../components/modals/ReasonModal";
import { Modal } from "../components/ui/Modal";
import { TextField, FieldRow } from "../components/ui/Field";
import type { Appointment, ApprovalStatus, VisitorHistoryEntry, Role } from "../store/types";

/** A "Pending" appointment that's actually been through Reschedule carries
 * this exact reason (set by the reschedule endpoint) — shown as its own
 * badge instead of the generic "Pending" one, without needing a fully
 * separate persisted status. */
function displayStatus(a: Appointment): string {
  if (a.approval === "Pending" && a.reason?.startsWith("Rescheduled by PA")) return "Rescheduled";
  return a.approval;
}

function RescheduleModal({
  id,
  appointments,
  onReschedule,
  onClose,
}: {
  id: string | null;
  appointments: Appointment[];
  onReschedule: (id: string, date: string, time: string) => void;
  onClose: () => void;
}) {
  const appt = appointments.find((a) => a.id === id);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Re-seed local state whenever a different appointment is opened.
  if (appt && appt.id !== loadedId) {
    setLoadedId(appt.id);
    setDate(appt.date);
    setTime(appt.time);
    setScheduleOpen(false);
  }

  if (!appt) return null;

  const close = () => { setLoadedId(null); onClose(); };

  return (
    <Modal
      open={!!id}
      onClose={close}
      title={`Reschedule — ${appt.requester}`}
      width={440}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              onReschedule(appt.id, date, time);
              close();
            }}
          >
            Confirm
          </Button>
        </>
      }
    >
      <FieldRow>
        <DateField label="New Date" value={date} onChange={setDate} />
        <TextField label="New Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </FieldRow>
      <Button variant="outline" size="sm" icon={<CalendarDays size={13} />} onClick={() => setScheduleOpen((v) => !v)} className="self-start">
        {scheduleOpen ? "Hide Schedule" : "View Calendar / Check Schedule"}
      </Button>
      {scheduleOpen && <DaySchedulePanel date={date} appointments={appointments} />}
    </Modal>
  );
}

interface HistoryRow {
  id: string;
  name: string;
  dept?: string;
  purpose: string;
  date: string;
  time?: string;
  status: string;
  visitors?: string[];
}

function buildHistoryRows(appointments: Appointment[], visitorHistory: VisitorHistoryEntry[]): HistoryRow[] {
  const fromAppointments: HistoryRow[] = appointments
    .filter((a) => HISTORY_STATUSES.includes(a.approval))
    .map((a) => ({ id: `apt-${a.id}`, name: a.requester, dept: a.dept, purpose: a.purpose, date: a.date, time: a.time, status: a.approval, visitors: a.visitors }));
  const fromUnplanned: HistoryRow[] = visitorHistory.map((v) => ({
    id: `vh-${v.id}`, name: v.name, purpose: v.purpose, date: v.date, time: v.time, status: "Unplanned Visit",
  }));
  return [...fromAppointments, ...fromUnplanned].sort(
    (a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? "")
  );
}

function VisitorHistoryView({
  appointments,
  visitorHistory,
  loading,
  error,
  onRetry,
  onBack,
}: {
  appointments: Appointment[];
  visitorHistory: VisitorHistoryEntry[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const allRows = useMemo(() => buildHistoryRows(appointments, visitorHistory), [appointments, visitorHistory]);
  const statusOptions = useMemo(() => Array.from(new Set(allRows.map((r) => r.status))).sort(), [allRows]);
  const rows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (!statusFilter || r.status === statusFilter) &&
          (!dateFilter || r.date === dateFilter) &&
          (!search ||
            (r.name + r.purpose + (r.dept ?? "") + (r.visitors ?? []).join(" ")).toLowerCase().includes(search.toLowerCase()))
      ),
    [allRows, statusFilter, dateFilter, search]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="glass-input px-3 py-2 text-[12.5px] flex-1 min-w-[200px]"
          placeholder="Search visitor, requester, purpose, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="glass-input px-3 py-2 text-[12.5px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {statusOptions.map((s) => <option key={s}>{s}</option>)}
        </select>
        <DatePicker value={dateFilter} onChange={setDateFilter} placeholder="Select date" className="w-[170px]" />
        {dateFilter && (
          <Button variant="ghost" size="sm" icon={<CalendarX2 size={13} />} onClick={() => setDateFilter("")}>
            Clear
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="outline" icon={<ArrowLeft size={14} />} onClick={onBack}>Back to Appointments</Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={onRetry} />}

      <Card>
        <CardHead title="Visitor History" hint={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr><th>Name</th><th>Dept</th><th>Purpose</th><th className="whitespace-nowrap">Date / Time</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow colSpan={5} /> : rows.length ? rows.map((r) => (
                <tr key={r.id} className="row-hover">
                  <td>
                    <div className="font-semibold">{r.name}</div>
                    {r.visitors && r.visitors.length > 0 && (
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--muted-strong)" }}>
                        +{r.visitors.length} visitor{r.visitors.length === 1 ? "" : "s"}: {r.visitors.join(", ")}
                      </div>
                    )}
                  </td>
                  <td>{r.dept ? <span className="tag-dept">{r.dept}</span> : "—"}</td>
                  <td>{r.purpose}</td>
                  <td className="whitespace-nowrap">{fmtDate(r.date)}{r.time ? `, ${r.time}` : ""}</td>
                  <td><Pill status={r.status} /></td>
                </tr>
              )) : <tr><td colSpan={5} className="tbl-empty">No matching history.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function Appointments() {
  const role = useStore((s) => s.role) as Role;
  const isPA = role === "PA";
  const isCEO = role === "CEO";
  const { appointments, loading, error, refetch, createAppointment, actOnAppointment, rescheduleAppointment, editAppointment } = useAppointments();
  const { visitorHistory, loading: historyLoading, error: historyError, refetch: refetchHistory, logUnplannedVisitor } = useVisitorHistory();

  const [view, setView] = useState<"appointments" | "history">("appointments");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [unplannedOpen, setUnplannedOpen] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
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

  if (view === "history") {
    return (
      <VisitorHistoryView
        appointments={appointments}
        visitorHistory={visitorHistory}
        loading={historyLoading}
        error={historyError}
        onRetry={refetchHistory}
        onBack={() => setView("appointments")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button variant="primary">Appointments</Button>
        <Button variant="outline" icon={<History size={14} />} onClick={() => setView("history")}>Visitor History</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="glass-input px-3 py-2 text-[12.5px] flex-1 min-w-[200px]"
          placeholder="Search requester, purpose, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="glass-input px-3 py-2 text-[12.5px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {["Pending", "Approved", "Rejected", "Postponed", "Completed", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <DatePicker value={dateFilter} onChange={setDateFilter} placeholder="Select date" className="w-[170px]" />
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
                <th>Priority</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow colSpan={7} /> : rows.length ? rows.map((a) => {
                const canApprove = isCEO && canQuickTransition(a.approval, "Approved", "CEO");
                const canReject = isCEO && canQuickTransition(a.approval, "Rejected", "CEO");
                const canPostpone = canQuickTransition(a.approval, "Postponed", role);
                const canComplete = isPA && canQuickTransition(a.approval, "Completed", "PA");
                const canResched = isPA && canReschedule(a.approval);
                return (
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
                        <Pill status={displayStatus(a)} />
                        {a.reason && <span title={a.reason}><Info size={13} className="text-ink-300 cursor-help shrink-0" /></span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="flex gap-1.5 flex-wrap">
                        {isPA && (
                          <Button size="sm" variant="outline" icon={<Pencil size={12} />} onClick={() => setEditTarget(a)}>Edit</Button>
                        )}
                        {canApprove && <Button size="sm" variant="primary" onClick={() => handleAction(a.id, "Approved")}>Approve</Button>}
                        {canReject && <Button size="sm" variant="danger" onClick={() => handleAction(a.id, "Rejected")}>Reject</Button>}
                        {canPostpone && <Button size="sm" variant="outline" onClick={() => handleAction(a.id, "Postponed")}>Postpone</Button>}
                        {canComplete && (
                          <Button size="sm" variant="soft" icon={<CheckCircle2 size={12} />} onClick={() => actOnAppointment(a.id, "Completed")}>
                            Mark Completed
                          </Button>
                        )}
                        {canResched && <Button size="sm" variant="outline" onClick={() => setRescheduleId(a.id)}>Reschedule</Button>}
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan={7} className="tbl-empty">No matching appointments.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <AppointmentModal open={apptModalOpen} onClose={() => setApptModalOpen(false)} onCreate={createAppointment} appointments={appointments} />
      <UnplannedVisitorModal open={unplannedOpen} onClose={() => setUnplannedOpen(false)} onLog={logUnplannedVisitor} />
      <RescheduleModal id={rescheduleId} appointments={appointments} onReschedule={rescheduleAppointment} onClose={() => setRescheduleId(null)} />
      <EditAppointmentModal appointment={editTarget} onClose={() => setEditTarget(null)} onSave={(id, input) => editAppointment(id, input)} />
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
