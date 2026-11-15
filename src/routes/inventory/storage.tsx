import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { InventoryPage } from "@/components/inventory/inventory-page";
import { StorageList } from "@/components/inventory/storage-list";
import { NoAccess } from "@/components/shell/no-access";
import { canRead } from "@/directus/access";
import { activeRatesQuery, inventoryQuery } from "@/directus/inventory";
import { today } from "@/model/financial-plans";
import { storageNeeds } from "@/model/inventory";
import { useInventoryAccess } from "./-inventory";

export const Route = createFileRoute("/inventory/storage")({
  component: Storage,
});

function Storage() {
  const { allowed } = useInventoryAccess();
  return allowed ? <DryStorage /> : <NoAccess what="inventory" />;
}

function DryStorage() {
  const { permissions } = useInventoryAccess();
  const { data } = useSuspenseQuery(inventoryQuery);
  // The active plan comes with its rates, which anyone who reads plans reads.
  const active = useQuery({ ...activeRatesQuery, enabled: canRead(permissions, "plan_boat_rates") });
  return (
    <InventoryPage current="storage">
      <StorageList needs={storageNeeds(data.assets, data.classes, today())} activePlan={active.data?.plan ?? null} />
    </InventoryPage>
  );
}
