import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { OfferingsList } from "@/components/catalog/offerings-list";
import { seattleToday } from "@/model/roster";
import { WithCatalog } from "./-catalog";

export const Route = createFileRoute("/catalog/offerings")({
  component: OfferingsPage,
});

function OfferingsPage() {
  return (
    <WithCatalog>
      {(c) => (
        <CatalogPage current="offerings">
          <OfferingsList offerings={c.offerings} products={c.products} today={seattleToday()} />
        </CatalogPage>
      )}
    </WithCatalog>
  );
}
