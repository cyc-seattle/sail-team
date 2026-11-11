// A made-up club's teams, for local work and tests. Never real club members.
import { planner } from "./fixtures";

const doublehanded = { id: "00000000-0000-4000-8000-000000000731", name: "Doublehanded" };
const singlehanded = { id: "00000000-0000-4000-8000-000000000732", name: "Singlehanded" };
const summer = { id: "00000000-0000-4000-8000-000000000733", name: "Summer" };

const jPod = "00000000-0000-4000-8000-000000000701";
const camp = "00000000-0000-4000-8000-000000000702";
const kPod = "00000000-0000-4000-8000-000000000703";
const optiTeam = "00000000-0000-4000-8000-000000000704";
const jFall = "00000000-0000-4000-8000-000000000711";
const campSummer = "00000000-0000-4000-8000-000000000712";
const kFall = "00000000-0000-4000-8000-000000000713";
const optiFall = "00000000-0000-4000-8000-000000000714";
// Sign-ups that aren't on a team, so Household has more to show than the rosters do.
const clinic = "00000000-0000-4000-8000-000000000705";
const keelboat = "00000000-0000-4000-8000-000000000706";
const clinicWinter = "00000000-0000-4000-8000-000000000715";
const campLongAgo = "00000000-0000-4000-8000-000000000716";
const keelboatSpring = "00000000-0000-4000-8000-000000000717";

export const rosterIds = {
  doublehanded: doublehanded.id,
  singlehanded: singlehanded.id,
  me: "00000000-0000-4000-8000-000000000721",
  child: "00000000-0000-4000-8000-000000000722",
  teammate: "00000000-0000-4000-8000-000000000723",
  teammateGuardian: "00000000-0000-4000-8000-000000000724",
  adultSailor: "00000000-0000-4000-8000-000000000725",
  coParent: "00000000-0000-4000-8000-000000000726",
  household: "00000000-0000-4000-8000-000000000741",
};

// Mia has three guardians, so a roster shows how several read.
const miasSecond = "00000000-0000-4000-8000-000000000727";
const miasThird = "00000000-0000-4000-8000-000000000728";

// Dates move with today, so the rosters stay current.
const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

// The known schools a sailor's school is picked from.
const schools = Object.fromEntries(
  [
    "Ballard High School",
    "Eastlake High School",
    "Garfield High School",
    "Harbor View Middle School",
    "Lakeside Middle School",
    "Lincoln High School",
    "Roosevelt High School",
  ].map((name, i) => [name, { id: `00000000-0000-4000-8000-00000000050${i}`, name }]),
);

/** A picked school, as Directus returns `school_id` with its fields asked for. */
const picked = (name: string | null) => ({ school_id: name ? schools[name]! : null, school: null });

const person = (id: string, first: string, last: string, rest: Record<string, unknown> = {}) => ({
  id,
  first_name: first,
  last_name: last,
  email: null,
  phone: null,
  school_id: null,
  school: null,
  display_name: null,
  date_of_birth: null,
  household_id: null,
  share_contact: null,
  directus_user_id: null,
  ...rest,
});

const program = (id: string, name: string, team: boolean, area: { id: string; name: string }, group?: string) => ({
  id,
  name,
  team,
  product_id: { id: `${id}-product`, program_area_id: area },
  google_group_id: group ? { id: `${id}-group`, email: group, name } : null,
});

// More made-up sailors, each with one guardian, so a team is long enough to see how it reads.
const more = [
  ["Mia", "Cleat", "Lakeside Middle School", "K"],
  ["Noor", "Jibe", "Lakeside Middle School", "K"],
  ["Theo", "Batten", "Eastlake High School", "K"],
  ["Ivy", "Gunwale", "Eastlake High School", "J"],
  ["Ola", "Tack", null, "J"],
  ["Sol", "Rudder", "Harbor View Middle School", "K"],
] as const;
const moreId = (i: number, guardian = false) => `00000000-0000-4000-8000-0000000008${guardian ? 5 : 0}${i}`;

export const rosterTables: Record<string, Record<string, unknown>[]> = {
  schools: Object.values(schools),
  programs: [
    program(jPod, "J-Pod", true, doublehanded, "j-pod@example.org"),
    program(kPod, "K-Pod", true, doublehanded),
    program(optiTeam, "Opti Race Team", true, singlehanded, "opti-team@example.org"),
    program(camp, "Summer Camp", false, summer),
    program(clinic, "Winter Race Clinic", false, singlehanded),
    program(keelboat, "Adult Keelboat Basics", false, summer),
  ],
  offerings: [
    { id: jFall, program_id: jPod, starts_on: day(-30), ends_on: day(40) },
    { id: kFall, program_id: kPod, starts_on: day(-30), ends_on: day(40) },
    { id: optiFall, program_id: optiTeam, starts_on: day(-30), ends_on: day(40) },
    { id: campSummer, program_id: camp, starts_on: day(-120), ends_on: day(-110) },
    { id: clinicWinter, program_id: clinic, starts_on: day(60), ends_on: day(110) },
    { id: campLongAgo, program_id: camp, starts_on: day(-490), ends_on: day(-480) },
    { id: keelboatSpring, program_id: keelboat, starts_on: day(150), ends_on: day(180) },
  ],
  registrations: [
    { id: "r1", person_id: rosterIds.child, offering_id: jFall, status: "confirmed" },
    { id: "r2", person_id: rosterIds.teammate, offering_id: jFall, status: "confirmed" },
    { id: "r3", person_id: rosterIds.adultSailor, offering_id: kFall, status: "confirmed" },
    { id: "r4", person_id: rosterIds.child, offering_id: campSummer, status: "confirmed" },
    { id: "r5", person_id: rosterIds.teammate, offering_id: optiFall, status: "confirmed" },
    { id: "r6", person_id: rosterIds.child, offering_id: clinicWinter, status: "waitlist" },
    { id: "r7", person_id: rosterIds.child, offering_id: campLongAgo, status: "confirmed" },
    { id: "r8", person_id: rosterIds.child, offering_id: kFall, status: "cancelled" },
    { id: "r9", person_id: rosterIds.me, offering_id: keelboatSpring, status: "confirmed" },
    { id: "r20", person_id: rosterIds.coParent, offering_id: keelboatSpring, status: "confirmed" },
    ...more.map(([, , , pod], i) => ({
      id: `r${10 + i}`,
      person_id: moreId(i),
      offering_id: pod === "J" ? jFall : kFall,
      status: "confirmed",
    })),
  ],
  contacts: [
    { subject_id: rosterIds.child, contact_id: rosterIds.me, relationship_type: "guardian" },
    { subject_id: rosterIds.child, contact_id: rosterIds.coParent, relationship_type: "guardian" },
    { subject_id: rosterIds.teammate, contact_id: rosterIds.teammateGuardian, relationship_type: "guardian" },
    ...more.map((_, i) => ({ subject_id: moreId(i), contact_id: moreId(i, true), relationship_type: "guardian" })),
    { subject_id: moreId(0), contact_id: miasSecond, relationship_type: "guardian" },
    { subject_id: moreId(0), contact_id: miasThird, relationship_type: "guardian" },
  ],
  people: [
    person(rosterIds.me, planner.first_name!, planner.last_name!, {
      email: planner.email,
      phone: "+1 206 555 0110",
      share_contact: true,
      directus_user_id: planner.id,
      household_id: rosterIds.household,
    }),
    person(rosterIds.coParent, "Sam", "Tiller", {
      email: "sam@example.org",
      phone: "+1 206 555 0111",
      household_id: rosterIds.household,
    }),
    person(rosterIds.child, "Ada", "Tiller", {
      ...picked("Lakeside Middle School"),
      display_name: "Addie Tiller",
      date_of_birth: "2013-05-01",
      household_id: rosterIds.household,
    }),
    person(miasSecond, "Jordan", "Cleat"),
    person(miasThird, "Sam", "Rivera", { email: "sam.rivera@example.org", share_contact: true }),
    person(rosterIds.teammate, "Kai", "Halyard", picked("Harbor View Middle School")),
    person(rosterIds.teammateGuardian, "Lee", "Halyard"),
    person(rosterIds.adultSailor, "Ren", "Mainsheet", {
      email: "ren@example.org",
      phone: "+1 206 555 0177",
      share_contact: true,
    }),
    ...more.flatMap(([first, last, school], i) => [
      person(moreId(i), first, last, picked(school)),
      person(moreId(i, true), i % 2 ? "Jo" : "Alex", last, {
        ...(i % 2 === 0 && { email: `${last.toLowerCase()}@example.org`, phone: `+1 206 555 01${50 + i}` }),
      }),
    ]),
  ],
};

// A household holds its members, as Directus returns them for `members.*`. They're the same rows as `people`, so a
// change to one shows in both.
rosterTables["households"] = [
  {
    id: rosterIds.household,
    share_contact: true,
    members: rosterTables["people"]!.filter((p) => p["household_id"] === rosterIds.household),
  },
];
