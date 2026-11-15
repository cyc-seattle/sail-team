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
  it("puts offerings under their program, with numbers in order", () => {
    const groups = offeringsByProgram(
      [
        { id: "1", name: "week 10", program_id: "p-g" },
        { id: "2", name: "week 2", program_id: "p-g" },
      ],
      [product("g", "Guppies", "summer"), product("j", "J-Pod", "dh")],
    );
    expect(groups.map((g) => [g.program.name, g.offerings.map((o) => o.name)])).toEqual([
      ["Guppies", ["week 2", "week 10"]],
    ]);
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
