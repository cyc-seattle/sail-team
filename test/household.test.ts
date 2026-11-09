import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { householdQuery, schoolsQuery, setHouseholdSharing, updateMember } from "../src/directus/household.ts";
import { handlers } from "../src/mocks/handlers.ts";
import { rosterIds } from "../src/mocks/roster.ts";
import { buildHousehold, memberChanges, memberName, type Household, type MemberRow } from "../src/model/household.ts";

describe("memberName", () => {
  it.each([
    [{ display_name: "Addie", first_name: "Ada", last_name: "Tiller" }, "Addie"],
    [{ display_name: "  ", first_name: "Ada", last_name: "Tiller" }, "Ada Tiller"],
    [{ display_name: null, first_name: "Ada", last_name: null }, "Ada"],
    [{}, "No name on file"],
  ])("names %o %s", (row, name) => {
    expect(memberName(row)).toBe(name);
  });
});

const today = "2026-11-08";

describe("buildHousehold", () => {
  const people: MemberRow[] = [
    { id: "kid", first_name: "Ada", last_name: "Tiller", school: "Lakeside", date_of_birth: "2013-05-01" },
    { id: "uncle", first_name: "Bo", last_name: "Tiller" },
    { id: "co", first_name: "Sam", last_name: "Tiller", phone: "555" },
    { id: "me", first_name: "Robin", last_name: "Tiller" },
  ];
  const guardians = [
    { subject_id: "kid", contact_id: "me" },
    { subject_id: "kid", contact_id: "co" },
    { subject_id: "kid", contact_id: "someone-else" },
  ];
  const household = buildHousehold({ id: "h", share_contact: null }, people, guardians, "me", today);

  it("lists guardians, then sailors, then anyone else, each by name", () => {
    expect(household.members.map((m) => [m.name, m.role])).toEqual([
      ["Robin Tiller", "guardian"],
      ["Sam Tiller", "guardian"],
      ["Ada Tiller", "sailor"],
      ["Bo Tiller", null],
    ]);
  });

  it("gives only sailors a school, and shares only when the household said yes", () => {
    expect(household.members.filter((m) => m.hasSchool).map((m) => m.id)).toEqual(["kid"]);
    expect(household.shares).toBe(false);
  });

  it("lets an adult decide whether the household shares", () => {
    expect(household.editable).toBe(true);
  });

  it("doesn't let a sailor who signs in decide whether the household shares", () => {
    expect(buildHousehold({ id: "h", share_contact: true }, people, guardians, "kid", today).editable).toBe(false);
  });

  it("counts someone with no date of birth as an adult only if they're someone's guardian", () => {
    expect(buildHousehold({ id: "h", share_contact: true }, people, guardians, "uncle", today).editable).toBe(false);
  });
});

describe("memberChanges", () => {
  const [guardian, kid] = buildHousehold(
    { id: "h", share_contact: true },
    [
      { id: "me", phone: "2065550110" },
      { id: "kid", date_of_birth: "2013-05-01", phone: "not a phone" },
    ],
    [{ subject_id: "kid", contact_id: "me" }],
    "me",
    today,
  ).members;

  it("clears a blank display name, and gives only a sailor a school", () => {
    expect(memberChanges(guardian!, { name: "  ", phone: "+12065550199", school: "Eastlake" })).toEqual({
      display_name: null,
      phone: "+12065550199",
    });
    expect(memberChanges(kid!, { name: "Addie", phone: "", school: " Eastlake " })).toEqual({
      display_name: "Addie",
      school: "Eastlake",
    });
  });

  it("leaves out a phone that didn't change, even one stored as bare digits or that isn't a phone", () => {
    expect(memberChanges(guardian!, { name: "", phone: "+12065550110", school: "" })).toEqual({ display_name: null });
    expect(memberChanges(kid!, { name: "", phone: "", school: "" })).toEqual({ display_name: null, school: null });
  });

  it("clears a phone that was emptied", () => {
    expect(memberChanges(guardian!, { name: "", phone: "", school: "" })).toEqual({ display_name: null, phone: null });
  });
});

vi.stubGlobal("window", { location: { hostname: "example.org" } });
const server = setupServer(...handlers("https://directus.example.org"));
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterAll(() => server.close());

const run = <T = Household | null>(options: { queryFn?: unknown }) => (options.queryFn as () => Promise<T>)();

describe("reading the household from Directus", () => {
  it("finds the signed-in person's household, with everyone in it", async () => {
    const household = await run(householdQuery);
    expect(household?.id).toBe(rosterIds.household);
    expect(household?.shares).toBe(true);
    expect(household?.members.map((m) => [m.name, m.role, m.me])).toEqual([
      ["Robin Tiller", "guardian", true],
      ["Sam Tiller", "guardian", false],
      ["Addie Tiller", "sailor", false],
    ]);
  });

  it("saves a member's changes and the household's sharing choice", async () => {
    await updateMember(rosterIds.child, { display_name: null, phone: null, school: "Eastlake High School" });
    await setHouseholdSharing(rosterIds.household, false);
    const household = await run(householdQuery);
    expect(household?.shares).toBe(false);
    expect(household?.members.find((m) => m.id === rosterIds.child)).toMatchObject({
      name: "Ada Tiller",
      school: "Eastlake High School",
    });
    await updateMember(rosterIds.child, {
      display_name: "Addie Tiller",
      phone: null,
      school: "Lakeside Middle School",
    });
    await setHouseholdSharing(rosterIds.household, true);
  });
});

describe("reading the schools from Directus", () => {
  it("lists the known schools' names in order", async () => {
    const schools = await run<string[]>(schoolsQuery);
    expect(schools[0]).toBe("Ballard High School");
    expect(schools).toContain("Lakeside Middle School");
    expect([...schools].sort((a, b) => a.localeCompare(b))).toEqual(schools);
  });
});
