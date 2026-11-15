import type { Account, Asset, BoatClass } from "@/model/inventory";
import { inventoryTables } from "@/mocks/inventory";
import { tables } from "@/mocks/plans";

type Row = Record<string, unknown>;

/** The made-up fleet, as the app reads it. */
export const assets: Asset[] = inventoryTables["assets"]!.map(({ boats, ...a }) => ({
  ...(a as unknown as Omit<Asset, "boat">),
  boat: ((boats as Row[])[0] as unknown as Asset["boat"]) ?? null,
}));

export const classes = inventoryTables["boat_classes"] as unknown as BoatClass[];

export const accounts = (tables["accounts"] as unknown as (Account & { type: string })[]).filter(
  (a) => a.type === "expense",
);

/** Where a class with no account of its own books its boats' upkeep. */
export const defaultAccountId = (
  tables["organization_cost_accounts"] as { cost_type: string; account_id: string }[]
).find((c) => c.cost_type === "boat_maintenance")!.account_id;

/** A day after every made-up asset was acquired, and after the scrapped Opti went. */
export const day = "2026-11-15";
