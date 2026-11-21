import { catalogTables } from "@/mocks/catalog";
import { crewTables } from "@/mocks/crew";
import { tables } from "@/mocks/plans";
import { rosterTables } from "@/mocks/roster";
import type { CrewData, CrewMember, CrewPerson, CrewPosition, CrewTerm, HeldQualification, Named } from "@/model/crew";
import { today } from "@/model/financial-plans";

type Row = Record<string, unknown>;

const named = (rows: Row[]): Named[] =>
  rows.map((r) => ({ id: r["id"] as string, name: r["name"] as string })).sort((a, b) => a.name.localeCompare(b.name));

/** The made-up crew, as the app reads it. Its dates move with today. */
export const crew: CrewData = {
  members: crewTables["crew_members"]!.map(({ person_id, ...m }) => {
    const { id, first_name, last_name, email } = person_id as CrewPerson;
    return { ...(m as unknown as Omit<CrewMember, "person">), person: { id, first_name, last_name, email } };
  }),
  positions: crewTables["crew_positions"]!.map(({ qualifications, ...p }) => {
    const links = qualifications as CrewPosition["links"];
    return {
      ...(p as unknown as Omit<CrewPosition, "qualification_ids" | "links">),
      qualification_ids: links.map((l) => l.qualification_id),
      links,
    };
  }),
  terms: crewTables["crew_terms"] as unknown as CrewTerm[],
  held: crewTables["crew_qualifications"] as unknown as HeldQualification[],
  qualifications: named(catalogTables["qualifications"]!).map((q) => ({
    ...q,
    covers: catalogTables["qualification_covers"]!.filter((c) => c["qualification_id"] === q.id).map(
      (c) => c["covers_id"] as string,
    ),
  })),
  programs: named(rosterTables["programs"]!),
  areas: named(tables["program_areas"]!),
  staffLevels: crewTables["staff_levels"]!.map((l) => ({
    id: l["id"] as string,
    name: l["name"] as string,
    archived_at: l["archived_at"] as string | null,
  })),
};

/** Today, which the made-up dates are counted from. */
export const day = today();

/** A crew member, by first name. */
export const memberNamed = (first: string) => crew.members.find((m) => m.person.first_name === first)!;
