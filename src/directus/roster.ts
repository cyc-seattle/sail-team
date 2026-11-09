import { customEndpoint } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import {
  buildTeams,
  currentOfferings,
  monthsBefore,
  seattleToday,
  type ContactRow,
  type OfferingRow,
  type PersonRow,
  type ProgramRow,
  type RegistrationRow,
} from "@/model/roster";
import { readableFields, type Permissions } from "./access.ts";
import { appDirectus } from "./app.ts";

const client = () => appDirectus().client;

// Everyone stays on a team's roster for 12 months after its last offering ends (platform's TEAM_MONTHS).
const RECENT_MONTHS = 12;
// Keeps a list of ids in the query string well under what a proxy accepts.
const CHUNK = 80;

/**
 * Every row of `table` that matches `filter`. The query guard refuses a filter on a field the person can't read on
 * every row, so the page filters only on ids, statuses, and dates, and joins the rest here.
 */
function readAll<T>(table: string, fields: string[], filter?: object): Promise<T[]> {
  return client().request(
    customEndpoint<T[]>({
      path: `/items/${table}`,
      method: "GET",
      params: { limit: -1, fields, ...(filter && { filter }) },
    }),
  );
}

async function readByIds<T>(table: string, field: string, ids: string[], fields: string[], filter = {}) {
  const rows: T[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    rows.push(...(await readAll<T>(table, fields, { _and: [{ [field]: { _in: ids.slice(i, i + CHUNK) } }, filter] })));
  }
  return rows;
}

/** A program as Directus returns it, with its area through its product, and its group. */
interface ProgramRead {
  id: string;
  name: string;
  team?: boolean | null;
  product_id?: { program_area_id: { id: string; name: string } | null } | null;
  google_group_id?: { email: string; name: string | null } | null;
}

/** The program fields to ask for: a related one only when the person can read through to it. */
function programFields(permissions: Permissions): string[] {
  const own = readableFields(permissions, "programs", ["id", "name", "team", "product_id", "google_group_id"]);
  const area =
    own.includes("product_id") &&
    readableFields(permissions, "products", ["program_area_id"]).length > 0 &&
    readableFields(permissions, "program_areas", ["id", "name"]).length === 2;
  const group = own.includes("google_group_id") && readableFields(permissions, "google_groups", ["email"]).length > 0;
  return [
    ...own.filter((f) => f !== "product_id" && f !== "google_group_id"),
    ...(area ? ["product_id.program_area_id.id", "product_id.program_area_id.name"] : []),
    ...(group ? ["google_group_id.email", "google_group_id.name"] : []),
  ];
}

export const teamsQuery = (permissions: Permissions) =>
  queryOptions({
    queryKey: ["rosters"],
    queryFn: async () => {
      const today = seattleToday();
      const offerings = currentOfferings(
        await readAll<OfferingRow>("offerings", ["id", "program_id", "starts_on", "ends_on"], {
          _or: [{ ends_on: { _null: true } }, { ends_on: { _gte: monthsBefore(today, RECENT_MONTHS) } }],
        }),
        today,
      );
      const programs: ProgramRow[] = (
        await readByIds<ProgramRead>(
          "programs",
          "id",
          [...new Set(offerings.map((o) => o.program_id))],
          programFields(permissions),
        )
      ).map((p) => ({
        id: p.id,
        name: p.name,
        team: p.team ?? null,
        area: p.product_id?.program_area_id ?? null,
        group: p.google_group_id?.email ? p.google_group_id : null,
      }));
      const teams = new Set(programs.filter((p) => p.team === true).map((p) => p.id));
      const teamOfferings = offerings.filter((o) => teams.has(o.program_id));
      const registrations = await readByIds<RegistrationRow>(
        "registrations",
        "offering_id",
        teamOfferings.map((o) => o.id),
        ["person_id", "offering_id", "status"],
        { status: { _eq: "confirmed" } },
      );
      const sailors = [...new Set(registrations.map((r) => r.person_id))];
      const contacts = await readByIds<ContactRow>(
        "contacts",
        "subject_id",
        sailors,
        ["subject_id", "contact_id", "relationship_type"],
        { relationship_type: { _eq: "guardian" } },
      );
      const people = await readByIds<PersonRow>(
        "people",
        "id",
        [...new Set([...sailors, ...contacts.map((c) => c.contact_id)])],
        readableFields(permissions, "people", ["id", "first_name", "last_name", "email", "phone", "school"]),
      );
      return buildTeams({ programs, offerings: teamOfferings, registrations, contacts, people });
    },
  });

/** The signed-in person's own record's id, found by their login, so the roster opens on their team. */
export const myIdQuery = queryOptions({
  queryKey: ["rosters", "me"],
  queryFn: async (): Promise<string | null> =>
    (await readAll<{ id: string }>("people", ["id"], { directus_user_id: { _eq: "$CURRENT_USER" } }))[0]?.id ?? null,
});
