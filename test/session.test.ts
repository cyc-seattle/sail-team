import { describe, expect, it } from "vitest";
import {
  decideSignIn,
  directusUrlFor,
  nextPath,
  parseRedirectAt,
  redirectGuardMs,
  returnUrl,
  signInUrl,
  signOutUrl,
} from "../src/directus/session.ts";

const url = "https://directus.example.org/auth/login/authentik?redirect=https%3A%2F%2Fexample.org%2Fplans";

describe("decideSignIn", () => {
  it("proceeds with a session, whatever happened before", () => {
    expect(decideSignIn({ signedIn: true, lastRedirectAt: null, now: 1000, signInUrl: url })).toEqual({
      kind: "proceed",
    });
    expect(decideSignIn({ signedIn: true, lastRedirectAt: 999, now: 1000, signInUrl: url })).toEqual({
      kind: "proceed",
    });
  });

  it("redirects with no session and no redirect before", () => {
    expect(decideSignIn({ signedIn: false, lastRedirectAt: null, now: 1000, signInUrl: url })).toEqual({
      kind: "redirect",
      url,
    });
  });

  it("stops at a second redirect inside the guard window", () => {
    const now = 1_000_000;
    expect(decideSignIn({ signedIn: false, lastRedirectAt: now - (redirectGuardMs - 1), now, signInUrl: url })).toEqual(
      { kind: "blocked", signInUrl: url },
    );
  });

  it("redirects again once the guard window has passed", () => {
    const now = 1_000_000;
    expect(decideSignIn({ signedIn: false, lastRedirectAt: now - redirectGuardMs, now, signInUrl: url })).toEqual({
      kind: "redirect",
      url,
    });
  });
});

describe("the sign-in addresses", () => {
  it("finds Directus beside the app", () => {
    expect(directusUrlFor("cycsail.team")).toBe("https://directus.cycsail.team");
    expect(directusUrlFor("dev.cycsail.team")).toBe("https://directus.dev.cycsail.team");
  });

  it("sends the browser back to the page it came from", () => {
    expect(signInUrl("https://directus.example.org", "https://example.org/plans")).toBe(url);
  });

  it("signs out through Authentik beside the app", () => {
    expect(signOutUrl("dev.cycsail.team")).toBe("https://login.dev.cycsail.team/flows/-/default/invalidation/");
  });
});

describe("parseRedirectAt", () => {
  it.each([
    [null, null],
    ["", null],
    ["1700000000000", 1_700_000_000_000],
    ["soon", null],
  ])("reads %j as %j", (stored, at) => {
    expect(parseRedirectAt(stored)).toBe(at);
  });
});

describe("returnUrl", () => {
  const page = (pathname: string, search = "", hash = "") => ({ pathname, search, hash });

  it("comes back to the landing page itself", () => {
    expect(returnUrl("https://example.org", "/plans", page("/plans"))).toBe("https://example.org/plans");
  });

  it("comes back to the landing page, with any other page in next", () => {
    expect(returnUrl("https://example.org", "/plans", page("/plans/2027", "?v=2", "#costs"))).toBe(
      "https://example.org/plans?next=%2Fplans%2F2027%3Fv%3D2%23costs",
    );
  });
});

describe("nextPath", () => {
  const origin = "https://example.org";
  const search = (next: string) => `?next=${encodeURIComponent(next)}`;

  it("reads a path on this site", () => {
    expect(nextPath(search("/plans/2027?v=2#costs"), origin)).toBe("/plans/2027?v=2#costs");
  });

  it.each([
    "",
    "plans",
    "https://evil.example/plans",
    "//evil.example/plans",
    "/\\evil.example/plans",
    "/\t/evil.example/plans",
    "javascript:alert(1)",
  ])("never leaves the site for %j", (next) => {
    expect(nextPath(search(next), origin)).toBeNull();
  });

  it("is null with no next at all", () => {
    expect(nextPath("", origin)).toBeNull();
  });
});
