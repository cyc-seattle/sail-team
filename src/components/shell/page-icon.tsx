import {
  ChartColumnIcon,
  CircleIcon,
  ContactIcon,
  BookOpenIcon,
  HouseIcon,
  LinkIcon,
  PackageIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  "/": HouseIcon,
  "/plans": ChartColumnIcon,
  "/inventory": PackageIcon,
  "/catalog": BookOpenIcon,
  "/roster": UsersIcon,
  "/household": ContactIcon,
  "/links": LinkIcon,
};

/** A page's icon, the same in the sidebar and the tab bar. */
export function PageIcon({ to }: { to: string }) {
  const Icon = icons[to] ?? CircleIcon;
  return <Icon aria-hidden />;
}
