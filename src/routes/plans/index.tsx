import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/plans/page-header";
import { PlanList } from "@/components/plans/plan-list";
import { NoAccess } from "@/components/shell/no-access";
import { canRead } from "@/directus/access";
import { financialModelsQuery } from "@/directus/financial-models";
import { plansQuery } from "@/directus/plans";
import { useSession } from "@/directus/use-session";

export const Route = createFileRoute("/plans/")({
  component: Plans,
});

function Plans() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "plans")) {
    return <NoAccess what="plans" />;
  }
  return (
    <main className="mx-auto max-w-6xl p-card">
      <PageHeader title="Plans" description="Each plan, by year. Open one to see its versions and their P&L." />
      <AllPlans />
    </main>
  );
}

function AllPlans() {
  const { data: plans } = useSuspenseQuery(plansQuery);
  const { data: financialModels } = useSuspenseQuery(financialModelsQuery);
  return <PlanList plans={plans} financialModels={financialModels} />;
}
