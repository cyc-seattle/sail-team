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
    await updateFinancialPlan(ids.twoCoaches, { name: "Two coaches, more boats", message: "For the board" });
    expect((await plan(ids.twoCoaches)).set).toMatchObject({
      name: "Two coaches, more boats",
      message: "For the board",
    });
  });

  it("renames a saved one", async () => {
    await updateFinancialPlan(ids.budget, { name: "Adopted budget", message: "Reviewed with the board" });
    expect((await plan(ids.budget)).set.name).toBe("Adopted budget");
  });

  it("starts a draft from a saved one, in its year, holding a copy of each of its plans", async () => {
    const budget = await plan(ids.budget);
    const id = await startFinancialPlan(budget, { name: "Budget copy", message: null });
    const { set, members } = await plan(id);
    expect(set).toMatchObject({ name: "Budget copy", status: "draft", fiscal_year: 2027, parent: { id: ids.budget } });
    expect(members.map((m) => m.plan_id).sort()).toEqual(budget.members.map((m) => m.plan_id).sort());
  });
});
