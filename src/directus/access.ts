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
