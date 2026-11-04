import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/plans/page-header";
import { RosterList } from "@/components/roster/roster-list";
import { ShareContact, type SaveState } from "@/components/roster/share-contact";
import { NoAccess } from "@/components/shell/no-access";
import { canRead, type Permissions } from "@/directus/access";
import { myRecordQuery, rostersQuery, setShareContact, type MyRecord } from "@/directus/roster";
import { useSession } from "@/directus/use-session";

export const Route = createFileRoute("/rosters/")({
  component: Rosters,
});

function Rosters() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "registrations")) {
    return <NoAccess what="rosters" />;
  }
  return (
    <main className="mx-auto grid max-w-6xl gap-card p-card">
      <PageHeader
        title="Rosters"
        description="Who's signed up for each program now, or most recently, and how to reach the adults who share their email and phone."
      />
      <AllRosters permissions={session.permissions} />
    </main>
  );
}

function AllRosters({ permissions }: { permissions: Permissions }) {
  const { data: rosters } = useSuspenseQuery(rostersQuery(permissions));
  const { data: me } = useSuspenseQuery(myRecordQuery);
  const parent = me !== null && rosters.some((r) => r.sailors.some((s) => s.parents.some((p) => p.id === me.id)));
  return (
    <>
      {me && <MyChoice me={me} parent={parent} />}
      <RosterList rosters={rosters} />
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
