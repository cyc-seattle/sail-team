import { isDirectusError, logout, readMe, readUserPermissions } from "@directus/sdk";
import type { Permissions } from "./access.ts";
import type { Client } from "./client.ts";
import { decideSignIn, parseRedirectAt, signInUrl } from "./session.ts";

const redirectKey = "sail-team:sign-in-redirect";
const meFields = ["id", "first_name", "last_name", "email", { role: ["name"] }] as const;

export interface Me {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  /** Their Directus role. Every role can read its own name. */
  role: { name: string } | null;
}

export type SignIn =
  | { kind: "signed-in"; me: Me; permissions: Permissions }
  | { kind: "redirecting" }
  | { kind: "blocked"; signInUrl: string };

export interface SignInContext {
  client: Client;
  directusUrl: string;
  /** The page to come back to. */
  page: string;
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  navigate: (url: string) => void;
  now: () => number;
}

/** Directus answers a request with no session with 401, or 403 when the public role can't read it. */
export function isSignedOut(error: unknown): boolean {
  const status = isDirectusError(error) ? error.response.status : undefined;
  return status === 401 || status === 403;
}

/**
 * Who's signed in, and what they may do. With no session, sends the browser to sign in, unless it was just sent
 * there, which means sign-in isn't completing.
 */
export async function signIn(context: SignInContext): Promise<SignIn> {
  const { client, storage } = context;
  let me: Me | undefined;
  try {
    me = (await client.request(readMe({ fields: [...meFields] }))) as Me;
  } catch (error) {
    if (!isSignedOut(error)) {
      throw error;
    }
  }

  const url = signInUrl(context.directusUrl, context.page);
  const now = context.now();
  const action = decideSignIn({
    signedIn: me !== undefined,
    lastRedirectAt: parseRedirectAt(storage.getItem(redirectKey)),
    now,
    signInUrl: url,
  });
  switch (action.kind) {
    case "proceed":
      storage.removeItem(redirectKey);
      return { kind: "signed-in", me: me!, permissions: await client.request(readUserPermissions()) };
    case "redirect":
      storage.setItem(redirectKey, String(now));
      context.navigate(action.url);
      return { kind: "redirecting" };
    case "blocked":
      return { kind: "blocked", signInUrl: action.signInUrl };
  }
}

/**
 * Ends the Directus session, then sends the browser through Authentik's sign-out, since Directus's sign-out leaves
 * Authentik's session, and any impersonation, in place. It goes on even if Directus didn't answer, so the person lands
 * back in the app, still signed in, and can try again.
 */
export async function signOut(context: { client: Client; signOutUrl: string; navigate: (url: string) => void }) {
  try {
    await context.client.request(logout({ mode: "session" }));
  } catch {
    // Already signed out, or Directus is down.
  }
  context.navigate(context.signOutUrl);
}
