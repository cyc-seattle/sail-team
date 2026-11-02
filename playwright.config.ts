import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

// The journeys, in a browser against dev. A scenario tagged @fixme is written but not built yet.
const testDir = defineBddConfig({
  features: "features/*.feature",
  steps: "test/features/*.steps.ts",
  outputDir: ".features-gen",
  missingSteps: "fail-on-run",
});

export default defineConfig({
  testDir,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: "list",
  use: { baseURL: process.env["SAIL_TEAM_URL"] ?? "https://dev.cycsail.team", trace: "retain-on-failure" },
});
