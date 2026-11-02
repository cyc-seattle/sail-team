import { perDay, perSailorDay, type Pnl, type Totals } from "@cyc-seattle/platform/planning";

/** How the P&L table shows amounts: for the year, per day the offering runs, or per sailor per day. */
export type PnlView = "year" | "day" | "sailor-day";

export const viewLabels: Record<PnlView, string> = {
  year: "For the year",
  day: "Per day",
  "sailor-day": "Per sailor-day",
};

/** A P&L's totals in a view, by the engine's own division. Null when it has no days or sailor-days to divide by. */
export function inView(pnl: Pnl, view: PnlView): Totals | null {
  switch (view) {
    case "year":
      return { revenue_cents: pnl.revenue_cents, expense_cents: pnl.expense_cents, net_cents: pnl.net_cents };
    case "day":
      return perDay(pnl);
    case "sailor-day":
      return perSailorDay(pnl);
  }
}

/** Several P&Ls added up, for a table's total row: its per-day figures divide the summed totals by the summed days. */
export function sumPnl(pnls: Pnl[], key: string): Pnl {
  const sum = (pick: (pnl: Pnl) => number) => pnls.reduce((total, pnl) => total + pick(pnl), 0);
  return {
    level: "program_area",
    key,
    revenue_cents: sum((p) => p.revenue_cents),
    expense_cents: sum((p) => p.expense_cents),
    net_cents: sum((p) => p.net_cents),
    by_account: [],
    mtdc_cents: sum((p) => p.mtdc_cents),
    enrollment: sum((p) => p.enrollment),
    days: sum((p) => p.days),
    sailor_days: sum((p) => p.sailor_days),
  };
}
