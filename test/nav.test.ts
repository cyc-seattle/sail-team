import { describe, expect, it } from "vitest";
import { parentPermissions, plannerPermissions } from "../src/mocks/fixtures.ts";
import { navFor } from "../src/model/nav.ts";

describe("navFor", () => {
  it("shows Plans to someone who can read plans, and Rosters to a family on a team", () => {
    expect(navFor(plannerPermissions)).toEqual([
      { to: "/plans", label: "Plans" },
      { to: "/roster", label: "Rosters" },
    ]);
  });

  it("hides Rosters from a family on no team", () => {
    expect(navFor(parentPermissions)).toEqual([]);
  });
});
