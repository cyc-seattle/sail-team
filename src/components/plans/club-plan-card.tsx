import { Link } from "@tanstack/react-router";
import type { ClubTotals } from "@/directus/club-plans";
import type { ClubPlanSummary } from "@/model/club-plans";
import { formatDate } from "@/model/dates";
import { Money } from "./money";

/** A year's newest club plan, with the club's operating net and total, or a line saying there's none yet. */
export function ClubPlanCard({
  year,
  plan,
}: {
  year: number;
  plan: (ClubPlanSummary & { totals: ClubTotals | null }) | undefined;
}) {
  if (!plan) {
    return <p className="text-sm text-muted-foreground">The club has no club plan for {year} yet.</p>;
  }
  return (
    <Link
      to="/plans/club/$setId"
      params={{ setId: plan.id }}
      className="grid min-h-tap gap-2 rounded-lg bg-card p-card ring-1 ring-border hover:ring-ring sm:grid-cols-[1fr_auto]"
    >
      <span className="grid gap-1">
        <span className="font-medium">Club plan: {plan.name}</span>
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
