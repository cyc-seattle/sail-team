import { createFileRoute } from "@tanstack/react-router";
import { PlanReport } from "../-plan-report";

/** On the Calendar, the one program area shown and the day, kept in the address. */
export interface CalendarSearch {
  area?: string;
  day?: string;
}

const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export const Route = createFileRoute("/plans/financial/$setId/$planId")({
  validateSearch: (search: Record<string, unknown>): CalendarSearch => ({
    ...(typeof search["area"] === "string" && search["area"] && { area: search["area"] }),
    ...(isDay(search["day"]) && { day: search["day"] }),
  }),
  component: Report,
});

/**
 * One of a Financial Plan's other reports: the Calendar, Assumptions, a program area's, Non-program, or Fundraising and
 * capital.
 */
function Report() {
  const { setId, planId } = Route.useParams();
  return <PlanReport setId={setId} report={planId} />;
}
