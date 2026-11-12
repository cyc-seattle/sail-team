import { useState, type CSSProperties } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { numberedOfferings, type PlanWarning, type ReportOffering } from "@/model/reports";
import {
  dayOf,
  differences,
  daysOf,
  formatShortDay,
  longDay,
  monthOf,
  type Pattern,
  patternsOf,
  sailorsIn,
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

/** The program colors there are; an eleventh program and on takes one again, striped. */
const PROGRAM_COLORS = 10;

/** Each program's color, as `--program`, with `--stripes` and a dashed `--edge` once the colors come round again. */
const colorOf = (programs: string[]) => (program: string) => {
  const i = Math.max(programs.indexOf(program), 0);
  return {
    "--program": `var(--program-${(i % PROGRAM_COLORS) + 1})`,
    ...(i >= PROGRAM_COLORS && {
      "--stripes": "repeating-linear-gradient(45deg, transparent 0 3px, var(--background) 3px 5px)",
      "--edge": "dashed",
    }),
  } as CSSProperties;
};

/** A fill in a program's color. */
const fill = "bg-(--program) bg-(image:--stripes)";

function Swatch({ style }: { style: CSSProperties }) {
  return <span aria-hidden style={style} className={cn("inline-block size-2.5 shrink-0 rounded-[3px]", fill)} />;
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

/** Who a block's staff and boats are for: "Opti Camp and Sailqube Camp share:", or "Adventure Camp has:". */
const sharers = (programs: string[]) =>
  programs.length === 1
    ? `${programs[0]} has:`
    : `${programs.length > 2 ? `${programs.slice(0, -1).join(", ")}, and ${programs.at(-1)}` : programs.join(" and ")} share:`;

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

/** A block chosen in a week: the whole week, or one of its days. */
type Chosen = { pattern: string; date: string | null };

/**
 * A program area's schedule, zooming in as people plan: which programs run which weeks with their sailors, then a
 * week's activity blocks by day, then one block in full.
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
  const [week, setWeek] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const closedOn = (d: string) => closedDays.find((c) => c.date === d);
  const days = week
    ? [...new Set([...daysOf(blocks, week), ...closedDays.map((c) => c.date).filter((d) => weekOf(d) === week)])].sort()
    : [];
  const programOf = (key: string) => numbered.get(key)?.program ?? key;
  const differing = new Set(patterns.flatMap((p) => p.differing));
  const runs = (program: string, w: string) =>
    blocks.filter((b) => weekOf(b.date) === w && b.activities.some((a) => programOf(a.offering_key) === program));
  const inWeek = (p: Pattern) => blocks.filter((b) => week && weekOf(b.date) === week && p.blocks.includes(b.key));
  const openWeek = (w: string) => {
    setWeek(w);
    setChosen(null);
  };

  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">No activities yet</p>;
  }
  return (
    <div className="grid gap-8">
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
                  <button type="button" aria-pressed={w === week} className={pressable} onClick={() => openWeek(w)}>
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
                  const sailors = sailorsIn(blocks, w, numbered).get(program);
                  return (
                    <TableCell key={w} className={cn("px-0.5 py-1 text-center sm:px-1", w === week && "bg-muted")}>
                      {sailors ? (
                        <span
                          style={color(program)}
                          className="relative block rounded-sm border-l-2 border-(--program) bg-card [border-left-style:var(--edge,solid)] px-1 text-xs whitespace-nowrap tabular-nums sm:border-l-4 sm:px-2 sm:text-sm"
                        >
                          {sailors.estimated}
                          <span className="text-muted-foreground">
                            <span className="hidden sm:inline"> </span>/<span className="hidden sm:inline"> </span>
                            {sailors.max}
                          </span>
                          {odd && (
                            <>
                              <span className="sr-only">, with a day that differs</span>
                              <Dot />
                            </>
                          )}
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
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <span>Estimated / max sailors ·</span>
          <span className="flex items-center gap-2">
            <span aria-hidden className="inline-block size-2.5 rounded-full bg-warning" />a day that differs from its
            block's usual staff, coach boats or boats
          </span>
          {!week && <span>· Tap a week for its schedule</span>}
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
                  <span className="sr-only">Activity block</span>
                </TableHead>
                {days.map((d) => {
                  const warned = warnings.filter((w) => w.date === d).length;
                  return (
                    <TableHead key={d} className="px-0.5 text-center sm:px-2">
                      <span className="block text-xs font-normal text-muted-foreground">{weekdayOf(d)}</span> {dayOf(d)}
                      {closedOn(d) && <span className="block text-xs font-normal text-muted-foreground">Closed</span>}
                      {warned > 0 && (
                        <span className="block text-xs font-normal text-warning">
                          {warned === 1 ? "1 warning" : `${warned} warnings`}
                        </span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {patterns
                .filter((p) => inWeek(p).length > 0)
                .map((p) => (
                  <TableRow key={p.key} className="border-0 hover:bg-transparent">
                    <TableCell className={cn(pinned, "py-1 pr-1 pl-0 sm:px-2")}>
                      <button
                        type="button"
                        aria-label={`${p.title}, the whole week`}
                        aria-pressed={chosen?.pattern === p.key && chosen.date === null}
                        className={cn(pressable, "max-w-28 truncate text-left sm:max-w-none")}
                        onClick={() => setChosen({ pattern: p.key, date: null })}
                      >
                        {p.title}
                      </button>
                    </TableCell>
                    {days.map((d) => {
                      const own = blocks.filter((b) => b.date === d && p.blocks.includes(b.key));
                      const odd = own.some((b) => differing.has(b.key));
                      const running = [
                        ...new Set(own.flatMap((b) => b.activities.map((a) => programOf(a.offering_key)))),
                      ];
                      const pressed = chosen?.pattern === p.key && chosen.date === d;
                      return (
                        <TableCell key={d} className="px-0.5 py-1 text-center sm:px-1">
                          {running.length > 0 ? (
                            <button
                              type="button"
                              aria-label={`${p.title}, ${longDay(d)}${odd ? ", different from the usual" : ""}`}
                              aria-pressed={pressed}
                              onClick={() => setChosen({ pattern: p.key, date: d })}
                              className={cn(
                                "relative inline-flex min-h-6 cursor-pointer items-center gap-0.5 rounded-sm border bg-card px-1 py-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                                pressed ? "border-foreground" : "border-transparent hover:border-border",
                              )}
                            >
                              {running.map((program) => (
                                <Swatch key={program} style={color(program)} />
                              ))}
                              {odd && <Dot />}
                            </button>
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
            Tap a block for its details
            {elsewhere.some((e) => e.weeks.get(week)) &&
              ` · Also this week: ${elsewhere
                .filter((e) => e.weeks.get(week))
                .map((e) => `${e.area}, ${e.weeks.get(week) === 1 ? "1 program" : `${e.weeks.get(week)} programs`}`)
                .join(" · ")}`}
          </p>
        </section>
      )}

      {week && chosen && (
        <BlockDetails
          pattern={patterns.find((p) => p.key === chosen.pattern)!}
          own={inWeek(patterns.find((p) => p.key === chosen.pattern)!).filter(
            (b) => chosen.date === null || b.date === chosen.date,
          )}
          date={chosen.date}
          weekName={weekName(week, days)}
          warnings={warnings.filter((w) => w.date === chosen.date)}
          numbered={(key) => numbered.get(key)?.label ?? key}
          programOf={programOf}
          color={color}
        />
      )}
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden className="absolute -top-1 -right-1 size-2.5 rounded-full bg-warning ring-2 ring-background" />
  );
}

/**
 * One activity block in full, for a day or for its week: its programs and times, setup and put-away, what they share,
 * and how its days differ from the usual.
 */
function BlockDetails({
  pattern,
  own,
  date,
  weekName: week,
  warnings,
  numbered,
  programOf,
  color,
}: {
  pattern: Pattern;
  own: ScheduleBlock[];
  date: string | null;
  weekName: string;
  warnings: PlanWarning[];
  numbered: (key: string) => string;
  programOf: (key: string) => string;
  color: (program: string) => CSSProperties;
}) {
  // Each offering once, at the times it first has.
  const activities = [...new Map(own.flatMap((b) => b.activities).map((a) => [a.offering_key, a])).values()];
  const parts = date ? (own[0]?.parts ?? []) : pattern.parts;
  const odd = own.filter((b) => b.parts.join("|") !== pattern.parts.join("|"));
  return (
    <section aria-labelledby="schedule-block" className="grid gap-3 rounded-lg border bg-card p-4">
      <h3 id="schedule-block">
        <span className="font-medium">{pattern.title}</span>{" "}
        <span className="text-muted-foreground">· {date ? longDay(date) : week}</span>
      </h3>
      {warnings.map((w) => (
        <p key={w.key} className="text-sm text-warning">
          {w.message}
        </p>
      ))}
      <ul className="grid gap-0.5 text-sm">
        {activities.map((a) => (
          <li key={a.offering_key} className="flex flex-wrap items-center gap-x-1.5">
            <Swatch style={color(programOf(a.offering_key))} />
            <span>{numbered(a.offering_key)}</span>
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
      <div className="grid gap-1">
        {parts.length > 0 && (
          <p className="text-sm">{sharers([...new Set(activities.map((a) => programOf(a.offering_key)))])}</p>
        )}
        <Pills parts={parts} />
      </div>
      {odd.length > 0 && (
        <ul aria-label="How it differs" className="grid text-sm text-warning">
          {odd.map((b) => (
            <li key={b.key}>
              {date ? "Different from the usual" : `${weekdayOf(b.date)} ${dayOf(b.date)}`}:{" "}
              {differences(b.parts, pattern.parts)}
              {date && pattern.parts.length > 0 && (
                <span className="text-muted-foreground"> (usually {pattern.parts.join(", ")})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
