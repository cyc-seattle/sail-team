import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FinancialPlanPage } from "@/components/plans/financial-plan-page";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { canRead, canWrite } from "@/directus/access";
import {
  financialPlanQuery,
  startFinancialPlan,
  updateFinancialPlan,
  type FinancialPlan,
} from "@/directus/financial-plans";
import { useSession } from "@/directus/use-session";

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
  const { data } = useSuspenseQuery(financialPlanQuery(setId));
  if (!data) {
    return <NoticePage title="There's no such Financial Plan" />;
  }
  return <Found plan={data} />;
}

function Found({ plan }: { plan: FinancialPlan }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const permissions = session.kind === "signed-in" ? session.permissions : undefined;
  const { set } = plan;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["financial-plans"] });
  return (
    <FinancialPlanPage
      {...plan}
      canUpdate={canWrite(permissions, "version_sets", "update")}
      canCreate={canWrite(permissions, "version_sets", "create")}
      onEdit={async ({ name, message }) => {
        await updateFinancialPlan(set.id, set.status === "draft" ? { name, message } : { message });
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
