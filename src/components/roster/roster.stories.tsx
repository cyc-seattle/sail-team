import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import type { RosterFilters } from "@/model/roster";
import { doublehanded, singlehanded } from "./fixtures";
import { Roster, type RosterProps } from "./roster";

// The filters live in the page's address, so the stories hold them the same way the page does.
function Stateful(props: RosterProps) {
  const [filters, setFilters] = useState<RosterFilters>(props.filters);
  return (
    <Roster
      {...props}
      filters={filters}
      onFiltersChange={(next) => {
        setFilters(next);
        props.onFiltersChange(next);
      }}
    />
  );
}

const meta = {
  component: Roster,
  args: { teams: [doublehanded], filters: { team: "doublehanded" }, onFiltersChange: fn() },
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof Roster>;
export default meta;
type Story = StoryObj<typeof meta>;

// Kai is on both of the team's pods, and shows once with both. A guardian who shares shows their email and phone.
export const OneTeam: Story = {
  play: async ({ canvas }) => {
    const kai = await canvas.findAllByText("Kai Halyard");
    await expect(kai).toHaveLength(1);
    await expect(canvas.getByText(/J-Pod, K-Pod/)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "pat.bowline@example.org" })).toHaveAttribute(
      "href",
      "mailto:pat.bowline@example.org",
    );
    await expect(canvas.getByRole("link", { name: "j-pod@example.org" })).toHaveAttribute(
      "href",
      "https://groups.google.com/a/example.org/g/j-pod",
    );
  },
};

// Mia has three guardians, each with whatever they share.
export const SeveralGuardians: Story = {
  args: { filters: { team: "doublehanded", q: "mia" } },
  play: async ({ canvas }) => {
    for (const name of ["Alex Cleat", "Jordan Cleat", "Sam Rivera"]) {
      await expect(canvas.getByText(name)).toBeVisible();
    }
    await expect(canvas.getByRole("link", { name: "sam.rivera@example.org" })).toBeVisible();
    await expect(canvas.getByText("Hasn't shared their email and phone.")).toBeVisible();
  },
};

// A search finds a sailor by a guardian's name.
export const Search: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("searchbox", { name: "Find a sailor or guardian" }), "jo tack");
    await waitFor(() => expect(canvas.queryByText("Ada Bowline")).toBeNull());
    await expect(canvas.getByText("Ola Tack")).toBeVisible();
    await expect(args.onFiltersChange).toHaveBeenLastCalledWith({ team: "doublehanded", q: "jo tack" });
  },
};

export const BySchool: Story = {
  args: { filters: { team: "doublehanded", school: "Lakeside Middle School" } },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.queryByText("Kai Halyard")).toBeNull();
    await expect(canvas.getByText("Mia Cleat")).toBeVisible();
    await userEvent.click(canvas.getByRole("combobox", { name: "School" }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(async () => expect(await body.findByRole("option", { name: "School not on file" })).toBeVisible());
  },
};

// One team at a time: picking a division under another team shows just it.
export const SeveralTeams: Story = {
  args: { teams: [doublehanded, singlehanded], filters: { team: "singlehanded" } },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await expect(canvas.getByText("Ada Bowline")).toBeVisible();
    await expect(canvas.queryByText("Kai Halyard")).toBeNull();
    await userEvent.click(canvas.getByRole("combobox", { name: "Team and division" }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("option", { name: "J-Pod" }));
    await waitFor(() => expect(canvas.getByText("Kai Halyard")).toBeVisible());
    await expect(canvas.queryByText("Mia Cleat")).toBeNull();
    await expect(args.onFiltersChange).toHaveBeenLastCalledWith({ team: "doublehanded", division: "j-pod" });
  },
};

// A search looks across every team, and says which team each match is on. Ada is on both.
export const SearchEveryTeam: Story = {
  args: { teams: [doublehanded, singlehanded], filters: { team: "singlehanded", q: "ada" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Showing matches on every team.")).toBeVisible();
    await expect(canvas.getAllByText("Ada Bowline")).toHaveLength(2);
    // The team is its own column on a laptop, and leads the line under the name on a phone.
    const roster = within(
      canvas.queryByRole("table", { name: "Roster" }) ?? canvas.getByRole("list", { name: "Roster" }),
    );
    for (const team of ["Doublehanded", "Singlehanded"]) {
      await expect(roster.getByText(new RegExp(`^${team}( ·|$)`))).toBeVisible();
    }
  },
};

export const NoMatch: Story = {
  args: { filters: { team: "doublehanded", q: "nobody" } },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText("No one on the roster matches.")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
    await expect(args.onFiltersChange).toHaveBeenLastCalledWith({ team: "doublehanded" });
  },
};

export const NoTeams: Story = { args: { teams: [] } };
