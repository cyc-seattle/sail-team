import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CrewPage } from "@/components/crew/crew-page";
import { PositionList } from "@/components/crew/position-list";
import { NoAccess } from "@/components/shell/no-access";
import { canWrite } from "@/directus/access";
import { createPosition, crewQuery, deletePosition, updatePosition } from "@/directus/crew";
import { positionRows } from "@/model/crew";
import { today } from "@/model/financial-plans";
import { useCrewAccess, useRefreshCrew } from "./-crew";

export const Route = createFileRoute("/crew/positions")({
  component: Positions,
});

function Positions() {
  const { allowed } = useCrewAccess();
  return allowed ? <AllPositions /> : <NoAccess what="Crew" />;
}

function AllPositions() {
  const { permissions } = useCrewAccess();
  const refresh = useRefreshCrew();
  const { data } = useSuspenseQuery(crewQuery(permissions));
  return (
    <CrewPage current="positions">
      <PositionList
        rows={positionRows(data, today())}
        qualifications={data.qualifications}
        actions={{
          // A position's qualifications are rows of their own.
          canCreate:
            canWrite(permissions, "crew_positions", "create") &&
            canWrite(permissions, "crew_position_qualifications", "create"),
          canUpdate: canWrite(permissions, "crew_positions", "update"),
          canDelete: canWrite(permissions, "crew_positions", "delete"),
          onCreate: async (input) => {
            await createPosition(input);
            await refresh();
          },
          onUpdate: async (position, input) => {
            await updatePosition(position, input);
            await refresh();
          },
          onDelete: async (position) => {
            await deletePosition(position.id);
            await refresh();
          },
        }}
      />
    </CrewPage>
  );
}
