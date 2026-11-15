import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { AccountsList } from "@/components/catalog/accounts-list";
import { WithCatalog } from "./-catalog";

export const Route = createFileRoute("/catalog/accounts")({
  component: AccountsPage,
});

function AccountsPage() {
  return (
    <WithCatalog>
      {(c) => (
        <CatalogPage current="accounts">
          <AccountsList accounts={c.accounts} costAccounts={c.costAccounts} />
        </CatalogPage>
      )}
    </WithCatalog>
  );
}
