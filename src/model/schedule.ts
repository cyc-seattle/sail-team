// A program area's schedule: its blocks, the patterns they repeat, and its weeks and days.
import type { PlanActivity } from "@cyc-seattle/platform/planning";
import { onWaterMinutes, type NumberedOffering } from "./reports.ts";

/** One activity on a program area's schedule. */
export interface ScheduledActivity {
  key: string;
  offering_key: string;
  kind: PlanActivity["kind"];
  start_time: string | null;
  end_time: string | null;
  setup_minutes: number | null;
  putaway_minutes: number | null;
  on_water_minutes: number;
}

/**
 * A block on a date: activities that share their staff, coach boats and boats, each written as people say it, such as
 * "3 Level 1 Instructors". An activity in no block has one of its own, with no name and nothing shared.
 */
export interface ScheduleBlock {
  key: string;
  date: string;
  name: string | null;
  activities: ScheduledActivity[];
  /** Its staff, then its coach boats and equipment, then its boats. */
  parts: string[];
}

type BlockRow = { id: string; key: string; date: string; name: string | null };
type ActivityRow = Pick<
  PlanActivity,
  | "id"
  | "key"
  | "offering_id"
  | "block_id"
  | "date"
  | "kind"
  | "uses_boats"
  | "start_time"
  | "end_time"
  | "on_water_minutes"
  | "setup_minutes"
  | "putaway_minutes"
>;

/** What each block shares, with the names of the levels, positions, equipment and boat classes it uses. */
export interface BlockParts {
  staff: { block_id: string; staff_level: string | null; position: string | null; count: number; pay: string | null }[];
  resources: { block_id: string; resource: string; quantity: number; hours: number | null }[];
  boats: { block_id: string; boat_class: string; count: number; sailor_owned: number | null }[];
}

const amount = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** A name as many: "Opti" → "Optis", "Level 3 Coach" → "Level 3 Coaches"; one already plural stays. */
const plural = (name: string) => (/s$/.test(name) ? name : /(ch|sh|x)$/.test(name) ? `${name}es` : `${name}s`);
/** A name as one: "RIBs" → "RIB". */
const singular = (name: string) => name.replace(/([^s])s$/, "$1");

/** A count of something, as people say it: "1 RIB", "3 Level 1 Instructors". */
export const counted = (n: number, name: string) => `${amount(n)} ${n === 1 ? singular(name) : plural(name)}`;

/**
 * A block's name without its date, or none when the rest only repeats names already on the page: "Morning dock
 * 2027-06-21" is "Morning dock", and "J-Pod 2027-03-02" is none. `known` is those names: the program area's, its
 * programs' and its offerings'.
 */
export function blockName(name: string, date: string, known: string[]): string | null {
  const own = name.split(date).join("").replace(/\s+/g, " ").trim();
  let rest = own;
  for (const k of [...known].sort((a, b) => b.length - a.length)) {
    rest = rest.split(k).join("");
  }
  return /[\p{L}\p{N}]/u.test(rest) ? own : null;
}

/** A program area's activities by date and start time, each in its block, with the offering keys they belong to. */
export function scheduleOf(
  blocks: BlockRow[],
  activities: ActivityRow[],
  parts: BlockParts,
  offeringKey: (offeringId: string) => string,
): ScheduleBlock[] {
  const scheduled = (a: ActivityRow): ScheduledActivity => ({
    key: a.key,
    offering_key: offeringKey(a.offering_id),
    kind: a.kind,
    start_time: a.start_time,
    end_time: a.end_time,
    setup_minutes: a.setup_minutes,
    putaway_minutes: a.putaway_minutes,
    on_water_minutes: onWaterMinutes(a),
  });
  const byStart = (a: ScheduledActivity, b: ScheduledActivity) =>
    (a.start_time ?? "").localeCompare(b.start_time ?? "") || a.offering_key.localeCompare(b.offering_key);
  // Each kind sorted, so blocks with the same parts list them alike, whatever order Directus returns them in.
  const partsOf = (id: string) => [
    ...parts.staff
      .filter((s) => s.block_id === id)
      .map((s) =>
        s.position
          ? `${counted(s.count, s.position)}${s.pay === "hourly" ? ", by the hour" : ""}`
          : counted(s.count, s.staff_level ?? "staff"),
      )
      .sort(),
    ...parts.resources
      .filter((r) => r.block_id === id)
      .map((r) => `${counted(r.quantity, r.resource)}${r.hours === null ? "" : `, ${amount(r.hours)} hours each`}`)
      .sort(),
    ...parts.boats
      .filter((b) => b.block_id === id)
      .map(
        (b) =>
          `${counted(b.count, b.boat_class)}${b.sailor_owned ? `, plus ${amount(b.sailor_owned)} sailors' own` : ""}`,
      )
      .sort(),
  ];
  const shared: ScheduleBlock[] = blocks.map((b) => ({
    key: b.key,
    date: b.date,
    name: b.name,
    activities: activities
      .filter((a) => a.block_id === b.id)
      .map(scheduled)
      .sort(byStart),
    parts: partsOf(b.id),
  }));
  const blockIds = new Set(blocks.map((b) => b.id));
  const alone: ScheduleBlock[] = activities
    .filter((a) => !a.block_id || !blockIds.has(a.block_id))
    .map((a) => ({ key: a.key, date: a.date, name: null, activities: [scheduled(a)], parts: [] }));
  const first = (b: ScheduleBlock) => b.activities[0]?.start_time ?? "";
  return [...shared, ...alone]
    .filter((b) => b.activities.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date) || first(a).localeCompare(first(b)) || a.key.localeCompare(b.key));
}

const day = (date: string) => new Date(`${date}T00:00:00Z`);
const isoOf = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (date: string, n: number) => isoOf(new Date(day(date).getTime() + n * 86_400_000));

/** The Monday of a date's week, as `YYYY-MM-DD`. */
export const weekOf = (date: string) => addDays(date, -((day(date).getUTCDay() + 6) % 7));

const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const time = (t: string) => clock.format(new Date(`1970-01-01T${t.slice(0, 5)}:00Z`));
/** A span of time of day: "9:00 AM–12:00 PM", or none when either end is missing. */
export const timeSpan = (start: string | null, end: string | null) =>
  start && end ? `${time(start)}–${time(end)}` : null;

const shortDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
/** A day without its year: "Jul 12". */
export const formatShortDay = (date: string) => shortDay.format(day(date));

const weekdayNames = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
/** The days of the week a pattern runs on: "Weekdays", "Tuesdays", or "Mondays and Wednesdays". */
export function weekdaysOf(dates: string[]): string {
  const days = [...new Set(dates.map((d) => day(d).getUTCDay()))].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (days.join() === "1,2,3,4,5") {
    return "Weekdays";
  }
  const names = days.map((d) => weekdayNames[d]!);
  return names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

/** Dates in order, as runs of the pattern's own consecutive dates: "Jul 12 to 16", "Jul 14". */
function dateRuns(dates: string[], all: string[]): string[] {
  const runs: string[][] = [];
  for (const d of dates) {
    const last = runs.at(-1);
    if (last && all.indexOf(d) === all.indexOf(last.at(-1)!) + 1) {
      last.push(d);
    } else {
      runs.push([d]);
    }
  }
  return runs.map((r) => {
    const [a, b] = [r[0]!, r.at(-1)!];
    if (a === b) {
      return formatShortDay(a);
    }
    const sameMonth = a.slice(0, 7) === b.slice(0, 7);
    return `${formatShortDay(a)} to ${sameMonth ? String(day(b).getUTCDate()) : formatShortDay(b)}`;
  });
}

/** One program in a pattern: its offerings' numbers, and its time of day. */
export interface PatternProgram {
  program: string;
  /** Such as "Guppies Weeks 1–8", or "J-Pod Spring and Fall". */
  offerings: string;
  /** Its time of day, or none when its days differ. */
  time: string | null;
}

/**
 * Blocks that repeat: those with the same name, or with no name, the same programs as others. It's written
 * once, with the staff, coach boats and boats most of its days share, and the days that differ.
 */
export interface Pattern {
  key: string;
  /** The blocks' own name, when they share one that says something, or else its programs'. */
  title: string;
  weekdays: string;
  first: string;
  last: string;
  days: number;
  programs: PatternProgram[];
  parts: string[];
  /** Days whose staff, coach boats or boats differ, such as "Jul 12 to 16: 11 Sailqubes". */
  exceptions: string[];
  /** Its blocks' keys, and the keys of those that differ, to mark their weeks and days. */
  blocks: string[];
  differing: string[];
}

/** A list of numbers as runs: [1, 2, 3, 5] → "1–3 and 5". */
function numberRuns(ns: number[]): string {
  const runs: string[] = [];
  let start = ns[0]!;
  for (let i = 1; i <= ns.length; i++) {
    if (ns[i] !== ns[i - 1]! + 1) {
      const end = ns[i - 1]!;
      runs.push(start === end ? `${start}` : `${start}–${end}`);
      start = ns[i]!;
    }
  }
  return runs.length <= 2 ? runs.join(" and ") : `${runs.slice(0, -1).join(", ")}, and ${runs.at(-1)}`;
}

/** Sessions as people list them: "Weeks 1–3 and 5" when they're numbered alike, or else "Spring and Fall". */
function sessionRuns(sessions: string[]): string {
  const numbered = sessions.map((s) => /^(.*\D)\s*(\d+)$/.exec(s));
  const prefix = numbered[0]?.[1];
  if (sessions.length > 1 && numbered.every((m) => m && m[1] === prefix)) {
    return `${plural(prefix!.trim())} ${numberRuns(numbered.map((m) => Number(m![2])).sort((a, b) => a - b))}`;
  }
  return sessions.length <= 2 ? sessions.join(" and ") : `${sessions.slice(0, -1).join(", ")}, and ${sessions.at(-1)}`;
}

/** The parts a block has that most of its pattern's don't, or what it lacks when it has nothing new. */
export function differences(parts: string[], usual: string[]): string {
  if (parts.length === 0) {
    return "no staff, coach boats or boats yet";
  }
  const added = parts.filter((p) => !usual.includes(p));
  return added.length > 0 ? added.join(", ") : `without ${usual.filter((p) => !parts.includes(p)).join(", ")}`;
}

/** The area's blocks as patterns, in the order they first run. */
export function patternsOf(blocks: ScheduleBlock[], offerings: Map<string, NumberedOffering>): Pattern[] {
  const programOf = (a: ScheduledActivity) => offerings.get(a.offering_key)?.program ?? a.offering_key;
  const times = (b: ScheduleBlock) =>
    b.activities.map((a) => `${programOf(a)}|${a.start_time}|${a.end_time}`).join(";");
  // A block with no name, such as a practice not in a block yet, joins named ones with the same programs and times, or
  // else others with its programs at any time, so Friday to Sunday practices are one.
  const named = new Map(blocks.filter((b) => b.name).map((b) => [times(b), b.name!]));
  const programsIn = (b: ScheduleBlock) => [...new Set(b.activities.map(programOf))].sort().join(";");
  const groups = new Map<string, ScheduleBlock[]>();
  for (const b of blocks) {
    const s = b.name ?? named.get(times(b)) ?? `|${programsIn(b)}`;
    groups.set(s, [...(groups.get(s) ?? []), b]);
  }
  return [...groups.entries()].map(([key, own]) => {
    const tally = new Map<string, { parts: string[]; n: number }>();
    for (const b of own) {
      const k = b.parts.join("|");
      tally.set(k, { parts: b.parts, n: (tally.get(k)?.n ?? 0) + 1 });
    }
    const usual = [...tally.values()].sort((a, b) => b.n - a.n)[0]!.parts;
    const dates = own.map((b) => b.date);
    const odd = own.filter((b) => b.parts.join("|") !== usual.join("|"));
    const byDifference = new Map<string, string[]>();
    for (const b of odd) {
      const d = differences(b.parts, usual);
      byDifference.set(d, [...(byDifference.get(d) ?? []), b.date]);
    }
    const programs = [...new Set(own.flatMap((b) => b.activities.map(programOf)))];
    return {
      key,
      title: own.find((b) => b.name)?.name ?? programs.join(" and "),
      weekdays: weekdaysOf(dates),
      first: dates[0]!,
      last: dates.at(-1)!,
      days: new Set(dates).size,
      programs: programs.map((program) => {
        const activities = own.flatMap((b) => b.activities).filter((a) => programOf(a) === program);
        const spans = new Set(activities.map((a) => timeSpan(a.start_time, a.end_time)));
        const sessions = [...new Set(activities.map((a) => offerings.get(a.offering_key)))]
          .filter((o) => o !== undefined)
          .sort((a, b) => a.starts_on.localeCompare(b.starts_on))
          .map((o) => o.label.slice(program.length + 1));
        return {
          program,
          offerings: sessions.length > 0 ? `${program} ${sessionRuns(sessions)}` : program,
          time: spans.size === 1 ? [...spans][0]! : null,
        };
      }),
      parts: usual,
      exceptions: [...byDifference.entries()].flatMap(([d, on]) => dateRuns(on, dates).map((r) => `${r}: ${d}`)),
      blocks: own.map((b) => b.key),
      differing: odd.map((b) => b.key),
    };
  });
}

/** The Mondays from the first block's week to the last's, with every week between. */
export function weeksOf(blocks: ScheduleBlock[]): string[] {
  if (blocks.length === 0) {
    return [];
  }
  const weeks: string[] = [];
  for (let w = weekOf(blocks[0]!.date); w <= weekOf(blocks.at(-1)!.date); w = addDays(w, 7)) {
    weeks.push(w);
  }
  return weeks;
}

/** A day's parts, for a column's two-line heading: "Jul" or "Tue" over "13". */
export const monthOf = (date: string) => day(date).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
export const weekdayOf = (date: string) => day(date).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
export const dayOf = (date: string) => String(day(date).getUTCDate());

/** A day in full, for its details: "Tuesday, July 13". */
export const longDay = (date: string) =>
  day(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });

/** A week's seven days, Monday to Sunday. */
export const weekDays = (week: string) => Array.from({ length: 7 }, (_, i) => addDays(week, i));

/** Positions as runs of consecutive ones, each its first and last: [1, 2, 3, 5] → [[1, 3], [5, 5]]. */
export function runsOf(positions: number[]): [number, number][] {
  const runs: [number, number][] = [];
  for (const p of [...new Set(positions)].sort((a, b) => a - b)) {
    const last = runs.at(-1);
    if (last && p === last[1] + 1) {
      last[1] = p;
    } else {
      runs.push([p, p]);
    }
  }
  return runs;
}

/** Spans in as few rows as fit, each row's in order, none overlapping. */
export function lanes<T extends { from: number; to: number }>(spans: T[]): T[][] {
  const out: T[][] = [];
  for (const span of [...spans].sort((a, b) => a.from - b.from)) {
    const lane = out.find((l) => l.at(-1)!.to < span.from);
    if (lane) {
      lane.push(span);
    } else {
      out.push([span]);
    }
  }
  return out;
}
