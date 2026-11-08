import { describe, expect, it } from "vitest";
import { parentPermissions, plannerPermissions } from "../src/mocks/fixtures.ts";
import { externalLinks, homeLinksFor, navFor, pagesFor } from "../src/model/nav.ts";

describe("navFor", () => {
  it("shows Plans to someone who can read plans, and Rosters to a household on a team", () => {
    expect(navFor(plannerPermissions)).toEqual([
      { to: "/plans", label: "Plans" },
      { to: "/roster", label: "Rosters" },
    ]);
  });

  it("hides Rosters from a household on no team", () => {
    expect(navFor(parentPermissions)).toEqual([]);
  });
});

describe("homeLinksFor", () => {
  it("lists the sections someone can open, then other sites", () => {
    expect(homeLinksFor(plannerPermissions)).toEqual([...navFor(plannerPermissions), ...externalLinks]);
  });

  it("still lists other sites for someone who can open no section", () => {
    expect(homeLinksFor(parentPermissions)).toEqual(externalLinks);
  });
});

describe("pagesFor", () => {
  it("starts with Home, then the sections someone can open", () => {
    expect(pagesFor(plannerPermissions)).toEqual([{ to: "/", label: "Home" }, ...navFor(plannerPermissions)]);
  });

  it("still offers Home to someone who can open no section", () => {
    expect(pagesFor(parentPermissions)).toEqual([{ to: "/", label: "Home" }]);
  });
});
