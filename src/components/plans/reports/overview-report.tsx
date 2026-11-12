import { Link } from "@tanstack/react-router";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  defaultSort,
  enrollment,
  grossOf,
  feeOf,
  fees,
  netOf,
  nextSort,
  sortRows,
  totalOf,
  type EnrollmentBy,
  type EnrollmentRow,
  type Fee,
  type FunctionalExpenses,
  type OverviewRow,
  type PlanWarning,
  type ReportOffering,
  type Sort,
  type SortKey,
} from "@/model/reports";
import type { Totals } from "@/model/financial-plans";
import { cn } from "@/lib/utils";
import { Money } from "../money";
import { CollapsibleSection } from "./collapsible-section";
import { ReportSection } from "./report-page";
import { YearTimeline, type TimelineArea } from "./year-timeline";
import { SegmentedControl } from "./segmented-control";
import { WarningsSection } from "./warnings-section";

/** The name column stays put while the numbers scroll sideways on a phone. */
const pinned = "sticky left-0 z-10 bg-background";
const count = (n: number) => n.toLocaleString("en-US");

function AreaLink({ setId, row }: { setId: string; row: OverviewRow }) {
  return (
    <Link to="/plans/financial/$setId/$planId" params={{ setId, planId: row.report }} className="text-link underline">
      {row.name}
    </Link>
  );
}

function Amount({ cents, colored = false, whole = true }: { cents: number; colored?: boolean; whole?: boolean }) {
  return (
    <TableCell className="text-right">
      <Money cents={cents} colored={colored} whole={whole} />
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

/** A program area's name as a row above its programs or sessions. */
function AreaRow({ setId, row, span }: { setId: string; row: OverviewRow; span: number }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className={cn(pinned, "pt-4 font-medium")}>
        <AreaLink setId={setId} row={row} />
      </TableCell>
      <TableCell colSpan={span} />
    </TableRow>
  );
}

function EnrollmentCells({ row }: { row: EnrollmentRow }) {
  return (
    <>
      <Count>{count(row.offerings)}</Count>
      <Count>{count(row.sailors)}</Count>
      <Count>{count(row.max)}</Count>
      <Count>{count(row.sailor_days)}</Count>
    </>
  );
}

function FeeRow({ fee, className }: { fee: Fee; className?: string }) {
  return (
    <TableRow>
      <TableCell className={cn(pinned, className)}>{fee.name}</TableCell>
      <Amount cents={fee.per_offering_cents} />
      <Amount cents={fee.per_day_cents} whole={false} />
      <Amount cents={fee.per_hour_cents} whole={false} />
    </TableRow>
  );
}

export interface OverviewReportProps {
  setId: string;
  rows: OverviewRow[];
  /** Each program area's offerings, by its report's key. */
  offerings: Record<string, ReportOffering[]>;
  warnings: PlanWarning[];
  /** The organization's totals, as platform worked them out. */
  totals: Totals;
  /** The year's expenses by function, as Form 990 splits them. */
  functions: FunctionalExpenses;
  /** Each program area's schedule, for the year at a glance. */
  timeline: TimelineArea[];
}

const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 });

function Share({ cents, of }: { cents: number; of: number }) {
  return <Count>{of === 0 ? "—" : percent.format(cents / of)}</Count>;
}

/** What's sold outside the programs. Once it carries no G&A, its net reduces G&A, or adds to it, before G&A is spread. */
function NonProgram({ setId, row }: { setId: string; row: OverviewRow }) {
  const net = netOf(row);
  const carriesShares = row.indirect_cents !== 0;
  return (
    <ReportSection id="non-program" title="Non-program">
      <Table aria-label="Non-program">
        <TableHeader>
          <TableRow>
            <TableHead className={pinned}>
              <span className="sr-only">What</span>
            </TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Direct costs</TableHead>
            {carriesShares && <TableHead className="text-right">Indirect costs</TableHead>}
            <TableHead className="text-right">Net</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className={pinned}>
              <Link
                to="/plans/financial/$setId/$planId"
                params={{ setId, planId: row.report }}
                className="text-link underline"
              >
                Sold outside programs
              </Link>
            </TableCell>
            <Amount cents={row.revenue_cents} />
            <Amount cents={row.direct_cents} />
            {carriesShares && <Amount cents={row.indirect_cents} />}
            <Amount cents={net} colored />
          </TableRow>
        </TableBody>
      </Table>
      {!carriesShares && net !== 0 && (
        <p className="text-sm">
          {net > 0 ? "Reduces G&A by " : "Adds "}
          <Money cents={Math.abs(net)} whole />
          {net > 0 ? "." : " to G&A."}
        </p>
      )}
    </ReportSection>
  );
}

/**
 * A Financial Plan's year: the engine's warnings, all shown, then each program area from revenue to net, sortable,
 * Non-program on its own, the year's expenses by function and its total, then each program's fees and enrollment, both
 * by program or by session, as the switch at the top says, and the schedule's weeks across every area, closed at
 * first. Fees and enrollment list program areas A to Z.
 */
export function OverviewReport({ setId, rows, offerings, warnings, totals, functions, timeline }: OverviewReportProps) {
  const [sort, setSort] = useState<Sort>(defaultSort);
  const [by, setBy] = useState<EnrollmentBy>("session");
  const nonProgram = rows.find((r) => r.report === "non-program");
  const areaRows = rows.filter((r) => r.report !== "non-program");
  const sorted = sortRows(areaRows, sort);
  const areas = [...areaRows]
    .filter((r) => r.offerings > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((row) => ({ row, offerings: offerings[row.report] ?? [] }));
  const total = totalOf(areaRows);
  const every = areas.flatMap((a) => a.offerings);
  const all = enrollment(every, "program");
  const allTotal: EnrollmentRow = {
    name: "All programs",
    offerings: all.reduce((t, r) => t + r.offerings, 0),
    sailors: all.reduce((t, r) => t + r.sailors, 0),
    max: all.reduce((t, r) => t + r.max, 0),
    sailor_days: all.reduce((t, r) => t + r.sailor_days, 0),
  };
  const allFees = feeOf("All programs", every);
  const expenses = functions.program_cents + functions.management_cents + functions.fundraising_cents;
  const group = by === "session" ? "Season" : "Program";
  return (
    <>
      <div className="flex justify-end">
        <SegmentedControl
          label="Group fees and enrollment"
          value={by}
          onChange={setBy}
          options={[
            { value: "session", label: "By season" },
            { value: "program", label: "By program" },
          ]}
        />
      </div>

      <WarningsSection
        warnings={warnings}
        setId={setId}
        areas={Object.fromEntries(rows.map((r) => [r.report, r.name]))}
      />

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
              <SortHead sortKey="gross_cents" sort={sort} onSort={setSort}>
                Gross
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
                <TableCell className={pinned}>
                  <AreaLink setId={setId} row={row} />
                </TableCell>
                <Amount cents={row.revenue_cents} />
                <Amount cents={row.direct_cents} />
                <Amount cents={grossOf(row)} colored />
                <Amount cents={row.indirect_cents} />
                <Amount cents={netOf(row)} colored />
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell className={pinned}>All program areas</TableCell>
              <Amount cents={total.revenue_cents} />
              <Amount cents={total.direct_cents} />
              <Amount cents={grossOf(total)} colored />
              <Amount cents={total.indirect_cents} />
              <Amount cents={netOf(total)} colored />
            </TableRow>
          </TableFooter>
        </Table>
      </ReportSection>

      {nonProgram && <NonProgram setId={setId} row={nonProgram} />}

      <ReportSection id="year" title="Year">
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <Table aria-label="Expenses by function">
            <TableHeader>
              <TableRow>
                <TableHead className={pinned}>Expenses by function, as on Form 990</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(
                [
                  ["Program services", functions.program_cents],
                  ["Management and general", functions.management_cents],
                  ["Fundraising", functions.fundraising_cents],
                ] as const
              ).map(([name, cents]) => (
                <TableRow key={name}>
                  <TableCell className={pinned}>{name}</TableCell>
                  <Amount cents={cents} />
                  <Share cents={cents} of={expenses} />
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-transparent">
              <TableRow>
                <TableCell className={pinned}>Total expenses</TableCell>
                <Amount cents={expenses} />
                <Share cents={expenses} of={expenses} />
              </TableRow>
            </TableFooter>
          </Table>
          <Table aria-label="Year">
            <TableBody>
              <TableRow>
                <TableCell className={pinned}>Operating net</TableCell>
                <Amount cents={totals.operating_net_cents} colored />
              </TableRow>
              <TableRow>
                <TableCell className={pinned}>
                  <Link
                    to="/plans/financial/$setId/$planId"
                    params={{ setId, planId: "fundraising" }}
                    className="text-link underline"
                  >
                    Fundraising net
                  </Link>
                </TableCell>
                <Amount cents={totals.fundraising_net_cents} colored />
              </TableRow>
              <TableRow>
                <TableCell className={pinned}>
                  <Link
                    to="/plans/financial/$setId/$planId"
                    params={{ setId, planId: "fundraising" }}
                    hash="capital"
                    className="text-link underline"
                  >
                    Capital
                  </Link>
                </TableCell>
                {/* Taken away, so the column adds up to the total. */}
                <Amount cents={-totals.capital_cents} colored />
              </TableRow>
            </TableBody>
            <TableFooter className="bg-transparent">
              <TableRow>
                <TableCell className={pinned}>Total</TableCell>
                <Amount cents={totals.total_cents} colored />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </ReportSection>

      <ReportSection id="program-fees" title="Program fees">
        <Table aria-label="Program fees">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>{group}</TableHead>
              <TableHead className="text-right">Per offering</TableHead>
              <TableHead className="text-right">Per day</TableHead>
              <TableHead className="text-right">Per hour</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.map(({ row, offerings: own }) => (
              <Fragment key={row.report}>
                <AreaRow setId={setId} row={row} span={3} />
                {fees(own, by).map((fee) => (
                  <FeeRow key={fee.name} fee={fee} className="pl-6" />
                ))}
              </Fragment>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <FeeRow fee={allFees} />
          </TableFooter>
        </Table>
      </ReportSection>

      <ReportSection id="enrollment" title="Enrollment">
        <Table aria-label="Enrollment">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>{group}</TableHead>
              <TableHead className="text-right">Offerings</TableHead>
              <TableHead className="text-right">Sailors</TableHead>
              <TableHead className="text-right">Max</TableHead>
              <TableHead className="text-right">Sailor-days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.map(({ row, offerings: own }) => (
              <Fragment key={row.report}>
                <AreaRow setId={setId} row={row} span={4} />
                {enrollment(own, by).map((e) => (
                  <TableRow key={e.name}>
                    <TableCell className={cn(pinned, "pl-6")}>{e.name}</TableCell>
                    <EnrollmentCells row={e} />
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell className={pinned}>{allTotal.name}</TableCell>
              <EnrollmentCells row={allTotal} />
            </TableRow>
          </TableFooter>
        </Table>
      </ReportSection>

      {timeline.some((a) => a.blocks.length > 0) && (
        <CollapsibleSection title="Schedule">
          <YearTimeline setId={setId} areas={timeline.filter((a) => a.blocks.length > 0)} />
        </CollapsibleSection>
      )}
    </>
  );
}
