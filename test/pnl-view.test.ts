import type { Pnl } from "@cyc-seattle/platform/planning";
import { describe, expect, it } from "vitest";
import { inView, sumPnl, amountInView, readView } from "../src/model/pnl-view.ts";

const pnl = (key: string, revenue: number, expense: number, days: number, sailors: number): Pnl => ({
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
});

// The scenario in features/plans.feature: $10,000 in, $6,000 out, 10 days, 10 sailors.
const camp = pnl("camp", 1_000_000, 600_000, 10, 10);

describe("inView", () => {
  it("shows the year's totals as they are", () => {
    expect(inView(camp, "year")).toEqual({ revenue_cents: 1_000_000, expense_cents: 600_000, net_cents: 400_000 });
  });

  it("divides by the days it runs", () => {
    expect(inView(camp, "day")?.net_cents).toBe(40_000);
  });

  it("divides by sailor-days", () => {
    expect(inView(camp, "sailor-day")?.net_cents).toBe(4_000);
  });

  it("has nothing per day for an offering with no days", () => {
    expect(inView(pnl("none", 100, 0, 0, 0), "day")).toBeNull();
  });
});

describe("sumPnl", () => {
  it("adds up totals, days and sailor-days, so per-day figures divide the sums", () => {
    const total = sumPnl([camp, pnl("clinic", 200_000, 100_000, 2, 5)], "total");
    expect(total).toMatchObject({ revenue_cents: 1_200_000, expense_cents: 700_000, net_cents: 500_000, days: 12 });
    expect(total.sailor_days).toBe(110);
    expect(inView(total, "day")?.net_cents).toBe(41_667);
  });
});

describe("readView", () => {
  it("is the saved view, or for the year when there's none or it isn't one", () => {
    expect(readView("sailor-day")).toBe("sailor-day");
    expect(readView(null)).toBe("year");
    expect(readView("toString")).toBe("year");
  });
});

describe("amountInView", () => {
  const measures = { days: 10, sailor_days: 100 };
  it("divides by the days or sailor-days, to the cent", () => {
    expect(amountInView(400_000, "year", measures)).toBe(400_000);
    expect(amountInView(400_000, "day", measures)).toBe(40_000);
    expect(amountInView(1_001, "sailor-day", measures)).toBe(10);
  });
  it("is null with nothing to divide by", () => {
    expect(amountInView(5, "day", { days: 0, sailor_days: 0 })).toBeNull();
  });
});
