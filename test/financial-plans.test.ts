import { describe, expect, it } from "vitest";
import { refreshEvery, type Results } from "../src/model/financial-plans.ts";

describe("refreshEvery", () => {
  const draft = { status: "draft" as const };
  const saved = { status: "saved" as const };
  const results = { calculated_at: null } as unknown as Results;

  it("reads a draft again every few seconds, since its numbers change wherever its plans are changed", () => {
    expect(refreshEvery({ set: draft, results }, false)).toBe(5_000);
  });

  it("reads a plan whose numbers are missing again sooner, then less often once they've been missing a while", () => {
    expect(refreshEvery({ set: draft, results: null }, false)).toBe(2_000);
    expect(refreshEvery({ set: saved, results: null }, false)).toBe(2_000);
    expect(refreshEvery({ set: draft, results: null }, true)).toBe(5_000);
  });

  it("stops reading a saved plan once its numbers are in, and a plan that isn't there", () => {
    expect(refreshEvery({ set: saved, results }, false)).toBe(false);
    expect(refreshEvery(null, false)).toBe(false);
  });
});
