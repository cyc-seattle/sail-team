/** How long since the last renewal before the app renews the session again. */
export const renewEveryMs = 60 * 60 * 1000;

type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface SessionKeeperOptions {
  directusUrl: string;
  fetch: Fetch;
  /** Sends the browser through sign-in again, once the session has ended. */
  signInAgain: () => void;
  now: () => number;
}

/**
 * Keeps a signed-in person's Directus session from lapsing while the app is open, and recovers when it has. Directus's
 * session cookie lasts a day from the last sign-in or renewal (`SESSION_COOKIE_TTL`), and nothing else renews it unless
 * the Data Studio is open, so without this every read is refused a day after sign-in (sail-team#82).
 */
export function sessionKeeper({ directusUrl, fetch, signInAgain, now }: SessionKeeperOptions) {
  let armed = false;
  let ended = false;
  let lastRenewed = Number.NEGATIVE_INFINITY;
  let renewing: Promise<boolean> | null = null;

  /** Renews the session, sharing one request among everyone who asks at once. Resolves whether Directus renewed it. */
  function renew(): Promise<boolean> {
    renewing ??= fetch(`${directusUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "session" }),
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) {
          lastRenewed = now();
        }
        return response.ok;
      })
      .catch(() => false)
      .finally(() => {
        renewing = null;
      });
    return renewing;
  }

  function end() {
    if (!ended) {
      ended = true;
      signInAgain();
    }
  }

  return {
    /** Starts keeping the session, once someone's signed in. */
    arm() {
      armed = true;
      ended = false;
    },

    /** Renews the session if it's been an hour, as when the page comes back into view after a while away. */
    async renewIfDue(): Promise<void> {
      if (armed && !ended && now() - lastRenewed >= renewEveryMs) {
        await renew();
      }
    },

    /**
     * `fetch`, but a request refused for want of a session renews it and tries once more. If it can't be renewed, the
     * session has ended: it sends the browser to sign in, and the request never settles, so no page shows an error on
     * the way out. A 403 that's a real refusal is refused again, and returned.
     */
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await fetch(input, init);
      if (!armed || ended || (response.status !== 401 && response.status !== 403) || isAuth(input, directusUrl)) {
        return response;
      }
      if (await renew()) {
        return fetch(input, init);
      }
      end();
      return new Promise<Response>(() => {});
    }) satisfies Fetch,
  };
}

export type SessionKeeper = ReturnType<typeof sessionKeeper>;

function isAuth(input: RequestInfo | URL, directusUrl: string): boolean {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  return url.startsWith(`${directusUrl}/auth/`);
}
