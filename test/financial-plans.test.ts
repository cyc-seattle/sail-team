import { describe, expect, it } from "vitest";
import {
  listOf,
  memberNet,
  membersInOrder,
  ownerOf,
  plansByYear,
  summaryRows,
  topLine,
  type FinancialPlanSummary,
  type Member,
  type PlanLine,
  type Results,
} from "../src/model/financial-plans.ts";

const line = (
  name: string,
  amount_cents: number,
  revenue: boolean,
  fn: PlanLine["function"],
  capital = false,
): Omit<PlanLine, "member"> => ({
  key: name,
  name,
  account_number: null,
  account_name: name,
  cost_center_name: "Organization",
  amount_cents,
  revenue,
  capital,
  function: fn,
});

const summary = (id: string, fields: Partial<FinancialPlanSummary>): FinancialPlanSummary => ({
  id,
  organization_id: "org",
  fiscal_year: 2027,
  name: id,
  message: null,
  status: "saved",
  saved_at: null,
  saved_by: null,
  parent: null,
  ...fields,
});

describe("plansByYear", () => {
  it("lists the newest year first, each year's drafts by name, then its saved ones, newest first", () => {
    const years = plansByYear([
      summary("Budget", { saved_at: "2027-01-01T00:00:00Z" }),
      summary("Adopted budget", { saved_at: "2027-03-01T00:00:00Z" }),
      summary("Two coaches", { status: "draft" }),
      summary("Three coaches", { status: "draft" }),
      summary("Last year", { fiscal_year: 2026 }),
    ]);
    expect(years.map((y) => [y.year, y.sets.map((s) => s.name)])).toEqual([
      [2027, ["Three coaches", "Two coaches", "Adopted budget", "Budget"]],
      [2026, ["Last year"]],
    ]);
  });
});

const member = (id: string, kind: Member["kind"], area: string | null): Member => ({
  id,
  plan_id: `${id}-plan`,
  version_id: `${id}-copy`,
  plan_name: `${id} plan`,
  kind,
  program_area_id: area,
  area_name: area,
});

describe("membersInOrder", () => {
  it("puts the Operations Plan first, then each Program Plan by its area's name", () => {
    const order = membersInOrder([
      member("y", "program_area", "Youth"),
      member("o", "operations", null),
      member("a", "program_area", "Adult"),
    ]);
    expect(order.map((m) => m.id)).toEqual(["o", "a", "y"]);
  });
});

describe("ownerOf", () => {
  const owners = {
    offeringVersion: new Map([["camp", "youth-copy"]]),
    productArea: new Map<string, string | null>([
      ["camp-product", "youth"],
      ["merch", null],
    ]),
    areaVersion: new Map([["youth", "youth-copy"]]),
    operations: "ops-copy",
  };

  it("charges an offering to its own plan, and a product or area to its area's Program Plan", () => {
    expect(ownerOf("offering", "camp", owners)).toBe("youth-copy");
    expect(ownerOf("product", "camp-product", owners)).toBe("youth-copy");
    expect(ownerOf("program_area", "youth", owners)).toBe("youth-copy");
  });

  it("charges everything else to the Operations Plan", () => {
    expect(ownerOf("product", "merch", owners)).toBe("ops-copy");
    expect(ownerOf("pool", "office", owners)).toBe("ops-copy");
    expect(ownerOf("org", null, owners)).toBe("ops-copy");
  });
});

describe("memberNet", () => {
  const results: Results = {
    live: false,
    totals: { operating_net_cents: 0, fundraising_net_cents: 0, capital_cents: 0, total_cents: 0 },
    pnl: [
      {
        level: "program_area",
        subject_key: "youth",
        name: "Youth",
        revenue_cents: 10,
        expense_cents: 4,
        net_cents: 6,
        mtdc_cents: 0,
        enrollment: 0,
        days: 0,
        sailor_days: 0,
        member: "y",
      },
    ],
    lines: [
      { ...line("Insurance", 5, false, "management"), member: "o" },
      { ...line("Merchandise", 8, true, "program"), member: "o" },
    ],
    warnings: [],
  };

  it("is a Program Plan's area net, or the Operations Plan's lines added up", () => {
    expect(memberNet(results, member("y", "program_area", "youth"))).toBe(6);
    expect(memberNet(results, member("o", "operations", null))).toBe(3);
  });
});

describe("topLine", () => {
  it("takes direct program costs from revenue for the gross, and every operating cost for the net", () => {
    const lines = [
      line("Tuition", 1_000, true, "program"),
      line("Coach wages", 300, false, "program"),
      line("Office share", 200, false, "management"),
    ];
    expect(topLine(lines)).toEqual({ revenue_cents: 1_000, expense_cents: 500, gross_cents: 700, net_cents: 500 });
  });

  it("leaves out fundraising and capital", () => {
    const lines = [
      line("Tuition", 1_000, true, "program"),
      line("Spring gala", 400, true, "fundraising"),
      line("Gala catering", 100, false, "fundraising"),
      line("Coach boat", 900, false, null, true),
    ];
    expect(topLine(lines)).toEqual({ revenue_cents: 1_000, expense_cents: 0, gross_cents: 1_000, net_cents: 1_000 });
  });
});

describe("summaryRows", () => {
  it("has a row for each program area, then Non-program, and a total of every operating line", () => {
    const members = [member("o", "operations", null), member("y", "program_area", "youth")];
    members[1]!.area_name = "Youth Racing";
    const results = {
      live: false,
      totals: { operating_net_cents: 0, fundraising_net_cents: 0, capital_cents: 0, total_cents: 0 },
      pnl: [],
      warnings: [],
      lines: [
        { ...line("Tuition", 1_000, true, "program"), member: "y" },
        { ...line("Coach wages", 400, false, "program"), member: "y" },
        { ...line("Office", 300, false, "management"), member: "o" },
        { ...line("Gala", 900, true, "fundraising"), member: "o" },
      ],
    };
    const { rows, total } = summaryRows(members, results);
    expect(rows.map((r) => [r.name, r.topLine.net_cents])).toEqual([
      ["Youth Racing", 600],
      ["Non-program", -300],
    ]);
    expect(total.topLine).toEqual({ revenue_cents: 1_000, expense_cents: 700, gross_cents: 600, net_cents: 300 });
  });
});

describe("listOf", () => {
  it("joins names as a sentence does", () => {
    expect(listOf(["a"])).toBe("a");
    expect(listOf(["a", "b"])).toBe("a and b");
    expect(listOf(["a", "b", "c"])).toBe("a, b, and c");
  });
});
