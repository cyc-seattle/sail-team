import type { NavItem } from "@/components/shell/app-bar";
import { canRead, type Permissions } from "@/directus/access";

/** Each section, with the collection someone must be able to read to see it. */
const sections: (NavItem & { collection: string })[] = [
  { to: "/plans", label: "Plans", collection: "plans" },
  { to: "/roster", label: "Rosters", collection: "registrations" },
];

/** Sites outside this app, which everyone sees on the home page. */
export const externalLinks: HomeLink[] = [
  { href: "https://theclubspot.com", label: "Clubspot" },
  { href: "https://calendar.google.com", label: "Google Calendar" },
];

/** A link on the home page: a section of this app, or another site. */
export type HomeLink = NavItem | { href: string; label: string };

/** The sections to show this person. Directus still decides what each one loads. */
export function navFor(permissions: Permissions): NavItem[] {
  return sections.filter((s) => canRead(permissions, s.collection)).map(({ to, label }) => ({ to, label }));
}

/** The home page's links for this person: their sections, then other sites the team uses. */
export function homeLinksFor(permissions: Permissions): HomeLink[] {
  return [...navFor(permissions), ...externalLinks];
}
