import type { OperationsAssumptions } from "@/model/assumptions";
import { OperationsAssumptionsView } from "../assumptions";

/** The rates every plan in a Financial Plan uses, set in its Operations Plan. */
export function RatesReport({ assumptions }: { assumptions: OperationsAssumptions }) {
  return (
    <section aria-labelledby="rates">
      <h2 id="rates" className="sr-only">
        Assumptions
      </h2>
      <OperationsAssumptionsView assumptions={assumptions} stacked />
    </section>
  );
}
