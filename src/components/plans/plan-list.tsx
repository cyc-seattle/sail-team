import { Link } from "@tanstack/react-router";
import type { ModelTotals } from "@/directus/financial-models";
import type { PlanSummary } from "@/directus/plans";
import { newestFinancialModels, type FinancialModelSummary } from "@/model/financial-models";
import { planFor, plansByYear } from "@/model/plan-list";
import { FinancialModelCard } from "./financial-model-card";

/** Every plan, by year, each linking to its versions, with the year's newest financial model above them. */
export function PlanList({
  plans,
  financialModels = [],
}: {
  plans: PlanSummary[];
  financialModels?: (FinancialModelSummary & { totals: ModelTotals | null })[];
}) {
  const newest = newestFinancialModels(financialModels);
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
          <FinancialModelCard year={year} plan={newest.get(year)} />
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
