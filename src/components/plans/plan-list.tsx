import { Link } from "@tanstack/react-router";
import type { ClubTotals } from "@/directus/club-plans";
import type { PlanSummary } from "@/directus/plans";
import { newestClubPlans, type ClubPlanSummary } from "@/model/club-plans";
import { planFor, plansByYear } from "@/model/plan-list";
import { ClubPlanCard } from "./club-plan-card";

/** Every plan, by year, each linking to its versions, with the year's newest club plan above them. */
export function PlanList({
  plans,
  clubPlans = [],
}: {
  plans: PlanSummary[];
  clubPlans?: (ClubPlanSummary & { totals: ClubTotals | null })[];
}) {
  const newest = newestClubPlans(clubPlans);
  if (plans.length === 0) {
    return <p className="text-sm text-muted-foreground">There are no plans yet.</p>;
  }
  return (
    <div className="grid gap-card">
      {plansByYear(plans).map(({ year, plans }) => (
        <section key={year} aria-labelledby={`year-${year}`} className="grid gap-2">
          <h2 id={`year-${year}`} className="text-base font-medium">
            {year}
          </h2>
          <ClubPlanCard year={year} plan={newest.get(year)} />
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <li key={plan.id}>
                <Link
                  to="/plans/$planId"
                  params={{ planId: plan.id }}
                  className="grid min-h-tap gap-1 rounded-lg bg-card p-card ring-1 ring-border hover:ring-ring"
                >
                  <span className="font-medium">{plan.name}</span>
                  <span className="text-xs text-muted-foreground">{planFor(plan)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
