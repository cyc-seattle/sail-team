import { describe, expect, it } from "vitest";
import { canRead, canSeeRosters, canWrite } from "../src/directus/access.ts";
import { parentPermissions, plannerPermissions, teamPermissions } from "../src/mocks/fixtures.ts";

describe("canRead", () => {
  it("is true for a collection read in full or in part", () => {
    expect(canRead(plannerPermissions, "plans")).toBe(true);
    expect(canRead(parentPermissions, "people")).toBe(true);
  });

  it("is false for a collection the user can't read, or before permissions load", () => {
    expect(canRead(parentPermissions, "plans")).toBe(false);
    expect(canRead(undefined, "plans")).toBe(false);
  });
});

describe("canWrite", () => {
  it("is true for a Plan Writer starting or changing a Financial Plan", () => {
    expect(canWrite(plannerPermissions, "version_sets", "create")).toBe(true);
    expect(canWrite(plannerPermissions, "version_sets", "update")).toBe(true);
  });

  it("is false for a collection the user only reads, or before permissions load", () => {
    expect(canWrite(plannerPermissions, "plans", "update")).toBe(false);
    expect(canWrite(undefined, "version_sets", "create")).toBe(false);
  });
});

describe("canSeeRosters", () => {
  it("is true for a household on a team, who read other adults' email", () => {
    expect(canSeeRosters(teamPermissions)).toBe(true);
  });

  it("is false for a household on no team, or before permissions load", () => {
    expect(canSeeRosters(parentPermissions)).toBe(false);
    expect(canSeeRosters(undefined)).toBe(false);
  });
});
