import { describe, expect, it, vi } from "vitest";
import { renewEveryMs, sessionKeeper } from "../src/directus/keep-session.ts";

const directusUrl = "https://directus.example.org";
const plans = `${directusUrl}/items/plans`;
const refresh = `${directusUrl}/auth/refresh`;

/** A Directus that answers each address with the next status in its list, then repeats the last one. */
function directus(statuses: Record<string, number[]>) {
  const calls: string[] = [];
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const queue = statuses[url] ?? [200];
    const status = queue.length > 1 ? queue.shift()! : queue[0]!;
    return new Response(status === 204 ? null : "{}", { status });
  });
  return { fetch, calls };
}

function setup(statuses: Record<string, number[]>, now = () => 0) {
  const server = directus(statuses);
  const signInAgain = vi.fn();
  const keeper = sessionKeeper({ directusUrl, fetch: server.fetch, signInAgain, now });
  return { keeper, signInAgain, calls: server.calls };
}

const settled = (promise: Promise<unknown>) =>
  Promise.race([promise.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 10))]);

describe("sessionKeeper", () => {
  it("leaves a refusal alone until someone's signed in", async () => {
    const { keeper, calls } = setup({ [plans]: [401] });
    expect((await keeper.fetch(plans)).status).toBe(401);
    expect(calls).toEqual([plans]);
  });

  it("renews a lapsed session and tries the request again", async () => {
    const { keeper, signInAgain, calls } = setup({ [plans]: [403, 200] });
    keeper.arm();
    expect((await keeper.fetch(plans)).status).toBe(200);
    expect(calls).toEqual([plans, refresh, plans]);
    expect(signInAgain).not.toHaveBeenCalled();
  });

  it("returns a real refusal once the session is renewed", async () => {
    const { keeper, signInAgain } = setup({ [plans]: [403] });
    keeper.arm();
    expect((await keeper.fetch(plans)).status).toBe(403);
    expect(signInAgain).not.toHaveBeenCalled();
  });

  it("sends the browser to sign in once the session has ended, and shows no error on the way", async () => {
    const { keeper, signInAgain, calls } = setup({ [plans]: [403], [refresh]: [401] });
    keeper.arm();
    expect(await settled(keeper.fetch(plans))).toBe(false);
    expect(await settled(keeper.fetch(plans))).toBe(true);
    expect(signInAgain).toHaveBeenCalledOnce();
    expect(calls).toEqual([plans, refresh, plans]);
  });

  it("renews once for every request refused at the same time", async () => {
    const { keeper, calls } = setup({ [plans]: [401, 401, 200] });
    keeper.arm();
    await Promise.all([keeper.fetch(plans), keeper.fetch(plans)]);
    expect(calls.filter((c) => c === refresh)).toHaveLength(1);
  });

  it("never renews for a refused sign-in request", async () => {
    const { keeper, calls } = setup({ [refresh]: [401] });
    keeper.arm();
    expect((await keeper.fetch(refresh)).status).toBe(401);
    expect(calls).toEqual([refresh]);
  });

  it("renews an hour after the last renewal, and not before", async () => {
    let now = 0;
    const { keeper, calls } = setup({}, () => now);
    await keeper.renewIfDue();
    expect(calls).toEqual([]);
    keeper.arm();
    await keeper.renewIfDue();
    now = renewEveryMs - 1;
    await keeper.renewIfDue();
    now = renewEveryMs;
    await keeper.renewIfDue();
    expect(calls).toEqual([refresh, refresh]);
  });
});
