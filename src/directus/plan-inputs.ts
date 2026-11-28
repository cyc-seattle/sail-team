import type {
  PlanActivity,
  PlanBonusOwner,
  PlanBlockBoats,
  PlanBlockStaff,
  PlanBudgetLine,
  PlanClosedDate,
  PlanLaborLine,
  PlanOffering,
  PlanProgram,
  PlanPayrollTax,
  PlanRates,
  PlanRevenueCharge,
  PlanSalariedPosition,
  PlanStaffLevel,
  PlanTrip,
  StaffLevel,
} from "@cyc-seattle/platform/planning";
import { sortStaffLevels } from "@cyc-seattle/platform/planning";
import { byStart, type Term } from "@/model/terms";
import { queryOptions } from "@tanstack/react-query";
import {
  plannedEnrollment,
  type Bonus,
  type FixedCost,
  type OperationsAssumptions,
  type StaffTime,
} from "@/model/assumptions";
import { isFrozen, type FinancialPlanSummary, type Plan } from "@/model/financial-plans";
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

/** A table's rows in some plans, decimals as numbers. */
async function rowsOf<T>(table: string, planIds: string[], fields = ["*"]): Promise<T[]> {
  if (planIds.length === 0) {
    return [];
  }
  return engineRows(table, await readAll(table, { plan_id: { _in: planIds } }, fields)) as T[];
}

const byName = <T extends { name: string }>(rows: T[]) => [...rows].sort((a, b) => a.name.localeCompare(b.name));

type Account = { number: string | null; name: string };
const accountFields = ["account_id.number", "account_id.name"];

/** What a cost or labor line is charged to, by name: a pool, an offering, a product, a program area, or CSC. */
type ChargedTo = (row: { cost_center_type: string; cost_center_id: string | null }) => string;

type CostRow<T> = T & {
  plan_id: string;
  cost_center_type: string;
  cost_center_id: string | null;
  account_id: Account;
};

type BudgetRow = CostRow<Pick<PlanBudgetLine, "id" | "name" | "amount_cents" | "note" | "in_mtdc">> & {
  account_id: { type: string };
};
type LaborRow = CostRow<Pick<PlanLaborLine, "id" | "name" | "hours" | "note">> & { staff_level_id: Named | null };

/** A row's staff level, read through its link to the catalog. */
type Named = { name: string };

/** A plan's rate for a staff level, with the level, its role and its grade from the catalog. */
type StaffLevelRow = Pick<PlanStaffLevel, "hourly_rate_cents"> & {
  staff_level_id: Pick<StaffLevel, "id" | "name" | "grade"> & {
    role_id: { id: string; name: string; sort: number | null };
  };
};

type BonusRow = Pick<PlanBonusOwner, "id" | "role_name" | "bonus_rate" | "basis" | "position_id"> & {
  account_id: Account;
};

/** The plan's staff levels with their rates, by role, then grade, as planning lists them. */
function staffLevelsInOrder(rows: StaffLevelRow[]): OperationsAssumptions["staffLevels"] {
  const levels = rows.map((r) => ({ ...r.staff_level_id, role_id: r.staff_level_id.role_id.id, row: r }));
  const roles = rows.map((r) => r.staff_level_id.role_id);
  return sortStaffLevels(levels, roles).map(({ id, name, row }) => ({
    id,
    name,
    hourly_rate_cents: row.hourly_rate_cents,
  }));
}

/** The Operations Plan's rates for the year, with every plan's bonuses on the positions they pay. */
async function operationsAssumptions(
  operations: string,
  planIds: string[],
): Promise<Omit<OperationsAssumptions, "fixedCosts" | "staffTime">> {
  const [rates, payrollTaxes, staffLevels, positions, charges, boatRates, bonuses, bonusProducts, bookings, closed] =
    await Promise.all([
      // Every field, since platform drops rib_resource_kind_id (cyc-seattle/platform#126), and Directus refuses a
      // field it doesn't have.
      rowsOf<PlanRates>("plan_rates", [operations]),
      rowsOf<PlanPayrollTax>("plan_payroll_taxes", [operations], ["id", "name", "wage_share", "hourly_cents", "sort"]),
      rowsOf<StaffLevelRow>(
        "plan_staff_levels",
        [operations],
        [
          "hourly_rate_cents",
          "staff_level_id.id",
          "staff_level_id.name",
          "staff_level_id.grade",
          "staff_level_id.role_id.id",
          "staff_level_id.role_id.name",
          "staff_level_id.role_id.sort",
        ],
      ),
      rowsOf<PlanSalariedPosition & { remainder_pool_id: { name: string } | null }>(
        "plan_salaried_positions",
        [operations],
        ["*", "remainder_pool_id.name"],
      ),
      rowsOf<PlanRevenueCharge & { account_id: Account }>(
        "plan_revenue_charges",
        [operations],
        ["*", ...accountFields],
      ),
      // Every field, since platform adds the fuel and charter rates (cyc-seattle/platform#126).
      rowsOf<{
        id: string;
        boat_class_id: { id: string; name: string };
        maintenance_per_boat_hour_cents: number;
        fuel_per_hour_cents?: number | null;
        charter_per_day_cents?: number | null;
      }>("plan_boat_rates", [operations], ["*", "boat_class_id.id", "boat_class_id.name"]),
      rowsOf<BonusRow>("plan_bonus_owners", planIds, [
        "id",
        "role_name",
        "bonus_rate",
        "basis",
        "position_id",
        ...accountFields,
      ]),
      rowsOf<{ bonus_owner_id: string; product_id: { name: string } }>("plan_bonus_owner_products", planIds, [
        "bonus_owner_id",
        "product_id.name",
      ]),
      rowsOf<{
        id: string;
        position_id: { name: string };
        product_id: { name: string } | null;
        program_area_id: { name: string } | null;
        hours: number;
      }>(
        "plan_salaried_bookings",
        [operations],
        ["id", "position_id.name", "product_id.name", "program_area_id.name", "hours"],
      ),
      rowsOf<PlanClosedDate>("plan_closed_dates", [operations], ["id", "date", "name"]),
    ]);
  const positionName = new Map(positions.map((p) => [p.id, p.name]));
  const all: Bonus[] = bonuses
    .map((b) => ({
      key: b.id,
      role_name: b.role_name,
      bonus_rate: b.bonus_rate,
      basis: b.basis ?? null,
      products: bonusProducts
        .filter((p) => p.bonus_owner_id === b.id)
        .map((p) => p.product_id.name)
        .sort((x, y) => x.localeCompare(y)),
      account: { number: b.account_id.number, name: b.account_id.name },
      // A bonus naming a position that isn't there pays no one.
      position: (b.position_id && positionName.get(b.position_id)) ?? null,
    }))
    .sort((a, b) => a.role_name.localeCompare(b.role_name));
  const paying = (name: string) => all.filter((b) => b.position === name);
  const rate = rates[0];
  return {
    rates: rate
      ? {
          lodging_per_night_cents: rate.lodging_per_night_cents,
          mileage_rate_cents: rate.mileage_rate_cents,
        }
      : null,
    payrollTaxes: [...payrollTaxes]
      .sort((a, b) => (a.sort ?? Infinity) - (b.sort ?? Infinity) || a.name.localeCompare(b.name))
      .map(({ id, name, wage_share, hourly_cents }) => ({ key: id, name, wage_share, hourly_cents })),
    staffLevels: staffLevelsInOrder(staffLevels),
    positions: byName(positions).map(({ remainder_pool_id, id, ...p }) => ({
      ...p,
      key: id,
      hourly_coaching_rate_cents: p.hourly_coaching_rate_cents ?? null,
      remainder_pool: remainder_pool_id?.name ?? null,
      bonuses: paying(p.name),
    })),
    charges: byName(charges).map(({ account_id, id, ...c }) => ({
      ...c,
      key: id,
      account: { number: account_id.number, name: account_id.name },
    })),
    boatRates: boatRates
      .map((b) => ({
        key: b.id,
        boat_class: b.boat_class_id.name,
        boat_class_id: b.boat_class_id.id,
        fuel_per_hour_cents: b.fuel_per_hour_cents ?? null,
        maintenance_per_boat_hour_cents: b.maintenance_per_boat_hour_cents,
        charter_per_day_cents: b.charter_per_day_cents ?? null,
      }))
      .sort((a, b) => a.boat_class.localeCompare(b.boat_class)),
    bonuses: all,
    salariedHours: bookings
      .map((b) => ({
        key: b.id,
        position: b.position_id.name,
        booked_to: b.product_id?.name ?? b.program_area_id?.name ?? "",
        hours: b.hours,
      }))
      .sort((a, b) => a.position.localeCompare(b.position) || a.booked_to.localeCompare(b.booked_to)),
    closedDays: [...closed]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(({ id, date, name }) => ({ key: id, date, name })),
  };
}

/** The program areas' blocks, and what each shares. */
async function blockRows(planIds: string[]) {
  const [blocks, staff, boats] = await Promise.all([
    rowsOf<{ id: string; plan_id: string; date: string; name: string }>("plan_activity_blocks", planIds, [
      "id",
      "plan_id",
      "date",
      "name",
    ]),
    rowsOf<Omit<PlanBlockStaff, "staff_level_id"> & { staff_level_id: Named | null }>("plan_block_staff", planIds, [
      "block_id",
      "staff_level_id.name",
      "position_id",
      "count",
      "pay",
    ]),
    // Every field, since platform adds chartered (cyc-seattle/platform#126). Platform drops the blocks' equipment.
    rowsOf<Omit<PlanBlockBoats, "boat_class_id"> & { boat_class_id: { name: string }; chartered?: number | null }>(
      "plan_block_boats",
      planIds,
      ["*", "boat_class_id.name"],
    ),
  ]);
  return { blocks, staff, boats };
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

/** What a Financial Plan's reports show besides its results: what planners entered in its plans. */
export interface PlanInputs {
  /** Each plan's notes, by its report's key; the Operations Plan's under `rates`, for the Overview. */
  notes: Record<string, string[] | null>;
  /** Each program area's offerings, by its report's key. */
  offerings: Record<string, ReportOffering[]>;
  /** The Operations Plan's terms, by start date. */
  terms: Term[];
  /** What each of the Operations Plan's offerings sells, such as boat storage. */
  products: { key: string; product: string; product_id?: string }[];
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

/** A Financial Plan's inputs, read from the plans it holds, which never change once it's frozen. */
export const planInputsQuery = (set: Pick<FinancialPlanSummary, "id" | "status">, plans: Plan[]) =>
  queryOptions({
    queryKey: ["plan-inputs", set.id, plans.map((p) => p.id).join(",")],
    queryFn: async (): Promise<PlanInputs> => {
      const planIds = plans.map((p) => p.id);
      const ops = plans.find((p) => p.kind === "operations");
      const [
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
        termRows,
      ] = await Promise.all([
        rowsOf<
          Omit<PlanOffering, "product_id"> & {
            product_id: {
              id: string;
              name: string;
              programs: { id: string; color: string | null; sort: number | null }[];
            };
          }
        >("plan_offerings", planIds, [
          "*",
          "product_id.id",
          "product_id.name",
          "product_id.programs.id",
          "product_id.programs.color",
          "product_id.programs.sort",
        ]),
        rowsOf<PlanActivity>("plan_activities", planIds, [
          "id",
          "plan_id",
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
        rowsOf<
          Omit<PlanProgram, "staff_level_id"> & {
            product_id: { id: string; name: string };
            staff_level_id: Named | null;
          }
        >("plan_programs", planIds, [
          "plan_id",
          "product_id.id",
          "product_id.name",
          "staff_level_id.name",
          "sailors_per_coach",
          "indirect_cost_rate",
          "notes",
        ]),
        ops ? operationsAssumptions(ops.id, planIds) : null,
        rowsOf<BudgetRow>("plan_budget_lines", planIds, [
          "plan_id",
          "id",
          "name",
          "cost_center_type",
          "cost_center_id",
          "amount_cents",
          "note",
          "in_mtdc",
          ...accountFields,
          "account_id.type",
        ]),
        rowsOf<LaborRow>("plan_labor_lines", planIds, [
          "plan_id",
          "id",
          "name",
          "cost_center_type",
          "cost_center_id",
          "staff_level_id.name",
          "hours",
          "note",
          ...accountFields,
        ]),
        rowsOf<{ id: string; name: string }>("plan_pools", planIds, ["id", "name"]),
        costCenterNames(),
        rowsOf<PlanTrip>("plan_trips", planIds, [
          "id",
          "plan_id",
          "offering_id",
          "name",
          "nights",
          "airfare_cents",
          "miles",
        ]),
        blockRows(planIds),
        rowsOf<{ id: string; note: string | null; link: string | null }>("plan_capital_items", ops ? [ops.id] : [], [
          "id",
          "note",
          "link",
        ]),
        rowsOf<Omit<Term, "key"> & { id: string }>("plan_terms", ops ? [ops.id] : [], [
          "id",
          "name",
          "starts_on",
          "ends_on",
        ]),
      ]);
      const terms = byStart(termRows.map(({ id, ...t }) => ({ key: id, ...t })));
      const termName = new Map(terms.map((t) => [t.key, t.name]));
      const keyOf = new Map(plans.map((p) => [p.id, p.kind === "operations" ? "rates" : reportKey(p)]));
      const byReport = <T>(rows: (T & { plan_id: string })[]) => {
        const out: Record<string, T[]> = {};
        for (const row of rows) {
          (out[keyOf.get(row.plan_id) ?? ""] ??= []).push(row);
        }
        return out;
      };
      const named = (rows: { id: string; name: string }[]) => new Map(rows.map((r) => [r.id, r.name]));
      const centers: Record<string, Map<string, string>> = {
        pool: named(pools),
        offering: named(offerings),
        product: catalog.products,
        program_area: catalog.areas,
      };
      const chargedTo: ChargedTo = ({ cost_center_type: type, cost_center_id: key }) =>
        type === "org" ? catalog.organization : ((key && centers[type]?.get(key)) ?? key ?? "");
      const fixedCosts = byName(budget).map((l): FixedCost & { plan_id: string } => ({
        plan_id: l.plan_id,
        key: l.id,
        name: l.name,
        amount_cents: l.amount_cents,
        in_mtdc: l.in_mtdc,
        note: l.note,
        account: { number: l.account_id.number, name: l.account_id.name },
        charged_to: chargedTo(l),
        revenue: l.account_id.type === "revenue",
      }));
      const staffTime = byName(labor).map((l): StaffTime & { plan_id: string } => ({
        plan_id: l.plan_id,
        key: l.id,
        name: l.name,
        hours: l.hours,
        note: l.note,
        staff_level: l.staff_level_id?.name ?? null,
        account: { number: l.account_id.number, name: l.account_id.name },
        charged_to: chargedTo(l),
      }));
      const ofOperations = (l: { plan_id: string }) => l.plan_id === ops?.id;
      const positionName = new Map(operations?.positions.map((p) => [p.key, p.name]));
      const parts: BlockParts = {
        staff: blocks.staff.map((s) => ({
          block_id: s.block_id,
          staff_level: s.staff_level_id?.name ?? null,
          position: (s.position_id && positionName.get(s.position_id)) ?? null,
          count: s.count,
          pay: s.pay,
        })),
        boats: blocks.boats.map((b) => ({
          block_id: b.block_id,
          boat_class: b.boat_class_id.name,
          count: b.count,
          chartered: b.chartered ?? null,
          sailor_owned: b.sailor_owned,
        })),
      };
      const ofPlan = <T extends { plan_id: string }>(rows: T[], m: Plan) => rows.filter((r) => r.plan_id === m.id);
      const knownNames = (m: Plan) => [
        reportName(m),
        ...ofPlan(programs, m).map((p) => p.product_id.name),
        ...ofPlan(offerings, m).flatMap((o) => [o.name, o.product_id.name]),
      ];
      return {
        notes: Object.fromEntries(plans.map((p) => [keyOf.get(p.id) ?? p.id, p.notes])),
        terms,
        offerings: byReport(
          offerings
            .filter((o) => o.plan_id !== ops?.id)
            .map((o) => ({
              plan_id: o.plan_id,
              ...reportOffering(
                {
                  ...o,
                  // An offering whose term isn't in the Operations Plan is in none.
                  term_id: (o.term_id && termName.has(o.term_id) && o.term_id) || null,
                  term: (o.term_id && termName.get(o.term_id)) ?? null,
                  program: o.product_id.name,
                  program_id: o.product_id.programs[0]?.id ?? null,
                  program_color: o.product_id.programs[0]?.color ?? null,
                  program_sort: o.product_id.programs[0]?.sort ?? null,
                  estimated: plannedEnrollment(o) ?? 0,
                },
                activities.filter((a) => a.offering_id === o.id),
              ),
            })),
        ),
        products: offerings
          .filter((o) => o.plan_id === ops?.id)
          .map((o) => ({ key: o.id, product: o.product_id.name, product_id: o.product_id.id })),
        programs: byReport(
          byName(
            programs.map((p) => ({
              plan_id: p.plan_id,
              name: p.product_id.name,
              program_id: p.product_id.id,
              staff_level: p.staff_level_id?.name ?? null,
              sailors_per_coach: p.sailors_per_coach,
              indirect_cost_rate: p.indirect_cost_rate ?? null,
              notes: p.notes,
            })),
          ),
        ),
        operations: operations && {
          ...operations,
          fixedCosts: fixedCosts.filter(ofOperations),
          staffTime: staffTime.filter(ofOperations),
        },
        schedule: Object.fromEntries(
          plans
            .filter((m) => m.kind === "program_area")
            .map((m) => [
              reportKey(m),
              scheduleOf(
                ofPlan(blocks.blocks, m).map((b) => ({ ...b, name: blockName(b.name, b.date, knownNames(m)) })),
                ofPlan(activities, m),
                parts,
              ),
            ]),
        ),
        trips: byReport(
          trips.map((t) => ({
            plan_id: t.plan_id,
            key: t.id,
            offering_id: t.offering_id,
            name: t.name,
            nights: t.nights,
            airfare_cents: t.airfare_cents,
            miles: t.miles,
          })),
        ),
        fixedCosts: byReport(fixedCosts.filter((l) => !ofOperations(l))),
        staffTime: byReport(staffTime.filter((l) => !ofOperations(l))),
        capital: Object.fromEntries(capitalItems.map((c) => [c.id, { note: c.note, link: c.link }])),
      };
    },
    // A draft's inputs change wherever its plans are changed, as its numbers do.
    refetchInterval: (query) => (isFrozen(set) || query.state.status === "error" ? false : 5_000),
  });
