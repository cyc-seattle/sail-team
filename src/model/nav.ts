import { canRead, canSeeHousehold, canSeeRosters, type Permissions } from "@/directus/access";

/** A page of this app. */
export interface NavItem {
  to: string;
  label: string;
}

/** Each section, and who sees it. */
const sections: (NavItem & { shown: (permissions: Permissions) => boolean })[] = [
  { to: "/plans", label: "Planning", shown: (p) => canRead(p, "plans") },
  { to: "/inventory", label: "Inventory", shown: (p) => canRead(p, "assets") },
  { to: "/roster", label: "Rosters", shown: canSeeRosters },
  { to: "/household", label: "Household", shown: canSeeHousehold },
];

/** Where to ask for help, at the foot of the sidebar. */
export const supportUrl = "mailto:info@cyccommunitysailing.org";

/** The roles that get more tools, least first. Any other role gets none. */
const ranks = ["Crew", "Staff", "Admin"];

function rank(role: string | undefined): number {
  // Directus's own Administrator role holds only the first admin account.
  return ranks.indexOf(role === "Administrator" ? "Admin" : (role ?? ""));
}

/**
 * Sites for one role and the roles above it, in the account menu (cyc-seattle/sail-team#55). Links everyone sees are
 * on the Links page, from Directus.
 */
function tools(directusUrl: string): (ExternalLink & { from: string })[] {
  return [
    { href: "https://theclubspot.com/dashboard/acct/nw6IMf9Bnq/", label: "Clubspot dashboard", from: "Crew" },
    { href: directusUrl, label: "Directus", from: "Staff" },
    // Authentik's users page, where an admin impersonates someone (platform's docs/access.md).
    { href: `${loginUrlFor(directusUrl)}/if/admin/#/identity/users`, label: "Sign in as someone", from: "Admin" },
  ];
}

/** Authentik, beside Directus: `https://directus.cycsail.team` → `https://login.cycsail.team`. */
function loginUrlFor(directusUrl: string): string {
  return directusUrl.replace("://directus.", "://login.");
}

/** The tools this person's role gets. Directus still decides what Clubspot and Directus show them. */
export function toolsFor(role: string | undefined, directusUrl: string): ExternalLink[] {
  return tools(directusUrl)
    .filter(({ from }) => rank(role) >= rank(from))
    .map(({ href, label }) => ({ href, label }));
}

/** Another site the team uses. */
export interface ExternalLink {
  href: string;
  label: string;
}

/** The sections to show this person. Directus still decides what each one loads. */
export function navFor(permissions: Permissions): NavItem[] {
  return sections.filter((s) => s.shown(permissions)).map(({ to, label }) => ({ to, label }));
}

/** Every page this person can open, from Home to Links, for the sidebar and the phone's tab bar. */
export function pagesFor(permissions: Permissions): NavItem[] {
  return [{ to: "/", label: "Home" }, ...navFor(permissions), { to: "/links", label: "Links" }];
}
