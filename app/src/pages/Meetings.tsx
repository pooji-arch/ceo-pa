import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRightCircle } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Pill } from "../components/ui/Pill";
import { ErrorBanner, LoadingRow } from "../components/ui/AsyncState";
import { fmtDate } from "../lib/utils";
import { useStore } from "../store/store";
import { useMeetings, useActionPoints } from "../hooks/useMeetings";
import { MeetingModal, ActionPointModal } from "../components/modals/SchedulingModals";

export default function Meetings() {
  const role = useStore((s) => s.role);
  const isPA = role === "PA";
  const { meetings, loading: meetingsLoading, error: meetingsError, refetch: refetchMeetings, createMeeting } = useMeetings();
  const { actionPoints, loading: apLoading, error: apError, refetch: refetchActionPoints, createActionPoint, convertActionPointToTask } = useActionPoints();
  const navigate = useNavigate();

  const [meetingOpen, setMeetingOpen] = useState(false);
  const [apOpen, setApOpen] = useState(false);

  const handleConvert = async (id: string, point: string) => {
    const ok = await convertActionPointToTask(id, point);
    if (ok) navigate("/app/tasks");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        {isPA && <Button variant="primary" icon={<Plus size={14} />} onClick={() => setMeetingOpen(true)}>Schedule Meeting</Button>}
      </div>

      {meetingsError && <ErrorBanner message={meetingsError} onRetry={refetchMeetings} />}

      <Card>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>ID</th><th>Purpose</th><th>Participants</th><th>Date / Time</th><th>Status</th></tr></thead>
            <tbody>
              {meetingsLoading ? <LoadingRow colSpan={5} /> : meetings.map((m) => (
                <tr key={m.id} className="row-hover">
                  <td className="font-semibold text-violet-700">{m.id}</td>
                  <td>{m.purpose}</td><td>{m.participants}</td>
                  <td>{fmtDate(m.date)}, {m.time}</td><td><Pill status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-ink-900 font-display">Action Points</h3>
        {isPA && <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setApOpen(true)}>Add Action Point</Button>}
      </div>

      {apError && <ErrorBanner message={apError} onRetry={refetchActionPoints} />}

      <Card>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Meeting</th><th>Action Point</th><th>Owner</th><th>Due</th><th>Status</th>{isPA && <th></th>}</tr></thead>
            <tbody>
              {apLoading ? <LoadingRow colSpan={isPA ? 6 : 5} /> : actionPoints.map((p) => (
                <tr key={p.id} className="row-hover">
                  <td>{p.meeting}</td><td>{p.point}</td><td>{p.owner}</td><td>{fmtDate(p.due)}</td>
                  <td><Pill status={p.status} /></td>
                  {isPA && (
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<ArrowRightCircle size={13} />}
                        onClick={() => handleConvert(p.id, p.point)}
                      >
                        Convert to Task
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <MeetingModal open={meetingOpen} onClose={() => setMeetingOpen(false)} onCreate={createMeeting} />
      <ActionPointModal open={apOpen} onClose={() => setApOpen(false)} meetings={meetings} onCreate={createActionPoint} />
    </div>
  );
}
