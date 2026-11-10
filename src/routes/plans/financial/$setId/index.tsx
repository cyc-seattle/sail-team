import { createFileRoute } from "@tanstack/react-router";
import { PlanReport } from "../-plan-report";

export const Route = createFileRoute("/plans/financial/$setId/")({
  component: Overview,
});

/** A Financial Plan opens on its Overview. */
function Overview() {
  const { setId } = Route.useParams();
  return <PlanReport setId={setId} report="overview" />;
}
