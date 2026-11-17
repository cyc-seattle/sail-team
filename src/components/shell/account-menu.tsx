import { CircleUserIcon, ExternalLinkIcon, LogOutIcon } from "lucide-react";
import { ThemeMenuItems } from "@/components/theme-menu-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { ExternalLink } from "@/model/nav";

/**
 * The signed-in person's menu, at the foot of the sidebar, with the tools their role gets. It names the account they
 * signed in with, its email and role, so someone with two emails can tell which they're using. A long name or email is
 * cut short to fit. Sign out also ends an admin's impersonation (platform's docs/access.md).
 */
export function AccountMenu({
  name,
  email,
  role,
  tools = [],
  onSignOut,
}: {
  name: string;
  email?: string | null | undefined;
  role?: string | null | undefined;
  tools?: ExternalLink[];
  onSignOut: () => void;
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton className="min-h-tap" />}>
            <CircleUserIcon aria-hidden />
            <span>{name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="break-all">
                <span className="block">Signed in as {name}</span>
                {email && email !== name && <span className="block font-normal">{email}</span>}
                {role && <span className="block font-normal">Role: {role}</span>}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {tools.length > 0 && (
              <>
                <DropdownMenuGroup>
                  {tools.map((tool) => (
                    <DropdownMenuItem key={tool.href} render={<a href={tool.href} />}>
                      <ExternalLinkIcon aria-hidden />
                      {tool.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <ThemeMenuItems />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>
              <LogOutIcon aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
