import { describe, expect, it } from "vitest";
import { savedPnl } from "../src/model/saved-results.ts";

describe("savedPnl", () => {
  it("names the row, and keys it by what it's the P&L of", () => {
    expect(
      savedPnl({
        level: "offering",
        subject_key: "camp-1",
        name: "Beginner camp, week 1",
        revenue_cents: 1_000_000,
        expense_cents: 600_000,
        net_cents: 400_000,
        mtdc_cents: 500_000,
        enrollment: 10,
        days: 10,
        sailor_days: 100,
      }),
    ).toEqual({
      name: "Beginner camp, week 1",
      pnl: {
        level: "offering",
        key: "camp-1",
        revenue_cents: 1_000_000,
        expense_cents: 600_000,
        net_cents: 400_000,
        mtdc_cents: 500_000,
        enrollment: 10,
        days: 10,
        sailor_days: 100,
        by_account: [],
      },
    });
  });
});
