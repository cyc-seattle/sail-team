import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SourceNote } from "@/components/plans/financial-plan-view";
import { PageHeader } from "@/components/plans/page-header";
import { PlanView } from "@/components/plans/plan-view";
import { UnitSwitch } from "@/components/plans/unit-switch";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { canRead } from "@/directus/access";
import { assumptionsQuery } from "@/directus/assumptions";
import { financialPlanQuery } from "@/directus/financial-plans";
import { useSession } from "@/directus/use-session";
import { measuresOf, memberName } from "@/model/financial-plans";
import { sharedCosts } from "@/model/plan-lines";
import { savedPnl } from "@/model/saved-results";

export const Route = createFileRoute("/plans/financial/$setId/$planId")({
  component: ProgramPlanPage,
});

function ProgramPlanPage() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "plans")) {
    return <NoAccess what="plans" />;
  }
  return <Loaded />;
}

/** One plan in a Financial Plan: its assumptions and its full P&L, worked out with the other plans in it. */
function Loaded() {
  const { setId, planId } = Route.useParams();
  const { data } = useSuspenseQuery(financialPlanQuery(setId));
  const member = data?.members.find((m) => m.plan_id === planId);
  const operations = data?.members.find((m) => m.kind === "operations")?.version_id ?? null;
  const { data: assumptions } = useQuery({
    ...assumptionsQuery(member!, operations),
    enabled: !!member,
  });
  if (!data || !member) {
    return <NoticePage title="There's no such plan in this Financial Plan" />;
  }
  const { set, results, savedBy } = data;
  const header = (
    <PageHeader
      title={memberName(member)}
      back={{ to: `/plans/financial/${setId}`, label: set.name }}
      actions={<UnitSwitch />}
    />
  );
  if (!results) {
    return (
      <main className="mx-auto max-w-6xl p-card">
        {header}
        <p className="text-sm text-muted-foreground">Its numbers are still being worked out. Check back in a minute.</p>
      </main>
    );
  }
  const own = results.pnl.filter((p) => p.member === member.id);
  const offerings = own.filter((p) => p.level === "offering").map(savedPnl);
  const isOperations = member.kind === "operations";
  const days = new Map(offerings.map((o) => [o.pnl.key, o.pnl.days]));
  return (
    <main className="mx-auto max-w-6xl p-card">
      {header}
      <PlanView
        note={<SourceNote set={set} savedBy={savedBy} />}
        warnings={results.warnings}
        lines={results.lines.filter((l) => l.member === member.id)}
        shared={isOperations ? sharedCosts(results.lines) : undefined}
        offerings={offerings}
        assumptions={
          assumptions && {
            ...assumptions,
            offerings: assumptions.offerings.map((o) => ({ ...o, days: days.get(o.key) ?? null })),
          }
        }
        measures={measuresOf(results, member)}
      />
    </main>
  );
}
