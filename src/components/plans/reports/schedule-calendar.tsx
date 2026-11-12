import { useState, type CSSProperties } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { numberedOfferings, type PlanWarning, type ReportOffering } from "@/model/reports";
import {
  busiestWeek,
  dayOf,
  daysOf,
  formatShortDay,
  longDay,
  monthOf,
  patternsOf,
  sailorsOn,
  timeSpan,
  weekdayOf,
  weekName,
  weekOf,
  weeksOf,
  type ScheduleBlock,
} from "@/model/schedule";
import { cn } from "@/lib/utils";

const pinned = "sticky left-0 z-10 bg-background";
const pressable =
  "cursor-pointer rounded-sm outline-none sm:px-1 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:font-semibold aria-pressed:text-foreground";

/** Each program's color, from the chart colors in turn. */
const colorOf = (programs: string[]) => (program: string) =>
  ({ "--program": `var(--chart-${(programs.indexOf(program) % 6) + 1})` }) as CSSProperties;

function Swatch({ style }: { style: CSSProperties }) {
  return <span aria-hidden style={style} className="inline-block size-2.5 shrink-0 rounded-[3px] bg-(--program)" />;
}

/** A program's name with its color, cut short on a phone. */
function ProgramName({ program, style }: { program: string; style: CSSProperties }) {
  return (
    <span className="flex max-w-24 items-center gap-1.5 sm:max-w-none sm:gap-2" title={program}>
      <Swatch style={style} />
      <span className="truncate">{program}</span>
    </span>
  );
}

function Pills({ parts }: { parts: string[] }) {
  return parts.length > 0 ? (
    <ul className="flex flex-wrap gap-1">
      {parts.map((p) => (
        <li key={p} className="rounded-full border bg-muted px-2 text-sm">
          {p}
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-muted-foreground">No staff, coach boats or boats yet</p>
  );
}

export interface ScheduleCalendarProps {
  blocks: ScheduleBlock[];
  /** The area's offerings, for their numbers and their estimated and max sailors. */
  offerings: ReportOffering[];
  /** The area's warnings, shown on their days. */
  warnings: PlanWarning[];
  /** The days CSC is closed. */
  closedDays: { date: string; name: string }[];
  /** How many programs each other program area runs in a week, by the week's Monday. */
  elsewhere: { area: string; weeks: Map<string, number> }[];
}

/**
 * A program area's schedule as people plan it, in weeks and days: each repeating block written once, which programs
 * run which weeks, then a week's days, then a day's blocks in full.
 */
export function ScheduleCalendar({ blocks, offerings, warnings, closedDays, elsewhere }: ScheduleCalendarProps) {
  const groups = numberedOfferings(offerings);
  const numbered = new Map(groups.flatMap((g) => g.offerings.map((o) => [o.key, o])));
  const programs = groups.map((g) => g.program);
  const color = colorOf(programs);
  // In the order they start, and then in the order their programs first start.
  const patterns = patternsOf(blocks, numbered).sort(
    (a, b) =>
      a.first.localeCompare(b.first) ||
      programs.indexOf(a.programs[0]?.program ?? "") - programs.indexOf(b.programs[0]?.program ?? ""),
  );
  const weeks = weeksOf(blocks);
  const [week, setWeek] = useState(() => busiestWeek(blocks));
  const days = week ? daysOf(blocks, week) : [];
  const [chosen, setDay] = useState<string | null>(null);
  const today = chosen && days.includes(chosen) ? chosen : (days[0] ?? null);
  const programOf = (key: string) => numbered.get(key)?.program ?? key;
  const differing = new Set(patterns.flatMap((p) => p.differing));
  const runs = (program: string, w: string) =>
    blocks.filter((b) => weekOf(b.date) === w && b.activities.some((a) => programOf(a.offering_key) === program));
  const first = blocks[0]?.date ?? "";
  const last = blocks.at(-1)?.date ?? "";
  const closed = closedDays.filter((d) => d.date >= first && d.date <= last);

  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">No activities yet</p>;
  }
  return (
    <div className="grid gap-8">
      <section aria-label="Every week" className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          {patterns.map((p) => (
            <article
              key={p.key}
              aria-label={p.title}
              className="grid content-start gap-2 rounded-lg border bg-card p-4"
            >
              <div>
                <h3 className="font-medium">{p.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {p.weekdays}, {formatShortDay(p.first)} to {formatShortDay(p.last)} ·{" "}
                  {p.days === 1 ? "1 day" : `${p.days} days`}
                </p>
              </div>
              <ul className="grid gap-0.5 text-sm">
                {p.programs.map((pp) => (
                  <li key={pp.program} className="flex items-center gap-2">
                    <Swatch style={color(pp.program)} />
                    <span>
                      {pp.offerings}
                      {pp.time && <span className="text-muted-foreground"> · {pp.time}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <Pills parts={p.parts} />
              {p.exceptions.length > 0 && (
                <ul aria-label={`${p.title}: days that differ`} className="grid text-sm text-warning">
                  {p.exceptions.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
        {closed.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Closed {closed.map((d) => `${formatShortDay(d.date)}, ${d.name}`).join("; ")}.
          </p>
        )}
      </section>

      <section aria-labelledby="schedule-weeks" className="grid gap-2">
        <h3 id="schedule-weeks" className="font-medium">
          Weeks
        </h3>
        <Table aria-label="Weeks">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={pinned}>
                <span className="sr-only">Program</span>
              </TableHead>
              {weeks.map((w) => (
                <TableHead key={w} className={cn("px-0.5 text-center sm:px-1", w === week && "bg-muted")}>
                  <button type="button" aria-pressed={w === week} className={pressable} onClick={() => setWeek(w)}>
                    <span className="block text-xs font-normal text-muted-foreground">{monthOf(w)}</span> {dayOf(w)}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program} className="border-0 hover:bg-transparent">
                <TableCell className={cn(pinned, "py-1 pr-1 pl-0 sm:px-2")}>
                  <ProgramName program={program} style={color(program)} />
                </TableCell>
                {weeks.map((w) => {
                  const own = runs(program, w);
                  const odd = own.some((b) => differing.has(b.key));
                  return (
                    <TableCell key={w} className={cn("px-0.5 py-1 sm:px-1", w === week && "bg-muted")}>
                      <div
                        style={color(program)}
                        className={cn(
                          "relative h-5 min-w-4 rounded-sm",
                          own.length > 0 ? "bg-(--program)" : "bg-muted",
                        )}
                      >
                        <span className="sr-only">
                          {own.length > 0 ? (odd ? "Runs, with a day that differs" : "Runs") : "No"}
                        </span>
                        {odd && (
                          <span
                            aria-hidden
                            className="absolute -top-1 -right-1 size-2.5 rounded-full bg-warning ring-2 ring-background"
                          />
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden className="inline-block size-2.5 rounded-full bg-warning" />A day that differs from its
          block's usual staff, coach boats or boats
        </p>
      </section>

      {week && (
        <section aria-labelledby="schedule-week" className="grid gap-2">
          <h3 id="schedule-week" className="font-medium">
            {weekName(week, days)}
          </h3>
          <Table aria-label={`Week of ${formatShortDay(week)}`}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={pinned}>
                  <span className="sr-only">Program</span>
                </TableHead>
                {days.map((d) => (
                  <TableHead key={d} className={cn("px-0.5 text-center sm:px-2", d === today && "bg-muted")}>
                    <button type="button" aria-pressed={d === today} className={pressable} onClick={() => setDay(d)}>
                      <span className="block text-xs font-normal text-muted-foreground">{weekdayOf(d)}</span> {dayOf(d)}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs
                .filter((program) => runs(program, week).length > 0)
                .map((program) => (
                  <TableRow key={program} className="border-0 hover:bg-transparent">
                    <TableCell className={cn(pinned, "py-1 pr-1 pl-0 sm:px-2")}>
                      <ProgramName program={program} style={color(program)} />
                    </TableCell>
                    {days.map((d) => {
                      const sailors = sailorsOn(blocks, d, numbered).get(program);
                      return (
                        <TableCell key={d} className={cn("px-0.5 py-1 text-center sm:px-1", d === today && "bg-muted")}>
                          {sailors ? (
                            <span
                              style={color(program)}
                              className="block rounded-sm border-l-2 border-(--program) bg-card px-1 text-xs tabular-nums sm:border-l-4 sm:px-2 sm:text-sm"
                            >
                              {sailors.estimated}
                              <span className="text-muted-foreground">
                                <span className="hidden sm:inline"> </span>/<span className="hidden sm:inline"> </span>
                                {sailors.max}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground">
            Estimated / max sailors
            {elsewhere.some((e) => e.weeks.get(week)) &&
              ` · Also this week: ${elsewhere
                .filter((e) => e.weeks.get(week))
                .map((e) => `${e.area}, ${e.weeks.get(week) === 1 ? "1 program" : `${e.weeks.get(week)} programs`}`)
                .join(" · ")}`}
          </p>
        </section>
      )}

      {today && (
        <section aria-labelledby="schedule-day" className="grid gap-3 rounded-lg border bg-card p-4">
          <h3 id="schedule-day" className="font-medium">
            {longDay(today)}
          </h3>
          {warnings
            .filter((w) => w.date === today)
            .map((w) => (
              <p key={w.key} className="text-sm text-warning">
                {w.message}
              </p>
            ))}
          {blocks
            .filter((b) => b.date === today)
            .map((b) => {
              const own = [...new Set(b.activities.map((a) => programOf(a.offering_key)))];
              const span = timeSpan(
                b.activities[0]?.start_time ?? null,
                b.activities
                  .map((a) => a.end_time ?? "")
                  .sort()
                  .at(-1) ?? null,
              );
              return (
                <article key={b.key} aria-label={b.name ?? own.join(" and ")} className="grid gap-2 border-t pt-3">
                  <p>
                    <span className="font-medium">{b.name ?? own.join(" and ")}</span>
                    {span && <span className="text-muted-foreground"> · {span}</span>}
                  </p>
                  <ul className="grid gap-0.5 text-sm">
                    {b.activities.map((a) => (
                      <li key={a.key} className="flex flex-wrap items-center gap-x-2">
                        <Swatch style={color(programOf(a.offering_key))} />
                        <span>{numbered.get(a.offering_key)?.label ?? a.offering_key}</span>
                        {[
                          timeSpan(a.start_time, a.end_time),
                          a.setup_minutes ? `${a.setup_minutes} min setup` : null,
                          a.putaway_minutes ? `${a.putaway_minutes} min put-away` : null,
                        ]
                          .filter(Boolean)
                          .map((t, i, all) => (
                            <span key={t} className="whitespace-nowrap text-muted-foreground">
                              {t}
                              {i < all.length - 1 && ","}
                            </span>
                          ))}
                      </li>
                    ))}
                  </ul>
                  <Pills parts={b.parts} />
                </article>
              );
            })}
        </section>
      )}
    </div>
  );
}
