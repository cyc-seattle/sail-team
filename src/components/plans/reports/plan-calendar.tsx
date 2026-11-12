import { programColor } from "@cyc-seattle/platform/planning";
import { useState, type CSSProperties } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { numberedOfferings, type NumberedOffering, type ReportOffering } from "@/model/reports";
import {
  dayOf,
  differences,
  formatShortDay,
  lanes,
  longDay,
  monthOf,
  patternsOf,
  runsOf,
  timeSpan,
  weekDays,
  weekdayOf,
  weekOf,
  weeksOf,
  type ScheduleBlock,
} from "@/model/schedule";
import { cn } from "@/lib/utils";
import { SpanGrid, type SpanRow } from "./span-grid";

/** A program area on the calendar: its report's key, its name, its blocks and its offerings. */
export interface CalendarArea {
  key: string;
  name: string;
  blocks: ScheduleBlock[];
  offerings: ReportOffering[];
}

export interface PlanCalendarProps {
  areas: CalendarArea[];
  /** The days CSC is closed. */
  closedDays: { date: string; name: string }[];
  /** The one area shown, or every area. */
  area: string | null;
  /** The day shown, or the first with an activity. */
  day: string | null;
  onAreaChange: (area: string | null) => void;
  onDayChange: (day: string) => void;
}

const HOUR = 56;
const minutes = (t: string | null, or: number) => (t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : or);
const hourName = (h: number) => (h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`);

/** A block on the chosen day: its times, and the column it takes beside the blocks it overlaps. */
interface Placed {
  block: ScheduleBlock;
  start: number;
  end: number;
  column: number;
}

/**
 * Every program area's calendar together: each offering over its weeks, its programs in shades of its area's color, then
 * a chosen day's activity blocks at their times, each opening to its staff, coach boats and boats.
 */
export function PlanCalendar({ areas, closedDays, area, day, onAreaChange, onDayChange }: PlanCalendarProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const sorted = [...areas].sort((a, b) => a.name.localeCompare(b.name));
  const shown = sorted.filter((a) => !area || a.key === area);
  const all = shown.flatMap((a) => a.blocks).sort((a, b) => a.date.localeCompare(b.date));
  const weeks = weeksOf(all);
  const today = day ?? all[0]?.date ?? null;

  const offerings = new Map<string, NumberedOffering>();
  const colors = new Map<string, CSSProperties>();
  // Each block that differs from its usual: how, and what's usual.
  const differing = new Map<string, { how: string; usual: string[] }>();
  const rows = shown.flatMap((a): SpanRow[] => {
    const groups = numberedOfferings(a.offerings);
    const numbered = new Map(groups.flatMap((g) => g.offerings.map((o) => [o.key, o])));
    for (const p of patternsOf(a.blocks, numbered)) {
      for (const b of a.blocks.filter((b) => p.differing.includes(b.key))) {
        differing.set(b.key, { how: differences(b.parts, p.parts), usual: p.parts });
      }
    }
    return [
      { key: a.key, name: a.name, heading: true, spans: [] },
      ...groups.flatMap(({ program, offerings: own }) => {
        // Keyed by area too: two areas can run programs of the same name. A program the catalog doesn't know falls back to
        // its name, so it still keeps one color.
        const style = {
          "--program": programColor({ id: own[0]?.program_id ?? program, color: own[0]?.program_color ?? null }),
        } as CSSProperties;
        colors.set(`${a.key} ${program}`, style);
        own.forEach((o) => offerings.set(o.key, o));
        const spans = own.flatMap((o) =>
          runsOf(
            a.blocks
              .filter((b) => b.activities.some((x) => x.offering_key === o.key))
              .map((b) => weeks.indexOf(weekOf(b.date))),
          ).map(([from, to]) => ({
            key: `${o.key} ${from}`,
            from,
            to,
            label: o.label,
            style,
            className:
              "bg-(--program) px-1 text-xs font-medium whitespace-nowrap text-(--program-foreground) tabular-nums",
            content: (
              <span className="truncate">
                <span className="sr-only">{o.label}: </span>
                {to > from && <span aria-hidden>{o.label.slice(program.length + 1)} · </span>}
                {o.estimated}/{o.max}
              </span>
            ),
          })),
        );
        return lanes(spans).map((lane, i) => ({
          key: `${a.key} ${program} ${i}`,
          name:
            i === 0 ? (
              <span className="flex items-center gap-2 truncate" title={program}>
                <span
                  aria-hidden
                  style={style}
                  className="inline-block size-2.5 shrink-0 rounded-[3px] bg-(--program)"
                />
                <span className="truncate">{program}</span>
              </span>
            ) : null,
          spans: lane,
        }));
      }),
    ];
  });
  const areaOf = new Map(shown.flatMap((a) => a.blocks.map((b) => [b.key, a.key])));
  const colorOf = (blockKey: string, offeringKey: string) =>
    colors.get(`${areaOf.get(blockKey)} ${offerings.get(offeringKey)?.program}`) ?? {};

  const filter = (
    <Select
      items={[{ value: "", label: "All program areas" }, ...sorted.map((a) => ({ value: a.key, label: a.name }))]}
      value={area ?? ""}
      onValueChange={(value) => {
        setChosen(null);
        onAreaChange(value ? String(value) : null);
      }}
    >
      <SelectTrigger aria-label="Program area" className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All program areas</SelectItem>
        {sorted.map((a) => (
          <SelectItem key={a.key} value={a.key}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  if (!today || weeks.length === 0) {
    return (
      <div className="grid gap-4">
        <div>{filter}</div>
        <p className="text-sm text-muted-foreground">No activities yet</p>
      </div>
    );
  }

  const days = weekDays(weekOf(today));
  const closedOn = (d: string) => closedDays.find((c) => c.date === d);
  const placed: Placed[] = [];
  for (const p of all
    .filter((b) => b.date === today)
    .map((block) => ({
      block,
      start: Math.min(...block.activities.map((a) => minutes(a.start_time, 9 * 60))),
      end: Math.max(...block.activities.map((a) => minutes(a.end_time, 12 * 60))),
      column: 0,
    }))
    .sort((a, b) => a.start - b.start || a.block.key.localeCompare(b.block.key))) {
    let column = 0;
    while (placed.some((q) => q.column === column && q.start < p.end && p.start < q.end)) {
      column++;
    }
    placed.push({ ...p, column });
  }
  const columns = Math.max(1, ...placed.map((p) => p.column + 1));
  const first = Math.floor(Math.min(8 * 60, ...placed.map((p) => p.start)) / 60);
  const last = Math.ceil(Math.max(17 * 60, ...placed.map((p) => p.end)) / 60);
  const hours = Array.from({ length: last - first }, (_, i) => first + i);
  const top = (m: number) => ((m - first * 60) / 60) * HOUR;
  const open = placed.find((p) => p.block.key === chosen);
  const programOf = (key: string) => offerings.get(key)?.program ?? key;
  const choose = (d: string) => {
    setChosen(null);
    onDayChange(d);
  };
  const closed = closedOn(today);

  return (
    <div className="grid gap-6">
      <div>{filter}</div>
      <div className="grid gap-2">
        <SpanGrid
          label="Year"
          columnWidth="3rem"
          columns={weeks.map((w, i) => ({
            key: w,
            name: `Week of ${formatShortDay(w)}`,
            head: (
              <>
                <span className="block text-xs text-muted-foreground">
                  {i === 0 || monthOf(w) !== monthOf(weeks[i - 1]!) ? monthOf(w) : " "}
                </span>
                <span className="text-xs">{dayOf(w)}</span>
              </>
            ),
          }))}
          rows={rows}
          chosen={weekOf(today)}
          onChoose={(w) => choose(all.find((b) => weekOf(b.date) === w)?.date ?? w)}
        />
        <p className="text-sm text-muted-foreground">Estimated/max sailors. Choose a week for its days.</p>
      </div>

      <section aria-labelledby="calendar-day" className="grid gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div role="group" aria-label="Day" className="flex gap-1">
            {days.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={d === today}
                onClick={() => choose(d)}
                className="grid w-12 cursor-pointer content-start justify-items-center rounded-md py-1 text-sm outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-foreground aria-pressed:text-background"
              >
                <span className="text-xs">{weekdayOf(d)}</span> <span className="font-medium">{dayOf(d)}</span>
                {closedOn(d) && <span className="text-[0.625rem] leading-none"> Closed</span>}
              </button>
            ))}
          </div>
          <h3 id="calendar-day" className="font-medium">
            {longDay(today)}
            {closed && <span className="font-normal text-muted-foreground"> · Closed for {closed.name}</span>}
          </h3>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="relative rounded-lg border bg-card" style={{ height: hours.length * HOUR }}>
            {hours.map((h, i) => (
              <div key={h} className="absolute inset-x-0 border-t first:border-t-0" style={{ top: i * HOUR }}>
                <span className="absolute top-1 left-2 text-xs text-muted-foreground">{hourName(h)}</span>
              </div>
            ))}
            {placed.length === 0 && (
              <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                No activities this day
              </p>
            )}
            <div className="absolute inset-y-0 right-2 left-16">
              {placed.map((p) => {
                const programs = [...new Set(p.block.activities.map((a) => programOf(a.offering_key)))];
                // A block of one activity, with no name of its own, is just that activity.
                const framed = p.block.name !== null || p.block.activities.length > 1;
                const title = p.block.name ?? programs.join(" and ");
                const header = framed ? 20 : 0;
                const odd = differing.has(p.block.key);
                return (
                  <button
                    key={p.block.key}
                    type="button"
                    aria-pressed={p.block.key === chosen}
                    onClick={() => setChosen(p.block.key)}
                    className={cn(
                      "absolute flex cursor-pointer flex-col rounded-md text-left text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:ring-2 aria-pressed:ring-foreground",
                      framed && "border bg-background p-1 shadow-xs hover:border-foreground/40",
                    )}
                    style={{
                      top: top(p.start),
                      height: top(p.end) - top(p.start),
                      left: `calc(${(p.column / columns) * 100}% + 2px)`,
                      width: `calc(${100 / columns}% - 4px)`,
                    }}
                  >
                    {framed && <span className="truncate font-medium">{title}</span>}
                    <span className="relative flex-1">
                      {p.block.activities.map((a, i, own) => {
                        const start = minutes(a.start_time, 9 * 60);
                        return (
                          <span
                            key={a.key}
                            style={{
                              ...colorOf(p.block.key, a.offering_key),
                              top: top(start) - top(p.start),
                              height: top(minutes(a.end_time, 12 * 60)) - top(start) - header,
                              left: `${(i / own.length) * 100}%`,
                              width: framed ? `calc(${100 / own.length}% - 2px)` : "100%",
                            }}
                            className="absolute overflow-hidden rounded-sm bg-(--program) px-1 py-0.5 text-(--program-foreground)"
                          >
                            <span className="block truncate font-medium">
                              {framed && <span className="sr-only">, </span>}
                              {offerings.get(a.offering_key)?.label ?? a.offering_key}
                            </span>{" "}
                            <span className="block truncate">{timeSpan(a.start_time, a.end_time)}</span>
                          </span>
                        );
                      })}
                    </span>
                    {odd && (
                      <>
                        <span className="sr-only">, different from the usual</span>
                        <span
                          aria-hidden
                          className="absolute -top-1 -right-1 size-2.5 rounded-full bg-warning ring-2 ring-background"
                        />
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <BlockDetails
            block={open?.block}
            differs={open ? differing.get(open.block.key) : undefined}
            label={(key) => offerings.get(key)?.label ?? key}
            programOf={programOf}
            color={(key) => (open ? colorOf(open.block.key, key) : {})}
          />
        </div>
        {differing.size > 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden className="inline-block size-2.5 rounded-full bg-warning" />A block that differs from its
            usual staff, coach boats or boats
          </p>
        )}
      </section>
    </div>
  );
}

/** Who a block's staff and boats are for: "Opti Camp and Sailqube Camp share:", or "Adventure Camp has:". */
const sharers = (programs: string[]) =>
  programs.length === 1
    ? `${programs[0]} has:`
    : `${programs.length > 2 ? `${programs.slice(0, -1).join(", ")}, and ${programs.at(-1)}` : programs.join(" and ")} share:`;

/** One activity block in full: its activities and their times, setup and put-away, and what they share. */
function BlockDetails({
  block,
  differs,
  label,
  programOf,
  color,
}: {
  block: ScheduleBlock | undefined;
  differs: { how: string; usual: string[] } | undefined;
  label: (offeringKey: string) => string;
  programOf: (offeringKey: string) => string;
  color: (offeringKey: string) => CSSProperties;
}) {
  if (!block) {
    return (
      <aside aria-label="Activity block" className="rounded-lg border bg-card p-card text-sm text-muted-foreground">
        Choose a block for its staff, coach boats and boats
      </aside>
    );
  }
  const programs = [...new Set(block.activities.map((a) => programOf(a.offering_key)))];
  return (
    <aside aria-label="Activity block" className="grid gap-3 rounded-lg border bg-card p-card text-sm">
      <h4 className="font-medium">{block.name ?? programs.join(" and ")}</h4>
      <ul className="grid gap-1">
        {block.activities.map((a) => (
          <li key={a.key} className="grid gap-0.5">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                style={color(a.offering_key)}
                className="inline-block size-2.5 shrink-0 rounded-[3px] bg-(--program)"
              />
              {label(a.offering_key)}
            </span>
            <span className="pl-4 text-muted-foreground">
              {[
                timeSpan(a.start_time, a.end_time),
                a.setup_minutes ? `${a.setup_minutes} min setup` : null,
                a.putaway_minutes ? `${a.putaway_minutes} min put-away` : null,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          </li>
        ))}
      </ul>
      {block.parts.length > 0 ? (
        <div className="grid gap-1">
          <p>{sharers(programs)}</p>
          <ul className="flex flex-wrap gap-1">
            {block.parts.map((p) => (
              <li key={p} className="rounded-full border bg-muted px-2">
                {p}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-muted-foreground">No staff, coach boats or boats yet</p>
      )}
      {differs && (
        <p className="text-warning">
          Different from the usual: {differs.how}.
          {differs.usual.length > 0 && (
            <span className="text-muted-foreground"> Usually {differs.usual.join(", ")}.</span>
          )}
        </p>
      )}
    </aside>
  );
}
