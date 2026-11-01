import { describe, expect, it } from "vitest";
import { canRead } from "../src/directus/access.ts";
import { parentPermissions, plannerPermissions } from "../src/mocks/fixtures.ts";

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
