import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { PLAN_YEAR } from "./club";
import { app, opened, test } from "./fixtures";

// Steps for features/plans.feature, against dev, with a made-up club's plans (./club.ts).

const { Given, When, Then } = createBdd(test);

// Ten weekdays of camp, from the Monday after the Fourth.
const CAMP_DAYS = ["05", "06", "07", "08", "09", "12", "13", "14", "15", "16"].map((d) => `${PLAN_YEAR}-07-${d}`);
const OFFERING = "Beginner camp, week 1";

Given("the club has a 2027 plan for Youth Racing and a 2027 Operations Plan", async ({ club }) => {
  await club.plans();
});

Given("Youth Racing's 2027 plan has a draft and two saved versions, the older one active", async ({ club }) => {
  await club.plans();
  await club.save(club.operationsVersion!, "Operations, first pass");
  const older = await club.draft(club.areaPlan!);
  await club.offering(older, OFFERING, 10, 100_000);
  await club.save(older, "First pass");
  await club.activate(older);
  const newer = await club.draft(club.areaPlan!);
  await club.offering(newer, OFFERING, 10, 100_000);
  await club.save(newer, "Added a second week of camp");
  await club.draft(club.areaPlan!);
});

Given("a draft of Youth Racing's plan with one offering of 10 sailors at $1,000 each", async ({ club }) => {
  await club.plans();
  opened.version = await club.draft(club.areaPlan!);
  await club.offering(opened.version, OFFERING, 10, 100_000);
});

Given(
  "a saved version whose offering takes in $10,000 and spends $6,000 over 10 days, for 10 sailors",
  async ({ club }) => {
    await club.plans();
    await club.save(club.operationsVersion!, "Operations, first pass");
    opened.version = await club.draft(club.areaPlan!);
    const offering = await club.offering(opened.version, OFFERING, 10, 100_000, 600_000);
    await club.practices(opened.version, offering, CAMP_DAYS);
    await club.save(opened.version, "Ten days of camp");
  },
);

Given("a draft with a practice on a closed day", async ({ club }) => {
  await club.plans();
  await club.closed(CAMP_DAYS[0]!, "the Fourth of July, observed");
  await club.save(club.operationsVersion!, "Operations, with the club's closed days");
  opened.version = await club.draft(club.areaPlan!, club.operationsVersion);
  const offering = await club.offering(opened.version, OFFERING, 10, 100_000);
  await club.practices(opened.version, offering, [CAMP_DAYS[0]!]);
});

When("I open Youth Racing's 2027 plan", async ({ page, club }) => {
  await page.goto(`${await app()}/plans/${club.areaPlan}`);
});

When(/^I open (?:the draft|that version|that saved version)$/, async ({ page, club }) => {
  await page.goto(`${await app()}/plans/${club.areaPlan}/${opened.version}`);
});

Then("I see both plans under 2027", async ({ page, club }) => {
  const year = page.getByRole("region", { name: String(PLAN_YEAR) });
  await expect(year.getByRole("link", { name: new RegExp(club.areaPlanName) })).toBeVisible();
  await expect(year.getByRole("link", { name: new RegExp(club.operationsPlanName) })).toBeVisible();
});

Then('each plan shows its program area, or "Operations Plan"', async ({ page, club }) => {
  await expect(page.getByRole("link", { name: new RegExp(club.areaPlanName) })).toContainText(club.area);
  await expect(page.getByRole("link", { name: new RegExp(club.operationsPlanName) })).toContainText("Operations Plan");
});

Then("I see the draft, then the newer saved version, then the older one", async ({ page }) => {
  const versions = page.getByRole("main").getByRole("listitem");
  await expect(versions).toHaveCount(3);
  await expect(versions.nth(0)).toContainText("Draft");
  await expect(versions.nth(1)).toContainText("Added a second week of camp");
  await expect(versions.nth(2)).toContainText("First pass");
});

Then("the older saved version is marked active", async ({ page }) => {
  const versions = page.getByRole("main").getByRole("listitem");
  await expect(versions.nth(2)).toContainText("Active");
  await expect(versions.nth(1)).not.toContainText("Active");
});

const offeringRow = (page: import("@playwright/test").Page) => page.getByRole("row", { name: new RegExp(OFFERING) });

Then("its offering takes in $10,000", async ({ page }) => {
  await expect(offeringRow(page).first()).toContainText("$10,000.00");
});

Then("the page says the draft's numbers are calculated now, and will change as the plan does", async ({ page }) => {
  await expect(page.getByText(/calculated now.*change as planners change the plan/)).toBeVisible();
});

Then("the offering's net is $4,000", async ({ page }) => {
  await expect(offeringRow(page).first()).toContainText("$4,000.00");
});

Then("its net per day is $400", async ({ page }) => {
  await page.getByRole("button", { name: "Per day" }).first().click();
  await expect(offeringRow(page).first()).toContainText("$400.00");
});

Then("its net per sailor-day is $40", async ({ page }) => {
  await page.getByRole("button", { name: "Per sailor-day" }).first().click();
  await expect(offeringRow(page).first()).toContainText("$40.00");
});

Then("the page warns that the practice falls on a closed day, and names the day", async ({ page }) => {
  const warnings = page.getByRole("alert").filter({ hasText: /to check/ });
  await expect(warnings).toContainText(CAMP_DAYS[0]!);
  await expect(warnings).toContainText(/closed/);
});

Then("no plan, version, or amount appears", async ({ page }) => {
  await expect(page.locator('a[href^="/plans/"]')).toHaveCount(0);
  await expect(page.getByText(/\$\d/)).toHaveCount(0);
});
