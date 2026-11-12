import { describe, expect, it } from "vitest";
import type { PlanWarning } from "../src/model/reports.ts";
import { kindName, warningsByKind } from "../src/model/warnings.ts";

const warning = (key: string, code: string, category: PlanWarning["category"], date: string | null): PlanWarning => ({
  key,
  code,
  category,
  area: "summer",
  date,
  message: key,
});

describe("warningsByKind", () => {
  it("groups by schedule, then data, then kind, the most common first, each kind by date", () => {
    const groups = warningsByKind([
      warning("c", "no_rate", "data", null),
      warning("b", "over_capacity", "allocation", "2027-07-13"),
      warning("d", "closed_date", "allocation", "2027-07-05"),
      warning("a", "over_capacity", "allocation", "2027-07-12"),
      warning("e", "some_new_code", null, null),
    ]);
    expect(groups.map((g) => [g.name, g.kinds.map((k) => [k.name, k.warnings.map((w) => w.key).join("")])])).toEqual([
      [
        "Schedule",
        [
          ["Too many sailors", "ab"],
          ["On a closed day", "d"],
        ],
      ],
      [
        "Data",
        [
          ["Some new code", "e"],
          ["Trip rate missing", "c"],
        ],
      ],
    ]);
  });

  it("leaves out a category with no warnings", () => {
    expect(warningsByKind([warning("a", "no_rate", "data", null)]).map((g) => g.name)).toEqual(["Data"]);
  });
});

describe("kindName", () => {
  it("names a kind the app doesn't know by its code in words", () => {
    expect(kindName("over_capacity")).toBe("Too many sailors");
    expect(kindName("brand_new")).toBe("Brand new");
  });
});
