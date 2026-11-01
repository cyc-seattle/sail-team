import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { expect, fn } from "storybook/test";
import { Button } from "./button";

const meta = {
  component: Button,
  args: { children: "Save", onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <Button {...args}>Save</Button>
      <Button {...args} variant="secondary">
        Discard
      </Button>
      <Button {...args} variant="outline">
        <PlusIcon /> Add a boat
      </Button>
      <Button {...args} variant="ghost">
        Cancel
      </Button>
      <Button {...args} variant="destructive">
        Delete
      </Button>
      <Button {...args} variant="link">
        See the plan
      </Button>
      <Button {...args} variant="ghost" size="icon" aria-label="Delete">
        <Trash2Icon />
      </Button>
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true } };
