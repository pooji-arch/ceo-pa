import { useMemo, useState } from "react";
import { Plus, Paperclip } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Pill, PriorityTag } from "../components/ui/Pill";
import { ErrorBanner, LoadingRow } from "../components/ui/AsyncState";
import { cx, fmtDate } from "../lib/utils";
import { useStore } from "../store/store";
import { useTasks } from "../hooks/useTasks";
import { TaskModal } from "../components/modals/ExecutionModals";
import { ReasonModal } from "../components/modals/ReasonModal";
import type { TaskStatus } from "../store/types";

const STATUS_TABS: (TaskStatus | "")[] = ["", "New", "In Progress", "Completed", "Postponed", "Blocked"];
const ALL_STATUSES: TaskStatus[] = ["New", "In Progress", "Completed", "Postponed", "Cancelled", "Blocked"];

export default function Tasks() {
  const role = useStore((s) => s.role);
  const isPA = role === "PA";
  const { tasks, loading, error, refetch, createTask, updateTaskStatus } = useTasks();

  const [statusTab, setStatusTab] = useState<TaskStatus | "">("");
  const [prioFilter, setPrioFilter] = useState("");
  const [search, setSearch] = useState("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [reasonTarget, setReasonTarget] = useState<{ id: string; status: TaskStatus } | null>(null);

  const rows = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (!statusTab || t.status === statusTab) &&
          (!prioFilter || t.priority === prioFilter) &&
          (!search || (t.title + t.owner + t.dept).toLowerCase().includes(search.toLowerCase()))
      ),
    [tasks, statusTab, prioFilter, search]
  );

  const handleStatusChange = (id: string, status: TaskStatus) => {
    if (status === "Postponed" || status === "Cancelled") {
      setReasonTarget({ id, status });
      return;
    }
    updateTaskStatus(id, status);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="inline-flex gap-1 p-1 rounded-xl bg-violet-100/70 w-fit">
        {STATUS_TABS.map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusTab(s)}
            className={cx(
              "px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition",
              statusTab === s ? "bg-white text-violet-700 shadow-sm" : "text-ink-500 hover:text-ink-900"
            )}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select className="glass-input px-3 py-2 text-[12.5px]" value={prioFilter} onChange={(e) => setPrioFilter(e.target.value)}>
          <option value="">All priorities</option>
          {["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}
        </select>
        <input
          className="glass-input px-3 py-2 text-[12.5px] flex-1 min-w-[200px]"
          placeholder="Search title, owner, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex-1" />
        {isPA && (
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setTaskModalOpen(true)}>Add New Task</Button>
        )}
      </div>

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <Card>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th><th>Title</th><th>Owner / Champion</th><th>Dept</th><th>Priority</th>
                <th>Due</th><th>Follow-up</th><th>Completion</th><th></th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow colSpan={10} /> : rows.length ? rows.map((t) => (
                <tr key={t.id} className={cx("row-hover", t.overdue && "overdue")}>
                  <td className="font-semibold text-violet-700">{t.id}</td>
                  <td title={t.outcome ? "Outcome: " + t.outcome : ""}>{t.title}</td>
                  <td>{t.owner}</td>
                  <td><span className="tag-dept">{t.dept}</span></td>
                  <td><PriorityTag priority={t.priority} /></td>
                  <td>{fmtDate(t.due)} {t.overdue && <span className="text-red-500">⚠</span>}</td>
                  <td>{fmtDate(t.followup)}</td>
                  <td>{fmtDate(t.completion)}</td>
                  <td className="text-center" title={t.attachment || "No attachment"}>
                    {t.attachment ? <Paperclip size={14} className="text-violet-500 inline" /> : "—"}
                  </td>
                  <td>
                    {isPA ? (
                      <select
                        className="glass-input px-2 py-1.5 text-[12px] font-semibold"
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value as TaskStatus)}
                      >
                        {ALL_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <Pill status={t.status} />
                    )}
                  </td>
                </tr>
              )) : <tr><td colSpan={10} className="tbl-empty">No matching tasks.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} onCreate={createTask} />
      <ReasonModal
        open={!!reasonTarget}
        onClose={() => setReasonTarget(null)}
        title={`Reason for marking ${reasonTarget?.status ?? ""}`}
        reasonLabel="Reason"
        dateLabel={reasonTarget?.status === "Postponed" ? "Revised Follow-up Date" : undefined}
        defaultDate="2026-09-17"
        onSubmit={(reason, date) => {
          if (!reasonTarget) return;
          updateTaskStatus(reasonTarget.id, reasonTarget.status, { reason, revisedFollowup: date });
        }}
      />
    </div>
  );
}
