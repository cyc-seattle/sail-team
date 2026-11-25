import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdir, rmdir } from "node:fs/promises";
import { expect, type Page } from "@playwright/test";
import { test as base } from "playwright-bdd";
import { Club } from "./club";
import { Fleet } from "./fleet";
import { Posts } from "./posts";
import { Squad } from "./squad";
import { appUrl, asAdmin, authentikLock, directusUrl, mailpit } from "./support";
import { cleanUp, newVisitor, type Visitor } from "./visitors";

// What every journey's steps share: the scenario's made-up visitor, and its made-up club's plans.

export const test = base.extend<{ visitor: Visitor; club: Club; squad: Squad; posts: Posts; fleet: Fleet }>({
  visitor: [
    // eslint-disable-next-line no-empty-pattern -- Playwright reads a fixture's dependencies from this pattern.
    async ({}, use) => {
      const visitor = newVisitor();
      try {
        await use(visitor);
      } finally {
        await cleanUp(visitor.email);
      }
    },
    { timeout: 180_000 },
  ],
  club: [
    // eslint-disable-next-line no-empty-pattern -- Playwright reads a fixture's dependencies from this pattern.
    async ({}, use) => {
      const club = new Club();
      try {
        await use(club);
      } finally {
        await club.cleanUp();
      }
    },
    { timeout: 180_000 },
  ],
  // After the visitor, so it's deleted before them: their person is still someone's parent until then.
  squad: [
    async ({ visitor }, use) => {
      void visitor;
      const squad = new Squad();
      try {
        await use(squad);
      } finally {
        await squad.cleanUp();
      }
    },
    { timeout: 180_000 },
  ],
  fleet: [
    // eslint-disable-next-line no-empty-pattern -- Playwright reads a fixture's dependencies from this pattern.
    async ({}, use) => {
      const fleet = new Fleet();
      try {
        await use(fleet);
      } finally {
        await fleet.cleanUp();
      }
    },
    { timeout: 60_000 },
  ],
  posts: [
    // eslint-disable-next-line no-empty-pattern -- Playwright reads a fixture's dependencies from this pattern.
    async ({}, use) => {
      const posts = new Posts();
      try {
        await use(posts);
      } finally {
        await posts.cleanUp();
      }
    },
    { timeout: 60_000 },
  ],
});

/** The Financial Plan a scenario opens, set by its Given steps. A worker runs one scenario at a time. */
export const opened: { set?: string } = {};

/** The app's address. */
export const app = appUrl;

/** Runs `signIn` once no other worker is signing in: Directus gives up on Authentik's token when it's slow. */
async function oneAtATime(signIn: () => Promise<void>) {
  while (
    !(await mkdir(authentikLock).then(
      () => true,
      (error: NodeJS.ErrnoException) => {
        if (error.code !== "EEXIST") throw error;
        return false;
      },
    ))
  ) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  try {
    await signIn();
  } finally {
    await rmdir(authentikLock);
  }
}

/**
 * Signs in on Authentik's sign-in page, which the browser must be on, through the emailed link Authentik sends to
 * Mailpit, and waits to be sent back to the app.
 */
export async function signIn(page: Page, visitor: Visitor): Promise<void> {
  await oneAtATime(async () => {
    await page.locator('input[name="uidField"]').fill(visitor.email);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/check your inbox/i)).toBeVisible();

    const query = encodeURIComponent(`to:"${visitor.email}"`);
    await expect
      // Authentik sometimes takes over a minute to send it.
      .poll(async () => (await mailpit(`/api/v1/search?query=${query}`)).messages?.[0]?.ID, {
        timeout: 120_000,
        intervals: [2_000],
      })
      .toBeTruthy();
    const found = await mailpit(`/api/v1/search?query=${query}`);
    const message = await mailpit(`/api/v1/message/${found.messages[0].ID}`);
    const href = /href="([^"]+)"/.exec(message.HTML)?.[1];
    assert.ok(href, "The sign-in email has no link.");
    await page.goto(href.replace(/&amp;/g, "&"));
    await page.getByRole("button", { name: "Continue" }).click();
    // Authentik, then Directus, send the browser back. Authentik can take a minute over the authorize step.
    const { host } = new URL(await app());
    await page.waitForURL((url) => url.host === host, { timeout: 120_000 });
  });
}

/**
 * Signs in straight to Directus with a password, so a journey that isn't about signing in skips Authentik, which the
 * journeys that sign in by emailed link cover. The browser gets the same session cookie Authentik's sign-in ends with.
 */
export async function signInWithPassword(page: Page, visitor: Visitor): Promise<void> {
  const password = randomBytes(24).toString("base64url");
  await asAdmin("PATCH", `/users/${visitor.directusUserId}`, { provider: "default", password });
  const response = await page.request.post(`${await directusUrl()}/auth/login`, {
    data: { email: visitor.email, password, mode: "session" },
  });
  assert.ok(response.ok(), `Can't sign in to Directus as ${visitor.email}: ${response.status()}`);
}
