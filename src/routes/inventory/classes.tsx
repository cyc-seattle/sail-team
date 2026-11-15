import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BoatClassList } from "@/components/inventory/boat-class-list";
import { InventoryPage } from "@/components/inventory/inventory-page";
import { NoAccess } from "@/components/shell/no-access";
import { canWrite } from "@/directus/access";
import { createBoatClass, inventoryQuery, updateBoatClass } from "@/directus/inventory";
import { today } from "@/model/financial-plans";
import { boatsInService } from "@/model/inventory";
import { useInventoryAccess, useRefreshInventory } from "./-inventory";

export const Route = createFileRoute("/inventory/classes")({
  component: BoatClasses,
});

function BoatClasses() {
  const { allowed } = useInventoryAccess();
  return allowed ? <AllClasses /> : <NoAccess what="inventory" />;
}

function AllClasses() {
  const { permissions } = useInventoryAccess();
  const refresh = useRefreshInventory();
  const { data } = useSuspenseQuery(inventoryQuery);
  return (
    <InventoryPage current="classes">
      <BoatClassList
        classes={data.classes}
        accounts={data.accounts}
        defaultAccountId={data.defaultAccountId}
        counts={boatsInService(data.assets, today())}
        actions={{
          canCreate: canWrite(permissions, "boat_classes", "create"),
          canUpdate: canWrite(permissions, "boat_classes", "update"),
          onCreate: async (input) => {
            await createBoatClass(input);
            await refresh();
          },
          onUpdate: async (boatClass, input) => {
            await updateBoatClass(boatClass.id, input);
            await refresh();
          },
        }}
      />
    </InventoryPage>
  );
}
