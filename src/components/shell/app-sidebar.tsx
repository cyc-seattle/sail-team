import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon, MailIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { externalLinks, type NavItem } from "@/model/nav";
import { AccountMenu } from "./account-menu.tsx";
import { PageIcon } from "./page-icon.tsx";

const item = "min-h-tap data-[status=active]:bg-sidebar-accent data-[status=active]:font-semibold";

/**
 * Every page this person can open, other sites the team uses, and their menu. Always open on a laptop; on a phone,
 * the tab bar's More opens it as a sheet.
 */
export function AppSidebar({ name, pages }: { name: string; pages: NavItem[] }) {
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
          <SidebarGroup>
            <SidebarGroupLabel>Other sites</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {externalLinks.map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton className={item} render={<a href={link.href} />}>
                      {link.href.startsWith("mailto:") ? <MailIcon aria-hidden /> : <ExternalLinkIcon aria-hidden />}
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <AccountMenu name={name} />
      </SidebarFooter>
    </Sidebar>
  );
}
