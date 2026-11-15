import type { OperationsAssumptions } from "@/model/assumptions";
import { OperationsAssumptionsView } from "../assumptions";
import { ReportSection } from "./report-page";
import { NotesList } from "./notes-list";

/**
 * The notes the planning agent follows across every program, then the rates every plan in a Financial Plan uses, which
 * only a Plan Admin changes.
 */
export function RatesReport({ assumptions, notes }: { assumptions: OperationsAssumptions; notes: string[] | null }) {
  return (
    <>
      <ReportSection id="notes" title="Notes">
        <NotesList notes={notes} label="Notes" />
      </ReportSection>
      <OperationsAssumptionsView assumptions={assumptions} />
    </>
  );
}
