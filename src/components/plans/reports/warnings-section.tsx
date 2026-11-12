import { Link } from "@tanstack/react-router";
import { TriangleAlertIcon } from "lucide-react";
import type { PlanWarning } from "@/model/reports";
import { warningsByKind } from "@/model/warnings";

const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

/**
 * The engine's warnings, all shown, with their count in the title: by category and kind, each kind with its count,
 * then a list by date. Given the program areas' names, each warning also names its area and links to its page.
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
    <section aria-labelledby="warnings" className="grid gap-4">
      <h2 id="warnings" className="flex items-center gap-2 text-lg font-medium">
        <TriangleAlertIcon aria-hidden className="size-4 text-warning" />
        {warnings.length === 1 ? "1 warning" : `${warnings.length} warnings`}
      </h2>
      <div className="grid max-w-3xl gap-4">
        {warningsByKind(warnings).map((category) => (
          <section key={category.name} aria-label={category.name}>
            <h3 className="text-sm font-medium text-muted-foreground">{category.name}</h3>
            <ul className="grid gap-2 pt-1">
              {category.kinds.map((kind) => (
                <li key={kind.code}>
                  <h4 className="text-sm font-medium">
                    {kind.name} <span className="text-muted-foreground tabular-nums">({kind.warnings.length})</span>
                  </h4>
                  <ul aria-label={kind.name} className="grid gap-1 pt-1 pl-4 text-sm">
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
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
