import { readFileSync } from "node:fs";
import type { CiStackTarget } from "@cyc-seattle/platform";

// The CI stack the journeys run against, from the target.json CI_STACK_TARGET names (platform's docs/testing.md).
// Read by playwright.config.ts as well as the steps, so it imports nothing that needs a browser.

const file = process.env["CI_STACK_TARGET"];
if (!file) {
  throw new Error(
    "CI_STACK_TARGET isn't set. Start a CI stack with `mise run ci-stack`, then `mise run integration-ci`.",
  );
}

/** The CI stack the journeys run against. */
export const ciStack = JSON.parse(readFileSync(file, "utf8")) as CiStackTarget;

/** Where playwright.config.ts serves the app, which must be on the stack's `CI_STACK_REDIRECTS`. */
export const ciAppUrl = "http://localhost:4173";
