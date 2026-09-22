import type { Appointment, Department, WeeklyScore } from "../store/types";

// Computed once per page load from the real clock — the original prototype
// froze this at a fixed demo date ("2026-09-10"), which was fine for a
// static demo but goes stale every day once the app is live.
function computeTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const TODAY = computeTodayKey();

/** Real department → code mapping, extracted from the Kaizen tracker's
 * "Master data" sheet (each department has one fixed code throughout). */
export const DEPARTMENTS: Department[] = [
  { name: "Marketing", code: "MK" },
  { name: "Management", code: "MM" },
  { name: "Sales Offline", code: "S-OFF" },
  { name: "Sales Online", code: "S-ON" },
  { name: "Medical Team L1", code: "OP-L1" },
  { name: "Medical Team L2", code: "OP-L2" },
  { name: "Student Support Team", code: "OP-CS" },
  { name: "Technology", code: "TECH" },
  { name: "HR", code: "HR" },
  { name: "Admin", code: "AD" },
  { name: "NSI", code: "NSI" },
  { name: "TFS", code: "TFS" },
  { name: "Food Master", code: "FM" },
  { name: "Content Creating", code: "CC" },
  { name: "Accounts", code: "AC" },
  { name: "Physio", code: "PHY" },
  { name: "Dental", code: "Den" },
  { name: "FFC", code: "FFC" },
  { name: "R&D", code: "R&D" },
];

export function deptCodeFor(name: string): string {
  return DEPARTMENTS.find((d) => d.name === name)?.code ?? "";
}

export function fmtDate(d?: string): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isOverdue(dateStr?: string, status?: string): boolean {
  if (!dateStr) return false;
  if (status && ["Completed", "Cancelled"].includes(status)) return false;
  return new Date(dateStr) < new Date(TODAY);
}

export function withinHorizon(dateStr: string, days: number): boolean {
  const start = new Date(TODAY);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  const dt = new Date(dateStr);
  return dt >= start && dt <= end;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function nowTimeString(): string {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Default slot length assumed for every appointment, used only for
 * conflict detection — the data model has no explicit end-time/duration
 * field, so this is the smallest safe stand-in for real time-range overlap
 * checking rather than inventing a new scheduling concept for it. */
export const APPOINTMENT_SLOT_MINUTES = 30;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Appointments on the same date whose assumed [start, start+30min) window
 * overlaps the given date/time. Rejected requests are excluded since a
 * declined request no longer holds the slot. */
export function findAppointmentConflicts(appointments: Appointment[], date: string, time: string): Appointment[] {
  if (!date || !time) return [];
  const start = timeToMinutes(time);
  const end = start + APPOINTMENT_SLOT_MINUTES;
  return appointments.filter((a) => {
    if (a.approval === "Rejected" || a.date !== date) return false;
    const aStart = timeToMinutes(a.time);
    const aEnd = aStart + APPOINTMENT_SLOT_MINUTES;
    return start < aEnd && aStart < end;
  });
}

/** Standard working day, per the real weekly-tracker sheet this mirrors. */
export const STANDARD_DAY_HOURS = 8;

export function dayEffectivenessPct(hours: number): number {
  return Math.round((hours / STANDARD_DAY_HOURS) * 100);
}

/** Mirrors the source sheet's two week-level rollups: Effectiveness% = total
 * hours worked / theoretical week capacity (tracked days × 8h); Efficiency =
 * average hours worked per tracked day. Uses days.length rather than a fixed
 * 6 so partial weeks at a month's start/end (e.g. only Mon-Wed) still divide
 * correctly instead of being understated against a full week's capacity. */
export function computeWeekTotals(days: { hours: number }[]) {
  const totalHours = days.reduce((sum, d) => sum + (d.hours || 0), 0);
  const capacity = days.length * STANDARD_DAY_HOURS;
  const effectivenessPct = capacity > 0 ? Math.round((totalHours / capacity) * 100) : 0;
  const efficiencyAvg = days.length > 0 ? Math.round((totalHours / days.length) * 10) / 10 : 0;
  return { totalHours, effectivenessPct, efficiencyAvg };
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Splits a calendar month into the same Mon-Sat week blocks the real
 * tracker sheet uses (Sunday is never tracked at all; a week simply skips
 * over it to the next Monday), producing one blank WeeklyScore record per
 * week — this is what lets scoring continue into new months automatically
 * instead of stopping wherever the seed data happened to end. */
export function buildMonthWeeklyScores(year: number, monthIndex: number): Omit<WeeklyScore, "id">[] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthLabel = new Date(year, monthIndex, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const groups: Date[][] = [];
  let current: Date[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const dow = date.getDay();
    if (dow === 0) {
      if (current.length) groups.push(current);
      current = [];
      continue;
    }
    if (dow === 1 && current.length) {
      groups.push(current);
      current = [];
    }
    current.push(date);
    if (dow === 6) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length) groups.push(current);

  return groups.map((group, i) => {
    const first = group[0];
    const last = group[group.length - 1];
    const rangeLabel =
      first.getDate() === last.getDate()
        ? `${String(first.getDate()).padStart(2, "0")} ${MONTH_ABBR[monthIndex]}`
        : `${String(first.getDate()).padStart(2, "0")} - ${String(last.getDate()).padStart(2, "0")} ${MONTH_ABBR[monthIndex]}`;
    return {
      monthLabel,
      weekLabel: `${MONTH_ABBR[monthIndex]} ${ORDINALS[i] ?? `${i + 1}th`} Week`,
      rangeLabel,
      days: group.map((d) => ({ date: toDateKey(d), label: DOW_LABELS[d.getDay()], hours: 0, notes: "" })),
    };
  });
}
