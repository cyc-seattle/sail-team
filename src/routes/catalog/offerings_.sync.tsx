import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { PlanSyncReview } from "@/components/catalog/plan-sync-review";
import { NoAccess } from "@/components/shell/no-access";
import { canWrite } from "@/directus/access";
import { applyRow, planSyncQuery } from "@/directus/plan-sync";
import { useSession } from "@/directus/use-session";
import type { SyncRow } from "@/model/plan-sync";
import { seattleToday } from "@/model/roster";

interface SyncSearch {
  year?: number;
}

export const Route = createFileRoute("/catalog/offerings_/sync")({
  validateSearch: (search: Record<string, unknown>): SyncSearch =>
    typeof search["year"] === "number" ? { year: search["year"] } : {},
  component: SyncPage,
});

/** The plan-to-catalog sync, for someone who can change offerings: a Catalog Writer. */
function SyncPage() {
  const session = useSession();
  const permissions = session.kind === "signed-in" ? session.permissions : undefined;
  if (!canWrite(permissions, "offerings", "update")) {
    return <NoAccess what="the sync from plan" />;
  }
  return (
    <CatalogPage current="offerings">
      <Loaded />
    </CatalogPage>
  );
}

function Loaded() {
  const { year } = Route.useSearch();
  const navigate = Route.useNavigate();
  const today = seattleToday();
  const queryClient = useQueryClient();
  const { data, dataUpdatedAt } = useSuspenseQuery(planSyncQuery(year, today));
  const apply = async (rows: SyncRow[]) => {
    const failed = new Map<string, string>();
    const now = new Date().toISOString();
    for (const row of rows) {
      try {
        await applyRow(row, now);
      } catch (error) {
        failed.set(row.id, error instanceof Error ? error.message : String(error));
      }
    }
    await queryClient.invalidateQueries({ queryKey: ["plan-sync"] });
    await queryClient.invalidateQueries({ queryKey: ["catalog"] });
    return failed;
  };
  return (
    <PlanSyncReview
      // A fresh review after each read, ticked again from what's left.
      key={`${data.year}:${dataUpdatedAt}`}
      sync={data}
      onYear={(y) => void navigate({ search: { year: y } })}
      onApply={apply}
    />
  );
}
