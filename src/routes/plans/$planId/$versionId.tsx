import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/plans/page-header";
import { VersionPnl } from "@/components/plans/version-pnl";
import { NoticePage } from "@/components/shell/notice-page";
import { NoAccess } from "@/components/shell/no-access";
import { canRead } from "@/directus/access";
import {
  draftQuery,
  planQuery,
  savedResultsQuery,
  versionsQuery,
  type PlanSummary,
  type VersionSummary,
} from "@/directus/plans";
import { useSession } from "@/directus/use-session";
import { formatDate } from "@/model/dates";
import { planFor } from "@/model/plan-list";
import { savedPnl } from "@/model/saved-results";

export const Route = createFileRoute("/plans/$planId/$versionId")({
  component: Version,
});

function Version() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "plans")) {
    return <NoAccess what="plans" />;
  }
  return <VersionPage />;
}

function VersionPage() {
  const { planId, versionId } = Route.useParams();
  const { data: plan } = useSuspenseQuery(planQuery(planId));
  const { data: versions } = useSuspenseQuery(versionsQuery(planId));
  const version = versions.find((v) => v.id === versionId);
  if (!version) {
    return <NoticePage title="There's no such version of this plan" />;
  }
  return (
    <main className="mx-auto max-w-6xl p-card">
      <PageHeader
        title={plan.name}
        description={`${planFor(plan)}, ${plan.fiscal_year}. ${
          version.status === "draft" ? "Draft" : `Saved ${formatDate(version.saved_at)}`
        }${version.message ? `: ${version.message}` : ""}`}
        back={{ to: `/plans/${planId}`, label: "All versions" }}
      />
      {version.status === "saved" ? <Saved version={version} /> : <Draft plan={plan} version={version} />}
    </main>
  );
}

function Saved({ version }: { version: VersionSummary }) {
  const { data } = useSuspenseQuery(savedResultsQuery(version.id));
  if (!data) {
    return (
      <NoticePage title="This version's numbers aren't ready">The club's system is still working them out.</NoticePage>
    );
  }
  return (
    <VersionPnl
      source={{ kind: "saved", savedAt: data.calculated_at }}
      rows={data.pnl.map(savedPnl)}
      warnings={data.warnings}
    />
  );
}

function Draft({ plan, version }: { plan: PlanSummary; version: VersionSummary }) {
  const { data } = useSuspenseQuery(draftQuery(plan, version));
  const rows = data.output.pnl.map((pnl) => ({ name: data.names.get(pnl.key) ?? "Unnamed", pnl }));
  return <VersionPnl source={{ kind: "draft" }} rows={rows} warnings={data.output.warnings} />;
}
