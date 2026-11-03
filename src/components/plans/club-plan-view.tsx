import type { EngineWarning } from "@cyc-seattle/platform/planning";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ClubMember, ClubTotals } from "@/directus/club-plans";
import { signedCents, type ClubLine } from "@/model/club-plans";
import { formatDate } from "@/model/dates";
import { savedPnl, type SavedPnlRow } from "@/model/saved-results";
import { EngineWarnings } from "./engine-warnings";
import { Money } from "./money";
import { PnlTable } from "./pnl-table";
import { SummaryTiles } from "./summary-tiles";

export interface ClubPlanViewProps {
  savedAt: string | null;
  totals: ClubTotals | null;
  members: ClubMember[];
  pnl: (SavedPnlRow & { version_set_member_id: string | null })[];
  lines: (ClubLine & { version_set_member_id: string | null })[];
  warnings: EngineWarning[];
}

/** A club plan: the club's totals, what to check, then each program area's P&L and the Operations Plan's lines. */
export function ClubPlanView({ savedAt, totals, members, pnl, lines, warnings }: ClubPlanViewProps) {
  const areas = members
    .filter((m) => m.kind === "program_area")
    .sort((a, b) => (a.area_name ?? a.plan_name).localeCompare(b.area_name ?? b.plan_name));
  const operations = members.find((m) => m.kind === "operations");
  const operationsLines = lines.filter((l) => operations && l.version_set_member_id === operations.id);
  return (
    <div className="grid gap-card">
      <Alert>
        <AlertDescription>
          These are the numbers the club plan was saved with, on {formatDate(savedAt)}. They never change.
        </AlertDescription>
      </Alert>
      {totals && (
        <SummaryTiles
          tiles={[
            { label: "Operating net", value: <Money cents={totals.operating_net_cents} colored /> },
            { label: "Fundraising net", value: <Money cents={totals.fundraising_net_cents} colored /> },
            { label: "Capital", value: <Money cents={totals.capital_cents} />, hint: "Spent on lasting things" },
            { label: "Total", value: <Money cents={totals.total_cents} colored /> },
          ]}
        />
      )}
      <EngineWarnings warnings={warnings} />
      {areas.map((member) => {
        const rows = pnl.filter((p) => p.version_set_member_id === member.id && p.level === "offering").map(savedPnl);
        return (
          <section key={member.id} aria-labelledby={`member-${member.id}`} className="grid gap-2">
            <h2 id={`member-${member.id}`} className="text-base font-medium">
              {member.area_name ?? member.plan_name}
            </h2>
            {rows.length > 0 ? (
              <PnlTable rows={rows} label="Offering" />
            ) : (
              <p className="text-sm text-muted-foreground">This area's plan has no offerings.</p>
            )}
          </section>
        );
      })}
      {operationsLines.length > 0 && (
        <section aria-labelledby="operations-lines" className="grid gap-2">
          <h2 id="operations-lines" className="text-base font-medium">
            Operations Plan
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line</TableHead>
                <TableHead>For</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operationsLines.map((line, i) => (
                <TableRow key={`${line.name}-${i}`}>
                  <TableCell>{line.name}</TableCell>
                  <TableCell className="text-muted-foreground">{line.cost_center_name}</TableCell>
                  <TableCell className="text-right">
                    <Money cents={signedCents(line)} colored />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>Net</TableCell>
                <TableCell className="text-right">
                  <Money cents={operationsLines.reduce((sum, l) => sum + signedCents(l), 0)} colored />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>
      )}
    </div>
  );
}
