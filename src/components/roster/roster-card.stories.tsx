import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { raceTeam, ownFamily } from "./fixtures";
import { RosterCard } from "./roster-card";

const meta = {
  component: RosterCard,
  args: { roster: raceTeam },
} satisfies Meta<typeof RosterCard>;
export default meta;
type Story = StoryObj<typeof meta>;

// A parent who shares shows their email and phone. One who doesn't is named as the sailor's parent, and nothing more.
export const Team: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Youth Race Team" })).toBeVisible();
    await expect(canvas.getByText("3 sailors", { exact: false })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "pat.bowline@example.org" })).toHaveAttribute(
      "href",
      "mailto:pat.bowline@example.org",
    );
    await expect(canvas.getByText("Sam Bowline")).toBeVisible();
    await expect(canvas.getAllByRole("link")).toHaveLength(4);
  },
};

export const OwnFamilyOnly: Story = { args: { roster: ownFamily } };
