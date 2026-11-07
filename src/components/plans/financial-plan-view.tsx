import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  memberName,
  memberNet,
  membersInOrder,
  type FinancialPlanSummary,
  type Member,
  type Results,
} from "@/model/financial-plans";
import { formatDate } from "@/model/dates";
import { EngineWarnings } from "./engine-warnings";
import { Money } from "./money";
import { SummaryTiles } from "./summary-tiles";

export interface FinancialPlanViewProps {
  set: FinancialPlanSummary;
  savedBy: string | null;
  members: Member[];
  results: Results | null;
  /** The year's other Financial Plans, to compare this one with. */
  others: Pick<FinancialPlanSummary, "id" | "name">[];
}

/** Where a Financial Plan's numbers come from: as it was saved, or calculated now for a draft. */
export function SourceNote({ set, savedBy }: { set: FinancialPlanSummary; savedBy: string | null }) {
  return (
    <Alert>
      <AlertDescription>
        {set.status === "saved"
          ? `These are the numbers ${set.name} was saved with, on ${formatDate(set.saved_at)}${savedBy ? `, by ${savedBy}` : ""}. They never change.`
          : "A draft's numbers are calculated now, by this app, and change as planners change the plan."}
      </AlertDescription>
    </Alert>
  );
}

/** A Financial Plan: where its numbers come from, the organization's totals, what to check, and each of its plans. */
export function FinancialPlanView({ set, savedBy, members, results, others }: FinancialPlanViewProps) {
  return (
    <div className="grid gap-card">
      <SourceNote set={set} savedBy={savedBy} />
      {results ? (
        <>
          <SummaryTiles
            tiles={[
              { label: "Operating net", value: <Money cents={results.totals.operating_net_cents} colored /> },
              { label: "Fundraising net", value: <Money cents={results.totals.fundraising_net_cents} colored /> },
              {
                label: "Capital",
                value: <Money cents={results.totals.capital_cents} />,
                hint: "Spent on lasting things",
              },
              { label: "Total", value: <Money cents={results.totals.total_cents} colored /> },
            ]}
          />
          <EngineWarnings warnings={results.warnings} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Its numbers are still being worked out. Check back in a minute.</p>
      )}
      <section aria-labelledby="plans" className="grid gap-2">
        <h2 id="plans" className="text-base font-medium">
          Plans
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">It holds no plans yet.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {membersInOrder(members).map((member) => (
              <li key={member.id}>
                <Link
                  to="/plans/financial/$setId/$planId"
                  params={{ setId: set.id, planId: member.plan_id }}
                  className="grid min-h-tap gap-1 rounded-lg bg-card p-card ring-1 ring-border hover:ring-ring"
                >
                  <span className="font-medium">{memberName(member)}</span>
                  <span className="text-xs text-muted-foreground">
                    {member.kind === "operations" ? "What the program areas share" : "Program Plan"}
                  </span>
                  {results && (
                    <span className="text-sm">
                      Net <Money cents={memberNet(results, member)} colored />
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      {others.length > 0 && (
        <section aria-labelledby="compare" className="grid gap-2">
          <h2 id="compare" className="text-base font-medium">
            Compare with
          </h2>
          <ul className="flex flex-wrap gap-2">
            {others.map((other) => (
              <li key={other.id}>
                <Link
                  to="/plans/compare/$a/$b"
                  params={{ a: set.id, b: other.id }}
                  className="inline-flex min-h-tap items-center rounded-lg bg-card px-card ring-1 ring-border hover:ring-ring"
                >
                  {other.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
