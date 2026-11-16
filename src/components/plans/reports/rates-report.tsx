import type { OperationsAssumptions } from "@/model/assumptions";
import type { StorageCost } from "@/model/reports";
import { OperationsAssumptionsView } from "../assumptions";
import { StorageReport } from "./storage-report";

/** The rates every plan in a Financial Plan uses, which only a Plan Admin changes, then what storage costs. */
export function RatesReport({ assumptions, storage }: { assumptions: OperationsAssumptions; storage: StorageCost[] }) {
  return (
    <>
      <OperationsAssumptionsView assumptions={assumptions} />
      <div className="max-w-4xl">
        <StorageReport costs={storage} />
      </div>
    </>
  );
}
