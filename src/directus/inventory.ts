import { createItem, customEndpoint, deleteItem, updateItem } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import type {
  Account,
  Asset,
  AssetInput,
  BoatClass,
  BoatClassInput,
  StorageArea,
  StorageAreaInput,
} from "@/model/inventory";
import { appDirectus } from "./app.ts";
import { readAll } from "./plans.ts";

const assetFields = [
  "id",
  "kind",
  "name",
  "make",
  "model",
  "identifier",
  "registration_number",
  "value_cents",
  "acquired_on",
  "disposed_on",
  "note",
  "location_id",
  "boats.id",
  "boats.boat_class_id",
  "boats.sail_number",
];

type AssetRow = Omit<Asset, "boat"> & { boats: NonNullable<Asset["boat"]>[] };

/**
 * Every asset, each with its boat details, every boat class, every storage area, the expense accounts a class can book
 * to, and the one it books to by default.
 */
export const inventoryQuery = queryOptions({
  queryKey: ["inventory"],
  queryFn: async (): Promise<{
    assets: Asset[];
    classes: BoatClass[];
    areas: StorageArea[];
    accounts: Account[];
    defaultAccountId: string | null;
  }> => {
    const [assets, classes, areas, accounts, costAccounts] = await Promise.all([
      readAll<AssetRow>("assets", undefined, assetFields),
      readAll<BoatClass>("boat_classes", undefined, ["id", "name", "max_capacity", "footprint_sq_ft", "account_id"]),
      readAll<StorageArea>("storage_areas", undefined, ["id", "name", "area_sq_ft", "note", "sort"]),
      readAll<Account>("accounts", { type: { _eq: "expense" } }, ["id", "number", "name"]),
      // Where a class with no account of its own books its boats' upkeep.
      readAll<{ account_id: string }>("organization_cost_accounts", { cost_type: { _eq: "boat_maintenance" } }, [
        "account_id",
      ]),
    ]);
    return {
      assets: assets.map(({ boats, ...asset }) => ({ ...asset, boat: boats?.[0] ?? null })),
      // Directus sends a decimal as a string.
      classes: classes.map((c) => ({
        ...c,
        footprint_sq_ft: c.footprint_sq_ft === null ? null : Number(c.footprint_sq_ft),
      })),
      areas: areas.map((a) => ({ ...a, area_sq_ft: a.area_sq_ft === null ? null : Number(a.area_sq_ft) })),
      accounts: accounts.sort((a, b) => a.number.localeCompare(b.number)),
      defaultAccountId: costAccounts[0]?.account_id ?? null,
    };
  },
});

const client = () => appDirectus().client;

/** A new asset, and its boat details with it when it's a boat, in one request, so the two never disagree. */
export async function createAsset({ boat, ...fields }: AssetInput): Promise<void> {
  await client().request(createItem("assets", { ...fields, boats: boat ? [boat] : [] }));
}

/** Changes an asset, and adds, changes, or removes its boat details to match its kind, in one request. */
export async function updateAsset(asset: Asset, { boat, ...fields }: AssetInput): Promise<void> {
  const boats = boat
    ? asset.boat
      ? { create: [], update: [{ id: asset.boat.id, ...boat }], delete: [] }
      : { create: [boat], update: [], delete: [] }
    : { create: [], update: [], delete: asset.boat ? [asset.boat.id] : [] };
  await client().request(updateItem("assets", asset.id, { ...fields, boats }));
}

/** Records the day CSC sold, scrapped, or gave it away, or clears it to bring it back. */
export async function disposeAsset(id: string, on: string | null): Promise<void> {
  await client().request(updateItem("assets", id, { disposed_on: on }));
}

/** Deletes an asset entered by mistake, its boat details first, since Directus won't leave them behind. */
export async function deleteAsset(asset: Asset): Promise<void> {
  if (asset.boat) {
    await client().request(deleteItem("boats", asset.boat.id));
  }
  await client().request(deleteItem("assets", asset.id));
}

// Directus takes a decimal as a string.
const classRow = ({ footprint_sq_ft, ...input }: BoatClassInput) => ({
  ...input,
  footprint_sq_ft: footprint_sq_ft === null ? null : String(footprint_sq_ft),
});

export async function createBoatClass(input: BoatClassInput): Promise<void> {
  await client().request(createItem("boat_classes", classRow(input)));
}

export async function updateBoatClass(id: string, input: BoatClassInput): Promise<void> {
  await client().request(updateItem("boat_classes", id, classRow(input)));
}

const areaRow = ({ area_sq_ft, ...input }: StorageAreaInput) => ({
  ...input,
  area_sq_ft: area_sq_ft === null ? null : String(area_sq_ft),
});

/** A new storage area, last in the order. */
export async function createStorageArea(input: StorageAreaInput): Promise<void> {
  await client().request(customEndpoint({ path: "/items/storage_areas", method: "POST", body: JSON.stringify(areaRow(input)) }));
}

export async function updateStorageArea(id: string, input: StorageAreaInput): Promise<void> {
  await client().request(
    customEndpoint({ path: `/items/storage_areas/${id}`, method: "PATCH", body: JSON.stringify(areaRow(input)) }),
  );
}
