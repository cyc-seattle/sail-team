import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon, MailIcon } from "lucide-react";
import type { HomeLink } from "@/model/nav";

const card =
  "flex min-h-tap items-center gap-2 rounded-lg bg-card p-card font-medium ring-1 ring-border hover:ring-ring";

/** The home page's list of links, one per row. */
export function LinkList({ links }: { links: HomeLink[] }) {
  return (
    <ul className="grid max-w-md gap-2">
      {links.map((link) => (
        <li key={link.label}>
          {"to" in link ? (
            <Link to={link.to} className={card}>
              {link.label}
            </Link>
          ) : (
            <a href={link.href} className={card}>
              {link.label}
              {link.href.startsWith("mailto:") ? (
                <MailIcon className="size-4 text-muted-foreground" aria-hidden />
              ) : (
                <ExternalLinkIcon className="size-4 text-muted-foreground" aria-hidden />
              )}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
