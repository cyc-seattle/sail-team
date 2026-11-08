import { Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { costRecovery, type SummaryRow } from "@/model/financial-plans";
import { Money } from "./money";

const count = (n: number | null) => (n === null ? "" : n.toLocaleString("en-US"));
const percent = (n: number | null) => (n === null ? "" : `${Math.round(n * 100)}%`);

/** The name column stays put while the numbers scroll sideways on a phone. */
const pinned = "sticky left-0 z-10 bg-background";

function Cells({ row }: { row: SummaryRow }) {
  const t = row.topLine;
  return (
    <>
      <TableCell className="text-right tabular-nums">{count(row.enrollment)}</TableCell>
      <TableCell className="text-right tabular-nums">{count(row.sailor_days)}</TableCell>
      <TableCell className="text-right">
        <Money cents={t.revenue_cents} />
      </TableCell>
      <TableCell className="text-right">
        <Money cents={t.expense_cents} />
      </TableCell>
      <TableCell className="text-right">
        <Money cents={t.gross_cents} colored />
      </TableCell>
      <TableCell className="text-right">
        <Money cents={t.net_cents} colored />
      </TableCell>
      <TableCell className="text-right tabular-nums">{percent(costRecovery(t))}</TableCell>
    </>
  );
}

/**
 * A Financial Plan's year at a glance: each program area's and Operations' sailors and top-line numbers, leaving out
 * fundraising and capital, with the total in the footer.
 */
export function SummaryTable({ setId, rows, total }: { setId: string; rows: SummaryRow[]; total: SummaryRow }) {
  return (
    <Table aria-label="Summary">
      <TableHeader>
        <TableRow>
          <TableHead className={pinned}>
            <span className="sr-only">Program or Operations</span>
          </TableHead>
          <TableHead className="text-right">Sailors</TableHead>
          <TableHead className="text-right">Sailor-days</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Expenses</TableHead>
          <TableHead className="text-right">Gross</TableHead>
          <TableHead className="text-right">Net</TableHead>
          <TableHead className="text-right">Cost recovery</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.member!.id}>
            <TableCell className={pinned}>
              <Link
                to="/plans/financial/$setId/$planId"
                params={{ setId, planId: row.member!.plan_id }}
                className="text-link underline"
              >
                {row.name}
              </Link>
            </TableCell>
            <Cells row={row} />
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className={pinned}>Total</TableCell>
          <Cells row={total} />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
