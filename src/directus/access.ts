import type { ReadUserPermissionsOutput } from "@directus/sdk";

export type Permissions = ReadUserPermissionsOutput;

/**
 * Whether the user can read any of `collection`, from `/permissions/me`. The app uses it only to decide what to show:
 * Directus still checks every read.
 */
export function canRead(permissions: Permissions | undefined, collection: string): boolean {
  const access = permissions?.[collection]?.read?.access;
  return access === "partial" || access === "full";
}

/**
 * The fields of `wanted` the user can read on some row of `collection`. Directus refuses a request that names a field
 * no rule gives, so a page asks only for these, and gets null on a row whose rule withholds one.
 */
export function readableFields(permissions: Permissions | undefined, collection: string, wanted: string[]): string[] {
  const fields = permissions?.[collection]?.read?.fields;
  if (!fields || fields.includes("*")) {
    return wanted;
  }
  return wanted.filter((field) => fields.includes(field));
}

/**
 * Whether someone may open the team rosters: households on a team and Crew. Both read other people's email, which
 * Community's rules, for their own household only, never give.
 */
export function canSeeRosters(permissions: Permissions | undefined): boolean {
  return canRead(permissions, "people") && readableFields(permissions, "people", ["email"]).length > 0;
}
