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
  /** The storage area where it's kept. */
  location_id: string | null;
  boat: { id: string; boat_class_id: string | null; sail_number: string | null } | null;
}

/** Where assets are kept, such as Docks, Dry Storage, or Yard Arm. */
export interface StorageArea {
  id: string;
  name: string;
  /** Its usable area, in square feet. */
  area_sq_ft: number | null;
  note: string | null;
  sort: number | null;
}

export type StorageAreaInput = Pick<StorageArea, "name" | "area_sq_ft" | "note">;

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

/** One line of a storage area: a boat class's boats, or the other assets of one kind, with the area the boats take. */
export interface StorageLine {
  key: string;
  label: string;
  count: number;
  /** Boats × the class's area. Null for assets that aren't boats, or a class with no area yet. */
  sq_ft: number | null;
}

/** A storage area, or none for what has no location, with what's kept there and the area its boats take. */
export interface StorageGroup {
  area: StorageArea | null;
  lines: StorageLine[];
  used_sq_ft: number;
  /** Boat classes kept here with no area set, so they aren't in `used_sq_ft`. */
  unmeasured: string[];
}

const areaOrder = (a: StorageArea, b: StorageArea) =>
  (a.sort ?? Number.MAX_SAFE_INTEGER) - (b.sort ?? Number.MAX_SAFE_INTEGER) || byName.compare(a.name, b.name);

/**
 * What CSC keeps in each storage area on `day`, areas in their set order, then what has no location. Within an area,
 * boats by class, then other assets by kind. Areas with nothing in them are kept, so a new one shows.
 */
export function storageByArea(
  assets: Asset[],
  classes: BoatClass[],
  areas: StorageArea[],
  day: string,
): StorageGroup[] {
  const kept = assets.filter((a) => inService(a, day));
  // An asset whose area this person can't read counts as having no location.
  const locationOf = (a: Asset) => (areas.some((x) => x.id === a.location_id) ? a.location_id : null);
  const groupOf = (area: StorageArea | null): StorageGroup => {
    const here = kept.filter((a) => locationOf(a) === (area?.id ?? null));
    const boatLines = sortClasses(classes)
      .map((c): StorageLine => {
        const count = here.filter((a) => a.boat?.boat_class_id === c.id).length;
        return {
          key: c.id,
          label: c.name,
          count,
          sq_ft: c.footprint_sq_ft === null ? null : count * c.footprint_sq_ft,
        };
      })
      .filter((l) => l.count > 0);
    const otherLines = assetKinds
      .map((k): StorageLine => ({
        key: k.kind,
        label: k.plural,
        count: here.filter((a) => a.kind === k.kind && !a.boat?.boat_class_id).length,
        sq_ft: null,
      }))
      .filter((l) => l.count > 0);
    return {
      area,
      lines: [...boatLines, ...otherLines],
      used_sq_ft: boatLines.reduce((sum, l) => sum + (l.sq_ft ?? 0), 0),
      unmeasured: boatLines.filter((l) => l.sq_ft === null).map((l) => l.label),
    };
  };
  const groups = [...areas].sort(areaOrder).map(groupOf);
  const unplaced = groupOf(null);
  return unplaced.lines.length > 0 ? [...groups, unplaced] : groups;
}
