import { createItem, customEndpoint, deleteItem, updateItem } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import {
  inForce,
  platformRelease,
  today,
  type CapitalResult,
  type FinancialPlanSummary,
  type InForce,
  type ListedPlan,
  type Plan,
  type PlanLine,
  type PnlRow,
  type ResultWarning,
  type Results,
  type Totals,
} from "@/model/financial-plans";
import { appDirectus } from "./app.ts";
import { readAll } from "./plans.ts";

const setFields = [
  "id",
  "organization_id",
  "fiscal_year",
  "name",
  "note",
  "status",
  "effective_from",
  "frozen_at",
  "frozen_by",
  "platform_version",
  "archived_at",
  "parent_id.id",
  "parent_id.name",
];

type SetRow = Omit<FinancialPlanSummary, "parent"> & { parent_id: { id: string; name: string } | null };

const summary = ({ parent_id, ...set }: SetRow): FinancialPlanSummary => ({ ...set, parent: parent_id ?? null });

const totalFields = [
  "calculated_at",
  "operating_revenue_cents",
  "operating_expense_cents",
  "operating_net_cents",
  "fundraising_revenue_cents",
  "fundraising_expense_cents",
  "fundraising_net_cents",
  "capital_cents",
  "total_cents",
];

/** Every Financial Plan, with its totals and warning count once platform has worked them out, for Planning. */
export const financialPlansQuery = queryOptions({
  queryKey: ["financial-plans"],
  queryFn: async (): Promise<ListedPlan[]> => {
    const [sets, totals, warnings] = await Promise.all([
      readAll<SetRow>("financial_plans", undefined, setFields),
      readAll<Totals & { financial_plan_id: string }>("plan_results", undefined, ["financial_plan_id", ...totalFields]),
      readAll<{ financial_plan_id: string }>("plan_result_warnings", undefined, ["financial_plan_id"]),
    ]);
    const savers = await userNames(sets.map((set) => set.frozen_by));
    const forces = inForce(sets, today());
    return sets.map(summary).map((set): ListedPlan => {
      const total = totals.find((t) => t.financial_plan_id === set.id);
      return {
        id: set.id,
        name: set.name,
        year: set.fiscal_year,
        status: set.status,
        in_force: forces.get(set.id) ?? null,
        frozen_at: set.frozen_at,
        frozen_by: (set.frozen_by && savers.get(set.frozen_by)) ?? null,
        parent: set.parent,
        archived: set.archived_at !== null,
        note: set.note,
        platform: platformRelease(set),
        warnings: warnings.filter((w) => w.financial_plan_id === set.id).length,
        revenue_cents: total ? total.operating_revenue_cents : null,
        expense_cents: total ? total.operating_expense_cents : null,
        net_cents: total ? total.operating_net_cents : null,
      };
    });
  },
  // Until every plan's numbers are in, so a draft that's just been frozen or started shows them when they are.
  refetchInterval: (query) =>
    query.state.status !== "error" && query.state.data?.some((p) => p.net_cents === null) ? 5_000 : false,
});

/** A Financial Plan's plans: its Operations Plan, and a Program Plan for each of its program areas. */
async function readPlans(setId: string): Promise<Plan[]> {
  const rows = await readAll<{
    id: string;
    kind: Plan["kind"];
    program_area_id: { id: string; name: string } | null;
    notes: string[] | null;
  }>("plans", { financial_plan_id: { _eq: setId } }, [
    "id",
    "kind",
    "program_area_id.id",
    "program_area_id.name",
    "notes",
  ]);
  return rows.map((p) => ({
    id: p.id,
    kind: p.kind,
    program_area_id: p.program_area_id?.id ?? null,
    area_name: p.program_area_id?.name ?? null,
    notes: p.notes,
  }));
}

/**
 * A Financial Plan's results, as platform last worked them out. Null until it has, or when the engine failed on a
 * draft.
 */
async function readResults(setId: string): Promise<Results | null> {
  const bySet = { financial_plan_id: { _eq: setId } };
  const [totals, pnl, lines, warnings, capital] = await Promise.all([
    readAll<Totals & { calculated_at: string | null; platform_version: string | null }>("plan_results", bySet, [
      ...totalFields,
      "platform_version",
    ]),
    readAll<Omit<PnlRow, "plan"> & { plan_id: string | null }>("plan_result_pnl", bySet, [
      "level",
      "subject_key",
      "name",
      "revenue_cents",
      "expense_cents",
      "enrollment",
      "days",
      "sailor_days",
      "allocation_holds",
      "breakeven_enrollment",
      "term_key",
      "term_name",
      "term_starts_on",
      "plan_id",
    ]),
    readAll<{
      line: string;
      line_name: string | null;
      cost_center_key: string | null;
      cost_center_type: PlanLine["cost_center_type"];
      amount_cents: number;
      plan_id: string | null;
      function: PlanLine["function"];
      explanation: string | null;
      account_id: { type: string; number: string | null; name: string };
    }>("plan_result_lines", bySet, [
      "line",
      "line_name",
      "cost_center_key",
      "cost_center_type",
      "amount_cents",
      "plan_id",
      "function",
      "explanation",
      "account_id.type",
      "account_id.number",
      "account_id.name",
    ]),
    readAll<Omit<ResultWarning, "plan"> & { plan_id: string | null }>("plan_result_warnings", bySet, [
      "code",
      "message",
      "category",
      "date",
      "plan_id",
    ]),
    readAll<CapitalResult & { item_key: string }>("plan_result_capital", bySet, [
      "rank",
      "item_key",
      "name",
      "amount_cents",
      "running_cents",
      "funded",
    ]),
  ]);
  if (!totals[0]) {
    return null;
  }
  const { calculated_at, platform_version, ...total } = totals[0];
  return {
    calculated_at,
    platform_version: platform_version ?? null,
    totals: total,
    pnl: pnl.map(({ plan_id, ...row }) => ({ ...row, plan: plan_id })),
    lines: lines.map((l) => ({
      key: l.line,
      // Older results have no plain name, so fall back to the engine's own.
      name: l.line_name ?? l.line,
      account_number: l.account_id.number,
      account_name: l.account_id.name,
      cost_center_key: l.cost_center_key,
      cost_center_type: l.cost_center_type,
      amount_cents: l.amount_cents,
      revenue: l.account_id.type === "revenue",
      capital: l.account_id.type === "asset",
      function: l.function,
      explanation: l.explanation,
      plan: l.plan_id,
    })),
    warnings: warnings.map(({ plan_id, ...w }) => ({ ...w, plan: plan_id })),
    capital: capital.map(({ item_key, ...c }) => ({ ...c, key: item_key })).sort((a, b) => a.rank - b.rank),
  };
}

/**
 * The names of these users, by id, in one request. Platform lets a Plan Reader or Writer read only a user's name
 * (cyc-seattle/platform#138); anyone else gets none, and the plans show without them.
 */
async function userNames(users: (string | null)[]): Promise<Map<string, string>> {
  const ids = [...new Set(users.filter((user): user is string => !!user))];
  if (ids.length === 0) {
    return new Map();
  }
  try {
    const rows = await appDirectus().client.request(
      customEndpoint<{ id: string; first_name: string | null; last_name: string | null }[]>({
        path: "/users",
        method: "GET",
        params: { limit: -1, filter: { id: { _in: ids } }, fields: ["id", "first_name", "last_name"] },
      }),
    );
    return new Map(
      rows.flatMap(({ id, first_name, last_name }) => {
        const name = [first_name, last_name].filter(Boolean).join(" ");
        return name ? [[id, name] as const] : [];
      }),
    );
  } catch {
    return new Map();
  }
}

export interface FinancialPlan {
  set: FinancialPlanSummary;
  /** When it's in force, among its year's Financial Plans, or null when it's never been made active. */
  inForce: InForce | null;
  plans: Plan[];
  /** Null until platform has worked them out. */
  results: Results | null;
}

/**
 * A Financial Plan, its plans, and its P&L as platform worked it out: for a frozen one, when it was frozen; for a draft,
 * after its latest change. Null when there's no such Financial Plan.
 */
export const financialPlanQuery = (setId: string) =>
  queryOptions({
    queryKey: ["financial-plans", setId],
    queryFn: async (): Promise<FinancialPlan | null> => {
      const [row] = await readAll<SetRow>("financial_plans", { id: { _eq: setId } }, setFields);
      if (!row) {
        return null;
      }
      const set = summary(row);
      const [plans, results, year] = await Promise.all([
        readPlans(setId),
        readResults(setId),
        readAll<Pick<FinancialPlanSummary, "id" | "organization_id" | "fiscal_year" | "effective_from">>(
          "financial_plans",
          { _and: [{ organization_id: { _eq: set.organization_id } }, { fiscal_year: { _eq: set.fiscal_year } }] },
          ["id", "organization_id", "fiscal_year", "effective_from"],
        ),
      ]);
      return { set, inForce: inForce(year, today()).get(set.id) ?? null, plans, results };
    },
  });

/**
 * Renames a Financial Plan, changes its note, archives it or brings it back, freezes a draft, or sets the day it's
 * active from. Platform refuses unfreezing, archiving the plan in force, and two plans for a year active from one day.
 */
export async function updateFinancialPlan(
  id: string,
  changes: {
    name?: string;
    note?: string | null;
    status?: "frozen";
    effective_from?: string | null;
    archived_at?: string | null;
  },
): Promise<void> {
  await appDirectus().client.request(updateItem("financial_plans", id, changes));
}

/** Deletes a draft Financial Plan, and platform its plans with it. Platform refuses to delete a frozen one. */
export async function deleteFinancialPlan(id: string): Promise<void> {
  await appDirectus().client.request(deleteItem("financial_plans", id));
}

/**
 * Starts a draft Financial Plan from `parent`, in its year, and returns its id once platform's hook has copied the
 * parent's plans into it. The hook copies them after it answers, so this waits for them.
 */
export async function startFinancialPlan(
  parent: FinancialPlan,
  { name, note }: { name: string; note: string | null },
): Promise<string> {
  const id = crypto.randomUUID();
  await appDirectus().client.request(
    createItem("financial_plans", {
      id,
      organization_id: parent.set.organization_id,
      fiscal_year: parent.set.fiscal_year,
      name,
      note,
      parent_id: parent.set.id,
    }),
  );
  for (let tries = 0; tries < 30; tries++) {
    const copies = await readAll("plans", { financial_plan_id: { _eq: id } }, ["id"]);
    if (copies.length >= parent.plans.length) {
      return id;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return id;
}

const tryAgain = "That didn't work. Try again.";

/**
 * What to tell someone when Directus refuses a change to a Financial Plan: platform's own reason when it gives one, such
 * as "Another Financial Plan for the year is already active from that date.", or to try again.
 */
export function refusalOf(error: unknown): string {
  const [first] = (error as { errors?: { message?: string; extensions?: { code?: string } }[] } | null)?.errors ?? [];
  return first?.extensions?.code === "INVALID_PAYLOAD" && first.message ? first.message : tryAgain;
}

/**
 * The planner platform works out numbers with now, to tell a draft's older numbers. Null when platform doesn't say,
 * such as before it could.
 */
export const engineQuery = queryOptions({
  queryKey: ["planning-engine"],
  queryFn: async (): Promise<string | null> => {
    try {
      const { platform_version } = await appDirectus().client.request(
        customEndpoint<{ platform_version: string }>({ path: "/frozen-plans/engine", method: "GET" }),
      );
      return platform_version;
    } catch {
      return null;
    }
  },
  // It changes only when platform deploys.
  staleTime: 5 * 60_000,
});

/** Has platform work out a draft's numbers again now, with the planner it runs today, and waits until it has. */
export async function workOutAgain(setId: string): Promise<void> {
  await appDirectus().client.request(
    customEndpoint({ path: `/frozen-plans/drafts/${encodeURIComponent(setId)}/results`, method: "POST" }),
  );
}
