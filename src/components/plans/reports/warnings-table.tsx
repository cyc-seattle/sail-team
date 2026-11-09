import { TriangleAlertIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { warningLabels, type PlanWarning } from "@/model/reports";

const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

/** A program area's warnings by date: what kind, and what the engine found. */
export function WarningsTable({ warnings }: { warnings: PlanWarning[] }) {
  const sorted = [...warnings].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <Table aria-label="Warnings">
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Kind</TableHead>
          <TableHead>What</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((w) => (
          <TableRow key={w.key}>
            <TableCell className="tabular-nums">{day.format(new Date(`${w.date}T00:00:00Z`))}</TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5 text-warning">
                <TriangleAlertIcon aria-hidden className="size-4" />
                <span className="text-foreground">{warningLabels[w.kind]}</span>
              </span>
            </TableCell>
            <TableCell className="whitespace-normal">{w.message}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
