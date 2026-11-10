import { Link } from "@tanstack/react-router";
import { TriangleAlertIcon } from "lucide-react";
import type { PlanWarning } from "@/model/reports";
import { CollapsibleSection } from "./collapsible-section";

const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

/**
 * The engine's warnings, closed at first with their count in the title, then a plain list by date. Given the program
 * areas' names, each warning also names its area and links to its page.
 */
export function WarningsSection({
  warnings,
  setId,
  areas,
}: {
  warnings: PlanWarning[];
  setId?: string;
  areas?: Record<string, string>;
}) {
  if (warnings.length === 0) {
    return null;
  }
  // A warning about no one date, such as a missing rate, comes first.
  const sorted = [...warnings].sort(
    (a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.area.localeCompare(b.area),
  );
  return (
    <CollapsibleSection
      title={warnings.length === 1 ? "1 warning" : `${warnings.length} warnings`}
      icon={<TriangleAlertIcon aria-hidden className="size-4 text-warning" />}
    >
      <ul aria-label="Warnings" className="grid max-w-3xl gap-2 text-sm">
        {sorted.map((w) => (
          <li key={w.key}>
            {w.date && <span className="font-medium tabular-nums">{day.format(new Date(`${w.date}T00:00:00Z`))}</span>}
            {areas && setId && (
              <>
                {w.date && ", "}
                <Link
                  to="/plans/financial/$setId/$planId"
                  params={{ setId, planId: w.area }}
                  className="text-link underline"
                >
                  {areas[w.area] ?? w.area}
                </Link>
              </>
            )}
            {(w.date || (areas && setId)) && ": "}
            {w.message}
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}
