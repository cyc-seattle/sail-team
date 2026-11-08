import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { HouseholdView } from "@/components/household/household-view";
import type { SaveState } from "@/components/household/save-state";
import { PageHeader } from "@/components/plans/page-header";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { canSeeHousehold, type Permissions } from "@/directus/access";
import { householdQuery, setHouseholdSharing, updateMember } from "@/directus/household";
import { useSession } from "@/directus/use-session";
import type { Household as HouseholdData } from "@/model/household";

export const Route = createFileRoute("/household")({
  component: HouseholdPage,
});

function HouseholdPage() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canSeeHousehold(session.permissions)) {
    return <NoAccess what="a household" />;
  }
  return <Household permissions={session.permissions} />;
}

function Household({ permissions }: { permissions: Permissions }) {
  const { data: household } = useSuspenseQuery(householdQuery(permissions));
  if (!household) {
    return <NoticePage title="You have no household on file" />;
  }
  return (
    <main className="mx-auto grid max-w-4xl gap-card p-card">
      <PageHeader title="Household" />
      <Editable household={household} />
    </main>
  );
}

function Editable({ household }: { household: HouseholdData }) {
  const queryClient = useQueryClient();
  const share = useMutation({
    mutationFn: (shares: boolean) => setHouseholdSharing(household.id, shares),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["household"] }),
        queryClient.invalidateQueries({ queryKey: ["rosters"] }),
      ]),
  });
  const shareState: SaveState = share.isPending
    ? "saving"
    : share.isError
      ? "failed"
      : share.isSuccess
        ? "saved"
        : "idle";
  return (
    <HouseholdView
      household={share.isPending ? { ...household, shares: share.variables } : household}
      shareState={shareState}
      onShareChange={(shares) => share.mutate(shares)}
      onSaveMember={async (personId, changes) => {
        await updateMember(personId, changes);
        await queryClient.invalidateQueries({ queryKey: ["household"] });
        // A changed name or school shows on the rosters too.
        await queryClient.invalidateQueries({ queryKey: ["rosters"] });
      }}
    />
  );
}
