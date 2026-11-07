import { createMemoryHistory, isRedirect } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { makeRouter } from "../src/router.ts";
import { Route as rostersRoute } from "../src/routes/rosters/index.tsx";

const resolve = (path: string) => {
  const router = makeRouter(createMemoryHistory({ initialEntries: [path] }));
  return router.matchRoutes(path).map((m) => m.routeId);
};

describe("the router", () => {
  it.each([
    ["/plans", "/plans/"],
    ["/roster", "/roster/"],
    ["/roster/abc", "/roster/$teamId"],
    ["/plans/abc", "/plans/$planId/"],
    ["/plans/abc/def", "/plans/$planId/$versionId"],
    ["/plans/club/abc", "/plans/club/$setId/"],
    ["/plans/club/abc/now", "/plans/club/$setId/now"],
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

  it("matches nothing but the root for a path it doesn't claim", () => {
    expect(resolve("/nowhere")).toEqual(["__root__"]);
  });
});
