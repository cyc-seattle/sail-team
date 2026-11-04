import type { Meta, StoryObj } from "@storybook/react-vite";
import { ownFamily, raceTeam } from "./fixtures";
import { RosterList } from "./roster-list";

const meta = {
  component: RosterList,
  args: { rosters: [ownFamily, raceTeam] },
} satisfies Meta<typeof RosterList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SeveralPrograms: Story = {};

export const NoRosters: Story = { args: { rosters: [] } };
