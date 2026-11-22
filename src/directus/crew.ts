import { customEndpoint, uploadFiles } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import type {
  CatalogQualification,
  CrewData,
  CrewMember,
  CrewPerson,
  CrewPosition,
  CrewTerm,
  HeldQualification,
  HeldQualificationInput,
  Named,
  PositionInput,
  StaffLevel,
  TermInput,
  WebsiteProfile,
} from "@/model/crew";
import { canRead, readableFields, type Permissions } from "./access.ts";
import { appDirectus } from "./app.ts";
import { readAll } from "./plans.ts";

/** Platform's Website folder: anything in it is public, and a crew member's photo goes in it. */
export const WEBSITE_FOLDER = "1dac44d4-d8ae-4ad1-9e11-f6b4da138a19";

const personFields = ["id", "first_name", "last_name", "email"];

const memberFields = ["id", "website_bio", "website_photo", "on_website", ...personFields.map((f) => `person_id.${f}`)];

const termFields = [
  "id",
  "crew_member_id",
  "position_id",
  "program_id",
  "program_area_id",
  "starts_on",
  "ends_on",
  "note",
  "staff_level_id",
  "hourly_rate_cents",
  "profit_share",
];

/** A term's pay, which only Crew Writers and planners read. */
export const PAY_FIELDS = ["staff_level_id", "hourly_rate_cents", "profit_share"];

type MemberRow = Omit<CrewMember, "person"> & { person_id: CrewPerson };
type PositionRow = Omit<CrewPosition, "qualification_ids" | "links"> & { qualifications: CrewPosition["links"] };

const readIf = <T>(permissions: Permissions | undefined, table: string, fields: string[]) =>
  canRead(permissions, table) ? readAll<T>(table, undefined, fields) : Promise.resolve([] as T[]);

/** Whether someone may open Crew: Crew Readers and Writers, who read qualifications held. */
export const canSeeCrew = (permissions: Permissions | undefined) => canRead(permissions, "crew_qualifications");

/** Whether someone reads a term's pay: Crew Writers, of those who open Crew. */
export const canSeePay = (permissions: Permissions | undefined) =>
  readableFields(permissions, "crew_terms", PAY_FIELDS).length === PAY_FIELDS.length;

/**
 * Everyone on Crew with their person's name and email, every position with what it needs, every term, with its pay
 * only for those who read it, every qualification held, and the catalog's qualifications, programs, program areas, and
 * staff levels to name them by.
 */
export const crewQuery = (permissions: Permissions | undefined) =>
  queryOptions({
    queryKey: ["crew"],
    queryFn: async (): Promise<CrewData> => {
      const [members, positions, terms, held, qualifications, covers, programs, areas, staffLevels] = await Promise.all(
        [
          readAll<MemberRow>("crew_members", undefined, memberFields),
          readAll<PositionRow>("crew_positions", undefined, [
            "id",
            "name",
            "description",
            "qualifications.id",
            "qualifications.qualification_id",
          ]),
          readAll<CrewTerm>("crew_terms", undefined, readableFields(permissions, "crew_terms", termFields)),
          readAll<HeldQualification>("crew_qualifications", undefined, [
            "id",
            "crew_member_id",
            "qualification_id",
            "earned_on",
            "expires_on",
            "note",
          ]),
          readIf<Named>(permissions, "qualifications", ["id", "name"]),
          readIf<{ qualification_id: string; covers_id: string }>(permissions, "qualification_covers", [
            "qualification_id",
            "covers_id",
          ]),
          readIf<Named>(permissions, "programs", ["id", "name"]),
          readIf<Named>(permissions, "program_areas", ["id", "name"]),
          readIf<StaffLevel>(permissions, "staff_levels", ["id", "name", "archived_at"]),
        ],
      );
      const byName = (a: Named, b: Named) => a.name.localeCompare(b.name);
      return {
        members: members.map(({ person_id, ...m }) => ({ ...m, person: person_id })),
        positions: positions.map(({ qualifications, ...p }) => ({
          ...p,
          qualification_ids: (qualifications ?? []).map((q) => q.qualification_id),
          links: qualifications ?? [],
        })),
        terms,
        held,
        qualifications: qualifications.sort(byName).map((q): CatalogQualification => ({
          ...q,
          covers: covers.filter((c) => c.qualification_id === q.id).map((c) => c.covers_id),
        })),
        programs: programs.sort(byName),
        areas: areas.sort(byName),
        staffLevels: staffLevels.sort(byName),
      };
    },
  });

const client = () => appDirectus().client;

// Platform's published schema types don't have Crew yet, so its writes go by path.
const send = <T = unknown>(method: "POST" | "PATCH" | "DELETE", path: string, body?: object) =>
  client().request(customEndpoint<T>({ path, method, ...(body && { body: JSON.stringify(body) }) }));
const create = <T = unknown>(table: string, body: object) => send<T>("POST", `/items/${table}`, body);
const update = (table: string, id: string, body: object) => send("PATCH", `/items/${table}/${id}`, body);
const remove = (table: string, id: string) => send("DELETE", `/items/${table}/${id}`);

/**
 * Up to 20 people in People whose name or email has `q` in it, for adding one to Crew. A Crew Writer reads every
 * person's name and email, so platform's query guard lets them filter on those.
 */
export function findPeople(q: string): Promise<CrewPerson[]> {
  const words = q.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return Promise.resolve([]);
  }
  return client().request(
    customEndpoint<CrewPerson[]>({
      path: "/items/people",
      method: "GET",
      params: {
        limit: 20,
        fields: personFields,
        sort: ["first_name", "last_name"],
        // Each word in the first name, last name, or email, so "sam chen" finds Sam Chen.
        filter: {
          _and: words.map((w) => ({
            _or: [{ first_name: { _icontains: w } }, { last_name: { _icontains: w } }, { email: { _icontains: w } }],
          })),
        },
      },
    }),
  );
}

/** Puts someone already in People on Crew, off the website, and returns the new crew member's id. */
export async function addCrewMember(personId: string): Promise<string> {
  const row = await create<{ id: string }>("crew_members", { person_id: personId, on_website: false });
  return row.id;
}

/** Takes someone off Crew. Platform refuses it while they have terms or qualifications. */
export async function deleteCrewMember(id: string): Promise<void> {
  await remove("crew_members", id);
}

export async function updateWebsiteProfile(id: string, profile: WebsiteProfile): Promise<void> {
  await update("crew_members", id, profile);
}

/** Uploads a photo into the Website folder, where anyone can see it, and returns its id. */
export async function uploadPhoto(file: File): Promise<string> {
  const form = new FormData();
  // Directus reads the folder only when it comes before the file.
  form.append("folder", WEBSITE_FOLDER);
  form.append("file", file);
  const row = await client().request(uploadFiles(form));
  return (row as { id: string }).id;
}

/** Where a photo is shown from, at `width` pixels. */
export const photoUrl = (id: string, width: number) => `${appDirectus().url}/assets/${id}?width=${width}`;

/** Drops the pay fields for someone who can't write them, since Directus refuses the whole write. */
const termRow = (input: Partial<TermInput>, pay: boolean) =>
  pay ? input : Object.fromEntries(Object.entries(input).filter(([field]) => !PAY_FIELDS.includes(field)));

export async function createTerm(input: TermInput, pay: boolean): Promise<void> {
  await create("crew_terms", termRow(input, pay));
}

export async function updateTerm(id: string, input: Partial<TermInput>, pay: boolean): Promise<void> {
  await update("crew_terms", id, termRow(input, pay));
}

export async function deleteTerm(id: string): Promise<void> {
  await remove("crew_terms", id);
}

export async function createHeldQualification(input: HeldQualificationInput): Promise<void> {
  await create("crew_qualifications", input);
}

export async function updateHeldQualification(id: string, input: HeldQualificationInput): Promise<void> {
  await update("crew_qualifications", id, input);
}

export async function deleteHeldQualification(id: string): Promise<void> {
  await remove("crew_qualifications", id);
}

export async function createPosition({ qualification_ids, ...fields }: PositionInput): Promise<void> {
  await create("crew_positions", {
    ...fields,
    qualifications: qualification_ids.map((qualification_id) => ({ qualification_id })),
  });
}

/** Changes a position, and adds and removes the qualifications it needs to match, in one request. */
export async function updatePosition(position: CrewPosition, { qualification_ids, ...fields }: PositionInput) {
  const qualifications = {
    create: qualification_ids
      .filter((id) => !position.qualification_ids.includes(id))
      .map((qualification_id) => ({ qualification_id })),
    update: [],
    delete: position.links.filter((l) => !qualification_ids.includes(l.qualification_id)).map((l) => l.id),
  };
  await update("crew_positions", position.id, { ...fields, qualifications });
}

/** Deletes a position. Platform refuses it once a term names it. */
export async function deletePosition(id: string): Promise<void> {
  await remove("crew_positions", id);
}
