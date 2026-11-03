import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  activationsQuery,
  calculateDraft,
  planQuery,
  plansQuery,
  savedResultsQuery,
  versionsQuery,
} from "../src/directus/plans.ts";
import { handlers } from "../src/mocks/handlers.ts";
import { ids } from "../src/mocks/plans.ts";

vi.stubGlobal("window", { location: { hostname: "example.org" } });
const server = setupServer(...handlers("https://directus.example.org"));
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterAll(() => server.close());

const run = <T>(options: { queryFn?: unknown }) => (options.queryFn as () => Promise<T>)();

describe("reading plans from Directus", () => {
  it("lists every plan, with its program area's name", async () => {
    const plans = await run<Awaited<ReturnType<NonNullable<typeof plansQuery.queryFn>>>>(plansQuery);
    expect(plans.map((p) => [p.name, p.area_name])).toEqual([
      ["Youth Racing 2027", "Youth Racing"],
      ["Adult Programs 2027", "Adult Programs"],
      ["Operations 2027", null],
    ]);
  });

  it("finds a plan's versions, and which saved version is active", async () => {
    const plan = await run<{ id: string; organization_id: string; fiscal_year: number }>(planQuery(ids.youthPlan));
    const versions = await run<{ id: string }[]>(versionsQuery(ids.youthPlan));
    expect(versions.map((v) => v.id)).toEqual([ids.youthDraft, ids.youthSaved2, ids.youthSaved1]);
    const active = await run<{ areas: { version_id: string }[]; operations: string }>(activationsQuery(plan as never));
    expect(active.areas.map((a) => a.version_id)).toEqual([ids.youthSaved1, ids.adultSaved]);
    expect(active.operations).toBe(ids.opsSaved);
  });

  it("reads a saved version's results as they were saved", async () => {
    const results = await run<{ pnl: { name: string; net_cents: number }[]; warnings: { code: string }[] }>(
      savedResultsQuery(ids.youthSaved2),
    );
    expect(results.pnl.map((p) => [p.name, p.net_cents])).toEqual([
      ["Beginner camp, week 1", 400_000],
      ["Youth Racing", 300_000],
    ]);
    expect(results.warnings.map((w) => w.code)).toEqual(["closed_day"]);
  });

  it("has no results for a version that has none yet", async () => {
    expect(await run(savedResultsQuery(ids.adultSaved))).toBeNull();
  });

  it("calculates a draft with the planning engine, from the draft's rows", async () => {
    const plan = await run<Parameters<typeof calculateDraft>[0]>(planQuery(ids.youthPlan));
    const versions = await run<Parameters<typeof calculateDraft>[1][]>(versionsQuery(ids.youthPlan));
    const draft = versions.find((v) => v.id === ids.youthDraft)!;
    const { output, names } = await calculateDraft(plan, draft);
    const offering = output.pnl.find((p) => p.level === "offering")!;
    expect(names.get(offering.key)).toBe("Beginner camp, week 1");
    expect(offering.revenue_cents).toBe(1_000_000);
  });
});

describe("a draft's warnings", () => {
  it("points out a practice on a day the Operations Plan says the club is closed", async () => {
    const plan = await run<Parameters<typeof calculateDraft>[0]>(planQuery(ids.youthPlan));
    const versions = await run<Parameters<typeof calculateDraft>[1][]>(versionsQuery(ids.youthPlan));
    const { output } = await calculateDraft(
      plan,
      versions.find((v) => v.id === ids.youthDraft)!,
    );
    expect(output.warnings).toContainEqual(expect.objectContaining({ code: "closed_date" }));
  });

  it("points out another area's active version saved with a different Operations Plan version", async () => {
    const plan = await run<Parameters<typeof calculateDraft>[0]>(planQuery(ids.youthPlan));
    const versions = await run<Parameters<typeof calculateDraft>[1][]>(versionsQuery(ids.youthPlan));
    const { output } = await calculateDraft(
      plan,
      versions.find((v) => v.id === ids.youthDraft)!,
    );
    const others = output.warnings.filter((w) => w.code === "other_operations_version");
    expect(others.map((w) => w.key)).toEqual([ids.adultSaved]);
    expect(others[0]!.message).toMatch(/^Adult Programs's plan was saved with a different Operations Plan version/);
  });

  it("has none for an offering in its own area's plan", async () => {
    const plan = await run<Parameters<typeof calculateDraft>[0]>(planQuery(ids.youthPlan));
    const versions = await run<Parameters<typeof calculateDraft>[1][]>(versionsQuery(ids.youthPlan));
    const { output } = await calculateDraft(
      plan,
      versions.find((v) => v.id === ids.youthDraft)!,
    );
    expect(output.warnings.map((w) => w.message)).not.toContainEqual(expect.stringMatching(/another program area/));
  });
});

describe("reading club plans", () => {
  it("lists each club plan with its totals", async () => {
    const { clubPlansQuery } = await import("../src/directus/club-plans.ts");
    const sets = await run<{ name: string; totals: { operating_net_cents: number } | null }[]>(clubPlansQuery);
    expect(sets.map((s) => [s.name, s.totals?.operating_net_cents])).toEqual([["March", 500_000]]);
  });

  it("reads a club plan's members, each area's P&L, and the Operations Plan's lines by name", async () => {
    const { clubPlanQuery } = await import("../src/directus/club-plans.ts");
    const club = await run<{
      members: { area_name: string | null; kind: string }[];
      pnl: { name: string; version_set_member_id: string }[];
      lines: { name: string; revenue: boolean; version_set_member_id: string }[];
    }>(clubPlanQuery(ids.clubPlan));
    expect(club.members.map((m) => m.area_name ?? m.kind)).toEqual(["Youth Racing", "Adult Programs", "operations"]);
    expect(club.pnl.map((p) => [p.name, p.version_set_member_id])).toEqual([
      ["Beginner camp, week 1", ids.youthMember],
    ]);
    expect(club.lines).toEqual([expect.objectContaining({ name: "Office rent", revenue: false })]);
  });

  it("keeps a club plan's rows out of a version's own results", async () => {
    const results = await run<{ pnl: { version_id?: string }[] }>(savedResultsQuery(ids.youthSaved2));
    expect(results.pnl).toHaveLength(2);
  });
});

describe("the club's plan as it stands now", () => {
  it("calculates today's active versions, and knows which area each offering is in", async () => {
    const { calculateClubNow } = await import("../src/directus/plans.ts");
    const { output, names, areas, areaOfOffering } = await calculateClubNow({
      organization_id: ids.org,
      fiscal_year: 2027,
    });
    // Adult Programs' active version has no offerings, and still counts as part of the plan.
    expect(areas.map((a) => names.get(a))).toEqual(["Youth Racing", "Adult Programs"]);
    const spring = output.pnl.find((p) => p.level === "offering" && names.get(p.key) === "Beginner camp, spring")!;
    expect(spring.revenue_cents).toBe(400_000);
    expect(areaOfOffering.get(spring.key)).toBe(ids.youth);
    // The draft's offering isn't in an active version, so it isn't counted.
    expect(output.pnl.some((p) => names.get(p.key) === "Beginner camp, week 1")).toBe(false);
  });
});

describe("a saved version in a club plan", () => {
  it("finds the club plan that holds it, with its offerings as the club plan counts them", async () => {
    const { versionInClubPlanQuery } = await import("../src/directus/club-plans.ts");
    const held = await run<{ set: { name: string }; pnl: { name: string }[] } | null>(
      versionInClubPlanQuery(ids.youthSaved1),
    );
    expect(held?.set.name).toBe("March");
    expect(held?.pnl.map((p) => p.name)).toEqual(["Beginner camp, week 1"]);
  });

  it("is null for a version no club plan holds", async () => {
    const { versionInClubPlanQuery } = await import("../src/directus/club-plans.ts");
    expect(await run(versionInClubPlanQuery(ids.youthSaved2))).toBeNull();
  });
});
