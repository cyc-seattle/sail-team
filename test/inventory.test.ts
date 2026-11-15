import { describe, expect, it } from "vitest";
import {
  assetName,
  boatsInService,
  dollarsText,
  inService,
  parseDollars,
  sortAssets,
  storageNeeds,
  type Asset,
  type BoatClass,
} from "../src/model/inventory.ts";

const opti: BoatClass = { id: "opti", name: "Opti", max_capacity: 1, footprint_sq_ft: 40, account_id: null };
const rib: BoatClass = { id: "rib", name: "RIB", max_capacity: 0, footprint_sq_ft: null, account_id: null };
const classes = [rib, opti];

const asset = (id: string, changes: Partial<Asset> = {}): Asset => ({
  id,
  kind: "sailboat",
  name: null,
  make: null,
  model: null,
  identifier: null,
  registration_number: null,
  value_cents: null,
  acquired_on: null,
  disposed_on: null,
  note: null,
  boat: null,
  ...changes,
});
const boat = (classId: string, sail: string | null = null) => ({
  id: `b-${classId}-${sail}`,
  boat_class_id: classId,
  sail_number: sail,
});

describe("inService", () => {
  it("counts an asset from the day it's acquired until the day it's disposed of", () => {
    const a = asset("a", { acquired_on: "2026-05-01", disposed_on: "2026-09-01" });
    expect(inService(a, "2026-04-30")).toBe(false);
    expect(inService(a, "2026-05-01")).toBe(true);
    expect(inService(a, "2026-08-31")).toBe(true);
    expect(inService(a, "2026-09-01")).toBe(false);
  });

  it("counts one with no dates always", () => {
    expect(inService(asset("a"), "2026-01-01")).toBe(true);
  });
});

describe("assetName", () => {
  it("uses its name, or else its class and sail number, or its make and model", () => {
    expect(assetName(asset("a", { name: "Scooter" }), classes)).toBe("Scooter");
    expect(assetName(asset("a", { boat: boat("opti", "12") }), classes)).toBe("Opti 12");
    expect(assetName(asset("a", { kind: "motor", make: "Yamaha", model: "F25" }), classes)).toBe("Yamaha F25");
    expect(assetName(asset("a", { kind: "other" }), classes)).toBe("Unnamed");
  });
});

describe("sortAssets", () => {
  it("sorts by kind, then class, then name with numbers in order", () => {
    const sorted = sortAssets(
      [
        asset("motor", { kind: "motor", make: "Yamaha" }),
        asset("opti10", { boat: boat("opti", "10") }),
        asset("rib", { kind: "powerboat", boat: boat("rib") }),
        asset("opti2", { boat: boat("opti", "2") }),
      ],
      classes,
    );
    expect(sorted.map((a) => a.id)).toEqual(["opti2", "opti10", "rib", "motor"]);
  });
});

describe("storageNeeds", () => {
  it("multiplies each class's boats in service by its footprint, largest first, and leaves out classes with none", () => {
    const assets = [
      asset("1", { boat: boat("opti", "1") }),
      asset("2", { boat: boat("opti", "2") }),
      asset("3", { boat: boat("opti", "3"), disposed_on: "2026-01-01" }),
      asset("4", { kind: "powerboat", boat: boat("rib") }),
    ];
    expect(boatsInService(assets, "2026-06-01")).toEqual(
      new Map([
        ["opti", 2],
        ["rib", 1],
      ]),
    );
    expect(storageNeeds(assets, [...classes, { ...opti, id: "420", name: "420" }], "2026-06-01")).toEqual([
      { boatClass: opti, boats: 2, sq_ft: 80 },
      { boatClass: rib, boats: 1, sq_ft: null },
    ]);
  });
});

describe("parseDollars", () => {
  it.each([
    ["", null],
    ["900", 90_000],
    ["$1,250.50", 125_050],
    ["12.5", 1_250],
    ["abc", Number.NaN],
    ["1.234", Number.NaN],
  ])("reads %j as %s cents", (text, cents) => {
    expect(parseDollars(text)).toBe(cents);
  });

  it("writes cents back as dollars to edit", () => {
    expect(dollarsText(90_000)).toBe("900");
    expect(dollarsText(125_050)).toBe("1250.50");
    expect(dollarsText(null)).toBe("");
  });
});
