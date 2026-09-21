import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, Plus, CalendarCheck2, Users2, AlertCircle,
  CalendarDays, LayoutGrid, List, CheckCircle2, StickyNote, X,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { ErrorBanner } from "../components/ui/AsyncState";
import { useStore } from "../store/store";
import { useAppointments } from "../hooks/useAppointments";
import { useMeetings } from "../hooks/useMeetings";
import { useTasks } from "../hooks/useTasks";
import { useDailyActivities } from "../hooks/useDailyActivities";
import { useDayNote, useDayNotesList } from "../hooks/useDayNote";
import { cx, fmtDate, TODAY } from "../lib/utils";
import { TaskModal } from "../components/modals/ExecutionModals";
import "./WeeklySchedule.css";

const TODAY_KEY = TODAY;
// The anchor month the calendar opens on (monthOffset 0) — today's real
// month, not a fixed date, so navigation keeps working correctly as time moves on.
const [ANCHOR_YEAR, ANCHOR_MONTH_INDEX] = TODAY_KEY.split("-").map(Number) as [number, number];
const YEAR = ANCHOR_YEAR;
const MONTH_INDEX = ANCHOR_MONTH_INDEX - 1;
const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Kind = "appointment" | "meeting" | "task" | "daily" | "note";

/** "actual" = this really happened (or is still an open, live plan) —
 *  rendered in its normal category colour.
 *  "fellThrough" = a formal commitment (appointment/meeting/task) that was
 *  postponed, cancelled, or rejected — rendered in red, NOT grey.
 *  "notePlanned" = the free-text ad-hoc "planned" note from the quick-add
 *  popup — the ONLY thing rendered grey. */
type Variant = "actual" | "fellThrough" | "notePlanned";

interface CalEntry {
  key: string;
  date: string;
  label: string;
  time?: string;
  kind: Kind;
  variant: Variant;
  statusNote?: string;
}

// Frosted Violet palette: brand violet for meetings, and the shared status
// colors (blue / red / amber / green) for the other entry kinds.
const KIND_META: Record<Kind, { icon: typeof CalendarCheck2; bg: string; text: string; dot: string }> = {
  appointment: { icon: CalendarCheck2, bg: "rgba(79,124,240,0.16)", text: "#2f4fb0", dot: "#4f7cf0" },
  meeting: { icon: Users2, bg: "rgba(139,92,246,0.16)", text: "#5b21b6", dot: "#8b5cf6" },
  task: { icon: AlertCircle, bg: "rgba(245,158,11,0.16)", text: "#b45309", dot: "#f59e0b" },
  daily: { icon: CheckCircle2, bg: "rgba(16,185,129,0.16)", text: "#059669", dot: "#10b981" },
  note: { icon: StickyNote, bg: "rgba(6,182,212,0.16)", text: "#0e7490", dot: "#06b6d4" },
};
const FELL_THROUGH_META = { bg: "rgba(225,29,72,0.14)", text: "#be123c", dot: "#e11d48" };
const NOTE_PLANNED_META = { bg: "rgba(107,114,128,0.14)", text: "#4b5563", dot: "#9ca3af" };

function metaFor(e: CalEntry) {
  if (e.variant === "notePlanned") return NOTE_PLANNED_META;
  if (e.variant === "fellThrough") return FELL_THROUGH_META;
  return KIND_META[e.kind];
}

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildMonthCells(year: number, monthIndex: number) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startDow = firstOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
  const gridStart = new Date(year, monthIndex, 1 - startDow);
  return Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

/** Quick-add popup for one calendar day: a grey "what was planned" note on
 * the left, and a growing list of "what actually happened instead" entries
 * on the right, added one at a time — independent of the formal
 * Task/Appointment/Meeting modules, for the ad-hoc stuff that doesn't fit
 * those. */
function DayPlanModal({ date, onClose }: { date: string | null; onClose: () => void }) {
  const { note, setPlanned: saveDayPlanned, addActual, removeActual } = useDayNote(date);

  const [planned, setPlanned] = useState(note?.planned ?? "");
  const [actualInput, setActualInput] = useState("");

  useEffect(() => {
    setPlanned(note?.planned ?? "");
    setActualInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  if (!date) return null;

  const commitActual = () => {
    const text = actualInput.trim();
    if (!text) return;
    addActual(text);
    setActualInput("");
  };

  return (
    <Modal
      open={!!date}
      onClose={onClose}
      title={`Plan vs Actual — ${fmtDate(date)}`}
      width={580}
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-xl p-3 flex flex-col"
          style={{ background: "rgba(107,114,128,0.08)", border: "1px dashed rgba(107,114,128,0.4)" }}
        >
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-500 mb-2">Planned (grey)</div>
          <textarea
            rows={7}
            value={planned}
            onChange={(e) => setPlanned(e.target.value)}
            onBlur={() => saveDayPlanned(planned)}
            placeholder="What was supposed to happen today?"
            className="flex-1 w-full bg-transparent outline-none text-[12.5px] text-gray-600 italic resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-ink-500">Actual — one by one</div>
          <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-0.5">
            {note?.actuals.length ? note.actuals.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-[12px]"
                style={{ background: "rgba(6,182,212,0.12)", color: "#0e7490" }}
              >
                <span className="flex-1">{a}</span>
                <button onClick={() => removeActual(i)} className="opacity-50 hover:opacity-100 shrink-0" title="Remove">
                  <X size={12} />
                </button>
              </div>
            )) : (
              <div className="text-[11.5px] text-ink-300 italic py-2">Nothing logged yet.</div>
            )}
          </div>
          <div className="flex gap-2 mt-auto">
            <input
              value={actualInput}
              onChange={(e) => setActualInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitActual(); }}
              placeholder="What did they do instead?"
              className="glass-input flex-1 px-2.5 py-2 text-[12.5px]"
            />
            <Button size="sm" variant="primary" onClick={commitActual}>Add</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function WeeklySchedule() {
  const role = useStore((s) => s.role);
  const isPA = role === "PA";
  const { appointments, error: apptError, refetch: refetchAppts } = useAppointments();
  const { meetings, error: meetingsError, refetch: refetchMeetings } = useMeetings();
  const { tasks, error: tasksError, refetch: refetchTasks, createTask } = useTasks();
  const { dailyActivities, error: dailyError, refetch: refetchDaily } = useDailyActivities();
  const { dayNotes, error: notesError, refetch: refetchDayNotes } = useDayNotesList();
  const loadError = apptError || meetingsError || tasksError || dailyError || notesError;
  const retryAll = () => { refetchAppts(); refetchMeetings(); refetchTasks(); refetchDaily(); refetchDayNotes(); };
  const [monthOffset, setMonthOffset] = useState(0);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);

  const rawMonthIndex = MONTH_INDEX + monthOffset;
  const targetYear = YEAR + Math.floor(rawMonthIndex / 12);
  const targetMonthIndex = ((rawMonthIndex % 12) + 12) % 12;
  const monthLabel = new Date(targetYear, targetMonthIndex, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells = useMemo(() => buildMonthCells(targetYear, targetMonthIndex), [targetYear, targetMonthIndex]);

  // Built across ALL data (not scoped to the displayed month) so flipping
  // months always shows the real picture instead of a dead "no data" wall —
  // most months will simply be sparse/empty, which is honest, not broken.
  const eventMap = useMemo(() => {
    const map: Record<string, CalEntry[]> = {};
    const push = (e: CalEntry) => { (map[e.date] ||= []).push(e); };

    appointments.forEach((a) => {
      const label = `${a.requester} — ${a.purpose}`;
      if (a.approval === "Approved" || a.approval === "Pending") {
        push({ key: `apt-${a.id}`, date: a.date, label, time: a.time, kind: "appointment", variant: "actual" });
      } else {
        // Rejected / Postponed: a real commitment that fell through — red, not grey.
        push({ key: `apt-${a.id}`, date: a.date, label, time: a.time, kind: "appointment", variant: "fellThrough", statusNote: a.approval });
      }
    });

    meetings.forEach((m) => {
      if (m.status === "Cancelled") {
        push({ key: `mtg-${m.id}`, date: m.date, label: m.purpose, time: m.time, kind: "meeting", variant: "fellThrough", statusNote: "Cancelled" });
      } else {
        push({ key: `mtg-${m.id}`, date: m.date, label: m.purpose, time: m.time, kind: "meeting", variant: "actual" });
      }
    });

    tasks.forEach((t) => {
      if (t.status === "Postponed" || t.status === "Cancelled") {
        // red marker on the original due date — a commitment that fell through
        push({ key: `tsk-${t.id}-due`, date: t.due, label: t.title, kind: "task", variant: "fellThrough", statusNote: t.status });
        // if it was rescheduled to a real new date, that's the actual new plan — show it in colour there
        if (t.status === "Postponed" && t.followup && t.followup !== t.due) {
          push({ key: `tsk-${t.id}-followup`, date: t.followup, label: `${t.title} (rescheduled)`, kind: "task", variant: "actual" });
        }
      } else if (t.status === "Completed") {
        push({ key: `tsk-${t.id}`, date: t.completion || t.due, label: t.title, kind: "task", variant: "actual" });
      } else {
        push({ key: `tsk-${t.id}`, date: t.due, label: t.title, kind: "task", variant: "actual" });
      }
    });

    // What was actually done that day, whether or not it matched the plan —
    // this is the "did something else instead" half of the picture.
    dailyActivities.forEach((d, i) => {
      push({ key: `daily-${d.date}-${i}`, date: d.date, label: d.desc, kind: "daily", variant: "actual" });
    });

    // Ad-hoc plan-vs-actual notes typed directly on the calendar (see
    // DayPlanModal) — the ONLY grey entries; their "actual" counterparts are
    // free-text and independent of the formal modules, so they render like
    // any other coloured entry.
    Object.values(dayNotes).forEach((note) => {
      if (note.planned) {
        push({ key: `note-planned-${note.date}`, date: note.date, label: note.planned, kind: "note", variant: "notePlanned", statusNote: "Planned" });
      }
      note.actuals.forEach((text, i) => {
        push({ key: `note-actual-${note.date}-${i}`, date: note.date, label: text, kind: "note", variant: "actual" });
      });
    });

    const variantOrder: Record<Variant, number> = { notePlanned: 0, fellThrough: 1, actual: 2 };
    Object.values(map).forEach((list) =>
      list.sort((a, b) => variantOrder[a.variant] - variantOrder[b.variant] || (a.time ?? "99:99").localeCompare(b.time ?? "99:99"))
    );
    return map;
  }, [appointments, meetings, tasks, dailyActivities, dayNotes]);

  const monthStartKey = toKey(new Date(targetYear, targetMonthIndex, 1));
  const monthEndKey = toKey(new Date(targetYear, targetMonthIndex + 1, 0));
  const monthEvents = useMemo(
    () =>
      Object.values(eventMap)
        .flat()
        .filter((e) => e.date >= monthStartKey && e.date <= monthEndKey)
        .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "")),
    [eventMap, monthStartKey, monthEndKey]
  );

  const busiestDay = useMemo(() => {
    const byDate: Record<string, number> = {};
    monthEvents.forEach((e) => { byDate[e.date] = (byDate[e.date] || 0) + 1; });
    return Object.entries(byDate).reduce<{ date: string; count: number } | null>(
      (best, [date, count]) => (!best || count > best.count ? { date, count } : best),
      null
    );
  }, [monthEvents]);

  const counts = useMemo(() => {
    const c = { appointment: 0, meeting: 0, task: 0, daily: 0, note: 0 };
    monthEvents.forEach((e) => c[e.kind]++);
    return c;
  }, [monthEvents]);

  const weekRows: Date[][] = [];
  for (let i = 0; i < cells.length; i += 7) weekRows.push(cells.slice(i, i + 7));

  return (
    <div className="flex flex-col gap-5">
      {loadError && <ErrorBanner message={loadError} onRetry={retryAll} />}

      {/* two summary cards, above the calendar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard
          tone="violet"
          icon={<CalendarDays size={22} color="#fff" />}
          label="Busiest Day"
          value={busiestDay ? fmtDate(busiestDay.date) : "—"}
          sub={busiestDay ? `${busiestDay.count} item${busiestDay.count === 1 ? "" : "s"} scheduled` : "No items yet"}
        />
        <StatCard
          tone="blue"
          icon={<LayoutGrid size={22} color="#fff" />}
          label="This Month's Load"
          value={monthEvents.length}
          sub={`${counts.appointment} appts · ${counts.meeting} meetings · ${counts.task} tasks · ${counts.daily} logs`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="ws-eyebrow">Schedule</span>
        <button className="ws-navbtn" onClick={() => setMonthOffset((o) => o - 1)} aria-label="Previous month">
          <ChevronLeft size={16} />
        </button>
        <div className="ws-monthlabel">{monthLabel}</div>
        <button className="ws-navbtn" onClick={() => setMonthOffset((o) => o + 1)} aria-label="Next month">
          <ChevronRight size={16} />
        </button>

        <div className="flex-1" />

        <div className="ws-segment">
          <button
            onClick={() => setView("grid")}
            className={cx("ws-segbtn", view === "grid" && "active")}
            title="Calendar view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView("list")}
            className={cx("ws-segbtn", view === "list" && "active")}
            title="List view"
          >
            <List size={15} />
          </button>
        </div>

        {isPA && <Button variant="primary" icon={<Plus size={14} />} onClick={() => setTaskModalOpen(true)}>Add New Task</Button>}
      </div>

      <Card className="p-4 overflow-hidden ws-glass-card">
        {view === "grid" ? (
          <div key="grid" className="ws-swap overflow-x-auto">
            {/* min-width keeps every day column at a readable size — on
                narrow viewports the grid scrolls sideways instead of
                squeezing full task details into unreadably thin cells. */}
            <div style={{ minWidth: 760 }}>
            <div className="grid grid-cols-7 border-b pb-2 mb-2" style={{ borderColor: "var(--ws-line)" }}>
              {DOW_LABELS.map((d) => (
                <div key={d} className="ws-dow">{d}</div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {weekRows.map((week, ri) => (
                <div key={ri} className="grid grid-cols-7 gap-2 items-stretch">
                  {week.map((day) => {
                    const key = toKey(day);
                    const inMonth = day.getMonth() === targetMonthIndex;
                    const isToday = key === TODAY_KEY;
                    const dayEvents = inMonth ? eventMap[key] || [] : [];
                    return (
                      <div key={key} className={cx("ws-daycell group", !inMonth && "out-of-month")}>
                        <div className="flex items-center justify-between">
                          <div className={cx("ws-daynum", isToday ? "today" : inMonth ? "in-month" : "out-month")}>
                            {day.getDate()}
                          </div>
                          {isPA && inMonth && (
                            <button
                              onClick={() => setQuickAddDate(key)}
                              className="ws-quickadd opacity-0 group-hover:opacity-100"
                              title="Add a planned/actual note for this day"
                              aria-label="Add a planned/actual note for this day"
                            >
                              <Plus size={11} />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {dayEvents.map((e) => {
                            const meta = metaFor(e);
                            const Icon = KIND_META[e.kind].icon;
                            return (
                              <div
                                key={e.key}
                                className={cx("ws-pill", e.variant === "notePlanned" && "planned", e.variant === "fellThrough" && "fell-through")}
                                style={{ background: meta.bg, color: meta.text }}
                                title={`${e.label}${e.time ? " · " + e.time : ""}${e.statusNote ? " · " + e.statusNote : ""}`}
                              >
                                <Icon size={10} className="shrink-0 mt-[1px]" />
                                <span className="ws-pill-label">
                                  {e.time ? `${e.time} ` : ""}{e.label}
                                  {e.statusNote && <span className="ws-pill-note"> · {e.statusNote}</span>}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            </div>
          </div>
        ) : (
          <div key="list" className="ws-swap overflow-x-auto">
            <table className="ws-table">
              <thead><tr><th>Date</th><th>Type</th><th>Item</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>
                {monthEvents.length ? monthEvents.map((e) => {
                  const meta = metaFor(e);
                  const Icon = KIND_META[e.kind].icon;
                  return (
                    <tr key={e.key}>
                      <td>{fmtDate(e.date)}</td>
                      <td>
                        <span className="inline-flex items-center gap-2 text-[11px] font-bold capitalize" style={{ color: meta.text }}>
                          <Icon size={12} /> {e.kind}
                        </span>
                      </td>
                      <td>{e.label}</td>
                      <td>{e.time ?? "—"}</td>
                      <td>
                        {e.variant === "notePlanned" ? (
                          <span className="ws-status-note">Planned</span>
                        ) : e.variant === "fellThrough" ? (
                          <span className="ws-status-fell-through">{e.statusNote}</span>
                        ) : (
                          <span className="ws-status-ok">Happened</span>
                        )}
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan={5} className="ws-empty">No items this month.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} onCreate={createTask} />
      <DayPlanModal date={quickAddDate} onClose={() => { setQuickAddDate(null); refetchDayNotes(); }} />
    </div>
  );
}
