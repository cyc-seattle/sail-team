import { createMemoryHistory, isRedirect } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { makeRouter } from "../src/router.ts";
import { Route as planRoute } from "../src/routes/plans/$planId/index.tsx";
import { Route as clubPlanRoute } from "../src/routes/plans/club/$setId/index.tsx";
import { Route as rostersRoute } from "../src/routes/rosters/index.tsx";

const resolve = (path: string) => {
  const router = makeRouter(createMemoryHistory({ initialEntries: [path] }));
  return router.matchRoutes(path).map((m) => m.routeId);
};

describe("the router", () => {
  it.each([
    ["/", "/"],
    ["/plans", "/plans/"],
    ["/roster", "/roster/"],
    ["/plans/financial/abc", "/plans/financial/$setId/"],
    ["/plans/financial/abc/def", "/plans/financial/$setId/$planId"],
    ["/plans/compare/abc/def", "/plans/compare/$a/$b"],
    ["/plans/abc", "/plans/$planId/"],
    ["/plans/club/abc", "/plans/club/$setId/"],
  ])("serves %s with its page", (path, route) => {
    expect(resolve(path)).toEqual(["__root__", route]);
  });

  // router.load() doesn't follow a redirect outside a browser, so this calls the route's beforeLoad itself.
  it("sends /rosters, where the page used to be, to /roster", () => {
    let thrown: unknown;
    try {
      (rostersRoute.options.beforeLoad as () => void)();
    } catch (error) {
      thrown = error;
    }
    expect(isRedirect(thrown) && thrown.options.to).toBe("/roster");
  });

  it("sends a club plan's old address to its Financial Plan", () => {
    let thrown: unknown;
    try {
      (clubPlanRoute.options.beforeLoad as (ctx: { params: { setId: string } }) => void)({ params: { setId: "abc" } });
    } catch (error) {
      thrown = error;
    }
    expect(isRedirect(thrown) && [thrown.options.to, thrown.options.params]).toEqual([
      "/plans/financial/$setId",
      { setId: "abc" },
    ]);
  });

  it("sends a plan's old page, which plans no longer have, to the Financial Plans", () => {
    let thrown: unknown;
    try {
      (planRoute.options.beforeLoad as () => void)();
    } catch (error) {
      thrown = error;
    }
    expect(isRedirect(thrown) && thrown.options.to).toBe("/plans");
  });

  it("matches nothing but the root for a path it doesn't claim", () => {
    expect(resolve("/nowhere")).toEqual(["__root__"]);
  });
});
