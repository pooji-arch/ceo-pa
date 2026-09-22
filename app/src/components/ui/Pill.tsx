import { cx } from "../../lib/utils";

const STATUS_STYLES: Record<string, string> = {
  New: "fv-tone-blue",
  "In Progress": "fv-tone-amber",
  "Under Process": "fv-tone-amber",
  Completed: "fv-tone-green",
  Postponed: "fv-tone-neutral",
  Hold: "fv-tone-neutral",
  Cancelled: "fv-tone-red",
  Blocked: "fv-tone-red",
  Pending: "fv-tone-amber",
  Approved: "fv-tone-green",
  Rejected: "fv-tone-red",
  Rescheduled: "fv-tone-blue",
  Scheduled: "fv-tone-blue",
  "Unplanned Visit": "fv-tone-violet",
  NA: "fv-tone-neutral",
  "On-time Completion": "fv-tone-green",
  "Overdue Completion": "fv-tone-red",
  "Not Approved": "fv-tone-red",
  "Already in Plan": "fv-tone-blue",
  "Already there": "fv-tone-neutral",
  "Given idea": "fv-tone-blue",
  "Check with CEO/DR": "fv-tone-amber",
};

export function Pill({ status }: { status: string }) {
  return (
    <span className={cx("fv-pill-status", STATUS_STYLES[status] || "fv-tone-violet")}>
      {status}
    </span>
  );
}

const PRIO_STYLES: Record<string, string> = {
  Low: "fv-tone-neutral",
  Medium: "fv-tone-blue",
  High: "fv-tone-amber",
  Critical: "fv-tone-red",
};

export function PriorityTag({ priority }: { priority: string }) {
  return (
    <span className={cx("fv-pill-priority", PRIO_STYLES[priority] || "fv-tone-violet")}>
      {priority}
    </span>
  );
}
