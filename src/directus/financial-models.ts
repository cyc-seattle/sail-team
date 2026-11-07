import type { EngineWarning } from "@cyc-seattle/platform/planning";
import { customEndpoint } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import type { ModelLine, FinancialModelSummary } from "@/model/financial-models";
import type { SavedPnlRow } from "@/model/saved-results";
import { appDirectus } from "./app.ts";

function readAll<T>(table: string, filter: object, fields: string[]): Promise<T[]> {
  return appDirectus().client.request(
    customEndpoint<T[]>({ path: `/items/${table}`, method: "GET", params: { limit: -1, fields, filter } }),
  );
}

const setFields = ["id", "organization_id", "fiscal_year", "name", "message", "saved_at"];

/** The club's totals when a financial model was saved. */
export interface ModelTotals {
  calculated_at: string;
  operating_net_cents: number;
  fundraising_net_cents: number;
  capital_cents: number;
  total_cents: number;
}

const totalFields = ["calculated_at", "operating_net_cents", "fundraising_net_cents", "capital_cents", "total_cents"];

/** Every financial model, with its totals, for the plan list. */
export const financialModelsQuery = queryOptions({
  queryKey: ["financial-models"],
  queryFn: async () => {
    const sets = await readAll<FinancialModelSummary>("version_sets", {}, setFields);
    const totals = sets.length
      ? await readAll<ModelTotals & { version_set_id: string }>(
          "plan_results",
          { version_set_id: { _in: sets.map((s) => s.id) } },
          [...totalFields, "version_set_id"],
        )
      : [];
    return sets.map((set) => ({ ...set, totals: totals.find((t) => t.version_set_id === set.id) ?? null }));
  },
  // A financial model never changes once saved.
  staleTime: 5 * 60_000,
});

/** One plan in a financial model, with the version of it the financial model holds. */
export interface ModelMember {
  id: string;
  plan_id: string;
  version_id: string;
  plan_name: string;
  kind: "program_area" | "operations";
  program_area_id: string | null;
  area_name: string | null;
}

export interface FinancialModel {
  set: FinancialModelSummary;
  totals: ModelTotals | null;
  members: ModelMember[];
  pnl: (SavedPnlRow & { version_set_member_id: string | null })[];
  lines: (ModelLine & { version_set_member_id: string | null })[];
  warnings: EngineWarning[];
}

/** A financial model and its results, as they were worked out when it was saved. Never recalculated. */
export const financialModelQuery = (setId: string) =>
  queryOptions({
    queryKey: ["financial-models", setId],
    staleTime: Infinity,
    queryFn: async (): Promise<FinancialModel | null> => {
      const bySet = { version_set_id: { _eq: setId } };
      const [sets, totals, members, pnl, lines, warnings] = await Promise.all([
        readAll<FinancialModelSummary>("version_sets", { id: { _eq: setId } }, setFields),
        readAll<ModelTotals>("plan_results", bySet, totalFields),
        readAll<{
          id: string;
          version_id: string;
          plan_id: {
            id: string;
            name: string;
            kind: ModelMember["kind"];
            program_area_id: { id: string; name: string } | null;
          };
        }>("version_set_members", bySet, [
          "id",
          "version_id",
          "plan_id.id",
          "plan_id.name",
          "plan_id.kind",
          "plan_id.program_area_id.id",
          "plan_id.program_area_id.name",
        ]),
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
          account_id: { type: string };
        }>("plan_result_lines", bySet, [
          "line",
          "line_name",
          "cost_center_name",
          "amount_cents",
          "version_set_member_id",
          "account_id.type",
        ]),
        readAll<{ code: string; message: string; subject_key: string | null }>("plan_result_warnings", bySet, [
          "code",
          "message",
          "subject_key",
        ]),
      ]);
      const set = sets[0];
      if (!set) {
        return null;
      }
      return {
        set,
        totals: totals[0] ?? null,
        members: members.map((m) => ({
          id: m.id,
          plan_id: m.plan_id.id,
          version_id: m.version_id,
          plan_name: m.plan_id.name,
          kind: m.plan_id.kind,
          program_area_id: m.plan_id.program_area_id?.id ?? null,
          area_name: m.plan_id.program_area_id?.name ?? null,
        })),
        pnl,
        lines: lines.map((l) => ({
          // Older results have no plain name, so fall back to the engine's own.
          name: l.line_name ?? l.line,
          cost_center_name: l.cost_center_name,
          amount_cents: l.amount_cents,
          revenue: l.account_id.type === "revenue",
          version_set_member_id: l.version_set_member_id,
        })),
        warnings: warnings.map((w) => ({
          code: w.code,
          message: w.message,
          ...(w.subject_key && { key: w.subject_key }),
        })),
      };
    },
  });

export interface VersionInFinancialModel {
  set: FinancialModelSummary;
  pnl: SavedPnlRow[];
}

/**
 * A saved version's P&L in the newest financial model that holds it, which can differ from its own: the financial model counts the
 * other areas' versions it holds, not the ones active when this version was saved. Null when no financial model holds it.
 */
export const versionInFinancialModelQuery = (versionId: string) =>
  queryOptions({
    queryKey: ["versions", versionId, "financial-model"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<VersionInFinancialModel | null> => {
      const members = await readAll<{ id: string; version_set_id: FinancialModelSummary }>(
        "version_set_members",
        { version_id: { _eq: versionId } },
        ["id", ...setFields.map((f) => `version_set_id.${f}`)],
      );
      const newest = members.sort((a, b) =>
        (b.version_set_id.saved_at ?? "").localeCompare(a.version_set_id.saved_at ?? ""),
      )[0];
      if (!newest) {
        return null;
      }
      const pnl = await readAll<SavedPnlRow>(
        "plan_result_pnl",
        { version_set_id: { _eq: newest.version_set_id.id }, version_set_member_id: { _eq: newest.id } },
        [
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
        ],
      );
      return { set: newest.version_set_id, pnl };
    },
  });
