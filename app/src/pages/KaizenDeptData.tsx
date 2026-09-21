import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Target, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Card, CardHead } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { ErrorBanner } from "../components/ui/AsyncState";
import { useDeptScorecard } from "../hooks/useDeptScorecard";
import { DEPARTMENTS } from "../lib/utils";

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Mirrors the real "MS DB" tracker: one row per department, per month —
 * MS (milestones due that month) split into OTC (on-time completed),
 * DC (delayed completion) and NC (not completed), plus the on-time %.
 * The per-dept numbers are computed server-side (GET /kaizen-dept-scorecard);
 * this page just adds the department multi-select filter on top. */
export default function KaizenDeptData() {
  const [month, setMonth] = useState("");
  const { availableMonths, rows: allRows, loading, error, refetch } = useDeptScorecard(month || undefined);

  const [selectedDepts, setSelectedDepts] = useState<string[]>(DEPARTMENTS.map((d) => d.name));
  const [deptOpen, setDeptOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!month && availableMonths.length) setMonth(availableMonths[availableMonths.length - 1]);
  }, [availableMonths, month]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setDeptOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggleDept = (name: string) => {
    setSelectedDepts((prev) => (prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]));
  };

  const rows = useMemo(
    () => allRows.filter((r) => selectedDepts.includes(r.deptName)),
    [allRows, selectedDepts]
  );

  const totals = rows.reduce(
    (acc, r) => ({ ms: acc.ms + r.ms, otc: acc.otc + r.otc, dc: acc.dc + r.dc, nc: acc.nc + r.nc }),
    { ms: 0, otc: 0, dc: 0, nc: 0 }
  );
  const totalPct = totals.ms > 0 ? Math.round((totals.otc / totals.ms) * 100) : null;

  return (
    <div className="flex flex-col gap-5">
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <Card className="p-4 flex flex-wrap items-center gap-3 relative z-30">
        <div className="relative" ref={boxRef}>
          <button
            onClick={() => setDeptOpen((o) => !o)}
            className="glass-input px-3 py-2.5 text-[12.5px] font-semibold flex items-center gap-3 min-w-[240px] justify-between"
          >
            <span>
              {selectedDepts.length === DEPARTMENTS.length
                ? "All Departments"
                : selectedDepts.length
                ? `${selectedDepts.length} department${selectedDepts.length > 1 ? "s" : ""} selected`
                : "Select departments"}
            </span>
            <ChevronDown size={14} />
          </button>
          {deptOpen && (
            <div
              className="absolute z-20 mt-2 w-72 max-h-80 overflow-y-auto rounded-xl p-2"
              style={{ background: "var(--glass)", backdropFilter: "blur(16px)", border: "1px solid var(--glass-border)", boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b" style={{ borderColor: "var(--line)" }}>
                <button className="text-[11px] font-bold text-violet-600" onClick={() => setSelectedDepts(DEPARTMENTS.map((d) => d.name))}>Select all</button>
                <button className="text-[11px] font-bold text-ink-500" onClick={() => setSelectedDepts([])}>Clear</button>
              </div>
              {DEPARTMENTS.map((d) => (
                <label key={d.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] cursor-pointer hover:bg-violet-50">
                  <input type="checkbox" checked={selectedDepts.includes(d.name)} onChange={() => toggleDept(d.name)} />
                  {d.name} <span className="text-ink-400">({d.code})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <select className="glass-input px-3 py-2.5 text-[12.5px] font-semibold" value={month} onChange={(e) => setMonth(e.target.value)}>
          {availableMonths.length === 0 && <option value="">No data yet</option>}
          {availableMonths.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </Card>

      {loading ? (
        <Card className="p-8 text-center text-[13px] text-ink-500">Loading department scorecard...</Card>
      ) : selectedDepts.length === 0 ? (
        <Card className="p-8 text-center text-[13px] text-ink-500">Select one or more departments to see results.</Card>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard tone="blue" icon={<Target size={22} color="#fff" />} label="Total MS" value={totals.ms} sub={month ? monthLabel(month) : "—"} />
            <StatCard tone="green" icon={<CheckCircle2 size={22} color="#fff" />} label="Total OTC" value={totals.otc} sub="On-time completed" />
            <StatCard tone="amber" icon={<Clock3 size={22} color="#fff" />} label="Total DC" value={totals.dc} sub="Delayed completion" />
            <StatCard tone="red" icon={<XCircle size={22} color="#fff" />} label="Total NC" value={totals.nc} sub="Not completed" />
          </div>

          <Card>
            <CardHead title="Department Scorecard" hint={month ? monthLabel(month) : "—"} />
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr><th>Department</th><th>MS</th><th>OTC</th><th>DC</th><th>NC</th><th>%</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.deptName} className="row-hover">
                      <td className="font-semibold">{r.deptName} <span className="text-ink-400 font-normal">({r.deptCode})</span></td>
                      <td>{r.ms}</td>
                      <td className="text-emerald-600 font-semibold">{r.otc}</td>
                      <td className="text-amber-600 font-semibold">{r.dc}</td>
                      <td className="text-red-500 font-semibold">{r.nc}</td>
                      <td className="font-bold text-violet-700">{r.pct === null ? "—" : `${r.pct}%`}</td>
                    </tr>
                  ))}
                  <tr className="font-bold" style={{ borderTop: "2px solid var(--line)" }}>
                    <td>Total</td>
                    <td>{totals.ms}</td>
                    <td className="text-emerald-600">{totals.otc}</td>
                    <td className="text-amber-600">{totals.dc}</td>
                    <td className="text-red-500">{totals.nc}</td>
                    <td className="text-violet-700">{totalPct === null ? "—" : `${totalPct}%`}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
