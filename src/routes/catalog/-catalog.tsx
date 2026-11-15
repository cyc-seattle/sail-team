import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { NoAccess } from "@/components/shell/no-access";
import { canRead } from "@/directus/access";
import { catalogQuery, type Catalog } from "@/directus/catalog";
import { useSession } from "@/directus/use-session";

/** A Catalog page's content, from the catalog, for someone who can read it; otherwise a page saying they can't. */
export function WithCatalog({ children }: { children: (catalog: Catalog) => ReactNode }) {
  const session = useSession();
  const permissions = session.kind === "signed-in" ? session.permissions : undefined;
  if (!canRead(permissions, "accounts")) {
    return <NoAccess what="the catalog" />;
  }
  return <Loaded permissions={permissions}>{children}</Loaded>;
}

function Loaded({
  permissions,
  children,
}: {
  permissions: Parameters<typeof catalogQuery>[0];
  children: (catalog: Catalog) => ReactNode;
}) {
  const { data } = useSuspenseQuery(catalogQuery(permissions));
  return children(data);
}
