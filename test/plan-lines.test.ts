import { describe, expect, it } from "vitest";
import { line } from "../src/components/plans/fixtures.ts";
import { categories, sharedCosts, statement } from "../src/model/plan-lines.ts";

describe("categories", () => {
  it("adds up each line item by name, largest first, under its account, in account-number order", () => {
    const result = categories([
      line("Office share: Office rent", "Office", 300),
      line("Coach wages", "Coach wages", 100),
      line("Coach wages", "Coach wages", 200),
      line("Camp supplies", "Office", 500),
    ]);
    expect(result).toEqual([
      { number: "5000", name: "Coach wages", items: [{ name: "Coach wages", cents: 300 }], cents: 300 },
      {
        number: "7100",
        name: "Office",
        items: [
          { name: "Camp supplies", cents: 500 },
          { name: "Office share: Office rent", cents: 300 },
        ],
        cents: 800,
      },
    ]);
  });

  it("puts an account with no number last", () => {
    expect(categories([line("Odd", "Unnumbered", 1), line("Pay", "Coach wages", 1)]).map((c) => c.name)).toEqual([
      "Coach wages",
      "Unnumbered",
    ]);
  });
});

describe("statement", () => {
  it("splits revenue from expenses", () => {
    const { revenue, expenses } = statement([
      line("Revenue", "Tuition", 1_000, true),
      line("Coach wages", "Coach wages", 300),
    ]);
    expect(revenue.map((c) => c.name)).toEqual(["Tuition"]);
    expect(expenses.map((c) => c.name)).toEqual(["Coach wages"]);
  });
});

describe("sharedCosts", () => {
  it("adds each pool line back up from every offering's share, named for its pool", () => {
    const share = (cents: number, member: string) => ({
      ...line("G&A share: Insurance", "Insurance", cents, false, "pool:ga:insurance"),
      member,
    });
    const shared = sharedCosts([share(100, "youth"), share(50, "adult"), line("Coach wages", "Coach wages", 300)]);
    expect(shared).toHaveLength(1);
    expect(shared[0]).toMatchObject({ name: "G&A: Insurance", account_name: "Insurance", amount_cents: 150 });
  });
});
