import { makeClient, type Client } from "./client.ts";
import { renewEveryMs, sessionKeeper, type SessionKeeper } from "./keep-session.ts";
import { queryClient } from "./queries.ts";
import { directusUrlFor } from "./session.ts";

/** The page sign-in returns to, which must be on Directus's redirect list (platform's backend stack). */
export const landing = "/";

let app: { client: Client; url: string; keeper: SessionKeeper } | undefined;

/** The app's own Directus, beside whatever hostname serves it. Made on first use, so tests can load routes. */
export function appDirectus() {
  if (!app) {
    const url = directusUrlFor(window.location.hostname);
    const keeper = sessionKeeper({
      directusUrl: url,
      fetch: (input, init) => globalThis.fetch(input, init),
      // Reading who's signed in again finds no session, so it sends the browser to sign in.
      signInAgain: () => void queryClient.invalidateQueries({ queryKey: ["session"] }),
      now: Date.now,
    });
    app = { client: makeClient(url, keeper.fetch), url, keeper };
  }
  return app;
}

let keeping = false;

/** Keeps the signed-in person's session alive while the app is open: now, hourly, and when the page comes back into view. */
export function keepSession() {
  const { keeper } = appDirectus();
  keeper.arm();
  void keeper.renewIfDue();
  if (keeping) {
    return;
  }
  keeping = true;
  setInterval(() => void keeper.renewIfDue(), renewEveryMs);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void keeper.renewIfDue();
    }
  });
}
