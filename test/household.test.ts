import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { householdQuery, setHouseholdSharing, updateMember } from "../src/directus/household.ts";
import { parentPermissions, teamPermissions } from "../src/mocks/fixtures.ts";
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
    { id: "kid", first_name: "Ada", last_name: "Tiller", school: "Lakeside" },
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

  it("lets a guardian change their own phone and their children's, but not another guardian's", () => {
    expect(Object.fromEntries(household.members.map((m) => [m.id, m.canEditPhone]))).toEqual({
      me: true,
      co: false,
      kid: true,
      uncle: false,
    });
  });

  it("gives only sailors a school, and shares only when the household said yes", () => {
    expect(household.members.filter((m) => m.hasSchool).map((m) => m.id)).toEqual(["kid"]);
    expect(household.shares).toBe(false);
  });

  it("goes by date of birth when it's on file: a sailor who turned 18 changes their own phone", () => {
    const grown = buildHousehold(
      { id: "h", share_contact: true },
      [
        { id: "me", date_of_birth: null },
        { id: "kid", date_of_birth: "2008-11-09" },
        { id: "grown", date_of_birth: "2008-11-08" },
      ],
      [
        { subject_id: "kid", contact_id: "me" },
        { subject_id: "grown", contact_id: "me" },
      ],
      "me",
      today,
    );
    expect(Object.fromEntries(grown.members.map((m) => [m.id, m.canEditPhone]))).toEqual({
      me: true,
      kid: true,
      grown: false,
    });
    expect(grown.editable).toBe(true);
  });

  it("lets a sailor who signs in see the household, but not change it", () => {
    expect(buildHousehold({ id: "h", share_contact: true }, people, guardians, "kid", today).editable).toBe(false);
  });
});

describe("memberChanges", () => {
  const form = { name: "  ", phone: " 555 ", school: "Eastlake" };

  it("clears a blank display name and saves only what the form offers", () => {
    const [me, co, kid] = buildHousehold(
      { id: "h", share_contact: true },
      [{ id: "me" }, { id: "co" }, { id: "kid" }],
      [
        { subject_id: "kid", contact_id: "me" },
        { subject_id: "kid", contact_id: "co" },
      ],
      "me",
      today,
    ).members;
    expect(memberChanges(me!, form)).toEqual({ display_name: null, phone: "555" });
    expect(memberChanges(co!, form)).toEqual({ display_name: null });
    expect(memberChanges(kid!, form)).toEqual({ display_name: null, phone: "555", school: "Eastlake" });
  });
});

vi.stubGlobal("window", { location: { hostname: "example.org" } });
const server = setupServer(...handlers("https://directus.example.org"));
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterAll(() => server.close());

const run = (options: { queryFn?: unknown }) => (options.queryFn as () => Promise<Household | null>)();

describe("reading the household from Directus", () => {
  it("finds the signed-in person's household, with everyone in it", async () => {
    const household = await run(householdQuery(teamPermissions));
    expect(household?.id).toBe(rosterIds.household);
    expect(household?.shares).toBe(true);
    expect(household?.members.map((m) => [m.name, m.role, m.me])).toEqual([
      ["Robin Tiller", "guardian", true],
      ["Sam Tiller", "guardian", false],
      ["Addie Tiller", "sailor", false],
    ]);
  });

  it("asks only for the fields Directus lets the person read", async () => {
    const people = parentPermissions["people"]!;
    const noEmail = {
      ...parentPermissions,
      people: { ...people, read: { ...people.read, fields: people.read.fields!.filter((f) => f !== "email") } },
    };
    const household = await run(householdQuery(noEmail));
    expect(household?.members[0]).toMatchObject({ name: "Robin Tiller", email: null, phone: "+1 206 555 0110" });
  });

  it("saves a member's changes and the household's sharing choice", async () => {
    await updateMember(rosterIds.child, { display_name: null, phone: null, school: "Eastlake High School" });
    await setHouseholdSharing(rosterIds.household, false);
    const household = await run(householdQuery(teamPermissions));
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
