import { Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { memberName, membersInOrder, type Member, type Results } from "@/model/financial-plans";
import { Money } from "./money";

const pinned = "sticky left-0 z-10 bg-background";

/** Each program area's offerings: how many sail, for how long, and what each takes in and spends. */
export function ProgramsSection({ setId, members, results }: { setId: string; members: Member[]; results: Results }) {
  const areas = membersInOrder(members).filter((m) => m.kind === "program_area");
  return (
    <section aria-labelledby="programs" className="grid gap-card">
      <h2 id="programs" className="text-base font-medium">
        Programs
      </h2>
      {areas.length === 0 && <p className="text-sm text-muted-foreground">No programs yet.</p>}
      {areas.map((area) => {
        const offerings = results.pnl.filter((p) => p.member === area.id && p.level === "offering");
        return (
          <div key={area.id} className="grid gap-2">
            <h3 className="text-sm font-medium">
              <Link
                to="/plans/financial/$setId/$planId"
                params={{ setId, planId: area.plan_id }}
                className="text-link underline"
              >
                {memberName(area)}
              </Link>
            </h3>
            <Table aria-label={`${memberName(area)} offerings`}>
              <TableHeader>
                <TableRow>
                  <TableHead className={pinned}>Offering</TableHead>
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
                {offerings.map((o) => (
                  <TableRow key={o.subject_key}>
                    <TableCell className={pinned}>{o.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.enrollment}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.days}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.sailor_days}</TableCell>
                    <TableCell className="text-right">
                      <Money cents={o.revenue_cents} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money cents={o.expense_cents} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money cents={o.net_cents} colored />
                    </TableCell>
                    <TableCell className="text-right">
                      {o.sailor_days > 0 ? <Money cents={Math.round(o.net_cents / o.sailor_days)} colored /> : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </section>
  );
}
