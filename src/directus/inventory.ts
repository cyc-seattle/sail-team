import { createItem, deleteItem, updateItem } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import { inForce, today } from "@/model/financial-plans";
import type { Account, Asset, AssetInput, BoatClass, BoatClassInput } from "@/model/inventory";
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
  "boats.id",
  "boats.boat_class_id",
  "boats.sail_number",
];

type AssetRow = Omit<Asset, "boat"> & { boats: NonNullable<Asset["boat"]>[] };

/**
 * Every asset, each with its boat details, every boat class, the expense accounts a class can book to, and the one it
 * books to by default.
 */
export const inventoryQuery = queryOptions({
  queryKey: ["inventory"],
  queryFn: async (): Promise<{
    assets: Asset[];
    classes: BoatClass[];
    accounts: Account[];
    defaultAccountId: string | null;
  }> => {
    const [assets, classes, accounts, costAccounts] = await Promise.all([
      readAll<AssetRow>("assets", undefined, assetFields),
      readAll<BoatClass>("boat_classes", undefined, ["id", "name", "max_capacity", "footprint_sq_ft", "account_id"]),
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
      accounts: accounts.sort((a, b) => a.number.localeCompare(b.number)),
      defaultAccountId: costAccounts[0]?.account_id ?? null,
    };
  },
});

/** What a boat of each class costs in the active Financial Plan, by class id. */
export interface BoatRate {
  maintenance_per_boat_hour_cents: number;
  fuel_per_hour_cents: number | null;
  charter_per_day_cents: number | null;
}

export interface ActiveRates {
  plan: { id: string; name: string };
  rates: Map<string, BoatRate>;
}

/** The boat rates in the Operations Plan of the plan active today, or null when no plan is active. */
export const activeRatesQuery = queryOptions({
  queryKey: ["inventory", "active-rates"],
  queryFn: async (): Promise<ActiveRates | null> => {
    const sets = await readAll<{
      id: string;
      name: string;
      organization_id: string;
      fiscal_year: number;
      effective_from: string | null;
    }>("financial_plans", { effective_from: { _nnull: true } }, [
      "id",
      "name",
      "organization_id",
      "fiscal_year",
      "effective_from",
    ]);
    const now = [...inForce(sets, today())].find(([, when]) => when.when === "now");
    const active = sets.find((s) => s.id === now?.[0]);
    if (!active) {
      return null;
    }
    const [operations] = await readAll<{ id: string }>(
      "plans",
      { _and: [{ financial_plan_id: { _eq: active.id } }, { kind: { _eq: "operations" } }] },
      ["id"],
    );
    const rows = operations
      ? await readAll<BoatRate & { boat_class_id: string }>("plan_boat_rates", { plan_id: { _eq: operations.id } }, [
          "boat_class_id",
          "maintenance_per_boat_hour_cents",
          "fuel_per_hour_cents",
          "charter_per_day_cents",
        ])
      : [];
    return {
      plan: { id: active.id, name: active.name },
      rates: new Map(rows.map(({ boat_class_id, ...rate }) => [boat_class_id, rate])),
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
