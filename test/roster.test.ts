import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readableFields } from "../src/directus/access.ts";
import { myRecordQuery, setShareContact, teamsQuery } from "../src/directus/roster.ts";
import { parentPermissions, teamPermissions } from "../src/mocks/fixtures.ts";
import { handlers } from "../src/mocks/handlers.ts";
import { rosterIds } from "../src/mocks/roster.ts";
import { formatDays } from "../src/model/dates.ts";
import {
  buildTeams,
  currentOfferings,
  groupTeam,
  groupUrl,
  monthsBefore,
  NO_SCHOOL,
  onTeam,
  seattleToday,
  teamSize,
  type OfferingRow,
  type TeamRoster,
} from "../src/model/roster.ts";

const offering = (id: string, starts_on: string | null, ends_on: string | null, program_id = "p"): OfferingRow => ({
  id,
  program_id,
  starts_on,
  ends_on,
});

describe("currentOfferings", () => {
  const today = "2026-11-04";

  it("picks the offering that started last, over one that hasn't started", () => {
    const picked = currentOfferings(
      [
        offering("spring", "2026-03-01", "2026-05-30"),
        offering("fall", "2026-09-08", "2026-11-20"),
        offering("next", "2027-03-01", "2027-05-30"),
      ],
      today,
    );
    expect(picked.map((o) => o.id)).toEqual(["fall"]);
  });

  it("picks the one starting soonest when none has started", () => {
    const picked = currentOfferings(
      [offering("later", "2027-06-01", null), offering("sooner", "2027-03-01", "2027-05-30")],
      today,
    );
    expect(picked.map((o) => o.id)).toEqual(["sooner"]);
  });

  it("picks one for each program", () => {
    const picked = currentOfferings(
      [offering("a", "2026-01-01", null, "one"), offering("b", "2026-02-01", null, "two")],
      today,
    );
    expect(picked.map((o) => o.id).sort()).toEqual(["a", "b"]);
  });
});

describe("buildTeams", () => {
  const people = [
    { id: "child", first_name: "Ada", last_name: "Bowline", school: "Lakeside" },
    { id: "parent", first_name: "Pat", last_name: "Bowline", email: "pat@example.org", phone: null },
    { id: "quiet", first_name: "Sam", last_name: "Bowline", email: null, phone: null },
    { id: "other", first_name: "Kai", last_name: "Halyard", school: "" },
  ];
  const area = { id: "dh", name: "Doublehanded" };
  const group = { email: "j-pod@example.org", name: "J-Pod" };
  const programs = [
    { id: "j", name: "J-Pod", team: true, area, group },
    { id: "k", name: "K-Pod", team: true, area },
    { id: "camp", name: "Summer Camp", team: false, area: { id: "summer", name: "Summer" } },
  ];
  const teams = buildTeams({
    programs,
    offerings: [
      offering("j-fall", "2026-09-08", "2026-11-20", "j"),
      offering("k-fall", "2026-09-08", "2026-11-20", "k"),
      offering("camp-summer", "2026-07-06", "2026-07-17", "camp"),
    ],
    registrations: [
      { person_id: "other", offering_id: "j-fall", status: "confirmed" },
      { person_id: "child", offering_id: "j-fall", status: "confirmed" },
      { person_id: "gone", offering_id: "j-fall", status: "cancelled" },
      { person_id: "other", offering_id: "k-fall", status: "confirmed" },
      { person_id: "child", offering_id: "camp-summer", status: "confirmed" },
    ],
    contacts: [
      { subject_id: "child", contact_id: "quiet", relationship_type: "guardian" },
      { subject_id: "child", contact_id: "parent", relationship_type: "guardian" },
      { subject_id: "other", contact_id: "parent", relationship_type: "emergency" },
    ],
    people,
  });

  it("makes one team of an area's team programs, each a division, and none of a program that isn't a team", () => {
    expect(teams.map((t) => [t.name, t.divisions.map((d) => d.name)])).toEqual([["Doublehanded", ["J-Pod", "K-Pod"]]]);
    expect(teams[0]!.divisions[0]).toMatchObject({ group, startsOn: "2026-09-08" });
  });

  it("lists confirmed sailors by name, each with their school and parents, and their parents' details when shared", () => {
    const jPod = teams[0]!.divisions[0]!;
    expect(jPod.sailors.map((s) => [s.name, s.school])).toEqual([
      ["Ada Bowline", "Lakeside"],
      ["Kai Halyard", null],
    ]);
    expect(jPod.sailors[0]!.parents).toEqual([
      { id: "parent", name: "Pat Bowline", email: "pat@example.org", phone: null },
      { id: "quiet", name: "Sam Bowline", email: null, phone: null },
    ]);
  });

  it("counts a sailor on two divisions once", () => {
    expect(teamSize(teams[0]!)).toBe(2);
  });

  it("knows who is on a team, sailors and parents both", () => {
    expect(["child", "parent", "other", "stranger"].map((id) => onTeam(teams[0]!, id))).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it("lets a team stand on its own when the person can't read its area", () => {
    const [team] = buildTeams({
      programs: [{ id: "j", name: "J-Pod", team: true }],
      offerings: [offering("j-fall", "2026-09-08", null, "j")],
      registrations: [{ person_id: "child", offering_id: "j-fall", status: "confirmed" }],
      contacts: [],
      people,
    });
    expect(team).toMatchObject({ id: "j", name: "J-Pod" });
  });

  it("groups a team by school, with no school on file last, and each sailor once with every division they're on", () => {
    const groups = groupTeam(teams[0]!, "school");
    expect(groups.map((g) => [g.name, g.sailors.map((s) => [s.name, s.divisions])])).toEqual([
      ["Lakeside", [["Ada Bowline", ["J-Pod"]]]],
      [NO_SCHOOL, [["Kai Halyard", ["J-Pod", "K-Pod"]]]],
    ]);
  });

  it("groups a team by division", () => {
    expect(groupTeam(teams[0]!, "division").map((g) => [g.name, g.sailors.length])).toEqual([
      ["J-Pod", 2],
      ["K-Pod", 1],
    ]);
  });

  it("links a group's page on Google Groups", () => {
    expect(groupUrl("j-pod@example.org")).toBe("https://groups.google.com/a/example.org/g/j-pod");
  });
});

describe("dates", () => {
  it("goes back a number of months", () => {
    expect(monthsBefore("2026-11-04", 12)).toBe("2025-11-04");
  });

  it("knows today in Seattle, not in UTC", () => {
    expect(seattleToday(new Date("2026-11-05T03:00:00Z"))).toBe("2026-11-04");
  });

  it("writes a span of days as the club would", () => {
    expect(formatDays("2026-09-08", "2026-11-20")).toBe("Sep 8, 2026 to Nov 20, 2026");
    expect(formatDays("2026-09-08", null)).toBe("From Sep 8, 2026");
    expect(formatDays(null, null)).toBe("");
  });
});

describe("readableFields", () => {
  const permissions = {
    people: { read: { access: "partial", fields: ["id", "first_name"] } },
    programs: { read: { access: "full", fields: ["*"] } },
  } as never;

  it("asks only for the fields some rule gives", () => {
    expect(readableFields(permissions, "people", ["id", "first_name", "email"])).toEqual(["id", "first_name"]);
    expect(readableFields(permissions, "programs", ["id", "team"])).toEqual(["id", "team"]);
  });
});

vi.stubGlobal("window", { location: { hostname: "example.org" } });
const server = setupServer(...handlers("https://directus.example.org"));
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterAll(() => server.close());

const run = <T>(options: { queryFn?: unknown }) => (options.queryFn as () => Promise<T>)();

describe("reading rosters from Directus", () => {
  it("reads each team's divisions in their current or most recent offering, with schools and Google Groups", async () => {
    const teams = await run<TeamRoster[]>(teamsQuery(teamPermissions));
    expect(teams.map((t) => [t.id, t.name, t.divisions.map((d) => d.name)])).toEqual([
      [rosterIds.doublehanded, "Doublehanded", ["J-Pod", "K-Pod"]],
      [rosterIds.singlehanded, "Singlehanded", ["Opti Race Team"]],
    ]);
    const jPod = teams[0]!.divisions[0]!;
    expect(jPod.group?.email).toBe("j-pod@example.org");
    expect(jPod.sailors.find((s) => s.id === rosterIds.child)?.school).toBe("Lakeside Middle School");
    expect(jPod.sailors.find((s) => s.id === rosterIds.teammate)?.parents.map((p) => p.name)).toEqual(["Lee Halyard"]);
  });

  it("asks only for what a household on no team can read, and finds no team", async () => {
    expect(await run(teamsQuery(parentPermissions))).toEqual([]);
  });

  it("finds the signed-in person's own record by their login, and changes whether they share", async () => {
    expect(await run(myRecordQuery)).toEqual({ id: rosterIds.me, share_contact: true });
    await setShareContact(rosterIds.me, false);
    expect(await run(myRecordQuery)).toEqual({ id: rosterIds.me, share_contact: false });
    await setShareContact(rosterIds.me, true);
  });
});
