import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  financialPlanQuery,
  startFinancialPlan,
  updateFinancialPlan,
  type FinancialPlan,
} from "../src/directus/financial-plans.ts";
import { handlers } from "../src/mocks/handlers.ts";
import { ids } from "../src/mocks/plans.ts";

vi.stubGlobal("window", { location: { hostname: "example.org" } });
const server = setupServer(...handlers("https://directus.example.org"));
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterAll(() => server.close());

const plan = (id: string) =>
  (financialPlanQuery(id).queryFn as unknown as () => Promise<FinancialPlan | null>)().then((p) => p!);

describe("changing Financial Plans in Directus", () => {
  it("renames a draft and changes its note", async () => {
    await updateFinancialPlan(ids.twoCoaches, { name: "Two coaches, more boats", note: "For the board" });
    expect((await plan(ids.twoCoaches)).set).toMatchObject({
      name: "Two coaches, more boats",
      note: "For the board",
    });
  });

  it("renames a frozen one", async () => {
    await updateFinancialPlan(ids.budget, { name: "Adopted budget", note: "Reviewed with the board" });
    expect((await plan(ids.budget)).set.name).toBe("Adopted budget");
  });

  it("starts a draft from a frozen one, in its year, holding a copy of each of its plans", async () => {
    const budget = await plan(ids.budget);
    const id = await startFinancialPlan(budget, { name: "Budget copy", note: null });
    const { set, plans } = await plan(id);
    expect(set).toMatchObject({ name: "Budget copy", status: "draft", fiscal_year: 2027, parent: { id: ids.budget } });
    const areas = (p: { plans: { kind: string; program_area_id: string | null }[] }) =>
      p.plans.map((m) => `${m.kind} ${m.program_area_id}`).sort();
    expect(areas({ plans })).toEqual(areas(budget));
    expect(plans.map((m) => m.id)).not.toContain(budget.plans[0]!.id);
  });
});
