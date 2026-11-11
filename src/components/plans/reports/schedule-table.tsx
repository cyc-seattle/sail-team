import { Fragment } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDay } from "@/model/dates";
import type { ScheduleBlock, ScheduledActivity } from "@/model/reports";
import { cn } from "@/lib/utils";

const pinned = "sticky left-0 z-10 bg-background";
const none = <span className="text-muted-foreground">—</span>;

const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const time = (t: string) => clock.format(new Date(`1970-01-01T${t.slice(0, 5)}:00Z`));
const minutes = (n: number | null) => (n ? `${n} min` : none);
const hours = (n: number) => (n ? `${(Math.round(n / 6) / 10).toLocaleString("en-US")} hours` : none);
const kinds: Record<ScheduledActivity["kind"], string | null> = {
  practice: null,
  regatta: "Regatta",
  clinic: "Clinic",
  travel: "Travel",
};

function Lines({ items, rows }: { items: string[]; rows: number }) {
  return (
    <TableCell rowSpan={rows}>{items.length > 0 ? items.map((item) => <p key={item}>{item}</p>) : none}</TableCell>
  );
}

/**
 * A program area's activities by date, each block's activities together with the staff, coach boats and boats they
 * share. `labels` names each offering, such as Guppies 3.
 */
export function ScheduleTable({ blocks, labels }: { blocks: ScheduleBlock[]; labels: Map<string, string> }) {
  const head = ["Offering", "Time", "Setup", "Put-away", "On the water", "Staff", "Coach boats and equipment", "Boats"];
  return (
    <Table aria-label="Schedule">
      <TableHeader>
        <TableRow>
          <TableHead className={pinned}>Date</TableHead>
          {head.map((h) => (
            <TableHead key={h}>{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {blocks.map((b) => {
          const rows = b.activities.length;
          return (
            <Fragment key={b.key}>
              {b.activities.map((a, i) => (
                <TableRow key={a.key} className={cn("[&>td]:align-top", i > 0 && "border-t-0")}>
                  {i === 0 && (
                    <TableCell rowSpan={rows} className={pinned}>
                      <p className="tabular-nums">{formatDay(b.date)}</p>
                      {b.name && <p className="text-muted-foreground">{b.name}</p>}
                    </TableCell>
                  )}
                  <TableCell>
                    {labels.get(a.offering_key) ?? a.offering_key}
                    {kinds[a.kind] && <span className="text-muted-foreground">, {kinds[a.kind]}</span>}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {a.start_time && a.end_time ? `${time(a.start_time)}–${time(a.end_time)}` : none}
                  </TableCell>
                  <TableCell className="tabular-nums">{minutes(a.setup_minutes)}</TableCell>
                  <TableCell className="tabular-nums">{minutes(a.putaway_minutes)}</TableCell>
                  <TableCell className="tabular-nums">{hours(a.on_water_minutes)}</TableCell>
                  {i === 0 && (
                    <>
                      <Lines items={b.staff} rows={rows} />
                      <Lines items={b.equipment} rows={rows} />
                      <Lines items={b.boats} rows={rows} />
                    </>
                  )}
                </TableRow>
              ))}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
