import { describe, expect, it } from "vitest";
import {
  form990,
  offeringsByProgram,
  productsByArea,
  sortAccounts,
  type CatalogAccount,
  type CatalogProduct,
} from "../src/model/catalog.ts";

const product = (id: string, name: string, area: string | null, programs = true): CatalogProduct => ({
  id,
  name,
  kind: programs ? "program" : "storage_lease",
  program_area_id: area,
  revenue_account_id: null,
  programs: programs ? [{ id: `p-${id}`, name, team: false, color: null, google_group: null }] : [],
});

describe("productsByArea", () => {
  it("groups products under their area, areas by name, then the products in none, and drops empty areas", () => {
    const areas = [
      { id: "summer", name: "Summer", revenue_account_id: null },
      { id: "dh", name: "Doublehanded", revenue_account_id: null },
      { id: "empty", name: "Adult", revenue_account_id: null },
    ];
    const groups = productsByArea(areas, [
      product("g", "Guppies", "summer"),
      product("j", "J-Pod", "dh"),
      product("a", "Adventure Camp", "summer"),
      product("s", "Boat storage", null, false),
    ]);
    expect(groups.map((g) => [g.area?.name ?? null, g.products.map((p) => p.name)])).toEqual([
      ["Doublehanded", ["J-Pod"]],
      ["Summer", ["Adventure Camp", "Guppies"]],
      [null, ["Boat storage"]],
    ]);
  });
});

describe("offeringsByProgram", () => {
  const offering = (
    id: string,
    name: string,
    starts_on: string,
    ends_on: string,
    archived_at: string | null = null,
  ) => ({
    id,
    name,
    program_id: "p-g",
    starts_on,
    ends_on,
    price_cents: 67500,
    capacity: 12,
    archived_at,
  });

  it("puts offerings under their program, by the day they start, then by name with numbers in order", () => {
    const groups = offeringsByProgram(
      [
        offering("1", "Week 10", "2027-08-23", "2027-08-27"),
        offering("2", "Week 2", "2027-06-28", "2027-07-02"),
        offering("3", "Week 1b", "2027-06-21", "2027-06-25"),
        offering("4", "Week 1a", "2027-06-21", "2027-06-25"),
      ],
      [product("g", "Guppies", "summer"), product("j", "J-Pod", "dh")],
      "2026-11-21",
    );
    expect(groups.map((g) => [g.program.name, g.offerings.map((o) => o.name)])).toEqual([
      ["Guppies", ["Week 1a", "Week 1b", "Week 2", "Week 10"]],
    ]);
  });

  it("leaves out an offering that has ended, or is archived", () => {
    const groups = offeringsByProgram(
      [
        offering("1", "Last summer", "2026-06-22", "2026-06-26"),
        offering("2", "Cancelled", "2027-06-21", "2027-06-25", "2026-11-01T00:00:00Z"),
        offering("3", "Ends today", "2026-11-01", "2026-11-21"),
      ],
      [product("g", "Guppies", "summer")],
      "2026-11-21",
    );
    expect(groups.flatMap((g) => g.offerings.map((o) => o.name))).toEqual(["Ends today"]);
  });
});

describe("accounts", () => {
  const account = (number: string, part: string | null, line: string | null): CatalogAccount => ({
    id: number,
    number,
    name: number,
    type: "expense",
    form_990_part: part,
    form_990_line: line,
    default_function: null,
    parent_id: null,
    contra_account_id: null,
    retired: false,
  });

  it("sorts by number", () => {
    expect(sortAccounts([account("6110", null, null), account("5010", null, null)]).map((a) => a.number)).toEqual([
      "5010",
      "6110",
    ]);
  });

  it("says where an account goes on Form 990", () => {
    expect(form990(account("5010", "IX", "7"))).toBe("Part IX, line 7");
    expect(form990(account("5010", "IX", null))).toBe("Part IX");
    expect(form990(account("5010", null, null))).toBe("");
  });
});
