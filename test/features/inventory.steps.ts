import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { app, test } from "./fixtures";
import { giveThroughGroup, makeDirectusUser } from "./visitors";

// Steps for features/inventory.feature, with a made-up boat class (./fleet.ts).

const { Given, When, Then } = createBdd(test);

Given("I'm a Catalog Writer", async ({ visitor }) => {
  await makeDirectusUser(visitor);
  await giveThroughGroup(visitor, "Catalog Writer");
});

Given("I'm a Catalog Reader", async ({ visitor }) => {
  await makeDirectusUser(visitor);
  await giveThroughGroup(visitor, "Catalog Reader");
});

Given("a boat class with no boats yet", async ({ fleet }) => {
  await fleet.boatClass();
});

When("I open Inventory", async ({ page }) => {
  await page.goto(`${await app()}/inventory`);
  await expect(page.getByRole("heading", { level: 1, name: "Inventory" })).toBeVisible({ timeout: 30_000 });
});

When("I add a sailboat of that class with sail number {int}", async ({ page, fleet }, sailNumber: number) => {
  await page.getByRole("button", { name: "Add asset" }).click();
  const dialog = page.getByRole("dialog", { name: "Add asset" });
  await dialog.getByRole("combobox", { name: "Boat class" }).click();
  await page.getByRole("option", { name: fleet.className }).click();
  await dialog.getByRole("textbox", { name: "Sail number" }).fill(String(sailNumber));
  await dialog.getByRole("button", { name: "Add asset" }).click();
  await expect(dialog).toBeHidden();
});

Then("the asset list shows it under Sailboats", async ({ page, fleet }) => {
  await page.getByRole("searchbox", { name: "Find by name or number" }).fill(fleet.className);
  const table = page.getByRole("table", { name: "Assets" });
  await expect(table.getByRole("rowheader")).toHaveText(["Sailboats 1"]);
  await expect(table.getByRole("row").filter({ hasText: `${fleet.className} 77` })).toBeVisible();
});

Then("Boat classes counts {int} boat of that class", async ({ page, fleet }, boats: number) => {
  await page.getByRole("link", { name: "Boat classes" }).click();
  const row = page.getByRole("table", { name: "Boat classes" }).getByRole("row").filter({ hasText: fleet.className });
  await expect(row.getByRole("cell").nth(5)).toHaveText(String(boats));
});

Then("I see the asset list", async ({ page }) => {
  await expect(page.getByRole("searchbox", { name: "Find by name or number" })).toBeVisible();
});

Then("I can't add an asset", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Add asset" })).toHaveCount(0);
});
