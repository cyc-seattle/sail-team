import { Link } from "@tanstack/react-router";
import type { FinancialPlanSummary, Totals } from "@/model/financial-plans";
import { formatDate } from "@/model/dates";
import { Money } from "./money";
import { VersionBadge } from "./version-badge";

/** One Financial Plan in the list: its name, note, when it was saved and what it started from, and its operating net. */
export function FinancialPlanCard({ plan }: { plan: FinancialPlanSummary & { totals: Totals | null } }) {
  return (
    <Link
      to="/plans/financial/$setId"
      params={{ setId: plan.id }}
      className="grid min-h-tap gap-2 rounded-lg bg-card p-card ring-1 ring-border hover:ring-ring sm:grid-cols-[1fr_auto]"
    >
      <span className="grid gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{plan.name}</span>
          <VersionBadge state={plan.status} />
        </span>
        {plan.message && <span className="text-sm">{plan.message}</span>}
        <span className="text-xs text-muted-foreground">
          {[
            plan.status === "saved" ? `Saved ${formatDate(plan.saved_at)}` : "Calculated when you open it",
            plan.parent && `Started from ${plan.parent.name}`,
          ]
            .filter(Boolean)
            .join(". ")}
        </span>
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
