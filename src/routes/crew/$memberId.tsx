import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MemberView } from "@/components/crew/member-view";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { canWrite } from "@/directus/access";
import {
  canSeePay,
  createHeldQualification,
  createTerm,
  crewQuery,
  deleteCrewMember,
  deleteHeldQualification,
  deleteTerm,
  photoUrl,
  updateHeldQualification,
  updateTerm,
  updateWebsiteProfile,
  uploadPhoto,
} from "@/directus/crew";
import { today } from "@/model/financial-plans";
import { useCrewAccess, useRefreshCrew } from "./-crew";

export const Route = createFileRoute("/crew/$memberId")({
  component: CrewMember,
});

function CrewMember() {
  const { allowed } = useCrewAccess();
  return allowed ? <Member /> : <NoAccess what="Crew" />;
}

function Member() {
  const { memberId } = Route.useParams();
  const { permissions } = useCrewAccess();
  const refresh = useRefreshCrew();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(crewQuery(permissions));
  const member = data.members.find((m) => m.id === memberId);
  if (!member) {
    return <NoticePage title="There's no one on Crew here" />;
  }
  const pay = canSeePay(permissions);
  const after =
    <T extends unknown[]>(write: (...args: T) => Promise<unknown>) =>
    async (...args: T) => {
      await write(...args);
      await refresh();
    };
  return (
    <MemberView
      member={member}
      data={data}
      day={today()}
      photoUrl={(id) => photoUrl(id, 320)}
      actions={{
        canWriteTerms: canWrite(permissions, "crew_terms", "update"),
        canWriteQualifications: canWrite(permissions, "crew_qualifications", "update"),
        canDelete: canWrite(permissions, "crew_members", "delete"),
        pay,
        onSaveTerm: after((term, input) => (term ? updateTerm(term.id, input, pay) : createTerm(input, pay))),
        onEndTerm: after((term, on) => updateTerm(term.id, { ends_on: on }, pay)),
        onDeleteTerm: after((term) => deleteTerm(term.id)),
        onSaveQualification: after((held, input) =>
          held ? updateHeldQualification(held.id, input) : createHeldQualification(input),
        ),
        onDeleteQualification: after((held) => deleteHeldQualification(held.id)),
        onDelete: async () => {
          await deleteCrewMember(member.id);
          await navigate({ to: "/crew" });
          await refresh();
        },
        profile: canWrite(permissions, "crew_members", "update")
          ? { onSave: after((profile) => updateWebsiteProfile(member.id, profile)), onUpload: uploadPhoto }
          : undefined,
      }}
    />
  );
}
