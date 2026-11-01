import { describe, expect, it } from "vitest";
import { parentPermissions, plannerPermissions } from "../src/mocks/fixtures.ts";
import { navFor } from "../src/model/nav.ts";

describe("navFor", () => {
  it("shows Plans to someone who can read plans", () => {
    expect(navFor(plannerPermissions)).toEqual([{ to: "/plans", label: "Plans" }]);
  });

  it("hides it from someone who can't", () => {
    expect(navFor(parentPermissions)).toEqual([]);
  });
});
