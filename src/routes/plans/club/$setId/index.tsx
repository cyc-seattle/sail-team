import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ClubMovedOn } from "@/components/plans/club-moved-on";
import { ClubPlanView } from "@/components/plans/club-plan-view";
import { PageHeader } from "@/components/plans/page-header";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { canRead } from "@/directus/access";
import { clubPlanQuery, type ClubPlan } from "@/directus/club-plans";
import { activationsQuery } from "@/directus/plans";
import { movedOn } from "@/model/club-plans";
import { useSession } from "@/directus/use-session";

export const Route = createFileRoute("/plans/club/$setId/")({
  component: ClubPlanPage,
});

function ClubPlanPage() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "plans")) {
    return <NoAccess what="plans" />;
  }
  return <ClubPlan />;
}

function ClubPlan() {
  const { setId } = Route.useParams();
  const { data } = useSuspenseQuery(clubPlanQuery(setId));
  if (!data) {
    return <NoticePage title="There's no such club plan" />;
  }
  return <Found plan={data} />;
}

function Found({
  plan: data,
}: {
  plan: NonNullable<Awaited<ReturnType<NonNullable<ReturnType<typeof clubPlanQuery>["queryFn"]>>>>;
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
        title={`Club plan: ${data.set.name}`}
        description={`${data.set.fiscal_year}${data.set.message ? `. ${data.set.message}` : ""}`}
        back={{ to: "/plans", label: "All plans" }}
      />
      <div className="mb-card">
        <ClubMovedOn setId={setId} moved={moved} />
      </div>
      <ClubPlanView
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
