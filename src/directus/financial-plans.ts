import { createItem, customEndpoint, updateItem } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import {
  topLine,
  type FinancialPlanSummary,
  type ListedPlan,
  type Member,
  type PlanLine,
  type Results,
  type Totals,
} from "@/model/financial-plans";
import type { SavedPnlRow } from "@/model/saved-results";
import { appDirectus } from "./app.ts";
import { calculateFinancialPlan, readAll } from "./plans.ts";

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

const totalFields = ["operating_net_cents", "fundraising_net_cents", "capital_cents", "total_cents"];

/** Every Financial Plan, with a saved one's top-line numbers, for the list. */
export const financialPlansQuery = queryOptions({
  queryKey: ["financial-plans"],
  queryFn: async (): Promise<ListedPlan[]> => {
    const sets = (await readAll<SetRow>("version_sets", undefined, setFields)).map(summary);
    const saved = sets.filter((s) => s.status === "saved").map((s) => s.id);
    const lines = saved.length
      ? await readAll<{
          version_set_id: string;
          amount_cents: number;
          function: PlanLine["function"];
          account_id: { type: string };
        }>("plan_result_lines", { version_set_id: { _in: saved } }, [
          "version_set_id",
          "amount_cents",
          "function",
          "account_id.type",
        ])
      : [];
    return sets.map((set) => {
      const own = lines
        .filter((l) => l.version_set_id === set.id)
        .map((l) => ({
          amount_cents: l.amount_cents,
          function: l.function,
          revenue: l.account_id.type === "revenue",
          capital: l.account_id.type === "asset",
        }));
      return { ...set, topLine: own.length ? topLine(own) : null };
    });
  },
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

/** A saved Financial Plan's results, as they were worked out when it was saved. Null until the hook has written them. */
async function readSavedResults(setId: string): Promise<Results | null> {
  const bySet = { version_set_id: { _eq: setId } };
  const [totals, pnl, lines, warnings] = await Promise.all([
    readAll<Totals>("plan_results", bySet, totalFields),
    readAll<SavedPnlRow & { version_set_member_id: string | null }>("plan_result_pnl", bySet, [
      "level",
      "subject_key",
      "name",
      "revenue_cents",
      "expense_cents",
      "net_cents",
      "mtdc_cents",
      "enrollment",
      "days",
      "sailor_days",
      "version_set_member_id",
    ]),
    readAll<{
      line: string;
      line_name: string | null;
      cost_center_name: string;
      amount_cents: number;
      version_set_member_id: string | null;
      function: PlanLine["function"];
      account_id: { type: string };
    }>("plan_result_lines", bySet, [
      "line",
      "line_name",
      "cost_center_name",
      "amount_cents",
      "version_set_member_id",
      "function",
      "account_id.type",
    ]),
    readAll<{ code: string; message: string; subject_key: string | null }>("plan_result_warnings", bySet, [
      "code",
      "message",
      "subject_key",
    ]),
  ]);
  if (!totals[0]) {
    return null;
  }
  return {
    live: false,
    totals: totals[0],
    pnl: pnl.map(({ version_set_member_id, ...row }) => ({ ...row, member: version_set_member_id })),
    lines: lines.map((l) => ({
      // Older results have no plain name, so fall back to the engine's own.
      name: l.line_name ?? l.line,
      cost_center_name: l.cost_center_name,
      amount_cents: l.amount_cents,
      revenue: l.account_id.type === "revenue",
      capital: l.account_id.type === "asset",
      function: l.function,
      member: l.version_set_member_id,
    })),
    warnings: warnings.map((w) => ({ code: w.code, message: w.message, ...(w.subject_key && { key: w.subject_key }) })),
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
  /** Null for a saved one whose results aren't in yet. */
  results: Results | null;
}

/**
 * A Financial Plan, its plans, and its P&L: for a saved one, as it was saved, never recalculated; for a draft, calculated
 * now. Null when there's no such Financial Plan.
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
      const [results, savedBy] = await Promise.all([
        set.status === "saved" ? readSavedResults(setId) : calculateFinancialPlan(set, members),
        savedByName(set.saved_by),
      ]);
      return { set, savedBy, members, results };
    },
  });

/** Renames a draft Financial Plan, or changes any one's note. Platform refuses a saved one's new name. */
export async function updateFinancialPlan(
  id: string,
  changes: { name?: string; message?: string | null },
): Promise<void> {
  await appDirectus().client.request(updateItem("version_sets", id, changes));
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
