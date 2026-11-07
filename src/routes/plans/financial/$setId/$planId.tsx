import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SourceNote } from "@/components/plans/financial-plan-view";
import { PageHeader } from "@/components/plans/page-header";
import { VersionPnl } from "@/components/plans/version-pnl";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { canRead } from "@/directus/access";
import { financialPlanQuery } from "@/directus/financial-plans";
import { useSession } from "@/directus/use-session";
import { memberName } from "@/model/financial-plans";
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

/** One plan in a Financial Plan: its full P&L, worked out with the other plans in it. */
function Loaded() {
  const { setId, planId } = Route.useParams();
  const { data } = useSuspenseQuery(financialPlanQuery(setId));
  const member = data?.members.find((m) => m.plan_id === planId);
  if (!data || !member) {
    return <NoticePage title="There's no such plan in this Financial Plan" />;
  }
  const { set, results, savedBy } = data;
  return (
    <main className="mx-auto max-w-6xl p-card">
      <PageHeader
        title={memberName(member)}
        description={`${member.plan_name}, in ${set.name}, the ${set.status === "draft" ? "draft " : ""}Financial Plan for ${set.fiscal_year}`}
        back={{ to: `/plans/financial/${setId}`, label: set.name }}
      />
      {results ? (
        <VersionPnl
          note={<SourceNote set={set} savedBy={savedBy} />}
          rows={results.pnl.filter((p) => p.member === member.id).map(savedPnl)}
          warnings={results.warnings}
          lines={results.lines.filter((l) => l.member === member.id)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Its numbers are still being worked out. Check back in a minute.</p>
      )}
    </main>
  );
}
