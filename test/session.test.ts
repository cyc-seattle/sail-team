import { describe, expect, it } from "vitest";
import { decideSignIn, directusUrlFor, parseRedirectAt, redirectGuardMs, signInUrl } from "../src/directus/session.ts";

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
