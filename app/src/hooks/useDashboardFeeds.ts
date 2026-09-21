import { useResource } from "./useResource";
import { api } from "../lib/api";

/** Read-only feeds for the Dashboard's summary widgets. Full CRUD wiring for
 * these entities (create/edit forms, role-gated mutations) lands with the
 * dedicated Kaizen / Diet / Scoring pages — Dashboard only ever displays them. */
export function useDashboardFeeds() {
  const kaizenIdeas = useResource(api.dashboard.kaizenIdeas);
  const milestones = useResource(api.dashboard.milestones);
  const dietQueries = useResource(api.dashboard.dietQueries);
  const weeklyScores = useResource(api.dashboard.weeklyScores);

  return {
    kaizenIdeas: kaizenIdeas.data ?? [],
    milestones: milestones.data ?? [],
    dietQueries: dietQueries.data ?? [],
    weeklyScores: weeklyScores.data ?? [],
    loading: kaizenIdeas.loading || milestones.loading || dietQueries.loading || weeklyScores.loading,
    error: kaizenIdeas.error ?? milestones.error ?? dietQueries.error ?? weeklyScores.error,
    refetch: () => { kaizenIdeas.refetch(); milestones.refetch(); dietQueries.refetch(); weeklyScores.refetch(); },
  };
}
