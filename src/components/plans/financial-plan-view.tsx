import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isSaved, summaryRows, type FinancialPlanSummary, type Member, type Results } from "@/model/financial-plans";
import { formatDate, formatMoment } from "@/model/dates";
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
  /** Whether its numbers have been missing long enough to say they couldn't be worked out. */
  stuck?: boolean;
}

/** Where a Financial Plan's numbers come from: as it was saved, or worked out after a draft's latest change. */
export function SourceNote({
  set,
  savedBy,
  calculatedAt,
}: {
  set: FinancialPlanSummary;
  savedBy: string | null;
  calculatedAt: string | null;
}) {
  return (
    <Alert>
      <AlertDescription>
        {isSaved(set)
          ? `These are the numbers ${set.name} was saved with, on ${formatDate(set.saved_at)}${savedBy ? `, by ${savedBy}` : ""}. They never change.`
          : `A draft's numbers are worked out again after every change to its plans, and this page shows them as they change.${calculatedAt ? ` Last worked out ${formatMoment(calculatedAt)}.` : ""}`}
      </AlertDescription>
    </Alert>
  );
}

/** What shows while a Financial Plan's numbers are missing: still being worked out, or, after a while, not at all. */
export function PendingNumbers({ stuck = false }: { stuck?: boolean }) {
  return stuck ? (
    <Alert>
      <AlertDescription>
        Its numbers couldn't be worked out. Check its plans for a mistake, or change something to try again.
      </AlertDescription>
    </Alert>
  ) : (
    <p role="status" className="text-sm text-muted-foreground">
      Working out its numbers…
    </p>
  );
}

/** A Financial Plan: its status and note, its summary, what to check, Programs, and Non-program. */
export function FinancialPlanView({ set, savedBy, members, results, stuck = false }: FinancialPlanViewProps) {
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
        <PendingNumbers stuck={stuck} />
      )}
    </div>
  );
}
