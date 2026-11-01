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
const read = (access: "partial" | "full") => ({
  create: none,
  read: { access },
  update: none,
  delete: none,
  share: none,
});

export const plannerPermissions: Permissions = {
  plans: read("full"),
  plan_versions: read("full"),
};

export const parentPermissions: Permissions = {
  people: read("partial"),
};
