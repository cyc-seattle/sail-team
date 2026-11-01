import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";

const meta = { component: Badge, args: { children: "Saved" } } satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Active</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="outline">Saved</Badge>
      <Badge variant="destructive">Over budget</Badge>
    </div>
  ),
};
