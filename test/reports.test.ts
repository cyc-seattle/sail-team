import { describe, expect, it } from "vitest";
import {
  defaultSort,
  netOf,
  nextSort,
  numberedOfferings,
  sessionGrid,
  sortRows,
  type OverviewRow,
  type ReportOffering,
} from "../src/model/reports.ts";

const row = (name: string, revenue: number, offerings = 1): OverviewRow => ({
  report: name,
  name,
  revenue_cents: revenue,
  direct_cents: revenue / 2,
  indirect_cents: 0,
  offerings,
  sailors: 1,
  days: 1,
  sailor_days: 1,
});

describe("sortRows", () => {
  const rows = [row("Non-program", 900, 0), row("Adventure", 100), row("Summer", 500)];

  it("puts the largest revenue first, and Non-program last", () => {
    expect(sortRows(rows, defaultSort).map((r) => r.name)).toEqual(["Summer", "Adventure", "Non-program"]);
  });

  it("sorts by name from A, and keeps Non-program last", () => {
    expect(sortRows(rows, nextSort(defaultSort, "name")).map((r) => r.name)).toEqual([
      "Adventure",
      "Summer",
      "Non-program",
    ]);
  });
});

describe("nextSort", () => {
  it("turns the same column around, and starts another from the largest", () => {
    expect(nextSort(defaultSort, "revenue_cents")).toEqual({ key: "revenue_cents", descending: false });
    expect(nextSort(defaultSort, "net_cents")).toEqual({ key: "net_cents", descending: true });
  });
});

describe("netOf", () => {
  it("takes direct and indirect costs from revenue", () => {
    expect(netOf({ revenue_cents: 100, direct_cents: 60, indirect_cents: 25 })).toBe(15);
  });
});

const offering = (program: string, session: string, starts_on: string): ReportOffering => ({
  key: `${program} ${session}`,
  program,
  session,
  starts_on,
  ends_on: starts_on,
  fee_cents: 0,
  estimated: 0,
  max: 0,
  days: 0,
  hours: 0,
});

describe("numberedOfferings", () => {
  it("numbers each program's offerings by start date, programs in the order they start", () => {
    const groups = numberedOfferings([
      offering("K-Pod", "Fall", "2027-09-08"),
      offering("J-Pod", "Fall", "2027-09-07"),
      offering("K-Pod", "Spring", "2027-03-02"),
      offering("J-Pod", "Spring", "2027-03-01"),
    ]);
    expect(groups.map((g) => [g.program, g.offerings.map((o) => `${o.label} ${o.session}`)])).toEqual([
      ["J-Pod", ["J-Pod 1 Spring", "J-Pod 2 Fall"]],
      ["K-Pod", ["K-Pod 1 Spring", "K-Pod 2 Fall"]],
    ]);
  });
});

describe("sessionGrid", () => {
  it("puts sessions in the order they start, with a gap where a program skips one", () => {
    const { sessions, rows } = sessionGrid([
      offering("Race Camp", "Week 2", "2027-06-28"),
      offering("Guppies", "Week 2", "2027-06-28"),
      offering("Guppies", "Week 1", "2027-06-21"),
    ]);
    expect(sessions).toEqual(["Week 1", "Week 2"]);
    expect(rows.map((r) => [r.program, r.cells.map((c) => c?.label ?? null)])).toEqual([
      ["Guppies", ["Guppies 1", "Guppies 2"]],
      ["Race Camp", [null, "Race Camp 1"]],
    ]);
  });
});
