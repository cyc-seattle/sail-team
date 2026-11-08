import { Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { outsideTopLine, topLine, type Member, type Results } from "@/model/financial-plans";
import { Money } from "./money";

const pinned = "sticky left-0 z-10 bg-background";

function Row({ name, revenue, expense, net }: { name: string; revenue: number; expense: number; net: number }) {
  return (
    <TableRow>
      <TableCell className={pinned}>{name}</TableCell>
      <TableCell className="text-right">
        <Money cents={revenue} />
      </TableCell>
      <TableCell className="text-right">
        <Money cents={expense} />
      </TableCell>
      <TableCell className="text-right">
        <Money cents={net} colored />
      </TableCell>
    </TableRow>
  );
}

/**
 * What Operations sells outside the programs, the shared costs no program pays, and the two things the summary leaves
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
  return (
    <section aria-labelledby="operations" className="grid gap-2">
      <h2 id="operations" className="text-base font-medium">
        {operations ? (
          <Link
            to="/plans/financial/$setId/$planId"
            params={{ setId, planId: operations.plan_id }}
            className="text-link underline"
          >
            Operations
          </Link>
        ) : (
          "Operations"
        )}
      </h2>
      <Table aria-label="Operations">
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
              key={p.subject_key}
              name={p.name}
              revenue={p.revenue_cents}
              expense={p.expense_cents}
              net={p.net_cents}
            />
          ))}
          <Row name="Shared costs no program pays" revenue={0} expense={unshared} net={-unshared} />
          <Row
            name="Fundraising"
            revenue={fundraising.revenue_cents}
            expense={fundraising.expense_cents}
            net={fundraising.net_cents}
          />
          <Row name="Capital" revenue={0} expense={capital_cents} net={-capital_cents} />
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">Fundraising and capital aren't in the summary above.</p>
    </section>
  );
}
