import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress, ProgressLabel, ProgressValue } from "./progress";

const meta = { component: Progress, args: { value: 60 } } satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Progress {...args} className="max-w-sm">
      <ProgressLabel>Spots filled</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
};
