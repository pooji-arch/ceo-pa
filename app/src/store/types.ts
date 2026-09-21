export type Role = "CEO" | "PA";

export type Priority = "Low" | "Medium" | "High" | "Critical";

export type ApprovalStatus = "Pending" | "Approved" | "Rejected" | "Postponed";
export type MeetingLinkStatus = "Pending" | "Scheduled" | "Cancelled";

export interface Appointment {
  id: string;
  requester: string;
  dept: string;
  purpose: string;
  date: string;
  time: string;
  priority: Priority;
  approval: ApprovalStatus;
  meeting: MeetingLinkStatus;
  reason?: string;
}

export interface VisitorHistoryEntry {
  name: string;
  date: string;
  purpose: string;
  outcome: string;
}

export interface UnplannedVisitor {
  name: string;
  purpose: string;
  decision: string;
  remarks: string;
}

export type TaskStatus =
  | "New"
  | "In Progress"
  | "Completed"
  | "Postponed"
  | "Cancelled"
  | "Blocked";

export interface Task {
  id: string;
  title: string;
  description?: string;
  owner: string;
  dept: string;
  priority: Priority;
  status: TaskStatus;
  due: string;
  followup: string;
  remarks: string;
  completion?: string;
  outcome?: string;
  attachment?: string;
}

export type MeetingStatus = "Scheduled" | "Completed" | "Cancelled";

export interface Meeting {
  id: string;
  purpose: string;
  participants: string;
  date: string;
  time: string;
  agenda: string;
  status: MeetingStatus;
}

export type ActionPointStatus = "New" | "In Progress" | "Completed";

export interface ActionPoint {
  meeting: string;
  point: string;
  owner: string;
  due: string;
  status: ActionPointStatus;
}

export type KaizenStatus = "New" | "Under Process" | "Hold" | "Completed";

export interface Department {
  name: string;
  code: string;
}

/** Real values seen in the tracker's "Approval Status" column. In the real
 * sheet this is set once per idea (shown as a single merged cell spanning
 * every milestone row under it), not chosen separately per milestone. */
export type KaizenApproval =
  | "Hold"
  | "Approved"
  | "Not Approved"
  | "Already in Plan"
  | "Already there"
  | "NSI"
  | "Given idea"
  | "Check with CEO/DR";

export type YesNoNA = "-" | "Yes" | "No" | "NA";

/** Mirrors the real "Master data" tracker's flat row: almost every column is
 * set once per idea and shown as a single cell spanning every milestone row
 * under it (department, owner, approval, impact, etc.) — only a milestone's
 * own timeline and status genuinely differ row to row (see Milestone below). */
export interface KaizenIdea {
  id: string;
  dept: string;
  deptCode: string;
  date: string; // date the idea was raised
  title: string; // the Kaizen idea itself
  champion: string; // Owner, shown as "Owner" in the UI
  executedBy: string[]; // can be several people/departments, added one at a time
  impactDept: string;
  approval: KaizenApproval; // "Approval Status"
  status: KaizenStatus; // "Project Status"
  projectEndDate: string;
  impact: string;
  impactTimeline: string;
  impactResult: string;
  completionMonth: string;
  scoringStatus: string;
  impactStudy: string;
  yesNo: YesNoNA;
  addToEffort: YesNoNA;
  resultDocLink: string;
  progress: number;
  contributors: Contributor[];
}

/** Mirrors the real "Individual Score" tracker's per-idea contributor ledger.
 * Rubric: Idea = 1pt (to whoever proposed it); Execution = 2pts split across
 * everyone involved; Ontime completion = 1pt (also split); Impact = 1pt
 * shared between owner and executor(s) — but the real sheet enters these by
 * hand per contributor rather than auto-splitting, so each field here is a
 * free numeric entry too. Total Score is simply their sum. */
export interface Contributor {
  name: string;
  idea: number;
  execution: number;
  ontime: number;
  impact: number;
}

export type MilestoneStatus = "NA" | "On-time Completion" | "Overdue Completion" | "Hold";

/** One milestone row under a Kaizen idea — only its own name and timeline are
 * unique per row; every other tracked detail lives on the parent KaizenIdea. */
export interface Milestone {
  id: string;
  kaizenId: string;
  title: string; // milestone description
  startDate: string;
  endDate: string;
  secondEndDate: string;
  completedDate: string; // "MS Completed Date"
  status: MilestoneStatus; // "Milestone Status"
}

export type DietStatus = "Pending" | "In Progress" | "Completed";

export interface DietQuery {
  id: string;
  query: string;
  requester: string;
  responsible: string;
  date: string;
  followup: string;
  status: DietStatus;
  remarks: string;
  resolution?: string;
}

export interface DailyActivity {
  date: string;
  type: "Meeting" | "Task" | "Follow-up" | "Decision" | "Important Activity";
  desc: string;
  outcome: string;
}

export type OtherTaskStatus = "New" | "In Progress" | "Completed";

export interface OtherTask {
  title: string;
  owner: string;
  due: string;
  status: OtherTaskStatus;
}

/** One day's row within a weekly CEO scoring record — mirrors the real
 * "My RCD & Weekly Schedule" tracker: hours worked, notes on what was done,
 * and a per-day effectiveness % derived from hours (see computeWeekTotals). */
export interface DayWork {
  date: string;
  label: string; // "Mon".."Sat"
  hours: number;
  notes: string;
}

export interface WeeklyScore {
  id: string;
  monthLabel: string; // e.g. "September 2026"
  weekLabel: string; // e.g. "SEP 1st Week"
  rangeLabel: string; // e.g. "01 - 05 Sep"
  days: DayWork[]; // Monday..Saturday — usually 6 entries, fewer for a partial week at a month boundary
}

/** A free-text plan-vs-actual note for one calendar day, independent of the
 * formal Task/Appointment/Meeting modules — for the case where the PA had
 * something in mind for the day (shown grey on the calendar since it's not a
 * tracked commitment) but ended up doing something else instead (logged here
 * one entry at a time, shown in colour). */
export interface DayNote {
  date: string;
  planned: string;
  actuals: string[];
}

export interface AppNotification {
  icon: string;
  text: string;
  time: string;
  unread: boolean;
}

export interface AuditEntry {
  ts: string;
  user: string;
  action: string;
}

export interface WeekEvent {
  t: string;
  hi: boolean;
}

export type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
