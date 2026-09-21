import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Card, CardHead } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Pill } from "../components/ui/Pill";
import { ErrorBanner } from "../components/ui/AsyncState";
import { DEPARTMENTS, fmtDate } from "../lib/utils";
import { useStore } from "../store/store";
import { useKaizenIdeas } from "../hooks/useKaizenIdeas";
import { useMilestonesForIdea } from "../hooks/useMilestones";
import type { KaizenApproval, KaizenIdea, KaizenStatus, Milestone, MilestoneStatus, YesNoNA } from "../store/types";

const KAIZEN_STATUSES: KaizenStatus[] = ["New", "Under Process", "Hold", "Completed"];
const MILESTONE_STATUSES: MilestoneStatus[] = ["NA", "On-time Completion", "Overdue Completion", "Hold"];
const APPROVAL_OPTIONS: KaizenApproval[] = [
  "Hold", "Approved", "Not Approved", "Already in Plan", "Already there", "NSI", "Given idea", "Check with CEO/DR",
];
const YES_NO_OPTIONS: YesNoNA[] = ["-", "Yes", "No", "NA"];
const MONTH_OPTIONS = [
  "-", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function TableText({ value, onCommit, width = "w-full", placeholder }: { value: string; onCommit: (v: string) => void; width?: string; placeholder?: string }) {
  return (
    <input
      className={`glass-input ${width} px-2 py-1 text-[12px]`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onCommit(e.target.value)}
    />
  );
}

/** Grows to fit its content instead of scrolling or needing a manual resize —
 * long entries (impact notes, running logs) stay fully, statically visible. */
function TableArea({ value, onCommit, width = "w-full", placeholder }: { value: string; onCommit: (v: string) => void; width?: string; placeholder?: string }) {
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
      className={`glass-input ${width} px-2 py-1 text-[12px] leading-snug resize-none overflow-hidden`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onCommit(e.target.value)}
    />
  );
}

/** Executed By can be several people/departments — added and shown one at a
 * time rather than crammed into one string, matching the backend's atomic
 * add/remove-one-at-a-time endpoints (avoids a whole-array-replace race). */
function NameList({ names, onAdd, onRemove }: { names: string[]; onAdd: (name: string) => void; onRemove: (name: string) => void }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  };
  return (
    <div className="flex flex-col gap-1.5 min-w-[160px]">
      {names.map((n, i) => (
        <div key={i} className="glass-input flex items-center justify-between gap-2 px-2 py-1 text-[12px]">
          <span className="truncate">{n}</span>
          <button type="button" onClick={() => onRemove(n)} className="shrink-0 text-ink-400 hover:text-red-500">
            <X size={12} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
          placeholder="Add name..."
          className="glass-input flex-1 min-w-0 px-2 py-1 text-[12px]"
        />
        <button
          type="button"
          onClick={commit}
          className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

export default function KaizenDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useStore((s) => s.role);
  const isPA = role === "PA";
  const {
    kaizenIdeas, loading: ideaLoading, error: ideaError, refetch: refetchIdea,
    updateKaizenStatus, updateKaizenApproval, updateKaizenDetails, addExecutedBy, removeExecutedBy,
  } = useKaizenIdeas();
  const idea = kaizenIdeas.find((k) => k.id === id);

  // Already in oldest-first (createdAt asc) order from the API — this is
  // what drives the "Milestone 1, 2, 3..." numbering, no client reordering needed.
  const { milestones: ideaMilestones, loading: milestonesLoading, error: milestonesError, refetch: refetchMilestones, addMilestone, updateMilestone } = useMilestonesForIdea(id);

  if (ideaLoading) {
    return <div className="text-[13px] text-ink-500">Loading Kaizen idea...</div>;
  }

  if (!idea) {
    return (
      <div className="flex flex-col gap-4 items-start">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate("/app/kaizen")}>Back to Kaizen</Button>
        <div className="text-[13px] text-ink-500">Kaizen idea not found.</div>
      </div>
    );
  }

  const patch = (milestoneId: string, p: Partial<Omit<Milestone, "id" | "kaizenId">>) => updateMilestone(milestoneId, p);
  const ideaPatch = (p: Partial<Omit<KaizenIdea, "id">>) => updateKaizenDetails(idea.id, p);
  const rowSpan = ideaMilestones.length;

  return (
    <div className="flex flex-col gap-5">
      <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate("/app/kaizen")} className="self-start">
        Back to Kaizen
      </Button>

      {(ideaError || milestonesError) && (
        <ErrorBanner message={ideaError ?? milestonesError ?? ""} onRetry={() => { refetchIdea(); refetchMilestones(); }} />
      )}

      <Card>
        <CardHead
          title={idea.title}
          hint={`${idea.id} · ${ideaMilestones.length} milestone${ideaMilestones.length === 1 ? "" : "s"}`}
          action={isPA && <Button size="sm" variant="primary" icon={<Plus size={13} />} onClick={() => addMilestone()}>Add Milestone</Button>}
        />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Dept</th><th>Dept Code</th><th>Date</th><th>Kaizen Idea</th>
                <th>Milestone</th><th>Owner</th><th>Executed By</th><th>Impact Dept</th><th>Approval</th>
                <th>Start</th><th>End</th><th>2nd End</th><th>Completed</th><th>Status</th>
                <th>Project Status</th><th>Project End</th><th>Impact</th><th>Impact Timeline</th><th>Impact Result</th>
                <th>Completion Month</th><th>Scoring Status</th><th>Impact Study</th><th>Yes/No</th>
                <th>Add to Effort</th><th>Result Link</th>
              </tr>
            </thead>
            <tbody>
              {milestonesLoading ? (
                <tr><td colSpan={25} className="tbl-empty">Loading milestones...</td></tr>
              ) : ideaMilestones.length ? ideaMilestones.map((m, i) => (
                <tr key={m.id} className="row-hover">
                  {i === 0 && (
                    <>
                      <td rowSpan={rowSpan}>{idea.dept}</td>
                      <td rowSpan={rowSpan}>{idea.deptCode}</td>
                      <td rowSpan={rowSpan}>{fmtDate(idea.date)}</td>
                      <td rowSpan={rowSpan} className="min-w-[220px]">{idea.title}</td>
                    </>
                  )}
                  <td className="min-w-[200px]">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 mt-1 w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10.5px] font-extrabold flex items-center justify-center">
                        {i + 1}
                      </span>
                      {isPA ? (
                        <TableArea value={m.title} placeholder="What does this milestone involve?" onCommit={(v) => patch(m.id, { title: v })} />
                      ) : (m.title || "—")}
                    </div>
                  </td>
                  {i === 0 && (
                    <>
                      <td rowSpan={rowSpan} className="min-w-[130px]">
                        {isPA ? <TableText value={idea.champion} onCommit={(v) => ideaPatch({ champion: v })} /> : idea.champion}
                      </td>
                      <td rowSpan={rowSpan} className="min-w-[180px]">
                        {isPA ? (
                          <NameList names={idea.executedBy} onAdd={(name) => addExecutedBy(idea.id, name)} onRemove={(name) => removeExecutedBy(idea.id, name)} />
                        ) : (idea.executedBy.length ? idea.executedBy.join(", ") : "—")}
                      </td>
                      <td rowSpan={rowSpan}>
                        {isPA ? (
                          <select className="glass-input px-2 py-1 text-[12px]" value={idea.impactDept} onChange={(e) => ideaPatch({ impactDept: e.target.value })}>
                            <option value="">—</option>
                            {DEPARTMENTS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                          </select>
                        ) : (idea.impactDept || "—")}
                      </td>
                      <td rowSpan={rowSpan}>
                        {isPA ? (
                          <select
                            className="glass-input px-2 py-1 text-[12px]"
                            value={idea.approval}
                            onChange={(e) => updateKaizenApproval(idea.id, e.target.value as KaizenApproval)}
                          >
                            {APPROVAL_OPTIONS.map((a) => <option key={a}>{a}</option>)}
                          </select>
                        ) : <Pill status={idea.approval} />}
                      </td>
                    </>
                  )}
                  <td>{isPA ? <input type="date" className="glass-input px-2 py-1 text-[12px]" value={m.startDate} onChange={(e) => patch(m.id, { startDate: e.target.value })} /> : fmtDate(m.startDate)}</td>
                  <td>{isPA ? <input type="date" className="glass-input px-2 py-1 text-[12px]" value={m.endDate} onChange={(e) => patch(m.id, { endDate: e.target.value })} /> : fmtDate(m.endDate)}</td>
                  <td>{isPA ? <input type="date" className="glass-input px-2 py-1 text-[12px]" value={m.secondEndDate} onChange={(e) => patch(m.id, { secondEndDate: e.target.value })} /> : fmtDate(m.secondEndDate)}</td>
                  <td>{isPA ? <input type="date" className="glass-input px-2 py-1 text-[12px]" value={m.completedDate} onChange={(e) => patch(m.id, { completedDate: e.target.value })} /> : fmtDate(m.completedDate)}</td>
                  <td>
                    {isPA ? (
                      <select className="glass-input px-2 py-1 text-[12px]" value={m.status} onChange={(e) => patch(m.id, { status: e.target.value as MilestoneStatus })}>
                        {MILESTONE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    ) : <Pill status={m.status} />}
                  </td>
                  {i === 0 && (
                    <>
                      <td rowSpan={rowSpan}>
                        {isPA ? (
                          <select
                            className="glass-input px-2 py-1 text-[12px]"
                            value={idea.status}
                            onChange={(e) => updateKaizenStatus(idea.id, e.target.value as KaizenStatus)}
                          >
                            {KAIZEN_STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        ) : <Pill status={idea.status} />}
                      </td>
                      <td rowSpan={rowSpan}>
                        {isPA ? <input type="date" className="glass-input px-2 py-1 text-[12px]" value={idea.projectEndDate} onChange={(e) => ideaPatch({ projectEndDate: e.target.value })} /> : fmtDate(idea.projectEndDate)}
                      </td>
                      <td rowSpan={rowSpan} className="min-w-[200px]">
                        {isPA ? <TableArea value={idea.impact} onCommit={(v) => ideaPatch({ impact: v })} /> : (idea.impact || "—")}
                      </td>
                      <td rowSpan={rowSpan} className="min-w-[140px]">
                        {isPA ? <TableText value={idea.impactTimeline} onCommit={(v) => ideaPatch({ impactTimeline: v })} /> : (idea.impactTimeline || "—")}
                      </td>
                      <td rowSpan={rowSpan} className="min-w-[200px]">
                        {isPA ? <TableArea value={idea.impactResult} onCommit={(v) => ideaPatch({ impactResult: v })} /> : (idea.impactResult || "—")}
                      </td>
                      <td rowSpan={rowSpan}>
                        {isPA ? (
                          <select className="glass-input px-2 py-1 text-[12px]" value={idea.completionMonth} onChange={(e) => ideaPatch({ completionMonth: e.target.value })}>
                            {MONTH_OPTIONS.map((mo) => <option key={mo}>{mo}</option>)}
                          </select>
                        ) : (idea.completionMonth || "—")}
                      </td>
                      <td rowSpan={rowSpan} className="min-w-[150px]">
                        {isPA ? <TableArea value={idea.scoringStatus} onCommit={(v) => ideaPatch({ scoringStatus: v })} /> : (idea.scoringStatus || "—")}
                      </td>
                      <td rowSpan={rowSpan} className="min-w-[220px]">
                        {isPA ? <TableArea value={idea.impactStudy} onCommit={(v) => ideaPatch({ impactStudy: v })} /> : (idea.impactStudy || "—")}
                      </td>
                      <td rowSpan={rowSpan}>
                        {isPA ? (
                          <select className="glass-input px-2 py-1 text-[12px]" value={idea.yesNo} onChange={(e) => ideaPatch({ yesNo: e.target.value as YesNoNA })}>
                            {YES_NO_OPTIONS.map((y) => <option key={y}>{y}</option>)}
                          </select>
                        ) : idea.yesNo}
                      </td>
                      <td rowSpan={rowSpan}>
                        {isPA ? (
                          <select className="glass-input px-2 py-1 text-[12px]" value={idea.addToEffort} onChange={(e) => ideaPatch({ addToEffort: e.target.value as YesNoNA })}>
                            {YES_NO_OPTIONS.map((y) => <option key={y}>{y}</option>)}
                          </select>
                        ) : idea.addToEffort}
                      </td>
                      <td rowSpan={rowSpan} className="min-w-[160px]">
                        {isPA ? (
                          <TableText value={idea.resultDocLink} placeholder="Link" onCommit={(v) => ideaPatch({ resultDocLink: v })} />
                        ) : (idea.resultDocLink ? <a href={idea.resultDocLink} target="_blank" rel="noreferrer" className="text-violet-600 underline">Open</a> : "—")}
                      </td>
                    </>
                  )}
                </tr>
              )) : <tr><td colSpan={25} className="tbl-empty">No milestones yet{isPA ? " — click \"Add Milestone\" above to create the first one." : "."}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
