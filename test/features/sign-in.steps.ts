import assert from "node:assert/strict";
import { expect } from "@playwright/test";
import { createBdd, test as base } from "playwright-bdd";
import { devPlatform, proxyOk } from "./support";
import { cleanUp, giveThroughGroup, makeDirectusUser, newVisitor, staleVisitors, type Visitor } from "./visitors";

// Steps for features/sign-in.feature, against dev. Each scenario signs in as a made-up visitor through Authentik's
// emailed link, which dev's Authentik sends to Mailpit.

export const test = base.extend<{ visitor: Visitor }>({
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
});

const { Given, When, Then } = createBdd(test);

const escaped = (domain: string) => domain.replace(/\./g, "\\.");

Given("I'm a planner who can read plans", async ({ visitor }) => {
  await makeDirectusUser(visitor);
  await giveThroughGroup(visitor, "Plan Reader");
});

Given("I'm a parent who can't read plans", async ({ visitor }) => {
  await makeDirectusUser(visitor);
});

When(/^I open Plans(?: without signing in)?$/, async ({ page }) => {
  await page.goto(`https://${(await devPlatform()).domain}/plans`);
});

Then("I'm on the club's sign-in page", async ({ page }) => {
  const { domain } = await devPlatform();
  await expect(page).toHaveURL(new RegExp(`^https://login\\.${escaped(domain)}/if/flow/`));
  await expect(page.locator('input[name="uidField"]')).toBeVisible();
});

When("I sign in", async ({ page, visitor }) => {
  await page.locator('input[name="uidField"]').fill(visitor.email);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText(/check your inbox/i)).toBeVisible();

  const query = encodeURIComponent(`to:"${visitor.email}"`);
  await expect
    .poll(async () => (await proxyOk("mailpit", 8025, `/api/v1/search?query=${query}`)).messages?.[0]?.ID, {
      timeout: 60_000,
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
});

Then("I'm back on Plans", async ({ page }) => {
  const { domain } = await devPlatform();
  await expect(page).toHaveURL(new RegExp(`^https://${escaped(domain)}/plans`));
  await expect(page.getByRole("heading", { level: 1, name: "Plans" })).toBeVisible();
});

Then("the page shows my name", async ({ page, visitor }) => {
  await expect(page.getByRole("banner").getByRole("button", { name: visitor.name })).toBeVisible();
});

Then("the page says I don't have access to plans", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "You don't have access to plans" })).toBeVisible();
});

Then("it shows no plans", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Plans" })).toHaveCount(0);
  await expect(page.locator('a[href^="/plans/"]')).toHaveCount(0);
});
