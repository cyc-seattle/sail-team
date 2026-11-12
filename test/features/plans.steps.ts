import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import type { Club } from "./club";
import { app, opened, test } from "./fixtures";
import { asAdmin } from "./support";

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

/** Planning's row for a Financial Plan. */
const planRow = (page: Page, name: string) =>
  page
    .getByRole("table", { name: "Financial Plans" })
    .getByRole("row")
    .filter({ has: page.getByRole("link", { name, exact: true }) });

/** Opens Planning on the run's own year, which other runs' plans don't share. */
async function openPlanning(page: Page, club: Club): Promise<void> {
  await page.goto(`${await app()}/plans`);
  await page.getByRole("combobox", { name: "Year" }).click();
  await page.getByRole("option", { name: String(club.year), exact: true }).click();
}

/** A plan's details on Planning: when it was saved, what it started from, and its note. */
async function details(page: Page, name: string) {
  await page.getByRole("button", { name: `About ${name}` }).click();
  return page.getByRole("dialog", { name: `About ${name}` });
}

// Planning lists every Financial Plan.
Given(
  "a saved Financial Plan for 2027 named {string}, noted {string}",
  async ({ club }, name: string, note: string) => {
    named.clear();
    club.ownYear();
    await savedBudget(club, name, note);
  },
);

Given("a draft started from it named {string}", async ({ club }, name: string) => {
  const { set } = await club.startFrom([...named.values()][0]!, name);
  named.set(name, set);
});

When("I open Planning for 2027", async ({ page, club }) => {
  await openPlanning(page, club);
});

Then(
  "I see {string}, marked saved, and {string}, marked as a draft",
  async ({ page }, saved: string, draft: string) => {
    await expect(planRow(page, saved)).toContainText("Saved");
    await expect(planRow(page, draft)).toContainText("Draft");
  },
);

Then("{string} shows its note and the day it was saved", async ({ page }, name: string) => {
  const about = await details(page, name);
  await expect(about).toContainText("Reviewed with the board");
  await expect(about).toContainText(/Saved \w+ \d+, \d{4}/);
});

Then("{string} shows it was started from {string}", async ({ page }, name: string, parent: string) => {
  const about = await details(page, name);
  await expect(about).toContainText(`Started from ${parent}`);
  await expect(about.getByRole("link", { name: parent, exact: true })).toHaveAttribute(
    "href",
    new RegExp(`/plans/financial/${named.get(parent)}$`),
  );
});

Given("a saved Financial Plan for 2027 whose camp takes in $10,000 and spends $5,000 running it", async ({ club }) => {
  named.clear();
  club.ownYear();
  await savedBudget(club, "Budget");
});

Then("{string} shows revenue of $10,000, expenses of $5,000, and net of $5,000", async ({ page }, name: string) => {
  const cells = planRow(page, name).getByRole("cell");
  await expect(cells.nth(3)).toHaveText("$10,000");
  await expect(cells.nth(4)).toHaveText("$5,000");
  await expect(cells.nth(5)).toHaveText("$5,000");
});

Given("a saved Financial Plan for 2027 named {string}", async ({ club }, name: string) => {
  named.clear();
  club.ownYear();
  await savedBudget(club, name);
});

// A Financial Plan's Overview.
Given(
  "a saved Financial Plan with an Operations Plan, and Program Plans for Youth Racing and Adult Sailing",
  async ({ club }) => {
    named.clear();
    const { operations, youth } = await plansWithCopies(club);
    await club.offering(youth, OFFERING, 10, 100_000, 500_000);
    const adult = await club.copy(await club.anotherArea("Adult Sailing"));
    opened.set = await club.financialPlan("Budget", [operations, youth, adult]);
    await club.save(opened.set);
  },
);

When("I open that Financial Plan", async ({ page }) => {
  await page.goto(`${await app()}/plans/financial/${opened.set}`);
});

const overview = (page: Page) => page.getByRole("table", { name: "Revenue and expenses" });

Then("its Overview has a row for Youth Racing, Adult Sailing, Non-program, and the total", async ({ page, club }) => {
  for (const name of [club.area, `Adult Sailing ${club.run}`, "Non-program", "Total"]) {
    await expect(overview(page).getByRole("row", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
});

Then("Youth Racing's row shows revenue of $10,000 and net of $5,000", async ({ page, club }) => {
  const cells = overview(page)
    .getByRole("row", { name: new RegExp(`^${club.area}`) })
    .getByRole("cell");
  await expect(cells.nth(1)).toHaveText("$10,000");
  await expect(cells.nth(5)).toHaveText("$5,000");
});

Then(
  "I can switch to Assumptions, Youth Racing, Adult Sailing, Non-program, and Fundraising and capital",
  async ({ page, club }) => {
    const reports = page.getByRole("navigation", { name: "Reports" });
    for (const name of [
      "Assumptions",
      club.area,
      `Adult Sailing ${club.run}`,
      "Non-program",
      "Fundraising and capital",
    ]) {
      await expect(reports.getByRole("link", { name, exact: true })).toBeVisible();
    }
  },
);

// A program area's report.
/** A Financial Plan whose camp has a coach at $30 an hour on ten 10-hour practices, and shares $1,000 of office costs. */
async function coachedCamp(club: Club): Promise<string> {
  const { operations, youth } = await plansWithCopies(club);
  const level = await club.coachRate(operations, 3_000);
  await club.office(operations, 100_000);
  const camp = await club.offering(youth, OFFERING, 10, 100_000);
  await club.practices(youth, camp["id"] as string, campDays(club), "08:00:00", "18:00:00", level);
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

Given("its only Program Plan has an offering with a coach on every practice, 100 hours in all", async () => {
  // Ten days of camp from 8am to 6pm, each in a block with one coach, made with the Financial Plan above.
});

When(/^I open Youth Racing's report in (?:that Financial Plan|the draft)$/, async ({ page, club }) => {
  await page.goto(`${await app()}/plans/financial/${opened.set}/${club.areaPlan}`);
});

When("I open Youth Racing's report in {string}", async ({ page, club }, name: string) => {
  await page.goto(`${await app()}/plans/financial/${named.get(name)}/${club.areaPlan}`);
});

const statementRow = (page: Page, name: RegExp) =>
  page.getByRole("table", { name: "Revenue and expenses" }).getByRole("row", { name });

Then("it shows $10,000 of revenue, $3,000 of coaches' wages, and $1,000 of the office", async ({ page }) => {
  await expect(statementRow(page, /Total revenue/)).toContainText("$10,000");
  await expect(statementRow(page, /coachWages/)).toContainText("$3,000");
  await expect(statementRow(page, /^Office/)).toContainText("$1,000");
});

// The engine's wording may change, so this checks only that a line under the account explains it with a formula.
Then("opening the coaches' wages shows how they were worked out", async ({ page }) => {
  const wages = statementRow(page, /coachWages/);
  await wages.getByRole("button").click();
  const line = page
    .getByRole("table", { name: "Revenue and expenses" })
    .getByRole("row")
    .filter({ has: page.getByText("×") });
  await expect(line.first()).toContainText("$3,000");
});

Then("it shows $3,000 of coaches' wages", async ({ page }) => {
  await expect(statementRow(page, /coachWages/)).toContainText("$3,000");
});

Then("it shows the $1,000 of the office", async ({ page }) => {
  await expect(statementRow(page, /^Office/)).toContainText("$1,000");
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

// A draft's P&L.
/** The draft's offering and copies, for a planner's AI to change. */
let draft: { offering: string; operations: string; youth: string } | undefined;

Given(
  "a draft Financial Plan whose Youth Racing plan has one offering of 10 sailors at $1,000 each",
  async ({ club }) => {
    const { operations, youth } = await plansWithCopies(club);
    draft = { offering: (await club.offering(youth, OFFERING, 10, 100_000))["id"] as string, operations, youth };
    opened.set = await club.financialPlan("Two coaches", [operations, youth]);
  },
);

When("a planner's AI raises the offering's price to $1,200", async ({ page }) => {
  await expect(statementRow(page, /Total revenue/)).toContainText("$10,000");
  // Over Directus's items API, as an AI over MCP changes it.
  await asAdmin("PATCH", `/items/plan_offerings/${draft!.offering}`, { price_cents: 120_000 });
});

Then("it shows $12,000 of revenue, without my reloading the page", async ({ page }) => {
  await expect(statementRow(page, /Total revenue/)).toContainText("$12,000");
});

// A program area's settings, rules and offerings.
Given(
  "its program is led by a Lead coach, at {int} sailors per coach, with the rule {string}",
  async ({ club }, sailors: number, rule: string) => {
    const level = await club.coachRate(draft!.operations, 3_000, "Lead coach");
    await club.program(draft!.youth, level, sailors, rule);
  },
);

Given(
  "it practices each weekday morning for two weeks with a Lead coach, but the last day has no coach yet",
  async ({ club }) => {
    const level = await club.coachRate(draft!.operations, 3_000, "Lead coach");
    const days = campDays(club);
    await club.practices(draft!.youth, draft!.offering, days.slice(0, -1), "09:00:00", "12:00:00", level);
    await club.practices(draft!.youth, draft!.offering, days.slice(-1), "09:00:00", "12:00:00");
  },
);

When("I open its schedule", async ({ page }) => {
  await page.locator("summary", { hasText: "Schedule" }).click();
});

When("I open the week of Jul 12", async ({ page }) => {
  await page.getByRole("button", { name: "Jul 12" }).click();
});

When("I open its practices", async ({ page }) => {
  await page.getByRole("table", { name: "Week of Jul 12" }).getByRole("button", { name: "Practice" }).click();
});

Then("they have 1 Lead coach, except Jul 16, which has no staff, coach boats or boats yet", async ({ page }) => {
  const block = page.getByRole("region", { name: /^Practice ·/ });
  await expect(block).toContainText("1 Lead coach");
  await expect(block.getByRole("list", { name: "How it differs" })).toContainText(
    "16: no staff, coach boats or boats yet",
  );
});

Then("each week shows the offering's 10 sailors", async ({ page }) => {
  const weeks = page.getByRole("table", { name: "Weeks" });
  // The second week's Jul 16 differs, which its cell also says.
  await expect(weeks.getByRole("cell", { name: /^10 \/ 10/ })).toHaveCount(2);
});

Then("its offering shows a fee of $1,000 and 10 sailors", async ({ page, club }) => {
  // Its row, numbered within its program, not the program's own row above it.
  const cells = page
    .getByRole("table", { name: "Offerings" })
    .getByRole("row", { name: new RegExp(`Beginner camp ${club.run} 1`) })
    .getByRole("cell");
  await expect(cells.nth(1)).toHaveText("$1,000");
  await expect(cells.nth(3)).toHaveText("10");
});

Then(
  "its assumptions show the program's Lead coach, {int} sailors per coach, and the rule {string}",
  async ({ page }, sailors: number, rule: string) => {
    await page.locator("summary", { hasText: "Assumptions" }).click();
    const program = page.getByRole("region", { name: /Beginner camp/ });
    await expect(program).toContainText("Lead coach");
    await expect(program).toContainText(String(sailors));
    await expect(program.getByRole("listitem")).toHaveText(rule);
  },
);

// Assumptions.
Given("the Operations Plan's rule {string}", async ({ club }, rule: string) => {
  const members: { version_id: string; plan_id: string }[] = await asAdmin(
    "GET",
    `/items/version_set_members?filter[version_set_id][_eq]=${opened.set}&fields=version_id,plan_id`,
  );
  await club.rules(members.find((m) => m.plan_id === club.operationsPlan)!.version_id, rule);
});

When("I open the draft's Assumptions", async ({ page }) => {
  await page.goto(`${await app()}/plans/financial/${opened.set}/rates`);
});

Then("I see the rule {string}", async ({ page }, rule: string) => {
  await expect(page.getByRole("list", { name: "Rules" }).getByRole("listitem")).toHaveText(rule);
});

Then("I see the coach's pay of $30.00 an hour", async ({ page, club }) => {
  await expect(
    page.getByRole("table", { name: "Staff levels" }).getByRole("row", { name: new RegExp(`Coach ${club.run}`) }),
  ).toContainText("$30.00");
});

// Warnings. A warning is found by the closed day's name, which the test sets, so platform can reword the rest.
const CLOSED_DAY = "the Fourth of July, observed";
Given("a draft with a practice on a closed day", async ({ club }) => {
  const { operations, youth } = await plansWithCopies(club);
  await club.closed(operations, campDays(club)[0]!, CLOSED_DAY);
  const camp = await club.offering(youth, OFFERING, 10, 100_000);
  await club.practices(youth, camp["id"] as string, [campDays(club)[0]!]);
  opened.set = await club.financialPlan("Two coaches", [operations, youth]);
});

When("I open the draft", async ({ page }) => {
  await page.goto(`${await app()}/plans/financial/${opened.set}`);
});

When("I open its warnings on a closed day", async ({ page }) => {
  await page.locator("summary", { hasText: /\d+ warnings?/ }).click();
  await page.locator("summary", { hasText: "On a closed day" }).click();
});

Then("a warning says the practice falls on a closed day, on that day", async ({ page }) => {
  const closed = page
    .getByRole("list", { name: "On a closed day" })
    .getByRole("listitem")
    .filter({ hasText: CLOSED_DAY });
  await expect(closed).toContainText("Jul 5");
});

Then("no plan, version, or amount appears", async ({ page }) => {
  await expect(page.locator('a[href^="/plans/"]')).toHaveCount(0);
  await expect(page.getByText(/\$\d/)).toHaveCount(0);
});

// Naming, noting, saving, deleting, and starting a draft.
Given("a draft Financial Plan named {string}", async ({ club }, name: string) => {
  named.clear();
  club.ownYear();
  const { operations, youth } = await plansWithCopies(club);
  named.set(name, await club.financialPlan(name, [operations, youth]));
});

When(/^I open "([^"]+)"$/, async ({ page }, name: string) => {
  await page.goto(`${await app()}/plans/financial/${named.get(name)}`);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
});

When("I rename it {string} and note it {string}", async ({ page }, name: string, note: string) => {
  await page.getByRole("button", { name: "Edit" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByLabel("Note").fill(note);
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
});

Then("the page is titled {string}", async ({ page }, name: string) => {
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
});

Then("Planning shows {string} with the note {string}", async ({ page, club }, name: string, note: string) => {
  await openPlanning(page, club);
  await expect(await details(page, name)).toContainText(note);
});

When("I open {string} and start a draft from it named {string}", async ({ page }, parent: string, name: string) => {
  await page.goto(`${await app()}/plans/financial/${named.get(parent)}`);
  await page.getByRole("button", { name: "Start a draft from this" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByRole("button", { name: "Start the draft" }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
});

Then("I'm on the draft {string}", async ({ page }, name: string) => {
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText("Draft", { exact: true })).toBeVisible();
});

Then("it holds the same plans as {string}", async ({ page, club }, parent: string) => {
  await expect(page).not.toHaveURL(new RegExp(named.get(parent)!));
  const reports = page.getByRole("navigation", { name: "Reports" });
  for (const name of ["Non-program", club.area]) {
    await expect(reports.getByRole("link", { name, exact: true })).toBeVisible();
  }
});

Then("I see no way to edit it or start a draft from it", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start a draft from this" })).toHaveCount(0);
});

Then("Planning has no actions for {string}", async ({ page, club }, name: string) => {
  await openPlanning(page, club);
  await expect(planRow(page, name)).toBeVisible();
  await expect(page.getByRole("button", { name: `Actions for ${name}` })).toHaveCount(0);
});

When("I save it", async ({ page }) => {
  await page.getByRole("button", { name: "Save" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
});

Then("it's marked saved", async ({ page }) => {
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
});

When("I delete {string}", async ({ page }, name: string) => {
  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog", { name: `Delete ${name}?` });
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
});

Then("Planning no longer lists {string}", async ({ page }, name: string) => {
  // By its address, since another run's draft may share its name.
  await expect(page.locator(`a[href$="/plans/financial/${named.get(name)}"]`)).toHaveCount(0);
});

When("I mark it active", async ({ page }) => {
  await page.getByRole("button", { name: "Mark active" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Mark active" }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
});

Then("it's marked active", async ({ page }) => {
  await expect(page.getByText("Active", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark active" })).toHaveCount(0);
});
