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

/** A stored redirect time, or `null` when there's none or it isn't a number. */
export function parseRedirectAt(stored: string | null): number | null {
  if (stored === null || stored.trim() === "") {
    return null;
  }
  const at = Number(stored);
  return Number.isFinite(at) ? at : null;
}
