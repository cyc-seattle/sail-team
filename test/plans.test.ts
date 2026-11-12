import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { financialPlanQuery, financialPlansQuery, type FinancialPlan } from "../src/directus/financial-plans.ts";
import { planInputsQuery, type PlanInputs } from "../src/directus/plan-inputs.ts";
import { handlers } from "../src/mocks/handlers.ts";
import { ids } from "../src/mocks/plans.ts";
import type { ListedPlan } from "../src/model/financial-plans.ts";
import {
  numberedOfferings,
  overviewRows,
  planWarnings,
  sharedCostsOf,
  statementOf,
  totalOf,
} from "../src/model/reports.ts";
import { patternsOf } from "../src/model/schedule.ts";

vi.stubGlobal("window", { location: { hostname: "example.org" } });
const server = setupServer(...handlers("https://directus.example.org"));
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterAll(() => server.close());

const run = <T>(options: { queryFn?: unknown }) => (options.queryFn as () => Promise<T>)();
const plan = (id: string) => run<FinancialPlan | null>(financialPlanQuery(id)).then((p) => p!);
const inputs = async (id: string) => {
  const { set, members } = await plan(id);
  return run<PlanInputs>(planInputsQuery(set, members));
};

describe("reading Financial Plans from Directus", () => {
  it("lists every Financial Plan with its totals and warnings, once they're worked out", async () => {
    const plans = await run<ListedPlan[]>(financialPlansQuery);
    expect(plans.map((p) => [p.name, p.status, p.parent?.name ?? null])).toEqual([
      ["Budget", "active", null],
      ["Two coaches", "draft", "Budget"],
      ["Three coaches", "draft", "Budget"],
      ["First pass", "saved", null],
    ]);
    const [budget, two, three, first] = plans;
    expect([budget!.archived, first!.archived]).toEqual([false, true]);
    expect(budget!.net_cents).toBe(budget!.revenue_cents! - budget!.expense_cents!);
    // Fundraising is in them; capital isn't.
    const { results } = await plan(ids.budget);
    const t = results!.totals;
    expect(budget!.net_cents).toBe(t.operating_net_cents + t.fundraising_net_cents);
    expect(t.fundraising_revenue_cents).toBeGreaterThan(0);
    expect(budget!.warnings).toBeGreaterThan(0);
    expect(two!.note).toBe("A fourth instructor on every summer morning.");
    expect([budget!.saved_by, two!.saved_by]).toEqual(["Morgan Keel", null]);
    expect([budget!.platform, two!.platform]).toEqual(["1.38.1", null]);
    expect(three).toMatchObject({ revenue_cents: null, expense_cents: null, net_cents: null, warnings: 0 });
  });

  it("lists them without who saved them when Directus won't say", async () => {
    server.use(
      http.get("https://directus.example.org/users", () => HttpResponse.json({ errors: [] }, { status: 403 })),
    );
    try {
      const plans = await run<ListedPlan[]>(financialPlansQuery);
      expect(plans.map((p) => p.saved_by)).toEqual([null, null, null, null]);
      expect(plans[0]!.saved_at).toBe("2027-03-10T18:00:00Z");
    } finally {
      server.resetHandlers();
    }
  });

  it("reads a plan's results, each row with the plan it's charged in", async () => {
    const { set, members, results } = await plan(ids.budget);
    expect(set).toMatchObject({ name: "Budget", status: "active", message: "Reviewed with the board" });
    expect(results?.calculated_at).toBe("2027-03-10T18:00:00Z");
    const summer = results!.lines.filter((l) => l.member === ids.summerMember);
    expect(summer.find((l) => l.revenue)).toMatchObject({ account_number: "4100", account_name: "Summer tuition" });
    expect(members.map((m) => m.kind).sort()).toEqual(["operations", "program_area", "program_area"]);
  });

  it("reads each warning with its plan and date", async () => {
    const { results } = await plan(ids.budget);
    expect(results?.warnings).toContainEqual(
      expect.objectContaining({ code: "closed_date", member: ids.summerMember, date: "2027-07-05" }),
    );
    expect(results?.warnings).toContainEqual(
      expect.objectContaining({ code: "unallocated_activity", member: ids.doublehandedMember }),
    );
  });

  it("has no results for a draft platform hasn't worked out yet", async () => {
    expect((await plan(ids.threeCoaches)).results).toBeNull();
  });

  it("finds no Financial Plan that isn't there", async () => {
    expect(await run(financialPlanQuery("00000000-0000-4000-8000-000000000000"))).toBeNull();
  });
});

describe("reading a Financial Plan's inputs from Directus", () => {
  it("reads each copy's rules, by its report", async () => {
    const { rules } = await inputs(ids.budget);
    expect(rules[ids.summerPlan]).toContain("share the dock");
    expect(rules["rates"]).toContain("No more than 4 RIBs");
    expect(rules[ids.doublehandedPlan]).toBeNull();
  });

  it("reads each program area's offerings, with their days and one sailor's hours on the water", async () => {
    const { offerings } = await inputs(ids.budget);
    expect(offerings[ids.summerPlan]?.find((o) => o.key === "key:Guppies Week 2")).toMatchObject({
      program: "Guppies",
      session: "Week 2",
      fee_cents: 39_500,
      estimated: 9,
      max: 10,
      days: 5,
      hours: 15,
    });
    expect(offerings[ids.doublehandedPlan]?.map((o) => o.session)).toEqual(["Spring", "Fall"]);
  });

  it("reads each program's settings, with its staff level's name from the Operations Plan", async () => {
    const { programs } = await inputs(ids.budget);
    expect(programs[ids.summerPlan]).toContainEqual(
      expect.objectContaining({ name: "Guppies", staff_level: "Level 1 Instructor", sailors_per_coach: 10 }),
    );
    expect(programs[ids.summerPlan]).toContainEqual(
      expect.objectContaining({ name: "420 Camp", staff_level: "Level 3 Coach", sailors_per_coach: 8 }),
    );
  });

  it("reads the Operations Plan's rates, with each bonus on the position it pays, and the boats the club has", async () => {
    const { operations, products } = await inputs(ids.budget);
    expect(operations?.rates?.payroll_tax_rate).toBe(0.1);
    expect(operations?.positions.map((p) => [p.name, p.bonuses.map((b) => b.bonus_rate)])).toEqual([
      ["Executive Director", []],
      ["Program Director", [0.05]],
    ]);
    expect(operations?.bonuses).toEqual([
      {
        key: "key:Program Director bonus",
        role_name: "Program Director",
        bonus_rate: 0.05,
        basis: "after_shared_costs",
        products: ["Guppies", "J-Pod", "Opti Camp"],
        account: { number: "5030", name: "Salaries" },
        position: "Program Director",
      },
    ]);
    expect(operations?.boatRates.find((b) => b.boat_class === "Sailqube")).toMatchObject({
      quantity: 12,
      sailors_per_boat: 2,
    });
    expect(products).toEqual([{ key: "key:Boat storage", product: "Boat storage" }]);
  });

  it("reads the Operations Plan's other inputs, naming the accounts, pools and positions their rows point at", async () => {
    const { operations } = await inputs(ids.budget);
    expect(operations?.rates?.rib_kind).toBe("RIB");
    expect(operations?.positions.find((p) => p.name === "Program Director")).toMatchObject({
      hourly_coaching_rate_cents: 3_000,
      remainder_pool: "Program admin",
    });
    expect(operations?.charges[0]).toMatchObject({
      account: { number: "5310", name: "Card fees" },
      excluded_from_mtdc: false,
    });
    expect(operations?.fixedCosts.find((c) => c.name === "Audit")).toMatchObject({
      account: { number: "6110", name: "Insurance" },
      charged_to: "G&A",
      excluded_from_mtdc: true,
    });
    expect(operations?.fixedCosts.find((c) => c.name === "Spring gala costs")).toMatchObject({
      charged_to: "Example Sailing Club",
      revenue: false,
    });
    expect(operations?.fixedCosts.find((c) => c.name === "Spring gala gifts")?.revenue).toBe(true);
    expect(operations?.fixedCosts.find((c) => c.name === "Storage dock upkeep")?.charged_to).toBe("Boat storage 2027");
    expect(operations?.staffTime).toEqual([
      expect.objectContaining({ name: "Winter boat repairs", staff_level: "Level 1 Instructor", hours: 120 }),
    ]);
    expect(operations?.salariedHours).toEqual([
      { key: "key:Program Director on Guppies", position: "Program Director", booked_to: "Guppies", hours: 200 },
    ]);
    expect(operations?.closedDays.map((d) => d.date)).toEqual(["2027-07-05"]);
  });

  it("reads each program area's blocks, with what each shares, and the names that say more than a date", async () => {
    const { schedule, offerings } = await inputs(ids.budget);
    const summer = schedule[ids.summerPlan]!;
    const dock = summer.find((b) => b.date === "2027-06-21" && b.name === "Morning dock");
    expect(dock?.parts).toEqual(["3 Level 1 Instructors", "2 RIBs", "6 Sailqubes"]);
    expect(dock?.activities.map((a) => [a.offering_key, a.setup_minutes, a.on_water_minutes])).toEqual([
      ["key:Guppies Week 1", 30, 180],
      ["key:Sea Otters Week 1", 30, 180],
    ]);
    // "J-Pod 2027-03-02" only repeats the program and the date.
    expect(schedule[ids.doublehandedPlan]?.[0]).toMatchObject({
      name: null,
      parts: ["2 Level 3 Coaches", "2 RIBs", "3 420s, plus 3 sailors' own"],
    });
    const numbered = new Map(
      numberedOfferings(offerings[ids.summerPlan]!).flatMap((g) => g.offerings.map((o) => [o.key, o])),
    );
    expect(patternsOf(summer, numbered).find((p) => p.title === "Morning dock")?.exceptions).toEqual([
      "Jun 28 to Jul 2: 2 Level 1 Instructors",
      "Jul 12 to 16: 9 Sailqubes",
    ]);
  });

  it("reads each program area's trips, and each offering's cost of goods and note", async () => {
    const { trips, offerings } = await inputs(ids.budget);
    expect(trips[ids.doublehandedPlan]).toEqual([
      expect.objectContaining({
        key: "key:Fall regatta",
        offering_key: "key:J-Pod Fall",
        name: "Fall regatta",
        nights: 2,
        airfare_cents: null,
        miles: 240,
      }),
    ]);
    const opti = offerings[ids.summerPlan]?.find((o) => o.key === "key:Opti Camp Week 1");
    expect(opti).toMatchObject({ cogs_rate: 0.04, note: "Lunch is included." });
  });

  it("reads each program area's own fixed costs and staff time, by its report", async () => {
    const { fixedCosts, staffTime } = await inputs(ids.budget);
    expect(fixedCosts[ids.summerPlan]).toEqual([
      expect.objectContaining({ name: "Tent rental", charged_to: "Summer", excluded_from_mtdc: true }),
    ]);
    expect(staffTime[ids.summerPlan]?.map((l) => [l.name, l.charged_to])).toEqual([["Camp setup", "Summer"]]);
    expect(fixedCosts[ids.doublehandedPlan]).toBeUndefined();
  });
});

describe("a Financial Plan's reports", () => {
  it("has Overview rows that add up to the plan's operating totals", async () => {
    const { members, results } = await plan(ids.budget);
    const { offerings } = await inputs(ids.budget);
    const rows = overviewRows(members, results!.lines, offerings);
    const total = totalOf(rows);
    expect(total.revenue_cents).toBe(results!.totals.operating_revenue_cents);
    expect(total.direct_cents + total.indirect_cents).toBe(results!.totals.operating_expense_cents);
    expect(rows.find((r) => r.report === "non-program")?.offerings).toBe(0);
  });

  it("splits a program area's shared costs out by pool", async () => {
    const { results } = await plan(ids.budget);
    const { indirect } = statementOf(results!.lines.filter((l) => l.member === ids.summerMember));
    expect(indirect.map((a) => [a.number, a.name])).toEqual([
      [null, "G&A"],
      [null, "Program admin"],
    ]);
  });

  it("opens each account to its lines, worked out the same way across offerings", async () => {
    const { results } = await plan(ids.budget);
    const { direct } = statementOf(results!.lines.filter((l) => l.member === ids.summerMember));
    const wages = direct.find((a) => a.name === "Coach wages")!;
    const coaching = wages.lines!.find((l) => l.name === "Coach wages")!;
    expect(coaching.offerings).toBeGreaterThan(1);
    expect(coaching.explanation).toBeTruthy();
    expect(wages.lines!.reduce((total, l) => total + l.cents, 0)).toBe(wages.cents);
  });

  it("adds each shared cost back up, with the part the programs carry", async () => {
    const { results } = await plan(ids.budget);
    const insurance = sharedCostsOf(results!.lines, ids.opsMember).find((c) => c.name === "Insurance")!;
    expect(insurance).toMatchObject({ pool: "G&A", number: "6110", total_cents: 900_000 });
    // Non-program's net covers the rest.
    expect(insurance.allocated_cents).toBeGreaterThan(0);
    expect(insurance.allocated_cents).toBeLessThan(insurance.total_cents);
  });

  it("names each warning's report", async () => {
    const { members, results } = await plan(ids.budget);
    const areas = new Set(planWarnings(results!.warnings, members).map((w) => w.area));
    expect(areas).toContain(ids.summerPlan);
    expect(areas).toContain(ids.doublehandedPlan);
  });
});
