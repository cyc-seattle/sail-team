/** A qualification held counts as expiring this many days ahead (cyc-seattle/platform#263). */
export const EXPIRING_DAYS = 90;

/** Someone in People, as a Crew Writer reads them: never more than a name and email. */
export interface CrewPerson {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

/** Someone who works for CSC, volunteer or paid, and what the website shows of them. */
export interface CrewMember {
  id: string;
  person: CrewPerson;
  website_name: string | null;
  website_bio: string | null;
  /** A file in the Website folder, which anyone can see. */
  website_photo: string | null;
  on_website: boolean;
}

export type WebsiteProfile = Pick<CrewMember, "website_name" | "website_bio" | "website_photo" | "on_website">;

/** A job, such as Treasurer or Parent Coordinator. */
export interface CrewPosition {
  id: string;
  name: string;
  /** What the website and lists call someone in it. Blank uses the name. */
  title: string | null;
  description: string | null;
  /** The qualifications someone in it needs. */
  qualification_ids: string[];
  /** The join rows behind them, to change them. */
  links: { id: string; qualification_id: string }[];
}

export type PositionInput = Omit<CrewPosition, "id" | "links">;

/** One crew member in one position, from a day to a day. Platform calls it a term. */
export interface CrewTerm {
  id: string;
  crew_member_id: string;
  position_id: string;
  program_id: string | null;
  program_area_id: string | null;
  /** The first day. None for one that began before anyone wrote it down. */
  starts_on: string | null;
  /** The last day. None while it goes on. */
  ends_on: string | null;
  note: string | null;
  /** Pay, which only Crew Writers and planners read: undefined for anyone else. */
  staff_level_id?: string | null;
  hourly_rate_cents?: number | null;
  profit_share?: boolean;
}

export type TermInput = Omit<CrewTerm, "id">;

/** A qualification one crew member earned. A renewal is a new one. */
export interface HeldQualification {
  id: string;
  crew_member_id: string;
  qualification_id: string;
  earned_on: string;
  /** None for one that never expires. */
  expires_on: string | null;
  note: string | null;
}

export type HeldQualificationInput = Omit<HeldQualification, "id">;

/** One of the catalog's qualifications, and the others it also meets. */
export interface CatalogQualification {
  id: string;
  name: string;
  covers: string[];
}

export interface Named {
  id: string;
  name: string;
}

/** A staff level a term is paid at. An archived one stays on the terms that have it. */
export interface StaffLevel extends Named {
  archived_at: string | null;
}

/** A person's name, as People has it. */
export const personName = (p: CrewPerson) => [p.first_name, p.last_name].filter(Boolean).join(" ") || "No name";

/** The day `days` after `day`, both as `YYYY-MM-DD`. */
export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Days from `day` to `later`, both as `YYYY-MM-DD`. */
export function daysUntil(day: string, later: string): number {
  return Math.round((Date.parse(`${later}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86_400_000);
}

/** Whether a term is current on `day`: both of its days count, and a blank one has no bound. Platform's `isCurrentTerm`. */
export const isCurrentTerm = (t: Pick<CrewTerm, "starts_on" | "ends_on">, day: string) =>
  (t.starts_on === null || t.starts_on <= day) && (t.ends_on === null || t.ends_on >= day);

/** Whether a term has ended before `day`. */
export const hasEnded = (t: Pick<CrewTerm, "ends_on">, day: string) => t.ends_on !== null && t.ends_on < day;

/** Whether a qualification held is good on `day`: earned by then, and not yet expired. */
export const inDate = (q: Pick<HeldQualification, "earned_on" | "expires_on">, day: string) =>
  q.earned_on <= day && (q.expires_on === null || q.expires_on >= day);

/** Every qualification `id` meets: itself, what it covers, and what those cover. */
export function meets(id: string, catalog: CatalogQualification[]): Set<string> {
  const met = new Set([id]);
  const queue = [id];
  while (queue.length > 0) {
    const next = queue.pop();
    for (const covered of catalog.find((q) => q.id === next)?.covers ?? []) {
      if (!met.has(covered)) {
        met.add(covered);
        queue.push(covered);
      }
    }
  }
  return met;
}

/** The qualifications someone has on `day`: each one held in date, and each it covers. */
export function qualificationsMet(held: HeldQualification[], catalog: CatalogQualification[], day: string) {
  const met = new Set<string>();
  for (const q of held.filter((q) => inDate(q, day))) {
    for (const id of meets(q.qualification_id, catalog)) {
      met.add(id);
    }
  }
  return met;
}

/**
 * The qualifications a crew member needs on `day` and doesn't have, by id, in the catalog's order: each one a current
 * term's position needs, unless they hold it, or one that covers it, in date.
 */
export function missingQualifications(
  terms: CrewTerm[],
  positions: CrewPosition[],
  held: HeldQualification[],
  catalog: CatalogQualification[],
  day: string,
): string[] {
  const needed = new Set(
    terms
      .filter((t) => isCurrentTerm(t, day))
      .flatMap((t) => positions.find((p) => p.id === t.position_id)?.qualification_ids ?? []),
  );
  const met = qualificationsMet(held, catalog, day);
  return catalog.filter((q) => needed.has(q.id) && !met.has(q.id)).map((q) => q.id);
}

/**
 * The qualifications held that run out within `EXPIRING_DAYS` of `day`, the soonest first. One renewed already, by a
 * later one in date that lasts longer, doesn't count.
 */
export function expiringQualifications(held: HeldQualification[], day: string): HeldQualification[] {
  const until = addDays(day, EXPIRING_DAYS);
  const good = held.filter((q) => inDate(q, day));
  return good
    .filter(
      (q) =>
        q.expires_on !== null &&
        q.expires_on <= until &&
        !good.some(
          (other) =>
            other.qualification_id === q.qualification_id &&
            other.id !== q.id &&
            (other.expires_on === null || other.expires_on > q.expires_on!),
        ),
    )
    .sort((a, b) => a.expires_on!.localeCompare(b.expires_on!));
}

/** Where a term's job is: its program or program area, by name, or none. */
export function termPlace(t: Pick<CrewTerm, "program_id" | "program_area_id">, programs: Named[], areas: Named[]) {
  return (
    programs.find((p) => p.id === t.program_id)?.name ?? areas.find((a) => a.id === t.program_area_id)?.name ?? null
  );
}

/** A crew member as the Crew list shows them. */
export interface CrewRow {
  member: CrewMember;
  name: string;
  /** Each current term's position, with where it is: "Parent Coordinator, Youth Race Team". */
  positions: string[];
  /** Whether every term has ended. Someone with none yet, or one still to start, isn't past. */
  past: boolean;
  /** The day the last term ended, when past. */
  ended_on: string | null;
  missing: string[];
  expiring: HeldQualification[];
  /** The programs and program areas of their current terms, by id, for the list's filter. */
  places: string[];
}

export interface CrewData {
  members: CrewMember[];
  positions: CrewPosition[];
  terms: CrewTerm[];
  held: HeldQualification[];
  qualifications: CatalogQualification[];
  programs: Named[];
  areas: Named[];
  staffLevels: StaffLevel[];
}

/** A term's position, with where it is: "Parent Coordinator, J-Pod". */
export function termLabel(t: CrewTerm, data: Pick<CrewData, "positions" | "programs" | "areas">): string {
  const name = data.positions.find((p) => p.id === t.position_id)?.name ?? "";
  const place = termPlace(t, data.programs, data.areas);
  return place ? `${name}, ${place}` : name;
}

/** Each crew member, by name, with their current positions and what they're missing or will soon need to renew. */
export function crewRows(data: CrewData, day: string): CrewRow[] {
  return data.members
    .map((member) => {
      const terms = data.terms.filter((t) => t.crew_member_id === member.id);
      const current = terms.filter((t) => isCurrentTerm(t, day));
      const held = data.held.filter((q) => q.crew_member_id === member.id);
      const past = terms.length > 0 && terms.every((t) => hasEnded(t, day));
      return {
        member,
        name: personName(member.person),
        positions: current.map((t) => termLabel(t, data)).sort((a, b) => a.localeCompare(b)),
        past,
        ended_on: past
          ? terms
              .map((t) => t.ends_on!)
              .sort()
              .at(-1)!
          : null,
        missing: missingQualifications(terms, data.positions, held, data.qualifications, day),
        expiring: expiringQualifications(held, day),
        places: current.flatMap((t) => [t.program_id, t.program_area_id]).filter((id): id is string => id !== null),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** A position as the Positions page shows it: who holds it today, and where. */
export interface PositionRow {
  position: CrewPosition;
  needs: string[];
  /** Each current holder's name, with where the job is: "Casey Nguyen (Youth Race Team)". */
  holders: string[];
  /** Whether any term names it, so it can't be deleted. */
  held: boolean;
}

/** Every position, by name, with who holds it on `day`. */
export function positionRows(data: CrewData, day: string): PositionRow[] {
  return [...data.positions]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((position) => {
      const terms = data.terms.filter((t) => t.position_id === position.id);
      const holders = terms
        .filter((t) => isCurrentTerm(t, day))
        .map((t) => {
          const member = data.members.find((m) => m.id === t.crew_member_id);
          const name = member ? personName(member.person) : "";
          const place = termPlace(t, data.programs, data.areas);
          return place ? `${name} (${place})` : name;
        })
        .sort((a, b) => a.localeCompare(b));
      return {
        position,
        needs: data.qualifications.filter((q) => position.qualification_ids.includes(q.id)).map((q) => q.name),
        holders,
        held: terms.length > 0,
      };
    });
}

/** Terms on a crew member's page: current and upcoming first, by start, then ended ones, latest first. */
export function sortTerms(terms: CrewTerm[], day: string): CrewTerm[] {
  const key = (t: CrewTerm) => t.starts_on ?? "";
  const ongoing = terms.filter((t) => !hasEnded(t, day)).sort((a, b) => key(a).localeCompare(key(b)));
  const ended = terms.filter((t) => hasEnded(t, day)).sort((a, b) => b.ends_on!.localeCompare(a.ends_on!));
  return [...ongoing, ...ended];
}

/** Qualifications on a crew member's page: by name, the latest first within one. */
export function sortHeld(held: HeldQualification[], catalog: CatalogQualification[]): HeldQualification[] {
  const name = (q: HeldQualification) => catalog.find((c) => c.id === q.qualification_id)?.name ?? "";
  return [...held].sort((a, b) => name(a).localeCompare(name(b)) || b.earned_on.localeCompare(a.earned_on));
}

/** The Crew list's filters, kept in the address. Each is left out at its default. */
export interface CrewFilters {
  /** Part of a name. */
  q?: string | undefined;
  /** A program or program area, by id. */
  in?: string | undefined;
  show?: "past" | "all" | undefined;
  /** Only those missing a qualification or with one expiring. */
  flagged?: boolean | undefined;
}

/** The filters in an address, with anything unknown left out. */
export function crewFilters(search: Record<string, unknown>): CrewFilters {
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
  return {
    q: text(search["q"]),
    in: text(search["in"]),
    show: search["show"] === "past" || search["show"] === "all" ? search["show"] : undefined,
    flagged: search["flagged"] === true || search["flagged"] === "true" ? true : undefined,
  };
}

/** The rows the filters keep. */
export function filterCrew(rows: CrewRow[], filters: CrewFilters): CrewRow[] {
  const q = filters.q?.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (filters.show === "all" || r.past === (filters.show === "past")) &&
      (!filters.in || r.places.includes(filters.in)) &&
      (!filters.flagged || r.missing.length > 0 || r.expiring.length > 0) &&
      (!q || r.name.toLowerCase().includes(q) || r.member.person.email?.toLowerCase().includes(q)),
  );
}
