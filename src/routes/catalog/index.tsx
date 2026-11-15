import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { ProgramsList } from "@/components/catalog/programs-list";
import { WithCatalog } from "./-catalog";

export const Route = createFileRoute("/catalog/")({
  component: ProgramsPage,
});

function ProgramsPage() {
  return (
    <WithCatalog>
      {(c) => (
        <CatalogPage current="programs">
          <ProgramsList areas={c.areas} products={c.products} accounts={c.accounts} />
        </CatalogPage>
      )}
    </WithCatalog>
  );
}
