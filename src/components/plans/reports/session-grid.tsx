import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sessionGrid, type ReportOffering } from "@/model/reports";
import { cn } from "@/lib/utils";

const pinned = "sticky left-0 z-10 bg-background";

/**
 * Each program's estimated and max sailors in each session, one row per program and one column per session, so a
 * director sees at a glance which weeks fill and which run light.
 */
export function SessionGrid({ offerings }: { offerings: ReportOffering[] }) {
  const { sessions, rows } = sessionGrid(offerings);
  return (
    <Table aria-label="Estimated and max sailors by session">
      <TableHeader>
        <TableRow>
          <TableHead className={pinned}>Estimated / max</TableHead>
          {sessions.map((s) => (
            <TableHead key={s} className="text-right">
              {s}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ program, cells }) => (
          <TableRow key={program}>
            <TableCell className={pinned}>{program}</TableCell>
            {cells.map((o, i) => (
              <TableCell
                key={sessions[i]}
                className={cn("text-right tabular-nums", o && o.estimated >= o.max && "font-semibold")}
              >
                {o ? (
                  <>
                    {o.estimated}
                    <span className="text-muted-foreground"> / {o.max}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
