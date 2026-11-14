import Markdown, { type Components } from "react-markdown";
import type { Announcement } from "@/directus/announcements";
import { formatDay } from "@/model/dates";

// An announcement's own headings sit under its title, so they're never bigger than it.
const body: Components = {
  h1: ({ children }) => <h3 className="text-sm font-semibold">{children}</h3>,
  h2: ({ children }) => <h3 className="text-sm font-semibold">{children}</h3>,
  h3: ({ children }) => <h4 className="text-sm font-semibold">{children}</h4>,
  a: ({ children, href }) => (
    <a href={href} className="text-link underline">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
};

/** The home page's announcements, newest first, each with its date. A body's raw HTML is dropped, never drawn. */
export function AnnouncementList({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) {
    return <p className="text-sm text-muted-foreground">No announcements yet.</p>;
  }
  return (
    <ul className="grid max-w-2xl gap-card">
      {announcements.map((a) => (
        <li key={a.id}>
          <article className="grid gap-2 rounded-xl bg-card p-card ring-1 ring-border">
            <header className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h2 className="text-base font-medium">{a.title}</h2>
              <time dateTime={a.published_on} className="text-xs text-muted-foreground">
                {formatDay(a.published_on)}
              </time>
            </header>
            {a.body && (
              <div className="grid gap-2 text-sm">
                <Markdown skipHtml components={body}>
                  {a.body}
                </Markdown>
              </div>
            )}
          </article>
        </li>
      ))}
    </ul>
  );
}
