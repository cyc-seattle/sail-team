import type { CatalogDifference, ScheduleDay, SyncOffering } from "@cyc-seattle/platform/planning";
import { formatCents } from "./money.ts";

// The plan-to-catalog sync's review (cyc-seattle/platform#395): what the frozen plan in force lacks in the catalog,
// as rows a Catalog Writer ticks and applies, grouped by program area, then registration form, then offering.

/** One thing the sync would change in the catalog. Skipped plan activities are listed, but can't be ticked. */
export type SyncRow =
  | {
      kind: "field";
      id: string;
      offering_id: string;
      field: "starts_on" | "ends_on" | "capacity" | "price_cents";
      plan: string | number | null;
      catalog: string | number | null;
    }
  | { kind: "schedule"; id: string; offering_id: string; plan: ScheduleDay[]; catalog: ScheduleDay[] }
  | { kind: "add-activity"; id: string; offering_id: string; date: string; start_time: string; end_time: string }
  | {
      kind: "change-activity";
      id: string;
      activity_id: string;
      date: string;
      start_time: string;
      end_time: { catalog: string; plan: string };
      restore: boolean;
    }
  | { kind: "archive-activity"; id: string; activity_id: string; date: string; start_time: string }
  | { kind: "archive-offering"; id: string; offering_id: string; registrations: number }
  | { kind: "skipped"; id: string; date: string };

export interface SyncOfferingGroup {
  offering: SyncOffering;
  /** Its product's name, then its own, such as "Guppies Week 3". */
  label: string;
  rows: SyncRow[];
}

export interface SyncFormGroup {
  /** The registration form it's sold on; none for "No form yet". */
  form: { id: string; name: string } | null;
  offerings: SyncOfferingGroup[];
}

export interface SyncAreaGroup {
  /** The product's program area; none for a product in no area. */
  area: { id: string; name: string } | null;
  forms: SyncFormGroup[];
}

export interface SyncNames {
  products: { id: string; name: string; program_area_id: string | null }[];
  areas: { id: string; name: string }[];
  forms: { id: string; name: string }[];
}

/** An offering's name after its product's, unless it already starts with it. */
export function offeringLabel(offering: Pick<SyncOffering, "name" | "product_id">, names: SyncNames): string {
  const product = names.products.find((p) => p.id === offering.product_id)?.name;
  const own = offering.name ?? product ?? "";
  if (product === undefined || own === product || own.startsWith(`${product} `)) return own;
  return `${product} ${own}`;
}

/** The difference as rows, by offering. */
function rowsOf(difference: Exclude<CatalogDifference, { refused: "draft" }>): Map<SyncOffering, SyncRow[]> {
  const rows = new Map<SyncOffering, SyncRow[]>();
  for (const d of difference.offerings) {
    const id = d.offering.id;
    rows.set(d.offering, [
      ...d.fields.map((f): SyncRow => ({ kind: "field", id: `${id}:${f.field}`, offering_id: id, ...f })),
      ...(d.schedule ? [{ kind: "schedule", id: `${id}:schedule`, offering_id: id, ...d.schedule } as SyncRow] : []),
      ...d.adds.map((a): SyncRow => ({
        kind: "add-activity",
        id: `${id}:add:${a.date}:${a.start_time}`,
        offering_id: id,
        date: a.date,
        start_time: a.start_time,
        end_time: a.end_time,
      })),
      ...d.changes.map((c): SyncRow => ({ kind: "change-activity", id: `${id}:change:${c.activity_id}`, ...c })),
      ...d.archives.map((a): SyncRow => ({ kind: "archive-activity", id: `${id}:archive:${a.activity_id}`, ...a })),
      ...d.skipped.map((s): SyncRow => ({ kind: "skipped", id: `${id}:skip:${s.plan_activity_id}`, date: s.date })),
    ]);
  }
  for (const o of difference.archives) {
    rows.set(o, [
      { kind: "archive-offering", id: `${o.id}:archive`, offering_id: o.id, registrations: o.confirmed_count },
    ]);
  }
  return rows;
}

const byName = <T extends { name: string } | null>(a: T, b: T) =>
  a === null ? 1 : b === null ? -1 : a.name.localeCompare(b.name);

/** The difference grouped by program area, then registration form ("No form yet" last), then offering. */
export function syncGroups(
  difference: Exclude<CatalogDifference, { refused: "draft" }>,
  names: SyncNames,
): SyncAreaGroup[] {
  const areas = new Map<string, SyncAreaGroup>();
  for (const [offering, rows] of rowsOf(difference)) {
    const product = names.products.find((p) => p.id === offering.product_id);
    const area = names.areas.find((a) => a.id === product?.program_area_id) ?? null;
    const areaGroup = areas.get(area?.id ?? "") ?? { area, forms: [] };
    areas.set(area?.id ?? "", areaGroup);
    const form = names.forms.find((f) => f.id === offering.registration_form_id) ?? null;
    let formGroup = areaGroup.forms.find((g) => g.form?.id === form?.id);
    if (formGroup === undefined) {
      formGroup = { form, offerings: [] };
      areaGroup.forms.push(formGroup);
    }
    formGroup.offerings.push({ offering, label: offeringLabel(offering, names), rows });
  }
  const groups = [...areas.values()].sort((a, b) => byName(a.area, b.area));
  for (const g of groups) {
    g.forms.sort((a, b) => byName(a.form, b.form));
    for (const f of g.forms) {
      // By first day, with an offering that has none last, then by name.
      f.offerings.sort(
        (a, b) =>
          (a.offering.starts_on ?? "9999").localeCompare(b.offering.starts_on ?? "9999") ||
          a.label.localeCompare(b.label),
      );
    }
  }
  return groups;
}

/** Whether a row can be applied: a skipped plan activity can't. */
export const tickable = (row: SyncRow) => row.kind !== "skipped";

/** The rows ticked to start with: all but an archive of an offering with registrations, and the skipped. */
export function ticked(groups: SyncAreaGroup[]): Set<string> {
  const rows = groups.flatMap((a) => a.forms.flatMap((f) => f.offerings.flatMap((o) => o.rows)));
  return new Set(
    rows.filter((r) => tickable(r) && !(r.kind === "archive-offering" && r.registrations > 0)).map((r) => r.id),
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A time as people read it, such as 4:15 pm. */
export function clock(time: string): string {
  const [h, m] = time.split(":").map(Number) as [number, number];
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Weekdays as people read them: three or more in a row as a range, such as Mon–Fri, and the rest joined by &. */
function dayRuns(weekdays: number[]): string {
  const runs: number[][] = [];
  for (const w of weekdays) {
    const last = runs.at(-1);
    if (last && last.at(-1) === w - 1) last.push(w);
    else runs.push([w]);
  }
  return runs
    .flatMap((run) =>
      run.length >= 3 ? [`${WEEKDAYS[run[0]! - 1]}–${WEEKDAYS[run.at(-1)! - 1]}`] : run.map((w) => WEEKDAYS[w - 1]),
    )
    .join(" & ");
}

/** A schedule as people read it, such as "Tue & Thu 4:15–7:30 pm" or "Mon–Fri 9 am–3 pm". Days at the same times go together. */
export function scheduleText(days: ScheduleDay[]): string {
  if (days.length === 0) return "No schedule";
  const byTimes = new Map<string, number[]>();
  for (const d of [...days].sort((a, b) => a.weekday - b.weekday)) {
    const key = `${clock(d.start_time)}–${clock(d.end_time)}`;
    byTimes.set(key, [...(byTimes.get(key) ?? []), d.weekday]);
  }
  return [...byTimes].map(([times, weekdays]) => `${dayRuns(weekdays)} ${times}`).join(", ");
}

/** A date as people read it, such as Mon, Jun 21. */
export function day(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const FIELD_NAMES = { starts_on: "First day", ends_on: "Last day", capacity: "Capacity", price_cents: "Price" };

function value(field: keyof typeof FIELD_NAMES, v: string | number | null): string {
  if (v === null) return "none";
  if (field === "price_cents") return formatCents(Number(v), Number(v) % 100 === 0);
  if (field === "capacity") return `${v} sailors`;
  return day(String(v));
}

/** What a row does, in words: what it does, and what to. */
export function describeRow(row: SyncRow): { action: string; what: string } {
  switch (row.kind) {
    case "field":
      return {
        action: "Change",
        what: `${FIELD_NAMES[row.field]}: ${value(row.field, row.catalog)} to ${value(row.field, row.plan)}`,
      };
    case "schedule":
      return { action: "Change", what: `Schedule: ${scheduleText(row.catalog)} to ${scheduleText(row.plan)}` };
    case "add-activity":
      return { action: "Add", what: `${day(row.date)}, ${clock(row.start_time)}–${clock(row.end_time)}` };
    case "change-activity":
      return row.restore
        ? { action: "Bring back", what: `${day(row.date)}, ${clock(row.start_time)}–${clock(row.end_time.plan)}` }
        : {
            action: "Change",
            what: `${day(row.date)}, ${clock(row.start_time)}: ends at ${clock(row.end_time.catalog)} to ${clock(row.end_time.plan)}`,
          };
    case "archive-activity":
      return { action: "Archive", what: `${day(row.date)}, ${clock(row.start_time)}` };
    case "archive-offering":
      return {
        action: "Archive",
        what:
          row.registrations > 0
            ? `The offering, which the plan in force doesn't plan. ${row.registrations} registered.`
            : "The offering, which the plan in force doesn't plan.",
      };
    case "skipped":
      return { action: "Skipped", what: `${day(row.date)}: no start or end time in the plan` };
  }
}
