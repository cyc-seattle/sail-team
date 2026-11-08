import { describe, expect, it } from "vitest";
import { engineRows } from "../src/model/plan-data.ts";

describe("engineRows", () => {
  it("reads a table's decimals as numbers, and leaves the rest and empty values alone", () => {
    expect(engineRows("plan_offerings", [{ id: "a", fill_rate: "0.85", cogs_rate: null, name: "0.5" }])).toEqual([
      { id: "a", fill_rate: 0.85, cogs_rate: null, name: "0.5" },
    ]);
  });

  it("passes a table with no decimals through", () => {
    const rows = [{ id: "a", date: "2027-07-05" }];
    expect(engineRows("plan_activities", rows)).toBe(rows);
  });
});
