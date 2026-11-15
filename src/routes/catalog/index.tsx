import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { ProductsList } from "@/components/catalog/products-list";
import { WithCatalog } from "./-catalog";

export const Route = createFileRoute("/catalog/")({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <WithCatalog>
      {(c) => (
        <CatalogPage current="products">
          <ProductsList areas={c.areas} products={c.products} accounts={c.accounts} />
        </CatalogPage>
      )}
    </WithCatalog>
  );
}
