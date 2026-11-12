import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, TriangleAlertIcon } from "lucide-react";
import type { PlanWarning } from "@/model/reports";
import { warningsByKind } from "@/model/warnings";
import { CollapsibleSection } from "./collapsible-section";

const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

/**
 * The engine's warnings, closed at first with their count in the title, then by category and kind, each kind closed
 * with its count, then a list by date. Given the program areas' names, each warning also names its area and links to
 * its page.
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
  return (
    <CollapsibleSection
      title={warnings.length === 1 ? "1 warning" : `${warnings.length} warnings`}
      icon={<TriangleAlertIcon aria-hidden className="size-4 text-warning" />}
    >
      <div className="grid max-w-3xl gap-4">
        {warningsByKind(warnings).map((category) => (
          <section key={category.name} aria-label={category.name}>
            <h3 className="text-sm font-medium text-muted-foreground">{category.name}</h3>
            <ul className="grid">
              {category.kinds.map((kind) => (
                <li key={kind.code}>
                  <details className="group/kind">
                    <summary className="flex min-h-tap cursor-pointer list-none items-center gap-1 text-sm [&::-webkit-details-marker]:hidden">
                      <ChevronRightIcon aria-hidden className="size-4 transition-transform group-open/kind:rotate-90" />
                      {kind.name} <span className="text-muted-foreground tabular-nums">({kind.warnings.length})</span>
                    </summary>
                    <ul aria-label={kind.name} className="grid gap-2 pb-2 pl-5 text-sm">
                      {kind.warnings.map((w) => (
                        <li key={w.key}>
                          {w.date && (
                            <span className="font-medium tabular-nums">
                              {day.format(new Date(`${w.date}T00:00:00Z`))}
                            </span>
                          )}
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
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </CollapsibleSection>
  );
}
