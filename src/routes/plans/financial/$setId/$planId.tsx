import { createFileRoute } from "@tanstack/react-router";
import { PlanReport } from "../-plan-report";

export const Route = createFileRoute("/plans/financial/$setId/$planId")({
  component: Report,
});

/** One of a Financial Plan's other reports: Assumptions, a program area's, Non-program, or Fundraising and capital. */
function Report() {
  const { setId, planId } = Route.useParams();
  return <PlanReport setId={setId} report={planId} />;
}
