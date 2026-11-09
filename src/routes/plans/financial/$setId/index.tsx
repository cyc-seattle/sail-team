import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FinancialPlanPage } from "@/components/plans/financial-plan-page";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { canRead, canWrite } from "@/directus/access";
import { startFinancialPlan, updateFinancialPlan, type FinancialPlan } from "@/directus/financial-plans";
import { useSession } from "@/directus/use-session";
import { useFinancialPlan } from "@/hooks/use-financial-plan";

export const Route = createFileRoute("/plans/financial/$setId/")({
  component: FinancialPlanRoute,
});

function FinancialPlanRoute() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "plans")) {
    return <NoAccess what="plans" />;
  }
  return <Loaded />;
}

function Loaded() {
  const { setId } = Route.useParams();
  const { data, stuck } = useFinancialPlan(setId);
  if (!data) {
    return <NoticePage title="There's no such Financial Plan" />;
  }
  return <Found plan={data} stuck={stuck} />;
}

function Found({ plan, stuck }: { plan: FinancialPlan; stuck: boolean }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const permissions = session.kind === "signed-in" ? session.permissions : undefined;
  const { set } = plan;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["financial-plans"] });
  return (
    <FinancialPlanPage
      {...plan}
      stuck={stuck}
      canUpdate={canWrite(permissions, "version_sets", "update")}
      canCreate={canWrite(permissions, "version_sets", "create")}
      onEdit={async ({ name, message }) => {
        await updateFinancialPlan(set.id, { name, message });
        await refresh();
      }}
      onStart={async (details) => {
        const id = await startFinancialPlan(plan, details);
        await refresh();
        await navigate({ to: "/plans/financial/$setId", params: { setId: id } });
      }}
      onMove={async (status) => {
        await updateFinancialPlan(set.id, { status });
        await refresh();
      }}
    />
  );
}
