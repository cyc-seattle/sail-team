import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isSaved, summaryRows, type FinancialPlanSummary, type Member, type Results } from "@/model/financial-plans";
import { formatDate } from "@/model/dates";
import { EngineWarnings } from "./engine-warnings";
import { OperationsSection } from "./operations-section";
import { ProgramsSection } from "./programs-section";
import { SummaryTable } from "./summary-table";
import { VersionBadge } from "./version-badge";

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
        {isSaved(set)
          ? `These are the numbers ${set.name} was saved with, on ${formatDate(set.saved_at)}${savedBy ? `, by ${savedBy}` : ""}. They never change.`
          : "A draft's numbers are calculated now, by this app, and change as planners change the plan."}
      </AlertDescription>
    </Alert>
  );
}

/** A Financial Plan: its note and where its numbers come from, its summary, what to check, Programs, and Operations. */
export function FinancialPlanView({ set, savedBy, members, results, others }: FinancialPlanViewProps) {
  return (
    <div className="grid gap-card">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <VersionBadge state={set.status} />
        {set.message && <span>{set.message}</span>}
        {set.parent && (
          <span className="text-muted-foreground">
            Started from{" "}
            <Link to="/plans/financial/$setId" params={{ setId: set.parent.id }} className="text-link underline">
              {set.parent.name}
            </Link>
          </span>
        )}
        <span className="text-muted-foreground">
          {isSaved(set)
            ? `Saved ${formatDate(set.saved_at)}${savedBy ? ` by ${savedBy}` : ""}. Its numbers never change.`
            : "Its numbers are worked out now, and change as planners change it."}
        </span>
      </p>
      {results ? (
        <>
          <SummaryTable setId={set.id} {...summaryRows(members, results)} />
          <EngineWarnings warnings={results.warnings} />
          <ProgramsSection setId={set.id} members={members} results={results} />
          <OperationsSection
            setId={set.id}
            operations={members.find((m) => m.kind === "operations")}
            results={results}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Its numbers are still being worked out. Check back in a minute.</p>
      )}
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
