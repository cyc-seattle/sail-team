import { makeClient, type Client } from "./client.ts";
import { directusUrlFor } from "./session.ts";

/** The page sign-in returns to, which must be on Directus's redirect list (platform's backend stack). */
export const landing = "/";

let app: { client: Client; url: string } | undefined;

/** The app's own Directus, beside whatever hostname serves it. Made on first use, so tests can load routes. */
export function appDirectus() {
  if (!app) {
    const url = directusUrlFor(window.location.hostname);
    app = { client: makeClient(url), url };
  }
  return app;
}
