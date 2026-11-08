// What the team rosters show, worked out from the rows Directus lets the signed-in person read. Directus decides who
// they see and whose email and phone come back; this only arranges it.

export interface GoogleGroup {
  email: string;
  name: string | null;
}

export interface ProgramRow {
  id: string;
  name: string;
  /** Null when the person can't read whether a program is a team. */
  team?: boolean | null;
  /** The program area it's in, which the rosters treat as its team. Null when unknown or unreadable. */
  area?: { id: string; name: string } | null;
  group?: GoogleGroup | null;
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
  /** Null when not on file, or the viewer can't see it, as for a parent. */
  school?: string | null;
}

export interface RosterPerson {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface RosterSailor extends RosterPerson {
  school: string | null;
  parents: RosterPerson[];
}

/** One team program, such as J-Pod, in its current or most recent offering. */
export interface Division {
  id: string;
  name: string;
  group: GoogleGroup | null;
  startsOn: string | null;
  endsOn: string | null;
  sailors: RosterSailor[];
}

/** A program area's team programs, such as Doublehanded's J-Pod, K-Pod, and L-Pod. */
export interface TeamRoster {
  id: string;
  name: string;
  divisions: Division[];
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

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

/**
 * Each program area's teams, by area name, each team program a division of it with its confirmed sailors by name. A
 * program that isn't a team has no roster. A team whose area the person can't read stands on its own.
 */
export function buildTeams(rows: {
  programs: ProgramRow[];
  offerings: OfferingRow[];
  registrations: RegistrationRow[];
  contacts: ContactRow[];
  people: PersonRow[];
}): TeamRoster[] {
  const programs = new Map(rows.programs.map((p) => [p.id, p]));
  const people = new Map(rows.people.map((p) => [p.id, p]));
  const parentsOf = new Map<string, string[]>();
  for (const link of rows.contacts) {
    if (link.relationship_type === "guardian") {
      parentsOf.set(link.subject_id, [...new Set([...(parentsOf.get(link.subject_id) ?? []), link.contact_id])]);
    }
  }
  const teams = new Map<string, TeamRoster>();
  for (const offering of rows.offerings) {
    const program = programs.get(offering.program_id);
    if (program?.team !== true) {
      continue;
    }
    const sailorIds = new Set(
      rows.registrations
        .filter((r) => r.offering_id === offering.id && r.status === "confirmed")
        .map((r) => r.person_id),
    );
    if (sailorIds.size === 0) {
      continue;
    }
    const area = program.area ?? { id: program.id, name: program.name };
    const team = teams.get(area.id) ?? { id: area.id, name: area.name, divisions: [] };
    teams.set(area.id, team);
    team.divisions.push({
      id: program.id,
      name: program.name,
      group: program.group ?? null,
      startsOn: offering.starts_on,
      endsOn: offering.ends_on,
      sailors: [...sailorIds]
        .map((id) => ({
          ...rosterPerson(id, people),
          school: people.get(id)?.school || null,
          parents: (parentsOf.get(id) ?? []).map((parent) => rosterPerson(parent, people)).sort(byName),
        }))
        .sort(byName),
    });
  }
  return [...teams.values()].map((team) => ({ ...team, divisions: team.divisions.sort(byName) })).sort(byName);
}

/** How many sailors a team has, counting one on two of its divisions once. */
export function teamSize(team: TeamRoster): number {
  return new Set(team.divisions.flatMap((d) => d.sailors.map((s) => s.id))).size;
}

/** Whether `personId` is a sailor or a sailor's parent on `team`. */
export function onTeam(team: TeamRoster, personId: string): boolean {
  return team.divisions.some((d) =>
    d.sailors.some((s) => s.id === personId || s.parents.some((p) => p.id === personId)),
  );
}

export type GroupBy = "division" | "school";

export interface TeamSailor extends RosterSailor {
  /** The names of the team's divisions they're on. */
  divisions: string[];
}

export interface RosterGroup {
  name: string;
  sailors: TeamSailor[];
}

export const NO_SCHOOL = "School not on file";

/** A team's sailors in groups: one for each division, or one for each school, with no school on file last. */
export function groupTeam(team: TeamRoster, by: GroupBy): RosterGroup[] {
  if (by === "division") {
    return team.divisions.map((d) => ({
      name: d.name,
      sailors: d.sailors.map((s) => ({ ...s, divisions: [d.name] })),
    }));
  }
  const sailors = new Map<string, TeamSailor>();
  for (const division of team.divisions) {
    for (const sailor of division.sailors) {
      const held = sailors.get(sailor.id);
      sailors.set(
        sailor.id,
        held ? { ...held, divisions: [...held.divisions, division.name] } : { ...sailor, divisions: [division.name] },
      );
    }
  }
  const schools = new Map<string | null, TeamSailor[]>();
  for (const sailor of sailors.values()) {
    schools.set(sailor.school, [...(schools.get(sailor.school) ?? []), sailor]);
  }
  return [...schools.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a.localeCompare(b)))
    .map(([school, members]) => ({ name: school ?? NO_SCHOOL, sailors: members.sort(byName) }));
}

/** The group's page on Google Groups, from its address. */
export function groupUrl(email: string): string {
  const [name, domain] = email.split("@");
  return `https://groups.google.com/a/${domain}/g/${name}`;
}
