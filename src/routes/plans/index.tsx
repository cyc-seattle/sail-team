import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FinancialPlanList } from "@/components/plans/financial-plan-list";
import { PageHeader } from "@/components/plans/page-header";
import { NoAccess } from "@/components/shell/no-access";
import { canRead } from "@/directus/access";
import { financialPlansQuery } from "@/directus/financial-plans";
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
      <PageHeader
        title="Plans"
        description="Each year's Financial Plans: the Operations Plan and Program Plans, and the P&L they make together."
      />
      <AllPlans />
    </main>
  );
}

function AllPlans() {
  const { data } = useSuspenseQuery(financialPlansQuery);
  return <FinancialPlanList plans={data} />;
}
