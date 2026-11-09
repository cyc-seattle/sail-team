import { usePnlView } from "@/hooks/use-pnl-view";
import { amountInView, type Measures } from "@/model/pnl-view";
import { Money } from "./money";

/**
 * An amount in the view the Unit Switch chose: whole dollars for the year, or with cents per day or per sailor-day,
 * divided by `measures`. A dash when there are no days to divide by.
 */
export function ViewedMoney({
  cents,
  measures,
  colored = false,
}: {
  cents: number;
  measures: Measures;
  colored?: boolean;
}) {
  const [view] = usePnlView();
  const amount = amountInView(cents, view, measures);
  if (amount === null) {
    return (
      <span className="text-muted-foreground">
        —<span className="sr-only">No days to divide by</span>
      </span>
    );
  }
  return <Money cents={amount} colored={colored} whole={view === "year"} />;
}
