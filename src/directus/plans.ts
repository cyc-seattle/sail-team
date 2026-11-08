import { computePlan, type PlanData } from "@cyc-seattle/platform/planning";
import { customEndpoint } from "@directus/sdk";
import { ownerOf, type Member, type Results } from "@/model/financial-plans";
import { catalogTables, engineRows, versionTables, type YearRef } from "@/model/plan-data";
import { appDirectus } from "./app.ts";

const client = () => appDirectus().client;

/** Every row of a table that matches `filter`, as plain JSON, for the tables the app reads without types. */
export function readAll<T = Record<string, unknown>>(table: string, filter?: object, fields = ["*"]): Promise<T[]> {
  return client().request(
    customEndpoint<T[]>({
      path: `/items/${table}`,
      method: "GET",
      // As objects, as the SDK's own queries take them: it drops a filter given as a JSON string.
      params: { limit: -1, fields, ...(filter && { filter }) },
    }),
  );
}

type Row = Record<string, unknown>;

/**
 * A draft Financial Plan's P&L, calculated now in the browser by the planning engine this app bundles, from the same
 * rows platform reads when it's saved: the catalog, and every row of each plan it holds. Each line and P&L row names
 * the member it's charged in, as the saved results do.
 */
export async function calculateFinancialPlan(year: YearRef, members: Member[]): Promise<Results> {
  const ids = members.map((m) => m.version_id);
  const byIds = { version_id: { _in: ids } };
  const [catalog, versioned, versions, organizations, costAccounts] = await Promise.all([
    Promise.all(catalogTables.map(async (t) => [t, engineRows(t, await readAll(t))] as const)),
    Promise.all(versionTables.map(async (t) => [t, engineRows(t, await readAll(t, byIds))] as const)),
    readAll<{ id: string; plan_id: string }>("plan_versions", { id: { _in: ids } }, ["id", "plan_id"]),
    readAll("organizations", { id: { _eq: year.organization_id } }),
    readAll("organization_cost_accounts", { organization_id: { _eq: year.organization_id } }),
  ]);
  const plans = await readAll<{ id: string; kind: string; program_area_id: string | null }>(
    "plans",
    { id: { _in: [...new Set(versions.map((v) => v.plan_id))] } },
    ["id", "kind", "program_area_id"],
  );
  const tables: Record<string, Row[]> = Object.fromEntries([...catalog, ...versioned]);
  const operations = members.find((m) => m.kind === "operations")?.version_id ?? null;
  const rates = tables["plan_rates"]!.find((r) => r["version_id"] === operations);
  const data = {
    ...tables,
    fiscal_year: year.fiscal_year,
    organization: organizations[0],
    organization_cost_accounts: costAccounts,
    rib_resource_kind_id: rates?.["rib_resource_kind_id"] ?? null,
    plans,
    plan_versions: versions,
  } as unknown as PlanData;
  const output = computePlan(data);

  const names = new Map<string, string>();
  for (const table of ["products", "program_areas"]) {
    for (const row of tables[table]!) names.set(row["id"] as string, row["name"] as string);
  }
  for (const table of ["plan_offerings", "plan_pools"]) {
    for (const row of tables[table]!) names.set(row["key"] as string, row["name"] as string);
  }
  const accounts = new Map(tables["accounts"]!.map((a) => [a["id"] as string, a]));
  const owners = {
    offeringVersion: new Map(tables["plan_offerings"]!.map((o) => [o["key"] as string, o["version_id"] as string])),
    productArea: new Map(tables["products"]!.map((p) => [p["id"] as string, (p["program_area_id"] as string) ?? null])),
    areaVersion: new Map(
      members.filter((m) => m.program_area_id).map((m) => [m.program_area_id!, m.version_id] as const),
    ),
    operations,
  };
  const memberOf = new Map(members.map((m) => [m.version_id, m.id]));
  const member = (type: string, key: string | null) => {
    const owner = ownerOf(type, key, owners);
    return owner ? (memberOf.get(owner) ?? null) : null;
  };
  const nameOf = (key: string | null) => (key && names.get(key)) ?? "Organization";
  const { operating, fundraising } = output.organization;
  return {
    live: true,
    totals: {
      operating_net_cents: operating.net_cents,
      fundraising_net_cents: fundraising.net_cents,
      capital_cents: output.organization.capital_cents,
      total_cents: output.organization.total_cents,
    },
    pnl: output.pnl.map((p) => ({
      level: p.level,
      subject_key: p.key,
      name: nameOf(p.key),
      revenue_cents: p.revenue_cents,
      expense_cents: p.expense_cents,
      net_cents: p.net_cents,
      mtdc_cents: p.mtdc_cents,
      enrollment: p.enrollment,
      days: p.days,
      sailor_days: p.sailor_days,
      member: member(p.level, p.key),
    })),
    lines: output.lines.map((l) => ({
      key: l.line_key,
      name: l.line_name,
      account_number: (accounts.get(l.account_id)?.["number"] as string | null | undefined) ?? null,
      account_name: (accounts.get(l.account_id)?.["name"] as string | undefined) ?? "Other",
      cost_center_name: nameOf(l.cost_center_key),
      amount_cents: l.amount_cents,
      revenue: accounts.get(l.account_id)?.["type"] === "revenue",
      member: member(l.cost_center_type, l.cost_center_key),
    })),
    warnings: output.warnings,
  };
}
