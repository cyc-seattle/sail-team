import { describe, expect, it } from "vitest";
import { formatCents, toneOf } from "../src/model/money.ts";

describe("formatCents", () => {
  it.each([
    [0, "$0.00"],
    [5, "$0.05"],
    [123456, "$1,234.56"],
    [-5000, "−$50.00"],
    [100000000, "$1,000,000.00"],
  ])("shows %i cents as %s", (cents, text) => {
    expect(formatCents(cents)).toBe(text);
  });
});

describe("toneOf", () => {
  it.each([
    [1, "positive"],
    [0, "zero"],
    [-1, "negative"],
  ] as const)("calls %i %s", (cents, tone) => {
    expect(toneOf(cents)).toBe(tone);
  });
});
