import { useState } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChevronLeft, ChevronRight, Clock3, CalendarPlus } from "lucide-react";
import { Card, CardHead } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ErrorBanner } from "../components/ui/AsyncState";
import { useStore } from "../store/store";
import { useWeeklyScores } from "../hooks/useWeeklyScores";
import { cx, computeWeekTotals, dayEffectivenessPct, fmtDate, TODAY } from "../lib/utils";

function pctTone(pct: number) {
  if (pct >= 80) return { bg: "rgba(16,185,129,0.14)", text: "#059669" };
  if (pct >= 40) return { bg: "rgba(245,158,11,0.16)", text: "#b45309" };
  return { bg: "rgba(225,29,72,0.14)", text: "#be123c" };
}

export default function Scoring() {
  const role = useStore((s) => s.role);
  const isPA = role === "PA";
  const { weeklyScores, loading, error, refetch, updateDay, addNextMonth } = useWeeklyScores();

  const defaultIndex = Math.max(
    0,
    weeklyScores.findIndex((w) => w.days.some((d) => d.date === TODAY))
  );
  const [weekIndex, setWeekIndex] = useState(defaultIndex);
  const week = weeklyScores[weekIndex];

  const isLastWeek = weekIndex === weeklyScores.length - 1;
  const handleAddNextMonth = async () => {
    await addNextMonth();
    setWeekIndex(weeklyScores.length);
  };

  // Only weeks that have actually started belong in a trend — a future week
  // with no hours logged yet isn't a real "0%", it just hasn't happened.
  const chartData = weeklyScores.filter((w) => w.days.some((d) => d.date <= TODAY)).map((w) => ({
    week: `W${w.weekLabel.match(/\d+/)?.[0] ?? ""}`,
    score: computeWeekTotals(w.days).effectivenessPct,
  }));

  if (loading) {
    return (
      <Card>
        <div className="px-5 py-8 text-center text-[13px] text-ink-500">Loading weekly scoring...</div>
      </Card>
    );
  }
  if (error) return <ErrorBanner message={error} onRetry={refetch} />;
  if (!week) return null;

  const totals = computeWeekTotals(week.days);
  const prevTotals = weekIndex > 0 ? computeWeekTotals(weeklyScores[weekIndex - 1].days) : null;
  const delta = prevTotals ? totals.effectivenessPct - prevTotals.effectivenessPct : 0;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHead
          title="CEO Weekly Scoring"
          hint={week.monthLabel}
          action={
            <div className="flex items-center gap-2">
              <button
                className="btn-3d w-8 h-8 rounded-full bg-white flex items-center justify-center text-violet-700 disabled:opacity-40"
                disabled={weekIndex === 0}
                onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-[12.5px] font-bold text-ink-900 min-w-[150px] text-center">
                {week.weekLabel} · {week.rangeLabel}
              </span>
              <button
                className="btn-3d w-8 h-8 rounded-full bg-white flex items-center justify-center text-violet-700 disabled:opacity-40"
                disabled={weekIndex === weeklyScores.length - 1}
                onClick={() => setWeekIndex((i) => Math.min(weeklyScores.length - 1, i + 1))}
              >
                <ChevronRight size={15} />
              </button>
              {isPA && isLastWeek && (
                <Button size="sm" variant="outline" icon={<CalendarPlus size={13} />} onClick={handleAddNextMonth}>
                  Add Next Month
                </Button>
              )}
            </div>
          }
        />

        <div className="p-5">
          <div
            className="grid gap-3 mb-5"
            style={{ gridTemplateColumns: `repeat(${week.days.length}, minmax(150px, 1fr))` }}
          >
            {week.days.map((day) => {
              const pct = dayEffectivenessPct(day.hours);
              const tone = pctTone(pct);
              const isToday = day.date === TODAY;
              return (
                <div
                  key={day.date}
                  className="rounded-2xl border p-3 flex flex-col gap-2.5"
                  style={{
                    borderColor: isToday ? "var(--brand)" : "var(--line)",
                    background: isToday ? "var(--surface)" : "transparent",
                  }}
                >
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{day.label}</div>
                    <div className="text-[12.5px] font-bold text-ink-900">{fmtDate(day.date)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 glass-input px-2 py-1 w-fit">
                      <Clock3 size={12} className="text-violet-400" />
                      <input
                        type="number"
                        min={0}
                        max={16}
                        value={day.hours}
                        disabled={!isPA}
                        onChange={(e) => updateDay(week.id, day.date, { hours: Math.max(0, Math.min(16, parseInt(e.target.value) || 0)) })}
                        className="w-9 bg-transparent outline-none text-[12.5px] font-bold text-ink-900"
                      />
                      <span className="text-[10.5px] text-ink-400">hrs</span>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2 py-1 rounded-md ml-auto"
                      style={{ background: tone.bg, color: tone.text }}
                    >
                      {pct}%
                    </span>
                  </div>

                  <textarea
                    rows={5}
                    value={day.notes}
                    disabled={!isPA}
                    onChange={(e) => updateDay(week.id, day.date, { notes: e.target.value })}
                    placeholder="What did the CEO do today?"
                    className="glass-input px-2 py-1.5 text-[11.5px] leading-snug resize-none flex-1"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-ink-500">Total Hours</div>
              <div className="text-[22px] font-extrabold font-display text-ink-900" style={{ fontVariantNumeric: "tabular-nums" }}>
                {totals.totalHours}h
              </div>
            </div>
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-ink-500">Effectiveness</div>
              <div className="text-[22px] font-extrabold font-display text-violet-700" style={{ fontVariantNumeric: "tabular-nums" }}>
                {totals.effectivenessPct}%
              </div>
            </div>
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-ink-500">Efficiency</div>
              <div className="text-[22px] font-extrabold font-display text-ink-900" style={{ fontVariantNumeric: "tabular-nums" }}>
                {totals.efficiencyAvg} <span className="text-[12px] font-semibold text-ink-500">hrs/day avg</span>
              </div>
            </div>
            {prevTotals && (
              <div className={cx("text-[12.5px] font-semibold", delta >= 0 ? "text-emerald-600" : "text-red-500")}>
                {delta >= 0 ? "+" : ""}{delta} pts vs previous week
              </div>
            )}
            {!isPA && <div className="text-[11.5px] text-ink-400 ml-auto">Logged by PA · view only</div>}
          </div>
        </div>
      </Card>

      <Card>
        <CardHead title="Effectiveness Trend" hint={week.monthLabel} />
        <div className="p-5" style={{ height: 200 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreFill2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8a5cf0" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#8a5cf0" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1edfb" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#a79fc2" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#a79fc2" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #ede8fe", fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#7440e0" strokeWidth={2.5} fill="url(#scoreFill2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHead title="Weekly Score History" />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Week</th><th>Range</th><th>Total Hours</th><th>Effectiveness</th><th>Efficiency</th></tr></thead>
            <tbody>
              {[...weeklyScores].reverse().map((w) => {
                const t = computeWeekTotals(w.days);
                return (
                  <tr key={w.id} className="row-hover">
                    <td className="font-semibold">{w.weekLabel}</td>
                    <td>{w.rangeLabel}</td>
                    <td>{t.totalHours}h</td>
                    <td className="font-bold text-violet-700">{t.effectivenessPct}%</td>
                    <td>{t.efficiencyAvg} hrs/day</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
