import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Pill } from "../components/ui/Pill";
import { ErrorBanner, LoadingRow } from "../components/ui/AsyncState";
import { cx, fmtDate, isOverdue } from "../lib/utils";
import { useStore } from "../store/store";
import { useDietQueries } from "../hooks/useDietQueries";
import { DietModal } from "../components/modals/TrackingModals";
import { ReasonModal } from "../components/modals/ReasonModal";
import type { DietStatus } from "../store/types";

const STATUSES: DietStatus[] = ["Pending", "In Progress", "Completed"];

export default function Diet() {
  const role = useStore((s) => s.role);
  const isPA = role === "PA";
  const { dietQueries, loading, error, refetch, createDietQuery, updateDietStatus } = useDietQueries();
  const [modalOpen, setModalOpen] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        {isPA && <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>New Diet Query</Button>}
      </div>
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <Card>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Query</th><th>Requester</th><th>Responsible</th><th>Date</th><th>Follow-up</th>
                <th>Status</th><th>Remarks</th><th>Resolution</th>{isPA && <th></th>}
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow colSpan={isPA ? 9 : 8} /> : dietQueries.map((d) => (
                <tr key={d.id} className={cx("row-hover", isOverdue(d.followup, d.status) && "overdue")}>
                  <td>{d.query}</td><td>{d.requester}</td><td>{d.responsible}</td>
                  <td>{fmtDate(d.date)}</td><td>{fmtDate(d.followup)}</td>
                  <td><Pill status={d.status} /></td>
                  <td className="max-w-[200px] truncate">{d.remarks || "—"}</td>
                  <td className="max-w-[200px] truncate">{d.resolution || "—"}</td>
                  {isPA && (
                    <td>
                      <select
                        className="glass-input px-2 py-1.5 text-[12px] font-semibold"
                        value={d.status}
                        onChange={(e) => {
                          const v = e.target.value as DietStatus;
                          if (v === "Completed" && !d.resolution) { setResolveId(d.id); return; }
                          updateDietStatus(d.id, v);
                        }}
                      >
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <DietModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createDietQuery} />
      <ReasonModal
        open={!!resolveId}
        onClose={() => setResolveId(null)}
        title="Resolve Diet Query"
        reasonLabel="Resolution summary"
        onSubmit={(reason) => {
          if (!resolveId) return;
          updateDietStatus(resolveId, "Completed", reason || "Resolved");
        }}
      />
    </div>
  );
}
