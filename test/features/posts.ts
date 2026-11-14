import { asAdmin, newRunId } from "./support";

// Made-up announcements and links on dev, for the home page's and Links' journeys, each titled so a later run can find
// and delete what an earlier one left.

const prefix = "Journey ";

/** A day, `days` before today, as `YYYY-MM-DD`. */
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

export class Posts {
  private readonly run = newRunId();
  private readonly made: { collection: "announcements" | "links"; id: string }[] = [];

  /** Posts an announcement `days` ago, and gives back its title. */
  async announce(days: number): Promise<string> {
    const title = `${prefix}${this.run} news from ${days === 0 ? "today" : `${days} days ago`}`;
    const { id } = await asAdmin("POST", "/items/announcements", {
      title,
      body: "The dock is open.",
      published_on: daysAgo(days),
    });
    this.made.push({ collection: "announcements", id });
    return title;
  }

  /** Adds a link everyone reads, and gives back its title. */
  async link(url: string): Promise<string> {
    const title = `${prefix}${this.run} link`;
    const { id } = await asAdmin("POST", "/items/links", { title, url, note: "A site the team uses." });
    this.made.push({ collection: "links", id });
    return title;
  }

  async cleanUp(): Promise<void> {
    for (const { collection, id } of this.made.reverse()) {
      await asAdmin("DELETE", `/items/${collection}/${id}`);
    }
  }
}

/** Deletes what earlier runs posted and never cleaned up. */
export async function cleanUpStalePosts(): Promise<void> {
  for (const collection of ["announcements", "links"]) {
    const filter = encodeURIComponent(JSON.stringify({ title: { _starts_with: prefix } }));
    const stale: { id: string }[] = await asAdmin("GET", `/items/${collection}?filter=${filter}&fields=id&limit=-1`);
    for (const { id } of stale) {
      await asAdmin("DELETE", `/items/${collection}/${id}`);
    }
  }
}
