import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { financialPlanQuery, financialPlansQuery, type FinancialPlan } from "../src/directus/financial-plans.ts";
import { planInputsQuery, type PlanInputs } from "../src/directus/plan-inputs.ts";
import { handlers } from "../src/mocks/handlers.ts";
import { ids } from "../src/mocks/plans.ts";
import type { ListedPlan, PlanLine } from "../src/model/financial-plans.ts";
import {
  numberedOfferings,
  overviewRows,
  planWarnings,
  sharedCostsOf,
  statementOf,
  storageOf,
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
  const { set, plans } = await plan(id);
  return run<PlanInputs>(planInputsQuery(set, plans));
};

describe("reading Financial Plans from Directus", () => {
  it("lists every Financial Plan with its totals and warnings, once they're worked out", async () => {
    const plans = await run<ListedPlan[]>(financialPlansQuery);
    expect(plans.map((p) => [p.name, p.status, p.parent?.name ?? null])).toEqual([
      ["Budget", "frozen", null],
      ["Two coaches", "draft", "Budget"],
      ["Three coaches", "draft", "Budget"],
      ["First pass", "frozen", null],
    ]);
    const [budget, two, three, first] = plans;
    expect([budget!.archived, first!.archived]).toEqual([false, true]);
    // A draft can be active from a later date. Which is in force depends on today, which tests of inForce pin.
    expect([budget, two, three].map((p) => p!.in_force?.from ?? null)).toEqual(["2026-07-01", "2027-09-01", null]);
    expect(budget!.net_cents).toBe(budget!.revenue_cents! - budget!.expense_cents!);
    // Operating only: fundraising and capital stay out.
    const { results } = await plan(ids.budget);
    const t = results!.totals;
    expect(t.fundraising_revenue_cents).toBeGreaterThan(0);
    expect(budget).toMatchObject({
      revenue_cents: t.operating_revenue_cents,
      expense_cents: t.operating_expense_cents,
      net_cents: t.operating_net_cents,
    });
    expect(budget!.warnings).toBeGreaterThan(0);
    expect(two!.note).toBe("A fourth instructor on every **summer morning**.");
    expect([budget!.frozen_by, two!.frozen_by]).toEqual(["Morgan Keel", null]);
    // Every plan with results shows the release that worked them out, draft or frozen.
    expect([budget!.platform, two!.platform, three!.platform]).toEqual(["1.38.1", "1.38.1", null]);
    expect(three).toMatchObject({ revenue_cents: null, expense_cents: null, net_cents: null, warnings: 0 });
  });

  it("lists them without who froze them when Directus won't say", async () => {
    server.use(
      http.get("https://directus.example.org/users", () => HttpResponse.json({ errors: [] }, { status: 403 })),
    );
    try {
      const plans = await run<ListedPlan[]>(financialPlansQuery);
      expect(plans.map((p) => p.frozen_by)).toEqual([null, null, null, null]);
      expect(plans[0]!.frozen_at).toBe("2027-03-10T18:00:00Z");
    } finally {
      server.resetHandlers();
    }
  });

  it("reads a plan's results, each row with the plan it's charged in", async () => {
    const { set, plans, results } = await plan(ids.budget);
    expect(set).toMatchObject({
      name: "Budget",
      status: "frozen",
      effective_from: "2026-07-01",
      note: "Reviewed with the board",
    });
    expect(results?.calculated_at).toBe("2027-03-10T18:00:00Z");
    const summer = results!.lines.filter((l) => l.plan === ids.summerBudget);
    expect(summer.find((l) => l.revenue)).toMatchObject({ account_number: "4100", account_name: "Summer tuition" });
    expect(plans.map((m) => m.kind).sort()).toEqual(["operations", "program_area", "program_area"]);
  });

  it("reads each warning with its plan and date", async () => {
    const { results } = await plan(ids.budget);
    expect(results?.warnings).toContainEqual(
      expect.objectContaining({ code: "closed_date", plan: ids.summerBudget, date: "2027-07-05" }),
    );
    expect(results?.warnings).toContainEqual(
      expect.objectContaining({ code: "unallocated_activity", plan: ids.doublehandedBudget }),
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
  it("reads each plan's notes, by its report", async () => {
    const { notes } = await inputs(ids.budget);
    expect(notes[ids.summer]).toContainEqual(expect.stringContaining("share the dock"));
    expect(notes["rates"]).toContainEqual(expect.stringContaining("No more than 4 RIBs"));
    expect(notes[ids.doublehanded]).toBeNull();
  });

  it("reads each program area's offerings, with their days and one sailor's hours on the water", async () => {
    const { offerings } = await inputs(ids.budget);
    expect(offerings[ids.summer]?.find((o) => o.key === "key:Guppies Week 2")).toMatchObject({
      program: "Guppies",
      session: "Week 2",
      fee_cents: 39_500,
      estimated: 9,
      max: 10,
      days: 5,
      hours: 15,
    });
    expect(offerings[ids.doublehanded]?.map((o) => o.session)).toEqual(["Spring", "Fall"]);
  });

  it("reads each program's settings, with its staff level's name from the Operations Plan", async () => {
    const { programs } = await inputs(ids.budget);
    expect(programs[ids.summer]).toContainEqual(
      expect.objectContaining({ name: "Guppies", staff_level: "Instructor", sailors_per_coach: 10 }),
    );
    expect(programs[ids.summer]).toContainEqual(
      expect.objectContaining({ name: "420 Camp", staff_level: "Coach", sailors_per_coach: 8 }),
    );
  });

  it("reads the Operations Plan's rates, with each bonus on the position it pays, and each boat class's rates", async () => {
    const { operations, products } = await inputs(ids.budget);
    expect(operations?.rates?.mileage_rate_cents).toBe(70);
    expect(operations?.payrollTaxes.map((t) => [t.name, t.wage_share ?? t.hourly_cents])).toEqual([
      ["Social Security", 0.062],
      ["Medicare", 0.0145],
      ["WA unemployment", 0.0027],
      ["L&I", 45.235],
    ]);
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
      maintenance_per_boat_hour_cents: 200,
      fuel_per_hour_cents: 50,
      charter_per_day_cents: null,
    });
    expect(products).toEqual([{ key: "key:Boat storage", product: "Boat storage", product_id: expect.any(String) }]);
  });

  it("reads the Operations Plan's other inputs, naming the accounts, pools and positions their rows point at", async () => {
    const { operations } = await inputs(ids.budget);
    expect(operations?.positions.find((p) => p.name === "Program Director")).toMatchObject({
      hourly_coaching_rate_cents: 3_000,
      remainder_pool: "Program admin",
    });
    expect(operations?.charges[0]).toMatchObject({
      account: { number: "5310", name: "Card fees" },
      in_mtdc: true,
    });
    expect(operations?.fixedCosts.find((c) => c.name === "Audit")).toMatchObject({
      account: { number: "6110", name: "Insurance" },
      charged_to: "G&A",
      in_mtdc: false,
    });
    expect(operations?.fixedCosts.find((c) => c.name === "Spring gala costs")).toMatchObject({
      charged_to: "Example Sailing Club",
      revenue: false,
    });
    expect(operations?.fixedCosts.find((c) => c.name === "Spring gala gifts")?.revenue).toBe(true);
    expect(operations?.fixedCosts.find((c) => c.name === "Storage dock upkeep")?.charged_to).toBe("Boat storage 2027");
    expect(operations?.staffTime).toEqual([
      expect.objectContaining({ name: "Winter boat repairs", staff_level: "Instructor", hours: 120 }),
    ]);
    expect(operations?.salariedHours).toEqual([
      { key: "key:Program Director on Guppies", position: "Program Director", booked_to: "Guppies", hours: 200 },
    ]);
    expect(operations?.closedDays.map((d) => d.date)).toEqual(["2027-07-05"]);
  });

  it("reads each program area's blocks, with what each shares, and the names that say more than a date", async () => {
    const { schedule, offerings } = await inputs(ids.budget);
    const summer = schedule[ids.summer]!;
    const dock = summer.find((b) => b.date === "2027-06-21" && b.name === "Morning dock");
    expect(dock?.parts).toEqual(["3 Instructors", "2 RIBs", "6 Sailqubes"]);
    expect(dock?.activities.map((a) => [a.offering_key, a.setup_minutes, a.on_water_minutes])).toEqual([
      ["key:Guppies Week 1", 30, 180],
      ["key:Sea Otters Week 1", 30, 180],
    ]);
    // "J-Pod 2027-03-02" only repeats the program and the date.
    expect(schedule[ids.doublehanded]?.[0]).toMatchObject({
      name: null,
      parts: ["2 Coaches", "2 RIBs", "3 420s", "3 sailor-owned 420s"],
    });
    const numbered = new Map(
      numberedOfferings(offerings[ids.summer]!).flatMap((g) => g.offerings.map((o) => [o.key, o])),
    );
    expect(patternsOf(summer, numbered).find((p) => p.title === "Morning dock")?.exceptions).toEqual([
      "Jun 28 to Jul 2: 2 Instructors",
      "Jul 12 to 16: 9 Sailqubes",
    ]);
  });

  it("reads each program area's trips, and each offering's cost of goods and note", async () => {
    const { trips, offerings } = await inputs(ids.budget);
    expect(trips[ids.doublehanded]).toEqual([
      expect.objectContaining({
        key: "key:Fall regatta",
        offering_key: "key:J-Pod Fall",
        name: "Fall regatta",
        nights: 2,
        airfare_cents: null,
        miles: 240,
      }),
    ]);
    const opti = offerings[ids.summer]?.find((o) => o.key === "key:Opti Camp Week 1");
    expect(opti).toMatchObject({ cogs_rate: 0.04, note: "Lunch is included." });
  });

  it("reads each program area's own fixed costs and staff time, by its report", async () => {
    const { fixedCosts, staffTime } = await inputs(ids.budget);
    expect(fixedCosts[ids.summer]).toEqual([
      expect.objectContaining({ name: "Tent rental", charged_to: "Summer", in_mtdc: false }),
    ]);
    expect(staffTime[ids.summer]?.map((l) => [l.name, l.charged_to])).toEqual([["Camp setup", "Summer"]]);
    expect(fixedCosts[ids.doublehanded]).toBeUndefined();
  });
});

describe("a Financial Plan's reports", () => {
  it("has Overview rows that add up to the plan's operating totals", async () => {
    const { plans, results } = await plan(ids.budget);
    const { offerings } = await inputs(ids.budget);
    const rows = overviewRows(plans, results!.lines, offerings);
    const total = totalOf(rows);
    expect(total.revenue_cents).toBe(results!.totals.operating_revenue_cents);
    expect(total.direct_cents + total.indirect_cents).toBe(results!.totals.operating_expense_cents);
    expect(rows.find((r) => r.report === "non-program")?.offerings).toBe(0);
  });

  it("splits a program area's shared costs out by pool", async () => {
    const { results } = await plan(ids.budget);
    const { indirect } = statementOf(results!.lines.filter((l) => l.plan === ids.summerBudget));
    expect(indirect.map((a) => [a.number, a.name])).toEqual([
      [null, "G&A"],
      [null, "Program admin"],
    ]);
  });

  it("opens each account to its lines, worked out the same way across offerings", async () => {
    const { results } = await plan(ids.budget);
    const { direct } = statementOf(results!.lines.filter((l) => l.plan === ids.summerBudget));
    const wages = direct.find((a) => a.name === "Coach wages")!;
    const coaching = wages.lines!.find((l) => l.name === "Coach wages")!;
    expect(coaching.offerings).toBeGreaterThan(1);
    expect(coaching.explanation).toBeTruthy();
    expect(wages.lines!.reduce((total, l) => total + l.cents, 0)).toBe(wages.cents);
  });

  it("adds each shared cost back up, with the part the programs carry", async () => {
    const { results } = await plan(ids.budget);
    const insurance = sharedCostsOf(results!.lines, ids.opsBudget).find((c) => c.name === "Insurance")!;
    expect(insurance).toMatchObject({ pool: "G&A", number: "6110", total_cents: 900_000 });
    // The programs' indirect cost rates allocate part of it, and the organization keeps the rest, unallocated.
    expect(insurance.allocated_cents).toBeGreaterThan(0);
    expect(insurance.allocated_cents).toBeLessThan(insurance.total_cents);
  });

  it("names each warning's report", async () => {
    const { plans, results } = await plan(ids.budget);
    const areas = new Set(planWarnings(results!.warnings, plans).map((w) => w.area));
    expect(areas).toContain(ids.summer);
    expect(areas).toContain(ids.doublehanded);
  });
});

describe("the Storage tab", () => {
  it("shows each area's storage, then what every program shares, then what the rates leave unallocated", async () => {
    const { plans, results } = await plan(ids.budget);
    const costs = storageOf(results!.lines, plans);
    expect(costs.map((c) => [c.kind, c.payer, c.name])).toEqual([
      ["area", "Doublehanded", "Storage (dinghy float and dry storage, by area)"],
      ["area", "Summer", "Storage (dinghy float and dry storage, by area)"],
      ["shared", "Shared (G&A)", "Self storage facility"],
      ["unallocated", "No program", "Self storage facility"],
    ]);
    expect(costs.filter((c) => c.kind === "area").map((c) => c.cents)).toEqual([700_000, 980_000]);
  });
});

describe("the shared costs", () => {
  const line = (key: string, name: string, amount_cents: number, plan: string): PlanLine => ({
    key,
    name,
    account_number: "6110",
    account_name: "Insurance",
    cost_center_key: null,
    cost_center_type: "org",
    amount_cents,
    revenue: false,
    capital: false,
    function: "management",
    explanation: null,
    plan,
  });

  it("adds what the rates allocate to what's unallocated, or over-allocated", () => {
    const shared = sharedCostsOf(
      [
        line("pool:ga:insurance", "G&A share: Insurance", 700, "summer"),
        line("unrecovered:ga:insurance", "G&A unallocated: Insurance", 300, "ops"),
        line("pool:ga:audit", "G&A share: Audit", 600, "summer"),
        line("unrecovered:ga:audit", "G&A over-allocated: Audit", -100, "ops"),
      ],
      "ops",
    );
    expect(shared.map((c) => [c.pool, c.name, c.allocated_cents, c.total_cents])).toEqual([
      ["G&A", "Audit", 600, 500],
      ["G&A", "Insurance", 700, 1000],
    ]);
  });

  it("reads results from platform 2.2.0, which said not recovered", () => {
    const shared = sharedCostsOf(
      [
        line("pool:ga:insurance", "G&A share: Insurance", 700, "summer"),
        line("unrecovered:ga:insurance", "G&A not recovered: Insurance", 300, "ops"),
      ],
      "ops",
    );
    expect(shared.map((c) => [c.name, c.allocated_cents, c.total_cents])).toEqual([["Insurance", 700, 1000]]);
  });

  it("reads results from before the rates, where non-program's net covered part of each shared cost", () => {
    const shared = sharedCostsOf(
      [
        line("pool:ga:insurance", "G&A share: Insurance", 700, "summer"),
        line("offset:ga:insurance", "G&A covered by non-program: Insurance", 300, "ops"),
      ],
      "ops",
    );
    expect(shared.map((c) => [c.name, c.allocated_cents, c.total_cents])).toEqual([["Insurance", 700, 1000]]);
  });
});
