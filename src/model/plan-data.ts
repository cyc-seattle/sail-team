import type { PlanData } from "@cyc-seattle/platform/planning";

// What the planning engine reads to calculate a draft, gathered the way platform's saved-versions hook gathers it
// when a version is saved (cyc-seattle/platform#91), so a draft here adds up the way it would if saved now.

/** The catalog the engine reads as it is now, shared by every version. */
export const catalogTables = [
  "products",
  "program_areas",
  "accounts",
  "qualifications",
  "qualification_covers",
  "boat_classes",
  "resource_kinds",
] as const;

/** Each table of a version's rows, which the engine reads for every version in the set. */
export const versionTables = [
  "plan_offerings",
  "plan_offering_boat_classes",
  "plan_trips",
  "plan_activities",
  "plan_activity_resources",
  "plan_labor_lines",
  "plan_budget_lines",
  "plan_rates",
  "plan_revenue_charges",
  "plan_staff_levels",
  "plan_salaried_positions",
  "plan_salaried_bookings",
  "plan_resources",
  "plan_boat_rates",
  "plan_activity_block_rules",
  "plan_pools",
  "plan_bonus_owners",
  "plan_bonus_owner_products",
  "plan_closed_dates",
] as const;

type Loaded =
  | (typeof catalogTables)[number]
  | (typeof versionTables)[number]
  | "fiscal_year"
  | "organization"
  | "organization_cost_accounts"
  | "rib_resource_kind_id"
  | "plans"
  | "plan_versions";

/**
 * Fails the typecheck, naming the field, when the engine reads something the loader doesn't: a draft calculated
 * without a table, such as its closed dates, silently loses what that table holds.
 */
export const everyInputLoaded: Exclude<keyof PlanData, Loaded> extends never ? true : Exclude<keyof PlanData, Loaded> =
  true;

/**
 * The fields Directus returns as strings, so no precision is lost, and the engine reads as numbers. From
 * platform's schemas/*.yaml: every `decimal` field in the tables above.
 */
export const decimalFields: Record<string, readonly string[]> = {
  plan_offerings: ["fill_rate", "sailors_per_coach", "ribs_per_coach", "byob_share", "cogs_rate"],
  plan_offering_boat_classes: ["share"],
  plan_activity_resources: ["quantity", "hours"],
  plan_labor_lines: ["hours"],
  plan_rates: ["payroll_tax_rate"],
  plan_revenue_charges: ["rate"],
  plan_salaried_positions: ["ga_share"],
  plan_salaried_bookings: ["hours"],
  plan_bonus_owners: ["bonus_rate"],
  boat_classes: ["footprint_sq_ft"],
};

type Row = Record<string, unknown>;

/** Rows as the engine reads them: decimals as numbers. Dates and JSON come from Directus as the engine wants them. */
export function engineRows(table: string, rows: Row[]): Row[] {
  const decimals = decimalFields[table];
  if (!decimals) {
    return rows;
  }
  return rows.map((row) => {
    const out = { ...row };
    for (const field of decimals) {
      if (out[field] !== null && out[field] !== undefined) {
        out[field] = Number(out[field]);
      }
    }
    return out;
  });
}

export interface PlanRef {
  id: string;
  kind: "program_area" | "operations";
  organization_id: string;
  fiscal_year: number;
  program_area_id: string | null;
}

export interface VersionRef {
  id: string;
  plan_id: string;
  operations_version_id: string | null;
}

/** The latest activation for each program area, for the plan's organization and year. */
export interface AreaActivation {
  program_area_id: string;
  version_id: string;
}

/**
 * The versions the engine calculates `version` with: the club's plan as it stands. That's the Operations Plan version
 * (the version itself, for an Operations Plan), and each program area's active version, with the version's own in
 * place of its area's.
 */
export function versionSet(plan: PlanRef, version: VersionRef, active: AreaActivation[]): string[] {
  const operations = plan.kind === "operations" ? version.id : version.operations_version_id;
  const areas = active.filter((a) => plan.kind === "operations" || a.program_area_id !== plan.program_area_id);
  const ids = [operations, ...areas.map((a) => a.version_id)];
  if (plan.kind === "program_area") {
    ids.push(version.id);
  }
  return [...new Set(ids.filter((id): id is string => id !== null))];
}

export interface ActivationRow {
  version_id: string;
  sequence: number;
  plan: { kind: "program_area" | "operations"; program_area_id: string | null };
}

/**
 * The active version for each program area, and the Operations Plan's: for each, the activation with the highest
 * sequence, since activating another plan's version replaces it.
 */
export function latestActivations(rows: ActivationRow[]): { areas: AreaActivation[]; operations: string | null } {
  const latest = new Map<string, ActivationRow>();
  for (const row of rows) {
    const slot = row.plan.kind === "operations" ? "operations" : `area:${row.plan.program_area_id}`;
    const seen = latest.get(slot);
    if (!seen || row.sequence > seen.sequence) {
      latest.set(slot, row);
    }
  }
  const areas = [...latest.entries()]
    .filter(([slot]) => slot.startsWith("area:"))
    .map(([, row]) => ({ program_area_id: row.plan.program_area_id!, version_id: row.version_id }));
  return { areas, operations: latest.get("operations")?.version_id ?? null };
}
