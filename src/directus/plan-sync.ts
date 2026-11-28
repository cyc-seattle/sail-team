import { catalogDifference, planInForce, type CatalogDifference, type SyncInput } from "@cyc-seattle/platform/planning";
import { customEndpoint } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import type { SyncNames, SyncRow } from "@/model/plan-sync";
import { appDirectus } from "./app.ts";
import { readAll } from "./plans.ts";

// The plan-to-catalog sync (cyc-seattle/platform#395): reads the plan in force for a year and the catalog it plans
// with the person's own access, and writes the rows they tick, as them.

const client = () => appDirectus().client;

interface FinancialPlanRow {
  id: string;
  name: string;
  fiscal_year: number;
  status: "draft" | "frozen";
  effective_from: string | null;
}

export type PlanSync =
  | { state: "none"; year: number; years: number[] }
  | { state: "draft"; year: number; years: number[]; plan: FinancialPlanRow }
  | {
      state: "ready";
      year: number;
      years: number[];
      plan: FinancialPlanRow;
      difference: Exclude<CatalogDifference, { refused: "draft" }>;
      names: SyncNames;
    };

/** Rows whose `field` is one of `ids`, a hundred ids a request, so no address grows too long. */
async function readIn<T>(table: string, field: string, ids: string[], fields: string[]): Promise<T[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
  return (await Promise.all(chunks.map((chunk) => readAll<T>(table, { [field]: { _in: chunk } }, fields)))).flat();
}

/** The years with a Financial Plan, newest first, and the one to sync first: the latest with a plan in force. */
export function yearsOf(sets: Pick<FinancialPlanRow, "fiscal_year" | "effective_from">[], today: string) {
  const years = [...new Set(sets.map((s) => s.fiscal_year))].sort((a, b) => b - a);
  const inForce = years.find(
    (y) =>
      planInForce(
        sets.filter((s) => s.fiscal_year === y),
        today,
      ) !== undefined,
  );
  return { years, first: inForce ?? years[0] };
}

/** What the plan in force for `year` lacks in the catalog, or why there's nothing to sync. */
export const planSyncQuery = (year: number | undefined, today: string) =>
  queryOptions({
    queryKey: ["plan-sync", year ?? "first", today],
    queryFn: async (): Promise<PlanSync> => {
      const all = await readAll<FinancialPlanRow>("financial_plans", undefined, [
        "id",
        "name",
        "fiscal_year",
        "status",
        "effective_from",
      ]);
      const { years, first } = yearsOf(all, today);
      const chosen = year ?? first ?? Number(today.slice(0, 4));
      const sets = all.filter((s) => s.fiscal_year === chosen);
      const plan = planInForce(sets, today);
      if (plan === undefined) return { state: "none", year: chosen, years };
      if (plan.status !== "frozen") return { state: "draft", year: chosen, years, plan };

      const plans = await readIn<{ id: string; financial_plan_id: string }>(
        "plans",
        "financial_plan_id",
        sets.map((s) => s.id),
        ["id", "financial_plan_id"],
      );
      const inForce = plans.filter((p) => p.financial_plan_id === plan.id).map((p) => p.id);
      const planOfferings = await readIn<SyncInput["planOfferings"][number] & { plan_id: string }>(
        "plan_offerings",
        "plan_id",
        plans.map((p) => p.id),
        ["id", "plan_id", "offering_id", "starts_on", "ends_on", "capacity", "price_cents"],
      );
      const offeringIds = [...new Set(planOfferings.map((o) => o.offering_id))];
      const [planActivities, offerings, schedule, activities, products, areas, forms] = await Promise.all([
        readIn<SyncInput["planActivities"][number]>("plan_activities", "plan_id", inForce, [
          "id",
          "offering_id",
          "date",
          "start_time",
          "end_time",
          "kind",
        ]),
        readIn<SyncInput["offerings"][number]>("offerings", "id", offeringIds, [
          "id",
          "product_id",
          "name",
          "registration_form_id",
          "starts_on",
          "ends_on",
          "capacity",
          "price_cents",
          "archived_at",
          "confirmed_count",
        ]),
        readIn<SyncInput["schedule"][number]>("offering_schedule", "offering_id", offeringIds, [
          "id",
          "offering_id",
          "weekday",
          "start_time",
          "end_time",
        ]),
        readIn<SyncInput["activities"][number]>("activities", "offering_id", offeringIds, [
          "id",
          "offering_id",
          "date",
          "start_time",
          "end_time",
          "archived_at",
        ]),
        readAll<SyncNames["products"][number]>("products", undefined, ["id", "name", "program_area_id"]),
        readAll<SyncNames["areas"][number]>("program_areas", undefined, ["id", "name"]),
        readAll<SyncNames["forms"][number]>("registration_forms", undefined, ["id", "name"]),
      ]);
      const difference = catalogDifference({
        financialPlan: plan,
        planOfferings: planOfferings.filter((o) => inForce.includes(o.plan_id)),
        planActivities,
        offerings,
        schedule,
        activities,
      });
      if (difference.refused) return { state: "draft", year: chosen, years, plan };
      return { state: "ready", year: chosen, years, plan, difference, names: { products, areas, forms } };
    },
  });

const write = (method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown) =>
  client().request(customEndpoint({ path, method, ...(body !== undefined && { body: JSON.stringify(body) }) }));

/** Applies one row to the catalog, as the signed-in person. `now` stamps what it archives. */
export async function applyRow(row: SyncRow, now: string): Promise<void> {
  switch (row.kind) {
    case "field":
      await write("PATCH", `/items/offerings/${row.offering_id}`, { [row.field]: row.plan });
      return;
    case "schedule": {
      // Replaced whole: the plan's days, in place of the catalog's.
      const was = await readAll<{ id: string }>("offering_schedule", { offering_id: { _eq: row.offering_id } }, ["id"]);
      if (was.length > 0)
        await write(
          "DELETE",
          "/items/offering_schedule",
          was.map((s) => s.id),
        );
      if (row.plan.length > 0) {
        await write(
          "POST",
          "/items/offering_schedule",
          row.plan.map((d) => ({ offering_id: row.offering_id, ...d })),
        );
      }
      return;
    }
    case "add-activity":
      await write("POST", "/items/activities", {
        offering_id: row.offering_id,
        date: row.date,
        start_time: row.start_time,
        end_time: row.end_time,
      });
      return;
    case "change-activity":
      await write("PATCH", `/items/activities/${row.activity_id}`, { end_time: row.end_time.plan, archived_at: null });
      return;
    case "archive-activity":
      await write("PATCH", `/items/activities/${row.activity_id}`, { archived_at: now });
      return;
    case "archive-offering":
      await write("PATCH", `/items/offerings/${row.offering_id}`, { archived_at: now });
      return;
    case "skipped":
      return;
  }
}
