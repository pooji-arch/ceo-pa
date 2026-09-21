import { Card, CardHead } from "../components/ui/Card";
import { ErrorBanner, LoadingRow } from "../components/ui/AsyncState";
import { useStore } from "../store/store";
import { useKaizenIdeas } from "../hooks/useKaizenIdeas";
import { useUpsertContributor, useLeaderboard } from "../hooks/useContributors";
import { initials } from "../lib/utils";
import type { KaizenIdea } from "../store/types";

function ScoreInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  return (
    <input
      type="number"
      step={0.5}
      min={0}
      className="glass-input w-16 px-2 py-1 text-[12px]"
      value={value}
      onChange={(e) => onCommit(parseFloat(e.target.value) || 0)}
    />
  );
}

/** Contributors aren't typed in separately — they're the idea's own Owner and
 * Executed By people, so scoring stays in sync with whoever is actually
 * listed on the idea instead of a second, easily-stale name list. */
function contributorNames(k: KaizenIdea): string[] {
  return Array.from(new Set([k.champion, ...k.executedBy].map((n) => n.trim()).filter(Boolean)));
}

/** Mirrors the real "Individual Score" tracker: a per-idea contributor ledger
 * (Idea / Execution / Ontime / Impact points, summed into a Total Score) plus
 * a leaderboard that sums each person's Total Score across every idea they
 * contributed to. */
export default function KaizenIndividual() {
  const role = useStore((s) => s.role);
  const isPA = role === "PA";
  const { kaizenIdeas, loading, error, refetch } = useKaizenIdeas();
  const upsertContributor = useUpsertContributor();
  const { leaderboard, loading: leaderboardLoading, error: leaderboardError, refetch: refetchLeaderboard } = useLeaderboard();

  const updateContributor = async (kaizenId: string, name: string, patch: { idea?: number; execution?: number; ontime?: number; impact?: number }) => {
    const result = await upsertContributor(kaizenId, name, patch);
    if (result) {
      refetch();
      refetchLeaderboard();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-600">
        <span className="font-bold text-ink-900 uppercase tracking-wide text-[11px]">Scoring rubric</span>
        <span><b className="text-ink-900">Idea</b> = 1 pt</span>
        <span><b className="text-ink-900">Execution</b> = 2 pts, split across everyone involved</span>
        <span><b className="text-ink-900">Ontime completion</b> = 1 pt, also split</span>
        <span><b className="text-ink-900">Impact</b> = 1 pt, shared between owner and executor</span>
      </Card>

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <Card>
        <CardHead title="Individual Score Ledger" hint={`${kaizenIdeas.length} idea${kaizenIdeas.length === 1 ? "" : "s"}`} />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Dept</th><th>Idea</th><th>Name</th><th>Idea</th><th>Execution</th><th>Ontime</th><th>Impact</th><th>Total Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow colSpan={8} /> : kaizenIdeas.length ? kaizenIdeas.flatMap((k) => {
                const names = contributorNames(k);
                return names.map((name, i) => {
                  const c = k.contributors.find((x) => x.name === name) ?? { name, idea: 0, execution: 0, ontime: 0, impact: 0 };
                  const total = Math.round((c.idea + c.execution + c.ontime + c.impact) * 100) / 100;
                  return (
                    <tr key={`${k.id}-${name}`} className="row-hover">
                      {i === 0 && (
                        <td rowSpan={names.length} className="whitespace-nowrap">
                          <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">{k.deptCode}</span>
                          <span className="ml-1.5 text-ink-500">{k.dept}</span>
                        </td>
                      )}
                      {i === 0 && <td rowSpan={names.length} className="min-w-[220px] font-semibold">{k.title}</td>}
                      <td className="font-semibold whitespace-nowrap">{name}</td>
                      <td>{isPA ? <ScoreInput value={c.idea} onCommit={(v) => updateContributor(k.id, name, { idea: v })} /> : c.idea}</td>
                      <td>{isPA ? <ScoreInput value={c.execution} onCommit={(v) => updateContributor(k.id, name, { execution: v })} /> : c.execution}</td>
                      <td>{isPA ? <ScoreInput value={c.ontime} onCommit={(v) => updateContributor(k.id, name, { ontime: v })} /> : c.ontime}</td>
                      <td>{isPA ? <ScoreInput value={c.impact} onCommit={(v) => updateContributor(k.id, name, { impact: v })} /> : c.impact}</td>
                      <td className="font-bold text-violet-700">{total}</td>
                    </tr>
                  );
                });
              }) : <tr><td colSpan={8} className="tbl-empty">No Kaizen ideas yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {leaderboardError && <ErrorBanner message={leaderboardError} onRetry={refetchLeaderboard} />}

      <Card>
        <CardHead title="Leaderboard" hint={`${leaderboard.length} contributor${leaderboard.length === 1 ? "" : "s"}`} />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Rank</th><th>Name</th><th>Total Score</th></tr></thead>
            <tbody>
              {leaderboardLoading ? <LoadingRow colSpan={3} /> : leaderboard.length ? leaderboard.map((row, i) => (
                <tr key={row.name} className="row-hover">
                  <td className="font-bold text-ink-500">#{i + 1}</td>
                  <td>
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0">{initials(row.name)}</span>
                      {row.name}
                    </span>
                  </td>
                  <td className="font-bold text-violet-700">{row.total}</td>
                </tr>
              )) : <tr><td colSpan={3} className="tbl-empty">No scores yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
