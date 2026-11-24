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

/** A draft Financial Plan named `name`, holding an Operations Plan and Youth Racing's plan. */
async function draftWithPlans(club: Club, name: string): Promise<{ set: string; operations: string; youth: string }> {
  await club.setUp();
  const set = await club.financialPlan(name);
  return { set, operations: await club.plan(set, null), youth: await club.plan(set, club.areaId!) };
}

/** A frozen Financial Plan named `name`, whose Youth Racing camp takes in $10,000 and spends `costs`. */
async function frozenBudget(club: Club, name: string, note: string | null = null, costs = 500_000): Promise<string> {
  const { set, youth } = await draftWithPlans(club, name);
  await club.offering(youth, OFFERING, 10, 100_000, costs);
  await club.freeze(set, note);
  named.set(name, set);
  return set;
}

/** A link to one of the scenario's Financial Plans, by its address, since another run's plan may share its name. */
const planLink = (page: Page, name: string) => page.locator(`a[href$="/plans/financial/${named.get(name)}"]`);

/** Planning's row for one of the scenario's Financial Plans. */
const planRow = (page: Page, name: string) =>
  page
    .getByRole("table", { name: "Financial Plans" })
    .getByRole("row")
    .filter({ has: planLink(page, name) });

async function openPlanning(page: Page): Promise<void> {
  await page.goto(`${await app()}/plans`);
  // Someone who can't read plans is told so instead of shown the list.
  const list = page.getByRole("table", { name: "Financial Plans" });
  const refused = page.getByRole("heading", { name: "You don't have access to plans" });
  await expect(list.or(refused)).toBeVisible({ timeout: 30_000 });
}

/** A plan's details on Planning: when it was frozen, what it started from, and its note. */
async function details(page: Page, name: string) {
  await planRow(page, name)
    .getByRole("button", { name: `About ${name}` })
    .click();
  return page.getByRole("dialog", { name: `About ${name}` });
}

// Planning lists every Financial Plan.
Given(
  "a frozen Financial Plan for 2027 named {string}, noted {string}",
  async ({ club }, name: string, note: string) => {
    named.clear();
    club.ownYear();
    await frozenBudget(club, name, note);
  },
);

Given("a draft started from it named {string}", async ({ club }, name: string) => {
  const { set } = await club.startFrom([...named.values()][0]!, name);
  named.set(name, set);
});

When("I open Planning", async ({ page }) => {
  await openPlanning(page);
});

Then("{string}'s note links {string} to {word}", async ({ page }, name: string, text: string, href: string) => {
  const about = await details(page, name);
  await expect(about.getByRole("link", { name: text, exact: true })).toHaveAttribute("href", href);
});

When("I turn off drafts", async ({ page }) => {
  await page.getByRole("switch", { name: "Show drafts" }).click();
});

Then("Planning lists {string}", async ({ page }, name: string) => {
  await expect(planLink(page, name)).toBeVisible();
});

Then(
  "I see {string}, marked frozen, and {string}, marked as a draft",
  async ({ page }, frozen: string, draft: string) => {
    await expect(planRow(page, frozen).getByRole("img", { name: "Frozen" })).toBeVisible();
    await expect(planRow(page, draft).getByRole("img", { name: "Draft" })).toBeVisible();
  },
);

Then("{string} shows its note and the day it was frozen", async ({ page }, name: string) => {
  const about = await details(page, name);
  await expect(about).toContainText("Reviewed with the board");
  await expect(about).toContainText(/Frozen \w+ \d+, \d{4}/);
});

Then("{string} shows it was started from {string}", async ({ page }, name: string, parent: string) => {
  const about = await details(page, name);
  await expect(about).toContainText(`Started from ${parent}`);
  await expect(about.getByRole("link", { name: parent, exact: true })).toHaveAttribute(
    "href",
    new RegExp(`/plans/financial/${named.get(parent)}$`),
  );
});

Given(
  "a frozen Financial Plan for 2027 whose camp takes in $10,000 and spends $5,000 running it, with $2,000 of donations",
  async ({ club }) => {
    named.clear();
    club.ownYear();
    const { set, operations, youth } = await draftWithPlans(club, "Budget");
    await club.offering(youth, OFFERING, 10, 100_000, 500_000);
    await club.donations(operations, 200_000);
    await club.freeze(set);
    named.set("Budget", set);
  },
);

Then("{string} shows revenue of $10,000, expenses of $5,000, and net of $5,000", async ({ page }, name: string) => {
  const cells = planRow(page, name).getByRole("cell");
  await expect(cells.nth(3)).toHaveText("$10,000");
  await expect(cells.nth(4)).toHaveText("$5,000");
  await expect(cells.nth(5)).toHaveText("$5,000");
});

Given("a frozen Financial Plan for 2027 named {string}", async ({ club }, name: string) => {
  named.clear();
  club.ownYear();
  await frozenBudget(club, name);
});

// A Financial Plan's Overview.
Given(
  "a frozen Financial Plan with an Operations Plan, and Program Plans for Youth Racing and Adult Sailing",
  async ({ club }) => {
    named.clear();
    const { set, youth } = await draftWithPlans(club, "Budget");
    await club.offering(youth, OFFERING, 10, 100_000, 500_000);
    await club.plan(set, await club.anotherArea("Adult Sailing"));
    opened.set = set;
    await club.freeze(opened.set);
  },
);

When(/^I open (?:that Financial Plan|the draft)$/, async ({ page }) => {
  await page.goto(`${await app()}/plans/financial/${opened.set}`);
});

const overview = (page: Page) => page.getByRole("table", { name: "Revenue and expenses" });

Then("its Overview has a row for Youth Racing, Adult Sailing, and all program areas", async ({ page, club }) => {
  for (const name of [club.area, `Adult Sailing ${club.run}`, "All program areas"]) {
    await expect(overview(page).getByRole("row", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await expect(overview(page)).not.toContainText("Non-program");
});

Then("Non-program has its own section", async ({ page }) => {
  await expect(page.getByRole("table", { name: "Non-program" })).toBeVisible();
});

Then("Youth Racing's row shows revenue of $10,000 and net of $5,000", async ({ page, club }) => {
  const cells = overview(page)
    .getByRole("row", { name: new RegExp(`^${club.area}`) })
    .getByRole("cell");
  await expect(cells.nth(1)).toHaveText("$10,000");
  await expect(cells.nth(5)).toHaveText("$5,000");
});

Then("I can switch to Assumptions, Youth Racing, Adult Sailing, and Non-program", async ({ page, club }) => {
  const reports = page.getByRole("navigation", { name: "Reports" });
  for (const name of ["Assumptions", club.area, `Adult Sailing ${club.run}`, "Non-program"]) {
    await expect(reports.getByRole("link", { name, exact: true })).toBeVisible();
  }
});

// A program area's report.
/** A Financial Plan whose camp has a coach at $30 an hour on ten 10-hour practices, and $1,000 of office costs. */
async function coachedCamp(club: Club): Promise<{ set: string; youth: string }> {
  const { set, operations, youth } = await draftWithPlans(club, "Budget");
  const level = await club.coachRate(operations, 3_000);
  await club.office(operations, 100_000);
  const camp = await club.offering(youth, OFFERING, 10, 100_000);
  await club.practices(youth, camp["id"] as string, campDays(club), "08:00:00", "18:00:00", level);
  return { set, youth };
}

/** The Youth Racing plan of the draft a scenario made with `coachedCamp`. */
let campPlan: string | undefined;

Given(
  "a frozen Financial Plan whose Youth Racing offering took in $10,000, paid $3,000 of coaches' wages, and pays 50% of them toward the office",
  async ({ club }) => {
    const { set, youth } = await coachedCamp(club);
    await club.indirectCostRate(youth, 0.5);
    opened.set = set;
    await club.freeze(opened.set);
  },
);

Given(
  "a draft Financial Plan whose Operations Plan pays coaches $30 an hour and has $1,000 of office costs",
  async ({ club }) => {
    ({ set: opened.set, youth: campPlan } = await coachedCamp(club));
  },
);

Given("its program pays 50% of its direct costs toward the shared costs", async ({ club }) => {
  await club.indirectCostRate(campPlan!, 0.5);
});

Given("its only Program Plan has an offering with a coach on every practice, 100 hours in all", async () => {
  // Ten days of camp from 8am to 6pm, each in a block with one coach, made with the Financial Plan above.
});

// A program area's P&L by term.
Given(
  "a frozen Financial Plan whose Youth Racing makes $20,000 in {string} and loses $5,000 in {string}",
  async ({ club }, summer: string, fall: string) => {
    const { set, operations, youth } = await draftWithPlans(club, "Budget");
    const inSummer = await club.term(operations, summer, "07-01", "08-31");
    const inFall = await club.term(operations, fall, "09-01", "11-30");
    await club.offering(youth, `${OFFERING} summer`, 1, 2_000_000, 0, { term_key: inSummer });
    await club.offering(youth, `${OFFERING} fall`, 1, 0, 500_000, { term_key: inFall });
    opened.set = set;
    await club.freeze(opened.set);
  },
);

Then(
  "{string} shows a net of $20,000, and {string} a net of −$5,000",
  async ({ page }, summer: string, fall: string) => {
    const terms = page.getByRole("table", { name: "Budget" });
    await expect(
      terms
        .getByRole("row", { name: new RegExp(`^${summer}`) })
        .getByRole("cell")
        .last(),
    ).toHaveText("$20,000");
    await expect(
      terms
        .getByRole("row", { name: new RegExp(`^${fall}`) })
        .getByRole("cell")
        .last(),
    ).toHaveText("−$5,000");
  },
);

Then("its program shows a net of $20,000 in {string}", async ({ page, club }, term: string) => {
  // The program's subtotal row comes right after its term's.
  const rows = page.getByRole("table", { name: "Budget" }).getByRole("row");
  const names = await rows.evaluateAll((all) => all.map((r) => r.querySelector("td")?.textContent ?? ""));
  const program = names.indexOf(`Beginner camp ${club.run}`, names.indexOf(term));
  await expect(rows.nth(program).getByRole("cell").last()).toHaveText("$20,000");
});

When(/^I open Youth Racing's report in (?:that Financial Plan|the draft)$/, async ({ page, club }) => {
  await page.goto(`${await app()}/plans/financial/${opened.set}/${club.areaId}`);
});

When("I open Youth Racing's report in {string}", async ({ page, club }, name: string) => {
  await page.goto(`${await app()}/plans/financial/${named.get(name)}/${club.areaId}`);
});

const statementRow = (page: Page, name: RegExp) =>
  page.getByRole("table", { name: "Revenue and expenses" }).getByRole("row", { name });

Then("it shows $10,000 of revenue, $3,000 of coaches' wages, and $1,500 of the office", async ({ page }) => {
  await expect(statementRow(page, /Total revenue/)).toContainText("$10,000");
  await expect(statementRow(page, /coachWages/)).toContainText("$3,000");
  await expect(statementRow(page, /^Office/)).toContainText("$1,500");
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

Then(/^it shows (\$[\d,]+) of the office$/, async ({ page }, amount: string) => {
  await expect(statementRow(page, /^Office/)).toContainText(amount);
});

// A frozen Financial Plan keeps its P&L.
Given(
  "a frozen Financial Plan named {string} whose Youth Racing offering spent $5,000 and paid 20% of it toward the office",
  async ({ club }, name: string) => {
    named.clear();
    const { set, operations, youth } = await draftWithPlans(club, name);
    await club.office(operations, 100_000);
    await club.offering(youth, OFFERING, 10, 100_000, 500_000);
    await club.indirectCostRate(youth, 0.2);
    await club.freeze(set);
    named.set(name, set);
  },
);

Given("a Financial Plan started from {string} whose program pays 40%", async ({ club }, name: string) => {
  const { set, plans } = await club.startFrom(named.get(name)!, `After ${name}`);
  await club.indirectCostRate(plans.get(club.areaId!)!, 0.4);
  await club.freeze(set);
});

// A draft's P&L.
/** The draft's offering and plans, for a planner's AI to change. */
let draft: { offering: string; operations: string; youth: string } | undefined;

Given(
  "a draft Financial Plan whose Youth Racing plan has one offering of 10 sailors at $1,000 each",
  async ({ club }) => {
    const { set, operations, youth } = await draftWithPlans(club, "Two coaches");
    draft = { offering: (await club.offering(youth, OFFERING, 10, 100_000))["id"] as string, operations, youth };
    opened.set = set;
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

// A program area's settings, notes and offerings.
Given(
  "its program is led by a Lead coach, at {int} sailors per coach, with the note {string}",
  async ({ club }, sailors: number, note: string) => {
    const level = await club.coachRate(draft!.operations, 3_000, "Lead coach");
    await club.program(draft!.youth, level, sailors, [note]);
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

Then("the calendar shows the offering's 10 sailors across both weeks", async ({ page }) => {
  await expect(page.getByRole("group", { name: "Year" })).toContainText("10 of 10");
});

/** How far down the page was when a day was chosen. */
let scrolled = 0;

When("I choose Fri, Jul 16 on the calendar", async ({ page }) => {
  await page.getByRole("button", { name: "Week of Jul 12" }).click();
  // With the days at the top of the window, the page is scrolled down, so a jump back to the top shows.
  await page.getByRole("group", { name: "Day" }).evaluate((el) => el.scrollIntoView({ block: "start" }));
  scrolled = await page.evaluate(() => window.scrollY);
  expect(scrolled).toBeGreaterThan(0);
  await page.getByRole("button", { name: /^Fri 16/ }).click();
  await expect(page).toHaveURL(/day=\d{4}-07-16/);
  await expect(page.getByRole("heading", { name: /^Friday, July 16/ })).toBeVisible();
});

Then("the page stays where it was", async ({ page }) => {
  expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
});

When("I open that day's practice", async ({ page }) => {
  await page.getByRole("button", { name: /different from the usual$/ }).click();
});

Then("it has no staff, coach boats or boats yet, where the other days have 1 Lead coach", async ({ page }) => {
  const block = page.getByRole("complementary", { name: "Activity block" });
  await expect(block).toContainText("No staff, coach boats or boats yet");
  await expect(block).toContainText("Usually 1 Lead coach");
});

Then("its offering's enrollment shows a target of 10 sailors, and its fees a fee of $1,000", async ({ page, club }) => {
  // Its row, named for its program and its session (with no program in its name, its own name), not the program's own row above it.
  const cells = (table: string) =>
    page
      .getByRole("table", { name: table, exact: true })
      .getByRole("row", { name: `Beginner camp ${club.run} ${OFFERING}` })
      .getByRole("cell");
  await expect(cells("Enrollment").nth(4)).toHaveText("10");
  await expect(cells("Fees").nth(1)).toHaveText("$1,000");
});

Then(
  "its assumptions show the program's Lead coach, {int} sailors per coach, and the note {string}",
  async ({ page }, sailors: number, note: string) => {
    await page.locator("summary", { hasText: "Assumptions" }).click();
    const program = page.getByRole("region", { name: /Beginner camp/ });
    await expect(program).toContainText("Lead coach");
    await expect(program).toContainText(String(sailors));
    await expect(program.getByRole("listitem")).toHaveText(note);
  },
);

// Assumptions.
Given("the Operations Plan's note {string}", async ({ club }, note: string) => {
  const [operations]: { id: string }[] = await asAdmin(
    "GET",
    `/items/plans?filter[financial_plan_id][_eq]=${opened.set}&filter[kind][_eq]=operations&fields=id`,
  );
  await club.notes(operations!.id, [note]);
});

// eslint-disable-next-line no-empty-pattern -- playwright-bdd reads a step's fixtures from this pattern.
Given("the Financial Plan's note {string}", async ({}, note: string) => {
  await asAdmin("PATCH", `/items/financial_plans/${opened.set}`, { note });
});

When("I open its notes", async ({ page }) => {
  await page.locator("summary", { hasText: "Notes" }).click();
});

Then("I see the Financial Plan's note {string}", async ({ page }, note: string) => {
  await expect(page.getByText(note, { exact: true })).toBeVisible();
});

When("I open the draft's Assumptions", async ({ page }) => {
  await page.goto(`${await app()}/plans/financial/${opened.set}/rates`);
});

Then("I see the note {string}", async ({ page }, note: string) => {
  await expect(page.getByRole("list", { name: "Notes" }).getByRole("listitem")).toHaveText(note);
});

Then("I see the coach's pay of $30.00 an hour", async ({ page, club }) => {
  await expect(
    page.getByRole("table", { name: "Staff levels" }).getByRole("row", { name: new RegExp(`Coach ${club.run}`) }),
  ).toContainText("$30.00");
});

// Warnings. A warning is found by the closed day's name, which the test sets, so platform can reword the rest.
const CLOSED_DAY = "the Fourth of July, observed";
Given("a draft with a practice on a closed day", async ({ club }) => {
  const { set, operations, youth } = await draftWithPlans(club, "Two coaches");
  await club.closed(operations, campDays(club)[0]!, CLOSED_DAY);
  const camp = await club.offering(youth, OFFERING, 10, 100_000);
  await club.practices(youth, camp["id"] as string, [campDays(club)[0]!]);
  opened.set = set;
});

const closedDayWarning = (page: Page) =>
  page.getByRole("table", { name: "Warnings" }).getByRole("row").filter({ hasText: CLOSED_DAY });

Then("a warning says the practice falls on a closed day, on that day", async ({ page }) => {
  await expect(closedDayWarning(page)).toContainText("On a closed day");
  await expect(closedDayWarning(page)).toContainText("Jul 5");
});

When("I open that day from the warning", async ({ page }) => {
  await closedDayWarning(page).getByRole("button", { name: /Jul 5/ }).click();
});

Then("the calendar shows the day, with the warning under it", async ({ page }) => {
  const day = page.getByRole("region", { name: /July 5/ });
  await expect(day.getByRole("listitem").filter({ hasText: CLOSED_DAY })).toBeVisible();
});

Then("no plan, version, or amount appears", async ({ page }) => {
  await expect(page.locator('a[href^="/plans/"]')).toHaveCount(0);
  await expect(page.getByText(/\$\d/)).toHaveCount(0);
});

// Naming, noting, freezing, deleting, archiving, and duplicating.
Given("a draft Financial Plan named {string}", async ({ club }, name: string) => {
  named.clear();
  club.ownYear();
  named.set(name, (await draftWithPlans(club, name)).set);
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
  named.set(name, new URL(page.url()).pathname.split("/").pop()!);
});

Then("the page is titled {string}", async ({ page }, name: string) => {
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
});

Then("Planning shows {string} with the note {string}", async ({ page }, name: string, note: string) => {
  await openPlanning(page);
  await expect(await details(page, name)).toContainText(note);
});

When("I open {string} and duplicate it as {string}", async ({ page }, parent: string, name: string) => {
  await page.goto(`${await app()}/plans/financial/${named.get(parent)}`);
  await page.getByRole("button", { name: "Duplicate" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByRole("button", { name: "Duplicate" }).click();
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

Then("I see no way to edit it or duplicate it", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Duplicate" })).toHaveCount(0);
});

Then("Planning has no actions for {string}", async ({ page }, name: string) => {
  await openPlanning(page);
  const row = planRow(page, name);
  await expect(row).toBeVisible();
  await expect(row.getByRole("button", { name: `More for ${name}` })).toHaveCount(0);
  await expect(row.getByRole("button", { name: /^Active date of/ })).toHaveCount(0);
});

Then("Planning has no way to freeze {string} or make it active", async ({ page }, name: string) => {
  await openPlanning(page);
  const row = planRow(page, name);
  await expect(row.getByRole("img", { name: "Draft" })).toBeVisible();
  await expect(row.getByRole("button", { name: /^Active date of/ })).toHaveCount(0);
  await row.getByRole("button", { name: `More for ${name}` }).click();
  await expect(page.getByRole("menuitem", { name: "Delete" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Freeze" })).toHaveCount(0);
});

When("I freeze {string} there", async ({ page }, name: string) => {
  await planRow(page, name)
    .getByRole("button", { name: `More for ${name}` })
    .click();
  await page.getByRole("menuitem", { name: "Freeze" }).click();
  const dialog = page.getByRole("dialog", { name: `Freeze ${name}?` });
  await dialog.getByRole("button", { name: "Freeze" }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
});

Then("Planning marks {string} frozen, for good", async ({ page }, name: string) => {
  const row = planRow(page, name);
  await expect(row.getByRole("img", { name: "Frozen" })).toBeVisible({ timeout: 30_000 });
  await row.getByRole("button", { name: `More for ${name}` }).click();
  await expect(page.getByRole("menuitem", { name: "Archive" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Freeze" })).toHaveCount(0);
});

When(
  "I make {string} active from {word} {int}, {int} there",
  async ({ page }, name: string, month: string, day: number, year: number) => {
    await planRow(page, name)
      .getByRole("button", { name: /^Active date of/ })
      .click();
    const popover = page.getByRole("dialog", { name: `When ${name} is active` });
    await popover.getByLabel("Active from").fill(isoDate(month, day, year));
    await popover.getByRole("button", { name: "Save" }).click();
    await expect(popover).toBeHidden({ timeout: 30_000 });
  },
);

Then("Planning shows {string} active from {string}", async ({ page }, name: string, when: string) => {
  const date = planRow(page, name).getByRole("button", { name: `Active date of ${name}: ${when}` });
  await expect(date).toBeVisible({ timeout: 30_000 });
});

When("I freeze it", async ({ page }) => {
  await page.getByRole("button", { name: "Freeze" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Freeze" }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
});

Then("it's marked frozen", async ({ page }) => {
  await expect(page.getByText("Frozen", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Freeze" })).toHaveCount(0);
});

When("I delete {string}", async ({ page }, name: string) => {
  await planRow(page, name)
    .getByRole("button", { name: `More for ${name}` })
    .click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog", { name: `Delete ${name}?` });
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
});

When("I archive {string}", async ({ page }, name: string) => {
  await planRow(page, name)
    .getByRole("button", { name: `More for ${name}` })
    .click();
  await page.getByRole("menuitem", { name: "Archive" }).click();
  await expect(planLink(page, name)).toHaveCount(0, { timeout: 30_000 });
});

Then("Planning lists {string} when I turn on archived plans", async ({ page }, name: string) => {
  await page.getByRole("switch", { name: "Show archived" }).click();
  await expect(planLink(page, name)).toBeVisible();
});

Then("Planning no longer lists {string}", async ({ page }, name: string) => {
  await expect(planLink(page, name)).toHaveCount(0);
});

/** A day written out, such as July 1, 2026, as `YYYY-MM-DD`. */
function isoDate(month: string, day: number, year: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${year}-${String(months.indexOf(month) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

When("I make it active from {word} {int}, {int}", async ({ page }, month: string, day: number, year: number) => {
  const date = isoDate(month, day, year);
  await page.getByRole("button", { name: "Make active" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Active from").fill(date);
  await dialog.getByRole("button", { name: "Make active" }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
});

Then("it's active since {string}", async ({ page }, when: string) => {
  await expect(page.getByText(`Active since ${when}`)).toBeVisible({ timeout: 30_000 });
});

Then("I see no way to freeze it or make it active", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Duplicate" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Freeze" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Make active" })).toHaveCount(0);
});
