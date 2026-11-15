import { describe, expect, it } from "vitest";
import { parentPermissions, plannerPermissions } from "../src/mocks/fixtures.ts";
import { navFor, pagesFor, toolsFor } from "../src/model/nav.ts";

const directus = "https://directus.example.org";
const clubspot = { href: "https://theclubspot.com/dashboard/acct/nw6IMf9Bnq/", label: "Clubspot dashboard" };
const studio = { href: directus, label: "Directus" };
const impersonate = { href: "https://login.example.org/if/admin/#/identity/users", label: "Sign in as someone" };

describe("navFor", () => {
  it("shows Planning to someone who can read plans, Inventory to someone who can read assets, Rosters to a household on a team, Household to a household, and Catalog to someone who can read accounts", () => {
    expect(navFor(plannerPermissions)).toEqual([
      { to: "/plans", label: "Planning" },
      { to: "/inventory", label: "Inventory" },
      { to: "/roster", label: "Rosters" },
      { to: "/household", label: "Household" },
      { to: "/catalog", label: "Catalog" },
    ]);
  });

  it("hides Rosters from a household on no team", () => {
    expect(navFor(parentPermissions)).toEqual([{ to: "/household", label: "Household" }]);
  });

  it("shows nothing to someone with no household", () => {
    expect(navFor({})).toEqual([]);
  });
});

describe("toolsFor", () => {
  it.each([
    ["Community", []],
    ["Team", []],
    [undefined, []],
    ["Crew", [clubspot]],
    ["Staff", [clubspot, studio]],
    ["Admin", [clubspot, studio, impersonate]],
    ["Administrator", [clubspot, studio, impersonate]],
  ])("gives %s their role's tools", (role, tools) => {
    expect(toolsFor(role, directus)).toEqual(tools);
  });
});

describe("pagesFor", () => {
  it("starts with Home, then the sections someone can open, then Links", () => {
    expect(pagesFor(plannerPermissions)).toEqual([
      { to: "/", label: "Home" },
      ...navFor(plannerPermissions),
      { to: "/links", label: "Links" },
    ]);
  });

  it("still offers Home and Links to someone who can open no section", () => {
    expect(pagesFor({})).toEqual([
      { to: "/", label: "Home" },
      { to: "/links", label: "Links" },
    ]);
  });
});
