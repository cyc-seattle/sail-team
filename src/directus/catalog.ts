import { queryOptions } from "@tanstack/react-query";
import type {
  CatalogAccount,
  CatalogArea,
  CatalogOffering,
  CatalogProduct,
  CatalogProgram,
  CostAccount,
  Qualification,
} from "@/model/catalog";
import { canRead, type Permissions } from "./access.ts";
import { readAll } from "./plans.ts";

export interface Catalog {
  areas: CatalogArea[];
  products: CatalogProduct[];
  offerings: CatalogOffering[];
  accounts: CatalogAccount[];
  costAccounts: CostAccount[];
  qualifications: Qualification[];
}

type ProgramRow = Omit<CatalogProgram, "google_group"> & { google_group_id: { name: string; email: string } | null };
type ProductRow = Omit<CatalogProduct, "programs"> & { programs: ProgramRow[] };

/** Every row of `table`, or none when the person can't read it, so one page needn't wait on a table it doesn't show. */
const readIf = <T>(permissions: Permissions | undefined, table: string, fields: string[], filter?: object) =>
  canRead(permissions, table) ? readAll<T>(table, filter, fields) : Promise.resolve([] as T[]);

/** The catalog: program areas, products with their programs, offerings, the chart of accounts, and qualifications. */
export const catalogQuery = (permissions: Permissions | undefined) =>
  queryOptions({
    queryKey: ["catalog"],
    queryFn: async (): Promise<Catalog> => {
      const [areas, products, offerings, accounts, costAccounts, qualifications, covers] = await Promise.all([
        readIf<CatalogArea>(permissions, "program_areas", ["id", "name", "revenue_account_id"]),
        readIf<ProductRow>(permissions, "products", [
          "id",
          "name",
          "kind",
          "program_area_id",
          "revenue_account_id",
          "programs.id",
          "programs.name",
          "programs.team",
          "programs.color",
          ...(canRead(permissions, "google_groups")
            ? ["programs.google_group_id.name", "programs.google_group_id.email"]
            : []),
        ]),
        readIf<CatalogOffering>(permissions, "offerings", [
          "id",
          "name",
          "product_id",
          "starts_on",
          "ends_on",
          "price_cents",
          "capacity",
          "archived_at",
        ]),
        readIf<CatalogAccount>(permissions, "accounts", [
          "id",
          "number",
          "name",
          "type",
          "form_990_part",
          "form_990_line",
          "default_function",
          "parent_id",
          "contra_account_id",
          "retired",
        ]),
        readIf<CostAccount>(permissions, "organization_cost_accounts", ["cost_type", "account_id"]),
        readIf<{ id: string; name: string }>(permissions, "qualifications", ["id", "name"]),
        readIf<{ qualification_id: string; covers_id: string }>(permissions, "qualification_covers", [
          "qualification_id",
          "covers_id",
        ]),
      ]);
      return {
        areas,
        products: products.map(({ programs, ...product }) => ({
          ...product,
          programs: (programs ?? []).map(({ google_group_id, ...program }) => ({
            ...program,
            // A group's id comes back alone when the person can't read groups.
            google_group: google_group_id && typeof google_group_id === "object" ? google_group_id : null,
          })),
        })),
        offerings,
        accounts,
        costAccounts,
        qualifications: qualifications.map((q) => ({
          ...q,
          covers: covers.filter((c) => c.qualification_id === q.id).map((c) => c.covers_id),
        })),
      };
    },
  });
