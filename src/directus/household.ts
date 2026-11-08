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
import { readableFields, type Permissions } from "./access.ts";
import { appDirectus } from "./app.ts";

const client = () => appDirectus().client;

function readAll<T>(table: string, fields: string[], filter: object): Promise<T[]> {
  return client().request(
    customEndpoint<T[]>({ path: `/items/${table}`, method: "GET", params: { limit: -1, fields, filter } }),
  );
}

/**
 * The signed-in person's household, with everyone in it and who's whose guardian, or null if the club hasn't linked
 * them to one. It asks only for the fields Directus lets them read, so a member's missing email shows as none.
 */
export const householdQuery = (permissions: Permissions) =>
  queryOptions({
    queryKey: ["household"],
    queryFn: async (): Promise<Household | null> => {
      const [me] = await readAll<{ id: string; household_id: string | null }>("people", ["id", "household_id"], {
        directus_user_id: { _eq: "$CURRENT_USER" },
      });
      if (!me?.household_id) {
        return null;
      }
      const [household] = await readAll<{ id: string; share_contact: boolean | null }>(
        "households",
        ["id", "share_contact"],
        { id: { _eq: me.household_id } },
      );
      if (!household) {
        return null;
      }
      const people = await readAll<MemberRow>(
        "people",
        readableFields(permissions, "people", [
          "id",
          "first_name",
          "last_name",
          "display_name",
          "email",
          "phone",
          "school",
          "date_of_birth",
        ]),
        { household_id: { _eq: household.id } },
      );
      const guardians = await readAll<GuardianRow>("contacts", ["subject_id", "contact_id"], {
        _and: [{ subject_id: { _in: people.map((p) => p.id) } }, { relationship_type: { _eq: "guardian" } }],
      });
      return buildHousehold(household, people, guardians, me.id, seattleToday());
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
