import { describe, expect, it } from "vitest";
import { formatDate } from "../src/model/dates.ts";

describe("formatDate", () => {
  it("writes the date in Seattle's time", () => {
    expect(formatDate("2027-03-03T18:00:00Z")).toBe("March 3, 2027");
    // Early on March 4 in UTC is still March 3 in Seattle.
    expect(formatDate("2027-03-04T05:00:00Z")).toBe("March 3, 2027");
  });

  it("is empty for no timestamp", () => {
    expect(formatDate(null)).toBe("");
  });
});
