import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FieldRow, SelectField, TextAreaField, TextField } from "../ui/Field";
import { useMilestonesForIdea } from "../../hooks/useMilestones";
import { DEPARTMENTS, TODAY, deptCodeFor } from "../../lib/utils";
import type { KaizenStatus, Priority } from "../../store/types";

const KAIZEN_STATUS_OPTIONS: KaizenStatus[] = ["New", "Under Process", "Hold", "Completed"];

/** Grows to fit its content instead of scrolling or needing a manual resize. */
function AutoGrowTextarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      className="glass-input w-full px-3 py-2.5 text-[13.5px] leading-snug resize-none overflow-hidden"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export interface CreateTaskInput {
  title: string; description?: string; owner: string; dept: string; priority: Priority;
  due: string; followup: string; remarks?: string; outcome?: string; attachment?: string;
}

export function TaskModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (input: CreateTaskInput) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [dept, setDept] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [due, setDue] = useState("2026-09-18");
  const [followup, setFollowup] = useState("2026-09-15");
  const [remarks, setRemarks] = useState("");
  const [outcome, setOutcome] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const fileName = fileRef.current?.files?.[0]?.name ?? "";
    onCreate({
      title: title || "Untitled task",
      description,
      owner: owner || "PA",
      dept: dept || "CEO Office",
      priority,
      due,
      followup,
      remarks,
      outcome,
      attachment: fileName,
    });
    setTitle(""); setDescription(""); setOwner(""); setDept(""); setRemarks(""); setOutcome("");
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Task"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Create Task</Button>
        </>
      }
    >
      <TextField label="Title" placeholder="e.g. Prepare Q3 board deck" value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextAreaField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <FieldRow>
        <TextField label="Owner / Champion" placeholder="e.g. GM - Operations" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <TextField label="Department" placeholder="e.g. Operations" value={dept} onChange={(e) => setDept(e.target.value)} />
      </FieldRow>
      <FieldRow>
        <SelectField label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          {["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}
        </SelectField>
        <TextField label="Due Date" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </FieldRow>
      <FieldRow>
        <TextField label="Follow-up Date" type="date" value={followup} onChange={(e) => setFollowup(e.target.value)} />
        <div>
          <label className="block text-[11px] font-bold text-ink-500 uppercase tracking-wide mb-1.5">Attachment</label>
          <input ref={fileRef} type="file" className="glass-input w-full px-3 py-2 text-[12.5px]" />
        </div>
      </FieldRow>
      <TextAreaField label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      <TextAreaField label="Outcome" placeholder="Filled in once work concludes" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
    </Modal>
  );
}

export interface CreateKaizenInput { dept: string; title: string; champion: string; date: string; status: KaizenStatus }

export function KaizenModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (input: CreateKaizenInput) => void }) {
  const [dept, setDept] = useState(DEPARTMENTS[0].name);
  const [date, setDate] = useState(TODAY);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<KaizenStatus>("New");

  const submit = () => {
    onCreate({ dept, date, title: title || "New idea", champion: owner || "Unassigned", status });
    setTitle(""); setOwner(""); setStatus("New");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Kaizen Idea"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Create Idea</Button>
        </>
      }
    >
      <FieldRow>
        <SelectField label="Department" value={dept} onChange={(e) => setDept(e.target.value)}>
          {DEPARTMENTS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
        </SelectField>
        <TextField label="Dept Code" value={deptCodeFor(dept)} readOnly disabled />
      </FieldRow>
      <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <TextAreaField label="Kaizen Idea" placeholder="Describe the idea..." value={title} onChange={(e) => setTitle(e.target.value)} />
      <FieldRow>
        <TextField label="Owner" placeholder="e.g. Priya Nair" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <SelectField label="Project Status" value={status} onChange={(e) => setStatus(e.target.value as KaizenStatus)}>
          {KAIZEN_STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </SelectField>
      </FieldRow>
    </Modal>
  );
}

export function MilestoneModal({
  open, onClose, kaizenIdeas,
}: {
  open: boolean;
  onClose: () => void;
  kaizenIdeas: { id: string; title: string }[];
}) {
  const [kaizenId, setKaizenId] = useState(kaizenIdeas[0]?.id ?? "");
  const { milestones: addedSoFar, addMilestone, updateMilestone } = useMilestonesForIdea(kaizenId || undefined);

  useEffect(() => {
    if (open) setKaizenId(kaizenIdeas[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addNext = () => {
    if (!kaizenId) return;
    addMilestone();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Milestone"
      footer={
        <Button variant="primary" onClick={onClose}>Save</Button>
      }
    >
      <SelectField label="Kaizen Idea" value={kaizenId} onChange={(e) => setKaizenId(e.target.value)}>
        {kaizenIdeas.map((k) => <option key={k.id} value={k.id}>{k.id} — {k.title.slice(0, 60)}</option>)}
      </SelectField>

      {kaizenId && (
        <>
          {addedSoFar.map((m, i) => (
            <div key={m.id}>
              <label className="block text-[0.64rem] font-extrabold text-[var(--muted-strong)] uppercase tracking-[0.06em] mb-1.5">
                Milestone {i + 1}
              </label>
              <AutoGrowTextarea
                placeholder="What does this milestone involve?"
                value={m.title}
                onChange={(v) => updateMilestone(m.id, { title: v })}
              />
            </div>
          ))}

          <Button variant="outline" size="sm" icon={<Plus size={13} />} onClick={addNext} className="self-start">
            Add Milestone {addedSoFar.length + 1}
          </Button>
        </>
      )}
    </Modal>
  );
}


export interface CreateDailyActivityInput {
  type: "Meeting" | "Task" | "Follow-up" | "Decision" | "Important Activity";
  desc: string;
  outcome: string;
}

export function DailyActivityModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (input: CreateDailyActivityInput) => void }) {
  const [type, setType] = useState<CreateDailyActivityInput["type"]>("Meeting");
  const [desc, setDesc] = useState("");
  const [outcome, setOutcome] = useState("");

  const submit = () => {
    onCreate({ type, desc: desc || "Activity", outcome });
    setDesc(""); setOutcome("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Completed Activity"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Save Entry</Button>
        </>
      }
    >
      <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
        {["Meeting", "Task", "Follow-up", "Decision", "Important Activity"].map((t) => <option key={t}>{t}</option>)}
      </SelectField>
      <TextField label="Description" placeholder="e.g. Reviewed Kaizen dashboard with PA" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <TextAreaField label="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
    </Modal>
  );
}
