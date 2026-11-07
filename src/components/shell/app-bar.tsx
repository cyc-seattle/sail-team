import { Link } from "@tanstack/react-router";
import { CircleUserIcon } from "lucide-react";
import { ThemeMenuItems } from "@/components/theme-menu-items";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NavItem {
  to: string;
  label: string;
}

/** The top of every page: the app's name, linking home, the sections this person can see, and their menu. */
export function AppBar({ name, nav }: { name: string; nav: NavItem[] }) {
  return (
    <header className="border-b-4 border-brand-accent bg-brand text-brand-foreground">
      <div className="mx-auto flex min-h-tap max-w-6xl items-center gap-4 px-card">
        <Link to="/" className="inline-flex min-h-tap items-center font-semibold underline-offset-4 hover:underline">
          CYC Sail Team
        </Link>
        <nav aria-label="Sections" className="flex flex-1 gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex min-h-tap items-center rounded-md px-2 text-sm underline-offset-4 hover:underline data-[status=active]:font-semibold data-[status=active]:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="min-h-tap text-brand-foreground hover:bg-brand-foreground/10" />}
          >
            <CircleUserIcon />
            {name}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Signed in as {name}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <ThemeMenuItems />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
