import { createMemoryHistory } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { makeRouter } from "../src/router.ts";

const resolve = async (path: string) => {
  const router = makeRouter(createMemoryHistory({ initialEntries: [path] }));
  await router.load();
  return router.state.matches.map((m) => m.routeId);
};

describe("the router", () => {
  it("serves the plans page at /plans", async () => {
    expect(await resolve("/plans")).toEqual(["__root__", "/plans/"]);
  });

  it("matches nothing but the root for a path it doesn't claim", async () => {
    expect(await resolve("/nowhere")).toEqual(["__root__"]);
  });
});
