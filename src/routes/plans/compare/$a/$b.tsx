import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CompareView } from "@/components/plans/compare-view";
import { PageHeader } from "@/components/plans/page-header";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { canRead } from "@/directus/access";
import { financialPlanQuery } from "@/directus/financial-plans";
import { useSession } from "@/directus/use-session";

export const Route = createFileRoute("/plans/compare/$a/$b")({
  component: ComparePage,
});

function ComparePage() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "plans")) {
    return <NoAccess what="plans" />;
  }
  return <Loaded />;
}

/** Two Financial Plans side by side, such as two options started from the same one. */
function Loaded() {
  const { a, b } = Route.useParams();
  const { data: first } = useSuspenseQuery(financialPlanQuery(a));
  const { data: second } = useSuspenseQuery(financialPlanQuery(b));
  if (!first || !second) {
    return <NoticePage title="There's no such Financial Plan" />;
  }
  return (
    <main className="mx-auto max-w-6xl p-card">
      <PageHeader
        title={`${first.set.name} and ${second.set.name}`}
        description={`Two Financial Plans for ${first.set.fiscal_year}, side by side`}
        back={{ to: `/plans/financial/${a}`, label: first.set.name }}
      />
      <CompareView a={first} b={second} />
    </main>
  );
}
