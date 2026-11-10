import { createItem, customEndpoint, deleteItem, updateItem } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import type {
  FinancialPlanSummary,
  ListedPlan,
  Member,
  PlanLine,
  PnlRow,
  ResultWarning,
  Results,
  Totals,
} from "@/model/financial-plans";
import { appDirectus } from "./app.ts";
import { readAll } from "./plans.ts";

const setFields = [
  "id",
  "organization_id",
  "fiscal_year",
  "name",
  "message",
  "status",
  "saved_at",
  "saved_by",
  "parent_id.id",
  "parent_id.name",
];

type SetRow = Omit<FinancialPlanSummary, "parent"> & { parent_id: { id: string; name: string } | null };

const summary = ({ parent_id, ...set }: SetRow): FinancialPlanSummary => ({ ...set, parent: parent_id ?? null });

const totalFields = ["calculated_at", "operating_revenue_cents", "operating_expense_cents", "operating_net_cents"];

/** Every Financial Plan, with its operating totals and warning count once platform has worked them out, for Planning. */
export const financialPlansQuery = queryOptions({
  queryKey: ["financial-plans"],
  queryFn: async (): Promise<ListedPlan[]> => {
    const [sets, totals, warnings] = await Promise.all([
      readAll<SetRow>("version_sets", undefined, setFields),
      readAll<Totals & { version_set_id: string }>("plan_results", undefined, ["version_set_id", ...totalFields]),
      readAll<{ version_set_id: string }>("plan_result_warnings", undefined, ["version_set_id"]),
    ]);
    return sets.map(summary).map((set): ListedPlan => {
      const total = totals.find((t) => t.version_set_id === set.id);
      return {
        id: set.id,
        name: set.name,
        year: set.fiscal_year,
        status: set.status,
        saved_at: set.saved_at,
        parent: set.parent,
        note: set.message,
        warnings: warnings.filter((w) => w.version_set_id === set.id).length,
        revenue_cents: total?.operating_revenue_cents ?? null,
        expense_cents: total?.operating_expense_cents ?? null,
        net_cents: total?.operating_net_cents ?? null,
      };
    });
  },
  // Until every plan's numbers are in, so a draft that's just been saved or started shows them when they are.
  refetchInterval: (query) => (query.state.data?.some((p) => p.net_cents === null) ? 5_000 : false),
});

/** A Financial Plan's plans, each with the copy of it the Financial Plan holds. */
async function readMembers(setId: string): Promise<Member[]> {
  const rows = await readAll<{
    id: string;
    version_id: string;
    plan_id: { id: string; name: string; kind: Member["kind"]; program_area_id: { id: string; name: string } | null };
  }>("version_set_members", { version_set_id: { _eq: setId } }, [
    "id",
    "version_id",
    "plan_id.id",
    "plan_id.name",
    "plan_id.kind",
    "plan_id.program_area_id.id",
    "plan_id.program_area_id.name",
  ]);
  return rows.map((m) => ({
    id: m.id,
    plan_id: m.plan_id.id,
    version_id: m.version_id,
    plan_name: m.plan_id.name,
    kind: m.plan_id.kind,
    program_area_id: m.plan_id.program_area_id?.id ?? null,
    area_name: m.plan_id.program_area_id?.name ?? null,
  }));
}

/**
 * A Financial Plan's results, as platform last worked them out. Null until it has, or when the engine failed on a
 * draft.
 */
async function readResults(setId: string): Promise<Results | null> {
  const bySet = { version_set_id: { _eq: setId } };
  const [totals, pnl, lines, warnings] = await Promise.all([
    readAll<Totals & { calculated_at: string | null }>("plan_results", bySet, totalFields),
    readAll<Omit<PnlRow, "member"> & { version_set_member_id: string | null }>("plan_result_pnl", bySet, [
      "level",
      "subject_key",
      "name",
      "revenue_cents",
      "expense_cents",
      "enrollment",
      "days",
      "sailor_days",
      "version_set_member_id",
    ]),
    readAll<{
      line: string;
      line_name: string | null;
      cost_center_key: string | null;
      amount_cents: number;
      version_set_member_id: string | null;
      function: PlanLine["function"];
      account_id: { type: string; number: string | null; name: string };
    }>("plan_result_lines", bySet, [
      "line",
      "line_name",
      "cost_center_key",
      "amount_cents",
      "version_set_member_id",
      "function",
      "account_id.type",
      "account_id.number",
      "account_id.name",
    ]),
    readAll<Omit<ResultWarning, "member"> & { version_set_member_id: string | null }>("plan_result_warnings", bySet, [
      "code",
      "message",
      "category",
      "date",
      "version_set_member_id",
    ]),
  ]);
  if (!totals[0]) {
    return null;
  }
  const { calculated_at, ...total } = totals[0];
  return {
    calculated_at,
    totals: total,
    pnl: pnl.map(({ version_set_member_id, ...row }) => ({ ...row, member: version_set_member_id })),
    lines: lines.map((l) => ({
      key: l.line,
      // Older results have no plain name, so fall back to the engine's own.
      name: l.line_name ?? l.line,
      account_number: l.account_id.number,
      account_name: l.account_id.name,
      cost_center_key: l.cost_center_key,
      amount_cents: l.amount_cents,
      revenue: l.account_id.type === "revenue",
      capital: l.account_id.type === "asset",
      function: l.function,
      member: l.version_set_member_id,
    })),
    warnings: warnings.map(({ version_set_member_id, ...w }) => ({ ...w, member: version_set_member_id })),
  };
}

/** Who saved it, by name, if the person looking can see that. */
async function savedByName(user: string | null): Promise<string | null> {
  if (!user) {
    return null;
  }
  try {
    const { first_name, last_name } = await appDirectus().client.request(
      customEndpoint<{ first_name: string | null; last_name: string | null }>({
        path: `/users/${encodeURIComponent(user)}`,
        method: "GET",
        params: { fields: ["first_name", "last_name"] },
      }),
    );
    return [first_name, last_name].filter(Boolean).join(" ") || null;
  } catch {
    return null;
  }
}

export interface FinancialPlan {
  set: FinancialPlanSummary;
  savedBy: string | null;
  members: Member[];
  /** Null until platform has worked them out. */
  results: Results | null;
}

/**
 * A Financial Plan, its plans, and its P&L as platform worked it out: for a saved one, when it was saved; for a draft,
 * after its latest change. Null when there's no such Financial Plan.
 */
export const financialPlanQuery = (setId: string) =>
  queryOptions({
    queryKey: ["financial-plans", setId],
    queryFn: async (): Promise<FinancialPlan | null> => {
      const [row] = await readAll<SetRow>("version_sets", { id: { _eq: setId } }, setFields);
      if (!row) {
        return null;
      }
      const set = summary(row);
      const members = await readMembers(setId);
      const [results, savedBy] = await Promise.all([readResults(setId), savedByName(set.saved_by)]);
      return { set, savedBy, members, results };
    },
  });

/**
 * Renames a Financial Plan, changes its note, or moves it on: a draft to saved, a saved one to active. Platform
 * refuses any move back.
 */
export async function updateFinancialPlan(
  id: string,
  changes: { name?: string; message?: string | null; status?: "saved" | "active" },
): Promise<void> {
  await appDirectus().client.request(updateItem("version_sets", id, changes));
}

/** Deletes a draft Financial Plan. Platform takes its plans out of it, and refuses to delete a saved one. */
export async function deleteFinancialPlan(id: string): Promise<void> {
  await appDirectus().client.request(deleteItem("version_sets", id));
}

/**
 * Starts a draft Financial Plan from `parent`, in its year, and returns its id once platform's hook has copied the
 * parent's plans into it. The hook copies them after it answers, so this waits for them.
 */
export async function startFinancialPlan(
  parent: FinancialPlan,
  { name, message }: { name: string; message: string | null },
): Promise<string> {
  const id = crypto.randomUUID();
  await appDirectus().client.request(
    createItem("version_sets", {
      id,
      organization_id: parent.set.organization_id,
      fiscal_year: parent.set.fiscal_year,
      name,
      message,
      parent_id: parent.set.id,
    }),
  );
  for (let tries = 0; tries < 30; tries++) {
    const copies = await readAll("version_set_members", { version_set_id: { _eq: id } }, ["id"]);
    if (copies.length >= parent.members.length) {
      return id;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return id;
}
