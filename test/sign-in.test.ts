import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { makeClient } from "../src/directus/client.ts";
import { redirectGuardMs } from "../src/directus/session.ts";
import { signIn, signOut, type SignInContext } from "../src/directus/sign-in.ts";
import { planner, plannerPermissions } from "../src/mocks/fixtures.ts";
import { handlers } from "../src/mocks/handlers.ts";

vi.stubGlobal("window", { location: { hostname: "example.org" } });

const directusUrl = "https://directus.example.org";
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function context(stored: Record<string, string> = {}, now = 1_000_000) {
  const storage = new Map(Object.entries(stored));
  const navigate = vi.fn();
  const ctx: SignInContext = {
    client: makeClient(directusUrl),
    directusUrl,
    page: "https://example.org/plans",
    storage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => void storage.set(key, value),
      removeItem: (key) => void storage.delete(key),
    },
    navigate,
    now: () => now,
  };
  return { ctx, storage, navigate };
}

const signInPage = `${directusUrl}/auth/login/authentik?redirect=${encodeURIComponent("https://example.org/plans")}`;

describe("signIn", () => {
  it("returns the user and their permissions when there's a session", async () => {
    server.use(...handlers(directusUrl, { me: planner, permissions: plannerPermissions }));
    const { ctx, storage, navigate } = context({ "sail-team:sign-in-redirect": "999" });
    expect(await signIn(ctx)).toEqual({ kind: "signed-in", me: planner, permissions: plannerPermissions });
    expect(navigate).not.toHaveBeenCalled();
    expect(storage.size).toBe(0);
  });

  it("sends a visitor with no session to sign in, and notes when", async () => {
    server.use(...handlers(directusUrl, { me: null, permissions: {} }));
    const { ctx, storage, navigate } = context();
    expect(await signIn(ctx)).toEqual({ kind: "redirecting" });
    expect(navigate).toHaveBeenCalledWith(signInPage);
    expect(storage.get("sail-team:sign-in-redirect")).toBe("1000000");
  });

  it("stops instead of looping when sign-in just sent them back with no session", async () => {
    server.use(...handlers(directusUrl, { me: null, permissions: {} }));
    const { ctx, navigate } = context({ "sail-team:sign-in-redirect": String(1_000_000 - redirectGuardMs + 1) });
    expect(await signIn(ctx)).toEqual({ kind: "blocked", signInUrl: signInPage });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("throws when Directus fails for another reason, rather than sending them to sign in", async () => {
    server.use(...handlers(directusUrl));
    const { http, HttpResponse } = await import("msw");
    server.use(http.get(`${directusUrl}/users/me`, () => HttpResponse.json({ errors: [] }, { status: 503 })));
    const { ctx, navigate } = context();
    await expect(signIn(ctx)).rejects.toBeDefined();
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  const authentik = "https://login.example.org/flows/-/default/invalidation/";

  it("ends the Directus session, then goes through Authentik's sign-out", async () => {
    server.use(...handlers(directusUrl));
    const { http, HttpResponse } = await import("msw");
    const bodies: unknown[] = [];
    server.use(
      http.post(`${directusUrl}/auth/logout`, async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const navigate = vi.fn();
    await signOut({ client: makeClient(directusUrl), signOutUrl: authentik, navigate });
    expect(bodies).toEqual([{ mode: "session" }]);
    expect(navigate).toHaveBeenCalledWith(authentik);
  });

  it("still goes through Authentik's sign-out when Directus fails", async () => {
    const { http, HttpResponse } = await import("msw");
    server.use(http.post(`${directusUrl}/auth/logout`, () => HttpResponse.json({ errors: [] }, { status: 503 })));
    const navigate = vi.fn();
    await signOut({ client: makeClient(directusUrl), signOutUrl: authentik, navigate });
    expect(navigate).toHaveBeenCalledWith(authentik);
  });
});
