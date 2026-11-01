import { createMemoryHistory } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { makeRouter } from "../src/router.ts";

const resolve = (path: string) => {
  const router = makeRouter(createMemoryHistory({ initialEntries: [path] }));
  return router.matchRoutes(path).map((m) => m.routeId);
};

describe("the router", () => {
  it("serves the plans page at /plans", () => {
    expect(resolve("/plans")).toEqual(["__root__", "/plans/"]);
  });

  it("matches nothing but the root for a path it doesn't claim", () => {
    expect(resolve("/nowhere")).toEqual(["__root__"]);
  });
});
