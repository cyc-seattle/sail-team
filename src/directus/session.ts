// Pure decisions for sending a visitor to sign in, ported from isthmia's portal roster. No fetch, no DOM, no storage:
// sign-in.ts does that I/O and hands the results here.

/** A redirect this soon after the last one means sign-in isn't completing, so stop rather than loop. */
export const redirectGuardMs = 2 * 60 * 1000;

export type SignInAction =
  | { readonly kind: "proceed" }
  | { readonly kind: "redirect"; readonly url: string }
  | { readonly kind: "blocked"; readonly signInUrl: string };

export interface SignInInput {
  readonly signedIn: boolean;
  readonly lastRedirectAt: number | null;
  readonly now: number;
  readonly signInUrl: string;
}

export function decideSignIn(input: SignInInput): SignInAction {
  if (input.signedIn) {
    return { kind: "proceed" };
  }
  if (input.lastRedirectAt !== null && input.now - input.lastRedirectAt < redirectGuardMs) {
    return { kind: "blocked", signInUrl: input.signInUrl };
  }
  return { kind: "redirect", url: input.signInUrl };
}

/** Directus for the app at `hostname`: `cycsail.team` → `https://directus.cycsail.team`. */
export function directusUrlFor(hostname: string): string {
  return `https://directus.${hostname}`;
}

/** Directus's Authentik sign-in, which sends the browser back to `page` once Directus has a session. */
export function signInUrl(directusUrl: string, page: string): string {
  return `${directusUrl}/auth/login/authentik?redirect=${encodeURIComponent(page)}`;
}

/**
 * Authentik's sign-out at `login.<hostname>`, which ends its session, and any impersonation with it. It finishes on
 * Authentik's home page, which platform sends on to the app.
 */
export function signOutUrl(hostname: string): string {
  return `https://login.${hostname}/flows/-/default/invalidation/`;
}

/** A stored redirect time, or `null` when there's none or it isn't a number. */
export function parseRedirectAt(stored: string | null): number | null {
  if (stored === null || stored.trim() === "") {
    return null;
  }
  const at = Number(stored);
  return Number.isFinite(at) ? at : null;
}

/**
 * Where sign-in sends the browser back to. Directus allows only the exact addresses on its redirect list, so every
 * page comes back to the app's one landing page, with the page itself in `next`.
 */
export function returnUrl(origin: string, landing: string, page: { pathname: string; search: string; hash: string }) {
  const here = page.pathname + page.search + page.hash;
  return here === landing ? `${origin}${landing}` : `${origin}${landing}?next=${encodeURIComponent(here)}`;
}

/**
 * The page to move on to after sign-in, from `?next=`, if it's on this site, and `null` otherwise, so `next` can never
 * send anyone elsewhere. The browser's own URL parser decides, so tricks like `//host`, `/\host`, or a tab inside
 * `//` resolve the way the browser would resolve them, to another origin.
 */
export function nextPath(search: string, origin: string): string | null {
  const next = new URLSearchParams(search).get("next");
  if (!next?.startsWith("/")) {
    return null;
  }
  const url = new URL(next, origin);
  return url.origin === origin ? url.pathname + url.search + url.hash : null;
}
