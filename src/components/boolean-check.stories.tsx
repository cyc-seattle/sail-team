import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { BooleanCheck } from "./boolean-check";

const meta = { component: BooleanCheck, args: { checked: true, label: "On the website" } } satisfies Meta<
  typeof BooleanCheck
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Checked: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("checkbox", { name: "On the website" })).toBeChecked();
  },
};

/** A cleared box, read out as not checked. */
export const Cleared: Story = {
  args: { checked: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("checkbox", { name: "On the website" })).not.toBeChecked();
  },
};
