// Made-up people and permissions, for local work and tests. Never real club data.
import type { Permissions } from "@/directus/access";
import type { Me } from "@/directus/sign-in";

export const planner: Me = {
  id: "00000000-0000-4000-8000-000000000001",
  first_name: "Robin",
  last_name: "Tiller",
  email: "robin@example.org",
  role: { name: "Crew" },
};

const none = { access: "none" } as const;
const read = (access: "partial" | "full", fields = ["*"]) => ({
  create: none,
  read: { access, fields },
  update: none,
  delete: none,
  share: none,
});

/** A household on no team, as Community's rules give it: everyone in their own household, with their details. */
export const parentPermissions: Permissions = {
  people: read("partial", [
    "id",
    "first_name",
    "last_name",
    "display_name",
    "email",
    "phone",
    "school_id",
    "school",
    "date_of_birth",
    "household_id",
    "share_contact",
    "directus_user_id",
  ]),
  households: read("partial", ["id", "share_contact"]),
  schools: read("partial", ["id", "name"]),
  contacts: read("partial", ["subject_id", "contact_id", "relationship_type"]),
  registrations: read("partial", ["id", "person_id", "offering_id", "status"]),
  offerings: read("partial", ["id", "program_id", "starts_on", "ends_on"]),
  programs: read("partial", ["id", "name"]),
  program_areas: read("partial", ["id", "name"]),
};

/**
 * A household on a team, as Team's rules give it: names, sailors' schools, the email and phone of adults who share, and
 * each team's program area and Google Group.
 */
export const teamPermissions: Permissions = {
  ...parentPermissions,
  programs: read("partial", ["id", "name", "team", "product_id", "google_group_id"]),
  products: read("partial", ["id", "program_area_id"]),
  google_groups: read("partial", ["id", "name", "email"]),
};

/** A Plan Writer, who can start Financial Plans, change them, and delete drafts. */
const write = () => ({
  ...read("full"),
  create: { access: "full" as const },
  update: { access: "full" as const },
  delete: { access: "full" as const },
});

/** A planner who is also a parent on a team, so `mise run dev` shows both Planning and Rosters. */
export const plannerPermissions: Permissions = {
  ...teamPermissions,
  plans: read("full"),
  plan_versions: read("full"),
  version_sets: write(),
};
