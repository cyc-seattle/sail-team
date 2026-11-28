import { createFileRoute, Link } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { OfferingsList } from "@/components/catalog/offerings-list";
import { buttonVariants } from "@/components/ui/button";
import { canWrite } from "@/directus/access";
import { useSession } from "@/directus/use-session";
import { seattleToday } from "@/model/roster";
import { WithCatalog } from "./-catalog";

export const Route = createFileRoute("/catalog/offerings")({
  component: OfferingsPage,
});

function OfferingsPage() {
  const session = useSession();
  const permissions = session.kind === "signed-in" ? session.permissions : undefined;
  // Only a Catalog Writer can apply what the sync shows.
  const sync = canWrite(permissions, "offerings", "update") && (
    <Link to="/catalog/offerings/sync" className={buttonVariants({ variant: "outline" })}>
      Sync from plan
    </Link>
  );
  return (
    <WithCatalog>
      {(c) => (
        <CatalogPage current="offerings">
          <OfferingsList offerings={c.offerings} products={c.products} today={seattleToday()} actions={sync} />
        </CatalogPage>
      )}
    </WithCatalog>
  );
}
