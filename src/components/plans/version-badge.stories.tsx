import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlanStatus, VersionBadge } from "./version-badge";

const meta = { component: VersionBadge, args: { state: "draft" } } satisfies Meta<typeof VersionBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const States: Story = {
  render: () => (
    <div className="grid gap-2">
      <PlanStatus state="draft" inForce={null} />
      <PlanStatus state="saved" inForce={{ when: "now", from: "2026-07-01", to: null }} />
      <PlanStatus state="draft" inForce={{ when: "now", from: "2026-07-01", to: "2026-08-31" }} />
      <PlanStatus state="draft" inForce={{ when: "later", from: "2026-09-01", to: null }} />
      <PlanStatus state="saved" inForce={{ when: "past", from: "2026-03-01", to: "2026-06-30" }} />
    </div>
  ),
};
