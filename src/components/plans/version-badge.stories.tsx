import type { Meta, StoryObj } from "@storybook/react-vite";
import { VersionBadge } from "./version-badge";

const meta = { component: VersionBadge, args: { state: "draft" } } satisfies Meta<typeof VersionBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const States: Story = {
  render: () => (
    <div className="flex gap-2">
      <VersionBadge state="draft" />
      <VersionBadge state="saved" />
      <VersionBadge state="active" />
    </div>
  ),
};
