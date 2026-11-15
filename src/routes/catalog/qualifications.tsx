import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { QualificationsList } from "@/components/catalog/qualifications-list";
import { WithCatalog } from "./-catalog";

export const Route = createFileRoute("/catalog/qualifications")({
  component: QualificationsPage,
});

function QualificationsPage() {
  return (
    <WithCatalog>
      {(c) => (
        <CatalogPage current="qualifications">
          <QualificationsList qualifications={c.qualifications} />
        </CatalogPage>
      )}
    </WithCatalog>
  );
}
