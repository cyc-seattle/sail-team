import { customEndpoint, updateItem } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import {
  buildHousehold,
  type GuardianRow,
  type Household,
  type MemberChanges,
  type MemberRow,
  type School,
  type SignUpRow,
  signUpsShownFor,
} from "@/model/household";
import { seattleToday } from "@/model/roster";
import { appDirectus } from "./app.ts";

const client = () => appDirectus().client;

function readAll<T>(table: string, fields: string[], filter: object): Promise<T[]> {
  return client().request(
    customEndpoint<T[]>({ path: `/items/${table}`, method: "GET", params: { limit: -1, fields, filter } }),
  );
}

/**
 * The signed-in person's household, with everyone in it and who's whose guardian, or null if no one has linked them to
 * one. Members come through the household, since the query guard refuses a Team user's filter on `household_id`.
 */
export const householdQuery = queryOptions({
  queryKey: ["household"],
  queryFn: async (): Promise<Household | null> => {
    const [me] = await readAll<{ id: string; household_id: string | null }>("people", ["id", "household_id"], {
      directus_user_id: { _eq: "$CURRENT_USER" },
    });
    if (!me?.household_id) {
      return null;
    }
    const [household] = await readAll<{ id: string; share_contact: boolean | null; members: MemberRow[] }>(
      "households",
      ["id", "share_contact", "members.*", "members.school_id.id", "members.school_id.name"],
      { id: { _eq: me.household_id } },
    );
    if (!household) {
      return null;
    }
    const guardians = await readAll<GuardianRow>("contacts", ["subject_id", "contact_id"], {
      _and: [{ subject_id: { _in: household.members.map((p) => p.id) } }, { relationship_type: { _eq: "guardian" } }],
    });
    const signUps = await readSignUps(signUpsShownFor(me.id, guardians));
    return buildHousehold(household, household.members, guardians, me.id, seattleToday(), signUps);
  },
});

/** The sign-ups of `people`, with each one's offering and program, joined here as the rosters join them. */
async function readSignUps(people: string[]): Promise<SignUpRow[]> {
  const registrations = await readAll<{ id: string; person_id: string; offering_id: string; status: string | null }>(
    "registrations",
    ["id", "person_id", "offering_id", "status"],
    { _and: [{ person_id: { _in: people } }, { status: { _in: ["confirmed", "waitlist"] } }] },
  );
  if (registrations.length === 0) {
    return [];
  }
  const offerings = await readAll<{ id: string; program_id: string; starts_on: string | null; ends_on: string | null }>(
    "offerings",
    ["id", "program_id", "starts_on", "ends_on"],
    { id: { _in: [...new Set(registrations.map((r) => r.offering_id))] } },
  );
  const programs = await readAll<{ id: string; name: string | null }>("programs", ["id", "name"], {
    id: { _in: [...new Set(offerings.map((o) => o.program_id))] },
  });
  const offering = new Map(offerings.map((o) => [o.id, o]));
  const program = new Map(programs.map((p) => [p.id, p.name]));
  return registrations.map((r) => {
    const o = offering.get(r.offering_id);
    return {
      id: r.id,
      person_id: r.person_id,
      status: r.status,
      starts_on: o?.starts_on ?? null,
      ends_on: o?.ends_on ?? null,
      program: (o && program.get(o.program_id)) ?? null,
    };
  });
}

export async function updateMember(personId: string, changes: MemberChanges): Promise<void> {
  await client().request(updateItem("people", personId, changes));
}

export async function setHouseholdSharing(householdId: string, share: boolean): Promise<void> {
  // A raw request until @cyc-seattle/platform's schema has `households`.
  await client().request(
    customEndpoint({
      path: `/items/households/${householdId}`,
      method: "PATCH",
      body: JSON.stringify({ share_contact: share }),
    }),
  );
}

/** The known schools, by name, which a sailor's school is picked from. */
export const schoolsQuery = queryOptions({
  queryKey: ["schools"],
  queryFn: async (): Promise<School[]> => {
    const rows = await readAll<School>("schools", ["id", "name"], {});
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  },
});
