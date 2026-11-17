import { Link } from "@tanstack/react-router";
import { MailIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { type ExternalLink, type NavItem, supportUrl } from "@/model/nav";
import { AccountMenu } from "./account-menu.tsx";
import { PageIcon } from "./page-icon.tsx";

const item = "min-h-tap data-[status=active]:bg-sidebar-accent data-[status=active]:font-semibold";

/**
 * Every page this person can open, then Support and their menu, with the tools their role gets. Always open on a
 * laptop; on a phone, the tab bar's More opens it as a sheet.
 */
export function AppSidebar({
  name,
  email,
  role,
  pages,
  tools,
  onSignOut,
}: {
  name: string;
  email?: string | null | undefined;
  role?: string | null | undefined;
  pages: NavItem[];
  tools: ExternalLink[];
  onSignOut: () => void;
}) {
  const { setOpenMobile } = useSidebar();
  const close = () => setOpenMobile(false);
  return (
    <Sidebar>
      <SidebarHeader className="border-b-4 border-brand-accent">
        <p className="flex min-h-tap items-center px-2 font-semibold">Sail Team</p>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Menu">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {pages.map((page) => (
                  <SidebarMenuItem key={page.to}>
                    <SidebarMenuButton
                      className={item}
                      render={<Link to={page.to} activeOptions={{ exact: page.to === "/" }} onClick={close} />}
                    >
                      <PageIcon to={page.to} />
                      <span>{page.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="min-h-tap" render={<a href={supportUrl} />}>
              <MailIcon aria-hidden />
              <span>Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <AccountMenu name={name} email={email} role={role} tools={tools} onSignOut={onSignOut} />
      </SidebarFooter>
    </Sidebar>
  );
}
