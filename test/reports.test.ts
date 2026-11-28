import { describe, expect, it } from "vitest";
import {
  budget,
  capitalList,
  defaultSort,
  netOf,
  nextSort,
  enrollment,
  lineAmounts,
  numberedOfferings,
  onWaterMinutes,
  productsOf,
  reportOffering,
  fees,
  functionalExpenses,
  notesOf,
  sortRows,
  type OverviewRow,
  type ReportOffering,
  withResults,
  byTermAndProgram,
  chargedToArea,
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
  cogs_rate: null,
  note: null,
});

describe("numberedOfferings", () => {
  it("names each program's offerings by session, by start date, programs A to Z", () => {
    const groups = numberedOfferings([
      offering("K-Pod", "Fall", "2027-09-08"),
      offering("J-Pod", "Fall", "2027-09-07"),
      offering("K-Pod", "Spring", "2027-03-02"),
      offering("J-Pod", "Spring", "2027-03-01"),
    ]);
    expect(groups.map((g) => [g.program, g.offerings.map((o) => o.label)])).toEqual([
      ["J-Pod", ["J-Pod Spring", "J-Pod Fall"]],
      ["K-Pod", ["K-Pod Spring", "K-Pod Fall"]],
    ]);
  });

  it("puts programs in the catalog's sort order, then those with none A to Z, whenever they start", () => {
    const groups = numberedOfferings([
      offering("Youth Beginner", "Week 1", "2027-06-28"),
      offering("Teen Sailing", "Week 1", "2027-06-28"),
      { ...offering("Youth Advanced", "Week 2", "2027-07-05"), program_sort: 2 },
      { ...offering("Guppies Sailing", "Week 1", "2027-06-28"), program_sort: 1 },
      offering("Teen Adventure", "Week 4", "2027-07-19"),
    ]);
    expect(groups.map((g) => g.program)).toEqual([
      "Guppies Sailing",
      "Youth Advanced",
      "Teen Adventure",
      "Teen Sailing",
      "Youth Beginner",
    ]);
  });

  it("names offerings in one session by what their own names add, without the year", () => {
    const groups = numberedOfferings([
      { ...offering("Adult LTS", "Summer", "2027-07-01"), name: "Adult LTS Weekend Jul 2027" },
      { ...offering("Adult LTS", "Summer", "2027-07-01"), key: "weekday", name: "Adult LTS Weekday Jul 2027" },
      { ...offering("Guppies", "Summer", "2027-07-12"), name: "Guppies week of 2027-07-12" },
      { ...offering("Guppies", "Summer", "2027-07-05"), name: "Guppies week of 2027-07-05" },
    ]);
    expect(groups.map((g) => g.offerings.map((o) => o.label))).toEqual([
      ["Adult LTS Weekday Jul", "Adult LTS Weekend Jul"],
      ["Guppies week of Jul 5", "Guppies week of Jul 12"],
    ]);
  });

  it("names each offering apart from its program too", () => {
    const groups = numberedOfferings([
      { ...offering("Guppies Sailing", "Summer", "2027-06-28"), name: "Guppies Sailing Week 2" },
      { ...offering("Guppies Sailing", "Summer", "2027-06-21"), key: "w1", name: "Guppies Sailing Week 1" },
    ]);
    expect(groups[0]?.offerings.map((o) => [o.own, o.label])).toEqual([
      ["Week 1", "Guppies Sailing Week 1"],
      ["Week 2", "Guppies Sailing Week 2"],
    ]);
  });

  it("names offerings in one session by the day they start when their own names don't tell them apart", () => {
    const groups = numberedOfferings([
      offering("Guppies", "Summer", "2027-07-12"),
      offering("Guppies", "Summer", "2027-07-05"),
    ]);
    expect(groups[0]?.offerings.map((o) => o.label)).toEqual(["Guppies Jul 5", "Guppies Jul 12"]);
  });
});

describe("fees", () => {
  const guppies = [
    { ...offering("Guppies", "Week 1", "2027-06-21"), fee_cents: 40_000, estimated: 5, days: 5, hours: 20 },
    { ...offering("Guppies", "Week 2", "2027-06-28"), fee_cents: 20_000, estimated: 5, days: 5, hours: 20 },
  ];

  it("averages each program's fees over its sailors, days and hours", () => {
    expect(fees(guppies)).toEqual([
      { name: "Guppies", per_offering_cents: 30_000, per_day_cents: 6_000, per_hour_cents: 1_500 },
    ]);
  });

  it("lists programs A to Z", () => {
    const offerings = [
      { ...offering("Youth Intermediate", "Week 2", "2027-06-28") },
      { ...offering("Teen Sailing", "Week 1", "2027-06-21") },
      { ...offering("Youth Beginner", "Week 1", "2027-06-21") },
    ];
    expect(fees(offerings).map((f) => f.name)).toEqual(["Teen Sailing", "Youth Beginner", "Youth Intermediate"]);
  });
});

describe("functionalExpenses", () => {
  const line = (fields: Partial<Parameters<typeof functionalExpenses>[0][number]>) => ({
    key: "line",
    name: "Line",
    account_number: null,
    account_name: "Account",
    amount_cents: 100,
    revenue: false,
    capital: false,
    function: "program" as const,
    ...fields,
  });

  it("adds up expenses by function, leaving out revenue and capital, and counts none as management", () => {
    expect(
      functionalExpenses([
        line({ amount_cents: 500 }),
        line({ key: "pool:ga:insurance", amount_cents: 200, function: "management" }),
        line({ amount_cents: 50, function: null }),
        line({ amount_cents: 70, function: "fundraising" }),
        line({ amount_cents: 1_000, revenue: true }),
        line({ amount_cents: 9_000, capital: true }),
      ]),
    ).toEqual({ program_cents: 500, management_cents: 250, fundraising_cents: 70 });
  });
});

describe("enrollment", () => {
  const offerings = [
    { ...offering("J-Pod", "Fall", "2027-09-07"), estimated: 10, max: 16, days: 20 },
    { ...offering("K-Pod", "Spring", "2027-03-02"), estimated: 12, max: 16, days: 20 },
    { ...offering("J-Pod", "Spring", "2027-03-01"), estimated: 8, max: 16, days: 20 },
  ];

  it("adds up each program, A to Z", () => {
    expect(enrollment(offerings)).toEqual([
      { name: "J-Pod", offerings: 2, sailors: 18, max: 32, sailor_days: 360 },
      { name: "K-Pod", offerings: 1, sailors: 12, max: 16, sailor_days: 240 },
    ]);
  });
});

describe("budget", () => {
  it("adds up each program's revenue and expenses, A to Z", () => {
    const offerings = [
      { ...offering("K-Pod", "Spring", "2027-03-02"), revenue_cents: 500, expense_cents: 300 },
      { ...offering("J-Pod", "Spring", "2027-03-01"), revenue_cents: 100, expense_cents: 50 },
      { ...offering("J-Pod", "Fall", "2027-09-07"), revenue_cents: 200, expense_cents: 70 },
    ];
    expect(budget(offerings)).toEqual([
      { name: "J-Pod", revenue_cents: 300, expense_cents: 120 },
      { name: "K-Pod", revenue_cents: 500, expense_cents: 300 },
    ]);
  });
});

describe("notesOf", () => {
  it("trims each note, dropping blank ones", () => {
    expect(notesOf(["Two coaches on the water.", "  ", "  Keep a RIB ashore.  "])).toEqual([
      "Two coaches on the water.",
      "Keep a RIB ashore.",
    ]);
    expect(notesOf(null)).toEqual([]);
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
    id: "camp",
    name: "Camp, week 1",
    term_id: null,
    starts_on: "2027-07-05",
    ends_on: "2027-07-09",
    price_cents: 50_000,
    capacity: null,
    program: "Camp",
    estimated: 8,
    cogs_rate: null,
    note: null,
  };
  const day = (date: string, kind: "practice" | "travel" = "practice") => ({
    date,
    kind,
    uses_boats: true,
    start_time: "09:00:00",
    end_time: "12:00:00",
    on_water_minutes: null,
  });

  it("names its session by its own name without its program's, and keeps its term", () => {
    expect(
      reportOffering({ ...offering, name: "Camp Week 3", term_id: "summer", term: "Summer 2027" }, []),
    ).toMatchObject({ session: "Week 3", term_id: "summer", term: "Summer 2027" });
    expect(reportOffering(offering, [])).toMatchObject({ session: "Camp, week 1", term_id: null, term: null });
  });

  it("counts the dates it has an activity other than travel, and one sailor's hours on the water", () => {
    expect(
      reportOffering(offering, [day("2027-07-05"), day("2027-07-05"), day("2027-07-06"), day("2027-07-04", "travel")]),
    ).toMatchObject({ days: 2, hours: 9 });
  });

  it("names its session by its name when it has none, and takes its sailors as its max when it has no capacity", () => {
    expect(reportOffering(offering, [])).toMatchObject({
      session: "Camp, week 1",
      max: 8,
      max_set: false,
      fee_cents: 50_000,
    });
  });
});

describe("withResults", () => {
  const offering = (key: string) => ({
    key,
    program: "Guppies",
    session: key,
    starts_on: "2027-07-05",
    ends_on: "2027-07-09",
    fee_cents: 0,
    estimated: 8,
    max: 10,
    days: 5,
    hours: 15,
    cogs_rate: null,
    note: null,
  });

  it("gives each offering its room, breakeven and money from its own P&L row, and none without one", () => {
    const pnl = [
      {
        level: "offering" as const,
        subject_id: "w1",
        allocation_holds: 12,
        breakeven_enrollment: 6,
        revenue_cents: 500,
        expense_cents: 300,
        term_id: "t",
        term_name: "Summer 2027",
      },
      {
        level: "product" as const,
        subject_id: "w2",
        allocation_holds: 99,
        breakeven_enrollment: 99,
        revenue_cents: 99,
        expense_cents: 99,
        term_id: null,
        term_name: null,
      },
    ];
    expect(withResults([offering("w1"), offering("w2")], pnl)).toMatchObject([
      { key: "w1", room: 12, breakeven: 6, revenue_cents: 500, expense_cents: 300 },
      { key: "w2", room: null, breakeven: null, revenue_cents: 0, expense_cents: 0 },
    ]);
  });
});

describe("productsOf", () => {
  const line = (key: string, center: string | null, cents: number, revenue = false) => ({
    key,
    name: key,
    account_number: null,
    account_name: key,
    cost_center_id: center,
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

  it("puts the unallocated indirect costs in a row of their own, last", () => {
    const products = (cents: number) =>
      productsOf([line("salary", null, 500), line("unrecovered:ga:insurance", null, cents)], []).map((p) => [
        p.name,
        p.direct_cents,
      ]);
    expect(products(700)).toEqual([
      ["Organization", 500],
      ["Unallocated indirect costs", 700],
    ]);
    expect(products(-200)).toEqual([
      ["Organization", 500],
      ["Over-allocated indirect costs", -200],
    ]);
  });
});

describe("lineAmounts", () => {
  const line = (name: string, explanation: string | null, center: string, cents: number) => ({
    key: name,
    name,
    account_number: null,
    account_name: "Coach wages",
    cost_center_id: center,
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

describe("capitalList", () => {
  const line = (key: string, name: string, cents: number) => ({
    key,
    name,
    account_number: "1510",
    account_name: "Equipment",
    cost_center_id: null,
    cost_center_type: "org" as const,
    amount_cents: cents,
    revenue: false,
    capital: true,
    function: null,
    explanation: null,
    plan: null,
  });
  const totals = {
    operating_revenue_cents: 0,
    operating_expense_cents: 0,
    operating_net_cents: 4_000,
    fundraising_revenue_cents: 0,
    fundraising_expense_cents: 0,
    fundraising_net_cents: 2_000,
    capital_cents: 0,
    total_cents: 0,
  };

  it("lists the ranked items, then capital entered as a budget line with no rank, and what the money covers", () => {
    const { items, available_cents } = capitalList(
      {
        totals,
        lines: [line("capital:boat", "Coach boat", 5_000), line("budget:trailer", "Trailer", 3_000)],
        capital: [
          { rank: 1, key: "boat", name: "Coach boat", amount_cents: 5_000, running_cents: 5_000, funded: true },
          { rank: 2, key: "trailer", name: "Trailer", amount_cents: 3_000, running_cents: 8_000, funded: false },
        ],
      },
      { boat: { note: "Replaces the oldest RIB", link: null } },
    );
    expect(available_cents).toBe(6_000);
    expect(items.map((i) => [i.rank, i.name, i.account_number, i.running_cents, i.funded, i.note])).toEqual([
      [1, "Coach boat", "1510", 5_000, true, "Replaces the oldest RIB"],
      [null, "Trailer", "1510", 8_000, false, null],
    ]);
  });

  it("lists results from before capital was ranked with no rank, in their order", () => {
    const { items } = capitalList(
      { totals, lines: [line("budget:boat", "Coach boat", 5_000), line("budget:sails", "Sails", 2_000)], capital: [] },
      {},
    );
    expect(items.map((i) => [i.rank, i.name, i.running_cents, i.funded])).toEqual([
      [null, "Coach boat", 5_000, true],
      [null, "Sails", 7_000, false],
    ]);
  });
});

describe("byTermAndProgram", () => {
  const at = (program: string, session: string, starts_on: string, term: string | null) => ({
    ...offering(program, session, starts_on),
    term,
  });

  it("groups by term in the order they start, no term last, then by program, then by start date", () => {
    const groups = byTermAndProgram([
      at("K-Pod", "Fall", "2027-09-02", "Fall"),
      at("Race Camp", "Week 2", "2027-07-01", null),
      at("J-Pod", "Fall", "2027-09-01", "Fall"),
      at("J-Pod", "Spring", "2027-03-01", "Spring"),
      at("J-Pod", "Fall 2", "2027-10-01", "Fall"),
    ]);
    expect(groups.map((g) => [g.term, g.programs.map((p) => [p.program, p.offerings.map((o) => o.session)])])).toEqual([
      ["Spring", [["J-Pod", ["Spring"]]]],
      [
        "Fall",
        [
          ["J-Pod", ["Fall", "Fall 2"]],
          ["K-Pod", ["Fall"]],
        ],
      ],
      [null, [["Race Camp", ["Week 2"]]]],
    ]);
  });
});

describe("chargedToArea", () => {
  const offerings = [
    { ...offering("J-Pod", "Spring", "2027-03-01"), revenue_cents: 100, expense_cents: 60 },
    { ...offering("K-Pod", "Spring", "2027-03-01"), revenue_cents: 80, expense_cents: 70 },
  ];

  it("is the area's total less its offerings', or nothing when they match", () => {
    expect(chargedToArea(offerings, { revenue_cents: 180, expense_cents: 170 })).toEqual({
      revenue_cents: 0,
      expense_cents: 40,
    });
    expect(chargedToArea(offerings, { revenue_cents: 180, expense_cents: 130 })).toBeNull();
    expect(chargedToArea(offerings, null)).toBeNull();
  });
});
