// A made-up club's rosters, for local work and tests. Never real club members.
import { planner } from "./fixtures";

const team = "00000000-0000-4000-8000-000000000701";
const camp = "00000000-0000-4000-8000-000000000702";
const teamFall = "00000000-0000-4000-8000-000000000711";
const campSummer = "00000000-0000-4000-8000-000000000712";

export const rosterIds = {
  me: "00000000-0000-4000-8000-000000000721",
  child: "00000000-0000-4000-8000-000000000722",
  teammate: "00000000-0000-4000-8000-000000000723",
  teammateParent: "00000000-0000-4000-8000-000000000724",
  adultSailor: "00000000-0000-4000-8000-000000000725",
};

// Dates move with today, so the rosters stay current.
const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

const person = (id: string, first: string, last: string, rest: Record<string, unknown> = {}) => ({
  id,
  first_name: first,
  last_name: last,
  email: null,
  phone: null,
  share_contact: null,
  directus_user_id: null,
  ...rest,
});

export const rosterTables: Record<string, Record<string, unknown>[]> = {
  programs: [
    { id: team, name: "Youth Race Team", team: true },
    { id: camp, name: "Summer Camp", team: false },
  ],
  offerings: [
    { id: teamFall, program_id: team, starts_on: day(-30), ends_on: day(40) },
    { id: campSummer, program_id: camp, starts_on: day(-120), ends_on: day(-110) },
  ],
  registrations: [
    { id: "r1", person_id: rosterIds.child, offering_id: teamFall, status: "confirmed" },
    { id: "r2", person_id: rosterIds.teammate, offering_id: teamFall, status: "confirmed" },
    { id: "r3", person_id: rosterIds.adultSailor, offering_id: teamFall, status: "confirmed" },
    { id: "r4", person_id: rosterIds.child, offering_id: campSummer, status: "confirmed" },
  ],
  contacts: [
    { subject_id: rosterIds.child, contact_id: rosterIds.me, relationship_type: "guardian" },
    { subject_id: rosterIds.teammate, contact_id: rosterIds.teammateParent, relationship_type: "guardian" },
  ],
  people: [
    person(rosterIds.me, planner.first_name!, planner.last_name!, {
      email: planner.email,
      share_contact: true,
      directus_user_id: planner.id,
    }),
    person(rosterIds.child, "Ada", "Tiller"),
    person(rosterIds.teammate, "Kai", "Halyard"),
    person(rosterIds.teammateParent, "Lee", "Halyard"),
    person(rosterIds.adultSailor, "Ren", "Mainsheet", {
      email: "ren@example.org",
      phone: "+1 206 555 0177",
      share_contact: true,
    }),
  ],
};
