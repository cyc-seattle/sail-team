import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/plans/page-header";
import { VersionList } from "@/components/plans/version-list";
import { NoAccess } from "@/components/shell/no-access";
import { canRead } from "@/directus/access";
import { activationsQuery, planQuery, versionsQuery } from "@/directus/plans";
import { useSession } from "@/directus/use-session";
import { planFor } from "@/model/plan-list";

export const Route = createFileRoute("/plans/$planId/")({
  component: Plan,
});

function Plan() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "plans")) {
    return <NoAccess what="plans" />;
  }
  return <Versions />;
}

function Versions() {
  const { planId } = Route.useParams();
  const { data: plan } = useSuspenseQuery(planQuery(planId));
  const { data: versions } = useSuspenseQuery(versionsQuery(planId));
  const { data: active } = useSuspenseQuery(activationsQuery(plan));
  const activeId =
    plan.kind === "operations"
      ? active.operations
      : (active.areas.find((a) => a.program_area_id === plan.program_area_id)?.version_id ?? null);
  return (
    <main className="mx-auto max-w-6xl p-card">
      <PageHeader
        title={plan.name}
        description={`${planFor(plan)}, ${plan.fiscal_year}`}
        back={{ to: "/plans", label: "All plans" }}
      />
      <VersionList planId={planId} versions={versions} activeId={activeId} />
    </main>
  );
}
