import { Link } from "@tanstack/react-router";
import type { PlanWarning } from "@/model/reports";
import { distinct } from "@/model/warnings";
import { WarningCount } from "../warning-mark";

/**
 * How many errors and warnings a Financial Plan has, each problem once, beside its name on every report. It links to
 * the Overview's warnings, or its program areas when it has none of its own, where each area's count links to its own. Nothing when there are none.
 */
export function WarningsBadge({ setId, warnings }: { setId: string; warnings: PlanWarning[] }) {
  const own = distinct(warnings);
  if (own.length === 0) {
    return null;
  }
  return (
    <Link
      to="/plans/financial/$setId"
      params={{ setId }}
      hash={own.some((w) => w.area === "non-program") ? "warnings" : "revenue-and-expenses"}
      className="inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <WarningCount warnings={own} />
    </Link>
  );
}
