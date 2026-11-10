import { describe, expect, it } from "vitest";
import { parentPermissions, plannerPermissions } from "../src/mocks/fixtures.ts";
import { homeLinksFor, linksFor, navFor, pagesFor } from "../src/model/nav.ts";

const directus = "https://directus.example.org";
const everyone = [
  { href: "https://calendar.google.com", label: "Google Calendar" },
  { href: "mailto:info@cyccommunitysailing.org", label: "Support" },
];
const clubspot = { href: "https://theclubspot.com/dashboard/acct/nw6IMf9Bnq/", label: "Clubspot dashboard" };
const studio = { href: directus, label: "Directus" };

describe("navFor", () => {
  it("shows Planning to someone who can read plans, Rosters to a household on a team, and Household to a household", () => {
    expect(navFor(plannerPermissions)).toEqual([
      { to: "/plans", label: "Planning" },
      { to: "/roster", label: "Rosters" },
      { to: "/household", label: "Household" },
    ]);
  });

  it("hides Rosters from a household on no team", () => {
    expect(navFor(parentPermissions)).toEqual([{ to: "/household", label: "Household" }]);
  });

  it("shows nothing to someone with no household", () => {
    expect(navFor({})).toEqual([]);
  });
});

describe("linksFor", () => {
  it.each([
    ["Community", everyone],
    ["Team", everyone],
    [undefined, everyone],
    ["Crew", [clubspot, ...everyone]],
    ["Staff", [clubspot, studio, ...everyone]],
    ["Admin", [clubspot, studio, ...everyone]],
    ["Administrator", [clubspot, studio, ...everyone]],
  ])("gives %s their role's links", (role, links) => {
    expect(linksFor(role, directus)).toEqual(links);
  });
});

describe("homeLinksFor", () => {
  it("lists the sections someone can open, then their links", () => {
    expect(homeLinksFor(plannerPermissions, everyone)).toEqual([...navFor(plannerPermissions), ...everyone]);
  });

  it("still lists the links for someone who can open no section", () => {
    expect(homeLinksFor({}, everyone)).toEqual(everyone);
  });
});

describe("pagesFor", () => {
  it("starts with Home, then the sections someone can open", () => {
    expect(pagesFor(plannerPermissions)).toEqual([{ to: "/", label: "Home" }, ...navFor(plannerPermissions)]);
  });

  it("still offers Home to someone who can open no section", () => {
    expect(pagesFor({})).toEqual([{ to: "/", label: "Home" }]);
  });
});
