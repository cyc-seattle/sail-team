import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PlanWarning } from "@/model/reports";
import { bySeverity, distinct, warningCount } from "@/model/warnings";
import { SeverityIcon } from "../warning-mark";
import type { Report } from "./report-nav";

const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

/**
 * How many errors and warnings a Financial Plan has, each problem once, beside its name on every report. It opens to
 * every one, by the report it shows on, each a link there. Nothing when there are none.
 */
export function WarningsBadge({
  setId,
  warnings,
  reports,
}: {
  setId: string;
  warnings: PlanWarning[];
  reports: Report[];
}) {
  const own = distinct(warnings);
  if (own.length === 0) {
    return null;
  }
  const errors = own.filter((w) => w.severity === "error").length;
  const rest = own.length - errors;
  const groups = reports
    .map((r) => ({ ...r, warnings: own.filter((w) => w.area === r.key).sort(bySeverity) }))
    .filter((g) => g.warnings.length > 0);
  return (
    <Popover>
      <PopoverTrigger
        aria-label={warningCount(own)}
        className="inline-flex h-6 cursor-pointer items-center gap-2 rounded-full border px-2 text-xs font-medium tabular-nums outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {errors > 0 && (
          <span className="inline-flex items-center gap-1">
            <SeverityIcon severity="error" />
            {errors}
          </span>
        )}
        {rest > 0 && (
          <span className="inline-flex items-center gap-1">
            <SeverityIcon severity="warning" />
            {rest}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[70vh] w-[min(28rem,90vw)] overflow-y-auto" aria-label="Warnings">
        {groups.map((g) => (
          <section key={g.key} aria-label={g.name} className="grid gap-1">
            <h3 className="font-medium">{g.name}</h3>
            <ul className="grid gap-1.5">
              {g.warnings.map((w) => (
                <li key={w.key} className="flex gap-1.5">
                  <SeverityIcon severity={w.severity} className="mt-0.5" />
                  <span>
                    {w.date && (
                      <>
                        <Link
                          to="/plans/financial/$setId/$planId"
                          params={{ setId, planId: w.area }}
                          search={{ day: w.date }}
                          hash="calendar"
                          className="font-medium text-link tabular-nums underline"
                        >
                          {day.format(new Date(`${w.date}T00:00:00Z`))}
                        </Link>
                        {": "}
                      </>
                    )}
                    {w.message}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </PopoverContent>
    </Popover>
  );
}
