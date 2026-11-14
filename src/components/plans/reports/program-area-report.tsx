import { TriangleAlertIcon } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { formatShare, type FixedCost, type StaffTime } from "@/model/assumptions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ScheduleBlock } from "@/model/schedule";
import {
  hasTerms,
  numberedOfferings,
  offeringGroups,
  type Grouping,
  type AccountAmount,
  type PlanWarning,
  type ProgramSettings,
  type ReportOffering,
  type BudgetRow,
  type TermRow,
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
import { PlanCalendar } from "./plan-calendar";
import { SegmentedControl } from "./segmented-control";
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
/** Each term's or program's revenue, expenses, and net. */
function Budget({ rows, by }: { rows: BudgetRow[]; by: Grouping }) {
  return (
    <Table aria-label="Budget">
      <TableHeader>
        <TableRow>
          <TableHead className={pinned}>{by === "term" ? "Term" : "Program"}</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Expenses</TableHead>
          <TableHead className="text-right">Net</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.name}>
            <TableCell className={pinned}>{row.name}</TableCell>
            <Amount cents={row.revenue_cents} whole />
            <Amount cents={row.expense_cents} whole />
            <Amount cents={row.revenue_cents - row.expense_cents} whole />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const feeHead: Column[] = [{ name: "Fee" }, { name: "Per day" }, { name: "Per hour" }, { name: "COGS" }];

/** Offerings under their program's or term's name, each with its name first and then `cells`. */
function OfferingTable({
  label,
  head,
  groups,
  cells,
}: {
  label: string;
  head: Column[];
  groups: ReturnType<typeof offeringGroups>;
  cells: (o: ReportOffering) => ReactNode;
}) {
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
        {groups.map(({ name, offerings: own }) => (
          <Fragment key={name}>
            <TableRow className="hover:bg-transparent">
              <TableCell className={cn(pinned, "pt-4 font-medium")}>{name}</TableCell>
              <TableCell colSpan={head.length} />
            </TableRow>
            {own.map((o) => (
              <TableRow key={o.key}>
                <TableCell className={cn(pinned, "pl-6")}>
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
      </TableBody>
    </Table>
  );
}

export interface ProgramAreaReportProps {
  /** The program area's name, such as Summer. */
  area: string;
  /** The area's own rules, for what spans its programs. */
  rules: string | null;
  warnings: PlanWarning[];
  statement: { revenue: AccountAmount[]; direct: AccountAmount[]; indirect: AccountAmount[] };
  /** Its P&L for each term, empty when none of its offerings is in a term, and for each program. */
  budget: { term: TermRow[]; program: BudgetRow[] };
  programs: ProgramSettings[];
  offerings: ReportOffering[];
  /** This area's report key. */
  areaKey: string;
  /** Its activity blocks, for its calendar, and the days CSC is closed. */
  schedule: ScheduleBlock[];
  closedDays: { date: string; name: string }[];
  /** The calendar's day, and how Enrollment and Fees group their rows. Kept by the report when not given. */
  day?: string | null;
  onDayChange?: (day: string) => void;
  by?: Grouping;
  onByChange?: (by: Grouping) => void;
  trips: Trip[];
  /** The area plan's own fixed costs and staff time outside its programs. */
  fixedCosts: FixedCost[];
  staffTime: StaffTime[];
}

/**
 * One program area: its warnings and its assumptions, both closed at first, its calendar, its revenue and expenses by
 * account, then each offering's enrollment and fees, grouped by term or by program.
 */
export function ProgramAreaReport({
  area,
  rules,
  warnings,
  statement,
  budget,
  programs,
  offerings,
  areaKey,
  schedule,
  closedDays,
  day,
  onDayChange,
  by,
  onByChange,
  trips,
  fixedCosts,
  staffTime,
}: ProgramAreaReportProps) {
  const [ownDay, setOwnDay] = useState<string | null>(null);
  const terms = hasTerms(offerings) && budget.term.length > 0;
  const [ownBy, setOwnBy] = useState<Grouping>("term");
  const grouping = terms ? (by ?? ownBy) : "program";
  const groups = offeringGroups(offerings, grouping);
  const labels = new Map(numberedOfferings(offerings).flatMap((g) => g.offerings.map((o) => [o.key, o.label])));
  const toggle = terms && (
    <SegmentedControl
      label="Group by"
      value={grouping}
      options={[
        { value: "term", label: "By term" },
        { value: "program", label: "By program" },
      ]}
      onChange={onByChange ?? setOwnBy}
    />
  );
  return (
    <>
      <div className="grid gap-2">
        <WarningsSection warnings={warnings} />
        <AreaAssumptions area={area} rules={rules} programs={programs} fixedCosts={fixedCosts} staffTime={staffTime} />
      </div>

      <ReportSection id="calendar" title="Calendar">
        <PlanCalendar
          areas={[{ key: areaKey, name: area, blocks: schedule, offerings }]}
          closedDays={closedDays}
          area={null}
          day={day === undefined ? ownDay : day}
          onAreaChange={() => {}}
          onDayChange={onDayChange ?? setOwnDay}
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

      <ReportSection id="budget" title="Budget" actions={toggle}>
        <Budget
          by={grouping}
          rows={grouping === "term" ? budget.term.map((t) => ({ ...t, name: t.term ?? "No term" })) : budget.program}
        />
      </ReportSection>

      <ReportSection id="enrollment" title="Enrollment">
        <OfferingTable
          label="Enrollment"
          head={enrollmentHead}
          groups={groups}
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
        />
      </ReportSection>

      <ReportSection id="fees" title="Fees">
        <OfferingTable
          label="Fees"
          head={feeHead}
          groups={groups}
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
