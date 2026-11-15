import type { ReactNode } from "react";
import { PageHeader } from "@/components/plans/page-header";
import { SectionNav } from "@/components/section-nav";

const pages = [
  { key: "assets", name: "Assets", to: "/inventory" },
  { key: "classes", name: "Boat classes", to: "/inventory/classes" },
  { key: "storage", name: "Dry storage", to: "/inventory/storage" },
];

export type InventoryPageKey = "assets" | "classes" | "storage";

/** One page of Inventory: the section's title, its buttons, the page switcher, then the page. */
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
    <main className="mx-auto grid max-w-6xl gap-6 p-card">
      <PageHeader title="Inventory" actions={actions} />
      <SectionNav label="Inventory pages" pages={pages} current={current} />
      <div className="grid gap-12">{children}</div>
    </main>
  );
}
