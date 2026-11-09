import { Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { costRecovery, type SummaryRow } from "@/model/financial-plans";
import { ViewedMoney } from "./viewed-money";

const percent = (n: number | null) => (n === null ? "" : `${Math.round(n * 100)}%`);

/** The name column stays put while the numbers scroll sideways on a phone. */
const pinned = "sticky left-0 z-10 bg-background";

function Cells({ row }: { row: SummaryRow }) {
  const t = row.topLine;
  return (
    <>
      <TableCell className="text-right">
        <ViewedMoney cents={t.revenue_cents} measures={row.measures} />
      </TableCell>
      <TableCell className="text-right">
        <ViewedMoney cents={t.expense_cents} measures={row.measures} />
      </TableCell>
      <TableCell className="text-right">
        <ViewedMoney cents={t.gross_cents} measures={row.measures} colored />
      </TableCell>
      <TableCell className="text-right">
        <ViewedMoney cents={t.net_cents} measures={row.measures} colored />
      </TableCell>
      <TableCell className="text-right tabular-nums">{percent(costRecovery(t))}</TableCell>
    </>
  );
}

/**
 * A Financial Plan's year at a glance: each program area's and Non-program's top-line numbers, leaving out fundraising
 * and capital, with the total in the footer.
 */
export function SummaryTable({ setId, rows, total }: { setId: string; rows: SummaryRow[]; total: SummaryRow }) {
  return (
    <Table aria-label="Summary">
      <TableHeader>
        <TableRow>
          <TableHead className={pinned}>
            <span className="sr-only">Program area</span>
          </TableHead>
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
      {/* An opaque footer, so the pinned name cell matches the row when the numbers scroll under it. */}
      <TableFooter className="bg-transparent">
        <TableRow>
          <TableCell className={pinned}>Total</TableCell>
          <Cells row={total} />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
