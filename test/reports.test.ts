import { describe, expect, it } from "vitest";
import {
  defaultSort,
  netOf,
  nextSort,
  enrollment,
  lineAmounts,
  numberedOfferings,
  onWaterMinutes,
  productsOf,
  reportOffering,
  programFees,
  rulesOf,
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

describe("programFees", () => {
  it("averages each program's fees over its sailors, days and hours", () => {
    const fees = programFees([
      { ...offering("Guppies", "Week 1", "2027-06-21"), fee_cents: 40_000, estimated: 5, days: 5, hours: 20 },
      { ...offering("Guppies", "Week 2", "2027-06-28"), fee_cents: 20_000, estimated: 5, days: 5, hours: 20 },
    ]);
    expect(fees).toEqual([
      { program: "Guppies", per_offering_cents: 30_000, per_day_cents: 6_000, per_hour_cents: 1_500 },
    ]);
  });
});

describe("enrollment", () => {
  const offerings = [
    { ...offering("J-Pod", "Fall", "2027-09-07"), estimated: 10, max: 16, days: 20 },
    { ...offering("K-Pod", "Spring", "2027-03-02"), estimated: 12, max: 16, days: 20 },
    { ...offering("J-Pod", "Spring", "2027-03-01"), estimated: 8, max: 16, days: 20 },
  ];

  it("adds up each session, in the order they start", () => {
    expect(enrollment(offerings, "session")).toEqual([
      { name: "Spring", offerings: 2, sailors: 20, max: 32, sailor_days: 400 },
      { name: "Fall", offerings: 1, sailors: 10, max: 16, sailor_days: 200 },
    ]);
  });

  it("adds up each program instead", () => {
    expect(enrollment(offerings, "program").map((r) => [r.name, r.sailors])).toEqual([
      ["J-Pod", 18],
      ["K-Pod", 12],
    ]);
  });
});

describe("rulesOf", () => {
  it("reads one rule a line, dropping blank lines", () => {
    expect(rulesOf("Two coaches on the water.\n\n  Keep a RIB ashore.  ")).toEqual([
      "Two coaches on the water.",
      "Keep a RIB ashore.",
    ]);
    expect(rulesOf(null)).toEqual([]);
  });
});

describe("onWaterMinutes", () => {
  const practice = { kind: "practice" as const, uses_boats: true, on_water_minutes: null };

  it("is the time set on the water, or the whole span, past midnight too", () => {
    expect(onWaterMinutes({ ...practice, start_time: "09:00:00", end_time: "12:00:00", on_water_minutes: 120 })).toBe(
      120,
    );
    expect(onWaterMinutes({ ...practice, start_time: "09:00:00", end_time: "12:30:00" })).toBe(210);
    expect(onWaterMinutes({ ...practice, start_time: "23:00:00", end_time: "01:00:00" })).toBe(120);
  });

  it("is none for a travel day, one without boats, or one with no times", () => {
    expect(onWaterMinutes({ ...practice, kind: "travel", start_time: "09:00:00", end_time: "12:00:00" })).toBe(0);
    expect(onWaterMinutes({ ...practice, uses_boats: false, start_time: "09:00:00", end_time: "12:00:00" })).toBe(0);
    expect(onWaterMinutes({ ...practice, start_time: null, end_time: null })).toBe(0);
  });
});

describe("reportOffering", () => {
  const offering = {
    key: "camp",
    name: "Camp, week 1",
    season_term: null,
    starts_on: "2027-07-05",
    ends_on: "2027-07-09",
    price_cents: 50_000,
    capacity: null,
    program: "Camp",
    estimated: 8,
  };
  const day = (date: string, kind: "practice" | "travel" = "practice") => ({
    date,
    kind,
    uses_boats: true,
    start_time: "09:00:00",
    end_time: "12:00:00",
    on_water_minutes: null,
  });

  it("counts the dates it has an activity other than travel, and one sailor's hours on the water", () => {
    expect(
      reportOffering(offering, [day("2027-07-05"), day("2027-07-05"), day("2027-07-06"), day("2027-07-04", "travel")]),
    ).toMatchObject({ days: 2, hours: 9 });
  });

  it("names its session by its name when it has none, and takes its sailors as its max when it has no capacity", () => {
    expect(reportOffering(offering, [])).toMatchObject({ session: "Camp, week 1", max: 8, fee_cents: 50_000 });
  });
});

describe("productsOf", () => {
  const line = (key: string, center: string | null, cents: number, revenue = false) => ({
    key,
    name: key,
    account_number: null,
    account_name: key,
    cost_center_key: center,
    amount_cents: cents,
    revenue,
    capital: false,
    function: null,
  });

  it("adds up each product's revenue and own costs, leaving out shares of the pools, then the organization's", () => {
    expect(
      productsOf(
        [
          line("revenue", "storage", 1_000, true),
          line("upkeep", "storage", 300),
          line("pool:ga:insurance", "storage", 200),
          line("salary", null, 500),
        ],
        [{ key: "storage", product: "Boat storage" }],
      ),
    ).toEqual([
      { name: "Boat storage", revenue_cents: 1_000, direct_cents: 300 },
      { name: "Organization", revenue_cents: 0, direct_cents: 500 },
    ]);
  });
});

describe("lineAmounts", () => {
  const line = (name: string, explanation: string | null, center: string, cents: number) => ({
    key: name,
    name,
    account_number: null,
    account_name: "Coach wages",
    cost_center_key: center,
    cost_center_type: "offering" as const,
    amount_cents: cents,
    revenue: false,
    capital: false,
    function: null,
    explanation,
  });

  it("adds up lines with the same name and explanation, counting their offerings, largest first", () => {
    expect(
      lineAmounts([
        line("Coach wages", "hours × rate", "week-1", 100),
        line("Coach wages", "hours × rate", "week-2", 150),
        line("Coaching", "salary", "week-1", 400),
      ]),
    ).toEqual([
      { name: "Coaching", explanation: "salary", offerings: 1, cents: 400 },
      { name: "Coach wages", explanation: "hours × rate", offerings: 2, cents: 250 },
    ]);
  });
});
