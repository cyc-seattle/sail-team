import type { Pnl } from "@cyc-seattle/platform/planning";
import { Link } from "@tanstack/react-router";
import { Fragment } from "react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { memberName, membersInOrder, type Member, type Results } from "@/model/financial-plans";
import { Money } from "./money";

type Row = Pick<Pnl, "enrollment" | "days" | "sailor_days" | "revenue_cents" | "expense_cents" | "net_cents">;

const fields = ["enrollment", "days", "sailor_days", "revenue_cents", "expense_cents", "net_cents"] as const;
const subtotal = (rows: Row[]): Row =>
  Object.fromEntries(fields.map((f) => [f, rows.reduce((total, r) => total + r[f], 0)])) as Row;

const count = (n: number) => n.toLocaleString("en-US");

/** One row's numbers. A subtotal leaves out days, which don't add up across offerings. */
function Cells({ row, days = true }: { row: Row; days?: boolean }) {
  return (
    <>
      <TableCell className="text-right tabular-nums">{count(row.enrollment)}</TableCell>
      <TableCell className="text-right tabular-nums">{days ? count(row.days) : ""}</TableCell>
      <TableCell className="text-right tabular-nums">{count(row.sailor_days)}</TableCell>
      <TableCell className="text-right">
        <Money cents={row.revenue_cents} whole />
      </TableCell>
      <TableCell className="text-right">
        <Money cents={row.expense_cents} whole />
      </TableCell>
      <TableCell className="text-right">
        <Money cents={row.net_cents} colored whole />
      </TableCell>
      <TableCell className="text-right">
        {row.sailor_days > 0 ? <Money cents={Math.round(row.net_cents / row.sailor_days)} colored /> : null}
      </TableCell>
    </>
  );
}

/**
 * Every program area's offerings in one table: how many sail, for how long, and what each takes in and spends, with a
 * subtotal for each area and the total in the footer.
 */
export function ProgramsSection({ setId, members, results }: { setId: string; members: Member[]; results: Results }) {
  const areas = membersInOrder(members)
    .filter((m) => m.kind === "program_area")
    .map((area) => ({
      area,
      offerings: results.pnl.filter((p) => p.member === area.id && p.level === "offering"),
    }));
  return (
    <section aria-labelledby="programs" className="grid gap-2">
      <h2 id="programs" className="text-base font-medium">
        Programs
      </h2>
      {areas.length === 0 ? (
        <p className="text-sm text-muted-foreground">No programs yet.</p>
      ) : (
        <Table aria-label="Programs">
          <TableHeader>
            <TableRow>
              <TableHead>Offering</TableHead>
              <TableHead className="text-right">Sailors</TableHead>
              <TableHead className="text-right">Days</TableHead>
              <TableHead className="text-right">Sailor-days</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead className="text-right">Net per sailor-day</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.map(({ area, offerings }) => (
              <Fragment key={area.id}>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="pt-card font-medium">
                    <Link
                      to="/plans/financial/$setId/$planId"
                      params={{ setId, planId: area.plan_id }}
                      className="text-link underline"
                    >
                      {memberName(area)}
                    </Link>
                  </TableCell>
                </TableRow>
                {offerings.map((o) => (
                  <TableRow key={o.subject_key}>
                    <TableCell className="pl-card">{o.name}</TableCell>
                    <Cells row={o} />
                  </TableRow>
                ))}
                <TableRow className="font-medium">
                  <TableCell className="pl-card">{memberName(area)} subtotal</TableCell>
                  <Cells row={subtotal(offerings)} days={false} />
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell>Total</TableCell>
              <Cells row={subtotal(areas.flatMap((a) => a.offerings))} days={false} />
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </section>
  );
}
