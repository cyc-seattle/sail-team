import { makeClient } from "./client.ts";
import { directusUrlFor } from "./session.ts";

/** The app's own Directus, beside whatever hostname serves it. */
export const directusUrl = directusUrlFor(window.location.hostname);
export const directus = makeClient(directusUrl);
