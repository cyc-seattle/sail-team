import type { OperationsAssumptions } from "@/model/assumptions";
import type { PlanWarning, StorageCost } from "@/model/reports";
import { OperationsAssumptionsView } from "../assumptions";
import { StorageReport } from "./storage-report";

/** The rates every plan in a Financial Plan uses, which only a Plan Admin changes, then what storage costs. */
export function RatesReport({
  assumptions,
  storage,
  warnings = [],
}: {
  assumptions: OperationsAssumptions;
  storage: StorageCost[];
  /** Every warning in the Financial Plan; each shows on the row it names. */
  warnings?: PlanWarning[];
}) {
  return (
    <>
      <OperationsAssumptionsView assumptions={assumptions} warnings={warnings} />
      <StorageReport costs={storage} />
    </>
  );
}
