import { createFileRoute } from "@tanstack/react-router";
import { PlanReport } from "../-plan-report";

/** The calendar's day, kept in the address, on the Calendar and on a program area's report. */
export interface CalendarSearch {
  day?: string;
}

const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export const Route = createFileRoute("/plans/financial/$setId/$planId")({
  validateSearch: (search: Record<string, unknown>): CalendarSearch => ({
    ...(isDay(search["day"]) && { day: search["day"] }),
  }),
  component: Report,
});

/**
 * One of a Financial Plan's other reports: the Calendar, Assumptions, a program area's, or Non-program.
 */
function Report() {
  const { setId, planId } = Route.useParams();
  return <PlanReport setId={setId} report={planId} />;
}
