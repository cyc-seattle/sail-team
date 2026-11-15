import type { ReactNode } from "react";
import { PageHeader } from "@/components/plans/page-header";
import { SectionNav, type SectionPage as Page } from "@/components/section-nav";

/** One page of a section such as Inventory: the section's title, its buttons, the page switcher, then the page. */
export function SectionPage({
  title,
  pages,
  current,
  actions,
  children,
}: {
  title: string;
  pages: Page[];
  current: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-card">
      <PageHeader title={title} actions={actions} />
      <SectionNav label={`${title} pages`} pages={pages} current={current} />
      <div className="grid gap-12">{children}</div>
    </main>
  );
}
