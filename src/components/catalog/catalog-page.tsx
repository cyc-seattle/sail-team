import type { ReactNode } from "react";
import { SectionPage } from "@/components/section-page";

const pages = [
  { key: "products", name: "Products", to: "/catalog" },
  { key: "offerings", name: "Offerings", to: "/catalog/offerings" },
  { key: "accounts", name: "Accounts", to: "/catalog/accounts" },
  { key: "qualifications", name: "Qualifications", to: "/catalog/qualifications" },
];

export type CatalogPageKey = "products" | "offerings" | "accounts" | "qualifications";

/** One page of the Catalog. */
export function CatalogPage({ current, children }: { current: CatalogPageKey; children: ReactNode }) {
  return (
    <SectionPage title="Catalog" pages={pages} current={current}>
      {children}
    </SectionPage>
  );
}
