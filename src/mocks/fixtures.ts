// Made-up people and permissions, for local work and tests. Never real club data.
import type { Permissions } from "@/directus/access";
import type { Me } from "@/directus/sign-in";

export const planner: Me = {
  id: "00000000-0000-4000-8000-000000000001",
  first_name: "Robin",
  last_name: "Tiller",
  email: "robin@example.org",
};

const none = { access: "none" } as const;
const read = (access: "partial" | "full", fields = ["*"]) => ({
  create: none,
  read: { access, fields },
  update: none,
  delete: none,
  share: none,
});

/** A family on a team, as Team's rules give it: names, and the email and phone of adults who share. */
export const teamPermissions: Permissions = {
  people: read("partial", ["id", "first_name", "last_name", "email", "phone", "share_contact", "directus_user_id"]),
  contacts: read("partial", ["subject_id", "contact_id", "relationship_type"]),
  registrations: read("partial", ["id", "person_id", "offering_id", "status"]),
  offerings: read("partial", ["id", "program_id", "starts_on", "ends_on"]),
  programs: read("partial", ["id", "name", "team"]),
};

/** A planner who is also a parent on a team, so `mise run dev` shows both Plans and Rosters. */
export const plannerPermissions: Permissions = {
  ...teamPermissions,
  plans: read("full"),
  plan_versions: read("full"),
};

export const parentPermissions: Permissions = {
  people: read("partial"),
};
