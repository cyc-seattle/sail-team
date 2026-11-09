import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { PageHeader } from "@/components/plans/page-header";
import { Roster } from "@/components/roster/roster";
import { NoAccess } from "@/components/shell/no-access";
import { canSeeRosters, type Permissions } from "@/directus/access";
import { myIdQuery, teamsQuery } from "@/directus/roster";
import { useSession } from "@/directus/use-session";
import { defaultTeam, withFilters, type RosterFilters } from "@/model/roster";

export const Route = createFileRoute("/roster/")({
  validateSearch: (search: Record<string, unknown>): RosterFilters =>
    withFilters({}, { team: search["team"], division: search["division"], school: search["school"], q: search["q"] }),
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
  const { data: myId } = useSuspenseQuery(myIdQuery);
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  // The roster shows one team at a time, opening on the viewer's own, and the address says which.
  const team = teams.some((t) => t.id === filters.team) ? filters.team : defaultTeam(teams, myId);
  useEffect(() => {
    if (team && team !== filters.team) {
      // A division belongs to the team the address named, so it goes when that team does.
      void navigate({
        search: withFilters(filters, { team, division: filters.team ? undefined : filters.division }),
        replace: true,
      });
    }
  }, [team, filters, navigate]);
  return (
    <Roster
      teams={teams}
      filters={withFilters(filters, { team })}
      onFiltersChange={(next) => navigate({ search: next, replace: true })}
    />
  );
}
