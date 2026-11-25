import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { setRole } from "./squad";
import { giveThroughGroup, makeDirectusUser } from "./visitors";

// Steps for features/navigation.feature, at the sizes AGENTS.md reviews every UI change at.

const { Given, When, Then } = createBdd(test);

const sizes = { laptop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };

/** The scenario's screen, set by its Given. A worker runs one scenario at a time. */
const screen: { size: keyof typeof sizes } = { size: "laptop" };

/** Each page's heading, which shows it opened. */
const headings: Record<string, string> = {
  Home: "Sail Team",
  Planning: "Planning",
  Rosters: "Rosters",
  Household: "Household",
  Links: "Links",
};

/** The link the scenario added. */
const link: { title?: string } = {};

/** The sidebar: always open on a laptop, and opened by More on a phone. */
async function openSidebar(page: Page) {
  if (screen.size === "laptop") {
    return page.locator("body");
  }
  if (!(await page.getByRole("dialog").count())) {
    await page.getByRole("button", { name: "More" }).click();
  }
  return page.getByRole("dialog");
}

/** Shuts More's sidebar on a phone, waiting out its closing. */
async function closeSidebar(page: Page) {
  if (screen.size === "phone") {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
}

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

Given(/^I have the (\w+) role$/, async ({ visitor }, role: string) => {
  await makeDirectusUser(visitor);
  if (role !== "Community") {
    await setRole(visitor, role);
  }
});

Given("a link to the CSC website", async ({ posts }) => {
  link.title = await posts.link("https://csc-website.web.app");
});

When("I open Links from the menu", async ({ page }) => {
  await (await menu(page, "Links")).getByRole("link", { name: "Links" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Links" })).toBeVisible();
});

Then("Links shows the CSC website", async ({ page }) => {
  await expect(page.getByRole("main").getByRole("link", { name: new RegExp(link.title!) })).toHaveAttribute(
    "href",
    "https://csc-website.web.app",
  );
});

Then("the menu offers Support", async ({ page }) => {
  const sidebar = await openSidebar(page);
  await expect(sidebar.getByRole("link", { name: "Support" })).toHaveAttribute(
    "href",
    "mailto:info@cyccommunitysailing.org",
  );
  await closeSidebar(page);
});

When("I open my account menu", async ({ page, visitor }) => {
  await openSidebar(page);
  await page.getByRole("button", { name: visitor.name, exact: true }).click();
});

Then(/^it offers (?:only )?(.+)$/, async ({ page }, list: string) => {
  const labels = list === "no tools" ? [] : list.split(/, and |, | and /).map((label) => label.replace(/^the /, ""));
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("menu").locator("a[role=menuitem]")).toHaveText(labels);
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

Then("the menu doesn't offer Planning", async ({ page }) => {
  if (screen.size === "phone") {
    await expect(page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "Planning" })).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: "More" }).click();
  }
  await expect(page.getByRole("navigation", { name: "Menu" }).getByRole("link", { name: "Rosters" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Menu" }).getByRole("link", { name: "Planning" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  // The next step reopens More only if it's shut, so wait out its closing.
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

Then("my account menu shows my name, my email, and my role", async ({ page, visitor }) => {
  if (screen.size === "phone" && !(await page.getByRole("dialog").count())) {
    await page.getByRole("button", { name: "More" }).click();
  }
  // Exact, since the Household page's cards have an "Edit <name>" button too.
  await page.getByRole("button", { name: visitor.name, exact: true }).click();
  await expect(page.getByText(`Signed in as ${visitor.name}`)).toBeVisible();
  await expect(page.getByText(visitor.email, { exact: true })).toBeVisible();
  // The role depends on the visitor: Community, or Team once platform's hook moves a parent on a team.
  await expect(page.getByText(/^Role: \w+$/)).toBeVisible();
  await expect(page.getByRole("menuitemradio", { name: "Dark" })).toBeVisible();
});
