import { describe, expect, it } from "vitest";
import type { PlanWarning } from "../src/model/reports.ts";
import { bySeverity, distinct, kindName, placeOf, warningCount } from "../src/model/warnings.ts";

const warning = (over: Partial<PlanWarning>): PlanWarning => ({
  key: "a",
  code: "short_of_boats",
  category: "allocation",
  severity: "warning",
  subject: null,
  area: "summer",
  date: null,
  message: "a",
  ...over,
});

describe("placeOf", () => {
  it("puts a dated schedule warning in a program area on its day", () => {
    expect(placeOf(warning({ date: "2027-07-12" }))).toBe("day");
    expect(placeOf(warning({ date: "2027-07-12", area: "non-program" }))).toBe("list");
  });

  it("puts a warning about a program's product on the program, and one about break even on the offering", () => {
    expect(placeOf(warning({ code: "no_indirect_cost_rate", category: "data", subject: "p" }))).toBe("program");
    expect(placeOf(warning({ code: "breakeven_above_target", category: "data", subject: "o" }))).toBe("offering");
  });

  it("leaves a warning with nowhere to go in the table only", () => {
    expect(placeOf(warning({ code: "unknown_block", category: "data", subject: "b" }))).toBe("list");
    expect(placeOf(warning({ code: "no_indirect_cost_rate", category: "data" }))).toBe("list");
  });
});

describe("distinct", () => {
  it("keeps one of a warning the engine repeats in each plan", () => {
    const one = warning({ key: "1", date: "2027-07-12", subject: "RIB" });
    expect(distinct([one, { ...one, key: "2", area: "doublehanded" }])).toEqual([one]);
  });
});

describe("bySeverity", () => {
  it("puts errors first, then by date, an undated one first", () => {
    const sorted = [
      warning({ key: "b", date: "2027-07-13" }),
      warning({ key: "c", severity: "error", date: "2027-07-14" }),
      warning({ key: "a" }),
    ].sort(bySeverity);
    expect(sorted.map((w) => w.key)).toEqual(["c", "a", "b"]);
  });
});

describe("warningCount", () => {
  it("counts errors and warnings in words", () => {
    expect(warningCount([warning({ severity: "error" }), warning({}), warning({})])).toBe("1 error, 2 warnings");
    expect(warningCount([warning({})])).toBe("1 warning");
  });
});

describe("kindName", () => {
  it("names a known kind, and puts an unknown code in words", () => {
    expect(kindName("short_of_boats")).toBe("Too few boats");
    expect(kindName("some_new_code")).toBe("Some new code");
  });
});
