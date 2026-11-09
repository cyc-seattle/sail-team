import { ChevronRightIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  numberedOfferings,
  type AccountAmount,
  type PlanWarning,
  type ProgramSettings,
  type ReportOffering,
} from "@/model/reports";
import { cn } from "@/lib/utils";
import { Money } from "../money";
import { OfferingName } from "./offering-name";
import { ReportSection } from "./report-page";
import { RulesList } from "./rules-list";
import { SessionGrid } from "./session-grid";
import { StatementTable } from "./statement-table";
import { WarningsTable } from "./warnings-table";

const pinned = "sticky left-0 z-10 bg-background";
const count = (n: number) => n.toLocaleString("en-US");

function Num({ children }: { children: ReactNode }) {
  return <TableCell className="text-right tabular-nums">{children}</TableCell>;
}

function Amount({ cents, whole = false }: { cents: number; whole?: boolean }) {
  return (
    <TableCell className="text-right">
      <Money cents={cents} whole={whole} />
    </TableCell>
  );
}

/**
 * The area's rules, then each program's settings and rules, closed until someone opens them. The planning agent reads
 * the rules; the engine checks only the settings.
 */
function SettingsAndRules({
  area,
  rules,
  programs,
}: {
  area: string;
  rules: string | null;
  programs: ProgramSettings[];
}) {
  return (
    <details className="group">
      <summary className="flex min-h-tap cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon aria-hidden className="size-4 transition-transform group-open:rotate-90" />
        <h2 className="text-lg font-medium">Settings and rules</h2>
      </summary>
      <div className="mt-3 grid max-w-3xl gap-6">
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
              <dd>{p.staff_level}</dd>
              <dt className="text-muted-foreground">Sailors per coach</dt>
              <dd className="tabular-nums">{p.sailors_per_coach}</dd>
            </dl>
            <RulesList rules={p.rules} label={`${p.name} rules`} />
          </section>
        ))}
      </div>
    </details>
  );
}

const offeringHead = ["Fee", "Fee per day", "Sailors", "Sailor-days", "Fee per hour", "Sailor-hours"];

export interface ProgramAreaReportProps {
  /** The program area's name, such as Summer. */
  area: string;
  /** The area's own rules, for what spans its programs. */
  rules: string | null;
  warnings: PlanWarning[];
  statement: { revenue: AccountAmount[]; direct: AccountAmount[]; indirect: AccountAmount[] };
  programs: ProgramSettings[];
  offerings: ReportOffering[];
}

/**
 * One program area: its settings and rules, closed at first, its warnings by date, its revenue and expenses by account, then its sailors by
 * session and each offering's fee and size, by program and start date, the figures used to compare with other centers.
 */
export function ProgramAreaReport({ area, rules, warnings, statement, programs, offerings }: ProgramAreaReportProps) {
  const groups = numberedOfferings(offerings);
  return (
    <>
      <SettingsAndRules area={area} rules={rules} programs={programs} />

      {warnings.length > 0 && (
        <ReportSection id="warnings" title="Warnings">
          <WarningsTable warnings={warnings} />
        </ReportSection>
      )}

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

      <ReportSection id="sessions" title="Sailors by session">
        <SessionGrid offerings={offerings} />
      </ReportSection>

      <ReportSection id="offerings" title="Offerings">
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
                      <OfferingName offering={o} />
                    </TableCell>
                    <Amount cents={o.fee_cents} whole />
                    <Amount cents={Math.round(o.fee_cents / o.days)} />
                    <Num>{count(o.estimated)}</Num>
                    <Num>{count(o.estimated * o.days)}</Num>
                    <Amount cents={Math.round(o.fee_cents / o.hours)} />
                    <Num>{count(o.estimated * o.hours)}</Num>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </ReportSection>
    </>
  );
}
