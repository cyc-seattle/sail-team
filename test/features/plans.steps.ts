import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import type { Club } from "./club";
import { app, opened, test } from "./fixtures";

// Steps for features/plans.feature, against dev, with a made-up organization's Financial Plans (./club.ts).

const { Given, When, Then } = createBdd(test);

const OFFERING = "Beginner camp, week 1";
// Ten weekdays of camp, from the Monday after the Fourth.
const campDays = (club: Club) =>
  ["05", "06", "07", "08", "09", "12", "13", "14", "15", "16"].map((d) => `${club.year}-07-${d}`);

/** The Financial Plans a scenario made, by name. */
const named = new Map<string, string>();

/** A Financial Plan holding a copy of the Operations Plan and of Youth Racing's plan, and those copies. */
async function plansWithCopies(club: Club): Promise<{ operations: string; youth: string }> {
  await club.setUp();
  return { operations: await club.copy(club.operationsPlan!), youth: await club.copy(club.areaPlan!) };
}

/** A saved Financial Plan named `name`, whose Youth Racing camp takes in $10,000 and spends `costs`. */
async function savedBudget(club: Club, name: string, note: string | null = null, costs = 500_000): Promise<string> {
  const { operations, youth } = await plansWithCopies(club);
  await club.offering(youth, OFFERING, 10, 100_000, costs);
  const set = await club.financialPlan(name, [operations, youth]);
  await club.save(set, note);
  named.set(name, set);
  return set;
}

/** The section of the plans page for the run's year. */
const year = (page: Page, club: Club) => page.getByRole("region", { name: String(club.year) });
const card = (page: Page, club: Club, name: string) =>
  year(page, club).getByRole("link", { name: new RegExp(`^${name}`) });

// Plans lists each year's Financial Plans.
Given(
  "a saved Financial Plan for 2027 named {string}, noted {string}",
  async ({ club }, name: string, note: string) => {
    named.clear();
    club.ownYear();
    await savedBudget(club, name, note);
  },
);

Given("a later one started from it named {string}, noted {string}", async ({ club }, name: string, note: string) => {
  const { set } = await club.startFrom([...named.values()][0]!, name);
  await club.save(set, note);
  named.set(name, set);
});

Then("under 2027 I see {string}, then {string}", async ({ page, club }, first: string, second: string) => {
  const names = year(page, club).getByRole("listitem");
  await expect(names).toHaveCount(2);
  await expect(names.nth(0)).toContainText(first);
  await expect(names.nth(1)).toContainText(second);
});

Then("each shows its note, the day it was saved, and the one it was started from", async ({ page, club }) => {
  await expect(card(page, club, "Adopted budget")).toContainText("Adopted by the board");
  await expect(card(page, club, "Adopted budget")).toContainText(/Saved \w+ \d+, \d{4}/);
  await expect(card(page, club, "Adopted budget")).toContainText("Started from Budget");
  await expect(card(page, club, "Budget")).toContainText("Reviewed with the board");
});

Given("a saved Financial Plan for 2027 with an operating net of $5,000", async ({ club }) => {
  named.clear();
  club.ownYear();
  await savedBudget(club, "Budget");
});

Then("the Financial Plan shows an operating net of $5,000", async ({ page, club }) => {
  await expect(card(page, club, "Budget")).toContainText("Operating net $5,000.00");
});

Given("a saved Financial Plan for 2027 named {string}", async ({ club }, name: string) => {
  named.clear();
  club.ownYear();
  await savedBudget(club, name);
});

Given("two drafts started from it, named {string} and {string}", async ({ club }, first: string, second: string) => {
  const parent = [...named.values()][0]!;
  for (const name of [first, second]) {
    named.set(name, (await club.startFrom(parent, name)).set);
  }
});

Then(
  "under 2027 I see {string} and {string}, each marked as a draft, and {string}",
  async ({ page, club }, first: string, second: string, saved: string) => {
    for (const name of [first, second]) {
      await expect(card(page, club, name)).toContainText("Draft");
    }
    await expect(card(page, club, saved)).toContainText("Saved");
  },
);

// Comparing two options.
Given(
  "two drafts started from the same Financial Plan: {string}, with an operating net of $4,000, and {string}, with an operating net of $2,000",
  async ({ club }, first: string, second: string) => {
    named.clear();
    const parent = await savedBudget(club, "Budget");
    for (const [name, costs] of [
      [first, 600_000],
      [second, 800_000],
    ] as const) {
      const { set, copies } = await club.startFrom(parent, name);
      await club.setLine(copies.get(club.areaPlan!)!, `${OFFERING} costs`, costs);
      named.set(name, set);
    }
  },
);

When("I compare {string} with {string}", async ({ page }, first: string, second: string) => {
  await page.goto(`${await app()}/plans/compare/${named.get(first)}/${named.get(second)}`);
});

Then("I see each one's operating net side by side, $4,000 and $2,000", async ({ page }) => {
  const row = page.getByRole("row", { name: /Operating net/ });
  await expect(row).toContainText("$4,000.00");
  await expect(row).toContainText("$2,000.00");
});

Then("I see that {string} nets $2,000 more", async ({ page }, name: string) => {
  await expect(page.getByText(new RegExp(`${name} nets`))).toContainText("$2,000.00 more");
});

// A Financial Plan's page.
Given(
  "a saved Financial Plan with an Operations Plan, and Program Plans for Youth Racing and Adult Sailing",
  async ({ club }) => {
    named.clear();
    const { operations, youth } = await plansWithCopies(club);
    await club.offering(youth, OFFERING, 10, 100_000, 500_000);
    const adult = await club.copy(await club.anotherArea("Adult Sailing"));
    const budget = await club.financialPlan("Budget", [operations, youth, adult]);
    await club.save(budget);
    const { set } = await club.startFrom(budget, "Adopted budget");
    await club.save(set);
    opened.set = set;
  },
);

When("I open that Financial Plan", async ({ page }) => {
  await page.goto(`${await app()}/plans/financial/${opened.set}`);
});

Then("I see the organization's operating net, fundraising, capital, and total", async ({ page }) => {
  for (const tile of ["Operating net", "Fundraising net", "Capital", "Total"]) {
    await expect(page.getByText(tile, { exact: true })).toBeVisible();
  }
});

Then("I see its Operations Plan and both Program Plans, each with its net", async ({ page, club }) => {
  for (const name of ["Operations Plan", club.area, `Adult Sailing ${club.run}`]) {
    await expect(page.getByRole("link", { name: new RegExp(name) })).toContainText("Net");
  }
});

Then("I see the Financial Plan it was started from", async ({ page }) => {
  await expect(page.getByText(/started from Budget/)).toBeVisible();
});

// A Program Plan's full P&L.
/** A Financial Plan whose camp pays a coach $30 an hour for 100 hours, and shares $1,000 of office costs. */
async function coachedCamp(club: Club): Promise<string> {
  const { operations, youth } = await plansWithCopies(club);
  const level = await club.coachRate(operations, 3_000);
  await club.office(operations, 100_000);
  const camp = await club.offering(youth, OFFERING, 10, 100_000, 0, { coach_level_key: level, min_coaches: 1 });
  await club.practices(youth, camp["id"] as string, campDays(club), "08:00:00", "18:00:00");
  return club.financialPlan("Budget", [operations, youth]);
}

Given(
  "a saved Financial Plan whose Youth Racing offering took in $10,000, paid $3,000 of coaches' wages, and paid $1,000 of shared costs",
  async ({ club }) => {
    opened.set = await coachedCamp(club);
    await club.save(opened.set);
  },
);

Given(
  "a draft Financial Plan whose Operations Plan pays coaches $30 an hour and has $1,000 of office costs",
  async ({ club }) => {
    opened.set = await coachedCamp(club);
  },
);

Given("its only Program Plan has an offering with 100 hours of coaching", async () => {
  // Ten days of camp from 8am to 6pm, with one coach, made with the Financial Plan above.
});

When(
  /^I open (?:Youth Racing's plan in (?:that Financial Plan|the draft)|the Program Plan in the draft|the offering's Program Plan in that Financial Plan|the draft)$/,
  async ({ page, club }) => {
    await page.goto(`${await app()}/plans/financial/${opened.set}/${club.areaPlan}`);
  },
);

When("I open Youth Racing's plan in {string}", async ({ page, club }, name: string) => {
  await page.goto(`${await app()}/plans/financial/${named.get(name)}/${club.areaPlan}`);
});

const lineRow = (page: Page, name: RegExp) =>
  page.getByRole("region", { name: "Revenue and costs" }).getByRole("row", { name });

Then("the offering shows $10,000 in, $3,000 of coaches' wages, and $1,000 of shared costs", async ({ page }) => {
  await expect(lineRow(page, /^Total revenue/)).toContainText("$10,000");
  await expect(lineRow(page, /Coach wages/).first()).toContainText("$3,000");
  await expect(lineRow(page, /Office share/).first()).toContainText("$1,000");
});

Then("the offering pays $3,000 of coaches' wages", async ({ page }) => {
  await expect(lineRow(page, /Coach wages/).first()).toContainText("$3,000");
});

Then("it pays the $1,000 of office costs", async ({ page }) => {
  await expect(lineRow(page, /Office share/).first()).toContainText("$1,000");
});

// A saved Financial Plan keeps its P&L.
Given(
  "a saved Financial Plan named {string} whose Youth Racing offering paid $1,000 of office costs",
  async ({ club }, name: string) => {
    named.clear();
    const { operations, youth } = await plansWithCopies(club);
    await club.office(operations, 100_000);
    await club.offering(youth, OFFERING, 10, 100_000, 500_000);
    const set = await club.financialPlan(name, [operations, youth]);
    await club.save(set);
    named.set(name, set);
  },
);

Given("a Financial Plan started from {string} with $2,000 of office costs", async ({ club }, name: string) => {
  const { set, copies } = await club.startFrom(named.get(name)!, `After ${name}`);
  await club.setLine(copies.get(club.operationsPlan!)!, "Office rent", 200_000);
  await club.save(set);
});

Then("its offering shows $1,000 of office costs", async ({ page }) => {
  await expect(lineRow(page, /Office share/).first()).toContainText("$1,000");
});

Then("the page says when {string} was saved", async ({ page }, name: string) => {
  // Who saved it shows only to someone who can see other users, which a Plan Reader can't.
  await expect(page.getByText(new RegExp(`${name} was saved with, on \\w+ \\d+, \\d{4}`))).toBeVisible();
});

// A draft's P&L.
Given(
  "a draft Financial Plan whose Youth Racing plan has one offering of 10 sailors at $1,000 each",
  async ({ club }) => {
    const { operations, youth } = await plansWithCopies(club);
    await club.offering(youth, OFFERING, 10, 100_000);
    opened.set = await club.financialPlan("Two coaches", [operations, youth]);
  },
);

const offeringRow = (page: Page) =>
  page.getByRole("region", { name: "Offerings" }).getByRole("row", { name: new RegExp(OFFERING) });

Then("its assumptions show the offering's 10 sailors at $1,000 each", async ({ page }) => {
  const row = page.getByRole("region", { name: "Assumptions" }).getByRole("row", { name: new RegExp(OFFERING) });
  await expect(row).toContainText("$1,000");
  await expect(row).toContainText("10");
});

Then("its offering takes in $10,000", async ({ page }) => {
  await expect(offeringRow(page).first()).toContainText("$10,000");
});

Then("the page says the draft's numbers are calculated now, and will change as the plan does", async ({ page }) => {
  await expect(page.getByText(/calculated now.*change as planners change the plan/)).toBeVisible();
});

// An offering's P&L, three ways.
Given(
  "a saved Financial Plan whose offering takes in $10,000 and spends $6,000 over 10 days, for 10 sailors",
  async ({ club }) => {
    const { operations, youth } = await plansWithCopies(club);
    const camp = await club.offering(youth, OFFERING, 10, 100_000, 600_000);
    await club.practices(youth, camp["id"] as string, campDays(club));
    opened.set = await club.financialPlan("Budget", [operations, youth]);
    await club.save(opened.set);
  },
);

Then("the offering's net is $4,000", async ({ page }) => {
  await expect(offeringRow(page).first()).toContainText("$4,000");
});

Then("its net per day is $400", async ({ page }) => {
  await page.getByRole("button", { name: "Per day" }).first().click();
  await expect(offeringRow(page).first()).toContainText("$400.00");
});

Then("its net per sailor-day is $40", async ({ page }) => {
  await page.getByRole("button", { name: "Per sailor-day" }).first().click();
  await expect(offeringRow(page).first()).toContainText("$40.00");
});

Then("it's still per sailor-day when I come back to the page", async ({ page }) => {
  await page.reload();
  await expect(page.getByRole("button", { name: "Per sailor-day" })).toHaveAttribute("aria-pressed", "true");
  await expect(offeringRow(page).first()).toContainText("$40.00");
});

// Warnings.
Given("a draft with a practice on a closed day", async ({ club }) => {
  const { operations, youth } = await plansWithCopies(club);
  await club.closed(operations, campDays(club)[0]!, "the Fourth of July, observed");
  const camp = await club.offering(youth, OFFERING, 10, 100_000);
  await club.practices(youth, camp["id"] as string, [campDays(club)[0]!]);
  opened.set = await club.financialPlan("Two coaches", [operations, youth]);
});

Then("the page warns that the practice falls on a closed day, and names the day", async ({ page, club }) => {
  const warnings = page.getByRole("alert").filter({ hasText: /to check/ });
  await expect(warnings).toContainText(campDays(club)[0]!);
  await expect(warnings).toContainText(/closed/);
});

Then("no plan, version, or amount appears", async ({ page }) => {
  await expect(page.locator('a[href^="/plans/"]')).toHaveCount(0);
  await expect(page.getByText(/\$\d/)).toHaveCount(0);
});
