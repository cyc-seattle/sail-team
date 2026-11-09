import { plansByYear, type ListedPlan } from "@/model/financial-plans";
import { FinancialPlanCard } from "./financial-plan-card";

/** Every Financial Plan, by year, newest year first: each year's drafts, then its saved ones, newest first. */
export function FinancialPlanList({ plans }: { plans: ListedPlan[] }) {
  if (plans.length === 0) {
    return <p className="text-sm text-muted-foreground">There are no Financial Plans yet.</p>;
  }
  return (
    <div className="grid gap-card">
      {plansByYear(plans).map(({ year, sets }) => (
        <section key={year} aria-labelledby={`year-${year}`} className="grid gap-2">
          <h2 id={`year-${year}`} className="text-base font-medium">
            {year}
          </h2>
          <ul className="grid gap-2">
            {sets.map((plan) => (
              <li key={plan.id}>
                <FinancialPlanCard plan={plan} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
