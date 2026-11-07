import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ModelMovedOn } from "@/components/plans/model-moved-on";
import { FinancialModelView } from "@/components/plans/financial-model-view";
import { PageHeader } from "@/components/plans/page-header";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { canRead } from "@/directus/access";
import { financialModelQuery, type FinancialModel } from "@/directus/financial-models";
import { activationsQuery } from "@/directus/plans";
import { movedOn } from "@/model/financial-models";
import { useSession } from "@/directus/use-session";

export const Route = createFileRoute("/plans/model/$setId/")({
  component: FinancialModelPage,
});

function FinancialModelPage() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "plans")) {
    return <NoAccess what="plans" />;
  }
  return <FinancialModel />;
}

function FinancialModel() {
  const { setId } = Route.useParams();
  const { data } = useSuspenseQuery(financialModelQuery(setId));
  if (!data) {
    return <NoticePage title="There's no such financial model" />;
  }
  return <Found plan={data} />;
}

function Found({
  plan: data,
}: {
  plan: NonNullable<Awaited<ReturnType<NonNullable<ReturnType<typeof financialModelQuery>["queryFn"]>>>>;
}) {
  const { setId } = Route.useParams();
  const { data: active } = useSuspenseQuery(activationsQuery(data.set));
  const moved = movedOn(
    data.members.map((m) => ({
      version_id: m.version_id,
      kind: m.kind,
      program_area_id: m.program_area_id,
      name: m.kind === "operations" ? "the Operations Plan" : (m.area_name ?? m.plan_name),
    })),
    active,
    new Map(),
  );
  return (
    <main className="mx-auto max-w-6xl p-card">
      <PageHeader
        title={`Financial model: ${data.set.name}`}
        description={`${data.set.fiscal_year}${data.set.message ? `. ${data.set.message}` : ""}`}
        back={{ to: "/plans", label: "All plans" }}
      />
      <div className="mb-card">
        <ModelMovedOn setId={setId} moved={moved} />
      </div>
      <FinancialModelView
        savedAt={data.totals?.calculated_at ?? data.set.saved_at}
        totals={data.totals}
        members={data.members}
        pnl={data.pnl}
        lines={data.lines}
        warnings={data.warnings}
      />
    </main>
  );
}
