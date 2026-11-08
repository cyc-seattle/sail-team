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

/** A Financial Plan: its status and note, its summary, what to check, Programs, and Non-program. */
export function FinancialPlanView({ set, savedBy, members, results }: FinancialPlanViewProps) {
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
        {isSaved(set) && (
          <span className="text-muted-foreground">
            Saved {formatDate(set.saved_at)}
            {savedBy && ` by ${savedBy}`}
          </span>
        )}
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
    </div>
  );
}
