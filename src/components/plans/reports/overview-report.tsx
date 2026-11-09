import { Link } from "@tanstack/react-router";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  defaultSort,
  expensesOf,
  netOf,
  nextSort,
  sortRows,
  totalOf,
  type OverviewRow,
  type Sort,
  type SortKey,
} from "@/model/reports";
import { cn } from "@/lib/utils";
import { Money } from "../money";
import { ReportSection } from "./report-page";

/** The name column stays put while the numbers scroll sideways on a phone. */
const pinned = "sticky left-0 z-10 bg-background";
const none = <span className="text-muted-foreground">—</span>;
const count = (n: number) => n.toLocaleString("en-US");

function Name({ setId, row }: { setId: string; row: OverviewRow }) {
  return (
    <TableCell className={pinned}>
      <Link to="/plans/financial/$setId/$planId" params={{ setId, planId: row.report }} className="text-link underline">
        {row.name}
      </Link>
    </TableCell>
  );
}

function Amount({ cents, colored = false }: { cents: number | null; colored?: boolean }) {
  return (
    <TableCell className="text-right">
      {cents === null ? none : <Money cents={cents} colored={colored} whole />}
    </TableCell>
  );
}

function Count({ children }: { children: ReactNode }) {
  return <TableCell className="text-right tabular-nums">{children}</TableCell>;
}

function SortHead({
  sortKey,
  sort,
  onSort,
  children,
}: {
  sortKey: SortKey;
  sort: Sort;
  onSort: (sort: Sort) => void;
  children: ReactNode;
}) {
  const active = sort.key === sortKey;
  const Arrow = sort.descending ? ArrowDownIcon : ArrowUpIcon;
  return (
    <TableHead
      aria-sort={active ? (sort.descending ? "descending" : "ascending") : undefined}
      className={cn(sortKey === "name" ? pinned : "text-right")}
    >
      <button
        type="button"
        onClick={() => onSort(nextSort(sort, sortKey))}
        className={cn(
          "inline-flex min-h-tap items-center gap-1 font-medium md:min-h-0",
          sortKey !== "name" && "flex-row-reverse",
        )}
      >
        {children}
        <Arrow aria-hidden className={cn("size-3.5", !active && "invisible")} />
      </button>
    </TableHead>
  );
}

/** Whole dollars per one of something, or a dash when there's nothing to divide by. */
const per = (cents: number, by: number) => (by > 0 ? Math.round(cents / by) : null);

function PerOfferingAndDay({ row }: { row: OverviewRow }) {
  return (
    <>
      <Amount cents={per(row.revenue_cents, row.offerings)} />
      <Amount cents={per(expensesOf(row), row.offerings)} />
      <Amount cents={per(row.revenue_cents, row.days)} />
      <Amount cents={per(expensesOf(row), row.days)} />
    </>
  );
}

/**
 * A Financial Plan's year by program area: revenue to net, sortable, then what a sailor pays, the amounts per offering
 * and per day, and the counts, each in its own table so no table mixes dollars with counts.
 */
export function OverviewReport({ setId, rows }: { setId: string; rows: OverviewRow[] }) {
  const [sort, setSort] = useState<Sort>(defaultSort);
  const sorted = sortRows(rows, sort);
  const programs = sorted.filter((r) => r.offerings > 0);
  const total = totalOf(rows);
  const programTotal = { ...totalOf(programs), name: "All programs" };
  return (
    <>
      <ReportSection id="revenue-and-expenses" title="Revenue and expenses">
        <Table aria-label="Revenue and expenses">
          <TableHeader>
            <TableRow>
              <SortHead sortKey="name" sort={sort} onSort={setSort}>
                Program area
              </SortHead>
              <SortHead sortKey="revenue_cents" sort={sort} onSort={setSort}>
                Revenue
              </SortHead>
              <SortHead sortKey="direct_cents" sort={sort} onSort={setSort}>
                Direct costs
              </SortHead>
              <SortHead sortKey="indirect_cents" sort={sort} onSort={setSort}>
                Indirect costs
              </SortHead>
              <SortHead sortKey="net_cents" sort={sort} onSort={setSort}>
                Net
              </SortHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.report}>
                <Name setId={setId} row={row} />
                <Amount cents={row.revenue_cents} />
                <Amount cents={row.direct_cents} />
                <Amount cents={row.indirect_cents} />
                <Amount cents={netOf(row)} colored />
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell className={pinned}>Total</TableCell>
              <Amount cents={total.revenue_cents} />
              <Amount cents={total.direct_cents} />
              <Amount cents={total.indirect_cents} />
              <Amount cents={netOf(total)} colored />
            </TableRow>
          </TableFooter>
        </Table>
      </ReportSection>

      <ReportSection id="what-a-sailor-pays" title="What a sailor pays">
        <Table aria-label="What a sailor pays">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>Program area</TableHead>
              <TableHead className="text-right">Average per offering</TableHead>
              <TableHead className="text-right">Average per day</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((row) => (
              <TableRow key={row.report}>
                <Name setId={setId} row={row} />
                <Amount cents={per(row.revenue_cents, row.sailors)} />
                <Amount cents={per(row.revenue_cents, row.sailor_days)} />
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell className={pinned}>{programTotal.name}</TableCell>
              <Amount cents={per(programTotal.revenue_cents, programTotal.sailors)} />
              <Amount cents={per(programTotal.revenue_cents, programTotal.sailor_days)} />
            </TableRow>
          </TableFooter>
        </Table>
      </ReportSection>

      <ReportSection id="per-offering-and-day" title="Per offering and per day">
        <Table aria-label="Per offering and per day">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>Program area</TableHead>
              <TableHead className="text-right">Revenue per offering</TableHead>
              <TableHead className="text-right">Expenses per offering</TableHead>
              <TableHead className="text-right">Revenue per day</TableHead>
              <TableHead className="text-right">Expenses per day</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((row) => (
              <TableRow key={row.report}>
                <Name setId={setId} row={row} />
                <PerOfferingAndDay row={row} />
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell className={pinned}>{programTotal.name}</TableCell>
              <PerOfferingAndDay row={programTotal} />
            </TableRow>
          </TableFooter>
        </Table>
      </ReportSection>

      <ReportSection id="sailors-and-days" title="Sailors and days">
        <Table aria-label="Sailors and days">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>Program area</TableHead>
              <TableHead className="text-right">Offerings</TableHead>
              <TableHead className="text-right">Sailors</TableHead>
              <TableHead className="text-right">Days</TableHead>
              <TableHead className="text-right">Sailor-days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((row) => (
              <TableRow key={row.report}>
                <Name setId={setId} row={row} />
                <Count>{count(row.offerings)}</Count>
                <Count>{count(row.sailors)}</Count>
                <Count>{count(row.days)}</Count>
                <Count>{count(row.sailor_days)}</Count>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell className={pinned}>{programTotal.name}</TableCell>
              <Count>{count(programTotal.offerings)}</Count>
              <Count>{count(programTotal.sailors)}</Count>
              <Count>{count(programTotal.days)}</Count>
              <Count>{count(programTotal.sailor_days)}</Count>
            </TableRow>
          </TableFooter>
        </Table>
      </ReportSection>
    </>
  );
}
