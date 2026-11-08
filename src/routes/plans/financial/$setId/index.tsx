import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FinancialPlanView } from "@/components/plans/financial-plan-view";
import { PageHeader } from "@/components/plans/page-header";
import { PlanDetailsDialog } from "@/components/plans/plan-details-dialog";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { canRead, canWrite } from "@/directus/access";
import {
  financialPlanQuery,
  financialPlansQuery,
  startFinancialPlan,
  updateFinancialPlan,
  type FinancialPlan,
} from "@/directus/financial-plans";
import { useSession } from "@/directus/use-session";

export const Route = createFileRoute("/plans/financial/$setId/")({
  component: FinancialPlanPage,
});

function FinancialPlanPage() {
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
  const { data: all } = useSuspenseQuery(financialPlansQuery);
  const { set } = plan;
  const others = all.filter((s) => s.fiscal_year === set.fiscal_year && s.id !== set.id);
  return (
    <main className="mx-auto max-w-6xl p-card">
      <PageHeader title={set.name} back={{ to: "/plans", label: "Plans" }} actions={<Actions plan={plan} />} />
      <FinancialPlanView {...plan} others={others} />
    </main>
  );
}

/** Renaming it and changing its note, and starting a draft from it, for someone who can write Financial Plans. */
function Actions({ plan }: { plan: FinancialPlan }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const permissions = session.kind === "signed-in" ? session.permissions : undefined;
  const { set } = plan;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["financial-plans"] });
  return (
    <>
      {canWrite(permissions, "version_sets", "update") && (
        <PlanDetailsDialog
          trigger="Edit"
          title={`Edit ${set.name}`}
          initial={set}
          nameEditable={set.status === "draft"}
          submitLabel="Save"
          onSubmit={async ({ name, message }) => {
            await updateFinancialPlan(set.id, set.status === "draft" ? { name, message } : { message });
            await refresh();
          }}
        />
      )}
      {canWrite(permissions, "version_sets", "create") && (
        <PlanDetailsDialog
          trigger="Start a draft from this"
          title={`Start a draft from ${set.name}`}
          description={`The new draft starts as a copy of ${set.name}, for ${set.fiscal_year}. ${set.name} doesn't change.`}
          initial={{ name: `${set.name} copy`, message: null }}
          submitLabel="Start the draft"
          onSubmit={async (details) => {
            const id = await startFinancialPlan(plan, details);
            await refresh();
            await navigate({ to: "/plans/financial/$setId", params: { setId: id } });
          }}
        />
      )}
    </>
  );
}
