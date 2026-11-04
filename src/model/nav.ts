import type { NavItem } from "@/components/shell/app-bar";
import { canRead, type Permissions } from "@/directus/access";

/** Each section, with the collection someone must be able to read to see it. */
const sections: (NavItem & { collection: string })[] = [
  { to: "/plans", label: "Plans", collection: "plans" },
  { to: "/rosters", label: "Rosters", collection: "registrations" },
];

/** The sections to show this person. Directus still decides what each one loads. */
export function navFor(permissions: Permissions): NavItem[] {
  return sections.filter((s) => canRead(permissions, s.collection)).map(({ to, label }) => ({ to, label }));
}
