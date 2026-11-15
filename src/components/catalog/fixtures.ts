import type { Catalog } from "@/directus/catalog";
import { catalogTables } from "@/mocks/catalog";
import { tables } from "@/mocks/plans";

type Row = Record<string, unknown>;

/** The made-up catalog, as the app reads it. */
export const catalog: Catalog = {
  areas: tables["program_areas"] as unknown as Catalog["areas"],
  products: catalogTables["products"]!.map((p) => ({
    ...(p as unknown as Catalog["products"][number]),
    programs: (p["programs"] as Row[]).map(({ google_group_id, ...program }) => ({
      ...(program as unknown as Catalog["products"][number]["programs"][number]),
      google_group: google_group_id as { name: string; email: string } | null,
    })),
  })),
  offerings: catalogTables["catalog_offerings"] as unknown as Catalog["offerings"],
  accounts: catalogTables["accounts"] as unknown as Catalog["accounts"],
  costAccounts: tables["organization_cost_accounts"] as unknown as Catalog["costAccounts"],
  qualifications: catalogTables["qualifications"]!.map((q) => ({
    id: q["id"] as string,
    name: q["name"] as string,
    covers: catalogTables["qualification_covers"]!.filter((c) => c["qualification_id"] === q["id"]).map(
      (c) => c["covers_id"] as string,
    ),
  })),
};
