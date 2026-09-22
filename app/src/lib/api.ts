import type {
  Appointment, ApprovalStatus, AppNotification, AuditEntry, Contributor, DailyActivity, DayNote, DayWork, DietQuery,
  DietStatus, KaizenApproval, KaizenIdea, KaizenStatus, Meeting, Milestone, MilestoneStatus, OtherTask, Priority,
  Role, Task, TaskStatus, VisitorHistoryEntry, WeeklyScore, YesNoNA,
} from "../store/types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

async function request<T>(path: string, options: RequestInit & { token?: string | null } = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new ApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message ?? "Something went wrong.");
  }
  return body.data as T;
}

// The backend serializes @db.Date columns as full ISO datetimes at UTC
// midnight (e.g. "2026-09-10T00:00:00.000Z"); the frontend works with plain
// "YYYY-MM-DD" strings throughout, so every date-bearing field is trimmed here.
function d(iso: string): string {
  return iso.slice(0, 10);
}

interface AppointmentDto {
  id: string; requester: string; dept: string; purpose: string; date: string; time: string;
  priority: Priority; approval: ApprovalStatus; meeting: Appointment["meeting"]; reason: string | null;
  visitors: string[];
}
function mapAppointment(a: AppointmentDto): Appointment {
  return { id: a.id, requester: a.requester, dept: a.dept, purpose: a.purpose, date: d(a.date), time: a.time, priority: a.priority, approval: a.approval, meeting: a.meeting, reason: a.reason ?? undefined, visitors: a.visitors ?? [] };
}

interface VisitorHistoryDto { id: string; name: string; date: string; purpose: string; outcome: string }
function mapVisitorHistory(v: VisitorHistoryDto): VisitorHistoryEntry {
  return { name: v.name, date: d(v.date), purpose: v.purpose, outcome: v.outcome };
}

interface TaskDto {
  id: string; title: string; description: string | null; owner: string; dept: string; priority: Priority;
  status: TaskStatus; due: string; followup: string; remarks: string; completion: string | null;
  outcome: string | null; attachment: string | null; overdue: boolean;
}
export interface TaskWithOverdue extends Task { overdue: boolean }
function mapTask(t: TaskDto): TaskWithOverdue {
  return {
    id: t.id, title: t.title, description: t.description ?? undefined, owner: t.owner, dept: t.dept,
    priority: t.priority, status: t.status, due: d(t.due), followup: d(t.followup), remarks: t.remarks,
    completion: t.completion ? d(t.completion) : undefined, outcome: t.outcome ?? undefined,
    attachment: t.attachment ?? undefined, overdue: t.overdue,
  };
}

interface MeetingDto { id: string; purpose: string; participants: string; date: string; time: string; agenda: string; status: Meeting["status"] }
function mapMeeting(m: MeetingDto): Meeting {
  return { id: m.id, purpose: m.purpose, participants: m.participants, date: d(m.date), time: m.time, agenda: m.agenda, status: m.status };
}

export interface ActionPointWithId {
  id: string; meetingId: string; meeting: string; point: string; owner: string; due: string; status: "New" | "In Progress" | "Completed";
}
interface ActionPointDto {
  id: string; meetingId: string; point: string; owner: string; due: string; status: ActionPointWithId["status"];
  meeting: { id: string; purpose: string };
}
function mapActionPoint(p: ActionPointDto): ActionPointWithId {
  return { id: p.id, meetingId: p.meetingId, meeting: p.meeting.purpose, point: p.point, owner: p.owner, due: d(p.due), status: p.status };
}

export interface DailyActivityWithId extends DailyActivity { id: string }
interface DailyActivityDto { id: string; date: string; type: DailyActivity["type"]; desc: string; outcome: string }
function mapDailyActivity(a: DailyActivityDto): DailyActivityWithId {
  return { id: a.id, date: d(a.date), type: a.type, desc: a.desc, outcome: a.outcome };
}

interface DayNoteDto { date: string; planned: string; actuals: string[] }
function mapDayNote(n: DayNoteDto): DayNote {
  return { date: d(n.date), planned: n.planned, actuals: n.actuals };
}

// Read-only feeds for the Dashboard — full CRUD wiring for these entities
// lands with the dedicated Kaizen / Diet / Scoring pages. Nullable date
// fields are coalesced to "" here to match the frontend's existing
// (always-a-string) conventions, same as the mock data did.
export interface DashboardKaizenIdea { id: string; dept: string; title: string; champion: string; status: string; date: string; projectEndDate: string }
export interface DashboardMilestone { id: string; kaizenId: string; title: string; endDate: string; status: string }
export interface DashboardDietQuery { id: string; query: string; followup: string; status: string }
export interface DashboardWeeklyScore { id: string; weekLabel: string; days: { date: string; hours: number }[] }

interface DashboardKaizenIdeaDto { id: string; dept: string; title: string; champion: string; status: string; date: string; projectEndDate: string | null }
function mapDashboardKaizenIdea(k: DashboardKaizenIdeaDto): DashboardKaizenIdea {
  return { id: k.id, dept: k.dept, title: k.title, champion: k.champion, status: k.status, date: d(k.date), projectEndDate: k.projectEndDate ? d(k.projectEndDate) : "" };
}
interface DashboardMilestoneDto { id: string; kaizenIdeaId: string; title: string; endDate: string | null; status: string }
function mapDashboardMilestone(m: DashboardMilestoneDto): DashboardMilestone {
  return { id: m.id, kaizenId: m.kaizenIdeaId, title: m.title, endDate: m.endDate ? d(m.endDate) : "", status: m.status };
}
interface DashboardDietQueryDto { id: string; query: string; followup: string; status: string }
function mapDashboardDietQuery(q: DashboardDietQueryDto): DashboardDietQuery {
  return { id: q.id, query: q.query, followup: d(q.followup), status: q.status };
}
interface DashboardWeeklyScoreDto { id: string; weekLabel: string; days: { date: string; hours: number }[] }
function mapDashboardWeeklyScore(w: DashboardWeeklyScoreDto): DashboardWeeklyScore {
  return { id: w.id, weekLabel: w.weekLabel, days: w.days.map((day) => ({ date: d(day.date), hours: day.hours })) };
}

interface ContributorDto { id: string; kaizenIdeaId: string; name: string; idea: number; execution: number; ontime: number; impact: number }
function mapContributor(c: ContributorDto): Contributor {
  return { name: c.name, idea: c.idea, execution: c.execution, ontime: c.ontime, impact: c.impact };
}

interface KaizenIdeaDto {
  id: string; dept: string; deptCode: string; date: string; title: string; champion: string; executedBy: string[];
  impactDept: string; approval: KaizenApproval; status: KaizenStatus; projectEndDate: string | null; impact: string;
  impactTimeline: string; impactResult: string; completionMonth: string; scoringStatus: string; impactStudy: string;
  yesNo: YesNoNA; addToEffort: YesNoNA; resultDocLink: string; progress: number; contributors: ContributorDto[];
}
function mapKaizenIdea(k: KaizenIdeaDto): KaizenIdea {
  return {
    id: k.id, dept: k.dept, deptCode: k.deptCode, date: d(k.date), title: k.title, champion: k.champion,
    executedBy: k.executedBy, impactDept: k.impactDept, approval: k.approval, status: k.status,
    projectEndDate: k.projectEndDate ? d(k.projectEndDate) : "", impact: k.impact, impactTimeline: k.impactTimeline,
    impactResult: k.impactResult, completionMonth: k.completionMonth, scoringStatus: k.scoringStatus,
    impactStudy: k.impactStudy, yesNo: k.yesNo, addToEffort: k.addToEffort, resultDocLink: k.resultDocLink,
    progress: k.progress, contributors: k.contributors.map(mapContributor),
  };
}

interface MilestoneDto {
  id: string; kaizenIdeaId: string; title: string; startDate: string | null; endDate: string | null;
  secondEndDate: string | null; completedDate: string | null; status: MilestoneStatus;
}
function mapMilestone(m: MilestoneDto): Milestone {
  return {
    id: m.id, kaizenId: m.kaizenIdeaId, title: m.title,
    startDate: m.startDate ? d(m.startDate) : "", endDate: m.endDate ? d(m.endDate) : "",
    secondEndDate: m.secondEndDate ? d(m.secondEndDate) : "", completedDate: m.completedDate ? d(m.completedDate) : "",
    status: m.status,
  };
}

export interface LeaderboardRow { name: string; total: number }
export interface DeptScorecardRow { deptName: string; deptCode: string; ms: number; otc: number; dc: number; nc: number; pct: number | null }
export interface DeptScorecard { availableMonths: string[]; month: string | null; rows: DeptScorecardRow[] }

interface DayWorkDto { id: string; weeklyScoreId: string; date: string; label: string; hours: number; notes: string }
function mapDayWork(dw: DayWorkDto): DayWork {
  return { date: d(dw.date), label: dw.label, hours: dw.hours, notes: dw.notes };
}
interface WeeklyScoreDto { id: string; monthLabel: string; weekLabel: string; rangeLabel: string; days: DayWorkDto[] }
function mapWeeklyScore(w: WeeklyScoreDto): WeeklyScore {
  return { id: w.id, monthLabel: w.monthLabel, weekLabel: w.weekLabel, rangeLabel: w.rangeLabel, days: w.days.map(mapDayWork) };
}

interface DietQueryDto {
  id: string; query: string; requester: string; responsible: string; date: string; followup: string;
  status: DietStatus; remarks: string; resolution: string | null;
}
function mapDietQuery(q: DietQueryDto): DietQuery {
  return { id: q.id, query: q.query, requester: q.requester, responsible: q.responsible, date: d(q.date), followup: d(q.followup), status: q.status, remarks: q.remarks, resolution: q.resolution ?? undefined };
}

export interface OtherTaskWithId extends OtherTask { id: string }
interface OtherTaskDto { id: string; title: string; owner: string; due: string; status: OtherTask["status"] }
function mapOtherTask(o: OtherTaskDto): OtherTaskWithId {
  return { id: o.id, title: o.title, owner: o.owner, due: d(o.due), status: o.status };
}

export interface NotificationWithId extends AppNotification { id: string }
interface NotificationDto { id: string; icon: string; text: string; time: string; unread: boolean }
function mapNotification(n: NotificationDto): NotificationWithId {
  return { id: n.id, icon: n.icon, text: n.text, time: n.time, unread: n.unread };
}

export interface AuditEntryWithId extends AuditEntry { id: string }
interface AuditEntryDto { id: string; ts: string; user: string; action: string }
function mapAuditEntry(a: AuditEntryDto): AuditEntryWithId {
  return { id: a.id, ts: a.ts.replace("T", " ").slice(0, 16), user: a.user, action: a.action };
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: (token: string) => request<{ user: AuthUser }>("/auth/me", { token }),
  logout: (token: string) => request<null>("/auth/logout", { method: "POST", token }),
  googleLoginUrl: () => `${API_BASE}/auth/google`,

  appointments: {
    list: async (token: string) => (await request<{ appointments: AppointmentDto[] }>("/appointments", { token })).appointments.map(mapAppointment),
    create: async (token: string, input: { requester: string; dept: string; purpose: string; date: string; time: string; priority: Priority; approval?: ApprovalStatus; visitors?: string[]; force?: boolean }) =>
      mapAppointment((await request<{ appointment: AppointmentDto }>("/appointments", { method: "POST", token, body: JSON.stringify(input) })).appointment),
    act: async (token: string, id: string, status: "Approved" | "Rejected" | "Postponed", reason?: string) =>
      mapAppointment((await request<{ appointment: AppointmentDto }>(`/appointments/${id}/approval`, { method: "PATCH", token, body: JSON.stringify({ status, reason }) })).appointment),
    reschedule: async (token: string, id: string, date: string, time: string) =>
      mapAppointment((await request<{ appointment: AppointmentDto }>(`/appointments/${id}/reschedule`, { method: "PATCH", token, body: JSON.stringify({ date, time }) })).appointment),
  },

  visitorHistory: {
    list: async (token: string) => (await request<{ visitorHistory: VisitorHistoryDto[] }>("/visitor-history", { token })).visitorHistory.map(mapVisitorHistory),
  },

  unplannedVisitors: {
    create: async (token: string, input: { name: string; purpose: string; decision: string; remarks: string }) => {
      const result = await request<{ unplannedVisitor: unknown; visitorHistoryEntry: VisitorHistoryDto }>("/unplanned-visitors", { method: "POST", token, body: JSON.stringify(input) });
      return { ...result, visitorHistoryEntry: mapVisitorHistory(result.visitorHistoryEntry) };
    },
  },

  tasks: {
    list: async (token: string) => (await request<{ tasks: TaskDto[] }>("/tasks", { token })).tasks.map(mapTask),
    create: async (token: string, input: { title: string; description?: string; owner: string; dept: string; priority: Priority; due: string; followup: string; remarks?: string; outcome?: string; attachment?: string }) =>
      mapTask((await request<{ task: TaskDto }>("/tasks", { method: "POST", token, body: JSON.stringify(input) })).task),
    updateStatus: async (token: string, id: string, status: TaskStatus, opts?: { reason?: string; revisedFollowup?: string }) =>
      mapTask((await request<{ task: TaskDto }>(`/tasks/${id}/status`, { method: "PATCH", token, body: JSON.stringify({ status, ...opts }) })).task),
  },

  meetings: {
    list: async (token: string) => (await request<{ meetings: MeetingDto[] }>("/meetings", { token })).meetings.map(mapMeeting),
    create: async (token: string, input: { purpose: string; participants: string; date: string; time: string; agenda?: string }) =>
      mapMeeting((await request<{ meeting: MeetingDto }>("/meetings", { method: "POST", token, body: JSON.stringify(input) })).meeting),
  },

  actionPoints: {
    list: async (token: string) => (await request<{ actionPoints: ActionPointDto[] }>("/action-points", { token })).actionPoints.map(mapActionPoint),
    create: (token: string, input: { meetingId: string; point: string; owner: string; due: string }) =>
      request<{ actionPoint: unknown }>("/action-points", { method: "POST", token, body: JSON.stringify(input) }),
    convertToTask: async (token: string, id: string) =>
      mapTask((await request<{ task: TaskDto }>(`/action-points/${id}/convert-to-task`, { method: "POST", token })).task),
  },

  dailyActivities: {
    list: async (token: string) => (await request<{ dailyActivities: DailyActivityDto[] }>("/daily-activities", { token })).dailyActivities.map(mapDailyActivity),
    create: async (token: string, input: { type: DailyActivity["type"]; desc: string; outcome: string }) =>
      mapDailyActivity((await request<{ dailyActivity: DailyActivityDto }>("/daily-activities", { method: "POST", token, body: JSON.stringify(input) })).dailyActivity),
  },

  dayNotes: {
    list: async (token: string) => (await request<{ dayNotes: DayNoteDto[] }>("/day-notes", { token })).dayNotes.map(mapDayNote),
    get: async (token: string, date: string) => mapDayNote((await request<{ dayNote: DayNoteDto }>(`/day-notes/${date}`, { token })).dayNote),
    setPlanned: async (token: string, date: string, planned: string) =>
      mapDayNote((await request<{ dayNote: DayNoteDto }>(`/day-notes/${date}/planned`, { method: "PUT", token, body: JSON.stringify({ planned }) })).dayNote),
    addActual: async (token: string, date: string, text: string) =>
      mapDayNote((await request<{ dayNote: DayNoteDto }>(`/day-notes/${date}/actuals`, { method: "POST", token, body: JSON.stringify({ text }) })).dayNote),
    removeActual: async (token: string, date: string, index: number) =>
      mapDayNote((await request<{ dayNote: DayNoteDto }>(`/day-notes/${date}/actuals/${index}`, { method: "DELETE", token })).dayNote),
  },

  dashboard: {
    kaizenIdeas: (token: string) => request<{ kaizenIdeas: DashboardKaizenIdeaDto[] }>("/kaizen-ideas", { token }).then((r) => r.kaizenIdeas.map(mapDashboardKaizenIdea)),
    milestones: (token: string) => request<{ milestones: DashboardMilestoneDto[] }>("/milestones", { token }).then((r) => r.milestones.map(mapDashboardMilestone)),
    dietQueries: (token: string) => request<{ dietQueries: DashboardDietQueryDto[] }>("/diet-queries", { token }).then((r) => r.dietQueries.map(mapDashboardDietQuery)),
    weeklyScores: (token: string) => request<{ weeklyScores: DashboardWeeklyScoreDto[] }>("/weekly-scores", { token }).then((r) => r.weeklyScores.map(mapDashboardWeeklyScore)),
  },

  kaizen: {
    list: async (token: string) => (await request<{ kaizenIdeas: KaizenIdeaDto[] }>("/kaizen-ideas", { token })).kaizenIdeas.map(mapKaizenIdea),
    create: async (token: string, input: { dept: string; title: string; champion: string; date: string; status?: KaizenStatus }) =>
      mapKaizenIdea((await request<{ kaizenIdea: KaizenIdeaDto }>("/kaizen-ideas", { method: "POST", token, body: JSON.stringify(input) })).kaizenIdea),
    updateStatus: async (token: string, id: string, status: KaizenStatus) =>
      mapKaizenIdea((await request<{ kaizenIdea: KaizenIdeaDto }>(`/kaizen-ideas/${id}/status`, { method: "PATCH", token, body: JSON.stringify({ status }) })).kaizenIdea),
    updateApproval: async (token: string, id: string, approval: KaizenApproval) =>
      mapKaizenIdea((await request<{ kaizenIdea: KaizenIdeaDto }>(`/kaizen-ideas/${id}/approval`, { method: "PATCH", token, body: JSON.stringify({ approval }) })).kaizenIdea),
    updateProgress: async (token: string, id: string, progress: number) =>
      mapKaizenIdea((await request<{ kaizenIdea: KaizenIdeaDto }>(`/kaizen-ideas/${id}/progress`, { method: "PATCH", token, body: JSON.stringify({ progress }) })).kaizenIdea),
    updateDetails: async (token: string, id: string, patch: Partial<Omit<KaizenIdea, "id" | "dept" | "deptCode" | "date" | "title" | "status" | "approval" | "progress" | "contributors">>) =>
      mapKaizenIdea((await request<{ kaizenIdea: KaizenIdeaDto }>(`/kaizen-ideas/${id}`, { method: "PATCH", token, body: JSON.stringify(patch) })).kaizenIdea),
    addExecutedBy: async (token: string, id: string, name: string) =>
      mapKaizenIdea((await request<{ kaizenIdea: KaizenIdeaDto }>(`/kaizen-ideas/${id}/executed-by`, { method: "POST", token, body: JSON.stringify({ name }) })).kaizenIdea),
    removeExecutedBy: async (token: string, id: string, name: string) =>
      mapKaizenIdea((await request<{ kaizenIdea: KaizenIdeaDto }>(`/kaizen-ideas/${id}/executed-by/${encodeURIComponent(name)}`, { method: "DELETE", token })).kaizenIdea),
  },

  milestones: {
    listForIdea: async (token: string, kaizenIdeaId: string) =>
      (await request<{ milestones: MilestoneDto[] }>(`/kaizen-ideas/${kaizenIdeaId}/milestones`, { token })).milestones.map(mapMilestone),
    listAll: async (token: string) => (await request<{ milestones: MilestoneDto[] }>("/milestones", { token })).milestones.map(mapMilestone),
    create: async (token: string, kaizenIdeaId: string) =>
      mapMilestone((await request<{ milestone: MilestoneDto }>(`/kaizen-ideas/${kaizenIdeaId}/milestones`, { method: "POST", token })).milestone),
    update: async (token: string, id: string, patch: Partial<Omit<Milestone, "id" | "kaizenId">>) =>
      mapMilestone((await request<{ milestone: MilestoneDto }>(`/milestones/${id}`, { method: "PATCH", token, body: JSON.stringify(patch) })).milestone),
  },

  contributors: {
    listForIdea: async (token: string, kaizenIdeaId: string) =>
      (await request<{ contributors: ContributorDto[] }>(`/kaizen-ideas/${kaizenIdeaId}/contributors`, { token })).contributors.map(mapContributor),
    upsert: async (token: string, kaizenIdeaId: string, name: string, patch: Partial<Omit<Contributor, "name">>) =>
      mapContributor((await request<{ contributor: ContributorDto }>(`/kaizen-ideas/${kaizenIdeaId}/contributors/${encodeURIComponent(name)}`, { method: "PATCH", token, body: JSON.stringify(patch) })).contributor),
  },

  leaderboard: {
    list: (token: string) => request<{ leaderboard: LeaderboardRow[] }>("/kaizen-leaderboard", { token }).then((r) => r.leaderboard),
  },

  deptScorecard: {
    get: (token: string, month?: string) =>
      request<DeptScorecard>(`/kaizen-dept-scorecard${month ? `?month=${encodeURIComponent(month)}` : ""}`, { token }),
  },

  weeklyScores: {
    list: async (token: string) => (await request<{ weeklyScores: WeeklyScoreDto[] }>("/weekly-scores", { token })).weeklyScores.map(mapWeeklyScore),
    updateDay: (token: string, weekId: string, date: string, updates: { hours?: number; notes?: string }) =>
      request<{ dayWork: DayWorkDto }>(`/weekly-scores/${weekId}/days/${date}`, { method: "PATCH", token, body: JSON.stringify(updates) }).then((r) => mapDayWork(r.dayWork)),
    nextMonth: async (token: string) =>
      (await request<{ weeklyScores: WeeklyScoreDto[] }>("/weekly-scores/next-month", { method: "POST", token })).weeklyScores.map(mapWeeklyScore),
  },

  dietQueries: {
    list: async (token: string) => (await request<{ dietQueries: DietQueryDto[] }>("/diet-queries", { token })).dietQueries.map(mapDietQuery),
    create: async (token: string, input: { query: string; requester: string; responsible: string; followup: string; remarks?: string; resolution?: string }) =>
      mapDietQuery((await request<{ dietQuery: DietQueryDto }>("/diet-queries", { method: "POST", token, body: JSON.stringify(input) })).dietQuery),
    updateStatus: async (token: string, id: string, status: DietStatus, resolution?: string) =>
      mapDietQuery((await request<{ dietQuery: DietQueryDto }>(`/diet-queries/${id}/status`, { method: "PATCH", token, body: JSON.stringify({ status, resolution }) })).dietQuery),
  },

  otherTasks: {
    list: async (token: string) => (await request<{ otherTasks: OtherTaskDto[] }>("/other-tasks", { token })).otherTasks.map(mapOtherTask),
    create: async (token: string, input: { title: string; owner: string; due: string }) =>
      mapOtherTask((await request<{ otherTask: OtherTaskDto }>("/other-tasks", { method: "POST", token, body: JSON.stringify(input) })).otherTask),
  },

  notifications: {
    list: async (token: string) => (await request<{ notifications: NotificationDto[] }>("/notifications", { token })).notifications.map(mapNotification),
    markRead: async (token: string, id: string) =>
      mapNotification((await request<{ notification: NotificationDto }>(`/notifications/${id}/read`, { method: "PATCH", token })).notification),
  },

  auditLog: {
    list: async (token: string) => (await request<{ auditLog: AuditEntryDto[] }>("/audit-log", { token })).auditLog.map(mapAuditEntry),
  },
};
