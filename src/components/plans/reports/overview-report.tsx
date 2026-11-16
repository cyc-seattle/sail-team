import { Link } from "@tanstack/react-router";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { InlineMarkdown } from "@/components/inline-markdown";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  budget,
  defaultSort,
  enrollment,
  grossOf,
  feeOf,
  fees,
  moneyOf,
  netOf,
  nextSort,
  notesOf,
  sortRows,
  totalOf,
  type EnrollmentRow,
  type Fee,
  type FunctionalExpenses,
  type InAndOut,
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
import { NotesList } from "./notes-list";
import { ReportSection } from "./report-page";
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

function InOut({ money }: { money: InAndOut }) {
  return (
    <>
      <Amount cents={money.revenue_cents} />
      <Amount cents={money.expense_cents} />
      <Amount cents={money.revenue_cents - money.expense_cents} />
    </>
  );
}

/** A program area's total, as Revenue and expenses has it. */
const areaMoney = (row: OverviewRow): InAndOut => ({
  revenue_cents: row.revenue_cents,
  expense_cents: row.direct_cents + row.indirect_cents,
});

/**
 * Each program area's revenue and expenses, with its programs' under it, as a program area's report has them, and
 * what's charged to the area itself rather than to its programs.
 */
function Budget({ setId, areas, total }: { setId: string; areas: AreaOfferings[]; total: InAndOut }) {
  return (
    <Table aria-label="Budget">
      <TableHeader>
        <TableRow>
          <TableHead className={pinned}>Program</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Expenses</TableHead>
          <TableHead className="text-right">Net</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {areas.map(({ row, offerings: own }) => {
          const area = areaMoney(row);
          const programs = moneyOf(own);
          const charged = {
            revenue_cents: area.revenue_cents - programs.revenue_cents,
            expense_cents: area.expense_cents - programs.expense_cents,
          };
          return (
            <Fragment key={row.report}>
              <TableRow className="font-medium hover:bg-transparent">
                <TableCell className={cn(pinned, "pt-4")}>
                  <AreaLink setId={setId} row={row} />
                </TableCell>
                <InOut money={area} />
              </TableRow>
              {budget(own).map((p) => (
                <TableRow key={p.name}>
                  <TableCell className={cn(pinned, "pl-6")}>{p.name}</TableCell>
                  <InOut money={p} />
                </TableRow>
              ))}
              {(charged.revenue_cents !== 0 || charged.expense_cents !== 0) && (
                <TableRow>
                  <TableCell className={cn(pinned, "pl-6")}>Charged to the area</TableCell>
                  <InOut money={charged} />
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
      <TableFooter className="bg-transparent">
        <TableRow>
          <TableCell className={pinned}>All program areas</TableCell>
          <InOut money={total} />
        </TableRow>
      </TableFooter>
    </Table>
  );
}

interface AreaOfferings {
  row: OverviewRow;
  offerings: ReportOffering[];
}

export interface OverviewReportProps {
  setId: string;
  /** The Financial Plan's own note, in inline Markdown. */
  note: string | null;
  /** The Operations Plan's notes, which every program follows. */
  notes: string[] | null;
  rows: OverviewRow[];
  /** Each program area's offerings with their results, by its report's key. */
  offerings: Record<string, ReportOffering[]>;
  warnings: PlanWarning[];
  /** The organization's totals, as platform worked them out. */
  totals: Totals;
  /** The year's expenses by function, as Form 990 splits them. */
  functions: FunctionalExpenses;
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

/** The Financial Plan's note, then the notes every program follows, closed at first. Nothing when there are none. */
function Notes({ note, notes }: { note: string | null; notes: string[] | null }) {
  if (!note?.trim() && notesOf(notes).length === 0) {
    return null;
  }
  return (
    <CollapsibleSection title="Notes">
      <div className="grid max-w-3xl gap-3 text-sm">
        {note?.trim() && (
          <p>
            <InlineMarkdown text={note} />
          </p>
        )}
        {notesOf(notes).length > 0 && <NotesList notes={notes} label="Notes" />}
      </div>
    </CollapsibleSection>
  );
}

/**
 * A Financial Plan's year: its notes and the engine's warnings, both closed at first, then each program area from
 * revenue to net, sortable, then each program's budget, Non-program on its own, the year's expenses by function and its
 * total, then each program's enrollment and fees, in the order a program area's report shows them. Budget, enrollment
 * and fees list program areas A to Z.
 */
export function OverviewReport({
  setId,
  note,
  notes,
  rows,
  offerings,
  warnings,
  totals,
  functions,
}: OverviewReportProps) {
  const [sort, setSort] = useState<Sort>(defaultSort);
  const nonProgram = rows.find((r) => r.report === "non-program");
  const areaRows = rows.filter((r) => r.report !== "non-program");
  const sorted = sortRows(areaRows, sort);
  const everyArea: AreaOfferings[] = [...areaRows]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((row) => ({ row, offerings: offerings[row.report] ?? [] }));
  const areas = everyArea.filter((a) => a.row.offerings > 0);
  const total = totalOf(areaRows);
  const every = areas.flatMap((a) => a.offerings);
  const all = enrollment(every);
  const allTotal: EnrollmentRow = {
    name: "All programs",
    offerings: all.reduce((t, r) => t + r.offerings, 0),
    sailors: all.reduce((t, r) => t + r.sailors, 0),
    max: all.reduce((t, r) => t + r.max, 0),
    sailor_days: all.reduce((t, r) => t + r.sailor_days, 0),
  };
  const allFees = feeOf("All programs", every);
  const expenses = functions.program_cents + functions.management_cents + functions.fundraising_cents;
  return (
    <>
      <div className="grid gap-2">
        <Notes note={note} notes={notes} />
        <WarningsSection
          warnings={warnings}
          setId={setId}
          areas={Object.fromEntries(rows.map((r) => [r.report, r.name]))}
        />
      </div>

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

      <ReportSection id="budget" title="Budget">
        <Budget setId={setId} areas={everyArea} total={areaMoney(total)} />
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
                    params={{ setId, planId: "non-program" }}
                    hash="fundraising"
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
                    params={{ setId, planId: "non-program" }}
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

      <ReportSection id="enrollment" title="Enrollment">
        <Table aria-label="Enrollment">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>Program</TableHead>
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
                {enrollment(own).map((e) => (
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

      <ReportSection id="fees" title="Fees">
        <Table aria-label="Fees">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>Program</TableHead>
              <TableHead className="text-right">Per offering</TableHead>
              <TableHead className="text-right">Per day</TableHead>
              <TableHead className="text-right">Per hour</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.map(({ row, offerings: own }) => (
              <Fragment key={row.report}>
                <AreaRow setId={setId} row={row} span={3} />
                {fees(own).map((fee) => (
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
    </>
  );
}
