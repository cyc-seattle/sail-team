import { canRead, canSeeRosters, type Permissions } from "@/directus/access";

/** A page of this app. */
export interface NavItem {
  to: string;
  label: string;
}

/** Each section, and who sees it. */
const sections: (NavItem & { shown: (permissions: Permissions) => boolean })[] = [
  { to: "/plans", label: "Plans", shown: (p) => canRead(p, "plans") },
  { to: "/roster", label: "Rosters", shown: canSeeRosters },
];

/** Sites outside this app, which everyone sees on the home page. */
export const externalLinks: ExternalLink[] = [
  { href: "https://theclubspot.com", label: "Clubspot" },
  { href: "https://calendar.google.com", label: "Google Calendar" },
];

/** Another site the team uses. */
export interface ExternalLink {
  href: string;
  label: string;
}

/** A link on the home page: a section of this app, or another site. */
export type HomeLink = NavItem | ExternalLink;

/** The sections to show this person. Directus still decides what each one loads. */
export function navFor(permissions: Permissions): NavItem[] {
  return sections.filter((s) => s.shown(permissions)).map(({ to, label }) => ({ to, label }));
}

/** Every page this person can open, starting with home, for the sidebar and the phone's tab bar. */
export function pagesFor(permissions: Permissions): NavItem[] {
  return [{ to: "/", label: "Home" }, ...navFor(permissions)];
}

/** The home page's links for this person: their sections, then other sites the team uses. */
export function homeLinksFor(permissions: Permissions): HomeLink[] {
  return [...navFor(permissions), ...externalLinks];
}
