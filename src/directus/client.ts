import type { Schema } from "@cyc-seattle/platform/schema";
import { authentication, createDirectus, rest } from "@directus/sdk";

interface Role {
  id: string;
  name: string;
}

/**
 * Platform's schema declares only its own field on `directus_users`, which hides the built-in relations, such as
 * `role`, from the SDK's types.
 */
type AppSchema = Omit<Schema, "directus_users"> & {
  directus_users: (Schema["directus_users"][number] & { role: string | Role | null })[];
  directus_roles: Role[];
};

/**
 * A Directus client that sends the browser's Directus session cookie. The cookie is host-only on `directus.<domain>`,
 * which is the same site as the app, so it goes along, and no token ever reaches this code. Its types come from
 * platform's `schemas/*.yaml`.
 */
export function makeClient(
  url: string,
  fetch: typeof globalThis.fetch = (input, init) => globalThis.fetch(input, init),
) {
  // The SDK keeps the `fetch` it found at load time. Looking it up on each request lets tests mock it.
  return createDirectus<AppSchema>(url, { globals: { fetch } })
    .with(authentication("session", { credentials: "include" }))
    .with(rest({ credentials: "include" }));
}

export type Client = ReturnType<typeof makeClient>;
