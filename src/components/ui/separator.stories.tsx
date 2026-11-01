import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./separator";

const meta = { component: Separator } satisfies Meta<typeof Separator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="max-w-sm text-sm">
      <p>Revenue</p>
      <Separator className="my-2" />
      <p>Costs</p>
    </div>
  ),
};
