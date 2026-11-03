import type { Pnl } from "@cyc-seattle/platform/planning";
import { useState } from "react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { inView, sumPnl, viewLabels, type PnlView } from "@/model/pnl-view";
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
        <Money cents={totals.revenue_cents} />
      </TableCell>
      <TableCell className="text-right">
        <Money cents={totals.expense_cents} />
      </TableCell>
      <TableCell className="text-right">
        <Money cents={totals.net_cents} colored />
      </TableCell>
    </>
  );
}

/**
 * Each offering's, product's, or program area's revenue, expenses, and net, with the total in the footer. The toggle
 * shows them for the year, per day, or per sailor-day.
 */
export function PnlTable({ rows, label }: { rows: PnlRow[]; label: string }) {
  const [view, setView] = useState<PnlView>("year");
  return (
    <div className="grid gap-2">
      <ToggleGroup
        value={[view]}
        onValueChange={(values: string[]) => {
          const next = values[0] as PnlView | undefined;
          // Pressing the chosen view again would leave none chosen, so it stays.
          if (next) {
            setView(next);
          }
        }}
        variant="outline"
        size="sm"
        aria-label="Show amounts"
        className="justify-self-end"
      >
        {(Object.keys(viewLabels) as PnlView[]).map((v) => (
          <ToggleGroupItem key={v} value={v}>
            {viewLabels[v]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{label}</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Expenses</TableHead>
            <TableHead className="text-right">Net</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.pnl.key}>
              <TableCell>{row.name}</TableCell>
              <Amounts pnl={row.pnl} view={view} />
            </TableRow>
          ))}
        </TableBody>
        {rows.length > 1 && (
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <Amounts
                pnl={sumPnl(
                  rows.map((r) => r.pnl),
                  "total",
                )}
                view={view}
              />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
