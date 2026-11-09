import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/plans/page-header";
import { TeamList } from "@/components/roster/team-list";
import { NoAccess } from "@/components/shell/no-access";
import { canSeeRosters, type Permissions } from "@/directus/access";
import { teamsQuery } from "@/directus/roster";
import { useSession } from "@/directus/use-session";

export const Route = createFileRoute("/roster/")({
  component: Rosters,
});

function Rosters() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canSeeRosters(session.permissions)) {
    return <NoAccess what="rosters" />;
  }
  return (
    <main className="mx-auto grid max-w-6xl gap-card p-card">
      <PageHeader title="Rosters" />
      <AllTeams permissions={session.permissions} />
    </main>
  );
}

function AllTeams({ permissions }: { permissions: Permissions }) {
  const { data: teams } = useSuspenseQuery(teamsQuery(permissions));
  return <TeamList teams={teams} />;
}
