import type { ReactNode } from "react";
import { SectionPage } from "@/components/section-page";

const pages = [
  { key: "assets", name: "Assets", to: "/inventory" },
  { key: "classes", name: "Boat classes", to: "/inventory/classes" },
  { key: "storage", name: "Storage", to: "/inventory/storage" },
];

export type InventoryPageKey = "assets" | "classes" | "storage";

/** One page of Inventory. */
export function InventoryPage({
  current,
  actions,
  children,
}: {
  current: InventoryPageKey;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SectionPage title="Inventory" pages={pages} current={current} actions={actions}>
      {children}
    </SectionPage>
  );
}
