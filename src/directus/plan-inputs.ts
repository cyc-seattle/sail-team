import type {
  PlanActivity,
  PlanBonusOwner,
  PlanBlockBoats,
  PlanBlockResource,
  PlanBlockStaff,
  PlanBudgetLine,
  PlanClosedDate,
  PlanLaborLine,
  PlanOffering,
  PlanProgram,
  PlanRates,
  PlanResource,
  PlanRevenueCharge,
  PlanSalariedPosition,
  PlanStaffLevel,
  PlanTrip,
} from "@cyc-seattle/platform/planning";
import { queryOptions } from "@tanstack/react-query";
import {
  plannedEnrollment,
  type Bonus,
  type FixedCost,
  type OperationsAssumptions,
  type StaffTime,
} from "@/model/assumptions";
import { isSaved, type FinancialPlanSummary, type Member } from "@/model/financial-plans";
import { engineRows } from "@/model/plan-data";
import {
  reportKey,
  reportName,
  reportOffering,
  type ProgramSettings,
  type ReportOffering,
  type Trip,
} from "@/model/reports";
import { blockName, scheduleOf, type BlockParts, type ScheduleBlock } from "@/model/schedule";
import { readAll } from "./plans.ts";

/** A table's rows in some plan copies, decimals as numbers. */
async function rowsOf<T>(table: string, versions: string[], fields = ["*"]): Promise<T[]> {
  if (versions.length === 0) {
    return [];
  }
  return engineRows(table, await readAll(table, { version_id: { _in: versions } }, fields)) as T[];
}

const byName = <T extends { name: string }>(rows: T[]) => [...rows].sort((a, b) => a.name.localeCompare(b.name));

type Account = { number: string | null; name: string };
const accountFields = ["account_id.number", "account_id.name"];

/** What a cost or labor line is charged to, by name: a pool, an offering, a product, a program area, or CSC. */
type ChargedTo = (row: { cost_center_type: string; cost_center_key: string | null }) => string;

type CostRow<T> = T & {
  version_id: string;
  cost_center_type: string;
  cost_center_key: string | null;
  account_id: Account;
};

type BudgetRow = CostRow<Pick<PlanBudgetLine, "key" | "name" | "amount_cents" | "excluded_from_mtdc" | "note">> & {
  account_id: { type: string };
};
type LaborRow = CostRow<Pick<PlanLaborLine, "key" | "name" | "staff_level_key" | "hours" | "note">>;

type BonusRow = Pick<PlanBonusOwner, "id" | "key" | "role_name" | "bonus_rate" | "basis" | "position_key"> & {
  account_id: Account;
};

/** The Operations Plan's rates for the year, with every plan's bonuses on the positions they pay. */
async function operationsAssumptions(
  version: string,
  versions: string[],
): Promise<Omit<OperationsAssumptions, "fixedCosts" | "staffTime">> {
  const [rates, staffLevels, positions, charges, resources, boatRates, bonuses, bonusProducts, bookings, closed] =
    await Promise.all([
      rowsOf<PlanRates & { rib_resource_kind_id: { name: string } | null }>(
        "plan_rates",
        [version],
        ["*", "rib_resource_kind_id.name"],
      ),
      rowsOf<PlanStaffLevel>("plan_staff_levels", [version]),
      rowsOf<PlanSalariedPosition & { remainder_pool_id: { name: string } | null }>(
        "plan_salaried_positions",
        [version],
        ["*", "remainder_pool_id.name"],
      ),
      rowsOf<PlanRevenueCharge & { account_id: Account }>("plan_revenue_charges", [version], ["*", ...accountFields]),
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
      rowsOf<BonusRow>("plan_bonus_owners", versions, [
        "id",
        "key",
        "role_name",
        "bonus_rate",
        "basis",
        "position_key",
        ...accountFields,
      ]),
      rowsOf<{ bonus_owner_id: string; product_id: { name: string } }>("plan_bonus_owner_products", versions, [
        "bonus_owner_id",
        "product_id.name",
      ]),
      rowsOf<{
        key: string;
        position_id: { name: string };
        product_id: { name: string } | null;
        program_area_id: { name: string } | null;
        hours: number;
      }>(
        "plan_salaried_bookings",
        [version],
        ["key", "position_id.name", "product_id.name", "program_area_id.name", "hours"],
      ),
      rowsOf<PlanClosedDate>("plan_closed_dates", [version], ["key", "date", "name"]),
    ]);
  const positionName = new Map(positions.map((p) => [p.key, p.name]));
  const all: Bonus[] = bonuses
    .map((b) => ({
      key: b.key,
      role_name: b.role_name,
      bonus_rate: b.bonus_rate,
      basis: b.basis ?? null,
      products: bonusProducts
        .filter((p) => p.bonus_owner_id === b.id)
        .map((p) => p.product_id.name)
        .sort((x, y) => x.localeCompare(y)),
      account: { number: b.account_id.number, name: b.account_id.name },
      // A bonus naming a position that isn't there pays no one.
      position: (b.position_key && positionName.get(b.position_key)) ?? null,
    }))
    .sort((a, b) => a.role_name.localeCompare(b.role_name));
  const paying = (name: string) => all.filter((b) => b.position === name);
  const rate = rates[0];
  return {
    rates: rate
      ? {
          payroll_tax_rate: rate.payroll_tax_rate,
          lodging_per_night_cents: rate.lodging_per_night_cents,
          mileage_rate_cents: rate.mileage_rate_cents,
          rib_kind: rate.rib_resource_kind_id?.name ?? null,
        }
      : null,
    staffLevels: byName(staffLevels),
    positions: byName(positions).map(({ remainder_pool_id, ...p }) => ({
      ...p,
      hourly_coaching_rate_cents: p.hourly_coaching_rate_cents ?? null,
      remainder_pool: remainder_pool_id?.name ?? null,
      bonuses: paying(p.name),
    })),
    charges: byName(charges).map(({ account_id, ...c }) => ({
      ...c,
      account: { number: account_id.number, name: account_id.name },
    })),
    resources: byName(resources),
    boatRates: boatRates
      .map(({ boat_class_id, ...b }) => ({
        ...b,
        boat_class: boat_class_id.name,
        sailors_per_boat: boat_class_id.sailors_per_boat,
      }))
      .sort((a, b) => a.boat_class.localeCompare(b.boat_class)),
    bonuses: all,
    salariedHours: bookings
      .map((b) => ({
        key: b.key,
        position: b.position_id.name,
        booked_to: b.product_id?.name ?? b.program_area_id?.name ?? "",
        hours: b.hours,
      }))
      .sort((a, b) => a.position.localeCompare(b.position) || a.booked_to.localeCompare(b.booked_to)),
    closedDays: [...closed].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/** The program areas' blocks, and what each shares. */
async function blockRows(versions: string[]) {
  const [blocks, staff, resources, boats] = await Promise.all([
    rowsOf<{ id: string; key: string; version_id: string; date: string; name: string }>(
      "plan_activity_blocks",
      versions,
      ["id", "key", "version_id", "date", "name"],
    ),
    rowsOf<PlanBlockStaff>("plan_block_staff", versions, [
      "block_id",
      "staff_level_key",
      "position_key",
      "count",
      "pay",
    ]),
    rowsOf<PlanBlockResource>("plan_block_resources", versions, ["block_id", "resource_key", "quantity", "hours"]),
    rowsOf<Omit<PlanBlockBoats, "boat_class_id"> & { boat_class_id: { name: string } }>("plan_block_boats", versions, [
      "block_id",
      "boat_class_id.name",
      "count",
      "sailor_owned",
    ]),
  ]);
  return { blocks, staff, resources, boats };
}

/** The names of what a cost can be charged to besides a pool or an offering, from the catalog. */
async function costCenterNames() {
  const [products, areas, organizations] = await Promise.all([
    readAll<{ id: string; name: string }>("products", undefined, ["id", "name"]),
    readAll<{ id: string; name: string }>("program_areas", undefined, ["id", "name"]),
    readAll<{ name: string }>("organizations", undefined, ["name"]),
  ]);
  const named = (rows: { id: string; name: string }[]) => new Map(rows.map((r) => [r.id, r.name]));
  return { products: named(products), areas: named(areas), organization: organizations[0]?.name ?? "" };
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
  /** Each program area's blocks by date, by its report's key. */
  schedule: Record<string, ScheduleBlock[]>;
  /** Each program area's regatta trips, by its report's key. */
  trips: Record<string, Trip[]>;
  /** Each program area's own fixed costs and staff time, by its report's key. */
  fixedCosts: Record<string, FixedCost[]>;
  staffTime: Record<string, StaffTime[]>;
  /** Each capital item's note and link, by its key. */
  capital: Record<string, { note: string | null; link: string | null }>;
}

/** A Financial Plan's inputs, read from the copies it holds, which never change once it's saved. */
export const planInputsQuery = (set: Pick<FinancialPlanSummary, "id" | "status">, members: Member[]) =>
  queryOptions({
    queryKey: ["plan-inputs", set.id, members.map((m) => m.version_id).join(",")],
    queryFn: async (): Promise<PlanInputs> => {
      const versions = members.map((m) => m.version_id);
      const ops = members.find((m) => m.kind === "operations");
      const [
        copies,
        offerings,
        activities,
        programs,
        operations,
        budget,
        labor,
        pools,
        catalog,
        trips,
        blocks,
        capitalItems,
      ] = await Promise.all([
        versions.length
          ? readAll<{ id: string; rules: string | null }>("plan_versions", { id: { _in: versions } }, ["id", "rules"])
          : [],
        rowsOf<PlanOffering & { product_id: { name: string } }>("plan_offerings", versions, ["*", "product_id.name"]),
        rowsOf<PlanActivity>("plan_activities", versions, [
          "id",
          "key",
          "version_id",
          "block_id",
          "setup_minutes",
          "putaway_minutes",
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
        rowsOf<BudgetRow>("plan_budget_lines", versions, [
          "version_id",
          "key",
          "name",
          "cost_center_type",
          "cost_center_key",
          "amount_cents",
          "excluded_from_mtdc",
          "note",
          ...accountFields,
          "account_id.type",
        ]),
        rowsOf<LaborRow>("plan_labor_lines", versions, [
          "version_id",
          "key",
          "name",
          "cost_center_type",
          "cost_center_key",
          "staff_level_key",
          "hours",
          "note",
          ...accountFields,
        ]),
        rowsOf<{ key: string; name: string }>("plan_pools", versions, ["key", "name"]),
        costCenterNames(),
        rowsOf<PlanTrip>("plan_trips", versions, [
          "key",
          "version_id",
          "offering_id",
          "name",
          "nights",
          "airfare_cents",
          "miles",
        ]),
        blockRows(versions),
        rowsOf<{ key: string; note: string | null; link: string | null }>(
          "plan_capital_items",
          ops ? [ops.version_id] : [],
          ["key", "note", "link"],
        ),
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
      const named = (rows: { key: string; name: string }[]) => new Map(rows.map((r) => [r.key, r.name]));
      const centers: Record<string, Map<string, string>> = {
        pool: named(pools),
        offering: named(offerings),
        product: catalog.products,
        program_area: catalog.areas,
      };
      const chargedTo: ChargedTo = ({ cost_center_type: type, cost_center_key: key }) =>
        type === "org" ? catalog.organization : ((key && centers[type]?.get(key)) ?? key ?? "");
      const fixedCosts = byName(budget).map((l): FixedCost & { version_id: string } => ({
        version_id: l.version_id,
        key: l.key,
        name: l.name,
        amount_cents: l.amount_cents,
        excluded_from_mtdc: l.excluded_from_mtdc,
        note: l.note,
        account: { number: l.account_id.number, name: l.account_id.name },
        charged_to: chargedTo(l),
        revenue: l.account_id.type === "revenue",
      }));
      const staffTime = byName(labor).map((l): StaffTime & { version_id: string } => ({
        version_id: l.version_id,
        key: l.key,
        name: l.name,
        hours: l.hours,
        note: l.note,
        staff_level: levelName.get(l.staff_level_key) ?? null,
        account: { number: l.account_id.number, name: l.account_id.name },
        charged_to: chargedTo(l),
      }));
      const ofOperations = (l: { version_id: string }) => l.version_id === ops?.version_id;
      const offeringKey = new Map(offerings.map((o) => [o.id, o.key]));
      const positionName = new Map(operations?.positions.map((p) => [p.key, p.name]));
      const resourceName = new Map(operations?.resources.map((r) => [r.key, r.name]));
      const parts: BlockParts = {
        staff: blocks.staff.map((s) => ({
          block_id: s.block_id,
          staff_level: (s.staff_level_key && levelName.get(s.staff_level_key)) ?? null,
          position: (s.position_key && positionName.get(s.position_key)) ?? null,
          count: s.count,
          pay: s.pay,
        })),
        resources: blocks.resources.map((r) => ({
          block_id: r.block_id,
          resource: resourceName.get(r.resource_key) ?? "equipment",
          quantity: r.quantity,
          hours: r.hours,
        })),
        boats: blocks.boats.map((b) => ({
          block_id: b.block_id,
          boat_class: b.boat_class_id.name,
          count: b.count,
          sailor_owned: b.sailor_owned,
        })),
      };
      const ofVersion = <T extends { version_id: string }>(rows: T[], m: Member) =>
        rows.filter((r) => r.version_id === m.version_id);
      const knownNames = (m: Member) => [
        reportName(m),
        ...ofVersion(programs, m).map((p) => p.product_id.name),
        ...ofVersion(offerings, m).flatMap((o) => [o.name, o.product_id.name]),
      ];
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
        operations: operations && {
          ...operations,
          fixedCosts: fixedCosts.filter(ofOperations),
          staffTime: staffTime.filter(ofOperations),
        },
        schedule: Object.fromEntries(
          members
            .filter((m) => m.kind === "program_area")
            .map((m) => [
              reportKey(m),
              scheduleOf(
                ofVersion(blocks.blocks, m).map((b) => ({ ...b, name: blockName(b.name, b.date, knownNames(m)) })),
                ofVersion(activities, m),
                parts,
                (id) => offeringKey.get(id) ?? "",
              ),
            ]),
        ),
        trips: byReport(
          trips.map((t) => ({
            version_id: t.version_id,
            key: t.key,
            offering_key: offeringKey.get(t.offering_id) ?? "",
            name: t.name,
            nights: t.nights,
            airfare_cents: t.airfare_cents,
            miles: t.miles,
          })),
        ),
        fixedCosts: byReport(fixedCosts.filter((l) => !ofOperations(l))),
        staffTime: byReport(staffTime.filter((l) => !ofOperations(l))),
        capital: Object.fromEntries(capitalItems.map((c) => [c.key, { note: c.note, link: c.link }])),
      };
    },
    // A draft's inputs change wherever its plans are changed, as its numbers do.
    refetchInterval: (query) => (isSaved(set) || query.state.status === "error" ? false : 5_000),
  });
