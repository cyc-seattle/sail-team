import { customEndpoint, updateItem } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import {
  buildRosters,
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

export const rostersQuery = (permissions: Permissions) =>
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
      const programs = await readByIds<ProgramRow>(
        "programs",
        "id",
        [...new Set(offerings.map((o) => o.program_id))],
        readableFields(permissions, "programs", ["id", "name", "team"]),
      );
      const registrations = await readByIds<RegistrationRow>(
        "registrations",
        "offering_id",
        offerings.map((o) => o.id),
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
        readableFields(permissions, "people", ["id", "first_name", "last_name", "email", "phone"]),
      );
      return buildRosters({ programs, offerings, registrations, contacts, people });
    },
  });

export interface MyRecord {
  id: string;
  share_contact: boolean | null;
}

/** The signed-in person's own record, found by their login, or null if the club hasn't linked one to them. */
export const myRecordQuery = queryOptions({
  queryKey: ["rosters", "me"],
  queryFn: async (): Promise<MyRecord | null> =>
    (
      await readAll<MyRecord>("people", ["id", "share_contact"], {
        directus_user_id: { _eq: "$CURRENT_USER" },
      })
    )[0] ?? null,
});

export async function setShareContact(personId: string, share: boolean): Promise<void> {
  await client().request(updateItem("people", personId, { share_contact: share }));
}
