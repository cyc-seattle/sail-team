import { readFileSync } from "node:fs";
import type { CiStackTarget } from "@cyc-seattle/platform";

// Where the journeys run: a CI stack, when CI_STACK_TARGET names its target.json (docs/testing.md in platform), or
// else dev. Read by playwright.config.ts as well as the steps, so it imports nothing that needs a browser or dev.

const file = process.env["CI_STACK_TARGET"];

/** The CI stack the journeys run against, if any. */
export const ciStack: CiStackTarget | undefined = file
  ? (JSON.parse(readFileSync(file, "utf8")) as CiStackTarget)
  : undefined;

/** Where playwright.config.ts serves the app against a CI stack, which must be on its `CI_STACK_REDIRECTS`. */
export const ciAppUrl = "http://localhost:4173";
