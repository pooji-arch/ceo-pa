import { useMemo, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { CalendarClock, AlertTriangle, Sparkles, Star, Plus } from "lucide-react";
import { Card, CardHead } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Pill, PriorityTag } from "../components/ui/Pill";
import { Button } from "../components/ui/Button";
import { ErrorBanner } from "../components/ui/AsyncState";
import { useStore } from "../store/store";
import { useAppointments } from "../hooks/useAppointments";
import { useTasks } from "../hooks/useTasks";
import { useMeetings } from "../hooks/useMeetings";
import { useDashboardFeeds } from "../hooks/useDashboardFeeds";
import { computeWeekTotals, fmtDate, isOverdue, withinHorizon, TODAY } from "../lib/utils";
import { TaskModal } from "../components/modals/ExecutionModals";

const TODAY_STR = TODAY;

export default function Dashboard() {
  const role = useStore((s) => s.role);
  const isPA = role === "PA";
  const isCEO = role === "CEO";
  const { appointments, error: apptError, refetch: refetchAppts, actOnAppointment } = useAppointments();
  const { tasks, error: tasksError, refetch: refetchTasks, createTask } = useTasks();
  const { meetings, error: meetingsError, refetch: refetchMeetings } = useMeetings();
  const { kaizenIdeas, milestones, dietQueries, weeklyScores, error: feedsError, refetch: refetchFeeds } = useDashboardFeeds();
  const loadError = apptError || tasksError || meetingsError || feedsError;
  const retryAll = () => { refetchAppts(); refetchTasks(); refetchMeetings(); refetchFeeds(); };
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const todayAppts = useMemo(() => appointments.filter((a) => a.date === TODAY_STR), [appointments]);
  const pendingApprovals = useMemo(() => appointments.filter((a) => a.approval === "Pending"), [appointments]);
  const overdueTasksCount = useMemo(
    () => tasks.filter((t) => isOverdue(t.due, t.status)).length,
    [tasks]
  );
  const followups = useMemo(
    () =>
      tasks
        .filter((t) => !["Completed", "Cancelled"].includes(t.status))
        .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
        .slice(0, 6),
    [tasks]
  );
  const kaizenInProgress = kaizenIdeas.filter((k) => k.status === "Under Process").length;
  const currentWeekIndex = weeklyScores.findIndex((w) => w.days.some((d) => d.date === TODAY_STR));
  const currentWeek = currentWeekIndex >= 0 ? weeklyScores[currentWeekIndex] : weeklyScores[weeklyScores.length - 1];
  const prevWeek = currentWeekIndex > 0 ? weeklyScores[currentWeekIndex - 1] : undefined;
  const currentTotals = currentWeek ? computeWeekTotals(currentWeek.days) : null;
  const prevTotals = prevWeek ? computeWeekTotals(prevWeek.days) : null;
  const scoreDelta = currentTotals && prevTotals ? currentTotals.effectivenessPct - prevTotals.effectivenessPct : 0;

  const upcomingAppts = useMemo(
    () =>
      appointments
        .filter((a) => withinHorizon(a.date, 7) && a.approval !== "Rejected")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5),
    [appointments]
  );
  const upcomingMeetings = useMemo(
    () =>
      meetings
        .filter((m) => withinHorizon(m.date, 7) && m.status === "Scheduled")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5),
    [meetings]
  );
  const milestonesDue = useMemo(
    () =>
      milestones
        .filter((m) => m.status === "NA" && m.endDate && withinHorizon(m.endDate, 14))
        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
        .slice(0, 5),
    [milestones]
  );
  const postponed = useMemo(
    () => [
      ...tasks.filter((t) => t.status === "Postponed").map((t) => ({ title: t.title, owner: t.owner, due: t.followup })),
      ...milestones.filter((m) => m.status === "Overdue Completion" || m.status === "Hold").map((m) => ({ title: m.title, owner: kaizenIdeas.find((k) => k.id === m.kaizenId)?.champion ?? "—", due: m.endDate })),
    ],
    [tasks, milestones]
  );
  const openDiet = dietQueries.filter((d) => d.status !== "Completed");

  // Only weeks that have actually started belong in a trend — a future week
  // with no hours logged yet isn't a real "0%", it just hasn't happened.
  const startedWeeks = weeklyScores.filter((w) => w.days.some((d) => d.date <= TODAY_STR));
  const trendData = startedWeeks.slice(-8).map((w) => ({
    week: `W${w.weekLabel.match(/\d+/)?.[0] ?? ""}`,
    score: computeWeekTotals(w.days).effectivenessPct,
  }));

  return (
    <div className="flex flex-col gap-5">
      {loadError && <ErrorBanner message={loadError} onRetry={retryAll} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard tone="blue" icon={<CalendarClock size={22} color="#fff" />} label="Today's Appointments" value={todayAppts.length} sub={`${pendingApprovals.length} pending approval`} />
        <StatCard tone="red" icon={<AlertTriangle size={22} color="#fff" />} label="Overdue Tasks" value={overdueTasksCount} sub="Needs attention" trend={overdueTasksCount > 0 ? "down" : undefined} />
        <StatCard tone="green" icon={<Sparkles size={22} color="#fff" />} label="Kaizen In Progress" value={kaizenInProgress} sub={`${kaizenIdeas.filter((k) => k.status === "Completed").length} completed total`} trend="up" />
        <StatCard tone="amber" icon={<Star size={22} color="#fff" />} label="This Week's Score" value={currentTotals ? `${currentTotals.effectivenessPct}%` : "—"} sub={`${scoreDelta >= 0 ? "+" : ""}${scoreDelta} pts vs last week`} trend={scoreDelta >= 0 ? "up" : "down"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="flex flex-col">
          <CardHead
            title="Today's Schedule"
            hint={(() => {
              const [y, m, d] = TODAY_STR.split("-").map(Number);
              return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
            })()}
          />
          <div className="dash-card-body overflow-x-auto overflow-y-auto">
            <table className="tbl">
              <thead><tr><th>Time</th><th>Requester</th><th>Purpose</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {todayAppts.length ? todayAppts.map((a) => (
                  <tr key={a.id} className="row-hover">
                    <td>{a.time}</td><td>{a.requester}</td><td>{a.purpose}</td>
                    <td><PriorityTag priority={a.priority} /></td><td><Pill status={a.approval} /></td>
                  </tr>
                )) : <tr><td colSpan={5} className="tbl-empty">No appointments today.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHead title="Pending CEO Approvals" hint={`${pendingApprovals.length} waiting`} />
          <div className="dash-card-body overflow-x-auto overflow-y-auto">
            <table className="tbl">
              <thead><tr><th>Requester</th><th>Purpose</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {pendingApprovals.length ? pendingApprovals.map((a) => (
                  <tr key={a.id} className="row-hover">
                    <td>{a.requester}</td><td>{a.purpose}</td><td>{fmtDate(a.date)}</td>
                    <td>
                      {isCEO && (
                        <Button size="sm" variant="primary" onClick={() => actOnAppointment(a.id, "Approved")}>
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                )) : <tr><td colSpan={4} className="tbl-empty">No pending approvals.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="flex flex-col">
          <CardHead title="Upcoming Appointments" hint="next 7 days" />
          <div className="dash-card-body overflow-x-auto overflow-y-auto"><table className="tbl">
            <thead><tr><th>Requester</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>{upcomingAppts.length ? upcomingAppts.map((a) => (
              <tr key={a.id} className="row-hover"><td>{a.requester}</td><td>{fmtDate(a.date)}</td><td><Pill status={a.approval} /></td></tr>
            )) : <tr><td colSpan={3} className="tbl-empty">None scheduled.</td></tr>}</tbody>
          </table></div>
        </Card>
        <Card className="flex flex-col">
          <CardHead title="Upcoming Meetings" hint="next 7 days" />
          <div className="dash-card-body overflow-x-auto overflow-y-auto"><table className="tbl">
            <thead><tr><th>Purpose</th><th>Date</th></tr></thead>
            <tbody>{upcomingMeetings.length ? upcomingMeetings.map((m) => (
              <tr key={m.id} className="row-hover"><td>{m.purpose}</td><td>{fmtDate(m.date)}, {m.time}</td></tr>
            )) : <tr><td colSpan={2} className="tbl-empty">None scheduled.</td></tr>}</tbody>
          </table></div>
        </Card>
        <Card className="flex flex-col">
          <CardHead title="Milestones Due Soon" hint="next 14 days" />
          <div className="dash-card-body overflow-x-auto overflow-y-auto"><table className="tbl">
            <thead><tr><th>Milestone</th><th>End Date</th></tr></thead>
            <tbody>{milestonesDue.length ? milestonesDue.map((m) => (
              <tr key={m.id} className={"row-hover " + (new Date(m.endDate) < new Date(TODAY_STR) ? "overdue" : "")}><td>{m.title}</td><td>{fmtDate(m.endDate)}</td></tr>
            )) : <tr><td colSpan={2} className="tbl-empty">None due soon.</td></tr>}</tbody>
          </table></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="flex flex-col">
          <CardHead
            title="Overdue & Pending Follow-ups"
            hint={`${followups.filter((t) => isOverdue(t.due, t.status)).length} overdue`}
            action={isPA && <Button size="sm" variant="primary" icon={<Plus size={13} />} onClick={() => setTaskModalOpen(true)}>Add Task</Button>}
          />
          <div className="dash-card-body overflow-x-auto overflow-y-auto"><table className="tbl">
            <thead><tr><th>Task</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>{followups.map((t) => (
              <tr key={t.id} className={"row-hover " + (isOverdue(t.due, t.status) ? "overdue" : "")}>
                <td>{t.title}</td><td>{t.owner}</td><td>{fmtDate(t.due)}</td><td><Pill status={t.status} /></td>
              </tr>
            ))}</tbody>
          </table></div>
        </Card>

        <Card className="flex flex-col">
          <CardHead title="Kaizen Progress" hint={`${kaizenIdeas.length} idea${kaizenIdeas.length === 1 ? "" : "s"}`} />
          <div className="dash-card-body flex flex-col gap-3 p-5 overflow-y-auto">
            {kaizenIdeas.length ? kaizenIdeas.map((k) => (
              <div key={k.id} className="pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12.5px] font-bold text-ink-900 font-display leading-snug">{k.title}</span>
                  <Pill status={k.status} />
                </div>
                <div className="text-[11.5px] text-ink-500 mt-1">
                  {fmtDate(k.date)} <span className="text-ink-300">→</span> {k.projectEndDate ? fmtDate(k.projectEndDate) : "—"}
                </div>
              </div>
            )) : <div className="text-[12.5px] text-ink-400 text-center py-4">No Kaizen ideas yet.</div>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="flex flex-col">
          <CardHead title="Postponed Items" />
          <div className="dash-card-body overflow-x-auto overflow-y-auto"><table className="tbl">
            <thead><tr><th>Item</th><th>Owner</th></tr></thead>
            <tbody>{postponed.length ? postponed.map((p, i) => (
              <tr key={i} className="row-hover"><td>{p.title}</td><td>{p.owner}</td></tr>
            )) : <tr><td colSpan={2} className="tbl-empty">None</td></tr>}</tbody>
          </table></div>
        </Card>
        <Card className="flex flex-col">
          <CardHead title="Diet Queries — Open" />
          <div className="dash-card-body overflow-x-auto overflow-y-auto"><table className="tbl">
            <thead><tr><th>Query</th><th>Follow-up</th></tr></thead>
            <tbody>{openDiet.length ? openDiet.map((d) => (
              <tr key={d.id} className="row-hover"><td>{d.query}</td><td>{fmtDate(d.followup)}</td></tr>
            )) : <tr><td colSpan={2} className="tbl-empty">None</td></tr>}</tbody>
          </table></div>
        </Card>
        <Card className="flex flex-col">
          <CardHead title="Weekly Score Trend" />
          <div className="dash-card-body flex items-center p-5">
            <div style={{ width: "100%", height: 140 }}>
              <ResponsiveContainer>
                <AreaChart data={trendData} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8a5cf0" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#8a5cf0" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#a79fc2" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #ede8fe", fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke="#7440e0" strokeWidth={2.5} fill="url(#scoreFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} onCreate={createTask} />
    </div>
  );
}
