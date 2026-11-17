import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { ExternalLink, NavItem } from "@/model/nav";
import { AppSidebar } from "./app-sidebar.tsx";
import { TabBar } from "./tab-bar.tsx";

/** Every signed-in page: the sidebar beside it on a laptop, the tab bar under it on a phone. */
export function AppShell({
  name,
  email,
  role,
  pages,
  tools,
  onSignOut,
  children,
}: {
  name: string;
  email?: string | null | undefined;
  role?: string | null | undefined;
  pages: NavItem[];
  tools: ExternalLink[];
  onSignOut: () => void;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar name={name} email={email} role={role} pages={pages} tools={tools} onSignOut={onSignOut} />
      {/* Clears the phone's tab bar, so it never covers the end of a page. */}
      <div className="min-w-0 flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      <TabBar pages={pages} />
    </SidebarProvider>
  );
}
