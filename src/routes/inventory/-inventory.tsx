import { useQueryClient } from "@tanstack/react-query";
import { canRead, type Permissions } from "@/directus/access";
import { useSession } from "@/directus/use-session";

/** The signed-in person's permissions, or undefined, and whether they can open Inventory at all. */
export function useInventoryAccess(): { permissions: Permissions | undefined; allowed: boolean } {
  const session = useSession();
  const permissions = session.kind === "signed-in" ? session.permissions : undefined;
  return { permissions, allowed: canRead(permissions, "assets") };
}

/** Reads the inventory again after a change. */
export function useRefreshInventory() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["inventory"] });
}
