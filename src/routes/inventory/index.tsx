import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AssetList } from "@/components/inventory/asset-list";
import { InventoryPage } from "@/components/inventory/inventory-page";
import { NoAccess } from "@/components/shell/no-access";
import { canWrite } from "@/directus/access";
import { createAsset, deleteAsset, disposeAsset, inventoryQuery, updateAsset } from "@/directus/inventory";
import { today } from "@/model/financial-plans";
import { useInventoryAccess, useRefreshInventory } from "./-inventory";

export const Route = createFileRoute("/inventory/")({
  component: Assets,
});

function Assets() {
  const { allowed } = useInventoryAccess();
  return allowed ? <AllAssets /> : <NoAccess what="inventory" />;
}

function AllAssets() {
  const { permissions } = useInventoryAccess();
  const refresh = useRefreshInventory();
  const { data } = useSuspenseQuery(inventoryQuery);
  // Adding a boat writes its boat details too.
  const canCreate = canWrite(permissions, "assets", "create") && canWrite(permissions, "boats", "create");
  return (
    <InventoryPage current="assets">
      <AssetList
        assets={data.assets}
        classes={data.classes}
        areas={data.areas}
        day={today()}
        actions={{
          canCreate,
          canUpdate: canWrite(permissions, "assets", "update"),
          canDelete: canWrite(permissions, "assets", "delete"),
          onCreate: async (input) => {
            await createAsset(input);
            await refresh();
          },
          onUpdate: async (asset, input) => {
            await updateAsset(asset, input);
            await refresh();
          },
          onDispose: async (asset, on) => {
            await disposeAsset(asset.id, on);
            await refresh();
          },
          onDelete: async (asset) => {
            await deleteAsset(asset);
            await refresh();
          },
        }}
      />
    </InventoryPage>
  );
}
