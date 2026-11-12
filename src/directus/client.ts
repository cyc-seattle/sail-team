import type { Schema } from "@cyc-seattle/platform/schema";
import { authentication, createDirectus, rest } from "@directus/sdk";

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
  return createDirectus<Schema>(url, { globals: { fetch } })
    .with(authentication("session", { credentials: "include" }))
    .with(rest({ credentials: "include" }));
}

export type Client = ReturnType<typeof makeClient>;
