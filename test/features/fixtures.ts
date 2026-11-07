import assert from "node:assert/strict";
import { expect, type Page } from "@playwright/test";
import { test as base } from "playwright-bdd";
import { Club } from "./club";
import { Squad } from "./squad";
import { devPlatform, proxyOk } from "./support";
import { cleanUp, newVisitor, staleVisitors, type Visitor } from "./visitors";

// What every journey's steps share: the scenario's made-up visitor, and its made-up club's plans on dev.

export const test = base.extend<{ visitor: Visitor; club: Club; squad: Squad }>({
  visitor: [
    // eslint-disable-next-line no-empty-pattern -- Playwright reads a fixture's dependencies from this pattern.
    async ({}, use) => {
      for (const email of await staleVisitors()) {
        await cleanUp(email);
      }
      const visitor = newVisitor();
      try {
        await use(visitor);
      } finally {
        await cleanUp(visitor.email);
      }
    },
    { timeout: 180_000 },
  ],
  club: [
    // eslint-disable-next-line no-empty-pattern -- Playwright reads a fixture's dependencies from this pattern.
    async ({}, use) => {
      const club = new Club();
      try {
        await use(club);
      } finally {
        await club.cleanUp();
      }
    },
    { timeout: 180_000 },
  ],
  // After the visitor, so it's deleted before them: their person is still someone's parent until then.
  squad: [
    async ({ visitor }, use) => {
      void visitor;
      const squad = new Squad();
      try {
        await use(squad);
      } finally {
        await squad.cleanUp();
      }
    },
    { timeout: 180_000 },
  ],
});

/** The Financial Plan a scenario opens, set by its Given steps. One scenario runs at a time (playwright.config.ts). */
export const opened: { set?: string } = {};

/** The app's address on dev, such as `https://dev.cycsail.team`. */
export const app = async () => `https://${(await devPlatform()).domain}`;

/**
 * Signs in on Authentik's sign-in page, which the browser must be on, through the emailed link dev's Authentik sends
 * to Mailpit, and waits to be sent back to the app.
 */
export async function signIn(page: Page, visitor: Visitor): Promise<void> {
  await page.locator('input[name="uidField"]').fill(visitor.email);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText(/check your inbox/i)).toBeVisible();

  const query = encodeURIComponent(`to:"${visitor.email}"`);
  await expect
    // Dev's Authentik sometimes takes over a minute to send it.
    .poll(async () => (await proxyOk("mailpit", 8025, `/api/v1/search?query=${query}`)).messages?.[0]?.ID, {
      timeout: 120_000,
      intervals: [2_000],
    })
    .toBeTruthy();
  const found = await proxyOk("mailpit", 8025, `/api/v1/search?query=${query}`);
  const message = await proxyOk("mailpit", 8025, `/api/v1/message/${found.messages[0].ID}`);
  const href = /href="([^"]+)"/.exec(message.HTML)?.[1];
  assert.ok(href, "The sign-in email has no link.");
  await page.goto(href.replace(/&amp;/g, "&"));
  await page.getByRole("button", { name: "Continue" }).click();
  // Authentik, then Directus, send the browser back. Dev's Authentik can take a minute over the authorize step.
  const { domain } = await devPlatform();
  await page.waitForURL((url) => url.host === domain, { timeout: 120_000 });
}
