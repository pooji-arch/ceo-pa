const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
const STANDARD_DAY_HOURS = 8;

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface GeneratedWeek {
  monthLabel: string;
  weekLabel: string;
  rangeLabel: string;
  days: { date: string; label: string; hours: number; notes: string }[];
}

// Ports app/src/lib/utils.ts's buildMonthWeeklyScores exactly: splits a
// calendar month into Mon-Sat week blocks (Sunday is never tracked, a week
// just skips over it to the next Monday) — this is what lets the "Add Next
// Month" continuation generate the same shape the frontend already renders.
export function buildMonthWeeks(year: number, monthIndex: number): GeneratedWeek[] {
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

// Ports app/src/lib/utils.ts's computeWeekTotals exactly: Effectiveness% =
// total hours worked / theoretical week capacity (tracked days x 8h);
// Efficiency = average hours worked per tracked day.
export function computeWeekTotals(days: { hours: number }[]) {
  const totalHours = days.reduce((sum, d) => sum + (d.hours || 0), 0);
  const capacity = days.length * STANDARD_DAY_HOURS;
  const effectivenessPct = capacity > 0 ? Math.round((totalHours / capacity) * 100) : 0;
  const efficiencyAvg = days.length > 0 ? Math.round((totalHours / days.length) * 10) / 10 : 0;
  return { totalHours, effectivenessPct, efficiencyAvg };
}
