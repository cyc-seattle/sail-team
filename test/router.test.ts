import { createMemoryHistory } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { makeRouter } from "../src/router.ts";

const resolve = (path: string) => {
  const router = makeRouter(createMemoryHistory({ initialEntries: [path] }));
  return router.matchRoutes(path).map((m) => m.routeId);
};

describe("the router", () => {
  it.each([
    ["/plans", "/plans/"],
    ["/plans/abc", "/plans/$planId/"],
    ["/plans/abc/def", "/plans/$planId/$versionId"],
    ["/plans/club/abc", "/plans/club/$setId/"],
    ["/plans/club/abc/now", "/plans/club/$setId/now"],
  ])("serves %s with its page", (path, route) => {
    expect(resolve(path)).toEqual(["__root__", route]);
  });

  it("matches nothing but the root for a path it doesn't claim", () => {
    expect(resolve("/nowhere")).toEqual(["__root__"]);
  });
});
