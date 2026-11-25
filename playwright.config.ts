import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";
import { ciAppUrl, ciStack } from "./test/features/target";

// The journeys, in a browser against a CI stack when CI_STACK_TARGET is set, or else dev. A scenario tagged @fixme is
// written but not built yet.
const testDir = defineBddConfig({
  features: "features/*.feature",
  steps: "test/features/*.ts",
  outputDir: ".features-gen",
  missingSteps: "fail-on-run",
});

export default defineConfig({
  testDir,
  // A scenario makes its plans and waits for saved versions' results. One that signs in by emailed link may also wait
  // its turn behind another's. A hang fails the run instead of holding dev, which every deploy shares.
  timeout: 240_000,
  globalTimeout: 15 * 60_000,
  // Dev is shared and small, and its Authentik is sometimes slow. One retry in Actions keeps that from failing a run.
  retries: process.env["CI"] ? 1 : 0,
  // Each scenario makes its own visitor and data, so they run side by side. Three keeps dev's small Directus from
  // shedding load. Sign-ins through Authentik still take turns (test/features/fixtures.ts).
  fullyParallel: true,
  workers: 3,
  globalSetup: "./test/features/global-setup.ts",
  expect: { timeout: 30_000 },
  reporter: "list",
  // Against a CI stack, the app is built for its Directus and Authentik and served here.
  ...(ciStack && {
    webServer: {
      command: `pnpm exec vite build --outDir .features-app && pnpm exec vite preview --outDir .features-app --port ${new URL(ciAppUrl).port} --strictPort`,
      url: ciAppUrl,
      env: { VITE_DIRECTUS_URL: ciStack.directus.url, VITE_AUTHENTIK_URL: ciStack.authentik.url },
      timeout: 180_000,
    },
  }),
  use: {
    baseURL: ciStack ? ciAppUrl : (process.env["SAIL_TEAM_URL"] ?? "https://dev.cycsail.team"),
    // A typical laptop (AGENTS.md). A phone scenario sets its own.
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
});
