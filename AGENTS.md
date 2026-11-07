# AGENTS.md

Guidance for coding agents working in this repository.

## Overview

`sail-team` is the club's web app at `cycsail.team`. It's a single-page React app, built by Vite into static files and
served by Caddy on the club's cluster. It has no server of its own. The browser talks to Directus
([cyc-seattle/platform](https://github.com/cyc-seattle/platform)) with the user's own session, and Directus decides what
each person can see and change. The app adds no security of its own.

The app is taking `cycsail.team` over from isthmia's portal (#1). It claims the whole domain, and puts its built files
under `/_app` (`vite.config.ts`). Until the portal's route is gone, the Gateway still gives the portal every path but
`/plans`, `/roster`, `/rosters`, and `/_app`, including the home page. The home page (`/`) lists the sections the person
can open (`src/model/nav.ts`), then other sites the team uses. `/rosters`, where the roster was while the portal had its
own, sends old links to `/roster`, and `/welcome`, where Authentik's "Go home" lands, sends them to `/`.

## Tasks

mise provides the tools. Run `mise trust`, then `mise run install`.

- `mise run ci`: `check`, then `test`
- `mise run check`: build, typecheck, Prettier check, ESLint
- `mise run dev`: serve the app locally, with made-up data from `src/mocks/` in place of Directus
- `mise run storybook`: serve Storybook, the catalog of every component
- `mise run format`: fix formatting and lint
- `mise run test`: run the tests with Vitest
- `mise run build`: build into `dist/`
- `mise run integration`: run the journeys in `features/` in a browser against dev. It isn't part of `ci`.

## Layout

- `src/routes/` holds TanStack Router's file routes. A file's path is its URL: `src/routes/plans/index.tsx` is `/plans`.
  The router plugin regenerates `src/routeTree.gen.ts` on every build and dev run. Commit it, and never edit it.
- `src/router.ts` makes the router. Tests make their own with a memory history.
- `src/components/ui/` holds shadcn's components on Base UI, `src/components/` the club's own, each with a story beside
  it. `src/components/plans/` holds the plans page's: Page Header, Summary Tiles, Money, P&L Table, Chart Card,
  Engine Warnings, and Version Badge. `src/components/home/` holds the home page's Link List. `src/styles/tokens.css` holds the design tokens. Read [docs/design.md](docs/design.md) before changing any of
  them, or use the [`design`](.agents/skills/design/SKILL.md) skill.
- `src/directus/` talks to Directus. `client.ts` makes a client that sends the browser's Directus session cookie, and
  `app.ts` is the app's own, at `directus.<the app's hostname>`. `sign-in.ts` sends a visitor with no session to
  Directus's sign-in, and stops instead of looping if they come straight back without one (`session.ts`).
  `access.ts` reads `/permissions/me` to decide what to show; Directus still checks every request.
- `src/directus/plans.ts` reads plans, their versions, and which version is active. A saved version shows the results
  platform worked out when it was saved (`plan_result_*`, cyc-seattle/platform#91), and the app never recalculates
  them. A draft is calculated in the browser by the planning engine this app bundles, from the same rows platform reads
  at save time (`src/model/plan-data.ts`): the catalog, the Operations Plan version, and each area's active version,
  with the draft in place of its own area's.
- `src/directus/club-plans.ts` reads club plans (`version_sets`): the whole club's plan for a year, frozen, with the
  results platform worked out when it was saved. A club plan's result rows have `version_set_id` set and no
  `version_id`, and each area's rows name the member that holds them (`version_set_member_id`). `/plans` shows each
  year's newest one, and `/plans/club/<set>` its P&L.
- `src/directus/roster.ts` reads the rosters: each program's current or most recent offering, its confirmed
  registrations, the sailors' parents, and their names, plus the email and phone Directus lets the person see. Directus's
  rules decide who appears, so the page filters only on ids, statuses, and dates, which platform's query guard allows,
  and joins the rest in the browser (`src/model/roster.ts`). The signed-in adult finds their own record by
  `directus_user_id = $CURRENT_USER` and changes their own `share_contact`.
- `src/mocks/` answers Directus's requests with made-up people and permissions, in `mise run dev` and in tests. Never
  put real club data there.
- `mise run integration` runs the journeys against dev, as your ADC login (deploy-dev in Actions), with
  `PULUMI_STACK=dev`. Each scenario's visitor is made up for it (`test/features/visitors.ts`): a Directus user on the
  Community role and, for a planner, a person in a group that gives Plan Reader, the way the club gives policies.
  They sign in through Authentik's emailed link, which dev's Authentik sends to Mailpit. A plans scenario also makes
  a made-up club (`test/features/club.ts`): an organization, its accounts, a program area and product, and an
  Operations Plan and an area's plan, with versions saved the way a Plan Writer saves them, so platform works out their
  results. A rosters scenario makes programs and families (`test/features/squad.ts`), with the Clubspot rows
  clubspot-sync would read them from, and waits for platform's hook to move a parent on a team to the Team role. Dev's `backend:savedVersionsDeletable` lets its admin delete them afterwards; prod refuses it. Everything is deleted when
  the scenario ends, and a later run deletes what an earlier one left. The steps refuse any environment but dev, and
  never touch prod's users.
- `features/` holds the journeys in Gherkin, with their steps in `test/features/`. Each is living documentation of how
  the app behaves for a club member, so write it in their words. A scenario tagged `@fixme` is agreed but not built
  yet: a features PR adds it, and the PR that builds it removes the tag.
- `test/` holds the unit tests, `*.test.ts` or `*.test.tsx`. `mise run test` also runs every story as a test in
  Chromium, with axe (docs/design.md).

Claude Code reads skills only from `.claude/skills`, so link them there once:
`mkdir -p .claude && ln -s ../.agents/skills .claude/skills`.

Playwright downloads a Chromium that runs on most Linux, macOS, and Windows machines. Where it can't, such as on NixOS,
point `PLAYWRIGHT_BROWSERS_PATH` at a matching set of browsers in a git-ignored `mise.local.toml`.

## Deploys

`stacks/app` is the app's one Pulumi project: a platform `WebService` that serves the image on the environment's
domain. The image is Caddy serving `dist/` (`Dockerfile`, `Caddyfile`), with a content security
policy that lets the page call only itself and Directus.

- Every PR deploys to dev, at `https://dev.cycsail.team/plans`, and runs `mise run integration` there. A push to `main`
  deploys dev, previews prod, and applies prod once a maintainer approves. Prod runs the image dev built for the same
  commit. All of it goes through the org's `deploy.yml` (`.github/workflows/pull-request.yml`). When the journeys fail, the run uploads
  `test-results/` as the `test-results-dev` artifact, kept 7 days: each failed scenario's page snapshot
  (`error-context.md`) and trace.
- `mise run preview` and `mise run deploy` act on `$PULUMI_STACK`, which defaults to `prod`. Locally, set
  `PULUMI_STACK=dev`, and preview before every apply. Local deploys are only for breaking glass.
- Directus already allows `https://<domain>` as an origin and a sign-in redirect, because the portal is there, so the
  app needs nothing from platform's Directus settings.

## Pull requests that change what people see

The maintainer reviews a UI change from screenshots in its PR description, not by checking out the branch. Every PR
that changes a page or component shows them there:

- The phone (390 px wide) and desktop views. Before and after, when it changes an existing page. Light and dark, when
  it changes colors.
- Made-up data only. This repo is public, so never a real name, email, or phone.
- Host them on the `screenshots` branch, which is never merged: commit them to `pr-<number>/` on it, push, and embed
  each with `https://raw.githubusercontent.com/cyc-seattle/sail-team/<commit>/pr-<number>/<name>.png`, using that
  commit's SHA so the link never changes. Never put them on the PR's own branch, or only in `.plans/`.
- Storybook or Playwright's `page.screenshot()` can take them.

## Code style

TypeScript with ESLint and Prettier from `@cyc-seattle/ts-config`. ESM: relative import paths carry the `.ts` or `.tsx`
extension. Imports through `@/`, which is `src/`, leave it off, as shadcn writes them. PR titles are conventional commits. Never push to `main`.

Write for a club staffer: page text in plain words a volunteer would say.

### Comments

Comments explain **why**, not what. Keep them to a line or two. Write one where a reader would otherwise get it wrong: a
non-obvious constraint, a surprising API behavior, or a decision that looks arbitrary but isn't.

- Don't narrate the code, restate the diff, or argue for the approach you chose.
- Cite an issue (`#107`) instead of recounting its discussion.
- Don't cite a local plan file. A `docs/` reference is fine.

The same applies to docs: record the outcome, not the path to it, and no personal identifiers.
