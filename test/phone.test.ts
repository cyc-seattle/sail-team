import { describe, expect, it } from "vitest";
import { formatPhone, toE164 } from "../src/model/phone.ts";

describe("formatPhone", () => {
  it.each([
    ["2065550110", "(206) 555-0110"],
    ["12065550110", "(206) 555-0110"],
    ["+1 206 555 0110", "(206) 555-0110"],
    ["+442079460958", "+44 20 7946 0958"],
    ["555", "555"],
    ["not a phone", "not a phone"],
  ])("shows %s as %s", (stored, shown) => {
    expect(formatPhone(stored)).toBe(shown);
  });
});

describe("toE164", () => {
  it.each([
    ["2065550110", "+12065550110"],
    ["12065550110", "+12065550110"],
    ["+44 20 7946 0958", "+442079460958"],
    ["555", undefined],
    [null, undefined],
  ])("reads %s as %s", (stored, e164) => {
    expect(toE164(stored)).toBe(e164);
  });
});
