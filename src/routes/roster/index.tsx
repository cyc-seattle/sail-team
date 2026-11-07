import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/plans/page-header";
import { ShareContact, type SaveState } from "@/components/roster/share-contact";
import { TeamList } from "@/components/roster/team-list";
import { NoAccess } from "@/components/shell/no-access";
import { canSeeRosters, type Permissions } from "@/directus/access";
import { myRecordQuery, setShareContact, teamsQuery, type MyRecord } from "@/directus/roster";
import { useSession } from "@/directus/use-session";
import { onTeam } from "@/model/roster";

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
      <PageHeader title="Rosters" description="Each team's sailors, and how to reach their families." />
      <AllTeams permissions={session.permissions} />
    </main>
  );
}

function AllTeams({ permissions }: { permissions: Permissions }) {
  const { data: teams } = useSuspenseQuery(teamsQuery(permissions));
  const { data: me } = useSuspenseQuery(myRecordQuery);
  const parent =
    me !== null &&
    teams.some((t) => t.divisions.some((d) => d.sailors.some((s) => s.parents.some((p) => p.id === me.id))));
  return (
    <>
      {me && teams.some((t) => onTeam(t, me.id)) && <MyChoice me={me} parent={parent} />}
      <TeamList teams={teams} />
    </>
  );
}

function MyChoice({ me, parent }: { me: MyRecord; parent: boolean }) {
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
      parent={parent}
      state={state}
      onChange={(shares) => save.mutate(shares)}
    />
  );
}
