import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { InventoryPage } from "@/components/inventory/inventory-page";
import { StorageList } from "@/components/inventory/storage-list";
import { NoAccess } from "@/components/shell/no-access";
import { canWrite } from "@/directus/access";
import { createStorageArea, inventoryQuery, updateStorageArea } from "@/directus/inventory";
import { today } from "@/model/financial-plans";
import { storageByArea } from "@/model/inventory";
import { useInventoryAccess, useRefreshInventory } from "./-inventory";

export const Route = createFileRoute("/inventory/storage")({
  component: Storage,
});

function Storage() {
  const { allowed } = useInventoryAccess();
  return allowed ? <StorageAreas /> : <NoAccess what="inventory" />;
}

function StorageAreas() {
  const { permissions } = useInventoryAccess();
  const refresh = useRefreshInventory();
  const { data } = useSuspenseQuery(inventoryQuery);
  return (
    <InventoryPage current="storage">
      <StorageList
        groups={storageByArea(data.assets, data.classes, data.areas, today())}
        actions={{
          canCreate: canWrite(permissions, "storage_areas", "create"),
          canUpdate: canWrite(permissions, "storage_areas", "update"),
          onCreate: async (input) => {
            await createStorageArea(input);
            await refresh();
          },
          onUpdate: async (area, input) => {
            await updateStorageArea(area.id, input);
            await refresh();
          },
        }}
      />
    </InventoryPage>
  );
}
