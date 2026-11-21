import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CrewList } from "@/components/crew/crew-list";
import { CrewPage } from "@/components/crew/crew-page";
import { NoAccess } from "@/components/shell/no-access";
import { canWrite } from "@/directus/access";
import { addCrewMember, crewQuery, findPeople } from "@/directus/crew";
import { crewFilters, crewRows } from "@/model/crew";
import { today } from "@/model/financial-plans";
import { useCrewAccess, useRefreshCrew } from "./-crew";

export const Route = createFileRoute("/crew/")({
  validateSearch: crewFilters,
  component: Crew,
});

function Crew() {
  const { allowed } = useCrewAccess();
  return allowed ? <AllCrew /> : <NoAccess what="Crew" />;
}

function AllCrew() {
  const { permissions } = useCrewAccess();
  const refresh = useRefreshCrew();
  const { data } = useSuspenseQuery(crewQuery(permissions));
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CrewPage current="members">
      <CrewList
        rows={crewRows(data, today())}
        programs={data.programs}
        areas={data.areas}
        qualifications={data.qualifications}
        filters={filters}
        onFiltersChange={(next) => navigate({ search: next, replace: true })}
        addMember={
          canWrite(permissions, "crew_members", "create")
            ? {
                find: findPeople,
                onCrew: new Set(data.members.map((m) => m.person.id)),
                add: async (person) => {
                  const id = await addCrewMember(person.id);
                  await refresh();
                  return id;
                },
              }
            : undefined
        }
      />
    </CrewPage>
  );
}
