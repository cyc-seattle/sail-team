import type {
  PlanActivity,
  PlanBonusOwner,
  PlanOffering,
  PlanProgram,
  PlanRates,
  PlanResource,
  PlanRevenueCharge,
  PlanSalariedPosition,
  PlanStaffLevel,
} from "@cyc-seattle/platform/planning";
import { queryOptions } from "@tanstack/react-query";
import { plannedEnrollment, type Bonus, type OperationsAssumptions } from "@/model/assumptions";
import { isSaved, type FinancialPlanSummary, type Member } from "@/model/financial-plans";
import { engineRows } from "@/model/plan-data";
import { reportKey, reportOffering, type ProgramSettings, type ReportOffering } from "@/model/reports";
import { readAll } from "./plans.ts";

/** A table's rows in some plan copies, decimals as numbers. */
async function rowsOf<T>(table: string, versions: string[], fields = ["*"]): Promise<T[]> {
  if (versions.length === 0) {
    return [];
  }
  return engineRows(table, await readAll(table, { version_id: { _in: versions } }, fields)) as T[];
}

const byName = <T extends { name: string }>(rows: T[]) => [...rows].sort((a, b) => a.name.localeCompare(b.name));

type BonusRow = Pick<PlanBonusOwner, "key" | "role_name" | "bonus_rate" | "basis" | "position_key">;
const asBonus = ({ key, role_name, bonus_rate, basis }: BonusRow): Bonus => ({
  key,
  role_name,
  bonus_rate,
  basis: basis ?? null,
});

/** The Operations Plan's rates for the year, with every plan's bonuses on the positions they pay. */
async function operationsAssumptions(version: string, versions: string[]): Promise<OperationsAssumptions> {
  const [rates, staffLevels, positions, charges, resources, boatRates, bonuses] = await Promise.all([
    rowsOf<PlanRates>("plan_rates", [version]),
    rowsOf<PlanStaffLevel>("plan_staff_levels", [version]),
    rowsOf<PlanSalariedPosition>("plan_salaried_positions", [version]),
    rowsOf<PlanRevenueCharge>("plan_revenue_charges", [version]),
    rowsOf<PlanResource>("plan_resources", [version]),
    rowsOf<{
      key: string;
      boat_class_id: { name: string; sailors_per_boat: number | null };
      maintenance_per_boat_hour_cents: number;
      quantity: number | null;
    }>(
      "plan_boat_rates",
      [version],
      ["key", "boat_class_id.name", "boat_class_id.sailors_per_boat", "maintenance_per_boat_hour_cents", "quantity"],
    ),
    rowsOf<BonusRow>("plan_bonus_owners", versions, ["key", "role_name", "bonus_rate", "basis", "position_key"]),
  ]);
  const paying = (key: string | null) =>
    bonuses
      .filter((b) => (b.position_key ?? null) === key)
      .map(asBonus)
      .sort((a, b) => a.role_name.localeCompare(b.role_name));
  const positionKeys = new Set(positions.map((p) => p.key));
  return {
    rates: rates[0] ?? null,
    staffLevels: byName(staffLevels),
    positions: byName(positions).map((p) => ({ ...p, bonuses: paying(p.key) })),
    charges: byName(charges),
    resources: byName(resources),
    boatRates: boatRates
      .map(({ boat_class_id, ...b }) => ({
        ...b,
        boat_class: boat_class_id.name,
        sailors_per_boat: boat_class_id.sailors_per_boat,
      }))
      .sort((a, b) => a.boat_class.localeCompare(b.boat_class)),
    // A bonus naming a position that isn't there pays no one, so it's listed with the rest that pay no position.
    bonuses: bonuses
      .filter((b) => !b.position_key || !positionKeys.has(b.position_key))
      .map(asBonus)
      .sort((a, b) => a.role_name.localeCompare(b.role_name)),
  };
}

/** What a Financial Plan's reports show besides its results: what planners entered in its plan copies. */
export interface PlanInputs {
  /** Each plan copy's rules, by its report's key; the Operations Plan's under `rates`, for Assumptions. */
  rules: Record<string, string | null>;
  /** Each program area's offerings, by its report's key. */
  offerings: Record<string, ReportOffering[]>;
  /** What each of the Operations Plan's offerings sells, such as boat storage. */
  products: { key: string; product: string }[];
  /** Each program area's programs' settings, by its report's key. */
  programs: Record<string, ProgramSettings[]>;
  operations: OperationsAssumptions | null;
}

/** A Financial Plan's inputs, read from the copies it holds, which never change once it's saved. */
export const planInputsQuery = (set: Pick<FinancialPlanSummary, "id" | "status">, members: Member[]) =>
  queryOptions({
    queryKey: ["plan-inputs", set.id, members.map((m) => m.version_id).join(",")],
    queryFn: async (): Promise<PlanInputs> => {
      const versions = members.map((m) => m.version_id);
      const ops = members.find((m) => m.kind === "operations");
      const [copies, offerings, activities, programs, operations] = await Promise.all([
        versions.length
          ? readAll<{ id: string; rules: string | null }>("plan_versions", { id: { _in: versions } }, ["id", "rules"])
          : [],
        rowsOf<PlanOffering & { product_id: { name: string } }>("plan_offerings", versions, ["*", "product_id.name"]),
        rowsOf<PlanActivity>("plan_activities", versions, [
          "offering_id",
          "date",
          "kind",
          "uses_boats",
          "start_time",
          "end_time",
          "on_water_minutes",
        ]),
        rowsOf<PlanProgram & { product_id: { name: string } }>("plan_programs", versions, [
          "version_id",
          "product_id.name",
          "staff_level_key",
          "sailors_per_coach",
          "rules",
        ]),
        ops ? operationsAssumptions(ops.version_id, versions) : null,
      ]);
      const levelName = new Map(operations?.staffLevels.map((l) => [l.key, l.name]));
      const keyOf = new Map(members.map((m) => [m.version_id, m.kind === "operations" ? "rates" : reportKey(m)]));
      const byReport = <T>(rows: (T & { version_id: string })[]) => {
        const out: Record<string, T[]> = {};
        for (const row of rows) {
          (out[keyOf.get(row.version_id) ?? ""] ??= []).push(row);
        }
        return out;
      };
      return {
        rules: Object.fromEntries(copies.map((c) => [keyOf.get(c.id) ?? c.id, c.rules])),
        offerings: byReport(
          offerings
            .filter((o) => o.version_id !== ops?.version_id)
            .map((o) => ({
              version_id: o.version_id,
              ...reportOffering(
                { ...o, program: o.product_id.name, estimated: plannedEnrollment(o) ?? 0 },
                activities.filter((a) => a.offering_id === o.id),
              ),
            })),
        ),
        products: offerings
          .filter((o) => o.version_id === ops?.version_id)
          .map((o) => ({ key: o.key, product: o.product_id.name })),
        programs: byReport(
          byName(
            programs.map((p) => ({
              version_id: p.version_id,
              name: p.product_id.name,
              staff_level: (p.staff_level_key && levelName.get(p.staff_level_key)) ?? null,
              sailors_per_coach: p.sailors_per_coach,
              rules: p.rules,
            })),
          ),
        ),
        operations,
      };
    },
    // A draft's inputs change wherever its plans are changed, as its numbers do.
    refetchInterval: isSaved(set) ? false : 5_000,
  });
