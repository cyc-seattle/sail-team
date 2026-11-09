import { ChevronRightIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { numberedOfferings, type AccountAmount, type ProgramSettings, type ReportOffering } from "@/model/reports";
import { cn } from "@/lib/utils";
import { Money } from "../money";
import { OfferingName } from "./offering-name";
import { ReportSection } from "./report-page";
import { SessionGrid } from "./session-grid";
import { StatementTable } from "./statement-table";

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

/** Each program's hard rules, closed until someone opens them. */
function ProgramSettingsTable({ programs }: { programs: ProgramSettings[] }) {
  return (
    <details className="group">
      <summary className="flex min-h-tap cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon aria-hidden className="size-4 transition-transform group-open:rotate-90" />
        <h2 className="text-lg font-medium">Program settings</h2>
      </summary>
      <Table aria-label="Program settings" className="mt-3">
        <TableHeader>
          <TableRow>
            <TableHead className={pinned}>Program</TableHead>
            <TableHead>Staff level</TableHead>
            <TableHead className="text-right">Sailors per coach</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs.map((p) => (
            <TableRow key={p.name}>
              <TableCell className={pinned}>{p.name}</TableCell>
              <TableCell>{p.staff_level}</TableCell>
              <Num>{p.sailors_per_coach}</Num>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </details>
  );
}

const offeringHead = ["Fee", "Fee per day", "Sailors", "Sailor-days", "Fee per hour", "Sailor-hours"];

export interface ProgramAreaReportProps {
  statement: { revenue: AccountAmount[]; direct: AccountAmount[]; indirect: AccountAmount[] };
  programs: ProgramSettings[];
  offerings: ReportOffering[];
}

/**
 * One program area: its programs' settings, closed at first, its revenue and expenses by account, then its sailors by
 * session and each offering's fee and size, by program and start date, the figures used to compare with other centers.
 */
export function ProgramAreaReport({ statement, programs, offerings }: ProgramAreaReportProps) {
  const groups = numberedOfferings(offerings);
  return (
    <>
      <ProgramSettingsTable programs={programs} />

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
