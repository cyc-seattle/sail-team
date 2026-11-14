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

/** Whether the user can create, update, or delete some of `collection`. As with `canRead`, Directus still checks every write. */
export function canWrite(
  permissions: Permissions | undefined,
  collection: string,
  action: "create" | "update" | "delete",
): boolean {
  const access = permissions?.[collection]?.[action]?.access;
  return access === "partial" || access === "full";
}

/**
 * Whether the user can update every one of `fields` on some row of `collection`, such as a Financial Plan's status, which
 * only a Plan Approver sets. As with `canRead`, Directus still checks every write.
 */
export function canUpdateFields(permissions: Permissions | undefined, collection: string, fields: string[]): boolean {
  const update = permissions?.[collection]?.update;
  if (update?.access !== "partial" && update?.access !== "full") {
    return false;
  }
  const allowed = (update as { fields?: string[] | null }).fields;
  return !allowed || allowed.includes("*") || fields.every((field) => allowed.includes(field));
}

/** Whether the user is on the finance committee: they save Financial Plans, make them active, and archive them. */
export const canApprovePlans = (permissions: Permissions | undefined) =>
  canUpdateFields(permissions, "version_sets", ["status", "effective_from", "archived_at"]);

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
 * Whether someone may open the team rosters: households on a team and Crew. Both read which programs are teams, which
 * Community's rules never give. Community reads email too, for its own household, so email can't tell them apart.
 */
export function canSeeRosters(permissions: Permissions | undefined): boolean {
  return canRead(permissions, "programs") && readableFields(permissions, "programs", ["team"]).length > 0;
}

/** Whether someone may open the Household page: anyone Directus links to a household. */
export function canSeeHousehold(permissions: Permissions | undefined): boolean {
  return canRead(permissions, "households");
}
