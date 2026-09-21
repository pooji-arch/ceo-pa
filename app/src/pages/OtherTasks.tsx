import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Pill } from "../components/ui/Pill";
import { ErrorBanner, LoadingRow } from "../components/ui/AsyncState";
import { fmtDate } from "../lib/utils";
import { useStore } from "../store/store";
import { useOtherTasks } from "../hooks/useOtherTasks";
import { OtherTaskModal } from "../components/modals/TrackingModals";

export default function OtherTasks() {
  const role = useStore((s) => s.role);
  const isPA = role === "PA";
  const { otherTasks, loading, error, refetch, createOtherTask } = useOtherTasks();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5 text-[13px] text-ink-500">
        Flexible category for CEO-related items that don't fit other modules — personal errands, ad-hoc requests, miscellaneous commitments.
      </Card>
      <div className="flex justify-end">
        {isPA && <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>Add Other Task</Button>}
      </div>
      {error && <ErrorBanner message={error} onRetry={refetch} />}
      <Card>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Title</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? <LoadingRow colSpan={4} /> : otherTasks.map((o) => (
                <tr key={o.id} className="row-hover"><td>{o.title}</td><td>{o.owner}</td><td>{fmtDate(o.due)}</td><td><Pill status={o.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <OtherTaskModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createOtherTask} />
    </div>
  );
}
