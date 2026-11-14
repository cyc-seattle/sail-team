import { ExternalLinkIcon } from "lucide-react";
import type { SiteLink } from "@/directus/links";

/** `https://www.example.org/a` → `example.org`. */
function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** The Links page's sites, each a card with the site's own preview, its note or the site's description, and its domain. */
export function LinkList({ links }: { links: SiteLink[] }) {
  if (links.length === 0) {
    return <p className="text-sm text-muted-foreground">No links yet.</p>;
  }
  return (
    <ul className="grid gap-card sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => {
        const text = link.note ?? link.preview_description;
        return (
          <li key={link.id}>
            <a
              href={link.url}
              className="flex h-full flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border hover:ring-ring"
            >
              {link.preview_image && (
                <img src={link.preview_image} alt="" className="aspect-[1.91/1] w-full bg-muted object-cover" />
              )}
              <span className="grid gap-1 p-card">
                <span className="flex items-center gap-2 text-base font-medium">
                  {link.title}
                  <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </span>
                {text && <span className="line-clamp-2 text-sm text-muted-foreground">{text}</span>}
                <span className="text-xs text-muted-foreground">{domainOf(link.url)}</span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
