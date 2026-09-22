import { useMemo, useState } from "react";
import { CalendarDays, TriangleAlert } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Pill } from "../ui/Pill";
import { FieldRow, SelectField, TextAreaField, TextField } from "../ui/Field";
import { DateField } from "../ui/DatePicker";
import { fmtDate, findAppointmentConflicts } from "../../lib/utils";
import type { Appointment, ApprovalStatus, Priority } from "../../store/types";

export interface CreateAppointmentInput {
  requester: string; dept: string; purpose: string; date: string; time: string; priority: Priority; approval: ApprovalStatus;
  visitors?: string[]; force?: boolean;
}

/** Read-only day schedule shown inline so the PA can check the CEO's
 * existing bookings without leaving the current form — opened from the
 * "Check Schedule" button next to the date/time fields. Shared by both New
 * Appointment Request and Reschedule instead of building it twice. */
export function DaySchedulePanel({ date, appointments }: { date: string; appointments: Appointment[] }) {
  const dayAppts = useMemo(
    () =>
      appointments
        .filter((a) => a.date === date && !["Rejected", "Cancelled", "Completed"].includes(a.approval))
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, date]
  );

  return (
    <div className="rounded-[14px] border p-3.5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
      <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted-strong)" }}>
        Schedule for {date ? fmtDate(date) : "—"}
      </div>
      {dayAppts.length ? (
        <div className="flex flex-col gap-2">
          {dayAppts.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 text-[12.5px]">
              <span className="font-semibold" style={{ color: "var(--deep)" }}>{a.time}</span>
              <span className="flex-1 truncate">{a.purpose} — {a.requester}</span>
              <Pill status={a.approval} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[12px] text-center py-2" style={{ color: "var(--muted)" }}>Nothing booked on this date yet.</div>
      )}
    </div>
  );
}

export function AppointmentModal({
  open,
  onClose,
  onCreate,
  appointments,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateAppointmentInput) => void;
  appointments: Appointment[];
}) {
  const [requester, setRequester] = useState("");
  const [dept, setDept] = useState("");
  const [purpose, setPurpose] = useState("");
  const [purposeError, setPurposeError] = useState(false);
  const [visitorsText, setVisitorsText] = useState("");
  const [date, setDate] = useState("2026-09-12");
  const [time, setTime] = useState("11:00");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [approval, setApproval] = useState<ApprovalStatus>("Pending");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [conflicts, setConflicts] = useState<Appointment[] | null>(null);

  const reset = () => {
    setRequester(""); setDept(""); setPurpose(""); setPurposeError(false); setVisitorsText("");
    setScheduleOpen(false); setConflicts(null);
  };

  const doCreate = (force: boolean) => {
    const visitors = visitorsText.split(",").map((v) => v.trim()).filter(Boolean);
    onCreate({
      requester: requester || "New Requester",
      dept: dept || "General",
      purpose,
      date,
      time,
      priority,
      approval,
      visitors,
      force,
    });
    reset();
    onClose();
  };

  const submit = () => {
    if (!purpose.trim()) {
      setPurposeError(true);
      return;
    }
    const found = findAppointmentConflicts(appointments, date, time);
    if (found.length) {
      setConflicts(found);
      return;
    }
    doCreate(false);
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="New Appointment / Visitor Request"
      footer={
        conflicts ? (
          <>
            <Button variant="ghost" onClick={() => setConflicts(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => doCreate(true)}>Book Conflicting Slot</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button variant="primary" onClick={submit}>Create Request</Button>
          </>
        )
      }
    >
      <FieldRow>
        <TextField label="Requester" placeholder="e.g. Rohan Mehta" value={requester} onChange={(e) => setRequester(e.target.value)} />
        <TextField label="Department" placeholder="e.g. Finance" value={dept} onChange={(e) => setDept(e.target.value)} />
      </FieldRow>
      <div>
        <TextField
          label="Purpose *"
          placeholder="e.g. Budget sign-off discussion"
          value={purpose}
          onChange={(e) => { setPurpose(e.target.value); if (e.target.value.trim()) setPurposeError(false); }}
          className={purposeError ? "!border-red-400 !shadow-[0_0_0_3px_rgba(225,29,72,0.14)]" : undefined}
        />
        {purposeError && <p className="text-[11.5px] font-medium mt-1" style={{ color: "#be123c" }}>Purpose is required.</p>}
      </div>
      <TextField
        label="Visitors"
        placeholder="Enter visitor names separated by commas"
        value={visitorsText}
        onChange={(e) => setVisitorsText(e.target.value)}
      />
      <FieldRow>
        <DateField
          label="Date"
          value={date}
          onChange={(v) => { setDate(v); setConflicts(null); }}
          invalid={!!conflicts}
        />
        <TextField
          label="Time"
          type="time"
          value={time}
          onChange={(e) => { setTime(e.target.value); setConflicts(null); }}
          className={conflicts ? "!border-red-400 !shadow-[0_0_0_3px_rgba(225,29,72,0.14)]" : undefined}
        />
      </FieldRow>

      <Button variant="outline" size="sm" icon={<CalendarDays size={13} />} onClick={() => setScheduleOpen((v) => !v)} className="self-start">
        {scheduleOpen ? "Hide Schedule" : "View Calendar / Check Schedule"}
      </Button>
      {scheduleOpen && <DaySchedulePanel date={date} appointments={appointments} />}

      {conflicts && (
        <div className="rounded-[14px] p-3.5 flex flex-col gap-2" style={{ background: "rgba(225,29,72,0.08)", border: "1px solid rgba(225,29,72,0.35)" }}>
          <div className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: "#be123c" }}>
            <TriangleAlert size={15} /> Conflict detected
          </div>
          <div className="text-[12px]" style={{ color: "#be123c" }}>
            This date and time conflicts with {conflicts.length === 1 ? "an existing appointment" : `${conflicts.length} existing appointments`}:
          </div>
          {conflicts.map((c) => (
            <div key={c.id} className="text-[12px] pl-2 border-l-2" style={{ borderColor: "#e11d48", color: "var(--deep)" }}>
              <span className="font-semibold">{c.purpose}</span> — {fmtDate(c.date)}, {c.time} · {c.requester} ({c.dept})
            </div>
          ))}
          <div className="text-[12px] font-medium" style={{ color: "#be123c" }}>
            Do you want to book this appointment anyway?
          </div>
        </div>
      )}

      <FieldRow>
        <SelectField label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          {["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}
        </SelectField>
        <SelectField label="Approval Status" value={approval} onChange={(e) => setApproval(e.target.value as ApprovalStatus)}>
          {["Pending", "Approved", "Rejected"].map((p) => <option key={p}>{p}</option>)}
        </SelectField>
      </FieldRow>
    </Modal>
  );
}

export interface LogUnplannedVisitorInput {
  name: string; purpose: string; decision: string; remarks: string; date: string; time: string;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function UnplannedVisitorModal({ open, onClose, onLog }: { open: boolean; onClose: () => void; onLog: (input: LogUnplannedVisitorInput) => void }) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [decision, setDecision] = useState("Reschedule");
  const [remarks, setRemarks] = useState("");
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState(nowHHMM());

  const submit = () => {
    onLog({ name: name || "Unplanned visitor", purpose, decision, remarks, date, time });
    setName(""); setPurpose(""); setRemarks(""); setDate(todayKey()); setTime(nowHHMM());
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Unplanned Visitor"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Record Decision</Button>
        </>
      }
    >
      <TextField label="Visitor Name" placeholder="e.g. Unannounced vendor rep" value={name} onChange={(e) => setName(e.target.value)} />
      <TextField label="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
      <FieldRow>
        <DateField label="Date" value={date} onChange={setDate} />
        <TextField label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </FieldRow>
      <SelectField label="PA Decision" value={decision} onChange={(e) => setDecision(e.target.value)}>
        <option>Allow now</option>
        <option>Reject</option>
        <option>Reschedule</option>
      </SelectField>
      <TextAreaField label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
    </Modal>
  );
}

export interface EditAppointmentInput {
  requester: string; dept: string; purpose: string; date: string; time: string; priority: Priority;
  visitors: string[]; approval: ApprovalStatus;
}

const ALL_APPROVAL_STATUSES: ApprovalStatus[] = ["Pending", "Approved", "Rejected", "Postponed", "Completed", "Cancelled"];

/** The PA's manual-override editor — the one place every appointment field,
 * including approval status, can be corrected directly (see PRD: the PA
 * must be able to finalize an appointment when the normal approve/reject
 * flow doesn't cover the situation). Not gated by the quick-action
 * transition matrix; the backend logs the old -> new status when it changes. */
export function EditAppointmentModal({
  appointment,
  onClose,
  onSave,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  onSave: (id: string, input: EditAppointmentInput) => void;
}) {
  const [requester, setRequester] = useState("");
  const [dept, setDept] = useState("");
  const [purpose, setPurpose] = useState("");
  const [purposeError, setPurposeError] = useState(false);
  const [visitorsText, setVisitorsText] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [approval, setApproval] = useState<ApprovalStatus>("Pending");

  // Re-seed local state every time a different appointment is opened for editing.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (appointment && appointment.id !== loadedId) {
    setLoadedId(appointment.id);
    setRequester(appointment.requester);
    setDept(appointment.dept);
    setPurpose(appointment.purpose);
    setPurposeError(false);
    setVisitorsText(appointment.visitors.join(", "));
    setDate(appointment.date);
    setTime(appointment.time);
    setPriority(appointment.priority);
    setApproval(appointment.approval);
  }

  if (!appointment) return null;

  const submit = () => {
    if (!purpose.trim()) {
      setPurposeError(true);
      return;
    }
    const visitors = visitorsText.split(",").map((v) => v.trim()).filter(Boolean);
    onSave(appointment.id, { requester, dept, purpose, date, time, priority, visitors, approval });
    setLoadedId(null);
    onClose();
  };

  return (
    <Modal
      open={!!appointment}
      onClose={() => { setLoadedId(null); onClose(); }}
      title={`Edit Appointment — ${appointment.requester}`}
      footer={
        <>
          <Button variant="ghost" onClick={() => { setLoadedId(null); onClose(); }}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Save Changes</Button>
        </>
      }
    >
      <FieldRow>
        <TextField label="Requester" value={requester} onChange={(e) => setRequester(e.target.value)} />
        <TextField label="Department" value={dept} onChange={(e) => setDept(e.target.value)} />
      </FieldRow>
      <div>
        <TextField
          label="Purpose *"
          value={purpose}
          onChange={(e) => { setPurpose(e.target.value); if (e.target.value.trim()) setPurposeError(false); }}
          className={purposeError ? "!border-red-400 !shadow-[0_0_0_3px_rgba(225,29,72,0.14)]" : undefined}
        />
        {purposeError && <p className="text-[11.5px] font-medium mt-1" style={{ color: "#be123c" }}>Purpose is required.</p>}
      </div>
      <TextField
        label="Visitors"
        placeholder="Enter visitor names separated by commas"
        value={visitorsText}
        onChange={(e) => setVisitorsText(e.target.value)}
      />
      <FieldRow>
        <DateField label="Date" value={date} onChange={setDate} />
        <TextField label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </FieldRow>
      <FieldRow>
        <SelectField label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          {["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}
        </SelectField>
        <SelectField label="Approval Status" value={approval} onChange={(e) => setApproval(e.target.value as ApprovalStatus)}>
          {ALL_APPROVAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </SelectField>
      </FieldRow>
    </Modal>
  );
}

export interface CreateMeetingInput {
  purpose: string; participants: string; date: string; time: string; agenda: string;
}

export function MeetingModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (input: CreateMeetingInput) => void }) {
  const [purpose, setPurpose] = useState("");
  const [participants, setParticipants] = useState("");
  const [date, setDate] = useState("2026-09-16");
  const [time, setTime] = useState("15:00");
  const [agenda, setAgenda] = useState("");

  const submit = () => {
    onCreate({ purpose: purpose || "Meeting", participants: participants || "TBD", date, time, agenda });
    setPurpose(""); setParticipants(""); setAgenda("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Meeting"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Schedule</Button>
        </>
      }
    >
      <TextField label="Purpose" placeholder="e.g. Monthly Ops Review" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
      <TextField label="Participants" placeholder="e.g. CEO, GM-Ops, GM-Finance" value={participants} onChange={(e) => setParticipants(e.target.value)} />
      <FieldRow>
        <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </FieldRow>
      <TextAreaField label="Agenda" value={agenda} onChange={(e) => setAgenda(e.target.value)} />
    </Modal>
  );
}

export interface CreateActionPointInput {
  meetingId: string; point: string; owner: string; due: string;
}

export function ActionPointModal({
  open, onClose, meetings, onCreate,
}: {
  open: boolean;
  onClose: () => void;
  meetings: { id: string; purpose: string }[];
  onCreate: (input: CreateActionPointInput) => void;
}) {
  const [meetingId, setMeetingId] = useState(meetings[0]?.id ?? "");
  const [point, setPoint] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("2026-09-15");

  const submit = () => {
    const resolvedMeetingId = meetingId || meetings[0]?.id;
    if (!resolvedMeetingId) return;
    onCreate({ meetingId: resolvedMeetingId, point: point || "New action point", owner: owner || "PA", due });
    setPoint(""); setOwner("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Action Point"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Add Action Point</Button>
        </>
      }
    >
      <SelectField label="Meeting" value={meetingId} onChange={(e) => setMeetingId(e.target.value)}>
        {meetings.map((m) => <option key={m.id} value={m.id}>{m.purpose}</option>)}
      </SelectField>
      <TextField label="Action Point" placeholder="e.g. Circulate revised deck" value={point} onChange={(e) => setPoint(e.target.value)} />
      <FieldRow>
        <TextField label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <TextField label="Follow-up Date" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </FieldRow>
    </Modal>
  );
}

