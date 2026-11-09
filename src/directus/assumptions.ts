import type {
  PlanBonusOwner,
  PlanOffering,
  PlanRates,
  PlanResource,
  PlanRevenueCharge,
  PlanSalariedPosition,
  PlanStaffLevel,
} from "@cyc-seattle/platform/planning";
import { queryOptions } from "@tanstack/react-query";
import { plannedEnrollment, type Assumptions, type OperationsAssumptions } from "@/model/assumptions";
import type { Member } from "@/model/financial-plans";
import { engineRows } from "@/model/plan-data";
import { readAll } from "./plans.ts";

/** A table's rows in one plan copy, decimals as numbers. */
async function rowsOf<T>(table: string, version: string, fields = ["*"]): Promise<T[]> {
  return engineRows(table, await readAll(table, { version_id: { _eq: version } }, fields)) as T[];
}

async function operationsAssumptions(version: string): Promise<OperationsAssumptions> {
  const [rates, staffLevels, positions, charges, resources, boatRates, bonuses] = await Promise.all([
    rowsOf<PlanRates>("plan_rates", version),
    rowsOf<PlanStaffLevel>("plan_staff_levels", version),
    rowsOf<PlanSalariedPosition>("plan_salaried_positions", version),
    rowsOf<PlanRevenueCharge>("plan_revenue_charges", version),
    rowsOf<PlanResource>("plan_resources", version),
    rowsOf<{ key: string; boat_class_id: { name: string }; maintenance_per_boat_hour_cents: number }>(
      "plan_boat_rates",
      version,
      ["key", "boat_class_id.name", "maintenance_per_boat_hour_cents"],
    ),
    rowsOf<PlanBonusOwner>("plan_bonus_owners", version),
  ]);
  const byName = <T extends { name: string }>(rows: T[]) => [...rows].sort((a, b) => a.name.localeCompare(b.name));
  return {
    rates: rates[0] ?? null,
    staffLevels: byName(staffLevels),
    positions: byName(positions),
    charges: byName(charges),
    resources: byName(resources),
    boatRates: boatRates
      .map((b) => ({ ...b, boat_class: b.boat_class_id.name }))
      .sort((a, b) => a.boat_class.localeCompare(b.boat_class)),
    bonuses: [...bonuses].sort((a, b) => a.role_name.localeCompare(b.role_name)),
  };
}

/**
 * A plan's assumptions, read from the copy its Financial Plan holds, which never changes once saved. `operations` is
 * the Operations Plan's copy, which sets the coaches' pay levels. Each offering's days come from its results, so
 * they're left for the page to fill in.
 */
export const assumptionsQuery = (member: Member, operations: string | null) =>
  queryOptions({
    queryKey: ["assumptions", member.version_id, operations],
    queryFn: async (): Promise<Assumptions> => {
      const [offerings, levels, ops] = await Promise.all([
        rowsOf<PlanOffering & { product_id: { name: string } }>("plan_offerings", member.version_id, [
          "*",
          "product_id.name",
        ]),
        operations ? rowsOf<PlanStaffLevel>("plan_staff_levels", operations, ["key", "name"]) : [],
        member.kind === "operations" ? operationsAssumptions(member.version_id) : null,
      ]);
      const levelName = new Map(levels.map((l) => [l.key, l.name]));
      return {
        offerings: offerings
          .map((o) => ({
            ...o,
            program: o.product_id.name,
            coach_level: (o.coach_level_key && levelName.get(o.coach_level_key)) ?? null,
            enrollment: plannedEnrollment(o),
            days: null,
          }))
          .sort((a, b) => a.starts_on.localeCompare(b.starts_on) || a.name.localeCompare(b.name)),
        operations: ops,
      };
    },
  });
