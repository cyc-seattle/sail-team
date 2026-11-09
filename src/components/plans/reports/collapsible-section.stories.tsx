import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { CollapsibleSection } from "./collapsible-section";

const meta = {
  component: CollapsibleSection,
  args: { title: "Assumptions", children: <p className="text-sm">Guppies: 10 sailors per coach.</p> },
} satisfies Meta<typeof CollapsibleSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/10 sailors per coach/)).not.toBeVisible();
  },
};

export const Open: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Assumptions", { selector: "h2" }));
    await expect(canvas.getByText(/10 sailors per coach/)).toBeVisible();
  },
};
