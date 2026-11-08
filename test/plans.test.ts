import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { financialPlanQuery, financialPlansQuery, type FinancialPlan } from "../src/directus/financial-plans.ts";
import { handlers } from "../src/mocks/handlers.ts";
import { ids } from "../src/mocks/plans.ts";
import { memberName, memberNet } from "../src/model/financial-plans.ts";

vi.stubGlobal("window", { location: { hostname: "example.org" } });
const server = setupServer(...handlers("https://directus.example.org"));
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterAll(() => server.close());

const run = <T>(options: { queryFn?: unknown }) => (options.queryFn as () => Promise<T>)();
const plan = (id: string) => run<FinancialPlan | null>(financialPlanQuery(id)).then((p) => p!);

describe("reading Financial Plans from Directus", () => {
  it("lists every Financial Plan, with a saved one's top-line numbers and what each started from", async () => {
    const plans = await run<Awaited<ReturnType<NonNullable<typeof financialPlansQuery.queryFn>>>>(financialPlansQuery);
    // Its gala and coach boat, fundraising and capital, are left out.
    expect(plans[0]?.topLine).toEqual({
      revenue_cents: 1_000_000,
      expense_cents: 800_000,
      gross_cents: 700_000,
      net_cents: 200_000,
    });
    expect(plans.map((p) => [p.name, p.status, p.parent?.name ?? null, p.topLine?.net_cents ?? null])).toEqual([
      ["Budget", "saved", null, 200_000],
      ["Two coaches", "draft", "Budget", null],
      ["Three coaches", "draft", "Budget", null],
    ]);
  });

  it("reads a saved one's results as they were saved, each row with the plan it's charged in", async () => {
    const { set, members, results } = await plan(ids.budget);
    expect(set).toMatchObject({ name: "Budget", status: "saved", message: "Reviewed with the board" });
    expect(results?.live).toBe(false);
    expect(results?.totals.operating_net_cents).toBe(500_000);
    const youth = members.find((m) => m.id === ids.youthMember)!;
    expect(memberName(youth)).toBe("Youth Racing");
    expect(memberNet(results!, youth)).toBe(400_000);
    expect(results?.lines.filter((l) => l.member === youth.id).map((l) => l.name)).toEqual([
      "Tuition",
      "Coach wages",
      "Office share: Office rent",
    ]);
    expect(results?.warnings.map((w) => w.code)).toEqual(["position_double_booked"]);
  });

  it("calculates a draft now, with every plan it holds, and charges each line to its plan", async () => {
    const { members, results } = await plan(ids.twoCoaches);
    expect(results?.live).toBe(true);
    const youth = members.find((m) => m.kind === "program_area")!;
    const operations = members.find((m) => m.kind === "operations")!;
    const offering = results!.pnl.find((p) => p.level === "offering")!;
    expect(offering).toMatchObject({ name: "Beginner camp, week 1", revenue_cents: 1_000_000, member: youth.id });
    // The office is shared out to the camp, so its share is the Program Plan's.
    const office = results!.lines.filter((l) => l.member === youth.id && l.name.startsWith("Office share"));
    expect(office.reduce((sum, l) => sum + l.amount_cents, 0)).toBe(200_000);
    expect(office.every((l) => l.cost_center_name === "Beginner camp, week 1")).toBe(true);
    expect(results!.totals.operating_net_cents).toBe(700_000);
    expect(memberName(operations)).toBe("Operations Plan");
  });

  it("warns about a practice on a day the Operations Plan says the club is closed", async () => {
    const { results } = await plan(ids.twoCoaches);
    expect(results?.warnings.map((w) => w.code)).toContain("closed_date");
  });

  it("finds no Financial Plan that isn't there", async () => {
    expect(await run(financialPlanQuery("00000000-0000-4000-8000-000000000000"))).toBeNull();
  });
});
