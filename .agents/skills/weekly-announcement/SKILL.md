---
name: weekly-announcement
description: Write the week's Sail Team announcement, a roundup of what changed since the last one, from the PRs merged since then, and post it on the home page through the Directus MCP. Use when asked for a changelog announcement, a weekly roundup, or "what's new" on the home page.
---

# The weekly announcement

The home page lists `announcements` from Directus, newest first (`src/directus/announcements.ts`). Once a week or so,
one announcement rounds up what changed since the last. Never post one per change.

## Find what changed

1. Read the newest announcement through the Directus MCP: `items` on `announcements`, `sort: ["-published_on"]`,
   `limit: 1`, fields `title`, `body`, `published_on`. With none, start from the last two weeks.
2. List what merged since that day, in this repo and in platform:

   ```sh
   gh pr list --repo cyc-seattle/sail-team --state merged --search "merged:>=<published_on>" --json number,title,body,mergedAt
   gh pr list --repo cyc-seattle/platform --state merged --search "merged:>=<published_on>" --json number,title,body,mergedAt
   ```

3. Keep only what a CSC staffer, coach or parent would notice in the app: a new page, something they can now do, a
   fix to something that bothered them. Drop `ci`, `test`, `docs`, `chore` and refactors, and anything behind the scenes.
   With nothing left, say so and post nothing.

## Write it

Write every word with the `ui-copy` skill from [cyc-seattle/agent-skills](https://github.com/cyc-seattle/agent-skills).

- `title`: a few plain words for the week's biggest change, such as "Rosters on your phone". No dates or version numbers.
- `body`: Markdown. One short sentence to open, then a bullet for each change, most noticed first. Say what someone can
  do now and where, in their words: "Search every team's roster by a sailor's name." Name pages as the sidebar does.
- No PR numbers, issue links, field names or tech words. Never "the club"; say CSC, or name the team or program.
- `published_on`: today, as `YYYY-MM-DD`. It's required.

## Post it

Show the title, body and date to the person, and post only once they say so. Then create it through the Directus MCP:
`items`, action `create`, collection `announcements`, with `title`, `body`, and `published_on`. Directus decides
whether they may write announcements. Open the home page afterwards to check it reads well, newest first.
