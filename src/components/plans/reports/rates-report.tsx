import type { OperationsAssumptions } from "@/model/assumptions";
import { OperationsAssumptionsView } from "../assumptions";
import { ReportSection } from "./report-page";
import { RulesList } from "./rules-list";

/** The rules the planning agent follows across every program, then the rates every plan in a Financial Plan uses. */
export function RatesReport({ assumptions, rules }: { assumptions: OperationsAssumptions; rules: string | null }) {
  return (
    <>
      <ReportSection id="rules" title="Rules">
        <RulesList rules={rules} label="Rules" />
      </ReportSection>
      <OperationsAssumptionsView assumptions={assumptions} />
    </>
  );
}
