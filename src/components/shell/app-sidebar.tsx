import { Link } from "@tanstack/react-router";
import { ChevronDownIcon, ExternalLinkIcon, LinkIcon, MailIcon } from "lucide-react";
import { useState } from "react";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { ExternalLink, NavItem } from "@/model/nav";
import { AccountMenu } from "./account-menu.tsx";
import { PageIcon } from "./page-icon.tsx";

const item = "min-h-tap data-[status=active]:bg-sidebar-accent data-[status=active]:font-semibold";

/**
 * Every page this person can open, Links to the other sites their role sees, and their menu. Always open on a laptop;
 * on a phone, the tab bar's More opens it as a sheet.
 */
export function AppSidebar({
  name,
  pages,
  links,
  onSignOut,
}: {
  name: string;
  pages: NavItem[];
  links: ExternalLink[];
  onSignOut: () => void;
}) {
  const { setOpenMobile } = useSidebar();
  const [linksOpen, setLinksOpen] = useState(false);
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
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={item}
                    aria-expanded={linksOpen}
                    aria-controls="sidebar-links"
                    onClick={() => setLinksOpen(!linksOpen)}
                  >
                    <LinkIcon aria-hidden />
                    <span>Links</span>
                    <ChevronDownIcon
                      aria-hidden
                      className={linksOpen ? "ml-auto rotate-180 transition-transform" : "ml-auto transition-transform"}
                    />
                  </SidebarMenuButton>
                  {linksOpen && (
                    <SidebarMenuSub id="sidebar-links">
                      {links.map((link) => (
                        <SidebarMenuSubItem key={link.href}>
                          <SidebarMenuSubButton className="min-h-tap" href={link.href}>
                            {link.href.startsWith("mailto:") ? (
                              <MailIcon aria-hidden />
                            ) : (
                              <ExternalLinkIcon aria-hidden />
                            )}
                            <span>{link.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <AccountMenu name={name} onSignOut={onSignOut} />
      </SidebarFooter>
    </Sidebar>
  );
}
