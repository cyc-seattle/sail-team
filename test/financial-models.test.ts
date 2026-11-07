import { describe, expect, it } from "vitest";
import {
  listOf,
  movedOn,
  newestFinancialModels,
  signedCents,
  type FinancialModelSummary,
} from "../src/model/financial-models.ts";

const set = (id: string, year: number, saved_at: string): FinancialModelSummary => ({
  id,
  organization_id: "org",
  fiscal_year: year,
  name: id,
  message: null,
  saved_at,
});

describe("newestFinancialModels", () => {
  it("keeps each year's latest financial model", () => {
    const newest = newestFinancialModels([
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

describe("movedOn", () => {
  const members = [
    { version_id: "ops-1", kind: "operations" as const, program_area_id: null, name: "the Operations Plan" },
    { version_id: "youth-1", kind: "program_area" as const, program_area_id: "youth", name: "Youth Racing" },
  ];
  const names = new Map([
    ["youth", "Youth Racing"],
    ["adult", "Adult Programs"],
  ]);

  it("is empty while every active version is the one the financial model holds", () => {
    expect(
      movedOn(members, { operations: "ops-1", areas: [{ program_area_id: "youth", version_id: "youth-1" }] }, names),
    ).toEqual([]);
  });

  it("names an area that made another version active", () => {
    expect(
      movedOn(members, { operations: "ops-1", areas: [{ program_area_id: "youth", version_id: "youth-2" }] }, names),
    ).toEqual(["Youth Racing"]);
  });

  it("names the Operations Plan, and an area that wasn't in the financial model", () => {
    expect(
      movedOn(
        members,
        {
          operations: "ops-2",
          areas: [
            { program_area_id: "youth", version_id: "youth-1" },
            { program_area_id: "adult", version_id: "adult-1" },
          ],
        },
        names,
      ),
    ).toEqual(["the Operations Plan", "Adult Programs"]);
  });
});

describe("listOf", () => {
  it.each([
    [["Youth Racing"], "Youth Racing"],
    [["Youth Racing", "Adult Programs"], "Youth Racing and Adult Programs"],
    [
      ["the Operations Plan", "Youth Racing", "Adult Programs"],
      "the Operations Plan, Youth Racing, and Adult Programs",
    ],
  ])("lists %j as %j", (names, text) => {
    expect(listOf(names)).toBe(text);
  });
});
