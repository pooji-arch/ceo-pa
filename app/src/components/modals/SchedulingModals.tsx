import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FieldRow, SelectField, TextAreaField, TextField } from "../ui/Field";
import type { ApprovalStatus, Priority } from "../../store/types";

export interface CreateAppointmentInput {
  requester: string; dept: string; purpose: string; date: string; time: string; priority: Priority; approval: ApprovalStatus;
}

export function AppointmentModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (input: CreateAppointmentInput) => void }) {
  const [requester, setRequester] = useState("");
  const [dept, setDept] = useState("");
  const [purpose, setPurpose] = useState("");
  const [date, setDate] = useState("2026-09-12");
  const [time, setTime] = useState("11:00");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [approval, setApproval] = useState<ApprovalStatus>("Pending");

  const submit = () => {
    onCreate({
      requester: requester || "New Requester",
      dept: dept || "General",
      purpose: purpose || "General meeting",
      date,
      time,
      priority,
      approval,
    });
    setRequester(""); setDept(""); setPurpose("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Appointment / Visitor Request"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Create Request</Button>
        </>
      }
    >
      <FieldRow>
        <TextField label="Requester" placeholder="e.g. Rohan Mehta" value={requester} onChange={(e) => setRequester(e.target.value)} />
        <TextField label="Department" placeholder="e.g. Finance" value={dept} onChange={(e) => setDept(e.target.value)} />
      </FieldRow>
      <TextField label="Purpose" placeholder="e.g. Budget sign-off discussion" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
      <FieldRow>
        <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </FieldRow>
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
  name: string; purpose: string; decision: string; remarks: string;
}

export function UnplannedVisitorModal({ open, onClose, onLog }: { open: boolean; onClose: () => void; onLog: (input: LogUnplannedVisitorInput) => void }) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [decision, setDecision] = useState("Reschedule");
  const [remarks, setRemarks] = useState("");

  const submit = () => {
    onLog({ name: name || "Unplanned visitor", purpose, decision, remarks });
    setName(""); setPurpose(""); setRemarks("");
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
      <SelectField label="PA Decision" value={decision} onChange={(e) => setDecision(e.target.value)}>
        <option>Allow now</option>
        <option>Reject</option>
        <option>Reschedule</option>
      </SelectField>
      <TextAreaField label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
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

