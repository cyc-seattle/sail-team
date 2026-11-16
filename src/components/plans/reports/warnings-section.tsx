import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PlanWarning } from "@/model/reports";
import { bySeverity, distinct, kindName } from "@/model/warnings";
import { SeverityIcon } from "../warning-mark";
import { ReportSection } from "./report-page";

const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

/**
 * The engine's warnings as a table, errors first, then by date: what each is, and the engine's detail, with a date column only when one has a date. Given a way to
 * show a day, each date opens that day on the calendar. Nothing when there are none.
 */
export function WarningsSection({ warnings, onDay }: { warnings: PlanWarning[]; onDay?: (date: string) => void }) {
  const own = distinct(warnings).sort(bySeverity);
  if (own.length === 0) {
    return null;
  }
  const dated = own.some((w) => w.date);
  return (
    <ReportSection id="warnings" title="Warnings">
      <Table aria-label="Warnings">
        <TableHeader>
          <TableRow>
            <TableHead className="w-6">
              <span className="sr-only">Severity</span>
            </TableHead>
            {dated && <TableHead>Date</TableHead>}
            <TableHead>Warning</TableHead>
            <TableHead className="hidden sm:table-cell">Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {own.map((w) => (
            <TableRow key={w.key}>
              <TableCell className="align-top">
                <SeverityIcon severity={w.severity} />
                <span className="sr-only">{w.severity === "error" ? "Error" : "Warning"}</span>
              </TableCell>
              {dated && (
                <TableCell className="align-top whitespace-nowrap tabular-nums">
                  {w.date &&
                    (onDay ? (
                      <button
                        type="button"
                        onClick={() => {
                          onDay(w.date!);
                          document.getElementById("calendar")?.scrollIntoView();
                        }}
                        className="cursor-pointer text-link underline"
                      >
                        {day.format(new Date(`${w.date}T00:00:00Z`))}
                      </button>
                    ) : (
                      day.format(new Date(`${w.date}T00:00:00Z`))
                    ))}
                </TableCell>
              )}
              <TableCell className="align-top whitespace-normal">
                <span className="font-medium">{kindName(w.code)}</span>
                {/* A phone has no room for a column of its own, so the detail goes under the name. */}
                <span className="block sm:hidden">{w.message}</span>
              </TableCell>
              <TableCell className="hidden align-top whitespace-normal sm:table-cell">{w.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ReportSection>
  );
}
