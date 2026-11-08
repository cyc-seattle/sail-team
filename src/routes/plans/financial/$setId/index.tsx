import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FinancialPlanView } from "@/components/plans/financial-plan-view";
import { PageHeader } from "@/components/plans/page-header";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { canRead } from "@/directus/access";
import { financialPlanQuery, financialPlansQuery, type FinancialPlan } from "@/directus/financial-plans";
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
      <PageHeader
        title={set.name}
        description={[
          `Financial Plan for ${set.fiscal_year}`,
          set.status === "draft" ? "a draft" : null,
          set.parent ? `started from ${set.parent.name}` : null,
        ]
          .filter(Boolean)
          .join(", ")
          .concat(set.message ? `. ${set.message}` : "")}
        back={{ to: "/plans", label: "All plans" }}
      />
      <FinancialPlanView {...plan} others={others} />
    </main>
  );
}
