import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { app, test } from "./fixtures";

// Steps for features/home.feature, against dev.

const { When, Then } = createBdd(test);

const homeLinks = (page: Page) => page.getByRole("main").getByRole("listitem");

When("I open the home page", async ({ page }) => {
  await page.goto(`${await app()}/`);
});

Then("the home page links to Planning", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: "Sail Team" })).toBeVisible();
  await expect(homeLinks(page).getByRole("link", { name: "Planning" })).toBeVisible();
});

Then("the home page doesn't link to Planning", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: "Sail Team" })).toBeVisible();
  await expect(homeLinks(page).getByRole("link", { name: "Planning" })).toHaveCount(0);
});

Then("it links to Clubspot and Google Calendar", async ({ page }) => {
  await expect(homeLinks(page).getByRole("link", { name: "Clubspot" })).toBeVisible();
  await expect(homeLinks(page).getByRole("link", { name: "Google Calendar" })).toBeVisible();
});
