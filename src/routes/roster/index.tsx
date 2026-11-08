import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { PageHeader } from "@/components/plans/page-header";
import { ShareContact, type SaveState } from "@/components/roster/share-contact";
import { Roster } from "@/components/roster/roster";
import { NoAccess } from "@/components/shell/no-access";
import { canSeeRosters, type Permissions } from "@/directus/access";
import { myRecordQuery, setShareContact, teamsQuery, type MyRecord } from "@/directus/roster";
import { useSession } from "@/directus/use-session";
import { defaultTeam, onTeam, withFilters, type RosterFilters } from "@/model/roster";

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
  const { data: me } = useSuspenseQuery(myRecordQuery);
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  // The roster shows one team at a time, opening on the viewer's own, and the address says which.
  const team = teams.some((t) => t.id === filters.team) ? filters.team : defaultTeam(teams, me?.id ?? null);
  useEffect(() => {
    if (team && team !== filters.team) {
      // A division belongs to the team the address named, so it goes when that team does.
      void navigate({
        search: withFilters(filters, { team, division: filters.team ? undefined : filters.division }),
        replace: true,
      });
    }
  }, [team, filters.team, navigate]);
  const guardian =
    me !== null &&
    teams.some((t) => t.divisions.some((d) => d.sailors.some((s) => s.guardians.some((p) => p.id === me.id))));
  return (
    <>
      {me && teams.some((t) => onTeam(t, me.id)) && <MyChoice me={me} guardian={guardian} />}
      <Roster
        teams={teams}
        filters={withFilters(filters, { team })}
        onFiltersChange={(next) => navigate({ search: next, replace: true })}
      />
    </>
  );
}

function MyChoice({ me, guardian }: { me: MyRecord; guardian: boolean }) {
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (shares: boolean) => setShareContact(me.id, shares),
    onSuccess: (_, shares) => {
      queryClient.setQueryData(myRecordQuery.queryKey, (old) => old && { ...old, share_contact: shares });
      return queryClient.invalidateQueries({ queryKey: ["rosters"] });
    },
  });
  const state: SaveState = save.isPending ? "saving" : save.isError ? "failed" : save.isSuccess ? "saved" : "idle";
  return (
    <ShareContact
      shares={save.isPending ? save.variables : me.share_contact === true}
      guardian={guardian}
      state={state}
      onChange={(shares) => save.mutate(shares)}
    />
  );
}
