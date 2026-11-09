import { Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { measuresOf, outsideTopLine, topLine, type Member, type Results } from "@/model/financial-plans";
import type { Measures } from "@/model/pnl-view";
import { ViewedMoney } from "./viewed-money";

const pinned = "sticky left-0 z-10 bg-background";

function Row({
  name,
  revenue,
  expense,
  net,
  measures,
}: {
  name: string;
  revenue: number;
  expense: number;
  net: number;
  measures: Measures;
}) {
  return (
    <TableRow>
      <TableCell className={pinned}>{name}</TableCell>
      <TableCell className="text-right">
        <ViewedMoney cents={revenue} measures={measures} />
      </TableCell>
      <TableCell className="text-right">
        <ViewedMoney cents={expense} measures={measures} />
      </TableCell>
      <TableCell className="text-right">
        <ViewedMoney cents={net} measures={measures} colored />
      </TableCell>
    </TableRow>
  );
}

/**
 * Non-program: what the club sells outside the programs, the shared costs no program pays, and the two things the summary leaves
 * out: fundraising and capital.
 */
export function OperationsSection({
  setId,
  operations,
  results,
}: {
  setId: string;
  operations: Member | undefined;
  results: Results;
}) {
  const products = operations ? results.pnl.filter((p) => p.member === operations.id && p.level === "product") : [];
  const own = operations ? topLine(results.lines.filter((l) => l.member === operations.id)) : null;
  const unshared = own ? own.expense_cents - products.reduce((t, p) => t + p.expense_cents, 0) : 0;
  const { fundraising, capital_cents } = outsideTopLine(results.lines);
  // Everything here is the whole organization's, so per-day amounts divide by every offering's days.
  const measures = measuresOf(results, null);
  return (
    <section aria-labelledby="non-program" className="grid gap-2">
      <h2 id="non-program" className="text-base font-medium">
        {operations ? (
          <Link
            to="/plans/financial/$setId/$planId"
            params={{ setId, planId: operations.plan_id }}
            className="text-link underline"
          >
            Non-program
          </Link>
        ) : (
          "Non-program"
        )}
      </h2>
      <Table aria-label="Non-program">
        <TableHeader>
          <TableRow>
            <TableHead className={pinned}>
              <span className="sr-only">What</span>
            </TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Expenses</TableHead>
            <TableHead className="text-right">Net</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <Row
              measures={measures}
              key={p.subject_key}
              name={p.name}
              revenue={p.revenue_cents}
              expense={p.expense_cents}
              net={p.net_cents}
            />
          ))}
          <Row measures={measures} name="Shared costs no program pays" revenue={0} expense={unshared} net={-unshared} />
          <Row
            measures={measures}
            name="Fundraising"
            revenue={fundraising.revenue_cents}
            expense={fundraising.expense_cents}
            net={fundraising.net_cents}
          />
          <Row measures={measures} name="Capital" revenue={0} expense={capital_cents} net={-capital_cents} />
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">Fundraising and capital aren't in the summary above.</p>
    </section>
  );
}
