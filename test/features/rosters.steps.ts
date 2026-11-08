import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { app, test } from "./fixtures";
import { hasRole, setRole, type Program, type Squad } from "./squad";
import { asAdmin } from "./support";
import { makeDirectusUser, type Visitor } from "./visitors";

// Steps for features/rosters.feature, against dev, with made-up programs and families (./squad.ts). Directus's rules
// decide what the visitor sees, so these check what the page shows, not what it asked for.

const { Given, When, Then } = createBdd(test);

interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

/** What the scenario's Givens made, for its Thens. One scenario runs at a time (playwright.config.ts). */
const scene: {
  program?: Program;
  child?: Person;
  others: { sailor: Person; parent: Required<Person>; shares: boolean }[];
  group?: string | undefined;
} = {
  others: [],
};

async function parentOf(squad: Squad, visitor: Visitor, team: boolean, shares: boolean | null, school?: string) {
  scene.others = [];
  scene.group = undefined;
  await makeDirectusUser(visitor);
  const me = await squad.visitorPerson(visitor, shares);
  scene.program = await squad.program(team ? "J-Pod" : "Learn to sail", { team });
  scene.child = await squad.child("Ada", { school: school ?? null });
  await squad.guardian(scene.child.id, me);
  await squad.signUp(scene.child.id, scene.program);
  await hasRole(visitor, team ? "Team" : "Community");
}

async function another(squad: Squad, first: string, shares: boolean) {
  const sailor = await squad.child(first);
  const parent = await squad.person(`${first}'s parent`, { share_contact: shares });
  await squad.guardian(sailor.id, parent.id);
  await squad.signUp(sailor.id, scene.program!);
  scene.others.push({ sailor, parent, shares });
}

const section = (page: Page, name: string) =>
  page.locator("section", { has: page.getByRole("heading", { level: 2, name: new RegExp(`^${name}`) }) });

/** Opens a name's contact card, and returns it. */
async function card(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).first().click();
  const popup = page.locator('[data-slot="popover-content"]');
  await expect(popup.getByText(name, { exact: true }).first()).toBeVisible();
  return popup;
}

Given("I'm a parent whose child is on a team", async ({ squad, visitor }) => {
  await parentOf(squad, visitor, true, null);
});

Given("I'm a parent whose child is on a team, and I share my email and phone", async ({ squad, visitor }) => {
  await parentOf(squad, visitor, true, true);
});

Given("I'm a parent whose child is on a team, at Lakeside Middle School", async ({ squad, visitor }) => {
  await parentOf(squad, visitor, true, null, "Lakeside Middle School");
});

Given("I'm a parent whose child is in a program that isn't a team", async ({ squad, visitor }) => {
  await parentOf(squad, visitor, false, null);
});

Given("a teammate whose parent shares their email and phone", async ({ squad }) => {
  await another(squad, "Kai", true);
});

Given("a teammate whose parent doesn't share", async ({ squad }) => {
  await another(squad, "Ren", false);
});

Given("the team's division has a Google Group", async ({ squad }) => {
  scene.group = await squad.googleGroup(scene.program!);
});

Given("a second division of the team, with a sailor at Eastlake High School", async ({ squad }) => {
  const kPod = await squad.program("K-Pod", { team: true });
  const sailor = await squad.child("Mia", { school: "Eastlake High School" });
  await squad.signUp(sailor.id, kPod);
});

Given("I'm on the Crew", async ({ visitor }) => {
  scene.others = [];
  await makeDirectusUser(visitor);
  await setRole(visitor, "Crew");
});

Given("a team with a sailor whose parent doesn't share", async ({ squad }) => {
  scene.program = await squad.program("J-Pod", { team: true });
  await another(squad, "Ren", false);
});

When("I open Rosters", async ({ page }) => {
  await page.goto(`${await app()}/roster`);
});

When(/^I open (?:my child's|that) team from Rosters$/, async ({ page, squad }) => {
  await page.goto(`${await app()}/roster`);
  await expect(page.getByRole("heading", { level: 1, name: "Rosters" })).toBeVisible();
  await page.getByRole("link", { name: new RegExp(`^${squad.teamName}`) }).click();
  await expect(page.getByRole("heading", { level: 1, name: squad.teamName })).toBeVisible();
});

Then("the roster shows my child and both teammates", async ({ page }) => {
  for (const name of [scene.child!.name, ...scene.others.map((o) => o.sailor.name)]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  }
});

Then("the sharing parent's card shows their email and phone", async ({ page }) => {
  const { parent } = scene.others.find((o) => o.shares)!;
  const popup = await card(page, parent.name);
  await expect(popup.getByRole("link", { name: parent.email })).toHaveAttribute("href", `mailto:${parent.email}`);
  await expect(popup.getByRole("link", { name: parent.phone })).toBeVisible();
  await page.keyboard.press("Escape");
});

Then("the other parent's card says they haven't shared", async ({ page }) => {
  const { parent } = scene.others.find((o) => !o.shares)!;
  const popup = await card(page, parent.name);
  await expect(popup.getByText("Hasn't shared their email and phone.")).toBeVisible();
  await expect(popup.getByText(parent.email)).toHaveCount(0);
  await page.keyboard.press("Escape");
});

Then("the team has 2 sailors in all", async ({ page }) => {
  await expect(page.getByText("2 sailors in all")).toBeVisible();
});

Then("each division shows its 1 sailor", async ({ page, squad }) => {
  for (const division of ["J-Pod", "K-Pod"]) {
    await expect(section(page, `${division} ${squad.run}`).getByText("1 sailor", { exact: true })).toBeVisible();
  }
});

Then("the roster links the division's Google Group", async ({ page }) => {
  const group = scene.group!;
  const [name, domain] = group.split("@");
  await expect(page.getByRole("link", { name: group })).toHaveAttribute(
    "href",
    `https://groups.google.com/a/${domain}/g/${name}`,
  );
});

When("I group the team by school", async ({ page }) => {
  await page.getByRole("button", { name: "By school" }).click();
});

Then("Lakeside Middle School and Eastlake High School each show their 1 sailor", async ({ page }) => {
  for (const school of ["Lakeside Middle School", "Eastlake High School"]) {
    await expect(section(page, school).getByText("1 sailor", { exact: true })).toBeVisible();
  }
});

Then("the page's address keeps the grouping, so I can share it", async ({ page, squad }) => {
  await expect(page).toHaveURL(/\?by=school$/);
  await page.reload();
  await expect(page.getByRole("button", { name: "By school" })).toHaveAttribute("aria-pressed", "true");
  await expect(section(page, "Eastlake High School")).toBeVisible();
  expect(page.url()).toContain(squad.areaId!);
});

Then("I don't see Rosters in the menu", async ({ page }) => {
  // The sidebar on a laptop and the tab bar on a phone both start with Home.
  await expect(page.getByRole("navigation").getByRole("link", { name: "Home" }).first()).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Rosters" })).toHaveCount(0);
});

Then("the page says I don't have access to rosters", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "You don't have access to rosters" })).toBeVisible();
});

Then("that parent's card shows their email and phone", async ({ page }) => {
  const [{ parent }] = scene.others as [(typeof scene.others)[number]];
  const popup = await card(page, parent.name);
  await expect(popup.getByRole("link", { name: parent.email })).toBeVisible();
  await expect(popup.getByRole("link", { name: parent.phone })).toBeVisible();
});

const choice = (page: Page) => page.getByRole("switch", { name: "Share my email and phone with my child's team" });

async function sharing(visitor: Visitor) {
  return (await asAdmin("GET", `/items/people/${visitor.personId}?fields=share_contact`)).share_contact;
}

When("I stop sharing my email and phone with my child's team", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: "Rosters" })).toBeVisible();
  await expect(choice(page)).toBeChecked();
  await choice(page).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
});

When("I share them again", async ({ page }) => {
  await choice(page).click();
  await expect(choice(page)).toBeChecked();
  await expect(page.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
});

Then("the club has me down as not sharing", async ({ visitor }) => {
  await expect.poll(() => sharing(visitor)).toBe(false);
});

Then("the club has me down as sharing", async ({ visitor }) => {
  await expect.poll(() => sharing(visitor)).toBe(true);
});
