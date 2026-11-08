import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { app, signIn, test } from "./fixtures";
import { devPlatform } from "./support";
import { giveThroughGroup, makeDirectusUser } from "./visitors";

// Steps for features/sign-in.feature, against dev. Each scenario signs in as a made-up visitor through Authentik's
// emailed link, which dev's Authentik sends to Mailpit.

const { Given, When, Then } = createBdd(test);

const escaped = (domain: string) => domain.replace(/\./g, "\\.");

Given("I'm a planner who can read plans", async ({ visitor }) => {
  await makeDirectusUser(visitor);
  await giveThroughGroup(visitor, "Plan Reader");
});

Given(/^I'm a (?:parent|coach) who can't read plans$/, async ({ visitor }) => {
  await makeDirectusUser(visitor);
});

When(/^I open Plans(?: without signing in)?$/, async ({ page }) => {
  await page.goto(`${await app()}/plans`);
});

Then("I'm on the club's sign-in page", async ({ page }) => {
  const { domain } = await devPlatform();
  await expect(page).toHaveURL(new RegExp(`^https://login\\.${escaped(domain)}/if/flow/`));
  await expect(page.locator('input[name="uidField"]')).toBeVisible();
});

When("I sign in", async ({ page, visitor }) => {
  await signIn(page, visitor);
});

When("I've signed in", async ({ page, visitor }) => {
  await page.goto(`${await app()}/plans`);
  await signIn(page, visitor);
});

Then("I'm back on Plans", async ({ page }) => {
  const { domain } = await devPlatform();
  await expect(page).toHaveURL(new RegExp(`^https://${escaped(domain)}/plans`));
  await expect(page.getByRole("heading", { level: 1, name: "Plans" })).toBeVisible();
});

Then("the page shows my name", async ({ page, visitor }) => {
  await expect(page.getByRole("button", { name: visitor.name })).toBeVisible();
});

Then("the page says I don't have access to plans", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "You don't have access to plans" })).toBeVisible();
});

Then("it shows no plans", async ({ page }) => {
  await expect(page.getByRole("navigation").getByRole("link", { name: "Plans" })).toHaveCount(0);
  await expect(page.locator('a[href^="/plans/"]')).toHaveCount(0);
});
