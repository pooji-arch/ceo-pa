import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardHead } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ErrorBanner, LoadingRow } from "../components/ui/AsyncState";
import { fmtDate, TODAY } from "../lib/utils";
import { useStore } from "../store/store";
import { useDailyActivities } from "../hooks/useDailyActivities";
import { DailyActivityModal } from "../components/modals/ExecutionModals";

// Monday-Saturday, matching the Mon-Sat work-week convention used elsewhere
// (see buildMonthWeeklyScores) — computed from the real current date rather
// than a fixed calendar week, so this keeps working correctly as time passes.
function thisWeekRange(todayKey: string) {
  const [y, m, d] = todayKey.split("-").map(Number);
  const today = new Date(y, m - 1, d);
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow));
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  const fmtShort = (dt: Date) => dt.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  return { start: monday, end: saturday, label: `Week of ${fmtShort(monday)} – ${fmtShort(saturday)} ${saturday.getFullYear()}` };
}

export default function DailyActivities() {
  const role = useStore((s) => s.role);
  const isPA = role === "PA";
  const { dailyActivities, loading, error, refetch, createDailyActivity } = useDailyActivities();
  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState(TODAY);

  const week = useMemo(() => thisWeekRange(TODAY), []);
  const thisWeek = useMemo(() => {
    return dailyActivities.filter((d) => {
      const [dy, dm, dd] = d.date.split("-").map(Number);
      const dt = new Date(dy, dm - 1, dd);
      return dt >= week.start && dt <= week.end;
    });
  }, [dailyActivities, week]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    thisWeek.forEach((d) => { map[d.type] = (map[d.type] || 0) + 1; });
    return map;
  }, [thisWeek]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" className="glass-input px-3 py-2 text-[12.5px]" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="flex-1" />
        {isPA && <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>Log Completed Activity</Button>}
      </div>

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <Card>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Outcome</th></tr></thead>
            <tbody>
              {loading ? <LoadingRow colSpan={4} /> : dailyActivities.map((d) => (
                <tr key={d.id} className="row-hover">
                  <td>{fmtDate(d.date)}</td>
                  <td><span className="tag-dept">{d.type}</span></td>
                  <td>{d.desc}</td><td>{d.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title={`Weekly Review — ${week.label}`} />
        <div className="p-5">
          <div className="flex gap-8 flex-wrap mb-4">
            {Object.keys(byType).length ? Object.entries(byType).map(([t, c]) => (
              <div key={t}>
                <div className="text-[24px] font-extrabold font-display text-ink-900">{c}</div>
                <div className="text-[11.5px] text-ink-500">{t}</div>
              </div>
            )) : <span className="text-[13px] text-ink-500">No completed activities logged this week yet.</span>}
          </div>
          <div className="text-[12.5px] text-ink-500">
            Total completed activities this week: <b className="text-ink-900">{thisWeek.length}</b> — feeds the PA Daily Dashboard and Weekly Schedule review.
          </div>
        </div>
      </Card>

      <DailyActivityModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createDailyActivity} />
    </div>
  );
}
