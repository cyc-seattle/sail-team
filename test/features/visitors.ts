import { expect } from "@playwright/test";
import { asAdmin, authentikUsers, newRunId } from "./support";

// Made-up people who sign in on dev, each with an email no one else has, deleted when the scenario ends. Directus
// checks a new user's email against IANA's TLDs, so they can't use `.test`.
const domain = "example.com";
const prefix = "sail-team.visitor.";

export interface Visitor {
  email: string;
  firstName: string;
  lastName: string;
  /** What the app calls them. */
  name: string;
  directusUserId?: string;
  personId?: string;
  groupId?: string;
  signInLink?: string;
}

export function newVisitor(): Visitor {
  const run = newRunId();
  return {
    email: `${prefix}${run}@${domain}`,
    firstName: "Robin",
    lastName: `Tiller ${run}`,
    name: `Robin Tiller ${run}`,
  };
}

async function idOf(collection: "roles" | "policies", name: string): Promise<string> {
  const [found] = await asAdmin("GET", `/${collection}?filter[name][_eq]=${encodeURIComponent(name)}&fields=id`);
  if (!found) {
    throw new Error(`Dev's Directus has no ${collection === "roles" ? "role" : "policy"} named ${name}.`);
  }
  return found.id;
}

/**
 * Makes the visitor's Directus user before they sign in, on the Community role, as a first sign-in would. Directus's
 * Authentik sign-in finds a user by their email, so it signs them in as this one, with the name the journeys check.
 */
export async function makeDirectusUser(visitor: Visitor) {
  const user = await asAdmin("POST", "/users", {
    email: visitor.email,
    first_name: visitor.firstName,
    last_name: visitor.lastName,
    provider: "authentik",
    external_identifier: visitor.email,
    role: await idOf("roles", "Community"),
  });
  visitor.directusUserId = user.id;
}

/**
 * Gives the visitor policies the way the club does: they're a person in a made-up group that gives them. The
 * `group-policies` hook links the policies to their user, which this waits for.
 */
export async function giveThroughGroup(visitor: Visitor, ...policies: string[]) {
  const person = await asAdmin("POST", "/items/people", {
    first_name: visitor.firstName,
    last_name: visitor.lastName,
    email: visitor.email,
  });
  visitor.personId = person.id;
  const group = await asAdmin("POST", "/items/groups", {
    name: `${prefix}${visitor.email.split("@")[0]!.slice(prefix.length)}`,
    description: "Made up by sail-team's journeys. Deleted when the journey ends.",
  });
  visitor.groupId = group.id;
  await asAdmin("POST", "/items/group_members", { group_id: group.id, person_id: person.id });
  for (const policy of policies) {
    await asAdmin("POST", "/items/group_policies", { group_id: group.id, policy_id: await idOf("policies", policy) });
  }
  await expect
    .poll(
      async () => {
        const user = await asAdmin("GET", `/users/${visitor.directusUserId}?fields=policies.policy.name`);
        return (user.policies as { policy: { name: string } }[]).map((p) => p.policy.name);
      },
      { timeout: 30_000, intervals: [1_000] },
    )
    .toEqual(expect.arrayContaining(policies));
}

// Authentik answers 500 while the session the journey signed in with still holds an authorization code.
async function deleteAuthentikUser(pk: number) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await authentikUsers("DELETE", `/${pk}/`);
    } catch (error) {
      if (attempt === 12 || !String(error).includes(": 500 ")) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
}

/** Deletes everything a visitor's scenario made: their group, person, Directus user, and Authentik user. */
export async function cleanUp(email: string) {
  const byEmail = `filter[email][_eq]=${encodeURIComponent(email)}`;
  const name = `${prefix}${email.split("@")[0]!.slice(prefix.length)}`;
  for (const group of await asAdmin("GET", `/items/groups?filter[name][_eq]=${encodeURIComponent(name)}&fields=id`)) {
    for (const table of ["group_members", "group_policies"]) {
      const rows = await asAdmin("GET", `/items/${table}?filter[group_id][_eq]=${group.id}&fields=id`);
      if (rows.length > 0) {
        await asAdmin(
          "DELETE",
          `/items/${table}`,
          rows.map((r: { id: string }) => r.id),
        );
      }
    }
    await asAdmin("DELETE", `/items/groups/${group.id}`);
  }
  for (const person of await asAdmin("GET", `/items/people?${byEmail}&fields=id`)) {
    // A run that died before its own cleanup can leave a contacts row naming them, such as a child's guardian link,
    // and platform restricts deleting a person a contacts row names.
    for (const field of ["subject_id", "contact_id"]) {
      const links = await asAdmin("GET", `/items/contacts?filter[${field}][_eq]=${person.id}&fields=id&limit=-1`);
      if (links.length > 0) {
        await asAdmin(
          "DELETE",
          "/items/contacts",
          links.map((r: { id: string }) => r.id),
        );
      }
    }
    await asAdmin("DELETE", `/items/people/${person.id}`);
  }
  for (const user of await asAdmin("GET", `/users?${byEmail}&fields=id`)) {
    await asAdmin("DELETE", `/users/${user.id}`);
  }
  const found = await authentikUsers("GET", `/?email=${encodeURIComponent(email)}`);
  for (const user of found.results as { pk: number }[]) {
    await deleteAuthentikUser(user.pk);
  }
}

/** When a visitor was made: their run id starts with the time, in base 36, before 4 random hex digits. */
function madeAt(email: string): number {
  const run = email.slice(prefix.length, email.indexOf("@"));
  return parseInt(run.slice(0, -4), 36);
}

/** Visitors an earlier run left behind, if it died before cleaning up. An hour's margin spares a run in flight. */
export async function staleVisitors(): Promise<string[]> {
  const cutoff = Date.now() - 60 * 60_000;
  const starts = `filter[email][_starts_with]=${encodeURIComponent(prefix)}&fields=email&limit=-1`;
  const users: { email: string }[] = await asAdmin("GET", `/users?${starts}`);
  const people: { email: string }[] = await asAdmin("GET", `/items/people?${starts}`);
  const found = await authentikUsers("GET", `/?search=${encodeURIComponent(prefix)}&page_size=100`);
  const emails = [...users, ...people, ...(found.results as { email: string }[])]
    .map((u) => u.email)
    .filter((email) => email?.startsWith(prefix));
  return [...new Set(emails)].filter((email) => madeAt(email) < cutoff);
}
