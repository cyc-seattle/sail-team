---
name: ux-review
description: Review a sail-team change that affects what people see against the style guide, and report what to change, such as a shared component to use, a word to use instead, a note that should be a description, or an edit that only Directus can make. Use on every UI change before asking for review, or when asked to review a PR, branch, or diff for UX.
---

# UX review

Check a change against the
[style guide](https://cyc-seattle.github.io/sail-team/?path=/docs/style-guide-introduction--docs) and report what to
change. The guide holds the rules; this skill is only how to apply them. Review only: change nothing unless asked to fix
the findings.

## 1. Get the change

The target is a PR number, a branch, or nothing, which means the current branch.

- PR: `gh pr diff <number> -R cyc-seattle/sail-team`, and `gh pr view <number> -R cyc-seattle/sail-team` for its
  description and screenshots.
- Branch, or the current one: `git fetch origin main`, then `git diff origin/main...<branch>`.

The change affects what people see if it touches `src/routes/`, `src/components/`, `src/styles/`, strings a person
reads anywhere in `src/` (such as `src/model/`), or `features/*.feature`. If it touches none of them, report "No UX
changes" and stop.

## 2. Read the rules

Read the guide's pages from the source, `src/guide/*.mdx`, on the branch under review, since the published guide follows
`main`. If the change edits the guide itself, review the rest of the change against the edited guide. Also read the
[`ui-copy`](https://github.com/cyc-seattle/agent-skills/blob/main/skills/ui-copy/SKILL.md) skill, which the Words page
builds on.

## 3. Check the change

Read every changed file whole, not only the diff's lines, so you see what the page already has. Then go through these,
each against its page of the guide:

1. **Shared components.** Anything built by hand that a component in the guide's table, or elsewhere in
   `src/components/`, already does: a table of accounts, an amount, a note, an offering's name, a collapsible section,
   a page header, a switch. A near-copy of an existing component, or a new variant nobody asked for. Name the component
   to use and its path.
2. **Words.** Every string a person reads, including ones built in code, read with real values filled in. A word the
   Words page says not to use. A wordy or invented label, a subtitle, filler, or a parenthetical. The same thing named
   two ways: search `src/` for what each new label's thing is called elsewhere, and flag the mismatch even when the
   other name is older. Any `ui-copy` rule broken, by its number.
3. **Notes and descriptions.** A note field without a 280-character limit, a note shown as a table column instead of
   behind `NoteInfo`, a note rendering block Markdown, or long text in a note that should be a description.
4. **Editing in the app.** A field people are expected to change with no screen in the app, for a role that should
   change it. A link, button, or message that sends someone to Directus's Data Studio, other than Staff's Directus item.
   A control shown to someone whose permissions don't allow it.
5. **Layout, color, and type.** The Layout and Color and type pages: actions on the right, default sorts, account
   numbers in their own left column, headers that wrap, mixed units, things hidden behind toggles, raw colors, sizes
   off the scale. A boolean shown as text (Yes, No, On, Off, True, False, or a blank for no) instead of a read-only
   `BooleanCheck` (`src/components/boolean-check.tsx`): search the change for `? "Yes"`, `"On"`, and the like.
6. **Screenshots.** For a PR, its description shows laptop and phone, before and after for an existing page, and light
   and dark when colors change (AGENTS.md).

Don't report what CI already checks, such as lint, types, or axe, or what the guide doesn't say. A judgment the guide
doesn't settle goes under Consider, not Fix.

## 4. Report

One list, most important first. For each finding:

```text
- [Fix|Consider] path/to/file.tsx:42 (Guide page): what's wrong. Suggested: what to do instead.
```

- **Fix** breaks a rule in the guide. **Consider** is a suggestion the guide doesn't require.
- Quote the exact words you'd change, and give the replacement: `"In force since" → "Active"`.
- For a component, name it and its path: `use NoteInfo (src/components/plans/note-info.tsx)`.
- Group findings that are the same problem in many places into one, with every place listed.

End with one line: how many Fix and Consider findings, or "No findings". If the change settles a new word or rule the
guide doesn't have yet, say so, so it's added to the guide in the same PR.

## Running it as a subagent

The skill needs nothing from the conversation that started it. To run it in the background, give a subagent the target
and this file: "Review PR 123 in cyc-seattle/sail-team with the ux-review skill
(`.agents/skills/ux-review/SKILL.md`), and return its report." Relay the report as it comes back.
