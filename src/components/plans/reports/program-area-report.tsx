import { TriangleAlertIcon } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { formatShare, type FixedCost, type StaffTime } from "@/model/assumptions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ScheduleBlock } from "@/model/schedule";
import {
  byTermAndProgram,
  chargedToArea,
  moneyOf,
  numberedOfferings,
  type InAndOut,
  type AccountAmount,
  type PlanWarning,
  type ProgramSettings,
  type ReportOffering,
  type Trip,
} from "@/model/reports";
import { placeOf } from "@/model/warnings";
import { cn } from "@/lib/utils";
import { BudgetLines, StaffTimeTable } from "../assumptions";
import { Money } from "../money";
import { NoteInfo } from "../note-info";
import { CollapsibleSection } from "./collapsible-section";
import { OfferingName } from "./offering-name";
import { ReportSection } from "./report-page";
import { NotesList } from "./notes-list";
import { WarningMark } from "../warning-mark";
import { PlanCalendar } from "./plan-calendar";
import { StatementTable } from "./statement-table";

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

/** Its capacity: the most sailors its blocks can take, flagged when that's fewer than its max. */
function Room({ offering: o }: { offering: ReportOffering }) {
  if (o.room == null) return <Num>{none}</Num>;
  if (o.room < o.max) return <Flagged why={`Fewer than its max of ${o.max}`}>{count(o.room)}</Flagged>;
  return <Num>{count(o.room)}</Num>;
}

/** The fewest sailors at which the offering pays for itself, flagged when that's more than its target. */
function Breakeven({ offering: o }: { offering: ReportOffering }) {
  if (!o.max_set) return <Num>{none}</Num>;
  if (o.breakeven == null) return <Flagged why="It loses money even when full">Never</Flagged>;
  if (o.breakeven > o.estimated) {
    return <Flagged why={`More than its target of ${o.estimated}`}>{count(o.breakeven)}</Flagged>;
  }
  return <Num>{count(o.breakeven)}</Num>;
}

/** A fee divided by days or hours, or nothing to show when the offering has none. */
const per = (cents: number, by: number) => (by > 0 ? Math.round(cents / by) : null);
const hoursOf = (n: number) => count(Math.round(n * 10) / 10);

/**
 * The area's notes, then each program's settings and notes, closed until someone opens them. The planning agent reads
 * the notes; the engine checks only the settings.
 */
function AreaAssumptions({
  area,
  notes,
  programs,
  fixedCosts,
  staffTime,
  warnings,
}: {
  area: string;
  notes: string[] | null;
  warnings: PlanWarning[];
  programs: ProgramSettings[];
  fixedCosts: FixedCost[];
  staffTime: StaffTime[];
}) {
  return (
    <CollapsibleSection title="Assumptions">
      <div className="grid max-w-3xl gap-6">
        <section aria-labelledby="area-notes" className="grid gap-2">
          <h3 id="area-notes" className="text-sm font-medium">
            {area}
          </h3>
          <NotesList notes={notes} label={`${area} notes`} />
        </section>
        {programs.map((p) => (
          <section key={p.name} aria-label={p.name} className="grid gap-2 border-t pt-4">
            <h3 className="flex items-center gap-1 text-sm font-medium">
              {p.name}
              <WarningMark warnings={programWarnings(warnings, p.program_id)} />
            </h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Staff level</dt>
              <dd>{p.staff_level ?? none}</dd>
              <dt className="text-muted-foreground">Sailors per coach</dt>
              <dd className="tabular-nums">{p.sailors_per_coach ?? none}</dd>
              <dt className="text-muted-foreground">Indirect cost rate</dt>
              <dd className="tabular-nums">
                {p.indirect_cost_rate == null ? none : formatShare(p.indirect_cost_rate)}
              </dd>
            </dl>
            <NotesList notes={p.notes} label={`${p.name} notes`} />
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

/** The warnings shown on a program: about its settings or its product. */
const programWarnings = (warnings: PlanWarning[], programId: string | null | undefined) =>
  programId ? warnings.filter((w) => placeOf(w) === "program" && w.subject === programId) : [];

/** A column of an offerings table, with what it means when that isn't plain from its name. */
interface Column {
  name: string;
  help?: string;
}

const enrollmentHead: Column[] = [
  { name: "Break even" },
  { name: "Max", help: "The most sailors planned for this offering" },
  { name: "Capacity", help: "The most sailors the coaches and boats given to its blocks can take" },
  { name: "Target" },
  { name: "Sailor-days" },
  { name: "Sailor-hours" },
];
const feeHead: Column[] = [{ name: "Fee" }, { name: "Per day" }, { name: "Per hour" }, { name: "COGS" }];
const budgetHead: Column[] = [{ name: "Revenue" }, { name: "Expenses" }, { name: "Net" }];

/**
 * Offerings by term, then by program, each with its name first and then `cells`. Given `sums`, each term's and
 * program's row shows its subtotals; `footer` adds rows at the end, such as a total. The term rows are left out when
 * no offering is in a term.
 */
function GroupedTable({
  label,
  head,
  offerings,
  cells,
  sums,
  footer,
  warnings = [],
}: {
  label: string;
  warnings?: PlanWarning[];
  head: Column[];
  offerings: ReportOffering[];
  cells: (o: ReportOffering) => ReactNode;
  sums?: (offerings: ReportOffering[]) => ReactNode;
  footer?: ReactNode;
}) {
  const terms = byTermAndProgram(offerings);
  const showTerms = terms.some((t) => t.term !== null);
  const subtotals = (own: ReportOffering[]) => (sums ? sums(own) : <TableCell colSpan={head.length} />);
  return (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead className={pinned}>Offering</TableHead>
          {head.map((h) => (
            <TableHead key={h.name} className="text-right">
              <span className="inline-flex items-center gap-0.5">
                {h.name}
                <NoteInfo note={h.help} label={`What ${h.name} means`} />
              </span>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {terms.map(({ term, programs: own }) => (
          <Fragment key={term ?? ""}>
            {showTerms && (
              <TableRow className="font-semibold hover:bg-transparent">
                <TableCell className={cn(pinned, "pt-4")}>{term ?? "No term"}</TableCell>
                {subtotals(own.flatMap((p) => p.offerings))}
              </TableRow>
            )}
            {own.map(({ program, offerings: listed }) => (
              <Fragment key={program}>
                <TableRow className="font-medium hover:bg-transparent">
                  <TableCell className={cn(pinned, showTerms ? "pl-5" : "pt-4")}>
                    <span className="inline-flex items-center gap-1">
                      {program}
                      <WarningMark warnings={programWarnings(warnings, listed[0]?.program_id)} />
                    </span>
                  </TableCell>
                  {subtotals(listed)}
                </TableRow>
                {listed.map((o) => (
                  <TableRow key={o.key}>
                    <TableCell className={cn(pinned, showTerms ? "pl-10" : "pl-6")}>
                      <span className="inline-flex items-center gap-1">
                        <OfferingName offering={o} />
                        <NoteInfo note={o.note} />
                      </span>
                    </TableCell>
                    {cells(o)}
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </Fragment>
        ))}
        {footer}
      </TableBody>
    </Table>
  );
}

/** Revenue, expenses and net. */
function InOut({ money }: { money: InAndOut }) {
  return (
    <>
      <Amount cents={money.revenue_cents} whole />
      <Amount cents={money.expense_cents} whole />
      <Amount cents={money.revenue_cents - money.expense_cents} whole />
    </>
  );
}

/** Max, capacity, target, sailor-days and sailor-hours added up; capacity only over the offerings that have one. */
function EnrollmentSums({ offerings }: { offerings: ReportOffering[] }) {
  const rooms = offerings.flatMap((o) => (o.room == null ? [] : [o.room]));
  return (
    <>
      <TableCell />
      <Num>{count(offerings.reduce((t, o) => t + o.max, 0))}</Num>
      <Num>{rooms.length === 0 ? none : count(rooms.reduce((t, n) => t + n, 0))}</Num>
      <Num>{count(offerings.reduce((t, o) => t + o.estimated, 0))}</Num>
      <Num>{count(offerings.reduce((t, o) => t + o.estimated * o.days, 0))}</Num>
      <Num>{hoursOf(offerings.reduce((t, o) => t + o.estimated * o.hours, 0))}</Num>
    </>
  );
}

const totalRow = "border-t-2 font-semibold hover:bg-transparent";

export interface ProgramAreaReportProps {
  /** The program area's name, such as Summer. */
  area: string;
  /** The area's own notes, for what spans its programs. */
  notes: string[] | null;
  warnings: PlanWarning[];
  statement: { revenue: AccountAmount[]; direct: AccountAmount[]; indirect: AccountAmount[] };
  /** Its total revenue and expenses, which its offerings' and what's charged to the area itself add up to. */
  total: InAndOut | null;
  programs: ProgramSettings[];
  offerings: ReportOffering[];
  /** This area's report key. */
  areaKey: string;
  /** Its activity blocks, for its calendar, and the days CSC is closed. */
  schedule: ScheduleBlock[];
  closedDays: { date: string; name: string }[];
  /** The calendar's day. Kept by the report when not given. */
  day?: string | null;
  onDayChange?: (day: string) => void;
  trips: Trip[];
  /** The area plan's own fixed costs and staff time outside its programs. */
  fixedCosts: FixedCost[];
  staffTime: StaffTime[];
}

/**
 * One program area: its warnings and its assumptions, both closed at first, its calendar, its revenue and expenses by
 * account, then its budget, enrollment and fees, each by term, then program, then offering.
 */
export function ProgramAreaReport({
  area,
  notes,
  warnings,
  statement,
  total,
  programs,
  offerings,
  areaKey,
  schedule,
  closedDays,
  day,
  onDayChange,
  trips,
  fixedCosts,
  staffTime,
}: ProgramAreaReportProps) {
  const [ownDay, setOwnDay] = useState<string | null>(null);
  const labels = new Map(numberedOfferings(offerings).flatMap((g) => g.offerings.map((o) => [o.key, o.label])));
  const charged = chargedToArea(offerings, total);
  return (
    <>
      <div className="grid gap-2">
        <AreaAssumptions
          area={area}
          notes={notes}
          programs={programs}
          fixedCosts={fixedCosts}
          staffTime={staffTime}
          warnings={warnings}
        />
      </div>

      <ReportSection id="calendar" title="Calendar">
        <PlanCalendar
          areas={[{ key: areaKey, name: area, blocks: schedule, offerings }]}
          closedDays={closedDays}
          area={null}
          day={day === undefined ? ownDay : day}
          onAreaChange={() => {}}
          onDayChange={onDayChange ?? setOwnDay}
          warnings={warnings}
        />
      </ReportSection>

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

      <ReportSection id="budget" title="Budget">
        <GroupedTable
          label="Budget"
          warnings={warnings}
          head={budgetHead}
          offerings={offerings}
          cells={(o) => <InOut money={moneyOf([o])} />}
          sums={(own) => <InOut money={moneyOf(own)} />}
          footer={
            <>
              {charged && (
                <TableRow className="border-t-2 hover:bg-transparent">
                  <TableCell className={pinned}>Charged to the area</TableCell>
                  <InOut money={charged} />
                </TableRow>
              )}
              <TableRow className={totalRow}>
                <TableCell className={pinned}>Total</TableCell>
                <InOut money={total ?? moneyOf(offerings)} />
              </TableRow>
            </>
          }
        />
      </ReportSection>

      <ReportSection id="enrollment" title="Enrollment">
        <GroupedTable
          label="Enrollment"
          head={enrollmentHead}
          offerings={offerings}
          cells={(o) => (
            <>
              <Breakeven offering={o} />
              <Num>{count(o.max)}</Num>
              <Room offering={o} />
              <Num>{count(o.estimated)}</Num>
              <Num>{count(o.estimated * o.days)}</Num>
              <Num>{hoursOf(o.estimated * o.hours)}</Num>
            </>
          )}
          sums={(own) => <EnrollmentSums offerings={own} />}
          footer={
            <TableRow className={totalRow}>
              <TableCell className={pinned}>Total</TableCell>
              <EnrollmentSums offerings={offerings} />
            </TableRow>
          }
        />
      </ReportSection>

      <ReportSection id="fees" title="Fees">
        <GroupedTable
          label="Fees"
          head={feeHead}
          offerings={offerings}
          cells={(o) => (
            <>
              <Amount cents={o.fee_cents} whole />
              <Amount cents={per(o.fee_cents, o.days)} />
              <Amount cents={per(o.fee_cents, o.hours)} />
              <Num>{o.cogs_rate === null ? none : formatShare(o.cogs_rate)}</Num>
            </>
          )}
        />
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
