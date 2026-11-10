import { canRead, canSeeHousehold, canSeeRosters, type Permissions } from "@/directus/access";

/** A page of this app. */
export interface NavItem {
  to: string;
  label: string;
}

/** Each section, and who sees it. */
const sections: (NavItem & { shown: (permissions: Permissions) => boolean })[] = [
  { to: "/plans", label: "Planning", shown: (p) => canRead(p, "plans") },
  { to: "/roster", label: "Rosters", shown: canSeeRosters },
  { to: "/household", label: "Household", shown: canSeeHousehold },
];

/** The roles that see more links, least first. Any other role sees only the links everyone sees. */
const ranks = ["Crew", "Staff", "Admin"];

function rank(role: string | undefined): number {
  // Directus's own Administrator role holds only the first admin account.
  return ranks.indexOf(role === "Administrator" ? "Admin" : (role ?? ""));
}

/**
 * Sites outside this app, and where to ask for help, on the home page and in the Links menu. A link with `from` is
 * only for that role and the roles above it (cyc-seattle/sail-team#55).
 */
function links(directusUrl: string): (ExternalLink & { from?: string })[] {
  return [
    { href: "https://theclubspot.com/dashboard/acct/nw6IMf9Bnq/", label: "Clubspot dashboard", from: "Crew" },
    { href: directusUrl, label: "Directus", from: "Staff" },
    { href: "https://calendar.google.com", label: "Google Calendar" },
    { href: "mailto:info@cyccommunitysailing.org", label: "Support" },
  ];
}

/** The links this person's role sees. Directus still decides what Clubspot and Directus show them. */
export function linksFor(role: string | undefined, directusUrl: string): ExternalLink[] {
  return links(directusUrl)
    .filter(({ from }) => from === undefined || rank(role) >= rank(from))
    .map(({ href, label }) => ({ href, label }));
}

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

/** The home page's links for this person: their sections, then the links their role sees. */
export function homeLinksFor(permissions: Permissions, links: ExternalLink[]): HomeLink[] {
  return [...navFor(permissions), ...links];
}
