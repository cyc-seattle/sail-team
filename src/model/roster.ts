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
  /** Null when not on file, or the viewer can't see it, as for a guardian. */
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
  guardians: RosterPerson[];
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
  const guardiansOf = new Map<string, string[]>();
  for (const link of rows.contacts) {
    if (link.relationship_type === "guardian") {
      guardiansOf.set(link.subject_id, [...new Set([...(guardiansOf.get(link.subject_id) ?? []), link.contact_id])]);
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
          guardians: (guardiansOf.get(id) ?? []).map((guardian) => rosterPerson(guardian, people)).sort(byName),
        }))
        .sort(byName),
    });
  }
  return [...teams.values()].map((team) => ({ ...team, divisions: team.divisions.sort(byName) })).sort(byName);
}

/** Whether `personId` is a sailor or a sailor's guardian on `team`. */
export function onTeam(team: TeamRoster, personId: string): boolean {
  return team.divisions.some((d) =>
    d.sailors.some((s) => s.id === personId || s.guardians.some((p) => p.id === personId)),
  );
}

/** A sailor on one team, with the team's divisions they're on. A sailor on two teams has an entry on each. */
export interface RosterEntry extends RosterSailor {
  teamId: string;
  team: string;
  divisions: { id: string; name: string }[];
}

/** Each team's sailors, once per team, by name, then team. */
export function rosterEntries(teams: TeamRoster[]): RosterEntry[] {
  const entries = new Map<string, RosterEntry>();
  for (const team of teams) {
    for (const division of team.divisions) {
      for (const sailor of division.sailors) {
        const key = `${team.id}:${sailor.id}`;
        const held = entries.get(key);
        const placed = { id: division.id, name: division.name };
        entries.set(
          key,
          held
            ? { ...held, divisions: [...held.divisions, placed] }
            : { ...sailor, teamId: team.id, team: team.name, divisions: [placed] },
        );
      }
    }
  }
  return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name) || a.team.localeCompare(b.team));
}

/** The team the roster opens on: the viewer's own, or the first they can see. */
export function defaultTeam(teams: TeamRoster[], personId: string | null): string | undefined {
  return (teams.find((t) => personId !== null && onTeam(t, personId)) ?? teams[0])?.id;
}

/** What the roster is narrowed to. Each but the team is unset for all. */
export interface RosterFilters {
  team?: string;
  /** One of the team's divisions. */
  division?: string;
  /** A school's name, or `NO_SCHOOL` for sailors with none on file. */
  school?: string;
  /** Part of a sailor's or a guardian's name. */
  q?: string;
}

export const NO_SCHOOL = "none";

/** `filters` with `changes` made, leaving out any filter that's unset or empty. */
export function withFilters(
  filters: RosterFilters,
  changes: Partial<Record<keyof RosterFilters, unknown>>,
): RosterFilters {
  const merged: Partial<Record<keyof RosterFilters, unknown>> = { ...filters, ...changes };
  return Object.fromEntries(
    Object.entries(merged).filter(([, value]) => typeof value === "string" && value.trim() !== ""),
  ) as RosterFilters;
}

/** Lower case, with accents dropped, so "zoe" finds Zoë. */
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * The sailors that match every filter. A search finds a sailor by their own name or a guardian's, on every team, so it
 * looks past the team and division.
 */
export function filterRoster(entries: RosterEntry[], filters: RosterFilters): RosterEntry[] {
  const q = fold(filters.q ?? "");
  return entries.filter(
    (entry) =>
      (q || !filters.team || entry.teamId === filters.team) &&
      (q || !filters.division || entry.divisions.some((d) => d.id === filters.division)) &&
      (!filters.school || (entry.school ?? NO_SCHOOL) === filters.school) &&
      (!q || [entry, ...entry.guardians].some((person) => fold(person.name).includes(q))),
  );
}

/** The schools on the roster, by name. */
export function schoolsOn(entries: RosterEntry[]): string[] {
  return [...new Set(entries.flatMap((e) => (e.school ? [e.school] : [])))].sort((a, b) => a.localeCompare(b));
}

/** The divisions a team or division filter picks, or every division when neither is set. */
export function divisionsIn(teams: TeamRoster[], filters: RosterFilters): Division[] {
  return teams
    .filter((t) => !filters.team || t.id === filters.team)
    .flatMap((t) => t.divisions)
    .filter((d) => !filters.division || d.id === filters.division);
}

/** The group's page on Google Groups, from its address. */
export function groupUrl(email: string): string {
  const [name, domain] = email.split("@");
  return `https://groups.google.com/a/${domain}/g/${name}`;
}
