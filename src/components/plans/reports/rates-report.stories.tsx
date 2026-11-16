import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { reportAssumptions, storageCosts } from "./fixtures";
import { RatesReport } from "./rates-report";

const meta = {
  component: RatesReport,
  args: { assumptions: reportAssumptions, storage: storageCosts },
} satisfies Meta<typeof RatesReport>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The rates, then what storage costs. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Storage" })).toBeVisible();
    await expect(canvas.queryByRole("list", { name: "Notes" })).toBeNull();
  },
};
