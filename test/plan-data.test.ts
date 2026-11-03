import { describe, expect, it } from "vitest";
import { engineRows, latestActivations, versionSet, type PlanRef } from "../src/model/plan-data.ts";

const area = (id: string, areaId: string): PlanRef => ({
  id,
  kind: "program_area",
  organization_id: "org",
  fiscal_year: 2027,
  program_area_id: areaId,
});
const active = [
  { program_area_id: "youth", version_id: "youth-active" },
  { program_area_id: "adult", version_id: "adult-active" },
];

describe("versionSet", () => {
  it("calculates an area's draft with its Operations Plan, the other areas' active versions, and itself", () => {
    const draft = { id: "youth-draft", plan_id: "youth-plan", operations_version_id: "ops-saved" };
    expect(versionSet(area("youth-plan", "youth"), draft, active)).toEqual([
      "ops-saved",
      "adult-active",
      "youth-draft",
    ]);
  });

  it("calculates an Operations Plan's draft with itself and every area's active version", () => {
    const ops: PlanRef = { ...area("ops-plan", "none"), kind: "operations", program_area_id: null };
    const draft = { id: "ops-draft", plan_id: "ops-plan", operations_version_id: null };
    expect(versionSet(ops, draft, active)).toEqual(["ops-draft", "youth-active", "adult-active"]);
  });

  it("leaves out an Operations Plan an area's draft doesn't name yet", () => {
    const draft = { id: "youth-draft", plan_id: "youth-plan", operations_version_id: null };
    expect(versionSet(area("youth-plan", "youth"), draft, [])).toEqual(["youth-draft"]);
  });
});

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

describe("latestActivations", () => {
  const row = (version: string, sequence: number, kind: "program_area" | "operations", areaId: string | null) => ({
    version_id: version,
    sequence,
    plan: { kind, program_area_id: areaId },
  });

  it("takes each area's and the Operations Plan's highest-numbered activation", () => {
    expect(
      latestActivations([
        row("youth-1", 1, "program_area", "youth"),
        row("youth-3", 3, "program_area", "youth"),
        row("adult-2", 2, "program_area", "adult"),
        row("ops-4", 4, "operations", null),
        row("ops-1", 1, "operations", null),
      ]),
    ).toEqual({
      areas: [
        { program_area_id: "youth", version_id: "youth-3" },
        { program_area_id: "adult", version_id: "adult-2" },
      ],
      operations: "ops-4",
    });
  });

  it("has no Operations Plan version before one is made active", () => {
    expect(latestActivations([]).operations).toBeNull();
  });
});
