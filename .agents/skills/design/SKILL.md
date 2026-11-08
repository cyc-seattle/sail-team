---
name: design
description: Build or change a page or component in sail-team so it looks like the rest of the app and passes its accessibility checks. Use when adding a route, a component, a story, or a color, or when reviewing a PR that does.
---

# Designing in sail-team

Read [docs/design.md](../../../docs/design.md) first. It's the source for every rule here. Then look at the stories
beside the components you'll use (`src/components/**/*.stories.tsx`), and copy how they're put together.

## Before you write a component

- Search `src/components/` for one that already does the job. Change it rather than adding a near-copy.
- Ask before adding a new variant or a new component. Say what the existing ones can't do.

## While you write it

- Colors and spacing only from the token utilities: `bg-card`, `text-muted-foreground`, `text-money-negative`, `p-card`,
  `min-h-tap`. No hex values, no raw Tailwind colors, no `dark:` classes.
- Inter for everything. Sizes from the scale in docs/design.md.
- Actions on the right. "Add" rows at the top of a list. Explicit Save and Discard.
- Numbers `tabular-nums` and right-aligned. Totals in the table footer.
- Every icon-only button gets an `aria-label` and a tooltip with the same words.
- Every input gets a `Label`. An error message is tied to its input with `aria-describedby`.
- Page text in plain words a club volunteer would say.

## Before you finish

- Give the component a story beside it, using made-up sailing data. Show its states (empty, error, disabled). If it
  opens something, add a `play` function that opens it.
- Run `mise run ci`. Every story renders light at a laptop's size and dark at a phone's, with axe. Fix a violation in
  the component or its tokens. Never turn the check off.
