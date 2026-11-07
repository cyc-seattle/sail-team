import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { app, opened, test } from "./fixtures";

// Steps for features/financial-models.feature, against dev, with a made-up club's plans (./club.ts).

const { Given, When, Then } = createBdd(test);

const OFFERING = "Beginner camp, week 1";

/** The financial model a scenario opens. */
let financialModel: string | undefined;

/** The club's Operations Plan and Youth Racing's plan, each with a saved version made active, then a financial model. */
async function savedFinancialModel(club: import("./club").Club, revenue: number, costs: number): Promise<string> {
  await club.plans();
  await club.save(club.operationsVersion!, "Operations, first pass");
  await club.activate(club.operationsVersion!);
  const version = await club.draft(club.areaPlan!);
  await club.offering(version, OFFERING, 10, revenue / 10, costs);
  await club.save(version, "First pass");
  await club.activate(version);
  financialModel = await club.saveFinancialModel(`March ${club.run}`);
  return version;
}

Given("the financial model for the year was saved today, with an operating net of $5,000", async ({ club }) => {
  club.ownYear();
  await savedFinancialModel(club, 500_000, 0);
});

Given("there are plans for the year, but no financial model for it", async ({ club }) => {
  club.ownYear();
  await club.plans();
});

Then("the year shows its financial model, saved today", async ({ page, club }) => {
  const year = page.getByRole("region", { name: String(club.year) });
  const today = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles",
  }).format(new Date());
  await expect(year.getByRole("link", { name: new RegExp(`Financial model: March ${club.run}`) })).toContainText(
    `Saved ${today}`,
  );
});

Then("the financial model's operating net is $5,000", async ({ page, club }) => {
  const year = page.getByRole("region", { name: String(club.year) });
  await expect(year.getByRole("link", { name: /Financial model:/ })).toContainText("Operating net $5,000.00");
});

Then("the year says it has no financial model yet", async ({ page, club }) => {
  const year = page.getByRole("region", { name: String(club.year) });
  await expect(year).toContainText(`There's no financial model for ${club.year} yet.`);
  await expect(year.getByRole("link", { name: /Financial model:/ })).toHaveCount(0);
});

Given("a saved financial model whose Youth Racing offering took in $10,000 and spent $6,000", async ({ club }) => {
  await savedFinancialModel(club, 1_000_000, 600_000);
});

Given("a saved financial model, then a newer Youth Racing version made active", async ({ club }) => {
  await savedFinancialModel(club, 1_000_000, 600_000);
  const newer = await club.draft(club.areaPlan!);
  await club.offering(newer, OFFERING, 12, 100_000);
  await club.save(newer, "A bigger camp");
  await club.activate(newer);
});

Given("a saved Youth Racing version that the newest financial model holds", async ({ club }) => {
  opened.version = await savedFinancialModel(club, 1_000_000, 600_000);
});

Given("a saved financial model for 2027", async ({ club }) => {
  await savedFinancialModel(club, 1_000_000, 600_000);
});

When("I open that financial model", async ({ page }) => {
  await page.goto(`${await app()}/plans/model/${financialModel}`);
});

Then("Youth Racing's offering shows $10,000 in and $6,000 out", async ({ page, club }) => {
  const area = page.getByRole("region", { name: club.area });
  const row = area.getByRole("row", { name: new RegExp(OFFERING) });
  await expect(row).toContainText("$10,000.00");
  await expect(row).toContainText("$6,000.00");
});

Then("the page says these are the numbers the financial model was saved with", async ({ page }) => {
  await expect(page.getByText(/numbers the financial model was saved with/)).toBeVisible();
});

Then("the page says Youth Racing has moved on since the financial model was saved", async ({ page, club }) => {
  await expect(
    page.getByText(new RegExp(`Since this financial model was saved, ${club.area} has moved on`)),
  ).toBeVisible();
});

Then("it offers the financial model as it stands now, calculated now", async ({ page }) => {
  await page.getByRole("link", { name: "See the financial model as it stands now" }).click();
  await expect(page.getByText(/These numbers are calculated now/)).toBeVisible();
});

Then("the page shows the version's own P&L, as the financial model stood when it was saved", async ({ page }) => {
  await expect(page.getByText(/as the financial model stood then/)).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(OFFERING) }).first()).toContainText("$10,000.00");
});

Then("it shows the version's P&L in the financial model that holds it", async ({ page, club }) => {
  const section = page.getByRole("region", { name: new RegExp(`In the financial model March ${club.run}`) });
  await expect(section.getByRole("row", { name: new RegExp(OFFERING) })).toContainText("$4,000.00");
});

Then("no financial model or amount appears", async ({ page }) => {
  await expect(page.getByText(/Financial model:/)).toHaveCount(0);
  await expect(page.getByText(/\$\d/)).toHaveCount(0);
});
