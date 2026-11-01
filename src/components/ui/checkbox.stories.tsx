import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = { component: Checkbox } satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Label>
      <Checkbox /> Show archived plans
    </Label>
  ),
  play: async ({ canvas, userEvent }) => {
    const box = canvas.getByRole("checkbox", { name: "Show archived plans" });
    await userEvent.click(box);
    await expect(box).toBeChecked();
  },
};

export const Disabled: Story = {
  render: () => (
    <Label>
      <Checkbox disabled /> Show archived plans
    </Label>
  ),
};
