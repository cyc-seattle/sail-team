import { Link } from "@tanstack/react-router";
import { ReportSection } from "@/components/plans/reports/report-page";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StorageNeed } from "@/model/inventory";

const pinned = "sticky left-0 z-10 bg-background";
const area = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

/**
 * The dry storage CSC's boats take now: each class's boats, the area one takes, and the two multiplied, with the total.
 * What each program pays for it is on the active plan's Storage report.
 */
export function StorageList({
  needs,
  activePlan,
}: {
  needs: StorageNeed[];
  /** The plan active today, for its Storage report, or null when none is or the person can't read plans. */
  activePlan: { id: string; name: string } | null;
}) {
  const total = needs.reduce((sum, n) => sum + (n.sq_ft ?? 0), 0);
  const unmeasured = needs.filter((n) => n.sq_ft === null);
  return (
    <ReportSection
      id="dry-storage"
      title="Dry storage"
      actions={
        activePlan && (
          <Link
            to="/plans/financial/$setId/$planId"
            params={{ setId: activePlan.id, planId: "storage" }}
            className="text-sm text-link underline"
          >
            {activePlan.name} storage costs
          </Link>
        )
      }
    >
      {needs.length === 0 ? (
        <p className="text-sm text-muted-foreground">CSC has no boats in service.</p>
      ) : (
        <>
          <Table aria-label="Dry storage">
            <TableHeader>
              <TableRow>
                <TableHead className={pinned}>Class</TableHead>
                <TableHead className="text-right">Boats</TableHead>
                <TableHead className="text-right">Sq ft each</TableHead>
                <TableHead className="text-right">Sq ft</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {needs.map((n) => (
                <TableRow key={n.boatClass.id}>
                  <TableCell className={pinned + " font-medium"}>{n.boatClass.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{n.boats}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {n.boatClass.footprint_sq_ft === null ? "—" : area.format(n.boatClass.footprint_sq_ft)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {n.sq_ft === null ? "—" : area.format(n.sq_ft)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-transparent">
              <TableRow>
                <TableCell className={pinned}>Total</TableCell>
                <TableCell className="text-right tabular-nums">{needs.reduce((sum, n) => sum + n.boats, 0)}</TableCell>
                <TableCell />
                <TableCell className="text-right tabular-nums">{area.format(total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          {unmeasured.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {unmeasured.map((n) => n.boatClass.name).join(", ")} {unmeasured.length === 1 ? "has" : "have"} no
              footprint yet, so {unmeasured.length === 1 ? "it isn't" : "they aren't"} in the total. Set one on Boat
              classes.
            </p>
          )}
        </>
      )}
    </ReportSection>
  );
}
