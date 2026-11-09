import { Link } from "@tanstack/react-router";
import { ArrowDownIcon, ArrowUpIcon, TriangleAlertIcon } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  defaultSort,
  enrollment,
  grossOf,
  netOf,
  nextSort,
  programFees,
  sortRows,
  totalOf,
  warningCounts,
  warningLabels,
  type EnrollmentBy,
  type EnrollmentRow,
  type OverviewRow,
  type PlanWarning,
  type ReportOffering,
  type Sort,
  type SortKey,
} from "@/model/reports";
import { cn } from "@/lib/utils";
import { Money } from "../money";
import { ReportSection } from "./report-page";
import { SegmentedControl } from "./segmented-control";

/** The name column stays put while the numbers scroll sideways on a phone. */
const pinned = "sticky left-0 z-10 bg-background";
const pinnedOnCard = "sticky left-0 z-10 bg-card";
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

export interface OverviewReportProps {
  setId: string;
  rows: OverviewRow[];
  /** Each program area's offerings, by its report's key. */
  offerings: Record<string, ReportOffering[]>;
  warnings: PlanWarning[];
}

/** How many warnings each program area has, by kind, each area linking to its page, where they're listed by date. */
function WarningsCard({ setId, rows, warnings }: { setId: string; rows: OverviewRow[]; warnings: PlanWarning[] }) {
  const kinds = Object.keys(warningLabels) as (keyof typeof warningLabels)[];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TriangleAlertIcon aria-hidden className="size-4 text-warning" />
          <h2 id="warnings">{warnings.length === 1 ? "1 warning" : `${warnings.length} warnings`}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table aria-labelledby="warnings">
          <TableHeader>
            <TableRow>
              <TableHead className={pinnedOnCard}>Program area</TableHead>
              {kinds.map((k) => (
                <TableHead key={k} className="text-right">
                  {warningLabels[k]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {warningCounts(warnings).map(({ area, counts }) => {
              const row = rows.find((r) => r.report === area);
              return (
                <TableRow key={area}>
                  <TableCell className={pinnedOnCard}>{row ? <AreaLink setId={setId} row={row} /> : area}</TableCell>
                  {kinds.map((k) => (
                    <Count key={k}>{counts[k] || ""}</Count>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/**
 * A Financial Plan's year by program area: revenue to net, sortable, then the engine's warnings, each program's fees,
 * and enrollment by session or by program. Program areas keep the first table's order all the way down.
 */
export function OverviewReport({ setId, rows, offerings, warnings }: OverviewReportProps) {
  const [sort, setSort] = useState<Sort>(defaultSort);
  const [by, setBy] = useState<EnrollmentBy>("session");
  const sorted = sortRows(rows, sort);
  const areas = sorted.filter((r) => r.offerings > 0).map((row) => ({ row, offerings: offerings[row.report] ?? [] }));
  const total = totalOf(rows);
  const all = enrollment(
    areas.flatMap((a) => a.offerings),
    "program",
  );
  const allTotal: EnrollmentRow = {
    name: "All programs",
    offerings: all.reduce((t, r) => t + r.offerings, 0),
    sailors: all.reduce((t, r) => t + r.sailors, 0),
    max: all.reduce((t, r) => t + r.max, 0),
    sailor_days: all.reduce((t, r) => t + r.sailor_days, 0),
  };
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
              <TableCell className={pinned}>Total</TableCell>
              <Amount cents={total.revenue_cents} />
              <Amount cents={total.direct_cents} />
              <Amount cents={grossOf(total)} colored />
              <Amount cents={total.indirect_cents} />
              <Amount cents={netOf(total)} colored />
            </TableRow>
          </TableFooter>
        </Table>
      </ReportSection>

      {warnings.length > 0 && <WarningsCard setId={setId} rows={rows} warnings={warnings} />}

      <ReportSection id="program-fees" title="Program fees">
        <Table aria-label="Program fees">
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
                {programFees(own).map((fee) => (
                  <TableRow key={fee.program}>
                    <TableCell className={cn(pinned, "pl-6")}>{fee.program}</TableCell>
                    <Amount cents={fee.per_offering_cents} />
                    <Amount cents={fee.per_day_cents} whole={false} />
                    <Amount cents={fee.per_hour_cents} whole={false} />
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </ReportSection>

      <ReportSection
        id="enrollment"
        title="Enrollment"
        actions={
          <SegmentedControl
            label="Group enrollment"
            value={by}
            onChange={setBy}
            options={[
              { value: "session", label: "By session" },
              { value: "program", label: "By program" },
            ]}
          />
        }
      >
        <Table aria-label="Enrollment">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>{by === "session" ? "Session" : "Program"}</TableHead>
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
    </>
  );
}
