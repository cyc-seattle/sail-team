import { Link } from "@tanstack/react-router";
import { TriangleAlertIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { formatShare, type FixedCost, type StaffTime } from "@/model/assumptions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  numberedOfferings,
  type AccountAmount,
  type PlanWarning,
  type ProgramSettings,
  type ReportOffering,
  type Trip,
} from "@/model/reports";
import { cn } from "@/lib/utils";
import { BudgetLines, StaffTimeTable } from "../assumptions";
import { Money } from "../money";
import { NoteInfo } from "../note-info";
import { CollapsibleSection } from "./collapsible-section";
import { OfferingName } from "./offering-name";
import { ReportSection } from "./report-page";
import { RulesList } from "./rules-list";
import { SessionGrid } from "./session-grid";
import { StatementTable } from "./statement-table";
import { WarningsSection } from "./warnings-section";

const pinned = "sticky left-0 z-10 bg-background";
const count = (n: number) => n.toLocaleString("en-US");
const none = <span className="text-muted-foreground">—</span>;

function Num({ children }: { children: ReactNode }) {
  return <TableCell className="text-right tabular-nums">{children}</TableCell>;
}

function Amount({ cents, whole = false }: { cents: number | null; whole?: boolean }) {
  return <TableCell className="text-right">{cents === null ? none : <Money cents={cents} whole={whole} />}</TableCell>;
}

/** A number that needs the planner's eye, such as fewer sailors' room than the offering's max. */
function Flagged({ children, why }: { children: ReactNode; why: string }) {
  return (
    <TableCell className="text-right font-medium text-warning tabular-nums">
      <span className="inline-flex items-center gap-1" title={why}>
        <TriangleAlertIcon aria-hidden className="size-3.5" />
        {children}
        <span className="sr-only">: {why}</span>
      </span>
    </TableCell>
  );
}

/** The most sailors the offering's blocks can take, flagged when that's fewer than its max. */
function Room({ offering: o }: { offering: ReportOffering }) {
  if (o.room == null) return <Num>{none}</Num>;
  if (o.room < o.max)
    return <Flagged why={`Its blocks have room for fewer than its max of ${o.max}`}>{count(o.room)}</Flagged>;
  return <Num>{count(o.room)}</Num>;
}

/** The fewest sailors at which the offering pays for itself, flagged when that's more than the plan expects. */
function Breakeven({ offering: o }: { offering: ReportOffering }) {
  if (!o.max_set) return <Num>{none}</Num>;
  if (o.breakeven == null) return <Flagged why="It loses money even when full">Never</Flagged>;
  if (o.breakeven > o.estimated) {
    return <Flagged why={`More than the ${o.estimated} sailors expected`}>{count(o.breakeven)}</Flagged>;
  }
  return <Num>{count(o.breakeven)}</Num>;
}

/** A fee divided by days or hours, or nothing to show when the offering has none. */
const per = (cents: number, by: number) => (by > 0 ? Math.round(cents / by) : null);
const hoursOf = (n: number) => count(Math.round(n * 10) / 10);

/**
 * The area's rules, then each program's settings and rules, closed until someone opens them. The planning agent reads
 * the rules; the engine checks only the settings.
 */
function AreaAssumptions({
  area,
  rules,
  programs,
  fixedCosts,
  staffTime,
}: {
  area: string;
  rules: string | null;
  programs: ProgramSettings[];
  fixedCosts: FixedCost[];
  staffTime: StaffTime[];
}) {
  return (
    <CollapsibleSection title="Assumptions">
      <div className="grid max-w-3xl gap-6">
        <section aria-labelledby="area-rules" className="grid gap-2">
          <h3 id="area-rules" className="text-sm font-medium">
            {area}
          </h3>
          <RulesList rules={rules} label={`${area} rules`} />
        </section>
        {programs.map((p) => (
          <section key={p.name} aria-label={p.name} className="grid gap-2 border-t pt-4">
            <h3 className="text-sm font-medium">{p.name}</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Staff level</dt>
              <dd>{p.staff_level ?? none}</dd>
              <dt className="text-muted-foreground">Sailors per coach</dt>
              <dd className="tabular-nums">{p.sailors_per_coach ?? none}</dd>
            </dl>
            <RulesList rules={p.rules} label={`${p.name} rules`} />
          </section>
        ))}
        {fixedCosts.length > 0 && (
          <div className="border-t pt-4">
            <div className="grid gap-6">
              <BudgetLines costsTitle="Fixed costs" lines={fixedCosts} level={3} />
            </div>
          </div>
        )}
        {staffTime.length > 0 && (
          <div className="border-t pt-4">
            <StaffTimeTable lines={staffTime} level={3} />
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

const offeringHead = [
  "Fee",
  "Fee per day",
  "Sailors",
  "Max",
  "Room for",
  "Breaks even at",
  "Sailor-days",
  "Fee per hour",
  "Sailor-hours",
  "Cost of goods",
];

export interface ProgramAreaReportProps {
  /** The program area's name, such as Summer. */
  area: string;
  /** The area's own rules, for what spans its programs. */
  rules: string | null;
  warnings: PlanWarning[];
  statement: { revenue: AccountAmount[]; direct: AccountAmount[]; indirect: AccountAmount[] };
  programs: ProgramSettings[];
  offerings: ReportOffering[];
  /** The Financial Plan's id and this area's report key, for its link to the Calendar. */
  setId: string;
  areaKey: string;
  trips: Trip[];
  /** The area plan's own fixed costs and staff time outside its programs. */
  fixedCosts: FixedCost[];
  staffTime: StaffTime[];
}

/**
 * One program area: its warnings and its assumptions, both closed at first, its revenue and expenses by account, then its sailors by
 * session and each offering's fee and size, by program and start date, the figures used to compare with other centers.
 */
export function ProgramAreaReport({
  area,
  rules,
  warnings,
  statement,
  programs,
  offerings,
  setId,
  areaKey,
  trips,
  fixedCosts,
  staffTime,
}: ProgramAreaReportProps) {
  const groups = numberedOfferings(offerings);
  const labels = new Map(groups.flatMap((g) => g.offerings.map((o) => [o.key, o.label])));
  return (
    <>
      <div className="grid gap-2">
        <WarningsSection warnings={warnings} />
        <AreaAssumptions area={area} rules={rules} programs={programs} fixedCosts={fixedCosts} staffTime={staffTime} />
      </div>

      <ReportSection id="revenue-and-expenses" title="Revenue and expenses">
        <StatementTable
          label="Revenue and expenses"
          sections={[
            { title: "Revenue", accounts: statement.revenue },
            { title: "Direct costs", accounts: statement.direct, leaves: "Gross" },
            { title: "Indirect costs", accounts: statement.indirect, leaves: "Net" },
          ]}
        />
      </ReportSection>

      <ReportSection id="enrollment" title="Enrollment">
        <SessionGrid offerings={offerings} />
      </ReportSection>

      <ReportSection
        id="offerings"
        title="Offerings"
        actions={
          <Link
            to="/plans/financial/$setId/$planId"
            params={{ setId, planId: "calendar" }}
            search={{ area: areaKey }}
            className="text-sm text-link underline-offset-4 hover:underline"
          >
            See on the calendar
          </Link>
        }
      >
        <Table aria-label="Offerings">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>Offering</TableHead>
              {offeringHead.map((h) => (
                <TableHead key={h} className="text-right">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map(({ program, offerings: own }) => (
              <Fragment key={program}>
                <TableRow className="hover:bg-transparent">
                  <TableCell className={cn(pinned, "pt-4 font-medium")}>{program}</TableCell>
                  <TableCell colSpan={offeringHead.length} />
                </TableRow>
                {own.map((o) => (
                  <TableRow key={o.key}>
                    <TableCell className={cn(pinned, "pl-6")}>
                      <span className="inline-flex items-center gap-1">
                        <OfferingName offering={o} />
                        <NoteInfo note={o.note} />
                      </span>
                    </TableCell>
                    <Amount cents={o.fee_cents} whole />
                    <Amount cents={per(o.fee_cents, o.days)} />
                    <Num>{count(o.estimated)}</Num>
                    <Num>{count(o.max)}</Num>
                    <Room offering={o} />
                    <Breakeven offering={o} />
                    <Num>{count(o.estimated * o.days)}</Num>
                    <Amount cents={per(o.fee_cents, o.hours)} />
                    <Num>{hoursOf(o.estimated * o.hours)}</Num>
                    <Num>{o.cogs_rate === null ? none : formatShare(o.cogs_rate)}</Num>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </ReportSection>

      {trips.length > 0 && (
        <CollapsibleSection title="Trips">
          <Table aria-label="Trips">
            <TableHeader>
              <TableRow>
                <TableHead className={pinned}>Trip</TableHead>
                <TableHead>Offering</TableHead>
                <TableHead className="text-right">Nights</TableHead>
                <TableHead className="text-right">Airfare per coach</TableHead>
                <TableHead className="text-right">Miles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((t) => (
                <TableRow key={t.key}>
                  <TableCell className={pinned}>{t.name}</TableCell>
                  <TableCell>{labels.get(t.offering_key) ?? none}</TableCell>
                  <Num>{t.nights === null ? none : count(t.nights)}</Num>
                  <Amount cents={t.airfare_cents} whole />
                  <Num>{t.miles === null ? none : count(t.miles)}</Num>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CollapsibleSection>
      )}
    </>
  );
}
