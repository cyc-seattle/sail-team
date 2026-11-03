import type { Pnl } from "@cyc-seattle/platform/planning";

/** A row of `plan_result_pnl`: one offering's, product's, or area's P&L, as it was when its version was saved. */
export interface SavedPnlRow {
  level: Pnl["level"];
  subject_key: string;
  name: string;
  revenue_cents: number;
  expense_cents: number;
  net_cents: number;
  mtdc_cents: number;
  enrollment: number;
  days: number;
  sailor_days: number;
}

/** A saved row in the engine's shape, so the P&L Table shows saved and draft versions alike. */
export function savedPnl(row: SavedPnlRow): { name: string; pnl: Pnl } {
  const { subject_key, name, ...totals } = row;
  return { name, pnl: { ...totals, key: subject_key, by_account: [] } };
}
