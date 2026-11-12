# Design

How sail-team looks, and the rules that keep every page reading the same. Storybook (`mise run storybook`) shows every
component, in light and dark. Agents follow the same rules through `.agents/skills/design/SKILL.md`.

## Tokens

`src/styles/tokens.css` holds every color, radius, and spacing token, for light and dark. `src/styles/index.css` maps
them to Tailwind utilities, such as `bg-card`, `text-muted-foreground`, and `text-money-negative`. Use the utilities.
Never write a hex value or a raw Tailwind color like `text-red-600` in a component.

- **Neutrals** do nearly everything. The page is a faint cool gray, and cards are white, so they stand off it without
  heavy borders. The primary button is near-black: buttons stay neutral.
- **Status**: `success`, `warning`, `info`, and `destructive` share one lightness and chroma, so none shouts louder than
  another.
- **Money**: `money-positive`, `money-negative`, and `money-zero` color only an amount, never its row's label.
- **Brand**: the club's navy (`brand`) for the sidebar and the phone's tab bar, with white text, and its red
  (`brand-accent`) only as decoration, such as the stripe under the sidebar's name: the red is too light for text on
  white. Links use `text-link`, navy in light and a lighter navy in dark.
- **Charts**: `chart-1` to `chart-6` stay distinct with the common kinds of color blindness. Every chart sits beside the
  table it summarizes.
- **Programs**: each program's color comes from the catalog, through `programColor` in `@cyc-seattle/platform`: the
  one a Catalog Writer set, or one of its palette's twelve, picked by the program, so it's the same in every app. Words
  on it use `program-foreground`, white, which the palette keeps at 4.5:1. A program's name always sits beside its
  color.
- **Space**: `p-card` (16px) inside a card, `p-card-sm` (12px) inside a small nested one. `min-h-tap` (44px) for
  anything a phone user taps.

`test/tokens.test.ts` checks that text colors reach 4.5:1 contrast on the surfaces they sit on, in both themes. A token
change that fails it needs a different value, not a skipped test.

## Type

One face, Inter, self-hosted, for everything. A short scale: page titles `text-2xl font-semibold tracking-tight`, card
titles `text-base font-medium`, body and tables `text-sm`, hints `text-xs text-muted-foreground`. Weight and color do
the work, not more sizes.

Numbers that line up in a column use `tabular-nums` and sit right-aligned. Show money with `Money`, which takes cents
and writes a true minus sign, and color only a net (`colored`).

## Dark mode

The app follows the device. The user menu offers Light, Dark, and Same as this device, saved in the browser.
`public/_app/theme.js` applies the choice before the first paint, and `useTheme` (`src/hooks/use-theme.ts`) changes it.
Every token has a dark value, so a component that uses the utilities needs no `dark:` classes of its own.

## Layout rules

- Every page someone can open is in the sidebar, always open beside the page on a laptop. On a phone, the first four
  are tabs along the bottom, and More opens the same sidebar as a sheet. The account menu sits at the sidebar's foot.
- Actions go on the right, where a thumb reaches them on a phone.
- An inline "Add {thing}" row goes at the top of a list, never below it.
- One way to save: explicit Save and Discard, with a warning before leaving unsaved changes.
- Numbers are right-aligned in tabular figures, with totals in the table footer.
- Underline tabs (`TabsList variant="line"`) for named sections. A pill toggle (`ToggleGroup`) only for a two-way view
  switch, such as per year or per day.
- An icon-only button has an `aria-label` and a tooltip with the same name, and each action keeps one icon everywhere.
- Page text uses plain words a club volunteer would say.
- A page has a title and no subtitle. Don't add a sentence under the title describing the page.
- Every chart sits in a `ChartCard`, above the table of the same numbers, with how it's worked out behind the info
  button.

## Components

`src/components/ui/` holds shadcn's components on Base UI, adapted here. Add another with
`pnpm dlx shadcn@latest add <name>`, then give it a story. Change a component in place rather than wrapping it.
`src/components/` holds the club's own patterns, built from them.

Ask before adding a new variant or a new component that overlaps one that exists.

## Stories are tests

Each component has a `*.stories.tsx` beside it. `mise run test` renders every story in Chromium twice, light at a
laptop's size and dark at a phone's, and runs axe on each. An accessibility violation fails CI. A story with a `play`
function also checks what it does: an overlay story opens the overlay, so axe checks it open.
