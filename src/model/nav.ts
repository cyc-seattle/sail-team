import type { NavItem } from "@/components/shell/app-bar";
import { canRead, canSeeRosters, type Permissions } from "@/directus/access";

/** Each section, and who sees it. */
const sections: (NavItem & { shown: (permissions: Permissions) => boolean })[] = [
  { to: "/plans", label: "Plans", shown: (p) => canRead(p, "plans") },
  { to: "/roster", label: "Rosters", shown: canSeeRosters },
];

/** The sections to show this person. Directus still decides what each one loads. */
export function navFor(permissions: Permissions): NavItem[] {
  return sections.filter((s) => s.shown(permissions)).map(({ to, label }) => ({ to, label }));
}
