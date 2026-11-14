import type { OperationsAssumptions } from "@/model/assumptions";
import { OperationsAssumptionsView } from "../assumptions";
import { ReportSection } from "./report-page";
import { RulesList } from "./rules-list";

/**
 * The rules the planning agent follows across every program, then the rates every plan in a Financial Plan uses, which
 * only a Plan Admin changes.
 */
export function RatesReport({ assumptions, rules }: { assumptions: OperationsAssumptions; rules: string | null }) {
  return (
    <>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Only a Plan Admin can change these, in the Operations Plan. Plan Writers can see them.
      </p>
      <ReportSection id="rules" title="Rules">
        <RulesList rules={rules} label="Rules" />
      </ReportSection>
      <OperationsAssumptionsView assumptions={assumptions} />
    </>
  );
}
