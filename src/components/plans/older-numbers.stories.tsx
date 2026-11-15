import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { OlderNumbers } from "./older-numbers";

const meta = { component: OlderNumbers } satisfies Meta<typeof OlderNumbers>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Someone who can edit the plan, who can have its numbers worked out again. */
export const CanEdit: Story = { args: { onWorkOut: async () => {} } };

/** Someone who can only read the plan. */
export const ReadOnly: Story = { args: {} };

/** Working them out again failed. */
export const Failed: Story = {
  args: {
    onWorkOut: async () => {
      throw new Error("No");
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Work them out again" }));
    await expect(await canvas.findByText("That didn't work. Try again.")).toBeVisible();
  },
};
