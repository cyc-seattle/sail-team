import { createFileRoute, redirect } from "@tanstack/react-router";
import { PlanReport } from "../-plan-report";

/** On the Calendar, the one program area shown and the day, kept in the address; on a program area's report, its day. */
export interface CalendarSearch {
  area?: string;
  day?: string;
}

const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

// Storage is now part of Assumptions, and Fundraising and capital part of Non-program.
const moved: Record<string, { planId: string; hash: string }> = {
  storage: { planId: "rates", hash: "storage" },
  fundraising: { planId: "non-program", hash: "fundraising" },
};

export const Route = createFileRoute("/plans/financial/$setId/$planId")({
  beforeLoad: ({ params }) => {
    const to = moved[params.planId];
    if (to) {
      throw redirect({
        to: "/plans/financial/$setId/$planId",
        params: { setId: params.setId, planId: to.planId },
        hash: to.hash,
        replace: true,
      });
    }
  },
  validateSearch: (search: Record<string, unknown>): CalendarSearch => ({
    ...(typeof search["area"] === "string" && search["area"] && { area: search["area"] }),
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
