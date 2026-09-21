import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Card, CardHead } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Pill } from "../components/ui/Pill";
import { ErrorBanner, LoadingRow } from "../components/ui/AsyncState";
import { DEPARTMENTS, fmtDate, initials } from "../lib/utils";
import { useStore } from "../store/store";
import { useKaizenIdeas } from "../hooks/useKaizenIdeas";
import { KaizenModal, MilestoneModal } from "../components/modals/ExecutionModals";
import KaizenDeptData from "./KaizenDeptData";
import KaizenIndividual from "./KaizenIndividual";
import type { KaizenStatus } from "../store/types";

const KAIZEN_STATUSES: KaizenStatus[] = ["New", "Under Process", "Hold", "Completed"];

type KaizenView = "master" | "dept" | "individual";
const VIEWS: { key: KaizenView; label: string }[] = [
  { key: "master", label: "Master Data" },
  { key: "dept", label: "Dept Data" },
  { key: "individual", label: "Individual" },
];

export default function Kaizen() {
  const role = useStore((s) => s.role);
  const isPA = role === "PA";
  const { kaizenIdeas, loading, error, refetch, createKaizen, updateKaizenStatus } = useKaizenIdeas();
  const navigate = useNavigate();

  const [view, setView] = useState<KaizenView>("master");
  const [kaizenOpen, setKaizenOpen] = useState(false);
  const [milestoneOpen, setMilestoneOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | KaizenStatus>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredIdeas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return kaizenIdeas.filter((k) => {
      if (q && !k.title.toLowerCase().includes(q) && !k.id.toLowerCase().includes(q) && !k.champion.toLowerCase().includes(q)) return false;
      if (deptFilter !== "All" && k.dept !== deptFilter) return false;
      if (statusFilter !== "All" && k.status !== statusFilter) return false;
      if (dateFrom && k.date < dateFrom) return false;
      if (dateTo && k.date > dateTo) return false;
      return true;
    });
  }, [kaizenIdeas, search, deptFilter, statusFilter, dateFrom, dateTo]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex gap-1.5 p-1 rounded-full" style={{ background: "var(--surface)" }}>
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className="px-4 py-2 rounded-full text-[12.5px] font-bold transition-colors"
              style={
                view === v.key
                  ? { background: "var(--brand-grad)", color: "#fff" }
                  : { color: "var(--muted-strong)" }
              }
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === "master" && isPA && (
          <div className="flex gap-2">
            <Button variant="outline" icon={<Plus size={14} />} onClick={() => setMilestoneOpen(true)}>Add Milestone</Button>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setKaizenOpen(true)}>New Kaizen Idea</Button>
          </div>
        )}
      </div>

      {view === "dept" && <KaizenDeptData />}
      {view === "individual" && <KaizenIndividual />}

      {view === "master" && (
        <>
          <Card className="p-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Kaizen ideas, owner, or ID..."
                className="glass-input w-full pl-9 pr-3 py-2.5 text-[12.5px]"
              />
            </div>
            <select className="glass-input px-3 py-2.5 text-[12.5px] font-semibold" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="All">All Departments</option>
              {DEPARTMENTS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
            <select
              className="glass-input px-3 py-2.5 text-[12.5px] font-semibold"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "All" | KaizenStatus)}
            >
              <option value="All">All Project Status</option>
              {KAIZEN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex items-center gap-1.5">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="glass-input px-2.5 py-2.5 text-[12.5px]" title="From date" />
              <span className="text-ink-400 text-[12px]">to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="glass-input px-2.5 py-2.5 text-[12.5px]" title="To date" />
            </div>
          </Card>

          {error && <ErrorBanner message={error} onRetry={refetch} />}

          <Card>
            <CardHead title="Kaizen Ideas" hint={`${filteredIdeas.length} of ${kaizenIdeas.length}`} />
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Dept</th><th>Date</th><th>Kaizen Idea</th><th>Owner</th><th>Project Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <LoadingRow colSpan={5} /> : filteredIdeas.length ? filteredIdeas.map((k) => (
                    <tr key={k.id} className="row-hover cursor-pointer" onClick={() => navigate(`/app/kaizen/${k.id}`)}>
                      <td className="whitespace-nowrap">
                        <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">{k.deptCode}</span>
                        <span className="ml-1.5 text-ink-500">{k.dept}</span>
                      </td>
                      <td className="whitespace-nowrap">{fmtDate(k.date)}</td>
                      <td className="min-w-[220px]">{k.title}</td>
                      <td className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[9.5px] font-bold flex items-center justify-center shrink-0">{initials(k.champion)}</span>
                          {k.champion}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {isPA ? (
                          <select
                            className="glass-input text-[11.5px] font-semibold px-2 py-1"
                            value={k.status}
                            onChange={(e) => updateKaizenStatus(k.id, e.target.value as KaizenStatus)}
                          >
                            {KAIZEN_STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        ) : <Pill status={k.status} />}
                      </td>
                    </tr>
                  )) : <tr><td colSpan={5} className="tbl-empty">No Kaizen ideas match these filters.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <KaizenModal open={kaizenOpen} onClose={() => setKaizenOpen(false)} onCreate={createKaizen} />
      <MilestoneModal open={milestoneOpen} onClose={() => setMilestoneOpen(false)} kaizenIdeas={kaizenIdeas} />
    </div>
  );
}
