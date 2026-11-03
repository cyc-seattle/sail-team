// Made-up P&Ls for the stories. Never real club figures.
import type { EngineWarning, Pnl } from "@cyc-seattle/platform/planning";

export function offering(key: string, revenue: number, expense: number, days: number, sailors: number): Pnl {
  return {
    level: "offering",
    key,
    revenue_cents: revenue,
    expense_cents: expense,
    net_cents: revenue - expense,
    by_account: [],
    mtdc_cents: expense,
    enrollment: sailors,
    days,
    sailor_days: days * sailors,
  };
}

export const offerings = [
  { name: "Beginner camp, week 1", pnl: offering("camp-1", 1_000_000, 600_000, 10, 10) },
  { name: "Beginner camp, week 2", pnl: offering("camp-2", 800_000, 650_000, 10, 8) },
  { name: "Race clinic", pnl: offering("clinic", 150_000, 210_000, 2, 6) },
];

export const warnings: EngineWarning[] = [
  { code: "closed_day", message: "A practice on Monday, July 5 falls on a day the club is closed.", key: "practice-7" },
  { code: "no_area", message: "Laser Masters belongs to no program area, so its costs aren't shared with any." },
];
