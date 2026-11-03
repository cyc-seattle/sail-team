import { describe, expect, it } from "vitest";
import type { PlanSummary, VersionSummary } from "../src/directus/plans.ts";
import { newestFirst, planFor, plansByYear, stateOf } from "../src/model/plan-list.ts";

const plan = (id: string, year: number, kind: PlanSummary["kind"], name: string, area: string | null): PlanSummary => ({
  id,
  name,
  kind,
  fiscal_year: year,
  organization_id: "org",
  program_area_id: area && `${area}-id`,
  area_name: area,
});

const version = (id: string, status: VersionSummary["status"], saved_at: string | null): VersionSummary => ({
  id,
  plan_id: "p",
  status,
  message: null,
  saved_at,
  operations_version_id: null,
});

describe("plansByYear", () => {
  it("groups plans by year, newest first, with the Operations Plan last in each", () => {
    const groups = plansByYear([
      plan("a", 2026, "program_area", "Youth Racing", "Youth Racing"),
      plan("b", 2027, "operations", "Operations", null),
      plan("c", 2027, "program_area", "Youth Racing", "Youth Racing"),
    ]);
    expect(groups.map((g) => [g.year, g.plans.map((p) => p.id)])).toEqual([
      [2027, ["c", "b"]],
      [2026, ["a"]],
    ]);
  });
});

describe("planFor", () => {
  it("names an area's plan by its area, and the Operations Plan as such", () => {
    expect(planFor(plan("a", 2027, "program_area", "Youth 2027", "Youth Racing"))).toBe("Youth Racing");
    expect(planFor(plan("b", 2027, "operations", "Ops", null))).toBe("Operations Plan");
  });
});

describe("newestFirst", () => {
  it("puts the draft first, then saved versions from the latest save back", () => {
    const sorted = newestFirst([
      version("old", "saved", "2027-01-05T10:00:00Z"),
      version("draft", "draft", null),
      version("new", "saved", "2027-03-03T10:00:00Z"),
    ]);
    expect(sorted.map((v) => v.id)).toEqual(["draft", "new", "old"]);
  });
});

describe("stateOf", () => {
  it("marks the draft, the active saved version, and the rest", () => {
    expect(stateOf(version("d", "draft", null), "x")).toBe("draft");
    expect(stateOf(version("x", "saved", "2027"), "x")).toBe("active");
    expect(stateOf(version("y", "saved", "2027"), "x")).toBe("saved");
  });
});
