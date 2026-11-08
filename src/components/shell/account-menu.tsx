import { CircleUserIcon } from "lucide-react";
import { ThemeMenuItems } from "@/components/theme-menu-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

/** The signed-in person's menu, at the foot of the sidebar. A long name or email is cut short to fit. */
export function AccountMenu({ name }: { name: string }) {
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
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
