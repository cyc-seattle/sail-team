import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { lines } from "./fixtures";
import { LinesTable } from "./lines-table";

const meta = { component: LinesTable, args: { lines } } satisfies Meta<typeof LinesTable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WagesAndShares: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Office share: Office rent")).toBeVisible();
    await expect(canvas.getByText("Net")).toBeVisible();
  },
};
