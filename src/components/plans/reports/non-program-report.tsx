import { Fragment } from "react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product, SharedCost } from "@/model/reports";
import { Money } from "../money";
import { ReportSection } from "./report-page";

const pinned = "sticky left-0 z-10 bg-background";

function Amount({ cents, colored = false }: { cents: number; colored?: boolean }) {
  return (
    <TableCell className="text-right">
      <Money cents={cents} colored={colored} whole />
    </TableCell>
  );
}

const add = <T,>(rows: T[], of: (row: T) => number) => rows.reduce((total, r) => total + of(r), 0);

/**
 * What CSC sells outside the programs, which carries no shared costs, then each shared cost by account: the part
 * allocated to the programs, the part left unallocated, and its total.
 */
export function NonProgramReport({ products, shared }: { products: Product[]; shared: SharedCost[] }) {
  const total = {
    revenue_cents: add(products, (p) => p.revenue_cents),
    direct_cents: add(products, (p) => p.direct_cents),
  };
  const pools = [...new Set(shared.map((c) => c.pool))];
  return (
    <>
      <ReportSection id="sold-outside-programs" title="Sold outside programs">
        <Table aria-label="Sold outside programs">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>
                <span className="sr-only">What</span>
              </TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Direct costs</TableHead>
              <TableHead className="text-right">Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.name}>
                <TableCell className={pinned}>{p.name}</TableCell>
                <Amount cents={p.revenue_cents} />
                <Amount cents={p.direct_cents} />
                <Amount cents={p.revenue_cents - p.direct_cents} colored />
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell className={pinned}>Total</TableCell>
              <Amount cents={total.revenue_cents} />
              <Amount cents={total.direct_cents} />
              <Amount cents={total.revenue_cents - total.direct_cents} colored />
            </TableRow>
          </TableFooter>
        </Table>
      </ReportSection>

      <ReportSection id="shared-costs" title="Shared costs">
        <Table aria-label="Shared costs">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Account</TableHead>
              <TableHead>
                <span className="sr-only">Name</span>
              </TableHead>
              <TableHead className="text-right">Allocated</TableHead>
              <TableHead className="text-right">Unallocated</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pools.map((pool) => {
              const costs = shared.filter((c) => c.pool === pool);
              return (
                <Fragment key={pool}>
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="pt-6 font-medium">
                      {pool}
                    </TableCell>
                  </TableRow>
                  {costs.map((c) => (
                    <TableRow key={`${c.number} ${c.name}`}>
                      <TableCell className="text-muted-foreground tabular-nums">{c.number}</TableCell>
                      <TableCell className="whitespace-normal">{c.name}</TableCell>
                      <Amount cents={c.allocated_cents} />
                      <Amount cents={c.total_cents - c.allocated_cents} />
                      <Amount cents={c.total_cents} />
                    </TableRow>
                  ))}
                </Fragment>
              );
            })}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell />
              <TableCell>Total</TableCell>
              <Amount cents={add(shared, (c) => c.allocated_cents)} />
              <Amount cents={add(shared, (c) => c.total_cents - c.allocated_cents)} />
              <Amount cents={add(shared, (c) => c.total_cents)} />
            </TableRow>
          </TableFooter>
        </Table>
      </ReportSection>
    </>
  );
}
