import { toE164 } from "./phone.ts";

/** A person in a household as Directus returns them. A field the person can't read is missing. */
export interface MemberRow {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  /** The school picked from the list, with its name. */
  school_id?: School | null;
  /** The school typed in after choosing Other, set only when none is picked. */
  school?: string | null;
  date_of_birth?: string | null;
}

/** A known school, which a sailor's school is picked from. */
export interface School {
  id: string;
  name: string;
}

/** A guardian link between two people, from `contacts`. */
export interface GuardianRow {
  subject_id: string;
  contact_id: string;
}

/** Guardians are the people Clubspot links as a sailor's guardian, and sailors the people they're guardians of. Anyone else has no role. */
export type Role = "guardian" | "sailor" | null;

export interface Member {
  id: string;
  /** Their display name, or first and last when they have none. */
  name: string;
  /** The display name they chose, which the edit form starts from. */
  displayName: string | null;
  email: string | null;
  phone: string | null;
  /** The school picked from the list, or null for none or Other. */
  schoolId: string | null;
  /** The picked school's name, or the one typed in after choosing Other. */
  school: string | null;
  role: Role;
  me: boolean;
  /** Only sailors have a school. */
  hasSchool: boolean;
}

export interface Household {
  id: string;
  shares: boolean;
  /** Whether the signed-in person is an adult, who decides whether the household shares. Anyone in it changes its people. */
  editable: boolean;
  members: Member[];
}

/** A person's name as the household shows it: their display name, or first and last. */
export function memberName(row: Pick<MemberRow, "first_name" | "last_name" | "display_name">): string {
  return (
    row.display_name?.trim() || [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "No name on file"
  );
}

const order: Record<string, number> = { guardian: 0, sailor: 1, null: 2 };

/** Whether someone born on `dateOfBirth` is 18 by `today`, both `YYYY-MM-DD`. */
function grownUp(dateOfBirth: string, today: string): boolean {
  const year = Number(today.slice(0, 4)) - 18;
  return dateOfBirth <= `${year}${today.slice(4)}`;
}

/** Who's an adult, as platform's Community rules decide: 18 or over, or with no date of birth, someone's guardian. */
function isAdult(row: MemberRow, role: Role, today: string): boolean {
  return row.date_of_birth ? grownUp(row.date_of_birth, today) : role === "guardian";
}

/** The household's members, guardians first, then sailors, then anyone else, each by name. */
export function buildHousehold(
  household: { id: string; share_contact: boolean | null },
  people: MemberRow[],
  guardians: GuardianRow[],
  meId: string,
  today: string,
): Household {
  const ids = new Set(people.map((p) => p.id));
  const links = guardians.filter((g) => ids.has(g.subject_id) && ids.has(g.contact_id));
  const guardiansOf = new Set(links.map((g) => g.contact_id));
  const sailors = new Set(links.map((g) => g.subject_id));
  const members = people.map((p): Member => {
    // Someone who is both, such as an adult sailor who is also a guardian, shows as a guardian.
    const role: Role = guardiansOf.has(p.id) ? "guardian" : sailors.has(p.id) ? "sailor" : null;
    return {
      id: p.id,
      name: memberName(p),
      displayName: p.display_name ?? null,
      email: p.email ?? null,
      phone: p.phone ?? null,
      schoolId: p.school_id?.id ?? null,
      school: p.school_id?.name ?? p.school ?? null,
      role,
      me: p.id === meId,
      hasSchool: role === "sailor",
    };
  });
  members.sort((a, b) => order[String(a.role)]! - order[String(b.role)]! || a.name.localeCompare(b.name));
  const me = people.find((p) => p.id === meId);
  const editable = !!me && isAdult(me, members.find((m) => m.me)!.role, today);
  return { id: household.id, shares: household.share_contact === true, editable, members };
}

/** What a member's edit form saves. A blank display name clears it, so the name falls back to first and last. */
export interface MemberChanges {
  display_name: string | null;
  phone?: string | null;
  /** A picked school, with no school typed in, or no picked school, with the one typed in after choosing Other. */
  school_id?: string | null;
  school?: string | null;
}

/**
 * The changes to save from an edit form's values, whose phone is in E.164. It leaves out a phone that didn't change, so
 * one stored in a form the field can't read is kept, and a school for anyone but a sailor.
 */
export function memberChanges(
  member: Member,
  form: { name: string; phone: string; schoolId: string | null; school: string },
): MemberChanges {
  const blank = (value: string) => value.trim() || null;
  const phone = blank(form.phone);
  return {
    display_name: blank(form.name),
    ...(phone !== (toE164(member.phone) ?? null) && { phone }),
    ...(member.hasSchool &&
      (form.schoolId ? { school_id: form.schoolId, school: null } : { school_id: null, school: blank(form.school) })),
  };
}
