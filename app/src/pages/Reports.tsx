import { useState } from "react";
import { LayoutDashboard, ClipboardList, CalendarRange, UserCheck, AlertTriangle, Users, Sparkles, Target, Trophy, MessageSquare, Clock3, Star, Salad } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Icon3D, type IconTone } from "../components/ui/Icon3D";
import { fmtDate, computeWeekTotals } from "../lib/utils";
import { useAppointments } from "../hooks/useAppointments";
import { useTasks } from "../hooks/useTasks";
import { useMeetings, useActionPoints } from "../hooks/useMeetings";
import { useKaizenIdeas } from "../hooks/useKaizenIdeas";
import { useAllMilestones } from "../hooks/useMilestones";
import { useLeaderboard } from "../hooks/useContributors";
import { useDailyActivities } from "../hooks/useDailyActivities";
import { useOtherTasks } from "../hooks/useOtherTasks";
import { useWeeklyScores } from "../hooks/useWeeklyScores";
import { useDietQueries } from "../hooks/useDietQueries";
import { ReportViewerModal, type ReportDef } from "../components/reports/ReportViewerModal";

export default function Reports() {
  const { appointments, loading: apptLoading } = useAppointments();
  const { tasks, loading: tasksLoading } = useTasks();
  const { meetings, loading: meetingsLoading } = useMeetings();
  const { actionPoints, loading: apLoading } = useActionPoints();
  const { kaizenIdeas, loading: kaizenLoading } = useKaizenIdeas();
  const { milestones, loading: milestonesLoading } = useAllMilestones();
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard();
  const { dailyActivities, loading: dailyLoading } = useDailyActivities();
  const { otherTasks, loading: otherLoading } = useOtherTasks();
  const { weeklyScores, loading: scoresLoading } = useWeeklyScores();
  const { dietQueries, loading: dietLoading } = useDietQueries();

  const [openReport, setOpenReport] = useState<ReportDef | null>(null);

  const reports: { title: string; desc: string; icon: typeof LayoutDashboard; tone: IconTone; def: ReportDef }[] = [
    {
      title: "CEO Dashboard", desc: "All appointments and their approval status", icon: LayoutDashboard, tone: "violet",
      def: {
        title: "CEO Dashboard", loading: apptLoading,
        columns: [{ key: "requester", label: "Requester" }, { key: "dept", label: "Dept" }, { key: "purpose", label: "Purpose" }, { key: "date", label: "Date" }, { key: "priority", label: "Priority" }, { key: "approval", label: "Approval" }, { key: "meeting", label: "Meeting" }],
        rows: appointments.map((a) => ({ ...a, date: fmtDate(a.date) })),
      },
    },
    {
      title: "PA Daily Dashboard", desc: "Flexible catch-all tasks PA is tracking", icon: ClipboardList, tone: "blue",
      def: {
        title: "PA Daily Dashboard", loading: otherLoading,
        columns: [{ key: "title", label: "Title" }, { key: "owner", label: "Owner" }, { key: "due", label: "Due" }, { key: "status", label: "Status" }],
        rows: otherTasks.map((o) => ({ ...o, due: fmtDate(o.due) })),
      },
    },
    {
      title: "Weekly Schedule", desc: "Confirmed meetings & priorities", icon: CalendarRange, tone: "cyan",
      def: {
        title: "Weekly Schedule", loading: meetingsLoading,
        columns: [{ key: "purpose", label: "Purpose" }, { key: "participants", label: "Participants" }, { key: "date", label: "Date" }, { key: "time", label: "Time" }, { key: "status", label: "Status" }],
        rows: meetings.map((m) => ({ ...m, date: fmtDate(m.date) })),
      },
    },
    {
      title: "Appointment & Visitor Report", desc: "All requests and history", icon: UserCheck, tone: "pink",
      def: {
        title: "Appointment & Visitor Report", loading: apptLoading,
        columns: [{ key: "requester", label: "Requester" }, { key: "dept", label: "Dept" }, { key: "purpose", label: "Purpose" }, { key: "date", label: "Date" }, { key: "time", label: "Time" }, { key: "priority", label: "Priority" }, { key: "approval", label: "Approval" }, { key: "meeting", label: "Meeting" }],
        rows: appointments.map((a) => ({ ...a, date: fmtDate(a.date) })),
      },
    },
    {
      title: "Pending / Overdue Follow-up Report", desc: "Tasks needing attention", icon: AlertTriangle, tone: "red",
      def: {
        title: "Pending-Overdue Follow-up Report", loading: tasksLoading,
        columns: [{ key: "title", label: "Title" }, { key: "owner", label: "Owner" }, { key: "dept", label: "Dept" }, { key: "due", label: "Due" }, { key: "status", label: "Status" }, { key: "overdueLabel", label: "Overdue" }],
        rows: tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled")
          .map((t) => ({ ...t, due: fmtDate(t.due), overdueLabel: t.overdue ? "Yes" : "No" })),
      },
    },
    {
      title: "GM/AGM Follow-up Report", desc: "By responsible person", icon: Users, tone: "amber",
      def: {
        title: "GM-AGM Follow-up Report", loading: tasksLoading,
        columns: [{ key: "owner", label: "Owner" }, { key: "title", label: "Title" }, { key: "dept", label: "Dept" }, { key: "priority", label: "Priority" }, { key: "due", label: "Due" }, { key: "status", label: "Status" }],
        rows: [...tasks].sort((a, b) => a.owner.localeCompare(b.owner)).map((t) => ({ ...t, due: fmtDate(t.due) })),
      },
    },
    {
      title: "Kaizen Report", desc: "Ideas, status and progress", icon: Sparkles, tone: "green",
      def: {
        title: "Kaizen Report", loading: kaizenLoading,
        columns: [{ key: "dept", label: "Dept" }, { key: "date", label: "Date" }, { key: "title", label: "Idea" }, { key: "champion", label: "Owner" }, { key: "status", label: "Status" }, { key: "progress", label: "Progress %" }],
        rows: kaizenIdeas.map((k) => ({ ...k, date: fmtDate(k.date) })),
      },
    },
    {
      title: "Milestone Report", desc: "Target dates and completion", icon: Target, tone: "violet",
      def: {
        title: "Milestone Report", loading: milestonesLoading,
        columns: [{ key: "title", label: "Milestone" }, { key: "startDate", label: "Start" }, { key: "endDate", label: "End" }, { key: "completedDate", label: "Completed" }, { key: "status", label: "Status" }],
        rows: milestones.map((m) => ({ ...m, startDate: fmtDate(m.startDate), endDate: fmtDate(m.endDate), completedDate: fmtDate(m.completedDate) })),
      },
    },
    {
      title: "Champion-wise Report", desc: "Workload by champion", icon: Trophy, tone: "amber",
      def: {
        title: "Champion-wise Report", loading: leaderboardLoading,
        columns: [{ key: "rank", label: "Rank" }, { key: "name", label: "Name" }, { key: "total", label: "Total Score" }],
        rows: leaderboard.map((row, i) => ({ rank: i + 1, ...row })),
      },
    },
    {
      title: "Meeting Action-Point Report", desc: "Open and closed action points", icon: MessageSquare, tone: "blue",
      def: {
        title: "Meeting Action-Point Report", loading: apLoading,
        columns: [{ key: "meeting", label: "Meeting" }, { key: "point", label: "Action Point" }, { key: "owner", label: "Owner" }, { key: "due", label: "Due" }, { key: "status", label: "Status" }],
        rows: actionPoints.map((p) => ({ ...p, due: fmtDate(p.due) })),
      },
    },
    {
      title: "Daily Completed Activities", desc: "Historical activity log", icon: Clock3, tone: "ink",
      def: {
        title: "Daily Completed Activities", loading: dailyLoading,
        columns: [{ key: "date", label: "Date" }, { key: "type", label: "Type" }, { key: "desc", label: "Description" }, { key: "outcome", label: "Outcome" }],
        rows: dailyActivities.map((d) => ({ ...d, date: fmtDate(d.date) })),
      },
    },
    {
      title: "CEO Scoring Report", desc: "Trend and history", icon: Star, tone: "amber",
      def: {
        title: "CEO Scoring Report", loading: scoresLoading,
        columns: [{ key: "weekLabel", label: "Week" }, { key: "rangeLabel", label: "Range" }, { key: "totalHours", label: "Total Hours" }, { key: "effectivenessPct", label: "Effectiveness %" }, { key: "efficiencyAvg", label: "Efficiency (hrs/day)" }],
        rows: weeklyScores.map((w) => ({ weekLabel: w.weekLabel, rangeLabel: w.rangeLabel, ...computeWeekTotals(w.days) })),
      },
    },
    {
      title: "Diet Query Follow-up Report", desc: "Open and resolved queries", icon: Salad, tone: "green",
      def: {
        title: "Diet Query Follow-up Report", loading: dietLoading,
        columns: [{ key: "query", label: "Query" }, { key: "requester", label: "Requester" }, { key: "responsible", label: "Responsible" }, { key: "date", label: "Date" }, { key: "followup", label: "Follow-up" }, { key: "status", label: "Status" }, { key: "resolution", label: "Resolution" }],
        rows: dietQueries.map((d) => ({ ...d, date: fmtDate(d.date), followup: fmtDate(d.followup), resolution: d.resolution ?? "—" })),
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Card
            key={r.title}
            hover
            className="p-4 flex items-center gap-4 cursor-pointer"
            onClick={() => setOpenReport(r.def)}
          >
            <Icon3D tone={r.tone} size="md"><r.icon size={19} color="#fff" /></Icon3D>
            <div>
              <div className="font-bold text-[13.5px] text-ink-900">{r.title}</div>
              <div className="text-[11.5px] text-ink-500 mt-0.5">{r.desc}</div>
            </div>
          </Card>
        ))}
      </div>

      <ReportViewerModal report={openReport} onClose={() => setOpenReport(null)} />
    </div>
  );
}
