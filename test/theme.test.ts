import { describe, expect, it } from "vitest";
import { isDark, readChoice } from "../src/lib/theme.ts";

describe("readChoice", () => {
  it.each(["light", "dark"] as const)("keeps a saved %s", (choice) => {
    expect(readChoice(choice)).toBe(choice);
  });

  it.each([null, "", "sepia"])("follows the device for %j", (saved) => {
    expect(readChoice(saved)).toBe("device");
  });
});

describe("isDark", () => {
  it.each([
    ["light", false, false],
    ["light", true, false],
    ["dark", false, true],
    ["dark", true, true],
    ["device", false, false],
    ["device", true, true],
  ] as const)("is %s with the device dark %s: %s", (choice, deviceIsDark, dark) => {
    expect(isDark(choice, deviceIsDark)).toBe(dark);
  });
});
