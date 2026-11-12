import { Link } from "@tanstack/react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Fragment, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { numberedOfferings, type ReportOffering } from "@/model/reports";
import {
  dayOf,
  daysIn,
  daysOf,
  formatShortDay,
  monthOf,
  sailorsIn,
  weekdayOf,
  weekName,
  weekOf,
  weeksOf,
  weekStep,
  type ScheduleBlock,
} from "@/model/schedule";
import { cn } from "@/lib/utils";

/** A program area on the timeline: its report's key, its name, its blocks and its offerings. */
export interface TimelineArea {
  key: string;
  name: string;
  blocks: ScheduleBlock[];
  offerings: ReportOffering[];
}

const areaColor = (i: number) => ({ "--program": `var(--program-${(i % 10) + 1})` }) as CSSProperties;

/** A week's cell: the area's color, stronger the more days it runs that week. */
function WeekCell({ days, style, chosen }: { days: number; style: CSSProperties; chosen: boolean }) {
  return (
    <div
      className={cn("h-4 rounded-[2px]", days > 0 ? "bg-(--program)" : "bg-muted", chosen && "ring-2 ring-foreground")}
      style={{ ...style, ...(days > 0 && { opacity: 0.35 + 0.65 * (Math.min(days, 5) / 5) }) }}
    />
  );
}

/**
 * The whole plan year at a glance: each program area's weeks, darker the more days they run, opening to its programs.
 * Choosing a week shows it across every area, each linking to its report.
 */
export function YearTimeline({ setId, areas }: { setId: string; areas: TimelineArea[] }) {
  const all = areas.flatMap((a) => a.blocks).sort((a, b) => a.date.localeCompare(b.date));
  const weeks = weeksOf(all);
  const [open, setOpen] = useState<string[]>([]);
  const [week, setWeek] = useState<string | null>(null);
  if (weeks.length === 0) {
    return <p className="text-sm text-muted-foreground">No activities yet</p>;
  }
  const months = weeks.map((w, i) => (i === 0 || monthOf(w) !== monthOf(weeks[i - 1]!) ? monthOf(w) : null));
  const columns = { gridTemplateColumns: `minmax(6rem, 10rem) repeat(${weeks.length}, minmax(0.375rem, 1fr))` };
  const programBlocks = (a: TimelineArea, program: string) => {
    const keys = new Set(a.offerings.filter((o) => o.program === program).map((o) => o.key));
    return a.blocks
      .map((b) => ({ ...b, activities: b.activities.filter((x) => keys.has(x.offering_key)) }))
      .filter((b) => b.activities.length > 0);
  };
  const days = week ? [...new Set(all.filter((b) => weekOf(b.date) === week).map((b) => b.date))].sort() : [];

  return (
    <div className="grid gap-6">
      <div role="group" aria-label="Year" className="grid items-center gap-y-1 text-sm" style={columns}>
        <div />
        {months.map((m, i) => (
          <div key={weeks[i]} aria-hidden className="text-xs whitespace-nowrap text-muted-foreground">
            {m}
          </div>
        ))}
        <div className="text-xs text-muted-foreground">Week</div>
        {weeks.map((w) => (
          <button
            key={w}
            type="button"
            aria-label={`Week of ${formatShortDay(w)}`}
            aria-pressed={w === week}
            onClick={() => setWeek(w)}
            className="h-3 cursor-pointer rounded-[2px] bg-border outline-none hover:bg-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-foreground"
          />
        ))}
        {areas.map((a, i) => {
          const programs = numberedOfferings(a.offerings).map((g) => g.program);
          const expanded = open.includes(a.key);
          return (
            <Fragment key={a.key}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? open.filter((k) => k !== a.key) : [...open, a.key])}
                className="flex cursor-pointer items-center gap-1 truncate pr-2 text-left font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <ChevronRightIcon
                  aria-hidden
                  className={cn("size-3.5 shrink-0 transition-transform", expanded && "rotate-90")}
                />
                <span className="truncate">{a.name}</span>
              </button>
              {weeks.map((w) => (
                <WeekCell key={w} days={daysIn(a.blocks, w)} style={areaColor(i)} chosen={w === week} />
              ))}
              {expanded &&
                programs.map((program) => {
                  const own = programBlocks(a, program);
                  return (
                    <Fragment key={program}>
                      <div className="truncate pr-2 pl-5 text-muted-foreground">{program}</div>
                      {weeks.map((w) => (
                        <WeekCell key={w} days={daysIn(own, w)} style={areaColor(i)} chosen={w === week} />
                      ))}
                    </Fragment>
                  );
                })}
            </Fragment>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        Darker means more days that week. Open an area for its programs, or choose a week.
      </p>

      {week && (
        <section aria-labelledby="year-week" className="grid gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Week before"
              disabled={week === weeks[0]}
              onClick={() => setWeek(weekStep(week, -1))}
            >
              <ChevronLeftIcon />
            </Button>
            <h3 id="year-week" className="font-medium">
              {weekName(week, days)}
            </h3>
            <Button
              variant="outline"
              size="icon"
              aria-label="Week after"
              disabled={week === weeks.at(-1)}
              onClick={() => setWeek(weekStep(week, 1))}
            >
              <ChevronRightIcon />
            </Button>
          </div>
          <Table aria-label={`Week of ${formatShortDay(week)} across program areas`}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Program area</TableHead>
                <TableHead className="text-right">Sailors</TableHead>
                {days.map((d) => (
                  <TableHead key={d} className="text-center">
                    <span className="block text-xs font-normal text-muted-foreground">{weekdayOf(d)}</span> {dayOf(d)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((a, i) => {
                const numbered = new Map(
                  numberedOfferings(a.offerings).flatMap((g) => g.offerings.map((o) => [o.key, o])),
                );
                const sailors = [...sailorsIn(a.blocks, week, numbered).values()];
                const runs = new Set(daysOf(a.blocks, week));
                return (
                  <TableRow key={a.key}>
                    <TableCell>
                      <Link
                        to="/plans/financial/$setId/$planId"
                        params={{ setId, planId: a.key }}
                        className="text-link underline-offset-4 hover:underline"
                      >
                        {a.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {sailors.length > 0 ? (
                        <>
                          {sailors.length === 1 ? "1 program" : `${sailors.length} programs`} ·{" "}
                          {sailors.reduce((n, s) => n + s.estimated, 0)}
                          <span className="text-muted-foreground"> / {sailors.reduce((n, s) => n + s.max, 0)}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {days.map((d) => (
                      <TableCell key={d} className="text-center">
                        {runs.has(d) ? (
                          <span
                            style={areaColor(i)}
                            className="inline-block size-3 rounded-[3px] bg-(--program)"
                            aria-label="Runs"
                            role="img"
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground">
            Estimated / max sailors. Open an area for its activity blocks.
          </p>
        </section>
      )}
    </div>
  );
}
