import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

// The journeys, in a browser against dev. A scenario tagged @fixme is written but not built yet.
const testDir = defineBddConfig({
  features: "features/*.feature",
  steps: "test/features/*.ts",
  outputDir: ".features-gen",
  missingSteps: "fail-on-run",
});

export default defineConfig({
  testDir,
  // A scenario makes its plans, waits for saved versions' results, and signs in by emailed link.
  timeout: 300_000,
  // Dev is shared and small, and its Authentik is sometimes slow. One retry in Actions keeps that from failing a PR.
  retries: process.env["CI"] ? 1 : 0,
  // One sign-in at a time: Directus gives up on Authentik's token after 3.5s, which dev's Authentik misses under load.
  workers: 1,
  expect: { timeout: 30_000 },
  reporter: "list",
  use: { baseURL: process.env["SAIL_TEAM_URL"] ?? "https://dev.cycsail.team", trace: "retain-on-failure" },
});
