import { ChartColumnIcon, CircleIcon, HouseIcon, UsersIcon, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = { "/": HouseIcon, "/plans": ChartColumnIcon, "/roster": UsersIcon };

/** A page's icon, the same in the sidebar and the tab bar. */
export function PageIcon({ to }: { to: string }) {
  const Icon = icons[to] ?? CircleIcon;
  return <Icon aria-hidden />;
}
