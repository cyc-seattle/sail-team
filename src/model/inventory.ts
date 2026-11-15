/** What an asset is. A sailboat or powerboat is a boat too, with a class and maybe a sail number. */
export type AssetKind = "sailboat" | "powerboat" | "motor" | "other";

export const assetKinds: { kind: AssetKind; label: string; plural: string }[] = [
  { kind: "sailboat", label: "Sailboat", plural: "Sailboats" },
  { kind: "powerboat", label: "Powerboat", plural: "Powerboats" },
  { kind: "motor", label: "Motor", plural: "Motors" },
  { kind: "other", label: "Other", plural: "Other" },
];

export const isBoat = (kind: AssetKind) => kind === "sailboat" || kind === "powerboat";

/** One boat, motor, or piece of equipment CSC owns, with its boat details when it's a boat. */
export interface Asset {
  id: string;
  kind: AssetKind;
  name: string | null;
  make: string | null;
  model: string | null;
  /** A boat's hull number (HIN), a vehicle's VIN, or a serial number. */
  identifier: string | null;
  registration_number: string | null;
  /** Book value, in cents. */
  value_cents: number | null;
  acquired_on: string | null;
  disposed_on: string | null;
  note: string | null;
  boat: { id: string; boat_class_id: string | null; sail_number: string | null } | null;
}

/** A kind of boat, such as Opti or RIB. */
export interface BoatClass {
  id: string;
  name: string;
  /** The most sailors one boat takes. 0 for a coach boat. */
  max_capacity: number;
  /** Dry-storage area one boat takes, in square feet. */
  footprint_sq_ft: number | null;
  /** Where its fuel and upkeep are booked. None books them to boat maintenance. */
  account_id: string | null;
}

/** An expense account a boat class's costs can be booked to. */
export interface Account {
  id: string;
  number: string;
  name: string;
}

/** The asset fields a person edits, without its id. */
export type AssetInput = Omit<Asset, "id" | "boat" | "disposed_on"> & {
  boat: { boat_class_id: string; sail_number: string | null } | null;
};

export type BoatClassInput = Omit<BoatClass, "id">;

/** Whether CSC still has it on `day`: acquired by then, or with no date, and not yet disposed of. */
export const inService = (asset: Pick<Asset, "acquired_on" | "disposed_on">, day: string) =>
  (asset.acquired_on === null || asset.acquired_on <= day) && (asset.disposed_on === null || asset.disposed_on > day);

const byName = new Intl.Collator("en-US", { numeric: true, sensitivity: "base" });

/** An asset's name, or else what identifies it: "Opti 12", "Zodiac 1234", "Yamaha F25". */
export function assetName(asset: Asset, classes: BoatClass[]): string {
  if (asset.name) {
    return asset.name;
  }
  const className = classes.find((c) => c.id === asset.boat?.boat_class_id)?.name;
  const parts = [className ?? asset.make, asset.boat?.sail_number ?? asset.model ?? asset.identifier];
  return parts.filter(Boolean).join(" ") || "Unnamed";
}

/** Assets by kind, then class, then name with numbers in order: Opti 2 before Opti 10. */
export function sortAssets(assets: Asset[], classes: BoatClass[]): Asset[] {
  const kindOrder = (a: Asset) => assetKinds.findIndex((k) => k.kind === a.kind);
  const classOf = (a: Asset) => classes.find((c) => c.id === a.boat?.boat_class_id)?.name ?? "";
  return [...assets].sort(
    (a, b) =>
      kindOrder(a) - kindOrder(b) ||
      byName.compare(classOf(a), classOf(b)) ||
      byName.compare(assetName(a, classes), assetName(b, classes)),
  );
}

export const sortClasses = (classes: BoatClass[]) => [...classes].sort((a, b) => byName.compare(a.name, b.name));

/** How many boats of each class CSC has on `day`, by class id. */
export function boatsInService(assets: Asset[], day: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const asset of assets) {
    const classId = asset.boat?.boat_class_id;
    if (classId && inService(asset, day)) {
      counts.set(classId, (counts.get(classId) ?? 0) + 1);
    }
  }
  return counts;
}

/** Dollars as typed, such as "1,250.50" or "$900", in cents. Null for blank, NaN for anything else. */
export function parseDollars(text: string): number | null {
  const cleaned = text.replace(/[$,\s]/g, "");
  if (cleaned === "") {
    return null;
  }
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) {
    return Number.NaN;
  }
  return Math.round(Number(cleaned) * 100);
}

/** Cents as dollars to edit: 125050 → "1250.50", 90000 → "900". */
export const dollarsText = (cents: number | null) =>
  cents === null ? "" : cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
