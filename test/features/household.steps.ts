import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { app, test } from "./fixtures";
import { hasRole, type Squad } from "./squad";
import { asAdmin } from "./support";
import { makeDirectusUser, type Visitor } from "./visitors";

// Steps for features/household.feature, against dev, with a made-up household (./squad.ts).

const { Given, When, Then } = createBdd(test);

/** What the scenario's Givens made, for its Thens. A worker runs one scenario at a time. */
const scene: {
  household?: string;
  otherGuardian?: { id: string; name: string };
  child?: { id: string; name: string };
} = {};

async function family(squad: Squad, visitor: Visitor, shares: boolean | null) {
  await makeDirectusUser(visitor);
  const me = await squad.visitorPerson(visitor);
  scene.otherGuardian = await squad.person("Sam");
  scene.child = await squad.child("Ada", { school: "Lakeside Middle School" });
  await squad.guardian(scene.child.id, me);
  await squad.guardian(scene.child.id, scene.otherGuardian.id);
  scene.household = await squad.household([me, scene.otherGuardian.id, scene.child.id], shares);
  await squad.signUp(scene.child.id, await squad.program("J-Pod", { team: true }));
  await hasRole(visitor, "Team");
}

/** A member's card, found by its heading. */
const card = (page: Page, name: string | RegExp) =>
  page.locator("section", { has: page.getByRole("heading", { level: 2, name }) });

Given("I'm a guardian with another guardian and a child on a team", async ({ squad, visitor }) => {
  await family(squad, visitor, null);
});

Given(
  "I'm a guardian with another guardian and a child on a team, and our household shares",
  async ({ squad, visitor }) => {
    await family(squad, visitor, true);
  },
);

When("I open Household", async ({ page }) => {
  await page.goto(`${await app()}/household`);
  await expect(page.getByRole("heading", { level: 1, name: "Household" })).toBeVisible();
});

Then("I see myself, the other guardian, and my child", async ({ page, visitor }) => {
  await expect(card(page, `${visitor.name} (you)`)).toBeVisible();
  await expect(card(page, scene.otherGuardian!.name)).toBeVisible();
  await expect(card(page, scene.child!.name)).toContainText("Lakeside Middle School");
});

When(
  "I change my child's name to {string} and their school to {string}, which isn't on the list",
  async ({ page }, name: string, school: string) => {
    await page.getByRole("button", { name: `Edit ${scene.child!.name}` }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByRole("combobox", { name: "School" }).click();
    await page.getByRole("option", { name: "Other" }).click();
    await page.getByLabel("School name").fill(school);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(card(page, name).getByRole("status")).toHaveText("Saved.");
  },
);

async function changePhone(page: Page, name: string, phone: string) {
  await page.getByRole("button", { name: `Edit ${name}` }).click();
  await page.getByRole("textbox", { name: "Phone" }).fill(phone);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(card(page, name).getByRole("status")).toHaveText("Saved.");
}

When("I change my phone to {string}", async ({ page, visitor }, phone: string) => {
  await changePhone(page, visitor.name, phone);
});

When("I change the other guardian's phone to {string}", async ({ page }, phone: string) => {
  await changePhone(page, scene.otherGuardian!.name, phone);
});

Then("my child shows as Addie, at Salish Sea Academy", async ({ page }) => {
  await expect(card(page, "Addie")).toContainText("Salish Sea Academy");
});

Then("my phone shows as {string}", async ({ page, visitor }, phone: string) => {
  await expect(card(page, `${visitor.name} (you)`)).toContainText(phone);
});

Then("the other guardian's phone shows as {string}", async ({ page }, phone: string) => {
  await expect(card(page, scene.otherGuardian!.name)).toContainText(phone);
});

Then("my household has my new phone and my child's new name and school", async ({ visitor }) => {
  expect(await asAdmin("GET", `/items/people/${visitor.personId}?fields=phone`)).toMatchObject({
    phone: "+12065550199",
  });
  expect(await asAdmin("GET", `/items/people/${scene.child!.id}?fields=display_name,school_id,school`)).toMatchObject({
    display_name: "Addie",
    school_id: null,
    school: "Salish Sea Academy",
  });
});

const choice = (page: Page) => page.getByRole("switch", { name: "Share adults contact information with teammates" });

async function sharing() {
  return (await asAdmin("GET", `/items/households/${scene.household}?fields=share_contact`)).share_contact;
}

When("I stop sharing our email and phone numbers", async ({ page }) => {
  await expect(choice(page)).toBeChecked();
  await choice(page).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
});

When("I share them again", async ({ page }) => {
  await choice(page).click();
  await expect(choice(page)).toBeChecked();
  await expect(page.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
});

Then("my household is down as not sharing", async () => {
  await expect.poll(sharing).toBe(false);
});

Then("my household is down as sharing", async () => {
  await expect.poll(sharing).toBe(true);
});
