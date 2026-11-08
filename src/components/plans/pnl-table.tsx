import type { Pnl } from "@cyc-seattle/platform/planning";
import { Fragment } from "react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePnlView } from "@/hooks/use-pnl-view";
import { inView, sumPnl, type PnlView } from "@/model/pnl-view";
import { Money } from "./money";

export interface PnlRow {
  name: string;
  pnl: Pnl;
}

function Amounts({ pnl, view }: { pnl: Pnl; view: PnlView }) {
  const totals = inView(pnl, view);
  if (!totals) {
    return (
      <TableCell colSpan={3} className="text-right text-muted-foreground">
        No days to divide by
      </TableCell>
    );
  }
  return (
    <>
      <TableCell className="text-right">
        <Money cents={totals.revenue_cents} whole={view === "year"} />
      </TableCell>
      <TableCell className="text-right">
        <Money cents={totals.expense_cents} whole={view === "year"} />
      </TableCell>
      <TableCell className="text-right">
        <Money cents={totals.net_cents} colored whole={view === "year"} />
      </TableCell>
    </>
  );
}

const total = (rows: PnlRow[]) =>
  sumPnl(
    rows.map((r) => r.pnl),
    "total",
  );

/**
 * Each offering's, product's, or program area's revenue, costs, and net, with the total in the footer, in the view
 * the Unit Switch chose. Given groups, such as each program's offerings, it adds a subtotal for each.
 */
export function PnlTable({
  rows,
  label,
  groups,
}: {
  rows: PnlRow[];
  label: string;
  groups?: { name: string; rows: PnlRow[] }[];
}) {
  const [view] = usePnlView();
  const grouped = groups && groups.length > 1;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{label}</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Costs</TableHead>
          <TableHead className="text-right">Net</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {grouped
          ? groups.map((group) => (
              <Fragment key={group.name}>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="pt-4 font-medium">
                    {group.name}
                  </TableCell>
                </TableRow>
                {group.rows.map((row) => (
                  <TableRow key={row.pnl.key}>
                    <TableCell className="pl-6 whitespace-normal">{row.name}</TableCell>
                    <Amounts pnl={row.pnl} view={view} />
                  </TableRow>
                ))}
                {group.rows.length > 1 && (
                  <TableRow className="font-medium">
                    <TableCell className="pl-6 whitespace-normal">{group.name} total</TableCell>
                    <Amounts pnl={total(group.rows)} view={view} />
                  </TableRow>
                )}
              </Fragment>
            ))
          : rows.map((row) => (
              <TableRow key={row.pnl.key}>
                <TableCell className="whitespace-normal">{row.name}</TableCell>
                <Amounts pnl={row.pnl} view={view} />
              </TableRow>
            ))}
      </TableBody>
      {rows.length > 1 && (
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <Amounts pnl={total(rows)} view={view} />
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}
