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
  ]),
  households: read("partial", ["id", "share_contact"]),
  schools: read("partial", ["id", "name"]),
  contacts: read("partial", ["subject_id", "contact_id", "relationship_type"]),
  registrations: read("partial", ["id", "person_id", "offering_id", "status"]),
  offerings: read("partial", ["id", "product_id", "starts_on", "ends_on"]),
  programs: read("partial", ["id", "name", "product_id"]),
  products: read("partial", ["id", "name"]),
  program_areas: read("partial", ["id", "name"]),
};

/**
 * A household on a team, as Team's rules give it: names, sailors' schools, the email and phone of adults who share, and
 * each team's program area and Google Group.
 */
export const teamPermissions: Permissions = {
  ...parentPermissions,
  programs: read("partial", ["id", "name", "team", "product_id", "google_group_id"]),
  products: read("partial", ["id", "name", "program_area_id"]),
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
  financial_plans: write(),
  assets: write(),
  boats: write(),
  boat_classes: write(),
  storage_areas: write(),
  accounts: read("full"),
  program_areas: read("full"),
  products: read("full"),
  programs: read("full"),
  google_groups: read("full"),
  // A Catalog Writer for offerings too, so `mise run dev` shows the sync from plan.
  offerings: write(),
  offering_schedule: write(),
  activities: write(),
  registration_forms: read("full"),
  plan_offerings: read("full"),
  plan_activities: read("full"),
  organization_cost_accounts: read("full"),
  qualifications: read("full"),
  qualification_covers: read("full"),
  // A Crew Writer too, so `mise run dev` shows Crew.
  crew_members: write(),
  crew_positions: write(),
  crew_terms: write(),
  crew_qualifications: write(),
  crew_position_qualifications: write(),
  staff_levels: read("partial", ["id", "name", "archived_at"]),
};

const crewRead = (fields = ["*"]) => read("full", fields);

/** A Crew Reader, who sees Crew but changes none of it, and never a term's pay. */
export const crewReaderPermissions: Permissions = {
  crew_members: crewRead(),
  crew_positions: crewRead(),
  crew_terms: crewRead([
    "id",
    "crew_member_id",
    "position_id",
    "program_id",
    "program_area_id",
    "starts_on",
    "ends_on",
    "note",
  ]),
  crew_qualifications: crewRead(),
  crew_position_qualifications: crewRead(),
  people: read("full", ["id", "first_name", "last_name", "email"]),
  programs: read("full", ["id", "name"]),
  program_areas: read("full", ["id", "name"]),
  qualifications: read("full"),
  qualification_covers: read("full"),
  staff_levels: read("full", ["id", "name", "archived_at"]),
};

/** A Catalog Reader, who reads the inventory but changes none of it, and reads no plans. */
export const catalogReaderPermissions: Permissions = {
  assets: read("full"),
  boats: read("full"),
  boat_classes: read("full"),
  storage_areas: read("full"),
  accounts: read("full"),
};
