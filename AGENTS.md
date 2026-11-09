# AGENTS.md

Guidance for coding agents working in this repository.

Follow `cyc:conventions` (the rules shared by every cyc-seattle repo).

## Overview

`sail-team` is Sail Team, the web app at `cycsail.team`. It's a single-page React app, built by Vite into static files
and served by Caddy on the club's cluster. It has no server of its own. The browser talks to Directus
([cyc-seattle/platform](https://github.com/cyc-seattle/platform)) with the user's own session, and Directus decides what
each person can see and change. The app adds no security of its own.

The app serves all of `cycsail.team`, which isthmia's portal had until #1, and puts its built files under `/_app`
(`vite.config.ts`). The home page (`/`) lists the sections the person
can open (`src/model/nav.ts`), then other sites the team uses. `/rosters`, where the roster was while the portal had its
own, sends old links to `/roster`, and `/welcome`, where the portal's sign-in pages sent people, sends them to `/`.

## Tasks

mise provides the tools. Run `mise trust`, then `mise run install`.

- `mise run ci`: `check`, then `test`
- `mise run check`: build, typecheck, Prettier check, ESLint
- `mise run dev`: serve the app locally, with made-up data from `src/mocks/` in place of Directus
- `mise run storybook`: serve Storybook, the catalog of every component. Each push to `main` publishes it to
  [cyc-seattle.github.io/sail-team](https://cyc-seattle.github.io/sail-team/) (`.github/workflows/storybook.yml`).
- `mise run build-storybook`: build Storybook into `storybook-static/`
- `mise run format`: fix formatting and lint
- `mise run test`: run the tests with Vitest
- `mise run build`: build into `dist/`
- `mise run integration`: run the journeys in `features/` in a browser against dev. It isn't part of `ci`.

## Layout

- `src/routes/` holds TanStack Router's file routes. A file's path is its URL: `src/routes/plans/index.tsx` is `/plans`.
  The router plugin regenerates `src/routeTree.gen.ts` on every build and dev run. Commit it, and never edit it.
- `src/router.ts` makes the router. Tests make their own with a memory history.
- `src/components/ui/` holds shadcn's components on Base UI, `src/components/` the club's own, each with a story beside
  it. `src/components/plans/` holds the plans pages': Page Header, Summary Tiles, Money, P&L Table, Lines Table,
  Chart Card, Engine Warnings, Version Badge, the Financial Plan Card, List, View, Page, and Actions, the Plan Details
  Dialog, the Summary Table, the Programs and Operations (Non-program) Sections, and Compare View.
  `src/components/home/` holds the home page's Link List. `src/components/household/` holds the household page's
  Share Contact, Member Card, and Household View. `src/components/shell/` holds the App Shell around every
  signed-in page: the sidebar on a laptop, and the tab bar on a phone, whose More opens the sidebar.
  `src/styles/tokens.css` holds the design tokens. Read [docs/design.md](docs/design.md) before changing any of
  them, or use the [`design`](.agents/skills/design/SKILL.md) skill.
- `src/directus/` talks to Directus. `client.ts` makes a client that sends the browser's Directus session cookie, and
  `app.ts` is the app's own, at `directus.<the app's hostname>`. `sign-in.ts` sends a visitor with no session to
  Directus's sign-in, and stops instead of looping if they come straight back without one (`session.ts`).
  `access.ts` reads `/permissions/me` to decide what to show; Directus still checks every request.
- `src/directus/financial-plans.ts` reads Financial Plans (`version_sets`): the organization's plan for a year, holding
  a copy of the Operations Plan and of each Program Plan (`version_set_members`). A saved one shows the results
  platform worked out when it was saved (`plan_result_*`), and the app never recalculates them. Each result row names
  the member it's charged in (`version_set_member_id`), so one plan's full P&L, with its wages and its share of the
  shared costs, is one filter. A draft is calculated in the browser by the planning engine this app bundles
  (`src/directus/plans.ts`), from the same rows platform reads at save time (`src/model/plan-data.ts`): the catalog,
  and every plan the draft holds. Its lines and P&L rows are charged to members the way platform's hook does
  (`ownerOf` in `src/model/financial-plans.ts`). `/plans` lists each year's Financial Plans, `/plans/financial/<set>`
  shows one (where a Plan Writer renames a draft, changes a note, saves a draft, marks a saved one active, or starts a
  draft from it), `/plans/financial/<set>/<plan>` one plan in it, and `/plans/compare/<a>/<b>` two side by side. A club
  plan's old address, `/plans/club/<set>`, sends people to its Financial Plan.
- `src/directus/roster.ts` reads the team rosters. A team is a program area, such as Doublehanded, and its programs
  marked as a team, such as J-Pod and K-Pod, are its divisions; a program that isn't a team has no roster. It reads
  each division's current or most recent offering, its confirmed registrations, the sailors' guardians, their names
  and schools, the email and phone Directus lets the person see, and each division's Google Group. Directus's rules
  decide who appears, so the page filters only on ids, statuses, and dates, which platform's query guard allows, and
  joins the rest in the browser (`src/model/roster.ts`). `/roster` shows one team at a time, opening on the person's
  own: a table on a laptop and a card each on a phone, narrowed to one of its divisions or a school, with a search by
  sailor's or guardian's name that looks across every team. All of it is kept in the address. `/roster/<area id>`,
  where each team had its own page, sends people to `/roster?team=<area id>`. Only households on a team and Crew see
  them (`canSeeRosters`).
- `src/directus/household.ts` reads the signed-in person's household: the people Clubspot links through a shared
  sailor, which platform's sync groups (`people.household_id`). It finds their own record by
  `directus_user_id = $CURRENT_USER`, then their household with its `members`, since the query guard refuses a Team
  user's filter on `household_id`, and their guardian links, which make them a guardian or a sailor
  (`src/model/household.ts`). `/household` shows them, and an adult changes each person's display name, a sailor's
  school, their own phone and that of a child whose date of birth is on file, and the household's one
  `share_contact`, which decides whether its adults' email and phone show on the rosters. The app offers only the edits platform's
  Community rules allow, and Directus still checks them.
- `src/mocks/` answers Directus's requests with made-up people and permissions, in `mise run dev` and in tests. Never
  put real club data there.
- `mise run integration` runs the journeys against dev, as your ADC login (deploy-dev in Actions), with
  `PULUMI_STACK=dev`. Each scenario's visitor is made up for it (`test/features/visitors.ts`): a Directus user on the
  Community role and, for a planner, a person in a group that gives Plan Reader, the way the club gives policies.
  The sign-in journeys sign in through Authentik's emailed link, which dev's Authentik sends to Mailpit, one at a
  time. Every other journey gives its visitor a password and signs in to Directus directly, three scenarios at a
  time. A plans scenario also makes a made-up organization (`test/features/club.ts`): its accounts, a program area and
  product, an Operations Plan and an area's plan, and Financial Plans holding copies of them, saved the way a Plan
  Writer saves them, so platform works out their results. A rosters scenario makes a team, its divisions, and
  households (`test/features/squad.ts`), with the Clubspot rows
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

- PRs merge through the merge queue, which squashes them. A PR's push runs only CI. The queue deploys the PRs queued together to
  dev, at `https://dev.cycsail.team/plans`, as one batch, and runs `mise run integration` there. The batch merges only
  if they pass (the `dev-passed` check). A push to `main` skips dev, which the queue already ran on that commit, previews
  prod, and applies prod once a maintainer approves. Prod runs the image dev built for the same commit. All of it goes
  through the org's `deploy.yml` (`.github/workflows/pull-request.yml`). When the journeys fail, the run uploads
  `test-results/` as the `test-results-dev` artifact, kept 7 days: each failed scenario's page snapshot
  (`error-context.md`) and trace.
- The queue is batched, and dev is one shared environment, so the queue deploys and runs the journeys one batch at a
  time.
- Never force-push. To bring a branch up to date, merge `origin/main` into it. A queued branch can't be pushed until
  it's dequeued, so take the PR out of the queue first.
- `gh workflow run pull-request.yml --ref <branch>` deploys a branch to dev and runs the journeys before it's queued.
  Run it only when no other dev run is going (`gh run list --workflow pull-request.yml`). A commit that reached `main`
  without the queue, such as an admin's merge commit, has no image yet: `gh workflow run pull-request.yml --ref main`
  deploys it to dev, then prod.
- When a queue run fails, reproduce the failure locally against dev before you push a fix:
  `PULUMI_STACK=dev mise run integration`.
- `mise run preview` and `mise run deploy` act on `$PULUMI_STACK`, which defaults to `prod`. Locally, set
  `PULUMI_STACK=dev`, and preview before every apply. Local deploys are only for breaking glass.
- Prod's stack also holds the domain's A record (`apexRecord` in `stacks/app/cluster.ts`), adopted from isthmia's
  portal. Dev's domain is under platform's records.
- Directus already allows `https://<domain>` as an origin and a sign-in redirect, because the portal was there, so the
  app needs nothing from platform's Directus settings.

## Pull requests that change what people see

The maintainer reviews a UI change from screenshots in its PR description, not by checking out the branch. Every PR
that changes a page or component shows them there:

- Both review sizes from `cyc:conventions`, laptop and phone. Before and after, when it changes an existing page.
  Light and dark, when it changes colors.
- Host them on the `screenshots` branch, which is never merged: commit them to `pr-<number>/` on it, push, and embed
  each with `https://raw.githubusercontent.com/cyc-seattle/sail-team/<commit>/pr-<number>/<name>.png`, using that
  commit's SHA so the link never changes. Never put them on the PR's own branch, or only in `.plans/`.
- Storybook or Playwright's `page.screenshot()` can take them. Storybook's Laptop and Phone viewports use these sizes,
  the story tests run at both, and the journeys run at the laptop's (`playwright.config.ts`).

## Code style

TypeScript with ESLint and Prettier from `@cyc-seattle/ts-config`. ESM: relative import paths carry the `.ts` or `.tsx`
extension. Imports through `@/`, which is `src/`, leave it off, as shadcn writes them. PR titles are conventional commits. Never push to `main`.

### Comments

Comments explain **why**, not what. Keep them to a line or two. Write one where a reader would otherwise get it wrong: a
non-obvious constraint, a surprising API behavior, or a decision that looks arbitrary but isn't.

- Don't narrate the code, restate the diff, or argue for the approach you chose.
- Cite an issue instead of recounting its discussion.
- Don't cite a local plan file. A `docs/` reference is fine.

The same applies to docs: record the outcome, not the path to it.
