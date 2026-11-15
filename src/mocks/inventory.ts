// Made-up boats and equipment, for local work and tests. Never real club data.
import { tables } from "./plans";

type Row = Record<string, unknown>;

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/** The dry storage one boat of each class takes, by name. The keelboats are on moorings. */
const footprints: Record<string, number | null> = { Opti: 40, Sailqube: 60, "420": 85, RIB: 120, Keelboat: null };

const classes: Row[] = tables["boat_classes"]!.map((c) => ({ ...c, footprint_sq_ft: footprints[c["name"] as string] }));
const className = (classId: unknown) => classes.find((c) => c["id"] === classId)!["name"] as string;

/** Where the club keeps things, in the order a Catalog Writer set. */
const areas: Row[] = [
  { id: id(9600), name: "Docks", area_sq_ft: "2000.00", note: "The dinghy float and the RIB slips.", sort: 1 },
  { id: id(9601), name: "Dry Storage", area_sq_ft: "3500.00", note: null, sort: 2 },
  { id: id(9602), name: "Yard Arm", area_sq_ft: "1200.00", note: null, sort: 3 },
];
const [docks, dry, yard] = areas.map((a) => a["id"]);

/** Where each class's boats are kept. */
const locations: Record<string, unknown> = { Opti: dry, Sailqube: dry, "420": dry, RIB: docks, Keelboat: docks };

/** Each class's make and what one is worth. */
const makes: Record<string, [string, number]> = {
  Opti: ["McLaughlin", 350_000],
  Sailqube: ["Rotomod", 420_000],
  "420": ["Zim", 1_100_000],
  RIB: ["Zodiac", 1_800_000],
  Keelboat: ["J/Boats", 4_500_000],
};

/** The planning engine's fleet, with the details the asset list shows. */
const boats: Row[] = tables["boats"]!.map((b, i) => {
  const name = className(b["boat_class_id"]);
  return { ...b, sail_number: name === "RIB" ? null : String(1000 + i) };
});

const fleet: Row[] = tables["assets"]!.map((a, i) => {
  const boat = boats.find((b) => b["asset_id"] === a["id"])!;
  const name = className(boat["boat_class_id"]);
  const [make, value] = makes[name]!;
  return {
    ...a,
    name: name === "RIB" ? `Coach ${(i % 8) + 1}` : null,
    make,
    model: null,
    identifier: `${make.slice(0, 3).toUpperCase()}${String(48_000 + i)}`,
    registration_number: name === "RIB" ? `WN ${4400 + i} CS` : null,
    value_cents: value - (i % 4) * 25_000,
    acquired_on: `20${18 + (i % 7)}-0${(i % 9) + 1}-15`,
    note: i === 0 ? "New sail in 2026, from the **spring appeal**." : null,
    location_id: locations[name],
    boats: [boat],
  };
});

const extra = (n: number, row: Row): Row => ({
  id: id(7900 + n),
  name: null,
  make: null,
  model: null,
  identifier: null,
  registration_number: null,
  value_cents: null,
  acquired_on: null,
  disposed_on: null,
  note: null,
  location_id: null,
  boats: [],
  ...row,
});

/** Motors, a trailer, and an Opti CSC no longer has. */
const others: Row[] = [
  extra(1, {
    kind: "motor",
    make: "Yamaha",
    model: "F25",
    identifier: "6BP-1023345",
    value_cents: 380_000,
    acquired_on: "2022-04-01",
    location_id: yard,
  }),
  extra(2, {
    kind: "motor",
    make: "Yamaha",
    model: "F25",
    identifier: "6BP-1023346",
    value_cents: 380_000,
    acquired_on: "2022-04-01",
    location_id: yard,
  }),
  extra(3, {
    kind: "motor",
    make: "Honda",
    model: "BF40",
    identifier: "BAZJ-1100457",
    value_cents: 610_000,
    acquired_on: "2024-03-12",
  }),
  extra(4, {
    kind: "other",
    name: "Opti trailer",
    make: "Dynamic",
    identifier: "1D9BS1214PA",
    registration_number: "4TR 812",
    value_cents: 260_000,
    acquired_on: "2019-05-20",
    location_id: yard,
  }),
  extra(5, {
    kind: "other",
    name: "Club van",
    make: "Ford",
    model: "Transit",
    identifier: "1FTBR1C82LKA1",
    registration_number: "CDX 4021",
    value_cents: 2_150_000,
    acquired_on: "2020-08-03",
  }),
  extra(6, {
    kind: "sailboat",
    make: "McLaughlin",
    identifier: "MCL00412",
    value_cents: 0,
    acquired_on: "2012-06-01",
    disposed_on: "2025-10-01",
    note: "Hull cracked; scrapped.",
    boats: [
      {
        id: id(8900),
        asset_id: id(7906),
        boat_class_id: classes.find((c) => c["name"] === "Opti")!["id"],
        sail_number: "412",
      },
    ],
  }),
];

/** The asset list's tables, as Directus returns them, each asset with its boat details. */
export const inventoryTables: Record<string, Row[]> = {
  boat_classes: classes,
  storage_areas: areas,
  assets: [...fleet, ...others],
  boats: [...boats, ...others.flatMap((a) => a["boats"] as Row[])],
};
