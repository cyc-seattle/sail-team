import { computePlan, type EngineOutput, type EngineWarning, type PlanData } from "@cyc-seattle/platform/planning";
import { customEndpoint, readItem, readItems } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import {
  catalogTables,
  engineRows,
  latestActivations,
  versionSet,
  versionTables,
  type ActivationRow,
  type PlanRef,
} from "@/model/plan-data";
import type { SavedPnlRow } from "@/model/saved-results";
import { appDirectus } from "./app.ts";

const client = () => appDirectus().client;

/** Every row of a table that matches `filter`, as plain JSON, for the tables the app reads without types. */
function readAll<T = Record<string, unknown>>(table: string, filter?: object, fields = ["*"]): Promise<T[]> {
  return client().request(
    customEndpoint<T[]>({
      path: `/items/${table}`,
      method: "GET",
      // As objects, as the SDK's own queries take them: it drops a filter given as a JSON string.
      params: { limit: -1, fields, ...(filter && { filter }) },
    }),
  );
}

export interface PlanSummary extends PlanRef {
  name: string;
  area_name: string | null;
}

const planFields = ["id", "name", "kind", "fiscal_year", "organization_id", "program_area_id", "program_area_id.name"];

function summary(row: Record<string, unknown>): PlanSummary {
  const area = row["program_area_id"] as { id?: string; name?: string } | string | null;
  return {
    id: row["id"] as string,
    name: row["name"] as string,
    kind: row["kind"] as PlanRef["kind"],
    fiscal_year: row["fiscal_year"] as number,
    organization_id: row["organization_id"] as string,
    program_area_id: typeof area === "object" && area ? (area.id ?? null) : (area as string | null),
    area_name: typeof area === "object" && area ? (area.name ?? null) : null,
  };
}

export const plansQuery = queryOptions({
  queryKey: ["plans"],
  queryFn: async () =>
    (await readAll("plans", { archived: { _eq: false } }, [...planFields, "program_area_id.id"])).map(summary),
});

export const planQuery = (planId: string) =>
  queryOptions({
    queryKey: ["plans", planId],
    queryFn: async () =>
      summary(
        (await client().request(
          readItem("plans", planId, { fields: [...planFields, "program_area_id.id"] as never }),
        )) as Record<string, unknown>,
      ),
  });

export interface VersionSummary {
  id: string;
  plan_id: string;
  status: "draft" | "saved";
  message: string | null;
  saved_at: string | null;
  operations_version_id: string | null;
}

export const versionsQuery = (planId: string) =>
  queryOptions({
    queryKey: ["plans", planId, "versions"],
    queryFn: () =>
      client().request(
        readItems("plan_versions", {
          fields: ["id", "plan_id", "status", "message", "saved_at", "operations_version_id"],
          filter: { plan_id: { _eq: planId } },
          limit: -1,
        }),
      ) as Promise<VersionSummary[]>,
  });

/** Which version is active for each area, and for the Operations Plan, in the plan's organization and year. */
async function readActivations(plan: PlanRef) {
  const rows = await readAll<{ version_id: string; sequence: number; plan_id: ActivationRow["plan"] }>(
    "plan_activations",
    { plan_id: { organization_id: { _eq: plan.organization_id }, fiscal_year: { _eq: plan.fiscal_year } } },
    ["version_id", "sequence", "plan_id.kind", "plan_id.program_area_id"],
  );
  return latestActivations(rows.map((r) => ({ version_id: r.version_id, sequence: r.sequence, plan: r.plan_id })));
}

export const activationsQuery = (plan: PlanRef) =>
  queryOptions({
    queryKey: ["activations", plan.organization_id, plan.fiscal_year],
    queryFn: () => readActivations(plan),
  });

export interface SavedResults {
  calculated_at: string;
  pnl: SavedPnlRow[];
  warnings: EngineWarning[];
}

/** A saved version's results, as worked out when it was saved. Never recalculated. */
export const savedResultsQuery = (versionId: string) =>
  queryOptions({
    queryKey: ["versions", versionId, "results"],
    // Saved results never change.
    staleTime: Infinity,
    queryFn: async (): Promise<SavedResults | null> => {
      const byVersion = { version_id: { _eq: versionId } };
      const [results, pnl, warnings] = await Promise.all([
        readAll<{ calculated_at: string }>("plan_results", byVersion, ["calculated_at"]),
        readAll<SavedPnlRow>("plan_result_pnl", byVersion),
        readAll<{ code: string; message: string; subject_key: string | null }>("plan_result_warnings", byVersion),
      ]);
      if (!results[0]) {
        return null;
      }
      return {
        calculated_at: results[0].calculated_at,
        pnl,
        warnings: warnings.map((w) => ({
          code: w.code,
          message: w.message,
          ...(w.subject_key && { key: w.subject_key }),
        })),
      };
    },
  });

export interface DraftResults {
  output: EngineOutput;
  names: Map<string, string>;
}

/**
 * A draft's P&L, calculated now in the browser by the planning engine this app bundles, from the same rows platform
 * reads when a version is saved: the catalog, and every version in the draft's set.
 */
export async function calculateDraft(plan: PlanRef, version: VersionSummary): Promise<DraftResults> {
  const { areas } = await readActivations(plan);
  const ids = versionSet(plan, version, areas);
  const byIds = { version_id: { _in: ids } };
  const [catalog, versioned, versions, organizations, costAccounts] = await Promise.all([
    Promise.all(catalogTables.map(async (t) => [t, engineRows(t, await readAll(t))] as const)),
    Promise.all(versionTables.map(async (t) => [t, engineRows(t, await readAll(t, byIds))] as const)),
    readAll<{ id: string; plan_id: string }>("plan_versions", { id: { _in: ids } }, ["id", "plan_id"]),
    readAll("organizations", { id: { _eq: plan.organization_id } }),
    readAll("organization_cost_accounts", { organization_id: { _eq: plan.organization_id } }),
  ]);
  const plans = await readAll<{ id: string; kind: string; program_area_id: string | null }>(
    "plans",
    { id: { _in: [...new Set(versions.map((v) => v.plan_id))] } },
    ["id", "kind", "program_area_id"],
  );
  const tables = Object.fromEntries([...catalog, ...versioned]);
  const operations = plan.kind === "operations" ? version.id : version.operations_version_id;
  const rates = (tables["plan_rates"] as { version_id: string; rib_resource_kind_id: string | null }[]).find(
    (r) => r.version_id === operations,
  );
  const data = {
    ...tables,
    fiscal_year: plan.fiscal_year,
    organization: organizations[0],
    organization_cost_accounts: costAccounts,
    rib_resource_kind_id: rates?.rib_resource_kind_id ?? null,
    plans,
    plan_versions: versions,
  } as unknown as PlanData;
  const names = new Map<string, string>();
  for (const [table, rows] of [...catalog, ...versioned]) {
    if (table === "products" || table === "program_areas") {
      for (const row of rows) names.set(row["id"] as string, row["name"] as string);
    }
    if (table === "plan_offerings") {
      for (const row of rows) names.set(row["key"] as string, row["name"] as string);
    }
  }
  return { output: computePlan(data), names };
}

export const draftQuery = (plan: PlanRef, version: VersionSummary) =>
  queryOptions({
    queryKey: ["versions", version.id, "draft"],
    queryFn: () => calculateDraft(plan, version),
  });
