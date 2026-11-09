/** A person in a household as Directus returns them. A field the person can't read is missing. */
export interface MemberRow {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  school?: string | null;
  date_of_birth?: string | null;
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
  school: string | null;
  role: Role;
  me: boolean;
  /** An adult changes their own phone and a child's whose date of birth is on file, never another adult's. */
  canEditPhone: boolean;
  /** Only sailors have a school. */
  hasSchool: boolean;
}

export interface Household {
  id: string;
  shares: boolean;
  /** Whether the signed-in person is an adult, who may change the household. A sailor who signs in only sees it. */
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

/** Who an adult may change the phone of besides themselves: only someone whose date of birth says they're under 18. */
function isKnownMinor(row: MemberRow, today: string): boolean {
  return !!row.date_of_birth && !grownUp(row.date_of_birth, today);
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
      school: p.school ?? null,
      role,
      me: p.id === meId,
      canEditPhone: p.id === meId || isKnownMinor(p, today),
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
  school?: string | null;
}

/** The changes to save from an edit form's values, leaving out what this member's form doesn't offer. */
export function memberChanges(member: Member, form: { name: string; phone: string; school: string }): MemberChanges {
  const blank = (value: string) => value.trim() || null;
  return {
    display_name: blank(form.name),
    ...(member.canEditPhone && { phone: blank(form.phone) }),
    ...(member.hasSchool && { school: blank(form.school) }),
  };
}
