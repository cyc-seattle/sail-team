import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { app, test } from "./fixtures";

// Steps for features/home.feature, against dev.

const { Given, When, Then } = createBdd(test);

/** The titles the scenario posted, by when. A worker runs one scenario at a time. */
const posted: { today?: string; yesterday?: string } = {};

Given("an announcement posted today", async ({ posts }) => {
  posted.today = await posts.announce(0);
});

Given("an announcement posted today and one posted yesterday", async ({ posts }) => {
  posted.yesterday = await posts.announce(1);
  posted.today = await posts.announce(0);
});

When("I open the home page", async ({ page }) => {
  await page.goto(`${await app()}/`);
});

Then("the home page shows today's announcement", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: "Sail Team" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: posted.today! })).toBeVisible();
});

Then("today's announcement comes before yesterday's", async ({ page }) => {
  const titles = page.getByRole("main").getByRole("heading", { level: 2 });
  await expect(titles.filter({ hasText: posted.yesterday! })).toBeVisible();
  const all = await titles.allTextContents();
  expect(all.indexOf(posted.today!)).toBeLessThan(all.indexOf(posted.yesterday!));
});
