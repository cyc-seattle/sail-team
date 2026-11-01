import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";
import { Label } from "./label";

const meta = { component: Label, args: { children: "Program area" } } satisfies Meta<typeof Label>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithInput: Story = {
  render: (args) => (
    <div className="grid max-w-sm gap-2">
      <Label {...args} htmlFor="area" />
      <Input id="area" defaultValue="Youth racing" />
    </div>
  ),
};
