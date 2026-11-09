import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { householdQuery, schoolsQuery, setHouseholdSharing, updateMember } from "../src/directus/household.ts";
import { handlers } from "../src/mocks/handlers.ts";
import { rosterIds } from "../src/mocks/roster.ts";
import {
  buildHousehold,
  memberChanges,
  memberName,
  type Household,
  type MemberRow,
  type School,
} from "../src/model/household.ts";

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
    {
      id: "kid",
      first_name: "Ada",
      last_name: "Tiller",
      school_id: { id: "lakeside", name: "Lakeside" },
      date_of_birth: "2013-05-01",
    },
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
    expect(household.members.filter((m) => m.hasSchool).map((m) => [m.id, m.schoolId, m.school])).toEqual([
      ["kid", "lakeside", "Lakeside"],
    ]);
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

  const none = { schoolId: null, school: "" };

  it("clears a blank display name, and gives only a sailor a school", () => {
    expect(memberChanges(guardian!, { name: "  ", phone: "+12065550199", schoolId: "eastlake", school: "" })).toEqual({
      display_name: null,
      phone: "+12065550199",
    });
    expect(memberChanges(kid!, { name: "Addie", phone: "", schoolId: "eastlake", school: "" })).toEqual({
      display_name: "Addie",
      school_id: "eastlake",
      school: null,
    });
  });

  it("saves a school typed in after choosing Other with no school picked", () => {
    expect(memberChanges(kid!, { name: "", phone: "", schoolId: null, school: " Salish Sea Academy " })).toEqual({
      display_name: null,
      school_id: null,
      school: "Salish Sea Academy",
    });
  });

  it("leaves out a phone that didn't change, even one stored as bare digits or that isn't a phone", () => {
    expect(memberChanges(guardian!, { name: "", phone: "+12065550110", ...none })).toEqual({ display_name: null });
    expect(memberChanges(kid!, { name: "", phone: "", ...none })).toEqual({
      display_name: null,
      school_id: null,
      school: null,
    });
  });

  it("clears a phone that was emptied", () => {
    expect(memberChanges(guardian!, { name: "", phone: "", ...none })).toEqual({ display_name: null, phone: null });
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
    const [eastlake] = (await run<School[]>(schoolsQuery)).filter((s) => s.name === "Eastlake High School");
    await updateMember(rosterIds.child, { display_name: null, school_id: eastlake!.id, school: null });
    await setHouseholdSharing(rosterIds.household, false);
    let household = await run(householdQuery);
    expect(household?.shares).toBe(false);
    expect(household?.members.find((m) => m.id === rosterIds.child)).toMatchObject({
      name: "Ada Tiller",
      schoolId: eastlake!.id,
      school: "Eastlake High School",
    });
    await updateMember(rosterIds.child, { display_name: null, school_id: null, school: "Salish Sea Academy" });
    household = await run(householdQuery);
    expect(household?.members.find((m) => m.id === rosterIds.child)).toMatchObject({
      schoolId: null,
      school: "Salish Sea Academy",
    });
    const [lakeside] = (await run<School[]>(schoolsQuery)).filter((s) => s.name === "Lakeside Middle School");
    await updateMember(rosterIds.child, { display_name: "Addie Tiller", school_id: lakeside!.id, school: null });
    await setHouseholdSharing(rosterIds.household, true);
  });
});

describe("reading the schools from Directus", () => {
  it("lists the known schools by name", async () => {
    const names = (await run<School[]>(schoolsQuery)).map((s) => s.name);
    expect(names[0]).toBe("Ballard High School");
    expect(names).toContain("Lakeside Middle School");
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
  });
});
