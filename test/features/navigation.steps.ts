import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { giveThroughGroup } from "./visitors";

// Steps for features/navigation.feature, against dev, at the sizes AGENTS.md reviews every UI change at.

const { Given, Then } = createBdd(test);

const sizes = { laptop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };

/** The scenario's screen, set by its Given. A worker runs one scenario at a time. */
const screen: { size: keyof typeof sizes } = { size: "laptop" };

/** Each page's heading, which shows it opened. */
const headings: Record<string, string> = { Home: "Sail Team", Plans: "Plans", Rosters: "Rosters" };

/** The menu that holds a page's link: on a phone, its tab, or More's sidebar if it has none. */
async function menu(page: Page, label: string) {
  if (screen.size === "phone") {
    const tabs = page.getByRole("navigation", { name: "Pages" });
    if (await tabs.getByRole("link", { name: label }).count()) {
      return tabs;
    }
    await page.getByRole("button", { name: "More" }).click();
  }
  return page.getByRole("navigation", { name: "Menu" });
}

Given("I can read plans", async ({ visitor }) => {
  await giveThroughGroup(visitor, "Plan Reader");
});

Given(/^I'm on a (laptop|phone)$/, async ({ page }, size: keyof typeof sizes) => {
  screen.size = size;
  await page.setViewportSize(sizes[size]);
});

Then(/^I can open (.+) from the menu$/, async ({ page }, list: string) => {
  for (const label of list.split(/, and |, | and /)) {
    await (await menu(page, label)).getByRole("link", { name: label }).click();
    await expect(page.getByRole("heading", { level: 1, name: headings[label]! })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});

Then("the menu doesn't offer Plans", async ({ page }) => {
  if (screen.size === "phone") {
    await expect(page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "Plans" })).toHaveCount(0);
    await page.getByRole("button", { name: "More" }).click();
  }
  await expect(page.getByRole("navigation", { name: "Menu" }).getByRole("link", { name: "Rosters" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Menu" }).getByRole("link", { name: "Plans" })).toHaveCount(0);
  await page.keyboard.press("Escape");
});

Then("my account menu shows my name", async ({ page, visitor }) => {
  if (screen.size === "phone" && !(await page.getByRole("dialog").count())) {
    await page.getByRole("button", { name: "More" }).click();
  }
  await page.getByRole("button", { name: visitor.name }).click();
  await expect(page.getByText(`Signed in as ${visitor.name}`)).toBeVisible();
  await expect(page.getByRole("menuitemradio", { name: "Dark" })).toBeVisible();
});
