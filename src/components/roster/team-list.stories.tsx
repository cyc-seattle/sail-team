import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { doublehanded, singlehanded } from "./fixtures";
import { TeamList } from "./team-list";

const meta = {
  component: TeamList,
  args: { teams: [doublehanded, singlehanded] },
  decorators: [withRouter("/roster", ["/roster/$teamId"])],
} satisfies Meta<typeof TeamList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SeveralTeams: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: /Doublehanded/ })).toHaveAttribute("href", "/roster/doublehanded");
    await expect(canvas.getByText("J-Pod, K-Pod · 5 sailors")).toBeVisible();
  },
};

export const NoTeams: Story = { args: { teams: [] } };
