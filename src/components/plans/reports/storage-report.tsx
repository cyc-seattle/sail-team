import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StorageCost } from "@/model/reports";
import { Money } from "../money";
import { ReportSection } from "./report-page";

const pinned = "sticky left-0 z-10 bg-background";

/**
 * Every storage cost in the plan, such as the dinghy float and dry storage: what each program area pays, what every
 * program shares, and what no program pays, with the total. The finance committee sets them in the Operations Plan.
 */
export function StorageReport({ costs }: { costs: StorageCost[] }) {
  const total = costs.reduce((sum, c) => sum + c.cents, 0);
  return (
    <ReportSection id="storage" title="Storage">
      <p className="max-w-3xl text-sm text-muted-foreground">
        The finance committee sets storage costs in the Operations Plan, on the Storage account under 7350
        Occupancy/Rent. Program directors can see them, but not change them.
      </p>
      {costs.length === 0 ? (
        <p className="text-sm text-muted-foreground">This plan has no storage costs on the Storage account yet.</p>
      ) : (
        <Table aria-label="Storage">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>Who pays</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.map((c) => (
              <TableRow key={`${c.kind}|${c.payer}|${c.name}`}>
                <TableCell className={pinned}>{c.payer}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell className="text-right">
                  <Money cents={c.cents} whole />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell className={pinned}>Total</TableCell>
              <TableCell />
              <TableCell className="text-right">
                <Money cents={total} whole />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </ReportSection>
  );
}
