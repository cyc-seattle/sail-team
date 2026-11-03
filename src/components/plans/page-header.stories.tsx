import type { Meta, StoryObj } from "@storybook/react-vite";
import { withRouter } from "../../../.storybook/with-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./page-header";
import { VersionBadge } from "./version-badge";

const meta = {
  component: PageHeader,
  decorators: [withRouter("/plans/youth-racing", ["/plans"])],
  args: { title: "Youth Racing, 2027" },
} satisfies Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {};

export const Full: Story = {
  args: {
    back: { to: "/plans", label: "All plans" },
    description: (
      <span className="inline-flex items-center gap-2">
        <VersionBadge state="active" /> Saved on March 3 by a planner
      </span>
    ),
    actions: <Button variant="outline">Compare with the draft</Button>,
  },
};
