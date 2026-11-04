// What the rosters page shows, worked out from the rows Directus lets the signed-in person read. Directus decides who
// they see and whose email and phone come back; this only arranges it.

export interface ProgramRow {
  id: string;
  name: string;
  /** Null when the person can't read whether a program is a team. */
  team?: boolean | null;
}

export interface OfferingRow {
  id: string;
  program_id: string;
  starts_on: string | null;
  ends_on: string | null;
}

export interface RegistrationRow {
  person_id: string;
  offering_id: string;
  status: string | null;
}

export interface ContactRow {
  subject_id: string;
  contact_id: string;
  relationship_type: string | null;
}

export interface PersonRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  /** Null when the person didn't share it, or the viewer can't see it. */
  email?: string | null;
  phone?: string | null;
}

export interface RosterPerson {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface RosterSailor extends RosterPerson {
  parents: RosterPerson[];
}

export interface Roster {
  programId: string;
  program: string;
  team: boolean;
  startsOn: string | null;
  endsOn: string | null;
  sailors: RosterSailor[];
}

/** Today in Seattle, as `YYYY-MM-DD`, which compares with an offering's dates as text. */
export function seattleToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now);
}

/** The day `months` before `today`, as `YYYY-MM-DD`. */
export function monthsBefore(today: string, months: number): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - months);
  return date.toISOString().slice(0, 10);
}

/**
 * Each program's current or most recent offering: the one that started last, by `today`. A program with none started
 * yet gets the one starting soonest.
 */
export function currentOfferings(offerings: OfferingRow[], today: string): OfferingRow[] {
  const byProgram = new Map<string, OfferingRow>();
  const started = (o: OfferingRow) => o.starts_on !== null && o.starts_on <= today;
  for (const offering of offerings) {
    const held = byProgram.get(offering.program_id);
    if (!held || better(offering, held)) {
      byProgram.set(offering.program_id, offering);
    }
  }
  return [...byProgram.values()];

  function better(a: OfferingRow, b: OfferingRow): boolean {
    if (started(a) !== started(b)) {
      return started(a);
    }
    const [aStart, bStart] = [a.starts_on ?? "", b.starts_on ?? ""];
    if (aStart !== bStart) {
      return started(a) ? aStart > bStart : aStart < bStart;
    }
    return (a.ends_on ?? "") > (b.ends_on ?? "");
  }
}

export function personName(person: Pick<PersonRow, "first_name" | "last_name"> | undefined): string {
  const name = [person?.first_name, person?.last_name].filter(Boolean).join(" ");
  return name || "Name not on file";
}

function rosterPerson(id: string, people: Map<string, PersonRow>): RosterPerson {
  const person = people.get(id);
  return { id, name: personName(person), email: person?.email ?? null, phone: person?.phone ?? null };
}

const byName = (a: RosterPerson, b: RosterPerson) => a.name.localeCompare(b.name);

/** One roster for each offering, by program name: its confirmed sailors by name, each with their parents. */
export function buildRosters(rows: {
  programs: ProgramRow[];
  offerings: OfferingRow[];
  registrations: RegistrationRow[];
  contacts: ContactRow[];
  people: PersonRow[];
}): Roster[] {
  const programs = new Map(rows.programs.map((p) => [p.id, p]));
  const people = new Map(rows.people.map((p) => [p.id, p]));
  const parentsOf = new Map<string, string[]>();
  for (const link of rows.contacts) {
    if (link.relationship_type === "guardian") {
      parentsOf.set(link.subject_id, [...new Set([...(parentsOf.get(link.subject_id) ?? []), link.contact_id])]);
    }
  }
  return rows.offerings
    .map((offering) => {
      const sailorIds = new Set(
        rows.registrations
          .filter((r) => r.offering_id === offering.id && r.status === "confirmed")
          .map((r) => r.person_id),
      );
      const program = programs.get(offering.program_id);
      return {
        programId: offering.program_id,
        program: program?.name ?? "A program",
        team: program?.team === true,
        startsOn: offering.starts_on,
        endsOn: offering.ends_on,
        sailors: [...sailorIds]
          .map((id) => ({
            ...rosterPerson(id, people),
            parents: (parentsOf.get(id) ?? []).map((parent) => rosterPerson(parent, people)).sort(byName),
          }))
          .sort(byName),
      };
    })
    .filter((roster) => roster.sailors.length > 0)
    .sort((a, b) => a.program.localeCompare(b.program));
}
