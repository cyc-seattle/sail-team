import { customEndpoint, updateItem } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import {
  buildHousehold,
  type GuardianRow,
  type Household,
  type MemberChanges,
  type MemberRow,
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
      ["id", "share_contact", "members.*"],
      { id: { _eq: me.household_id } },
    );
    if (!household) {
      return null;
    }
    const guardians = await readAll<GuardianRow>("contacts", ["subject_id", "contact_id"], {
      _and: [{ subject_id: { _in: household.members.map((p) => p.id) } }, { relationship_type: { _eq: "guardian" } }],
    });
    return buildHousehold(household, household.members, guardians, me.id, seattleToday());
  },
});

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
