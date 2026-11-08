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
  args: { teams: [doublehanded], filters: {}, onFiltersChange: fn() },
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof Roster>;
export default meta;
type Story = StoryObj<typeof meta>;

// Kai is on both pods, and shows once with both. A parent who shares shows their email and phone.
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

// A search finds a sailor by a parent's name.
export const Search: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("searchbox", { name: "Find a sailor or parent" }), "jo tack");
    await waitFor(() => expect(canvas.queryByText("Ada Bowline")).toBeNull());
    await expect(canvas.getByText("Ola Tack")).toBeVisible();
    await expect(args.onFiltersChange).toHaveBeenLastCalledWith({ q: "jo tack" });
  },
};

export const BySchool: Story = {
  args: { filters: { school: "Lakeside Middle School" } },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.queryByText("Kai Halyard")).toBeNull();
    await expect(canvas.getByText("Mia Cleat")).toBeVisible();
    await userEvent.click(canvas.getByRole("combobox", { name: "School" }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(async () => expect(await body.findByRole("option", { name: "School not on file" })).toBeVisible());
  },
};

// With several teams, the division filter offers each team as a whole, and the roster shows each sailor's team.
export const SeveralTeams: Story = {
  args: { teams: [doublehanded, singlehanded] },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.getByText(/Doublehanded, Singlehanded/)).toBeVisible();
    await userEvent.click(canvas.getByRole("combobox", { name: "Division" }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("option", { name: "All of Singlehanded" }));
    await waitFor(() => expect(canvas.queryByText("Kai Halyard")).toBeNull());
    await expect(canvas.queryByText(/Doublehanded, Singlehanded/)).toBeNull();
  },
};

export const NoMatch: Story = {
  args: { filters: { q: "nobody" } },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText("No one on the roster matches.")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
    await expect(args.onFiltersChange).toHaveBeenLastCalledWith({});
  },
};

export const NoTeams: Story = { args: { teams: [] } };
