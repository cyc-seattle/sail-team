import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoldIcon } from "lucide-react";
import { Toggle } from "./toggle";

const meta = { component: Toggle } satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Toggle aria-label="Bold">
      <BoldIcon />
    </Toggle>
  ),
};
