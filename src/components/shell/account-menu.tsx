import { CircleUserIcon, LogOutIcon } from "lucide-react";
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

/**
 * The signed-in person's menu, at the foot of the sidebar. A long name or email is cut short to fit. Sign out also ends
 * an admin's impersonation (platform's docs/access.md).
 */
export function AccountMenu({ name, onSignOut }: { name: string; onSignOut: () => void }) {
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
              <DropdownMenuLabel className="break-all">Signed in as {name}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
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
