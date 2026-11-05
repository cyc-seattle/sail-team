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
} = {
  others: [],
};

async function parentOf(squad: Squad, visitor: Visitor, team: boolean, shares: boolean | null) {
  scene.others = [];
  await makeDirectusUser(visitor);
  const me = await squad.visitorPerson(visitor, shares);
  scene.program = await squad.program(team ? "Race team" : "Learn to sail", { team });
  scene.child = await squad.child("Ada");
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

const roster = (page: Page) =>
  page.locator('[data-slot="card"]', { has: page.getByRole("heading", { name: scene.program!.name }) });

Given("I'm a parent whose child is on a team", async ({ squad, visitor }) => {
  await parentOf(squad, visitor, true, null);
});

Given("I'm a parent whose child is on a team, and I share my email and phone", async ({ squad, visitor }) => {
  await parentOf(squad, visitor, true, true);
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

Given("another sailor in the program, whose parent shares their email and phone", async ({ squad }) => {
  await another(squad, "Kai", true);
});

Given("I'm on the Crew", async ({ visitor }) => {
  scene.others = [];
  await makeDirectusUser(visitor);
  await setRole(visitor, "Crew");
});

Given("a team with a sailor whose parent doesn't share", async ({ squad }) => {
  scene.program = await squad.program("Race team", { team: true });
  await another(squad, "Ren", false);
});

When("I open Rosters", async ({ page }) => {
  await page.goto(`${await app()}/roster`);
  await expect(page.getByRole("heading", { level: 1, name: "Rosters" })).toBeVisible();
});

Then("the team's roster shows my child and both teammates", async ({ page }) => {
  const card = roster(page);
  for (const name of [scene.child!.name, ...scene.others.map((o) => o.sailor.name)]) {
    await expect(card.getByText(name, { exact: true })).toBeVisible();
  }
});

Then("it shows the sharing parent's email and phone", async ({ page }) => {
  const { parent } = scene.others.find((o) => o.shares)!;
  await expect(roster(page).getByRole("link", { name: parent.email })).toHaveAttribute(
    "href",
    `mailto:${parent.email}`,
  );
  await expect(roster(page).getByRole("link", { name: parent.phone })).toBeVisible();
});

Then("it names the other parent as their child's parent, with no email or phone", async ({ page }) => {
  const { parent } = scene.others.find((o) => !o.shares)!;
  const card = roster(page);
  await expect(card.getByText(parent.name)).toBeVisible();
  await expect(card.getByText(parent.email!)).toHaveCount(0);
  await expect(card.getByText(parent.phone!)).toHaveCount(0);
});

Then("the program's roster shows my child", async ({ page }) => {
  await expect(roster(page).getByText(scene.child!.name, { exact: true })).toBeVisible();
});

Then("not the other sailor or their parent", async ({ page }) => {
  const [{ sailor, parent }] = scene.others as [(typeof scene.others)[number]];
  await expect(page.getByText(sailor.name)).toHaveCount(0);
  await expect(page.getByText(parent.name)).toHaveCount(0);
  await expect(page.getByText(parent.email!)).toHaveCount(0);
});

Then("the team's roster shows that parent's email and phone", async ({ page }) => {
  const [{ parent }] = scene.others as [(typeof scene.others)[number]];
  await expect(roster(page).getByRole("link", { name: parent.email })).toBeVisible();
  await expect(roster(page).getByRole("link", { name: parent.phone })).toBeVisible();
});

const choice = (page: Page) => page.getByRole("switch", { name: "Share my email and phone with my child's team" });

async function sharing(visitor: Visitor) {
  return (await asAdmin("GET", `/items/people/${visitor.personId}?fields=share_contact`)).share_contact;
}

When("I stop sharing my email and phone with my child's team", async ({ page }) => {
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
