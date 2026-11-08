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

/** What the scenario's Givens made, for its Thens. A worker runs one scenario at a time. */
const scene: {
  program?: Program;
  child?: Person;
  others: { sailor: Person; guardian: Required<Person>; shares: boolean }[];
  group?: string | undefined;
  /** The sailor in the team's second division. */
  eastlake?: Person | undefined;
} = {
  others: [],
};

async function guardianOf(squad: Squad, visitor: Visitor, team: boolean, shares: boolean | null, school?: string) {
  scene.others = [];
  scene.group = undefined;
  scene.eastlake = undefined;
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
  const guardian = await squad.person(`${first}'s guardian`, { share_contact: shares });
  await squad.guardian(sailor.id, guardian.id);
  await squad.signUp(sailor.id, scene.program!);
  scene.others.push({ sailor, guardian, shares });
}

/** A sailor's row in the roster's table, which the journeys see at a laptop's size. */
const row = (page: Page, sailor: string) => page.getByRole("row").filter({ hasText: sailor });

/** The run's sailors the roster shows, by name. Dev's other teams show too, so only the run's own rows count. */
async function shows(page: Page, run: string, sailors: string[]) {
  await expect(page.getByRole("row").filter({ hasText: `Halyard ${run}` })).toHaveCount(sailors.length);
  for (const sailor of sailors) {
    await expect(row(page, sailor)).toBeVisible();
  }
}

async function pick(page: Page, filter: "Division" | "School", option: string) {
  await page.getByRole("combobox", { name: filter }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

Given("I'm a guardian whose child is on a team", async ({ squad, visitor }) => {
  await guardianOf(squad, visitor, true, null);
});

Given("I'm a guardian whose child is on a team, and I share my email and phone", async ({ squad, visitor }) => {
  await guardianOf(squad, visitor, true, true);
});

Given("I'm a guardian whose child is on a team, at Lakeside Middle School", async ({ squad, visitor }) => {
  await guardianOf(squad, visitor, true, null, "Lakeside Middle School");
});

Given("I'm a guardian whose child is in a program that isn't a team", async ({ squad, visitor }) => {
  await guardianOf(squad, visitor, false, null);
});

Given("a teammate whose guardian shares their email and phone", async ({ squad }) => {
  await another(squad, "Kai", true);
});

Given("a teammate whose guardian doesn't share", async ({ squad }) => {
  await another(squad, "Ren", false);
});

Given("the team's division has a Google Group", async ({ squad }) => {
  scene.group = await squad.googleGroup(scene.program!);
});

Given("a second division of the team, with a sailor at Eastlake High School", async ({ squad }) => {
  const kPod = await squad.program("K-Pod", { team: true });
  scene.eastlake = await squad.child("Mia", { school: "Eastlake High School" });
  await squad.signUp(scene.eastlake.id, kPod);
});

Given("I'm on the Crew", async ({ visitor }) => {
  scene.others = [];
  await makeDirectusUser(visitor);
  await setRole(visitor, "Crew");
});

Given("a team with a sailor whose guardian doesn't share", async ({ squad }) => {
  scene.program = await squad.program("J-Pod", { team: true });
  await another(squad, "Ren", false);
});

When("I open Rosters", async ({ page }) => {
  await page.goto(`${await app()}/roster`);
  await expect(page.getByRole("heading", { level: 1, name: "Rosters" })).toBeVisible();
});

When(/^I search for (?:the sharing|that) guardian's name$/, async ({ page }) => {
  const { guardian } = scene.others.find((o) => o.shares) ?? scene.others[0]!;
  await page.getByRole("searchbox", { name: "Find a sailor or guardian" }).fill(guardian.name);
});

Then("the roster shows my child and both teammates", async ({ page, squad }) => {
  await shows(page, squad.run, [scene.child!.name, ...scene.others.map((o) => o.sailor.name)]);
});

Then("the roster shows the sharing guardian's email and phone", async ({ page }) => {
  const { sailor, guardian } = scene.others.find((o) => o.shares)!;
  await expect(row(page, sailor.name).getByRole("link", { name: guardian.email })).toHaveAttribute(
    "href",
    `mailto:${guardian.email}`,
  );
  await expect(row(page, sailor.name).getByRole("link", { name: guardian.phone })).toBeVisible();
});

Then("the roster says the other guardian hasn't shared", async ({ page }) => {
  const { sailor, guardian } = scene.others.find((o) => !o.shares)!;
  await expect(row(page, sailor.name).getByText(guardian.name)).toBeVisible();
  await expect(row(page, sailor.name).getByText("Hasn't shared their email and phone.")).toBeVisible();
  await expect(row(page, sailor.name).getByText(guardian.email)).toHaveCount(0);
});

Then(
  "the roster shows my child and the sailor at Eastlake High School, with their schools",
  async ({ page, squad }) => {
    await shows(page, squad.run, [scene.child!.name, scene.eastlake!.name]);
    await expect(row(page, scene.child!.name).getByRole("cell", { name: "Lakeside Middle School" })).toBeVisible();
    await expect(row(page, scene.eastlake!.name).getByRole("cell", { name: "Eastlake High School" })).toBeVisible();
  },
);

Then("the roster links the division's Google Group", async ({ page }) => {
  const group = scene.group!;
  const [name, domain] = group.split("@");
  await expect(page.getByRole("link", { name: group })).toHaveAttribute(
    "href",
    `https://groups.google.com/a/${domain}/g/${name}`,
  );
});

When("I pick the second division", async ({ page, squad }) => {
  await pick(page, "Division", `K-Pod ${squad.run}`);
});

Then("the roster shows only the sailor at Eastlake High School", async ({ page, squad }) => {
  await shows(page, squad.run, [scene.eastlake!.name]);
});

When("I pick all divisions, and Lakeside Middle School", async ({ page }) => {
  await pick(page, "Division", "All divisions");
  await pick(page, "School", "Lakeside Middle School");
});

Then("the roster shows only my child", async ({ page, squad }) => {
  await shows(page, squad.run, [scene.child!.name]);
});

Then("the page's address keeps the filters, so I can share it", async ({ page, squad }) => {
  await expect(page).toHaveURL(/\?school=Lakeside(\+|%20)Middle(\+|%20)School$/);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "School" })).toHaveText(/Lakeside Middle School/);
  await shows(page, squad.run, [scene.child!.name]);
});

Then("the roster shows only that guardian's child, with the guardian's email and phone", async ({ page, squad }) => {
  const { sailor, guardian } = scene.others.find((o) => o.shares)!;
  await shows(page, squad.run, [sailor.name]);
  await expect(row(page, sailor.name).getByRole("link", { name: guardian.email })).toBeVisible();
  await expect(row(page, sailor.name).getByRole("link", { name: guardian.phone })).toBeVisible();
});

Then("I don't see Rosters in the menu", async ({ page }) => {
  // The sidebar on a laptop and the tab bar on a phone both start with Home.
  await expect(page.getByRole("navigation").getByRole("link", { name: "Home" }).first()).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Rosters" })).toHaveCount(0);
});

Then("the page says I don't have access to rosters", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "You don't have access to rosters" })).toBeVisible();
});

Then("the roster shows that guardian's email and phone", async ({ page, squad }) => {
  const [{ sailor, guardian }] = scene.others as [(typeof scene.others)[number]];
  await shows(page, squad.run, [sailor.name]);
  await expect(row(page, sailor.name).getByRole("link", { name: guardian.email })).toBeVisible();
  await expect(row(page, sailor.name).getByRole("link", { name: guardian.phone })).toBeVisible();
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
