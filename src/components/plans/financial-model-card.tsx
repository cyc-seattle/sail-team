import { Link } from "@tanstack/react-router";
import type { ModelTotals } from "@/directus/financial-models";
import type { FinancialModelSummary } from "@/model/financial-models";
import { formatDate } from "@/model/dates";
import { Money } from "./money";

/** A year's newest financial model, with the club's operating net and total, or a line saying there's none yet. */
export function FinancialModelCard({
  year,
  plan,
}: {
  year: number;
  plan: (FinancialModelSummary & { totals: ModelTotals | null }) | undefined;
}) {
  if (!plan) {
    return <p className="text-sm text-muted-foreground">There's no financial model for {year} yet.</p>;
  }
  return (
    <Link
      to="/plans/model/$setId"
      params={{ setId: plan.id }}
      className="grid min-h-tap gap-2 rounded-lg bg-card p-card ring-1 ring-border hover:ring-ring sm:grid-cols-[1fr_auto]"
    >
      <span className="grid gap-1">
        <span className="font-medium">Financial model: {plan.name}</span>
        <span className="text-xs text-muted-foreground">Saved {formatDate(plan.saved_at)}</span>
      </span>
      {plan.totals && (
        <span className="grid gap-1 text-sm sm:text-right">
          <span>
            Operating net <Money cents={plan.totals.operating_net_cents} colored />
          </span>
          <span className="text-xs text-muted-foreground">
            Total <Money cents={plan.totals.total_cents} />
          </span>
        </span>
      )}
    </Link>
  );
}
