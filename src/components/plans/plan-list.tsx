import { Link } from "@tanstack/react-router";
import type { PlanSummary } from "@/directus/plans";
import { planFor, plansByYear } from "@/model/plan-list";

/** Every plan, by year, each linking to its versions. */
export function PlanList({ plans }: { plans: PlanSummary[] }) {
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
