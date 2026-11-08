import { formatCents, toneOf } from "@/model/money";
import { cn } from "@/lib/utils";

const tones = { positive: "text-money-positive", negative: "text-money-negative", zero: "text-money-zero" };

/**
 * An amount in cents, shown as dollars in tabular figures. `colored` tints it by its sign, for a net. `whole` rounds it
 * to the dollar.
 */
export function Money({
  cents,
  colored = false,
  whole = false,
  className,
}: {
  cents: number;
  colored?: boolean;
  whole?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("tabular-nums", colored && tones[toneOf(cents)], className)}>{formatCents(cents, whole)}</span>
  );
}
