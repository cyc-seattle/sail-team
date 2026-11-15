---
name: design
description: Build or change a page or component in sail-team so it looks like the rest of the app and passes its accessibility checks. Use when adding a route, a component, a story, or a color.
---

# Designing in sail-team

Read the [style guide](https://cyc-seattle.github.io/sail-team/?path=/docs/style-guide-introduction--docs) first. It's
the source for every rule here. Its pages are MDX in `src/guide/`, so read them there when the published one may be
behind `main`. Then look at the stories beside the components you'll use (`src/components/**/*.stories.tsx`), and copy
how they're put together.

## Before you write a component

- Check the guide's Shared components for one that already does the job. Change it rather than adding a near-copy.
- Ask before adding a new variant or a new component. Say what the existing ones can't do.
- Anything a person is expected to change needs a screen in the app (Editing in the app).

## While you write it

- Colors and spacing only from the token utilities: `bg-card`, `text-muted-foreground`, `text-money-negative`, `p-card`,
  `min-h-tap`. No hex values, no raw Tailwind colors, no `dark:` classes.
- Inter for everything. Sizes from the scale in Color and type.
- Every icon-only button gets an `aria-label` and a tooltip with the same words.
- Every input gets a `Label`. An error message is tied to its input with `aria-describedby`.
- Words from the guide's Words page and the `ui-copy` skill. Search `src/` for what a thing is already called.

## Before you finish

- Give the component a story beside it, using made-up sailing data. Show its states (empty, error, disabled). If it
  opens something, add a `play` function that opens it.
- Run `mise run ci`. Every story renders light at a laptop's size and dark at a phone's, with axe. Fix a violation in
  the component or its tokens. Never turn the check off.
- Run the [`ux-review`](../ux-review/SKILL.md) skill on the change.
- When a change settles a new rule or a new word, add it to the guide in the same PR.
