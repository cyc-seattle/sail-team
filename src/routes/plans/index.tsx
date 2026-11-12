import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PlanningPage } from "@/components/plans/reports/planning-page";
import { NoAccess } from "@/components/shell/no-access";
import { canRead, canWrite } from "@/directus/access";
import { deleteFinancialPlan, financialPlansQuery, updateFinancialPlan } from "@/directus/financial-plans";
import { useSession } from "@/directus/use-session";

export const Route = createFileRoute("/plans/")({
  component: Planning,
});

function Planning() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "plans")) {
    return <NoAccess what="plans" />;
  }
  return <AllPlans />;
}

function AllPlans() {
  const session = useSession();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(financialPlansQuery);
  const permissions = session.kind === "signed-in" ? session.permissions : undefined;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["financial-plans"] });
  return (
    <PlanningPage
      plans={data}
      actions={{
        canUpdate: canWrite(permissions, "version_sets", "update"),
        canDelete: canWrite(permissions, "version_sets", "delete"),
        onMove: async (plan, status) => {
          await updateFinancialPlan(plan.id, { status });
          await refresh();
        },
        onArchive: async (plan, archived) => {
          await updateFinancialPlan(plan.id, { archived_at: archived ? new Date().toISOString() : null });
          await refresh();
        },
        onDelete: async (plan) => {
          await deleteFinancialPlan(plan.id);
          await refresh();
        },
      }}
    />
  );
}
