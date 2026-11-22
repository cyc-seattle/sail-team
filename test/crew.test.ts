import { describe, expect, it } from "vitest";
import {
  crewFilters,
  crewRows,
  expiringQualifications,
  filterCrew,
  isCurrentTerm,
  meets,
  missingQualifications,
  positionRows,
  sortTerms,
  type CatalogQualification,
  type CrewData,
  type CrewMember,
  type CrewPosition,
  type CrewTerm,
  type HeldQualification,
} from "../src/model/crew.ts";

const day = "2026-11-21";

const catalog: CatalogQualification[] = [
  { id: "basic", name: "Basic First Aid", covers: [] },
  { id: "first-aid", name: "First Aid and CPR", covers: ["basic"] },
  { id: "wilderness", name: "Wilderness First Aid", covers: ["first-aid"] },
  { id: "safesport", name: "SafeSport", covers: [] },
];

const position = (id: string, needs: string[] = []): CrewPosition => ({
  id,
  name: id,
  description: null,
  qualification_ids: needs,
  links: [],
});

const term = (id: string, changes: Partial<CrewTerm> = {}): CrewTerm => ({
  id,
  crew_member_id: "m1",
  position_id: "instructor",
  program_id: null,
  program_area_id: null,
  starts_on: null,
  ends_on: null,
  note: null,
  ...changes,
});

const held = (
  id: string,
  qualification_id: string,
  earned_on: string,
  expires_on: string | null,
): HeldQualification => ({
  id,
  crew_member_id: "m1",
  qualification_id,
  earned_on,
  expires_on,
  note: null,
});

const member = (id: string, first: string): CrewMember => ({
  id,
  person: { id: `p-${id}`, first_name: first, last_name: "Example", email: `${first.toLowerCase()}@example.org` },
  website_bio: null,
  website_photo: null,
  on_website: false,
});

const instructor = position("instructor", ["first-aid", "safesport"]);

describe("isCurrentTerm", () => {
  it("counts both days, and a blank one has no bound", () => {
    expect(isCurrentTerm({ starts_on: day, ends_on: day }, day)).toBe(true);
    expect(isCurrentTerm({ starts_on: null, ends_on: null }, day)).toBe(true);
    expect(isCurrentTerm({ starts_on: "2026-11-22", ends_on: null }, day)).toBe(false);
    expect(isCurrentTerm({ starts_on: null, ends_on: "2026-11-20" }, day)).toBe(false);
  });
});

describe("meets", () => {
  it("follows what a qualification covers, and what that covers", () => {
    expect([...meets("wilderness", catalog)].sort()).toEqual(["basic", "first-aid", "wilderness"]);
  });
});

describe("missingQualifications", () => {
  it("counts an expired first aid card as missing", () => {
    const missing = missingQualifications(
      [term("t1")],
      [instructor],
      [held("q1", "first-aid", "2024-10-01", "2026-10-21"), held("q2", "safesport", "2026-01-01", null)],
      catalog,
      day,
    );
    expect(missing).toEqual(["first-aid"]);
  });

  it("counts a qualification that covers the one needed", () => {
    const missing = missingQualifications(
      [term("t1", { position_id: "basic-only" })],
      [position("basic-only", ["basic"])],
      [held("q1", "wilderness", "2026-01-01", "2027-01-01")],
      catalog,
      day,
    );
    expect(missing).toEqual([]);
  });

  it("needs nothing for a term that has ended or not started", () => {
    const terms = [term("t1", { ends_on: "2026-10-21" }), term("t2", { starts_on: "2027-01-01" })];
    expect(missingQualifications(terms, [instructor], [], catalog, day)).toEqual([]);
  });

  it("lists each one missing once, in the catalog's order", () => {
    const terms = [term("t1"), term("t2", { position_id: "coach" })];
    const coach = position("coach", ["safesport", "first-aid"]);
    expect(missingQualifications(terms, [instructor, coach], [], catalog, day)).toEqual(["first-aid", "safesport"]);
  });
});

describe("expiringQualifications", () => {
  it("shows one that ends in the next 90 days", () => {
    const soon = held("q1", "first-aid", "2025-01-12", "2027-01-12");
    expect(expiringQualifications([soon], day)).toEqual([soon]);
  });

  it("leaves out one that ends later, never, or already has", () => {
    const later = held("q1", "first-aid", "2025-01-12", "2027-02-20");
    const never = held("q2", "safesport", "2025-01-12", null);
    const expired = held("q3", "basic", "2024-01-12", "2026-11-20");
    expect(expiringQualifications([later, never, expired], day)).toEqual([]);
  });

  it("leaves out one already renewed", () => {
    const old = held("q1", "first-aid", "2025-01-12", "2027-01-12");
    const renewed = held("q2", "first-aid", "2026-11-01", "2028-11-01");
    expect(expiringQualifications([old, renewed], day)).toEqual([]);
  });
});

const data: CrewData = {
  members: [member("m1", "Jordan"), member("m2", "Morgan"), member("m3", "Alex")],
  positions: [instructor, position("coordinator", ["safesport"])],
  terms: [
    term("t1", { program_id: "jpod", position_id: "coordinator" }),
    term("t2", { crew_member_id: "m2", ends_on: "2026-10-31" }),
    term("t3", { crew_member_id: "m3" }),
  ],
  held: [
    held("q1", "first-aid", "2026-01-01", "2027-01-01"),
    { ...held("q2", "safesport", "2026-01-01", null), crew_member_id: "m3" },
  ],
  qualifications: catalog,
  programs: [{ id: "jpod", name: "J-Pod" }],
  areas: [],
  staffLevels: [],
};

describe("crewRows", () => {
  it("sorts by name, with current positions, and what's missing and expiring", () => {
    const rows = crewRows(data, day);
    expect(rows.map((r) => r.name)).toEqual(["Alex Example", "Jordan Example", "Morgan Example"]);
    const jordan = rows[1]!;
    expect(jordan.positions).toEqual(["coordinator, J-Pod"]);
    expect(jordan.missing).toEqual(["safesport"]);
    expect(jordan.expiring.map((q) => q.id)).toEqual(["q1"]);
    expect(jordan.places).toEqual(["jpod"]);
  });

  it("shows someone whose terms have all ended as past, missing nothing", () => {
    const morgan = crewRows(data, day)[2]!;
    expect(morgan).toMatchObject({ past: true, ended_on: "2026-10-31", missing: [], positions: [] });
  });
});

describe("filterCrew", () => {
  const rows = crewRows(data, day);
  const names = (filters: Parameters<typeof filterCrew>[1]) => filterCrew(rows, filters).map((r) => r.name);

  it("shows current crew by default, past or all on request", () => {
    expect(names({})).toEqual(["Alex Example", "Jordan Example"]);
    expect(names({ show: "past" })).toEqual(["Morgan Example"]);
    expect(names({ show: "all" })).toHaveLength(3);
  });

  it("narrows to a program, to those who need something, and by name or email", () => {
    expect(names({ in: "jpod" })).toEqual(["Jordan Example"]);
    expect(names({ flagged: true })).toEqual(["Alex Example", "Jordan Example"]);
    expect(names({ q: "alex@" })).toEqual(["Alex Example"]);
  });

  it("reads the filters from an address, dropping what it doesn't know", () => {
    expect(crewFilters({ show: "everyone", flagged: "true", q: " ", in: "jpod" })).toEqual({
      q: undefined,
      in: "jpod",
      show: undefined,
      flagged: true,
    });
  });
});

describe("positionRows", () => {
  it("names each position's current holders, with where", () => {
    const rows = positionRows(data, day);
    expect(rows.map((r) => [r.position.id, r.holders, r.held])).toEqual([
      ["coordinator", ["Jordan Example (J-Pod)"], true],
      ["instructor", ["Alex Example"], true],
    ]);
    expect(rows[1]!.needs).toEqual(["First Aid and CPR", "SafeSport"]);
  });
});

describe("sortTerms", () => {
  it("puts current and upcoming terms first, by start, then ended ones, latest first", () => {
    const terms = [
      term("old", { starts_on: "2020-01-01", ends_on: "2021-01-01" }),
      term("recent", { starts_on: "2022-01-01", ends_on: "2025-01-01" }),
      term("now", { starts_on: "2025-01-01" }),
      term("always"),
    ];
    expect(sortTerms(terms, day).map((t) => t.id)).toEqual(["always", "now", "recent", "old"]);
  });
});
