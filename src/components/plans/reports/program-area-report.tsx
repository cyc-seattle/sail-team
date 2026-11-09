import { Fragment, type ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatShare } from "@/model/assumptions";
import {
  netOf,
  numberedOfferings,
  type AccountAmount,
  type NumberedOffering,
  type ProgramSettings,
  type ReportOffering,
} from "@/model/reports";
import { cn } from "@/lib/utils";
import { Money } from "../money";
import { EnrollmentChart } from "./enrollment-chart";
import { OfferingName } from "./offering-name";
import { ReportSection } from "./report-page";
import { StatementTable } from "./statement-table";

const pinned = "sticky left-0 z-10 bg-background";

function Num({ children }: { children: ReactNode }) {
  return <TableCell className="text-right tabular-nums">{children}</TableCell>;
}

/** A table of offerings under a row for each program, the offering's number pinned while the rest scrolls. */
function OfferingsTable({
  label,
  head,
  groups,
  cells,
}: {
  label: string;
  head: string[];
  groups: { program: string; offerings: NumberedOffering[] }[];
  cells: (o: NumberedOffering) => ReactNode;
}) {
  return (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead className={pinned}>Offering</TableHead>
          {head.map((h) => (
            <TableHead key={h} className="text-right">
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map(({ program, offerings }) => (
          <Fragment key={program}>
            <TableRow className="hover:bg-transparent">
              <TableCell className={cn(pinned, "pt-4 font-medium")}>{program}</TableCell>
              <TableCell colSpan={head.length} />
            </TableRow>
            {offerings.map((o) => (
              <TableRow key={o.key}>
                <TableCell className={cn(pinned, "pl-6")}>
                  <OfferingName offering={o} />
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
  statement: { revenue: AccountAmount[]; direct: AccountAmount[]; indirect: AccountAmount[] };
  programs: ProgramSettings[];
  offerings: ReportOffering[];
}

/**
 * One program area: its revenue and expenses by account, how each of its programs is coached, and its offerings, by
 * program and start date, with their sailors and their money in separate tables.
 */
export function ProgramAreaReport({ statement, programs, offerings }: ProgramAreaReportProps) {
  const groups = numberedOfferings(offerings);
  const amount = (cents: number, colored = false) => (
    <TableCell className="text-right">
      <Money cents={cents} colored={colored} whole />
    </TableCell>
  );
  return (
    <>
      <ReportSection id="revenue-and-expenses" title="Revenue and expenses">
        <StatementTable
          label="Revenue and expenses"
          sections={[
            { title: "Revenue", accounts: statement.revenue },
            { title: "Direct costs", accounts: statement.direct, leaves: "Contribution" },
            { title: "Indirect costs", accounts: statement.indirect, leaves: "Net" },
          ]}
        />
      </ReportSection>

      <ReportSection id="programs" title="Programs">
        <Table aria-label="Programs">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>Program</TableHead>
              <TableHead>Coach pay level</TableHead>
              <TableHead className="text-right">Sailors per coach</TableHead>
              <TableHead className="text-right">RIBs per coach</TableHead>
              <TableHead className="text-right">Bring their own boat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((p) => (
              <TableRow key={p.name}>
                <TableCell className={pinned}>{p.name}</TableCell>
                <TableCell>{p.coach_level}</TableCell>
                <Num>{p.sailors_per_coach}</Num>
                <Num>{p.ribs_per_coach}</Num>
                <Num>{formatShare(p.byob_share)}</Num>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportSection>

      <ReportSection id="offerings" title="Offerings">
        <div className="grid gap-8">
          <EnrollmentChart offerings={groups.flatMap((g) => g.offerings)} />
          <OfferingsTable
            label="Sailors and days"
            head={["Target sailors", "Max sailors", "Days", "Sailor-days"]}
            groups={groups}
            cells={(o) => (
              <>
                <Num>{o.target}</Num>
                <Num>{o.max}</Num>
                <Num>{o.days}</Num>
                <Num>{(o.target * o.days).toLocaleString("en-US")}</Num>
              </>
            )}
          />
          <OfferingsTable
            label="Offering revenue and expenses"
            head={["Price", "Revenue", "Direct costs", "Indirect costs", "Net"]}
            groups={groups}
            cells={(o) => (
              <>
                {amount(o.price_cents)}
                {amount(o.revenue_cents)}
                {amount(o.direct_cents)}
                {amount(o.indirect_cents)}
                {amount(netOf(o), true)}
              </>
            )}
          />
        </div>
      </ReportSection>
    </>
  );
}
