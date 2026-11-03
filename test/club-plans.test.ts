import { describe, expect, it } from "vitest";
import { newestClubPlans, signedCents, type ClubPlanSummary } from "../src/model/club-plans.ts";

const set = (id: string, year: number, saved_at: string): ClubPlanSummary => ({
  id,
  organization_id: "org",
  fiscal_year: year,
  name: id,
  message: null,
  saved_at,
});

describe("newestClubPlans", () => {
  it("keeps each year's latest club plan", () => {
    const newest = newestClubPlans([
      set("march", 2027, "2027-03-10T18:00:00Z"),
      set("january", 2027, "2027-01-15T18:00:00Z"),
      set("last-year", 2026, "2026-02-01T18:00:00Z"),
    ]);
    expect(newest.get(2027)?.id).toBe("march");
    expect(newest.get(2026)?.id).toBe("last-year");
    expect(newest.get(2025)).toBeUndefined();
  });
});

describe("signedCents", () => {
  it("adds revenue to the net and takes a cost away", () => {
    expect(signedCents({ name: "Tuition", cost_center_name: "Camp", amount_cents: 500, revenue: true })).toBe(500);
    expect(signedCents({ name: "Office", cost_center_name: "Club", amount_cents: 200, revenue: false })).toBe(-200);
  });
});
