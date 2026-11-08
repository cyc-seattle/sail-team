import { describe, expect, it } from "vitest";
import { appliesTo, formatShare, plannedEnrollment } from "../src/model/assumptions.ts";

describe("plannedEnrollment", () => {
  it("is the target, or the capacity at the fill rate, rounded", () => {
    expect(plannedEnrollment({ target_enrollment: 8, capacity: 12, fill_rate: 0.5 })).toBe(8);
    expect(plannedEnrollment({ target_enrollment: null, capacity: 12, fill_rate: 0.9 })).toBe(11);
    expect(plannedEnrollment({ target_enrollment: null, capacity: null, fill_rate: 0.9 })).toBeNull();
  });
});

describe("formatShare", () => {
  it("shows a share as a percentage", () => {
    expect(formatShare(0.0525)).toBe("5.25%");
    expect(formatShare(0.1)).toBe("10%");
  });
});

describe("appliesTo", () => {
  it("names the kinds of product, or everything", () => {
    expect(appliesTo(null)).toBe("everything");
    expect(appliesTo(["program"])).toBe("programs");
    expect(appliesTo(["program", "charter", "merchandise"])).toBe("programs, charters, and merchandise");
  });
});
