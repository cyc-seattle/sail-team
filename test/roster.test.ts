import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readableFields } from "../src/directus/access.ts";
import { myRecordQuery, rostersQuery, setShareContact } from "../src/directus/roster.ts";
import { plannerPermissions } from "../src/mocks/fixtures.ts";
import { handlers } from "../src/mocks/handlers.ts";
import { rosterIds } from "../src/mocks/roster.ts";
import { formatDays } from "../src/model/dates.ts";
import { buildRosters, currentOfferings, monthsBefore, seattleToday, type OfferingRow } from "../src/model/roster.ts";

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

describe("buildRosters", () => {
  const people = [
    { id: "child", first_name: "Ada", last_name: "Bowline" },
    { id: "parent", first_name: "Pat", last_name: "Bowline", email: "pat@example.org", phone: null },
    { id: "quiet", first_name: "Sam", last_name: "Bowline", email: null, phone: null },
    { id: "other", first_name: "Kai", last_name: "Halyard" },
  ];

  it("lists confirmed sailors by name, each with their parents, and their parents' details when shared", () => {
    const [roster, ...rest] = buildRosters({
      programs: [{ id: "p", name: "Youth Race Team", team: true }],
      offerings: [offering("fall", "2026-09-08", "2026-11-20")],
      registrations: [
        { person_id: "other", offering_id: "fall", status: "confirmed" },
        { person_id: "child", offering_id: "fall", status: "confirmed" },
        { person_id: "gone", offering_id: "fall", status: "cancelled" },
      ],
      contacts: [
        { subject_id: "child", contact_id: "quiet", relationship_type: "guardian" },
        { subject_id: "child", contact_id: "parent", relationship_type: "guardian" },
        { subject_id: "other", contact_id: "parent", relationship_type: "emergency" },
      ],
      people,
    });
    expect(rest).toEqual([]);
    expect(roster).toMatchObject({ program: "Youth Race Team", team: true, startsOn: "2026-09-08" });
    expect(roster!.sailors.map((s) => s.name)).toEqual(["Ada Bowline", "Kai Halyard"]);
    expect(roster!.sailors[0]!.parents).toEqual([
      { id: "parent", name: "Pat Bowline", email: "pat@example.org", phone: null },
      { id: "quiet", name: "Sam Bowline", email: null, phone: null },
    ]);
    expect(roster!.sailors[1]!.parents).toEqual([]);
  });

  it("leaves out a program with no one the person can see", () => {
    expect(
      buildRosters({
        programs: [{ id: "p", name: "Summer Camp" }],
        offerings: [offering("summer", "2026-07-06", "2026-07-17")],
        registrations: [],
        contacts: [],
        people,
      }),
    ).toEqual([]);
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
  it("reads each program's current or most recent roster", async () => {
    const rosters = await run<{ program: string; sailors: { name: string; parents: { name: string }[] }[] }[]>(
      rostersQuery(plannerPermissions),
    );
    expect(rosters.map((r) => [r.program, r.sailors.map((s) => s.name)])).toEqual([
      ["Summer Camp", ["Ada Tiller"]],
      ["Youth Race Team", ["Ada Tiller", "Kai Halyard", "Ren Mainsheet"]],
    ]);
    expect(rosters[1]!.sailors[1]!.parents.map((p) => p.name)).toEqual(["Lee Halyard"]);
  });

  it("finds the signed-in person's own record by their login, and changes whether they share", async () => {
    expect(await run(myRecordQuery)).toEqual({ id: rosterIds.me, share_contact: true });
    await setShareContact(rosterIds.me, false);
    expect(await run(myRecordQuery)).toEqual({ id: rosterIds.me, share_contact: false });
    await setShareContact(rosterIds.me, true);
  });
});
