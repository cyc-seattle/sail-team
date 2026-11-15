import { describe, expect, it } from "vitest";
import {
  fromOlderEngine,
  inForce,
  platformRelease,
  refreshEvery,
  today,
  type Results,
} from "../src/model/financial-plans.ts";

describe("refreshEvery", () => {
  const draft = { status: "draft" as const };
  const frozen = { status: "frozen" as const };
  const results = { calculated_at: null } as unknown as Results;

  it("reads a draft again every few seconds, since its numbers change wherever its plans are changed", () => {
    expect(refreshEvery({ set: draft, results }, false)).toBe(5_000);
  });

  it("reads a plan whose numbers are missing again sooner, then less often once they've been missing a while", () => {
    expect(refreshEvery({ set: draft, results: null }, false)).toBe(2_000);
    expect(refreshEvery({ set: frozen, results: null }, false)).toBe(2_000);
    expect(refreshEvery({ set: draft, results: null }, true)).toBe(5_000);
  });

  it("stops reading a frozen plan once its numbers are in, and a plan that isn't there", () => {
    expect(refreshEvery({ set: frozen, results }, false)).toBe(false);
    expect(refreshEvery(null, false)).toBe(false);
  });
});

describe("fromOlderEngine", () => {
  const today = "1.39.0+engine.new";
  const draft = { status: "draft" as const };
  const frozen = { status: "frozen" as const };

  it("tells a draft whose numbers came from another engine, or from before platform recorded one", () => {
    expect(fromOlderEngine({ set: draft, results: { platform_version: "1.38.1+engine.old" } }, today)).toBe(true);
    expect(fromOlderEngine({ set: draft, results: { platform_version: "1.39.0+engine.old" } }, today)).toBe(true);
    expect(fromOlderEngine({ set: draft, results: { platform_version: null } }, today)).toBe(true);
    expect(fromOlderEngine({ set: draft, results: { platform_version: today } }, today)).toBe(false);
  });

  it("doesn't tell a draft whose engine is the same in an older release", () => {
    expect(fromOlderEngine({ set: draft, results: { platform_version: "1.38.1+engine.new" } }, today)).toBe(false);
  });

  it("never tells a frozen plan, one with no numbers yet, or any while platform's engine is unknown", () => {
    expect(fromOlderEngine({ set: frozen, results: { platform_version: "1.38.1+engine.old" } }, today)).toBe(false);
    expect(fromOlderEngine({ set: draft, results: null }, today)).toBe(false);
    expect(fromOlderEngine({ set: draft, results: { platform_version: null } }, null)).toBe(false);
  });
});

describe("platformRelease", () => {
  it("gives the release, without the engine's hash", () => {
    expect(platformRelease("3.0.0+engine.0a1b2c3d4e5f")).toBe("3.0.0");
  });

  it("gives nothing for results with no version", () => {
    expect(platformRelease(null)).toBeNull();
  });
});

describe("inForce", () => {
  const plan = (id: string, effective_from: string | null, fiscal_year = 2027, organization_id = "org") => ({
    id,
    organization_id,
    fiscal_year,
    effective_from,
  });

  it("puts in force the plan with the latest date on or before the day, until the next one's date", () => {
    const plans = [plan("budget", "2026-07-01"), plan("fall", "2026-09-01"), plan("draft", null)];
    expect(Object.fromEntries(inForce(plans, "2026-08-31"))).toEqual({
      budget: { when: "now", from: "2026-07-01", to: "2026-08-31" },
      fall: { when: "later", from: "2026-09-01", to: null },
    });
    expect(Object.fromEntries(inForce(plans, "2026-09-01"))).toEqual({
      budget: { when: "past", from: "2026-07-01", to: "2026-08-31" },
      fall: { when: "now", from: "2026-09-01", to: null },
    });
  });

  it("keeps each organization's year apart", () => {
    const plans = [
      plan("2027", "2026-07-01"),
      plan("2028", "2027-07-01", 2028),
      plan("other", "2026-08-01", 2027, "x"),
    ];
    const forces = inForce(plans, "2027-08-01");
    expect(forces.get("2027")).toEqual({ when: "now", from: "2026-07-01", to: null });
    expect(forces.get("2028")?.when).toBe("now");
    expect(forces.get("other")?.when).toBe("now");
  });

  it("puts none in force before the first date", () => {
    expect(inForce([plan("budget", "2026-07-01")], "2026-06-30").get("budget")?.when).toBe("later");
  });
});

describe("today", () => {
  it("is Seattle's date, not UTC's", () => {
    expect(today(new Date("2026-11-14T06:00:00Z"))).toBe("2026-11-13");
  });
});
