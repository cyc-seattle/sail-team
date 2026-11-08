import { Link } from "@tanstack/react-router";
import type { ListedPlan } from "@/model/financial-plans";
import { formatDate } from "@/model/dates";
import { Money } from "./money";
import { VersionBadge } from "./version-badge";

/** One Financial Plan in the list: its name, note, when it was saved and what it started from, and its top-line numbers. */
export function FinancialPlanCard({ plan }: { plan: ListedPlan }) {
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
      {plan.topLine && (
        <dl className="grid grid-cols-2 gap-x-card gap-y-1 text-sm sm:grid-cols-4 sm:text-right">
          {(
            [
              ["Revenue", plan.topLine.revenue_cents],
              ["Expenses", plan.topLine.expense_cents],
              ["Gross", plan.topLine.gross_cents],
              ["Net", plan.topLine.net_cents],
            ] as const
          ).map(([label, cents]) => (
            <div key={label} className="grid">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd>
                <Money cents={cents} colored={label === "Net" || label === "Gross"} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Link>
  );
}
