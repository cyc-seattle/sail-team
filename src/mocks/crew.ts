// Made-up crew, for local work and tests. Never real club data.
import { catalogTables } from "./catalog";
import { ids, staffLevels } from "./plans";
import { rosterTables } from "./roster";

type Row = Record<string, unknown>;

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

// Dates move with today, so what's current and what's expiring stay that way.
const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

const qualification = (name: string) => catalogTables["qualifications"]!.find((q) => q["name"] === name)!["id"];
const level1 = qualification("US Sailing Level 1");
const level2 = qualification("US Sailing Level 2");
const firstAid = qualification("First Aid and CPR");
const safeSport = qualification("SafeSport");

const program = (name: string) => rosterTables["programs"]!.find((p) => p["name"] === name)!["id"] as string;
const summer = ids.summer;

const people: Row[] = [
  ["Alex", "Rivera"],
  ["Sam", "Chen"],
  ["Priya", "Patel"],
  ["Jordan", "Lee"],
  ["Casey", "Nguyen"],
  ["Morgan", "Park"],
  ["Taylor", "Brooks"],
  ["Riley", "Kim"],
  ["Pat", "Doe"],
  // In People, not yet on Crew, to add.
  ["Quinn", "Okafor"],
  ["Drew", "Santos"],
].map(([first, last], i) => ({
  id: id(9700 + i),
  first_name: first,
  last_name: last,
  email: `${first!.toLowerCase()}.${last!.toLowerCase()}@example.org`,
  phone: null,
  school_id: null,
  school: null,
  display_name: null,
  date_of_birth: null,
  household_id: null,
  share_contact: null,
}));
const person = (first: string) => people.find((p) => p["first_name"] === first)!;

const member = (n: number, first: string, profile: Row = {}): Row => ({
  id: id(9720 + n),
  person_id: person(first),
  website_name: null,
  website_bio: null,
  website_photo: null,
  on_website: false,
  ...profile,
});

const members: Row[] = [
  member(0, "Alex", {
    website_name: "Alex Rivera",
    website_bio: "Alex has run CSC's sailing programs since 2019, after a decade coaching high school teams.",
    website_photo: id(9790),
    on_website: true,
  }),
  member(1, "Sam", { website_name: "Sam Chen", on_website: true }),
  member(2, "Priya", {
    website_name: "Priya Patel",
    website_bio: "Priya has coached the race team since 2023.",
    website_photo: id(9791),
    on_website: true,
  }),
  member(3, "Jordan", { website_name: "Jordan" }),
  member(4, "Casey"),
  member(5, "Morgan", { website_name: "Morgan Park" }),
  member(6, "Taylor", { website_name: "Taylor Brooks", on_website: true }),
  member(7, "Riley", { website_name: "Riley", on_website: true }),
  member(8, "Pat", { website_name: "Pat Doe", on_website: true }),
];
const memberId = (first: string) => members.find((m) => (m["person_id"] as Row)["first_name"] === first)!["id"];

const position = (
  n: number,
  name: string,
  title: string | null,
  needs: unknown[],
  description: string | null = null,
) => ({
  id: id(9740 + n),
  name,
  title,
  description,
  qualifications: needs.map((q, i) => ({ id: id(9760 + n * 5 + i), qualification_id: q })),
});

const positions: Row[] = [
  position(0, "Sailing Director", null, [firstAid, safeSport], "Runs every program. Hired by the CSC Board."),
  position(1, "Treasurer", null, [], "Keeps the books and the budget. Elected by the CSC Board, even years."),
  position(2, "Director 1A", "Director", [], "A seat on the CSC Board. Elected by members, odd years."),
  position(3, "Director 2A", "Director", []),
  position(4, "Head Coach", null, [firstAid, safeSport, level2]),
  position(5, "Sailing Instructor", null, [firstAid, safeSport, level1]),
  position(6, "Parent Coordinator", null, [safeSport], "Helps a team's coach with families, travel, and food."),
  position(7, "Area Director", "Director", [firstAid], "Runs one program area, such as Summer."),
];
const positionId = (name: string) => positions.find((p) => p["name"] === name)!["id"];

let terms = 0;
const term = (first: string, name: string, rest: Row = {}): Row => ({
  id: id(9800 + terms++),
  crew_member_id: memberId(first),
  position_id: positionId(name),
  program_id: null,
  program_area_id: null,
  starts_on: null,
  ends_on: null,
  note: null,
  staff_level_id: null,
  hourly_rate_cents: null,
  profit_share: false,
  ...rest,
});

const coach = id(98);
const instructor = id(95);

const crewTerms: Row[] = [
  term("Alex", "Sailing Director", { starts_on: "2019-03-01" }),
  term("Sam", "Treasurer", { starts_on: "2024-01-01", ends_on: "2026-12-31" }),
  term("Priya", "Head Coach", { starts_on: "2025-03-01", staff_level_id: id(99), profit_share: true }),
  term("Priya", "Parent Coordinator", { program_id: program("Opti Race Team") }),
  term("Priya", "Sailing Instructor", {
    starts_on: "2023-06-01",
    ends_on: "2025-02-28",
    staff_level_id: instructor,
  }),
  term("Jordan", "Sailing Instructor", { starts_on: "2026-06-01", staff_level_id: instructor }),
  term("Casey", "Parent Coordinator", { program_id: program("J-Pod") }),
  term("Morgan", "Sailing Instructor", {
    starts_on: "2024-06-01",
    ends_on: day(-21),
    staff_level_id: coach,
    hourly_rate_cents: 3200,
    note: "Moved away.",
  }),
  term("Taylor", "Area Director", { program_area_id: summer, starts_on: "2025-01-01", staff_level_id: id(99) }),
  term("Riley", "Sailing Instructor", { starts_on: "2025-06-01", staff_level_id: instructor }),
  term("Pat", "Director 1A", { starts_on: "2024-07-01", ends_on: "2027-06-30" }),
];

let held = 0;
const holds = (
  first: string,
  qualificationId: unknown,
  earned: string,
  expires: string | null,
  note: string | null = null,
) => ({
  id: id(9850 + held++),
  crew_member_id: memberId(first),
  qualification_id: qualificationId,
  earned_on: earned,
  expires_on: expires,
  note,
});

const crewQualifications: Row[] = [
  holds("Alex", firstAid, day(-300), day(430)),
  holds("Alex", safeSport, day(-200), day(165)),
  holds("Priya", firstAid, day(-678), day(52), "Red Cross, certificate 4471-002"),
  holds("Priya", safeSport, day(-79), day(286)),
  holds("Priya", level2, "2022-05-14", null),
  holds("Jordan", firstAid, day(-100), day(630)),
  holds("Jordan", level1, "2026-05-02", null),
  holds("Jordan", safeSport, day(-400), day(-35)),
  holds("Morgan", firstAid, day(-500), day(230)),
  holds("Taylor", firstAid, day(-30), day(700)),
  // Level 2 meets Level 1 too.
  holds("Riley", level2, "2024-08-20", null),
  holds("Riley", firstAid, day(-60), day(670)),
  holds("Riley", safeSport, day(-60), day(305)),
];

/** Crew's tables, as Directus returns them. People are the rosters' and these, as one table. */
export const crewTables: Record<string, Row[]> = {
  people: [...rosterTables["people"]!, ...people],
  crew_members: members,
  crew_positions: positions,
  crew_terms: crewTerms,
  crew_qualifications: crewQualifications,
  // Senior Instructor is archived, so the picker leaves it out.
  staff_levels: staffLevels.map((l) => ({
    ...l,
    archived_at: l.name === "Senior Instructor" ? "2026-01-01T00:00:00Z" : null,
  })),
};

/** A made-up photo for any file id, so `mise run dev` shows one where a crew member has it. */
export function photo(fileId: string): string {
  const hue = [...fileId].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="hsl(${hue} 40% 70%)"/><circle cx="60" cy="46" r="22" fill="hsl(${hue} 30% 45%)"/><rect x="24" y="76" width="72" height="44" rx="36" fill="hsl(${hue} 30% 45%)"/></svg>`;
}
